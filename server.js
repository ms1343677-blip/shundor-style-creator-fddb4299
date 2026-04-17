// ==========================================================
//  TopUpYYY — Express + PostgreSQL backend (self-hosted)
//  Run: node server.js   (after `npm install` and `npm run build`)
//  Default port: 3000 (override with PORT env var)
// ==========================================================
const express      = require("express");
const path         = require("path");
const fs           = require("fs");
const cors         = require("cors");
const cookieParser = require("cookie-parser");
const session      = require("express-session");
const { Pool }     = require("pg");
const jwt          = require("jsonwebtoken");
const bcrypt       = require("bcryptjs");
const crypto       = require("crypto");
const passport     = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const app  = express();
const PORT = process.env.PORT || 3000;
const CONFIG_PATH = path.join(__dirname, "config.json");

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || "topupyyy-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 10 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());

// ─── Config helpers ──────────────────────────────────────
function getConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")); } catch { return null; }
}
function saveConfig(cfg) { fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2)); }
function getJwtSecret()  { return getConfig()?.jwt_secret || "topupyyy-secret-key-change-me"; }

// ─── PostgreSQL pool ─────────────────────────────────────
let pool = null;
function getPool() {
  const cfg = getConfig();
  if (!cfg) return null;
  if (!pool) {
    pool = new Pool({
      host:     cfg.db_host,
      port:     cfg.db_port || 5432,
      user:     cfg.db_user,
      password: cfg.db_password,
      database: cfg.db_name,
      max: 10,
    });
  }
  return pool;
}

// Lightweight db.query wrapper -> mimics MySQL: returns [rows]
async function q(sql, params = []) {
  const result = await getPool().query(sql, params);
  return [result.rows];
}

// ─── Site URL helper (for OAuth callback) ────────────────
function getSiteUrl(req) {
  const cfg = getConfig();
  if (cfg?.site_url) return cfg.site_url.replace(/\/$/, "");
  return `${req.protocol}://${req.get("host")}`;
}

// ─── Auth middleware ─────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try { req.user = jwt.verify(token, getJwtSecret()); next(); }
  catch { return res.status(401).json({ error: "Invalid token" }); }
}
function adminMiddleware(req, res, next) {
  if (!req.user?.is_admin) return res.status(403).json({ error: "Forbidden" });
  next();
}
function requireInstall(req, res, next) {
  if (!getConfig()) return res.status(503).json({ error: "Not installed", needsInstall: true });
  next();
}

// ─── Issue JWT ───────────────────────────────────────────
function issueToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, is_admin: user.is_admin, full_name: user.full_name, avatar_url: user.avatar_url },
    getJwtSecret(),
    { expiresIn: "30d" }
  );
}

// ═══════════════════════════════════════════════════════════
//  INSTALL
// ═══════════════════════════════════════════════════════════
app.get("/api/install/status", (req, res) => {
  res.json({ installed: !!getConfig() });
});

app.post("/api/install", async (req, res) => {
  try {
    const { db_host, db_port, db_user, db_password, db_name, site_url, admin_email, admin_password } = req.body;
    if (!db_host || !db_user || !db_name || !admin_email || !admin_password) {
      return res.status(400).json({ error: "সকল ফিল্ড পূরণ করুন" });
    }

    // Test connection
    const testPool = new Pool({ host: db_host, port: db_port || 5432, user: db_user, password: db_password, database: db_name, max: 1 });
    const client = await testPool.connect();

    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, "database.sql"), "utf8");
    try { await client.query(schema); } catch (e) { console.error("Schema error:", e.message); }

    // Create admin user
    const hashed = await bcrypt.hash(admin_password, 10);
    const adminRes = await client.query(
      `INSERT INTO users (email, password, full_name, is_admin)
       VALUES ($1, $2, 'Admin', TRUE)
       ON CONFLICT (email) DO UPDATE SET is_admin = TRUE, password = EXCLUDED.password
       RETURNING id`,
      [admin_email, hashed]
    );
    const adminId = adminRes.rows[0].id;
    await client.query(`INSERT INTO wallets (user_id, balance) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING`, [adminId]);
    await client.query(
      `INSERT INTO profiles (user_id, full_name, email) VALUES ($1, 'Admin', $2)
       ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email`,
      [adminId, admin_email]
    );

    client.release();
    await testPool.end();

    const jwtSecret = crypto.randomBytes(32).toString("hex");
    saveConfig({ db_host, db_port: db_port || 5432, db_user, db_password, db_name, site_url: site_url || "", jwt_secret: jwtSecret });
    pool = null;

    res.json({ success: true, message: "ইনস্টলেশন সফল!" });
  } catch (err) {
    console.error("Install error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/install/download-db", (req, res) => {
  const sqlPath = path.join(__dirname, "database.sql");
  if (!fs.existsSync(sqlPath)) return res.status(404).json({ error: "database.sql not found" });
  res.download(sqlPath, "database.sql");
});

// ═══════════════════════════════════════════════════════════
//  AUTH (email/password)
// ═══════════════════════════════════════════════════════════
app.post("/api/auth/register", requireInstall, async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email ও Password দিন" });

    const [existing] = await q("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.length > 0) return res.status(400).json({ error: "এই ইমেইল দিয়ে আগেই একাউন্ট আছে" });

    const hashed = await bcrypt.hash(password, 10);
    const name = full_name || email.split("@")[0];
    const [inserted] = await q(
      "INSERT INTO users (email, password, full_name) VALUES ($1, $2, $3) RETURNING id",
      [email, hashed, name]
    );
    const userId = inserted[0].id;
    await q("INSERT INTO wallets (user_id, balance) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING", [userId]);
    await q("INSERT INTO profiles (user_id, full_name, email) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO NOTHING", [userId, name, email]);

    res.json({ success: true, message: "একাউন্ট তৈরি হয়েছে!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/auth/login", requireInstall, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email ও Password দিন" });

    const [users] = await q("SELECT * FROM users WHERE email = $1", [email]);
    if (users.length === 0) return res.status(401).json({ error: "ইমেইল বা পাসওয়ার্ড ভুল" });

    const user = users[0];
    if (!user.password) return res.status(401).json({ error: "এই account Google দিয়ে তৈরি — Google দিয়ে login করুন" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "ইমেইল বা পাসওয়ার্ড ভুল" });

    const token = issueToken(user);
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, is_admin: user.is_admin, avatar_url: user.avatar_url } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/auth/me", requireInstall, authMiddleware, async (req, res) => {
  try {
    const [users] = await q("SELECT id, email, full_name, is_admin, avatar_url, created_at FROM users WHERE id = $1", [req.user.id]);
    if (users.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ user: users[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
//  GOOGLE OAUTH
// ═══════════════════════════════════════════════════════════
async function getGoogleCreds() {
  if (!getConfig()) return null;
  const [rows] = await q("SELECT key_name, value FROM site_settings WHERE key_name IN ('google_client_id','google_client_secret')");
  const map = {};
  rows.forEach(r => { map[r.key_name] = r.value; });
  if (!map.google_client_id || !map.google_client_secret) return null;
  return { clientID: map.google_client_id, clientSecret: map.google_client_secret };
}

passport.serializeUser((u, done) => done(null, u));
passport.deserializeUser((u, done) => done(null, u));

app.get("/api/auth/google", requireInstall, async (req, res, next) => {
  const creds = await getGoogleCreds();
  if (!creds) return res.status(503).send("Google OAuth not configured. Admin → Settings এ Google Client ID/Secret দিন।");

  const callbackURL = `${getSiteUrl(req)}/api/auth/google/callback`;
  const strategy = new GoogleStrategy({
    clientID: creds.clientID,
    clientSecret: creds.clientSecret,
    callbackURL,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const fullName = profile.displayName || (email ? email.split("@")[0] : "User");
      const avatar = profile.photos?.[0]?.value || null;
      if (!email) return done(new Error("No email from Google"));

      // Find or create user
      let [rows] = await q("SELECT * FROM users WHERE google_id = $1 OR email = $2", [profile.id, email]);
      let user;
      if (rows.length > 0) {
        user = rows[0];
        await q("UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2), full_name = COALESCE(full_name, $3) WHERE id = $4",
          [profile.id, avatar, fullName, user.id]);
      } else {
        const [ins] = await q("INSERT INTO users (email, google_id, full_name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *",
          [email, profile.id, fullName, avatar]);
        user = ins[0];
        await q("INSERT INTO wallets (user_id, balance) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING", [user.id]);
        await q("INSERT INTO profiles (user_id, full_name, email) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO NOTHING", [user.id, fullName, email]);
      }
      done(null, user);
    } catch (e) { done(e); }
  });

  passport.authenticate(strategy, { scope: ["profile", "email"] })(req, res, next);
});

app.get("/api/auth/google/callback", requireInstall, async (req, res, next) => {
  const creds = await getGoogleCreds();
  if (!creds) return res.redirect("/login?error=oauth_not_configured");

  const callbackURL = `${getSiteUrl(req)}/api/auth/google/callback`;
  const strategy = new GoogleStrategy({
    clientID: creds.clientID, clientSecret: creds.clientSecret, callbackURL,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const fullName = profile.displayName || (email ? email.split("@")[0] : "User");
      const avatar = profile.photos?.[0]?.value || null;
      if (!email) return done(new Error("No email"));
      let [rows] = await q("SELECT * FROM users WHERE google_id = $1 OR email = $2", [profile.id, email]);
      let user;
      if (rows.length > 0) {
        user = rows[0];
        await q("UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3", [profile.id, avatar, user.id]);
      } else {
        const [ins] = await q("INSERT INTO users (email, google_id, full_name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *",
          [email, profile.id, fullName, avatar]);
        user = ins[0];
        await q("INSERT INTO wallets (user_id, balance) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING", [user.id]);
        await q("INSERT INTO profiles (user_id, full_name, email) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO NOTHING", [user.id, fullName, email]);
      }
      done(null, user);
    } catch (e) { done(e); }
  });

  passport.authenticate(strategy, { failureRedirect: "/login?error=google_failed" }, (err, user) => {
    if (err || !user) return res.redirect("/login?error=google_failed");
    const token = issueToken(user);
    const safeUser = encodeURIComponent(JSON.stringify({
      id: user.id, email: user.email, full_name: user.full_name, is_admin: user.is_admin, avatar_url: user.avatar_url
    }));
    // Redirect with token in URL hash so frontend can store it
    res.redirect(`/login?token=${token}&user=${safeUser}`);
  })(req, res, next);
});

// ═══════════════════════════════════════════════════════════
//  PUBLIC DATA
// ═══════════════════════════════════════════════════════════
app.get("/api/settings", requireInstall, async (req, res) => {
  try {
    const [rows] = await q("SELECT key_name, value FROM site_settings");
    const map = {}; rows.forEach(r => { map[r.key_name] = r.value; });
    res.json(map);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get("/api/categories", requireInstall, async (req, res) => {
  try { const [rows] = await q("SELECT * FROM categories WHERE is_active = TRUE ORDER BY sort_order"); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.get("/api/products", requireInstall, async (req, res) => {
  try { const [rows] = await q("SELECT * FROM products WHERE is_active = TRUE ORDER BY sort_order"); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.get("/api/products/:id", requireInstall, async (req, res) => {
  try { const [rows] = await q("SELECT * FROM products WHERE id = $1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Product not found" });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get("/api/packages", requireInstall, async (req, res) => {
  try {
    const productId = req.query.product_id;
    let sql = "SELECT * FROM packages WHERE is_active = TRUE";
    const params = [];
    if (productId) { params.push(productId); sql += ` AND product_id = $${params.length}`; }
    sql += " ORDER BY sort_order";
    const [rows] = await q(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get("/api/banners", requireInstall, async (req, res) => {
  try { const [rows] = await q("SELECT * FROM banners WHERE is_active = TRUE ORDER BY sort_order"); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.get("/api/latest-orders", requireInstall, async (req, res) => {
  try {
    const [rows] = await q(`
      SELECT o.*, p.name AS product_name, pk.name AS package_name, pr.full_name, pr.email AS profile_email
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN packages pk ON o.package_id = pk.id
      LEFT JOIN profiles pr ON o.user_id = pr.user_id
      ORDER BY o.created_at DESC LIMIT 10
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
//  USER ROUTES
// ═══════════════════════════════════════════════════════════
app.get("/api/wallet", requireInstall, authMiddleware, async (req, res) => {
  try {
    await q("INSERT INTO wallets (user_id, balance) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING", [req.user.id]);
    const [rows] = await q("SELECT * FROM wallets WHERE user_id = $1", [req.user.id]);
    res.json(rows[0] || { balance: 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get("/api/orders", requireInstall, authMiddleware, async (req, res) => {
  try {
    const [rows] = await q(`
      SELECT o.*, p.name AS product_name, p.image_url AS product_image, pk.name AS package_name
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN packages pk ON o.package_id = pk.id
      WHERE o.user_id = $1 ORDER BY o.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get("/api/orders/count", requireInstall, authMiddleware, async (req, res) => {
  try { const [rows] = await q("SELECT COUNT(*)::int AS count FROM orders WHERE user_id = $1", [req.user.id]); res.json({ count: rows[0].count }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/orders", requireInstall, authMiddleware, async (req, res) => {
  try {
    const { product_id, package_id, game_id, payment_method } = req.body;
    if (!product_id || !package_id || !game_id) return res.status(400).json({ error: "Missing fields" });

    const [pkgs] = await q("SELECT * FROM packages WHERE id = $1", [package_id]);
    if (pkgs.length === 0) return res.status(400).json({ error: "Package not found" });
    const pkg = pkgs[0];

    if (payment_method === "wallet") {
      const [wallets] = await q("SELECT * FROM wallets WHERE user_id = $1", [req.user.id]);
      if (wallets.length === 0 || Number(wallets[0].balance) < Number(pkg.price)) return res.status(400).json({ error: "Insufficient balance" });
      await q("UPDATE wallets SET balance = balance - $1 WHERE user_id = $2", [pkg.price, req.user.id]);
    }

    const [ins] = await q(
      `INSERT INTO orders (user_id, product_id, package_id, game_id, amount, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING id`,
      [req.user.id, product_id, package_id, game_id, pkg.price, payment_method || "wallet"]
    );
    res.json({ success: true, order: { id: ins[0].id, status: "pending", amount: pkg.price } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/verify-payment", requireInstall, authMiddleware, async (req, res) => {
  try {
    const { transaction_id, amount, product_id, package_id, game_id, type } = req.body;
    if (!transaction_id) return res.status(400).json({ error: "Transaction ID দিন" });

    const [sms] = await q("SELECT * FROM sms_messages WHERE transaction_id = $1 AND is_used = FALSE", [transaction_id]);
    if (sms.length === 0) return res.status(400).json({ error: "Transaction ID পাওয়া যায়নি বা ইতিমধ্যে ব্যবহৃত হয়েছে" });

    const smsRow = sms[0];
    if (Number(smsRow.amount) < Number(amount)) {
      return res.status(400).json({ error: `পাঠানো টাকা কম। প্রয়োজন: ৳${amount}, পাওয়া গেছে: ৳${smsRow.amount}` });
    }
    await q("UPDATE sms_messages SET is_used = TRUE WHERE id = $1", [smsRow.id]);

    if (type === "add_money") {
      await q(`INSERT INTO wallets (user_id, balance) VALUES ($1, $2)
               ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance + $2`, [req.user.id, amount]);
      return res.json({ success: true, message: `৳${amount} ওয়ালেটে যোগ হয়েছে!` });
    }

    await q(
      `INSERT INTO orders (user_id, product_id, package_id, game_id, amount, payment_method, status, transaction_id)
       VALUES ($1, $2, $3, $4, $5, 'manual', 'pending', $6)`,
      [req.user.id, product_id, package_id, game_id, amount, transaction_id]
    );
    res.json({ success: true, message: "পেমেন্ট ভেরিফাই হয়েছে!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Developer apps
app.get("/api/developer-app", requireInstall, authMiddleware, async (req, res) => {
  try { const [rows] = await q("SELECT * FROM developer_apps WHERE user_id = $1 ORDER BY created_at LIMIT 1", [req.user.id]); res.json(rows[0] || null); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post("/api/developer-app", requireInstall, authMiddleware, async (req, res) => {
  try {
    const apiKey = crypto.randomBytes(24).toString("hex");
    const [ins] = await q("INSERT INTO developer_apps (user_id, app_name, api_key) VALUES ($1, 'API Key', $2) RETURNING *", [req.user.id, apiKey]);
    res.json(ins[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ═══════════════════════════════════════════════════════════
const ad = [requireInstall, authMiddleware, adminMiddleware];

// Categories
app.get("/api/admin/categories", ad, async (req, res) => {
  try { const [rows] = await q("SELECT * FROM categories ORDER BY sort_order"); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post("/api/admin/categories", ad, async (req, res) => {
  try {
    const { id, name, image_url, sort_order } = req.body;
    if (id) await q("UPDATE categories SET name=$1, image_url=$2, sort_order=$3 WHERE id=$4", [name, image_url || null, sort_order || 0, id]);
    else    await q("INSERT INTO categories (name, image_url, sort_order) VALUES ($1, $2, $3)", [name, image_url || null, sort_order || 0]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete("/api/admin/categories/:id", ad, async (req, res) => {
  try { await q("DELETE FROM categories WHERE id = $1", [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.patch("/api/admin/categories/:id", ad, async (req, res) => {
  try {
    const sets = []; const params = [];
    Object.entries(req.body).forEach(([k, v]) => { params.push(v); sets.push(`${k} = $${params.length}`); });
    params.push(req.params.id);
    await q(`UPDATE categories SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Products
app.get("/api/admin/products", ad, async (req, res) => {
  try { const [rows] = await q("SELECT * FROM products ORDER BY sort_order"); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post("/api/admin/products", ad, async (req, res) => {
  try {
    const { id, name, category, category_id, sub_category, image_url, sort_order, custom_fields } = req.body;
    const cf = typeof custom_fields === "string" ? custom_fields : JSON.stringify(custom_fields || []);
    if (id) {
      await q(`UPDATE products SET name=$1, category=$2, category_id=$3, sub_category=$4, image_url=$5, sort_order=$6, custom_fields=$7::jsonb WHERE id=$8`,
        [name, category || "Other", category_id || null, sub_category || "Top up", image_url || null, sort_order || 0, cf, id]);
    } else {
      await q(`INSERT INTO products (name, category, category_id, sub_category, image_url, sort_order, custom_fields) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
        [name, category || "Other", category_id || null, sub_category || "Top up", image_url || null, sort_order || 0, cf]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete("/api/admin/products/:id", ad, async (req, res) => {
  try { await q("DELETE FROM products WHERE id = $1", [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.patch("/api/admin/products/:id", ad, async (req, res) => {
  try {
    const sets = []; const params = [];
    Object.entries(req.body).forEach(([k, v]) => {
      const val = k === "custom_fields" && typeof v !== "string" ? JSON.stringify(v) : v;
      params.push(val);
      sets.push(k === "custom_fields" ? `${k} = $${params.length}::jsonb` : `${k} = $${params.length}`);
    });
    params.push(req.params.id);
    await q(`UPDATE products SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Packages
app.get("/api/admin/packages", ad, async (req, res) => {
  try {
    const productId = req.query.product_id;
    let sql = `SELECT pk.*, p.name AS product_name, aa.name AS auto_api_name
               FROM packages pk
               LEFT JOIN products p ON pk.product_id = p.id
               LEFT JOIN auto_apis aa ON pk.auto_api_id = aa.id`;
    const params = [];
    if (productId) { params.push(productId); sql += ` WHERE pk.product_id = $${params.length}`; }
    sql += " ORDER BY pk.sort_order";
    const [rows] = await q(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post("/api/admin/packages", ad, async (req, res) => {
  try {
    const { id, name, price, product_id, sort_order, auto_topup_enabled, auto_api_id, product_variation_name, api_tagline } = req.body;
    if (id) {
      await q(`UPDATE packages SET name=$1, price=$2, sort_order=$3, auto_topup_enabled=$4, auto_api_id=$5, product_variation_name=$6, api_tagline=$7 WHERE id=$8`,
        [name, price, sort_order || 0, !!auto_topup_enabled, auto_api_id || null, product_variation_name || "", api_tagline || "", id]);
    } else {
      await q(`INSERT INTO packages (name, price, product_id, sort_order, auto_topup_enabled, auto_api_id, product_variation_name, api_tagline)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [name, price, product_id, sort_order || 0, !!auto_topup_enabled, auto_api_id || null, product_variation_name || "", api_tagline || ""]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete("/api/admin/packages/:id", ad, async (req, res) => {
  try { await q("DELETE FROM packages WHERE id = $1", [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.patch("/api/admin/packages/:id", ad, async (req, res) => {
  try {
    const sets = []; const params = [];
    Object.entries(req.body).forEach(([k, v]) => { params.push(v); sets.push(`${k} = $${params.length}`); });
    params.push(req.params.id);
    await q(`UPDATE packages SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Orders
app.get("/api/admin/orders", ad, async (req, res) => {
  try {
    const [rows] = await q(`
      SELECT o.*, p.name AS product_name, pk.name AS package_name
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN packages pk ON o.package_id = pk.id
      ORDER BY o.created_at DESC LIMIT 200
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.patch("/api/admin/orders/:id", ad, async (req, res) => {
  try {
    const { status, delivery_message } = req.body;
    if (status === "cancelled") {
      const [orders] = await q("SELECT * FROM orders WHERE id = $1 AND status != 'cancelled'", [req.params.id]);
      if (orders.length > 0 && orders[0].payment_method === "wallet") {
        await q("UPDATE wallets SET balance = balance + $1 WHERE user_id = $2", [orders[0].amount, orders[0].user_id]);
      }
    }
    const sets = ["status = $1"]; const params = [status];
    if (delivery_message !== undefined) { params.push(delivery_message); sets.push(`delivery_message = $${params.length}`); }
    params.push(req.params.id);
    await q(`UPDATE orders SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Banners
app.get("/api/admin/banners", ad, async (req, res) => {
  try { const [rows] = await q("SELECT * FROM banners ORDER BY sort_order"); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post("/api/admin/banners", ad, async (req, res) => {
  try {
    const { id, title, image_url, link_url, sort_order } = req.body;
    if (id) await q("UPDATE banners SET title=$1, image_url=$2, link_url=$3, sort_order=$4 WHERE id=$5", [title || "", image_url, link_url || null, sort_order || 0, id]);
    else    await q("INSERT INTO banners (title, image_url, link_url, sort_order) VALUES ($1, $2, $3, $4)", [title || "", image_url, link_url || null, sort_order || 0]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete("/api/admin/banners/:id", ad, async (req, res) => {
  try { await q("DELETE FROM banners WHERE id = $1", [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.patch("/api/admin/banners/:id", ad, async (req, res) => {
  try {
    const sets = []; const params = [];
    Object.entries(req.body).forEach(([k, v]) => { params.push(v); sets.push(`${k} = $${params.length}`); });
    params.push(req.params.id);
    await q(`UPDATE banners SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Settings
app.get("/api/admin/settings", ad, async (req, res) => {
  try { const [rows] = await q("SELECT * FROM site_settings ORDER BY key_name"); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post("/api/admin/settings", ad, async (req, res) => {
  try {
    const { settings } = req.body;
    for (const [key, value] of Object.entries(settings || {})) {
      await q(`INSERT INTO site_settings (key_name, value) VALUES ($1, $2)
               ON CONFLICT (key_name) DO UPDATE SET value = EXCLUDED.value`, [key, value]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Wallets
app.get("/api/admin/wallets", ad, async (req, res) => {
  try { const [rows] = await q("SELECT w.*, u.email, u.full_name FROM wallets w LEFT JOIN users u ON w.user_id = u.id"); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post("/api/admin/wallets/add-balance", ad, async (req, res) => {
  try { const { user_id, amount } = req.body; await q("UPDATE wallets SET balance = balance + $1 WHERE user_id = $2", [amount, user_id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Profiles
app.get("/api/admin/profiles", ad, async (req, res) => {
  try { const [rows] = await q("SELECT * FROM profiles"); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Auto APIs
app.get("/api/admin/auto-apis", ad, async (req, res) => {
  try { const [rows] = await q("SELECT * FROM auto_apis ORDER BY name"); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post("/api/admin/auto-apis", ad, async (req, res) => {
  try {
    const { id, name, base_url, api_key, api_type, is_active } = req.body;
    if (id) await q("UPDATE auto_apis SET name=$1, base_url=$2, api_key=$3, api_type=$4, is_active=$5 WHERE id=$6",
      [name, base_url, api_key || "", api_type || "generic", !!is_active, id]);
    else    await q("INSERT INTO auto_apis (name, base_url, api_key, api_type) VALUES ($1, $2, $3, $4)",
      [name, base_url, api_key || "", api_type || "generic"]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete("/api/admin/auto-apis/:id", ad, async (req, res) => {
  try { await q("DELETE FROM auto_apis WHERE id = $1", [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// SMS webhook (no auth)
app.post("/api/sms-webhook", async (req, res) => {
  try {
    if (!getConfig()) return res.status(503).json({ error: "Not installed" });
    const { sender, message } = req.body;
    if (!message) return res.status(400).json({ error: "No message" });

    let amount = null, transactionId = null, phoneNumber = null, smsBalance = null;
    const a = message.match(/Tk\s*([\d,]+\.?\d*)/i);            if (a) amount = parseFloat(a[1].replace(",", ""));
    const t = message.match(/TrxID\s*(\S+)/i);                   if (t) transactionId = t[1];
    const p = message.match(/(?:from|হতে|থেকে)\s*([\d]+)/i);    if (p) phoneNumber = p[1];
    const b = message.match(/Balance\s*Tk\s*([\d,]+\.?\d*)/i);   if (b) smsBalance = parseFloat(b[1].replace(",", ""));

    await q(`INSERT INTO sms_messages (sender, raw_message, amount, transaction_id, phone_number, sms_balance, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [sender || "", message, amount, transactionId, phoneNumber, smsBalance]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get("/api/admin/sms", ad, async (req, res) => {
  try { const [rows] = await q("SELECT * FROM sms_messages ORDER BY created_at DESC LIMIT 100"); res.json(rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Config
app.get("/api/admin/config", ad, (req, res) => {
  const cfg = getConfig();
  res.json({ db_host: cfg.db_host, db_port: cfg.db_port, db_user: cfg.db_user, db_name: cfg.db_name, site_url: cfg.site_url });
});
app.post("/api/admin/config", ad, async (req, res) => {
  try {
    const cfg = getConfig();
    const { db_host, db_port, db_user, db_password, db_name, site_url } = req.body;
    const testPool = new Pool({ host: db_host || cfg.db_host, port: db_port || cfg.db_port, user: db_user || cfg.db_user, password: db_password || cfg.db_password, database: db_name || cfg.db_name, max: 1 });
    const c = await testPool.connect(); c.release(); await testPool.end();

    cfg.db_host = db_host || cfg.db_host;
    cfg.db_port = db_port || cfg.db_port;
    cfg.db_user = db_user || cfg.db_user;
    if (db_password) cfg.db_password = db_password;
    cfg.db_name = db_name || cfg.db_name;
    cfg.site_url = site_url !== undefined ? site_url : cfg.site_url;
    saveConfig(cfg);
    if (pool) { await pool.end(); pool = null; }

    res.json({ success: true, message: "Config updated" });
  } catch (err) { res.status(500).json({ error: "DB connection failed: " + err.message }); }
});

// ═══════════════════════════════════════════════════════════
//  STATIC + SPA FALLBACK
// ═══════════════════════════════════════════════════════════
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  const cfg = getConfig();
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(cfg ? "✅ Installed — PostgreSQL connected" : "⚠️  Not installed — visit /install to setup");
});

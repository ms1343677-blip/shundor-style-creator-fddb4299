const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_PATH = path.join(__dirname, "config.json");

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// ─── Config helpers ──────────────────────────────────────
function getConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")); } catch { return null; }
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

let pool = null;
function getPool() {
  const cfg = getConfig();
  if (!cfg) return null;
  if (!pool) {
    pool = mysql.createPool({
      host: cfg.db_host,
      port: cfg.db_port || 3306,
      user: cfg.db_user,
      password: cfg.db_password,
      database: cfg.db_name,
      waitForConnections: true,
      connectionLimit: 10,
      charset: "utf8mb4",
    });
  }
  return pool;
}

function getJwtSecret() {
  const cfg = getConfig();
  return cfg?.jwt_secret || "topupyyy-secret-key-change-me";
}

// ─── Auth middleware ─────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, getJwtSecret());
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user?.is_admin) return res.status(403).json({ error: "Forbidden" });
  next();
}

// ─── Install check middleware ────────────────────────────
function requireInstall(req, res, next) {
  if (!getConfig()) return res.status(503).json({ error: "Not installed", needsInstall: true });
  next();
}

// ═══════════════════════════════════════════════════════════
//  INSTALL ROUTES
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

    // Test DB connection
    const testPool = mysql.createPool({ host: db_host, port: db_port || 3306, user: db_user, password: db_password, database: db_name, connectionLimit: 1, charset: "utf8mb4" });
    const conn = await testPool.getConnection();

    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, "database.sql"), "utf8");
    const statements = schema.split(";").map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith("--"));
    for (const stmt of statements) {
      try { await conn.query(stmt); } catch (e) { /* ignore duplicate table errors */ }
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(admin_password, 10);
    const adminId = crypto.randomUUID();
    await conn.query(
      "INSERT INTO users (id, email, password, full_name, is_admin) VALUES (?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE is_admin=1",
      [adminId, admin_email, hashedPassword, "Admin"]
    );

    // Create admin wallet
    await conn.query(
      "INSERT INTO wallets (user_id, balance) VALUES (?, 0) ON DUPLICATE KEY UPDATE user_id=user_id",
      [adminId]
    );

    // Create admin profile
    await conn.query(
      "INSERT INTO profiles (user_id, full_name, email) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE email=?",
      [adminId, "Admin", admin_email, admin_email]
    );

    conn.release();
    await testPool.end();

    // Save config
    const jwtSecret = crypto.randomBytes(32).toString("hex");
    saveConfig({ db_host, db_port: db_port || 3306, db_user, db_password, db_name, site_url: site_url || "", jwt_secret: jwtSecret });

    // Reset pool
    pool = null;

    res.json({ success: true, message: "ইনস্টলেশন সফল!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/install/download-db", (req, res) => {
  const sqlPath = path.join(__dirname, "database.sql");
  if (!fs.existsSync(sqlPath)) return res.status(404).json({ error: "database.sql not found" });
  res.download(sqlPath, "database.sql");
});

// ═══════════════════════════════════════════════════════════
//  AUTH ROUTES
// ═══════════════════════════════════════════════════════════
app.post("/api/auth/register", requireInstall, async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email ও Password দিন" });

    const db = getPool();
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ error: "এই ইমেইল দিয়ে আগেই একাউন্ট আছে" });

    const hashed = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    await db.query("INSERT INTO users (id, email, password, full_name) VALUES (?, ?, ?, ?)", [userId, email, hashed, full_name || email.split("@")[0]]);
    await db.query("INSERT INTO wallets (user_id, balance) VALUES (?, 0)", [userId]);
    await db.query("INSERT INTO profiles (user_id, full_name, email) VALUES (?, ?, ?)", [userId, full_name || email.split("@")[0], email]);

    res.json({ success: true, message: "একাউন্ট তৈরি হয়েছে!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", requireInstall, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email ও Password দিন" });

    const db = getPool();
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) return res.status(401).json({ error: "ইমেইল বা পাসওয়ার্ড ভুল" });

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "ইমেইল বা পাসওয়ার্ড ভুল" });

    const token = jwt.sign({ id: user.id, email: user.email, is_admin: user.is_admin, full_name: user.full_name, avatar_url: user.avatar_url }, getJwtSecret(), { expiresIn: "30d" });
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, is_admin: user.is_admin, avatar_url: user.avatar_url } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/auth/me", requireInstall, authMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const [users] = await db.query("SELECT id, email, full_name, is_admin, avatar_url, created_at FROM users WHERE id = ?", [req.user.id]);
    if (users.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ user: users[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  PUBLIC DATA ROUTES
// ═══════════════════════════════════════════════════════════
app.get("/api/settings", requireInstall, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT key_name, value FROM site_settings");
    const map = {};
    rows.forEach(r => { map[r.key_name] = r.value; });
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/categories", requireInstall, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/products", requireInstall, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM products WHERE is_active = 1 ORDER BY sort_order");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/products/:id", requireInstall, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Product not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/packages", requireInstall, async (req, res) => {
  try {
    const db = getPool();
    const productId = req.query.product_id;
    let query = "SELECT * FROM packages WHERE is_active = 1";
    const params = [];
    if (productId) { query += " AND product_id = ?"; params.push(productId); }
    query += " ORDER BY sort_order";
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/banners", requireInstall, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/latest-orders", requireInstall, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query(`
      SELECT o.*, p.name as product_name, pk.name as package_name, pr.full_name, pr.email as profile_email
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN packages pk ON o.package_id = pk.id
      LEFT JOIN profiles pr ON o.user_id = pr.user_id
      ORDER BY o.created_at DESC LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  AUTHENTICATED USER ROUTES
// ═══════════════════════════════════════════════════════════
app.get("/api/wallet", requireInstall, authMiddleware, async (req, res) => {
  try {
    const db = getPool();
    // Ensure wallet exists
    await db.query("INSERT INTO wallets (user_id, balance) VALUES (?, 0) ON DUPLICATE KEY UPDATE user_id=user_id", [req.user.id]);
    const [rows] = await db.query("SELECT * FROM wallets WHERE user_id = ?", [req.user.id]);
    res.json(rows[0] || { balance: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/orders", requireInstall, authMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query(`
      SELECT o.*, p.name as product_name, p.image_url as product_image, pk.name as package_name
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN packages pk ON o.package_id = pk.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/orders/count", requireInstall, authMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT COUNT(*) as count FROM orders WHERE user_id = ?", [req.user.id]);
    res.json({ count: rows[0].count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/orders", requireInstall, authMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const { product_id, package_id, game_id, payment_method } = req.body;
    if (!product_id || !package_id || !game_id) return res.status(400).json({ error: "Missing fields" });

    const [pkgs] = await db.query("SELECT * FROM packages WHERE id = ?", [package_id]);
    if (pkgs.length === 0) return res.status(400).json({ error: "Package not found" });
    const pkg = pkgs[0];

    if (payment_method === "wallet") {
      const [wallets] = await db.query("SELECT * FROM wallets WHERE user_id = ?", [req.user.id]);
      if (wallets.length === 0 || wallets[0].balance < pkg.price) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      // Deduct
      await db.query("UPDATE wallets SET balance = balance - ? WHERE user_id = ?", [pkg.price, req.user.id]);
    }

    const orderId = crypto.randomUUID();
    await db.query(
      "INSERT INTO orders (id, user_id, product_id, package_id, game_id, amount, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')",
      [orderId, req.user.id, product_id, package_id, game_id, pkg.price, payment_method || "wallet"]
    );

    res.json({ success: true, order: { id: orderId, status: "pending", amount: pkg.price } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual payment verify (simplified - checks SMS table for TrxID)
app.post("/api/verify-payment", requireInstall, authMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const { transaction_id, amount, product_id, package_id, game_id, type } = req.body;
    if (!transaction_id) return res.status(400).json({ error: "Transaction ID দিন" });

    // Check if TrxID exists in sms_messages
    const [sms] = await db.query("SELECT * FROM sms_messages WHERE transaction_id = ? AND is_used = 0", [transaction_id]);
    if (sms.length === 0) return res.status(400).json({ error: "Transaction ID পাওয়া যায়নি বা ইতিমধ্যে ব্যবহৃত হয়েছে" });

    const smsRecord = sms[0];
    if (smsRecord.amount < amount) return res.status(400).json({ error: `পাঠানো টাকা কম। প্রয়োজন: ৳${amount}, পাওয়া গেছে: ৳${smsRecord.amount}` });

    // Mark SMS as used
    await db.query("UPDATE sms_messages SET is_used = 1 WHERE id = ?", [smsRecord.id]);

    if (type === "add_money") {
      await db.query("INSERT INTO wallets (user_id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance + ?", [req.user.id, amount, amount]);
      return res.json({ success: true, message: `৳${amount} ওয়ালেটে যোগ হয়েছে!` });
    }

    // Create order
    const orderId = crypto.randomUUID();
    await db.query(
      "INSERT INTO orders (id, user_id, product_id, package_id, game_id, amount, payment_method, status, transaction_id) VALUES (?, ?, ?, ?, ?, ?, 'manual', 'pending', ?)",
      [orderId, req.user.id, product_id, package_id, game_id, amount, transaction_id]
    );

    res.json({ success: true, message: "পেমেন্ট ভেরিফাই হয়েছে!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Developer apps
app.get("/api/developer-app", requireInstall, authMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM developer_apps WHERE user_id = ? ORDER BY created_at LIMIT 1", [req.user.id]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/developer-app", requireInstall, authMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const apiKey = crypto.randomBytes(24).toString("hex");
    await db.query("INSERT INTO developer_apps (user_id, app_name, api_key) VALUES (?, 'API Key', ?)", [req.user.id, apiKey]);
    const [rows] = await db.query("SELECT * FROM developer_apps WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", [req.user.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ═══════════════════════════════════════════════════════════
app.get("/api/admin/categories", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM categories ORDER BY sort_order");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/admin/categories", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const { id, name, image_url, sort_order } = req.body;
    if (id) {
      await db.query("UPDATE categories SET name=?, image_url=?, sort_order=? WHERE id=?", [name, image_url || null, sort_order || 0, id]);
    } else {
      await db.query("INSERT INTO categories (name, image_url, sort_order) VALUES (?, ?, ?)", [name, image_url || null, sort_order || 0]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/admin/categories/:id", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    await db.query("DELETE FROM categories WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/admin/categories/:id", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(req.body)) {
      updates.push(`${key} = ?`);
      params.push(val);
    }
    params.push(req.params.id);
    await db.query(`UPDATE categories SET ${updates.join(", ")} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/admin/products", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM products ORDER BY sort_order");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/admin/products", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const { id, name, category, category_id, sub_category, image_url, sort_order, custom_fields } = req.body;
    const cf = typeof custom_fields === "string" ? custom_fields : JSON.stringify(custom_fields || []);
    if (id) {
      await db.query("UPDATE products SET name=?, category=?, category_id=?, sub_category=?, image_url=?, sort_order=?, custom_fields=? WHERE id=?",
        [name, category || "Other", category_id || null, sub_category || "Top up", image_url || null, sort_order || 0, cf, id]);
    } else {
      await db.query("INSERT INTO products (name, category, category_id, sub_category, image_url, sort_order, custom_fields) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [name, category || "Other", category_id || null, sub_category || "Top up", image_url || null, sort_order || 0, cf]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/admin/products/:id", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    await db.query("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/admin/products/:id", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(req.body)) {
      updates.push(`\`${key}\` = ?`);
      params.push(val);
    }
    params.push(req.params.id);
    await db.query(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/admin/packages", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const productId = req.query.product_id;
    let query = "SELECT pk.*, p.name as product_name, aa.name as auto_api_name FROM packages pk LEFT JOIN products p ON pk.product_id = p.id LEFT JOIN auto_apis aa ON pk.auto_api_id = aa.id";
    const params = [];
    if (productId) { query += " WHERE pk.product_id = ?"; params.push(productId); }
    query += " ORDER BY pk.sort_order";
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/admin/packages", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const { id, name, price, product_id, sort_order, auto_topup_enabled, auto_api_id, product_variation_name, api_tagline } = req.body;
    if (id) {
      await db.query("UPDATE packages SET name=?, price=?, sort_order=?, auto_topup_enabled=?, auto_api_id=?, product_variation_name=?, api_tagline=? WHERE id=?",
        [name, price, sort_order || 0, auto_topup_enabled ? 1 : 0, auto_api_id || null, product_variation_name || "", api_tagline || "", id]);
    } else {
      await db.query("INSERT INTO packages (name, price, product_id, sort_order, auto_topup_enabled, auto_api_id, product_variation_name, api_tagline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [name, price, product_id, sort_order || 0, auto_topup_enabled ? 1 : 0, auto_api_id || null, product_variation_name || "", api_tagline || ""]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/admin/packages/:id", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    await db.query("DELETE FROM packages WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/admin/packages/:id", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(req.body)) {
      updates.push(`\`${key}\` = ?`);
      params.push(val);
    }
    params.push(req.params.id);
    await db.query(`UPDATE packages SET ${updates.join(", ")} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/admin/orders", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query(`
      SELECT o.*, p.name as product_name, pk.name as package_name
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN packages pk ON o.package_id = pk.id
      ORDER BY o.created_at DESC LIMIT 200
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/admin/orders/:id", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const { status, delivery_message } = req.body;

    // If cancelling, refund wallet
    if (status === "cancelled") {
      const [orders] = await db.query("SELECT * FROM orders WHERE id = ? AND status != 'cancelled'", [req.params.id]);
      if (orders.length > 0 && orders[0].payment_method === "wallet") {
        await db.query("UPDATE wallets SET balance = balance + ? WHERE user_id = ?", [orders[0].amount, orders[0].user_id]);
      }
    }

    const updates = ["status = ?"];
    const params = [status];
    if (delivery_message !== undefined) {
      updates.push("delivery_message = ?");
      params.push(delivery_message);
    }
    params.push(req.params.id);
    await db.query(`UPDATE orders SET ${updates.join(", ")} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/admin/banners", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM banners ORDER BY sort_order");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/admin/banners", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const { id, title, image_url, link_url, sort_order } = req.body;
    if (id) {
      await db.query("UPDATE banners SET title=?, image_url=?, link_url=?, sort_order=? WHERE id=?", [title || "", image_url, link_url || null, sort_order || 0, id]);
    } else {
      await db.query("INSERT INTO banners (title, image_url, link_url, sort_order) VALUES (?, ?, ?, ?)", [title || "", image_url, link_url || null, sort_order || 0]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/admin/banners/:id", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    await db.query("DELETE FROM banners WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/admin/banners/:id", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(req.body)) {
      updates.push(`\`${key}\` = ?`);
      params.push(val);
    }
    params.push(req.params.id);
    await db.query(`UPDATE banners SET ${updates.join(", ")} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/admin/settings", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM site_settings ORDER BY key_name");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/admin/settings", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const { settings } = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await db.query("UPDATE site_settings SET value = ? WHERE key_name = ?", [value, key]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/admin/wallets", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT w.*, u.email, u.full_name FROM wallets w LEFT JOIN users u ON w.user_id = u.id");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/admin/wallets/add-balance", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const { user_id, amount } = req.body;
    await db.query("UPDATE wallets SET balance = balance + ? WHERE user_id = ?", [amount, user_id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/admin/profiles", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM profiles");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/admin/auto-apis", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM auto_apis ORDER BY name");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/admin/auto-apis", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const { id, name, base_url, api_key, api_type, is_active } = req.body;
    if (id) {
      await db.query("UPDATE auto_apis SET name=?, base_url=?, api_key=?, api_type=?, is_active=? WHERE id=?",
        [name, base_url, api_key || "", api_type || "generic", is_active ? 1 : 0, id]);
    } else {
      await db.query("INSERT INTO auto_apis (name, base_url, api_key, api_type) VALUES (?, ?, ?, ?)",
        [name, base_url, api_key || "", api_type || "generic"]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/admin/auto-apis/:id", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    await db.query("DELETE FROM auto_apis WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// SMS webhook (for receiving SMS from phone)
app.post("/api/sms-webhook", async (req, res) => {
  try {
    const cfg = getConfig();
    if (!cfg) return res.status(503).json({ error: "Not installed" });
    const db = getPool();
    const { sender, message, sim } = req.body;
    if (!message) return res.status(400).json({ error: "No message" });

    // Parse bKash/Nagad SMS
    let amount = null;
    let transactionId = null;
    let phoneNumber = null;
    let smsBalance = null;

    const amountMatch = message.match(/Tk\s*([\d,]+\.?\d*)/i);
    if (amountMatch) amount = parseFloat(amountMatch[1].replace(",", ""));

    const trxMatch = message.match(/TrxID\s*(\S+)/i);
    if (trxMatch) transactionId = trxMatch[1];

    const phoneMatch = message.match(/(?:from|হতে|থেকে)\s*([\d]+)/i);
    if (phoneMatch) phoneNumber = phoneMatch[1];

    const balMatch = message.match(/Balance\s*Tk\s*([\d,]+\.?\d*)/i);
    if (balMatch) smsBalance = parseFloat(balMatch[1].replace(",", ""));

    await db.query(
      "INSERT INTO sms_messages (sender, raw_message, amount, transaction_id, phone_number, sms_balance, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
      [sender || "", message, amount, transactionId, phoneNumber, smsBalance]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/sms", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM sms_messages ORDER BY created_at DESC LIMIT 100");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
//  CONFIG UPDATE (for DB connection changes)
// ═══════════════════════════════════════════════════════════
app.get("/api/admin/config", requireInstall, authMiddleware, adminMiddleware, (req, res) => {
  const cfg = getConfig();
  res.json({ db_host: cfg.db_host, db_port: cfg.db_port, db_user: cfg.db_user, db_name: cfg.db_name, site_url: cfg.site_url });
});

app.post("/api/admin/config", requireInstall, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const cfg = getConfig();
    const { db_host, db_port, db_user, db_password, db_name, site_url } = req.body;
    // Test new connection
    const testPool = mysql.createPool({ host: db_host || cfg.db_host, port: db_port || cfg.db_port, user: db_user || cfg.db_user, password: db_password || cfg.db_password, database: db_name || cfg.db_name, connectionLimit: 1 });
    const conn = await testPool.getConnection();
    conn.release();
    await testPool.end();

    // Update config
    cfg.db_host = db_host || cfg.db_host;
    cfg.db_port = db_port || cfg.db_port;
    cfg.db_user = db_user || cfg.db_user;
    if (db_password) cfg.db_password = db_password;
    cfg.db_name = db_name || cfg.db_name;
    cfg.site_url = site_url !== undefined ? site_url : cfg.site_url;
    saveConfig(cfg);

    // Reset pool
    if (pool) { await pool.end(); pool = null; }

    res.json({ success: true, message: "Config updated" });
  } catch (err) {
    res.status(500).json({ error: "DB connection failed: " + err.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  STATIC FILES & SPA FALLBACK
// ═══════════════════════════════════════════════════════════
app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  const cfg = getConfig();
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(cfg ? "✅ Installed — DB connected" : "⚠️  Not installed — visit /install to setup");
});

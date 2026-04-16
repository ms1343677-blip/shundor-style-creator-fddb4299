import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Database, Globe, Shield, Download } from "lucide-react";
import { api } from "@/lib/api";

const Install = () => {
  const [dbHost, setDbHost] = useState("localhost");
  const [dbPort, setDbPort] = useState("3306");
  const [dbUser, setDbUser] = useState("");
  const [dbPassword, setDbPassword] = useState("");
  const [dbName, setDbName] = useState("");
  const [siteUrl, setSiteUrl] = useState(window.location.origin);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleInstall = async () => {
    setLoading(true);
    setError("");
    try {
      await api.install({
        db_host: dbHost,
        db_port: parseInt(dbPort),
        db_user: dbUser,
        db_password: dbPassword,
        db_name: dbName,
        site_url: siteUrl,
        admin_email: adminEmail,
        admin_password: adminPassword,
      });
      setSuccess(true);
      setTimeout(() => { window.location.href = "/"; }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground">ইনস্টলেশন সফল! ✅</h2>
          <p className="text-muted-foreground text-sm">হোমপেজে রিডাইরেক্ট হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-foreground">🚀 TopUpYYY Setup</h1>
          <p className="text-sm text-muted-foreground">ডাটাবেজ ও অ্যাডমিন সেটআপ করুন</p>
        </div>

        {/* Download DB button */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">📥 Database SQL ডাউনলোড</p>
            <p className="text-xs text-muted-foreground">phpMyAdmin এ ইম্পোর্ট করুন</p>
          </div>
          <a
            href={api.downloadDb()}
            download
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 active:opacity-80"
          >
            <Download className="w-4 h-4" /> Download
          </a>
        </div>

        {/* Database Connection */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" /> Database Connection
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-0.5 block">Host</label>
              <Input value={dbHost} onChange={(e) => setDbHost(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-0.5 block">Port</label>
              <Input value={dbPort} onChange={(e) => setDbPort(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-0.5 block">Database User</label>
            <Input value={dbUser} onChange={(e) => setDbUser(e.target.value)} placeholder="root" className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-0.5 block">Database Password</label>
            <Input type="password" value={dbPassword} onChange={(e) => setDbPassword(e.target.value)} className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-0.5 block">Database Name</label>
            <Input value={dbName} onChange={(e) => setDbName(e.target.value)} placeholder="topupyyy" className="h-9 text-sm" />
          </div>
        </div>

        {/* Site Settings */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> Site Settings
          </h2>
          <div>
            <label className="text-xs text-muted-foreground mb-0.5 block">Site URL</label>
            <Input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="https://yourdomain.com" className="h-9 text-sm" />
          </div>
        </div>

        {/* Admin Account */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Admin Account
          </h2>
          <div>
            <label className="text-xs text-muted-foreground mb-0.5 block">Admin Email</label>
            <Input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@example.com" className="h-9 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-0.5 block">Admin Password</label>
            <Input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••" className="h-9 text-sm" />
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
            <p className="text-sm text-destructive font-bold">❌ Error</p>
            <p className="text-xs text-destructive/80 mt-1">{error}</p>
          </div>
        )}

        <button
          onClick={handleInstall}
          disabled={loading || !dbUser || !dbName || !adminEmail || !adminPassword}
          className="w-full bg-primary text-primary-foreground h-12 rounded-xl text-sm font-bold active:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "ইনস্টল হচ্ছে..." : "🚀 Install Now"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          phpMyAdmin এ আগে database.sql ফাইলটি ইম্পোর্ট করুন, তারপর ইনস্টল করুন
        </p>
      </div>
    </div>
  );
};

export default Install;

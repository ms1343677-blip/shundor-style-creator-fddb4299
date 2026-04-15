import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Key, RefreshCw, Trash2, ExternalLink, Code, Send, CheckCircle } from "lucide-react";

const Docs = () => {
  const { user, isReady } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [appName, setAppName] = useState("My App");
  const [callbackUrl, setCallbackUrl] = useState("");

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "";
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/external-order`;

  useEffect(() => {
    if (isReady && !user) navigate("/login");
  }, [isReady, user]);

  useEffect(() => {
    if (user) fetchApps();
  }, [user]);

  const fetchApps = async () => {
    setLoading(true);
    const { data } = await supabase.from("developer_apps").select("*").order("created_at", { ascending: false });
    setApps(data || []);
    setLoading(false);
  };

  const createApp = async () => {
    if (!appName.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("developer_apps").insert({
      user_id: user!.id,
      app_name: appName,
      callback_url: callbackUrl,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ API Key তৈরি হয়েছে!" });
      setAppName("My App");
      setCallbackUrl("");
      fetchApps();
    }
    setCreating(false);
  };

  const deleteApp = async (id: string) => {
    await supabase.from("developer_apps").delete().eq("id", id);
    toast({ title: "🗑️ মুছে ফেলা হয়েছে" });
    fetchApps();
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "📋 কপি হয়েছে!" });
  };

  const laravelCode = (apiKey: string) => `<?php
// Laravel OrderController.php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Http;

class OrderController extends Controller
{
    private $apiUrl = '${baseUrl}';
    private $apiKey = '${apiKey}';

    /**
     * অর্ডার তৈরি করুন
     */
    public function createOrder(Request \\$request)
    {
        \\$validated = \\$request->validate([
            'product_name' => 'required|string',
            'package_name' => 'nullable|string',
            'game_id' => 'required|string',
            'amount' => 'required|numeric|min:1',
            'external_order_id' => 'nullable|string',
        ]);

        \\$response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'x-api-key' => \\$this->apiKey,
        ])->post(\\$this->apiUrl . '/create', \\$validated);

        return \\$response->json();
    }

    /**
     * অর্ডার স্ট্যাটাস চেক করুন
     */
    public function checkStatus(\\$orderId)
    {
        \\$response = Http::withHeaders([
            'x-api-key' => \\$this->apiKey,
        ])->get(\\$this->apiUrl . '/status', [
            'order_id' => \\$orderId,
        ]);

        return \\$response->json();
    }

    /**
     * কলব্যাক রিসিভ করুন (আপনার callback URL এ POST আসবে)
     */
    public function handleCallback(Request \\$request)
    {
        \\$data = \\$request->all();
        // \\$data['order_id'], \\$data['status'], \\$data['external_order_id']
        
        // আপনার লজিক এখানে
        // যেমন: অর্ডার আপডেট করুন আপনার ডাটাবেসে
        
        return response()->json(['received' => true]);
    }
}`;

  const laravelRoutes = `// routes/api.php
Route::post('/order/create', [OrderController::class, 'createOrder']);
Route::get('/order/status/{orderId}', [OrderController::class, 'checkStatus']);
Route::post('/order/callback', [OrderController::class, 'handleCallback']);`;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-black text-foreground">📄 API Documentation</h1>
          <p className="text-[12px] text-muted-foreground">আপনার ওয়েবসাইট থেকে অর্ডার পাঠান আমাদের API দিয়ে</p>
        </div>

        {/* Create API Key */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-[14px] font-bold text-foreground flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" /> API Key তৈরি করুন
          </h2>
          <Input
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="App এর নাম (যেমন: My Laravel Site)"
            className="h-9 text-[13px]"
          />
          <Input
            value={callbackUrl}
            onChange={(e) => setCallbackUrl(e.target.value)}
            placeholder="Callback URL (optional) — https://yoursite.com/api/callback"
            className="h-9 text-[13px]"
          />
          <Button onClick={createApp} disabled={creating} className="w-full h-9 text-[13px] font-bold">
            {creating ? "তৈরি হচ্ছে..." : "🔑 API Key Generate করুন"}
          </Button>
        </div>

        {/* My API Keys */}
        {apps.length > 0 && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border">
              <h3 className="text-[13px] font-bold text-foreground">আমার API Keys ({apps.length})</h3>
            </div>
            <div className="divide-y divide-border">
              {apps.map((app) => (
                <div key={app.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-foreground">{app.app_name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => deleteApp(app.id)} className="p-1.5 active:bg-destructive/10 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-secondary rounded-lg p-2.5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] text-primary font-mono flex-1 break-all">{app.api_key}</code>
                      <button onClick={() => copyText(app.api_key)} className="p-1 active:opacity-60">
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    {app.callback_url && (
                      <p className="text-[10px] text-muted-foreground">
                        Callback: <span className="text-foreground">{app.callback_url}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Endpoints */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <h2 className="text-[14px] font-bold text-foreground flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" /> API Endpoints
          </h2>

          {/* Create Order */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-success/20 text-success px-2 py-0.5 rounded font-bold">POST</span>
              <span className="text-[12px] font-mono text-foreground">/create</span>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-[11px] text-muted-foreground mb-2">Request Body (JSON):</p>
              <pre className="text-[10px] text-foreground font-mono whitespace-pre-wrap">{`{
  "product_name": "Free Fire Diamond",
  "package_name": "100 Diamond",
  "game_id": "123456789",
  "amount": 50,
  "external_order_id": "your-order-123"
}`}</pre>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-[11px] text-muted-foreground mb-2">Headers:</p>
              <pre className="text-[10px] text-foreground font-mono whitespace-pre-wrap">{`Content-Type: application/json
x-api-key: YOUR_API_KEY`}</pre>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-[11px] text-muted-foreground mb-2">Response:</p>
              <pre className="text-[10px] text-foreground font-mono whitespace-pre-wrap">{`{
  "success": true,
  "order_id": "uuid-here",
  "status": "pending",
  "message": "Order created successfully"
}`}</pre>
            </div>
          </div>

          {/* Check Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold">GET</span>
              <span className="text-[12px] font-mono text-foreground">/status?order_id=xxx</span>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-[11px] text-muted-foreground mb-2">Headers:</p>
              <pre className="text-[10px] text-foreground font-mono whitespace-pre-wrap">{`x-api-key: YOUR_API_KEY`}</pre>
            </div>
          </div>

          {/* Callback */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-success" />
              <span className="text-[12px] font-bold text-foreground">Callback (Webhook)</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              অর্ডার complete বা cancel হলে আপনার callback URL এ POST রিকোয়েস্ট যাবে:
            </p>
            <div className="bg-secondary rounded-lg p-3">
              <pre className="text-[10px] text-foreground font-mono whitespace-pre-wrap">{`{
  "order_id": "uuid",
  "external_order_id": "your-order-123",
  "status": "completed",
  "product_name": "Free Fire Diamond",
  "package_name": "100 Diamond",
  "game_id": "123456789",
  "amount": 50
}`}</pre>
            </div>
          </div>
        </div>

        {/* Base URL */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-2">
          <h3 className="text-[13px] font-bold text-foreground">🔗 Base URL</h3>
          <div className="flex items-center gap-2 bg-secondary rounded-lg p-2.5">
            <code className="text-[10px] text-primary font-mono flex-1 break-all">{baseUrl}</code>
            <button onClick={() => copyText(baseUrl)} className="p-1 active:opacity-60">
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Laravel Code */}
        {apps.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-foreground flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" /> Laravel Controller
              </h2>
              <button
                onClick={() => copyText(laravelCode(apps[0].api_key))}
                className="text-[11px] text-primary font-bold flex items-center gap-1 active:opacity-60"
              >
                <Copy className="w-3 h-3" /> কপি করুন
              </button>
            </div>
            <div className="bg-secondary rounded-lg p-3 max-h-[300px] overflow-auto">
              <pre className="text-[9px] text-foreground font-mono whitespace-pre-wrap">{laravelCode(apps[0].api_key)}</pre>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-foreground">Routes (api.php):</p>
              <div className="bg-secondary rounded-lg p-3">
                <pre className="text-[10px] text-foreground font-mono whitespace-pre-wrap">{laravelRoutes}</pre>
              </div>
              <button
                onClick={() => copyText(laravelRoutes)}
                className="text-[11px] text-primary font-bold flex items-center gap-1 active:opacity-60"
              >
                <Copy className="w-3 h-3" /> Routes কপি করুন
              </button>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-[14px] font-bold text-foreground">🔄 কিভাবে কাজ করে?</h2>
          <div className="space-y-2">
            {[
              "আপনার সাইটে API Key ও Base URL সেটআপ করুন",
              "আপনার ওয়েবসাইট থেকে /create এ POST করুন অর্ডার তৈরি করতে",
              "আমরা অর্ডার প্রসেস করব",
              "অর্ডার complete/cancel হলে আপনার callback URL এ নোটিফিকেশন পাঠাব",
              "/status দিয়ে যেকোনো সময় অর্ডার চেক করতে পারবেন",
            ].map((step, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-[11px] bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </span>
                <p className="text-[12px] text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Docs;

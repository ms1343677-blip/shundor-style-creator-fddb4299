import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Key, Trash2, Code, Send, CheckCircle, Zap } from "lucide-react";

const Docs = () => {
  const { user, isReady } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [appName, setAppName] = useState("My App");
  const [callbackUrl, setCallbackUrl] = useState("");

  // Code generator inputs
  const [genApiKey, setGenApiKey] = useState("");
  const [genForwardUrl, setGenForwardUrl] = useState("");
  const [genCallbackUrl, setGenCallbackUrl] = useState("");
  const [showGenerated, setShowGenerated] = useState(false);

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

  const handleGenerate = () => {
    if (!genApiKey.trim()) {
      toast({ title: "❌ API Key দিন", variant: "destructive" });
      return;
    }
    setShowGenerated(true);
  };

  // Dynamic OrderController
  const orderControllerCode = `<?php
// OrderController.php — আপনার Laravel প্রজেক্টে বসান

namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Http;

class OrderController extends Controller
{
    private \\$apiUrl = '${baseUrl}';
    private \\$apiKey = '${genApiKey}';

    /**
     * আপনার সাইট থেকে আমাদের সাইটে অর্ডার পাঠান
     */
    public function forwardOrder(Request \\$request)
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
     * অর্ডার স্ট্যাটাস চেক
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
}`;

  // Dynamic AutoTopupController (callback receiver)
  const callbackControllerCode = `<?php
// AutoTopupController.php — Callback রিসিভার

namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Log;

class AutoTopupController extends Controller
{
    /**
     * আমাদের সাইট থেকে callback আসবে এখানে
     * অর্ডার complete/cancel হলে এই URL-এ POST আসবে
     */
    public function handleCallback(Request \\$request)
    {
        \\$data = \\$request->all();

        /*
         * Callback Data যা আসবে:
         * --------------------------
         * order_id          => আমাদের সিস্টেমে অর্ডার ID (uuid)
         * external_order_id => আপনার সিস্টেমে অর্ডার ID (যেটা আপনি পাঠিয়েছিলেন)
         * status            => "completed" বা "cancelled"
         * product_name      => প্রোডাক্টের নাম (যেমন: Free Fire Diamond)
         * package_name      => প্যাকেজের নাম (যেমন: 100 Diamond)
         * game_id           => গেম আইডি
         * amount            => টাকার পরিমাণ
         */

        Log::info('TopUp Callback Received:', \\$data);

        // আপনার ডাটাবেসে অর্ডার আপডেট করুন
        // উদাহরণ:
        // \\$order = Order::where('external_id', \\$data['external_order_id'])->first();
        // if (\\$order) {
        //     \\$order->update(['status' => \\$data['status']]);
        // }

        return response()->json(['received' => true, 'message' => 'Callback processed']);
    }
}`;

  // Routes
  const routesCode = `// routes/api.php

use App\\Http\\Controllers\\OrderController;
use App\\Http\\Controllers\\AutoTopupController;

// অর্ডার ফরওয়ার্ড
Route::post('/order/forward', [OrderController::class, 'forwardOrder']);
Route::get('/order/status/{orderId}', [OrderController::class, 'checkStatus']);

// Callback রিসিভ (আমাদের সাইট থেকে আসবে)
Route::post('/topup/callback', [AutoTopupController::class, 'handleCallback']);`;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-black text-foreground">📄 API Documentation</h1>
          <p className="text-[12px] text-muted-foreground">আপনার ওয়েবসাইট থেকে অর্ডার পাঠান আমাদের API দিয়ে</p>
        </div>

        {/* Step 1: Create API Key */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-[14px] font-bold text-foreground flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" /> ১. API Key তৈরি করুন
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
            placeholder="Callback URL — https://yoursite.com/api/topup/callback"
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
                    <button onClick={() => deleteApp(app.id)} className="p-1.5 active:bg-destructive/10 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] mt-1"
                      onClick={() => {
                        setGenApiKey(app.api_key);
                        setGenCallbackUrl(app.callback_url || "");
                      }}
                    >
                      <Zap className="w-3 h-3 mr-1" /> এই Key দিয়ে কোড জেনারেট করুন
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Generate Code */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-[14px] font-bold text-foreground flex items-center gap-2">
            <Code className="w-4 h-4 text-primary" /> ২. কোড জেনারেট করুন
          </h2>
          <p className="text-[11px] text-muted-foreground">
            আপনার API Key এবং ওয়েবসাইটের তথ্য দিন, অটো কোড জেনারেট হবে
          </p>
          <Input
            value={genApiKey}
            onChange={(e) => setGenApiKey(e.target.value)}
            placeholder="আপনার API Key পেস্ট করুন"
            className="h-9 text-[13px] font-mono"
          />
          <Input
            value={genForwardUrl}
            onChange={(e) => setGenForwardUrl(e.target.value)}
            placeholder="আপনার সাইটের URL — https://yoursite.com"
            className="h-9 text-[13px]"
          />
          <Input
            value={genCallbackUrl}
            onChange={(e) => setGenCallbackUrl(e.target.value)}
            placeholder="Callback URL — https://yoursite.com/api/topup/callback"
            className="h-9 text-[13px]"
          />
          <Button onClick={handleGenerate} className="w-full h-9 text-[13px] font-bold">
            ⚡ কোড জেনারেট করুন
          </Button>
        </div>

        {/* Generated Code */}
        {showGenerated && (
          <>
            {/* OrderController.php */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-bold text-foreground flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" /> OrderController.php
                </h2>
                <button
                  onClick={() => copyText(orderControllerCode)}
                  className="text-[11px] text-primary font-bold flex items-center gap-1 active:opacity-60"
                >
                  <Copy className="w-3 h-3" /> কপি
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                এই কোডটি আপনার Laravel প্রজেক্টের <code className="text-primary">app/Http/Controllers/</code> ফোল্ডারে রাখুন
              </p>
              <div className="bg-secondary rounded-lg p-3 max-h-[250px] overflow-auto">
                <pre className="text-[9px] text-foreground font-mono whitespace-pre-wrap">{orderControllerCode}</pre>
              </div>
            </div>

            {/* AutoTopupController.php (Callback) */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-bold text-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" /> AutoTopupController.php
                </h2>
                <button
                  onClick={() => copyText(callbackControllerCode)}
                  className="text-[11px] text-primary font-bold flex items-center gap-1 active:opacity-60"
                >
                  <Copy className="w-3 h-3" /> কপি
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Callback রিসিভার — অর্ডার complete/cancel হলে এখানে নোটিফিকেশন আসবে
              </p>
              <div className="bg-secondary rounded-lg p-3 max-h-[250px] overflow-auto">
                <pre className="text-[9px] text-foreground font-mono whitespace-pre-wrap">{callbackControllerCode}</pre>
              </div>

              {/* Callback data info */}
              <div className="bg-primary/5 rounded-lg p-3 space-y-1">
                <p className="text-[11px] font-bold text-foreground">📦 Callback এ যা যা আসবে:</p>
                <div className="space-y-0.5">
                  {[
                    { key: "order_id", desc: "আমাদের সিস্টেমের অর্ডার ID" },
                    { key: "external_order_id", desc: "আপনার সিস্টেমের অর্ডার ID" },
                    { key: "status", desc: "completed / cancelled" },
                    { key: "product_name", desc: "প্রোডাক্টের নাম" },
                    { key: "package_name", desc: "প্যাকেজের নাম" },
                    { key: "game_id", desc: "গেম আইডি" },
                    { key: "amount", desc: "টাকার পরিমাণ" },
                  ].map((item) => (
                    <div key={item.key} className="flex gap-2 text-[10px]">
                      <code className="text-primary font-mono min-w-[120px]">{item.key}</code>
                      <span className="text-muted-foreground">— {item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Routes */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-bold text-foreground">📁 routes/api.php</h2>
                <button
                  onClick={() => copyText(routesCode)}
                  className="text-[11px] text-primary font-bold flex items-center gap-1 active:opacity-60"
                >
                  <Copy className="w-3 h-3" /> কপি
                </button>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <pre className="text-[10px] text-foreground font-mono whitespace-pre-wrap">{routesCode}</pre>
              </div>
            </div>
          </>
        )}

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

        {/* How it works */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-[14px] font-bold text-foreground">🔄 কিভাবে কাজ করে?</h2>
          <div className="space-y-2">
            {[
              "API Key তৈরি করুন ও Callback URL সেট করুন",
              "আপনার তথ্য দিয়ে কোড জেনারেট করুন",
              "OrderController.php বসান — অর্ডার আমাদের সাইটে ফরওয়ার্ড হবে",
              "AutoTopupController.php বসান — অর্ডার complete হলে callback আসবে",
              "routes/api.php তে routes যোগ করুন — ব্যাস, সেটআপ শেষ!",
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

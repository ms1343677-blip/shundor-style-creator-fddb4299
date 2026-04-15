import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Key, Code, Send, CheckCircle, Wallet, AlertTriangle, ScrollText, RefreshCw } from "lucide-react";

const Docs = () => {
  const { user, isReady } = useAuth();
  const navigate = useNavigate();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "";
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/external-order`;

  useEffect(() => {
    if (isReady && !user) navigate("/login");
  }, [isReady, user]);

  useEffect(() => {
    if (user) fetchApp();
  }, [user]);

  const fetchApp = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("developer_apps")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    setApp(data);
    setLoading(false);
  };

  const createApp = async () => {
    setCreating(true);
    const { error } = await supabase.from("developer_apps").insert({
      user_id: user!.id,
      app_name: "API Key",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ API Key তৈরি হয়েছে!" });
      fetchApp();
    }
    setCreating(false);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "📋 কপি হয়েছে!" });
  };

  const apiKey = app?.api_key || "YOUR_API_KEY";

  // ===== Generated Code =====
  const orderControllerCode = `<?php
// app/Http/Controllers/OrderController.php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Http;

class OrderController extends Controller
{
    private \\$apiUrl = '${baseUrl}';
    private \\$apiKey = '${apiKey}';
    private \\$callbackUrl = 'https://yoursite.com/api/topup/callback'; // আপনার callback URL

    /**
     * অর্ডার ফরওয়ার্ড — আপনার সাইট থেকে TopUpYYY তে পাঠান
     * ব্যালেন্স থেকে টাকা অটো কাটবে
     * অর্ডার complete/cancel হলে callback_url এ POST আসবে
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

        // callback_url যোগ করুন — এই URL-এ অর্ডার আপডেট আসবে
        \\$validated['callback_url'] = \\$this->callbackUrl;

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

    /**
     * ব্যালেন্স চেক
     */
    public function checkBalance()
    {
        \\$response = Http::withHeaders([
            'x-api-key' => \\$this->apiKey,
        ])->get(\\$this->apiUrl . '/balance');

        return \\$response->json();
    }
}`;

  const callbackControllerCode = `<?php
// app/Http/Controllers/AutoTopupController.php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Log;

class AutoTopupController extends Controller
{
    /**
     * TopUpYYY থেকে Callback আসবে এখানে
     * অর্ডার complete বা cancelled হলে POST আসবে
     */
    public function handleCallback(Request \\$request)
    {
        \\$data = \\$request->all();

        /*
         * Callback Data:
         * ────────────────────────────────
         * order_id          → TopUpYYY অর্ডার ID
         * external_order_id → আপনার সিস্টেমের অর্ডার ID
         * status            → "completed" বা "cancelled"
         * product_name      → প্রোডাক্ট (যেমন: Free Fire Diamond)
         * package_name      → প্যাকেজ (যেমন: 100 Diamond)
         * game_id           → গেম/প্লেয়ার আইডি
         * amount            → টাকা
         */

        Log::info('TopUp Callback:', \\$data);

        // আপনার ডাটাবেসে অর্ডার আপডেট করুন:
        // \\$order = Order::where('id', \\$data['external_order_id'])->first();
        // if (\\$order) {
        //     \\$order->update([
        //         'status' => \\$data['status'],
        //         'topup_order_id' => \\$data['order_id'],
        //     ]);
        //     
        //     // cancelled হলে কাস্টমারকে রিফান্ড দিন
        //     if (\\$data['status'] === 'cancelled') {
        //         \\$order->user->increment('balance', \\$data['amount']);
        //     }
        // }

        return response()->json(['received' => true]);
    }
}`;

  const routesCode = `// routes/api.php

use App\\Http\\Controllers\\OrderController;
use App\\Http\\Controllers\\AutoTopupController;

// অর্ডার ফরওয়ার্ড ও স্ট্যাটাস
Route::post('/order/forward', [OrderController::class, 'forwardOrder']);
Route::get('/order/status/{orderId}', [OrderController::class, 'checkStatus']);
Route::get('/order/balance', [OrderController::class, 'checkBalance']);

// Callback রিসিভ (TopUpYYY থেকে POST আসবে)
Route::post('/topup/callback', [AutoTopupController::class, 'handleCallback']);`;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-black text-foreground">📄 API Documentation</h1>
          <p className="text-[12px] text-muted-foreground">আপনার ওয়েবসাইট থেকে আমাদের সাইটে অর্ডার ফরওয়ার্ড করুন</p>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[11px] text-muted-foreground space-y-1">
            <p className="font-bold text-foreground">⚡ কিভাবে কাজ করে?</p>
            <p>• প্রথমে আপনার একাউন্টে <span className="text-primary font-bold">ব্যালেন্স ডিপোজিট</span> করুন</p>
            <p>• প্রতিটা অর্ডারে প্রোডাক্টের দাম অনুযায়ী <span className="text-primary font-bold">ব্যালেন্স থেকে কাটবে</span></p>
            <p>• অর্ডার complete/cancel হলে আপনার সাইটে <span className="text-primary font-bold">callback</span> যাবে</p>
            <p>• Cancel হলে ব্যালেন্স <span className="text-primary font-bold">অটো রিফান্ড</span> হবে</p>
          </div>
        </div>

        {/* Step 1: API Key */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-[14px] font-bold text-foreground flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" /> ১. আপনার Secret Key
          </h2>

          {loading ? (
            <p className="text-[12px] text-muted-foreground">লোড হচ্ছে...</p>
          ) : app ? (
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground mb-1">আপনার Secret Key (একটি মাত্র):</p>
              <div className="flex items-center gap-2">
                <code className="text-[10px] text-primary font-mono flex-1 break-all">{app.api_key}</code>
                <button onClick={() => copyText(app.api_key)} className="p-1 active:opacity-60">
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ) : (
            <Button onClick={createApp} disabled={creating} className="w-full h-9 text-[13px] font-bold">
              {creating ? "তৈরি হচ্ছে..." : "🔑 Secret Key Generate করুন"}
            </Button>
          )}
        </div>

        {/* Step 2: Setup Instructions */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-[14px] font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" /> ২. সেটআপ করতে যা লাগবে
          </h2>
          <div className="space-y-2">
            {[
              { label: "একাউন্ট তৈরি ও লগইন", desc: "আমাদের সাইটে একাউন্ট করুন (ইমেইল/গুগল)" },
              { label: "ব্যালেন্স ডিপোজিট", desc: "একাউন্টে টাকা যোগ করুন (bKash/Nagad)" },
              { label: "Secret Key নিন", desc: "উপরে থেকে আপনার Secret Key কপি করুন" },
              { label: "Callback URL সেট করুন", desc: "আপনার সাইটের callback URL দিন" },
              { label: "কোড বসান", desc: "নিচের কোড আপনার Laravel প্রজেক্টে বসান" },
            ].map((item, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-[10px] bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[12px] font-bold text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
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

        {/* Show/Hide Code */}
        <Button
          variant={showCode ? "secondary" : "default"}
          onClick={() => setShowCode(!showCode)}
          className="w-full h-9 text-[13px] font-bold"
        >
          <Code className="w-4 h-4 mr-2" />
          {showCode ? "কোড লুকান" : "⚡ Laravel কোড দেখুন"}
        </Button>

        {showCode && (
          <>
            {/* API Endpoints Summary */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <h2 className="text-[14px] font-bold text-foreground flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" /> API Endpoints
              </h2>
              <div className="space-y-2">
                {[
                  { method: "POST", path: "/create", desc: "অর্ডার তৈরি (ব্যালেন্স থেকে কাটবে)" },
                  { method: "GET", path: "/status?order_id=xxx", desc: "অর্ডার স্ট্যাটাস চেক" },
                  { method: "GET", path: "/balance", desc: "ব্যালেন্স চেক" },
                  { method: "POST", path: "→ আপনার callback URL", desc: "অর্ডার আপডেট (complete/cancel)" },
                ].map((ep, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${ep.method === "POST" ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"}`}>
                      {ep.method}
                    </span>
                    <code className="text-[10px] font-mono text-foreground">{ep.path}</code>
                    <span className="text-[10px] text-muted-foreground">— {ep.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* OrderController.php */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-foreground">📁 OrderController.php</h3>
                <button onClick={() => copyText(orderControllerCode)} className="text-[11px] text-primary font-bold flex items-center gap-1">
                  <Copy className="w-3 h-3" /> কপি
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">app/Http/Controllers/ ফোল্ডারে রাখুন</p>
              <div className="bg-secondary rounded-lg p-3 max-h-[200px] overflow-auto">
                <pre className="text-[9px] text-foreground font-mono whitespace-pre-wrap">{orderControllerCode}</pre>
              </div>
            </div>

            {/* AutoTopupController.php */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" /> AutoTopupController.php
                </h3>
                <button onClick={() => copyText(callbackControllerCode)} className="text-[11px] text-primary font-bold flex items-center gap-1">
                  <Copy className="w-3 h-3" /> কপি
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">Callback রিসিভার — অর্ডার complete/cancel হলে এখানে আসবে</p>
              <div className="bg-secondary rounded-lg p-3 max-h-[200px] overflow-auto">
                <pre className="text-[9px] text-foreground font-mono whitespace-pre-wrap">{callbackControllerCode}</pre>
              </div>

              {/* Callback data */}
              <div className="bg-primary/5 rounded-lg p-3 space-y-1">
                <p className="text-[10px] font-bold text-foreground">📦 Callback এ যা আসবে:</p>
                {[
                  { key: "order_id", desc: "আমাদের অর্ডার ID" },
                  { key: "external_order_id", desc: "আপনার অর্ডার ID" },
                  { key: "status", desc: "completed / cancelled" },
                  { key: "product_name", desc: "প্রোডাক্ট নাম" },
                  { key: "package_name", desc: "প্যাকেজ নাম" },
                  { key: "game_id", desc: "গেম আইডি" },
                  { key: "amount", desc: "টাকা" },
                ].map((item) => (
                  <div key={item.key} className="flex gap-2 text-[9px]">
                    <code className="text-primary font-mono min-w-[110px]">{item.key}</code>
                    <span className="text-muted-foreground">— {item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Routes */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-foreground">📁 routes/api.php</h3>
                <button onClick={() => copyText(routesCode)} className="text-[11px] text-primary font-bold flex items-center gap-1">
                  <Copy className="w-3 h-3" /> কপি
                </button>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <pre className="text-[9px] text-foreground font-mono whitespace-pre-wrap">{routesCode}</pre>
              </div>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Docs;

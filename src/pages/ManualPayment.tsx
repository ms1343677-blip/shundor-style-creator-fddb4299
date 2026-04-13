import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { Loader2, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ManualPayment = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const [trxId, setTrxId] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const amount = params.get("amount") || "0";
  const productId = params.get("product_id");
  const packageId = params.get("package_id");
  const gameId = params.get("game_id");
  const type = params.get("type") || "payment";

  const bkashNumber = settings?.bkash_number || "";
  const nagadNumber = settings?.nagad_number || "";

  const copyNumber = (num: string, label: string) => {
    navigator.clipboard.writeText(num);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: `${label} নাম্বার কপি হয়েছে` });
  };

  const handleVerify = async () => {
    if (!user) { navigate("/login"); return; }
    if (!trxId.trim()) {
      toast({ title: "Transaction ID দিন", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-manual-payment", {
        body: {
          transaction_id: trxId.trim(),
          amount: parseFloat(amount),
          product_id: productId,
          package_id: packageId,
          game_id: gameId,
          type,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "✅ " + (data?.message || "সফল!") });
      if (type === "add_money") navigate("/add-money");
      else navigate("/orders");
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-14">
      <Header />
      <div className="max-w-lg mx-auto px-3 py-4 space-y-3">
        {/* Amount Card */}
        <div className="bg-nav rounded-xl p-4 text-center">
          <p className="text-[11px] text-nav-foreground/60">পেমেন্ট করুন</p>
          <p className="text-3xl font-black text-nav-foreground">৳{amount}</p>
        </div>

        {/* Payment Numbers */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-[14px] font-bold text-foreground">📱 নিচের নাম্বারে Send Money করুন</h2>

          {bkashNumber && (
            <div className="flex items-center justify-between bg-[#E2136E]/10 rounded-lg px-4 py-3">
              <div>
                <p className="text-[11px] font-bold text-[#E2136E]">bKash</p>
                <p className="text-[16px] font-black text-foreground">{bkashNumber}</p>
              </div>
              <button
                onClick={() => copyNumber(bkashNumber, "bKash")}
                className="p-2 rounded-lg bg-[#E2136E]/20 active:opacity-75"
              >
                {copied === "bKash" ? <CheckCircle2 className="w-5 h-5 text-[#E2136E]" /> : <Copy className="w-5 h-5 text-[#E2136E]" />}
              </button>
            </div>
          )}

          {nagadNumber && (
            <div className="flex items-center justify-between bg-[#F6921E]/10 rounded-lg px-4 py-3">
              <div>
                <p className="text-[11px] font-bold text-[#F6921E]">Nagad</p>
                <p className="text-[16px] font-black text-foreground">{nagadNumber}</p>
              </div>
              <button
                onClick={() => copyNumber(nagadNumber, "Nagad")}
                className="p-2 rounded-lg bg-[#F6921E]/20 active:opacity-75"
              >
                {copied === "Nagad" ? <CheckCircle2 className="w-5 h-5 text-[#F6921E]" /> : <Copy className="w-5 h-5 text-[#F6921E]" />}
              </button>
            </div>
          )}
        </div>

        {/* Transaction ID Input */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-[14px] font-bold text-foreground">🔑 Transaction ID দিন</h2>
          <p className="text-[11px] text-muted-foreground">
            Send Money করার পর যে Transaction ID পাবেন সেটা নিচে লিখুন
          </p>
          <Input
            placeholder="যেমন: TrxID ABC123XYZ"
            value={trxId}
            onChange={(e) => setTrxId(e.target.value)}
            className="text-[14px] h-12 font-mono"
          />
          <button
            onClick={handleVerify}
            disabled={loading || !trxId.trim()}
            className="w-full bg-primary text-primary-foreground h-12 rounded-xl text-[14px] font-bold active:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "ভেরিফাই হচ্ছে..." : "✅ Verify & Confirm"}
          </button>
        </div>

        {/* Rules */}
        <div className="bg-card rounded-xl border border-border p-3">
          <h3 className="text-[13px] font-bold text-foreground mb-2">📋 নিয়মাবলী</h3>
          <div className="space-y-1 text-[11px] text-muted-foreground">
            <p>◉ শুধুমাত্র Send Money করুন (Cash Out নয়)</p>
            <p>◉ সঠিক Amount পাঠান, না হলে ভেরিফাই হবে না</p>
            <p>◉ Transaction ID সঠিকভাবে দিন</p>
            <p>◉ একই Transaction ID দুইবার ব্যবহার করা যাবে না</p>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default ManualPayment;

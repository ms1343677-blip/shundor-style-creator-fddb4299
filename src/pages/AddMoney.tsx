import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Wallet, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const presets = [50, 100, 200, 500, 1000, 2000];

const AddMoney = () => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      await supabase.rpc("ensure_wallet");
      const { data, error } = await supabase.from("wallets").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleAddMoney = async () => {
    if (!user) { navigate("/login"); return; }
    const amt = parseFloat(amount);
    if (!amt || amt < 10) { toast({ title: "ন্যূনতম ১০ টাকা দিন", variant: "destructive" }); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("uddoktapay", {
        body: { amount: amt, type: "add_money", redirect_url: window.location.origin },
      });
      if (error) throw error;
      if (data?.payment_url) window.location.href = data.payment_url;
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
        {/* Balance Card */}
        <div className="bg-nav rounded-xl p-4 text-center">
          <Wallet className="w-8 h-8 text-primary mx-auto mb-1" />
          <p className="text-[11px] text-nav-foreground/60 font-medium">Current Balance</p>
          <p className="text-2xl font-black text-nav-foreground">৳{wallet?.balance?.toFixed(2) || "0.00"}</p>
        </div>

        {/* Add Money */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h2 className="text-[14px] font-bold text-foreground mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> Add Money
          </h2>

          {/* Preset amounts */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(String(p))}
                className={`border rounded-lg py-2 text-[13px] font-semibold active:opacity-75 ${
                  amount === String(p) ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground"
                }`}
              >
                ৳{p}
              </button>
            ))}
          </div>

          <Input
            placeholder="অন্য পরিমাণ লিখুন (min ১০৳)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-[13px] h-10 mb-3"
          />

          <button
            onClick={handleAddMoney}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground h-11 rounded-xl text-[14px] font-bold active:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Processing..." : "Add Money"}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default AddMoney;

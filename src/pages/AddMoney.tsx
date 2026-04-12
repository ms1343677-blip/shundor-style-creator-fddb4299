import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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
      if (data?.payment_url) {
        window.location.href = data.payment_url;
      }
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm animate-fade-in">
          <h2 className="text-xl font-bold text-foreground mb-2">Add Money</h2>
          <p className="text-sm text-muted-foreground mb-4">বর্তমান ব্যালেন্স: <span className="text-primary font-bold">৳ {wallet?.balance?.toFixed(2) || "0.00"}</span></p>
          <div className="border-t border-border pt-4">
            <label className="text-sm font-semibold text-foreground mb-2 block">পরিমাণ লিখুন (ন্যূনতম ১০ টাকা)</label>
            <Input placeholder="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mb-4" />
            <Button onClick={handleAddMoney} disabled={loading} className="w-full bg-primary text-primary-foreground font-semibold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? "Processing..." : "Click Here To Add Money"}
            </Button>
          </div>
        </div>
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default AddMoney;

import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { RefreshCw, Info, Loader2, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "instant">("wallet");
  const [gameId, setGameId] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: product } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: packages } = useQuery({
    queryKey: ["packages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("product_id", id!)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: wallet, refetch: refetchWallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      await supabase.rpc("ensure_wallet");
      const { data, error } = await supabase.from("wallets").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const selectedPkg = packages?.find((p) => p.id === selectedPackage);

  const handleBuyNow = async () => {
    if (!user) { navigate("/login"); return; }
    if (!selectedPackage || !selectedPkg) { toast({ title: "প্যাকেজ সিলেক্ট করুন", variant: "destructive" }); return; }
    if (!gameId.trim()) { toast({ title: "গেম আইডি দিন", variant: "destructive" }); return; }

    setLoading(true);
    try {
      if (paymentMethod === "wallet") {
        if (!wallet || wallet.balance < selectedPkg.price) {
          toast({ title: "ব্যালেন্স অপর্যাপ্ত", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.functions.invoke("wallet-order", {
          body: { product_id: id, package_id: selectedPackage, game_id: gameId },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        toast({ title: "অর্ডার সফল! ✅" });
        refetchWallet();
        navigate("/orders");
      } else {
        // Navigate to manual payment page
        const params = new URLSearchParams({
          amount: String(selectedPkg.price),
          product_id: id!,
          package_id: selectedPackage,
          game_id: gameId,
          type: "payment",
        });
        navigate(`/manual-payment?${params.toString()}`);
        return;
      }
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-14">
      <Header />
      <div className="max-w-lg mx-auto px-3 py-3 space-y-2.5">
        {/* Product header */}
        {product && (
          <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
            {product.image_url && (
              <img src={product.image_url} alt={product.name} className="w-14 h-14 rounded-lg object-cover" />
            )}
            <div>
              <h1 className="text-base font-bold text-foreground">{product.name}</h1>
              <p className="text-[11px] text-muted-foreground">{product.category} · {product.sub_category}</p>
            </div>
          </div>
        )}

        {/* Step 1 */}
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-5 h-5 rounded bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold">1</span>
            <h2 className="text-[13px] font-bold text-foreground">Select Recharge</h2>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {packages?.map((pkg) => {
              const sel = selectedPackage === pkg.id;
              return (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`border rounded-lg px-3 py-2.5 text-left active:opacity-75 ${
                    sel ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[12px] text-foreground font-medium truncate">{pkg.name}</span>
                    {sel && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </div>
                  <span className="text-[13px] font-bold text-primary">{pkg.price}৳</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-5 h-5 rounded bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold">2</span>
            <h2 className="text-[13px] font-bold text-foreground">Game ID</h2>
          </div>
          <Input
            placeholder="এখানে গেমের আইডি দিন"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="text-[13px] h-10"
          />
        </div>

        {/* Step 3 */}
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-5 h-5 rounded bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold">3</span>
            <h2 className="text-[13px] font-bold text-foreground">Payment</h2>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {[
              { key: "wallet" as const, label: "Wallet Pay", emoji: "💰" },
              { key: "instant" as const, label: "Instant Pay", emoji: "⚡" },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => setPaymentMethod(m.key)}
                className={`border rounded-lg py-3 text-center active:opacity-75 ${
                  paymentMethod === m.key ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <span className="text-lg">{m.emoji}</span>
                <p className="text-[12px] font-bold text-foreground mt-0.5">{m.label}</p>
              </button>
            ))}
          </div>

          {paymentMethod === "wallet" && (
            <div className="bg-secondary rounded-lg px-3 py-2 mb-3 flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Balance: <b className="text-primary">৳{wallet?.balance?.toFixed(0) || "0"}</b>
                <RefreshCw className="w-3 h-3 cursor-pointer ml-1" onClick={() => refetchWallet()} />
              </span>
              <span className="text-muted-foreground">Need: <b className="text-primary">৳{selectedPkg?.price || 0}</b></span>
            </div>
          )}

          {paymentMethod === "instant" && (
            <div className="bg-secondary rounded-lg px-3 py-2 mb-3 text-[12px] text-muted-foreground">
              <Info className="w-3.5 h-3.5 inline mr-1" /> Amount: <b className="text-primary">৳{selectedPkg?.price || 0}</b>
            </div>
          )}

          <button
            onClick={handleBuyNow}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground h-11 rounded-xl text-[14px] font-bold active:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Processing..." : "Buy Now"}
          </button>
        </div>

        {/* Rules */}
        <div className="bg-card rounded-xl border border-border p-3">
          <h3 className="text-[13px] font-bold text-foreground mb-2">📋 Rules</h3>
          <div className="space-y-1 text-[11px] text-muted-foreground">
            <p>◉ শুধুমাত্র Bangladesh সার্ভারে ID Code দিয়ে টপ আপ হবে</p>
            <p>◉ Player ID ভুল দিলে কর্তৃপক্ষ দায়ী নয়</p>
            <p>◉ Cancel হলে হিস্টোরিতে কারণ দেখুন</p>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default ProductDetail;

import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
          toast({ title: "ব্যালেন্স অপর্যাপ্ত", description: "আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.functions.invoke("wallet-order", {
          body: { product_id: id, package_id: selectedPackage, game_id: gameId },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        toast({ title: "অর্ডার সফল! ✅", description: "আপনার অর্ডার সফলভাবে প্লেস হয়েছে।" });
        refetchWallet();
        navigate("/orders");
      } else {
        const { data, error } = await supabase.functions.invoke("uddoktapay", {
          body: {
            amount: selectedPkg.price,
            product_id: id,
            package_id: selectedPackage,
            game_id: gameId,
            type: "payment",
            redirect_url: window.location.origin,
          },
        });
        if (error) throw error;
        if (data?.payment_url) {
          window.location.href = data.payment_url;
        } else {
          throw new Error("Payment URL not received");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: "ত্রুটি", description: err.message || "কিছু ভুল হয়েছে", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-14">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Product Info */}
        {product && (
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            {product.image_url && (
              <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
            )}
            <div>
              <h1 className="text-lg font-bold text-foreground">{product.name}</h1>
              <p className="text-xs text-muted-foreground">{product.category} · {product.sub_category}</p>
            </div>
          </div>
        )}

        {/* Step 1: Select Package */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
            <h2 className="text-sm font-bold text-foreground">Select Recharge</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {packages?.map((pkg) => {
              const isSelected = selectedPackage === pkg.id;
              return (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`border rounded-lg p-3 text-left active:scale-[0.97] ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground font-medium">{pkg.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <span className="text-sm font-bold text-primary mt-0.5 block">{pkg.price}৳</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Game ID */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
            <h2 className="text-sm font-bold text-foreground">Account Info</h2>
          </div>
          <Input
            placeholder="এখানে গেমের আইডি কোড দিন"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="text-sm"
          />
        </div>

        {/* Step 3: Payment */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
            <h2 className="text-sm font-bold text-foreground">Payment Method</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setPaymentMethod("wallet")}
              className={`border rounded-lg p-3 text-center active:scale-[0.97] ${
                paymentMethod === "wallet" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
              }`}
            >
              <span className="text-xl">💰</span>
              <p className="text-xs font-semibold text-foreground mt-1">Wallet Pay</p>
            </button>
            <button
              onClick={() => setPaymentMethod("instant")}
              className={`border rounded-lg p-3 text-center active:scale-[0.97] ${
                paymentMethod === "instant" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
              }`}
            >
              <span className="text-xl">⚡</span>
              <p className="text-xs font-semibold text-foreground mt-1">Instant Pay</p>
            </button>
          </div>

          {paymentMethod === "wallet" && (
            <div className="space-y-1.5 mb-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Balance: <span className="text-primary font-bold">৳{wallet?.balance?.toFixed(2) || "0.00"}</span>
                <RefreshCw className="w-3 h-3 cursor-pointer active:scale-95" onClick={() => refetchWallet()} />
              </div>
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Required: <span className="text-primary font-bold">৳{selectedPkg?.price || 0}</span>
              </div>
            </div>
          )}

          {paymentMethod === "instant" && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
              <Info className="w-3.5 h-3.5" /> UddoktaPay — <span className="text-primary font-bold">৳{selectedPkg?.price || 0}</span>
            </div>
          )}

          <Button
            onClick={handleBuyNow}
            disabled={loading}
            className="w-full font-semibold text-sm py-5 active:scale-[0.98]"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {loading ? "Processing..." : "Buy Now"}
          </Button>
        </div>

        {/* Rules */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold text-foreground mb-2">📋 Rules</h3>
          <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
            <p>◉ শুধুমাত্র Bangladesh সার্ভারে ID Code দিয়ে টপ আপ হবে</p>
            <p>◉ Player ID ভুল দিয়ে Diamond না পেলে কর্তৃপক্ষ দায়ী নয়</p>
            <p>◉ অর্ডার Cancel হলে কারণ হিস্টোরিতে দেখুন</p>
          </div>
        </div>
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default ProductDetail;

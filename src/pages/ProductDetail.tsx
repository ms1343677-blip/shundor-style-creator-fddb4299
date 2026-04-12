import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Info, ExternalLink } from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "instant">("wallet");
  const [gameId, setGameId] = useState("");

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

  const selectedPkg = packages?.find((p) => p.id === selectedPackage);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Product Header */}
        {product && (
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 shadow-sm animate-fade-in">
            {product.image_url && (
              <img src={product.image_url} alt={product.name} className="w-20 h-20 rounded-lg object-cover" />
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
              <p className="text-sm text-muted-foreground">
                {product.category} / {product.sub_category}
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Select Recharge */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm animate-slide-up">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</span>
            Select Recharge
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {packages?.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`border rounded-lg p-3 text-left transition-all ${
                  selectedPackage === pkg.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{pkg.name}</span>
                  <span className="text-sm font-bold text-primary">{pkg.price} TK</span>
                </div>
              </button>
            ))}
          </div>
          <button className="mt-3 text-sm text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors">
            <ExternalLink className="w-4 h-4" /> কিভাবে অর্ডার করবেন? →
          </button>
        </div>

        {/* Step 2: Account Info */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</span>
            Account Info
          </h2>
          <label className="text-sm font-semibold text-foreground mb-2 block">এখানে গেমের আইডি কোড দিন</label>
          <Input
            placeholder="এখানে গেমের আইডি কোড দিন"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="mb-3"
          />
          <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5">
            আপনার গেম আইডির নাম চেক করুন
          </Button>
        </div>

        {/* Step 3: Payment */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</span>
            Select one option
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setPaymentMethod("wallet")}
              className={`border rounded-lg p-4 text-center transition-all ${
                paymentMethod === "wallet"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border"
              }`}
            >
              <span className="text-2xl">💰</span>
              <p className="text-sm font-medium text-foreground mt-1">Wallet Pay</p>
            </button>
            <button
              onClick={() => setPaymentMethod("instant")}
              className={`border rounded-lg p-4 text-center transition-all ${
                paymentMethod === "instant"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border"
              }`}
            >
              <span className="text-2xl">⚡</span>
              <p className="text-sm font-medium text-primary mt-1">Auto Payment</p>
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Info className="w-4 h-4" /> আপনার অ্যাকাউন্ট ব্যালেন্স <span className="text-primary font-bold">৳ 0.00</span>
            <RefreshCw className="w-3.5 h-3.5 cursor-pointer" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Info className="w-4 h-4" /> প্রোডাস্ট কিনতে আপনার প্রয়োজন <span className="text-primary font-bold">৳ {selectedPkg?.price || 0}</span>
          </div>

          <Button className="w-full bg-primary text-primary-foreground font-semibold text-base py-5">
            Buy Now
          </Button>
        </div>

        {/* Rules */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
            📋 Rules & Conditions
          </h3>
          <div className="space-y-3 text-sm text-foreground leading-relaxed">
            <p>◉ শুধুমাত্র Bangladesh সার্ভারে ID Code দিয়ে টপ আপ হবে</p>
            <p>◉ Player ID ভুল দিয়ে Diamond না পেলে TopUp Buzz কর্তৃপক্ষ দায়ী নয়</p>
            <p>◉ Order কমপ্লিট হওয়ার পরেও আইডিতে ডাইমন্ড না গেলে চেক করার জন্য ID Pass দিতে হবে</p>
            <p>◉ অর্ডার Cancel হলে কি কারণে তা Cancel হয়েছে তা অর্ডার হিস্টোরিতে দেওয়া থাকে অনুগ্রহ পূর্বক দেখে পুনরায় সঠিক তথ্য দিয়ে অর্ডার করবেন।</p>
          </div>
        </div>
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default ProductDetail;

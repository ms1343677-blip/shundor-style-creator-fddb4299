import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, ShoppingBag, RefreshCw } from "lucide-react";

const Profile = () => {
  const { user, isReady } = useAuth();

  const { data: wallet, refetch } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      await supabase.rpc("ensure_wallet");
      const { data, error } = await supabase.from("wallets").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: orderCount } = useQuery({
    queryKey: ["order-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  if (!isReady) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">Loading...</div>;

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background pb-14">
      <Header />
      <div className="max-w-lg mx-auto px-3 py-4 space-y-3">
        {/* Profile Card */}
        <div className="bg-nav rounded-xl p-4 text-center">
          <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground mx-auto mb-2 flex items-center justify-center text-xl font-black">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <p className="text-base font-bold text-nav-foreground">{displayName}</p>
          <p className="text-[11px] text-nav-foreground/50">{user?.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Balance</p>
              <p className="text-base font-black text-foreground flex items-center gap-1">
                ৳{wallet?.balance?.toFixed(0) || "0"}
                <RefreshCw className="w-3 h-3 text-muted-foreground cursor-pointer" onClick={() => refetch()} />
              </p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Orders</p>
              <p className="text-base font-black text-foreground">{orderCount ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
          {[
            { label: "Email", value: user?.email || "-" },
            { label: "Account", value: "Verified ✅" },
            { label: "Support Pin", value: "3984" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-3">
              <span className="text-[12px] text-muted-foreground">{row.label}</span>
              <span className="text-[12px] font-semibold text-foreground">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;

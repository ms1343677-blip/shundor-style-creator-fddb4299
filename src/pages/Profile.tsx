import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Wallet, ShoppingBag, RefreshCw } from "lucide-react";

const Profile = () => {
  const { user, isReady } = useAuth();
  const avatarUrl = user?.avatar_url || null;

  const { data: wallet, refetch } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => api.getWallet(),
    enabled: !!user,
  });

  const { data: orderData } = useQuery({
    queryKey: ["order-count"],
    queryFn: () => api.getOrderCount(),
    enabled: !!user,
  });

  if (!isReady) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">Loading...</div>;

  const displayName = user?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background pb-14">
      <Header />
      <div className="max-w-lg mx-auto px-3 py-4 space-y-3">
        <div className="bg-primary rounded-2xl p-5 text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden border-3 border-primary-foreground/30">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground text-xl font-black">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <p className="text-base font-bold text-primary-foreground">{displayName}</p>
          <p className="text-[11px] text-primary-foreground/60">{user?.email}</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-card rounded-2xl border border-border p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Balance</p>
              <p className="text-base font-black text-foreground flex items-center gap-1">
                ৳{wallet?.balance ? Number(wallet.balance).toFixed(0) : "0"}
                <RefreshCw className="w-3 h-3 text-muted-foreground cursor-pointer" onClick={() => refetch()} />
              </p>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Orders</p>
              <p className="text-base font-black text-foreground">{orderData?.count ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {[
            { label: "Email", value: user?.email || "-" },
            { label: "Account", value: "Verified ✅" },
            { label: "Support Pin", value: "3984" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-3.5">
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

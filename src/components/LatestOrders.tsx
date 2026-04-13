import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  completed: { label: "Completed", color: "bg-success text-success-foreground", icon: CheckCircle2 },
  processing: { label: "In Progress", color: "bg-primary text-primary-foreground", icon: Loader2 },
  pending: { label: "Pending", color: "bg-notice text-notice-foreground", icon: Clock },
  cancelled: { label: "Cancelled", color: "bg-destructive text-destructive-foreground", icon: Clock },
};

const LatestOrders = () => {
  const { data: orders } = useQuery({
    queryKey: ["latest-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(name), packages(name)")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      const userIds = [...new Set(data?.map((o: any) => o.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);
      const profileMap: Record<string, any> = {};
      profiles?.forEach((p: any) => { profileMap[p.user_id] = p; });

      // Fetch avatars from auth metadata via user_id
      const enriched = data?.map((o: any) => ({ ...o, profile: profileMap[o.user_id] || null })) || [];
      return enriched;
    },
    staleTime: 30_000,
  });

  // Fetch all user avatars
  const userIds = [...new Set(orders?.map((o: any) => o.user_id) || [])];
  
  const lastUpdated = orders?.[0]?.updated_at
    ? formatDistanceToNow(new Date(orders[0].updated_at), { locale: bn, addSuffix: true })
    : null;

  if (!orders?.length) return null;

  return (
    <section className="max-w-lg mx-auto px-3 py-4">
      <div className="bg-card rounded-2xl border border-border p-4">
        <h2 className="text-center text-[16px] font-black text-foreground mb-1">Latest Orders</h2>
        {lastUpdated && (
          <p className="text-center text-[11px] text-muted-foreground mb-4">
            সর্বশেষ আপডেট করা হয়েছে <span className="text-primary font-semibold">{lastUpdated}</span>
          </p>
        )}

        <div className="space-y-2.5">
          {orders.map((order: any) => {
            const profile = order.profile;
            const name = profile?.full_name || profile?.email?.split("@")[0] || "User";
            const initial = name.charAt(0).toUpperCase();
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            // Generate avatar from email using UI Avatars (works for all users)
            const email = profile?.email || "";
            const avatarUrl = email
              ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=80&bold=true`
              : null;

            return (
              <div key={order.id} className="bg-background rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/15 text-primary flex items-center justify-center text-sm font-black">
                      {initial}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-foreground truncate">{name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {order.packages?.name || order.products?.name} - ৳{order.amount}
                  </p>
                </div>
                <span className={`text-[10px] px-3 py-1.5 rounded-full font-bold ${status.color} shrink-0`}>
                  {status.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LatestOrders;

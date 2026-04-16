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
      const { data } = await supabase
        .from("orders")
        .select("*, products(name, image_url), packages(name), profiles!orders_user_id_fkey(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(10);
      return (data || []).map((o: any) => ({
        ...o,
        product_name: o.products?.name,
        package_name: o.packages?.name,
        full_name: o.profiles?.full_name,
        profile_email: o.profiles?.email,
      }));
    },
    staleTime: 30_000,
  });

  const orderList = orders || [];

  const lastUpdated = orderList[0]?.updated_at
    ? formatDistanceToNow(new Date(orderList[0].updated_at), { locale: bn, addSuffix: true })
    : null;

  if (!orderList.length) return null;

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
          {orderList.map((order: any) => {
            const name = order.full_name || order.profile_email?.split("@")[0] || "User";
            const status = statusConfig[order.status] || statusConfig.pending;
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=80&bold=true`;

            return (
              <div key={order.id} className="bg-background rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-foreground truncate">{name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {order.package_name || order.product_name} - ৳{order.amount}
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

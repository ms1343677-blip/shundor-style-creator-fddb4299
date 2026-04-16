import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Package, MessageSquare } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-notice text-notice-foreground" },
  processing: { label: "In Progress", color: "bg-primary text-primary-foreground" },
  completed: { label: "Completed", color: "bg-success text-success-foreground" },
  cancelled: { label: "Cancelled", color: "bg-destructive text-destructive-foreground" },
};

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => api.getOrders(),
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background pb-14">
      <Header />
      <div className="max-w-lg mx-auto px-3 py-4">
        <h2 className="text-center text-[16px] font-black text-foreground mb-4">My Orders</h2>
        {!orders?.length ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-[13px] text-muted-foreground mb-3">No orders yet</p>
            <button onClick={() => navigate("/")} className="bg-primary text-primary-foreground h-9 px-5 rounded-full text-[13px] font-bold active:opacity-80">
              Order Now
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {orders.map((order: any) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              return (
                <div key={order.id} className="bg-card rounded-2xl border border-border p-3.5">
                  <div className="flex items-center gap-3">
                    {order.product_image && (
                      <img src={order.product_image} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-foreground truncate">{order.product_name}</p>
                      <p className="text-[11px] text-muted-foreground">{order.package_name} · ৳{order.amount}</p>
                    </div>
                    <span className={`text-[10px] px-3 py-1.5 rounded-full font-bold ${status.color} shrink-0`}>
                      {status.label}
                    </span>
                  </div>
                  {order.delivery_message && (
                    <div className="mt-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <p className="text-[11px] text-foreground">{order.delivery_message}</p>
                    </div>
                  )}
                  <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                    <span>ID: {order.game_id}</span>
                    <span>{new Date(order.created_at).toLocaleDateString("bn-BD")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Orders;

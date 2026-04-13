import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Package } from "lucide-react";

const statusStyle: Record<string, string> = {
  pending: "bg-notice/20 text-notice-foreground",
  processing: "bg-primary/10 text-primary",
  completed: "bg-success/15 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(name, image_url), packages(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background pb-14">
      <Header />
      <div className="max-w-lg mx-auto px-3 py-4">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h2 className="text-[15px] font-bold text-foreground">My Orders</h2>
        </div>

        {!orders?.length ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-[13px] text-muted-foreground mb-3">No orders yet</p>
            <button
              onClick={() => navigate("/")}
              className="bg-primary text-primary-foreground h-9 px-5 rounded-lg text-[13px] font-bold active:opacity-80"
            >
              Order Now
            </button>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
            {orders.map((order: any) => (
              <div key={order.id} className="p-3">
                <div className="flex items-center gap-3">
                  {order.products?.image_url && (
                    <img src={order.products.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{order.products?.name}</p>
                    <p className="text-[11px] text-muted-foreground">{order.packages?.name} · ৳{order.amount}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${statusStyle[order.status] || "bg-muted text-muted-foreground"}`}>
                    {order.status}
                  </span>
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                  <span>ID: {order.game_id}</span>
                  <span>{new Date(order.created_at).toLocaleDateString("bn-BD")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Orders;

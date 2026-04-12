import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  processing: "bg-blue-500/10 text-blue-600",
  completed: "bg-green-500/10 text-green-600",
  cancelled: "bg-red-500/10 text-red-600",
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
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm animate-fade-in">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5" /> My Orders
          </h2>
          {!orders?.length ? (
            <div className="text-center py-10">
              <p className="text-foreground font-medium mb-3">No order data found!</p>
              <button onClick={() => navigate("/")} className="bg-destructive text-destructive-foreground px-6 py-2 rounded-lg text-sm font-semibold">
                ORDER NOW
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any) => (
                <div key={order.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    {order.products?.image_url && (
                      <img src={order.products.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{order.products?.name}</p>
                      <p className="text-xs text-muted-foreground">{order.packages?.name} • ৳{order.amount}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                    <span>ID: {order.game_id}</span>
                    <span>{new Date(order.created_at).toLocaleDateString("bn-BD")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Orders;

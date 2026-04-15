import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, XCircle, MessageSquare, ChevronDown, ChevronUp, Send, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const statusColors: Record<string, string> = {
  completed: "bg-success/15 text-success",
  cancelled: "bg-destructive/10 text-destructive",
  processing: "bg-primary/10 text-primary",
  pending: "bg-notice/20 text-notice-foreground",
};

const AdminOrdersTab = ({ orders, updateOrderStatus }: { orders: any[]; updateOrderStatus: any }) => {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [deliveryMsg, setDeliveryMsg] = useState("");

  const sendDeliveryMessage = async (orderId: string) => {
    if (!deliveryMsg.trim()) return;
    updateOrderStatus.mutate(
      { id: orderId, status: orders.find((o: any) => o.id === orderId)?.status || "pending", delivery_message: deliveryMsg },
      { onSuccess: () => { toast({ title: "মেসেজ পাঠানো হয়েছে ✅" }); setDeliveryMsg(""); } }
    );
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border">
        <h3 className="text-[13px] font-bold text-foreground">All Orders ({orders?.length || 0})</h3>
      </div>
      <div className="divide-y divide-border">
        {orders?.map((order: any) => {
          const isExpanded = expandedOrder === order.id;
          return (
            <div key={order.id} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground">{order.products?.name} — {order.packages?.name}</p>
                  <p className="text-[10px] text-muted-foreground">Game ID: {order.game_id} · ৳{order.amount} · {order.payment_method}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                  {order.delivery_message && (
                    <p className="text-[10px] text-primary mt-0.5 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {order.delivery_message}
                    </p>
                  )}
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${statusColors[order.status] || statusColors.pending}`}>
                  {order.status}
                </span>
                <div className="flex gap-1">
                  {order.status !== "completed" && (
                    <button onClick={() => updateOrderStatus.mutate({ id: order.id, status: "completed" })} className="p-1.5 active:bg-success/10 rounded-lg">
                      <Check className="w-4 h-4 text-success" />
                    </button>
                  )}
                  {order.status !== "cancelled" && (
                    <button onClick={() => updateOrderStatus.mutate({ id: order.id, status: "cancelled" })} className="p-1.5 active:bg-destructive/10 rounded-lg">
                      <XCircle className="w-4 h-4 text-destructive" />
                    </button>
                  )}
                  <button onClick={() => { setExpandedOrder(isExpanded ? null : order.id); setDeliveryMsg(order.delivery_message || ""); }} className="p-1.5 active:bg-secondary rounded-lg">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-2 space-y-2 bg-secondary rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-muted-foreground">Order ID:</span> <span className="text-foreground font-mono text-[10px]">{order.id.slice(0, 8)}...</span></div>
                    <div><span className="text-muted-foreground">TrxID:</span> <span className="text-foreground">{order.transaction_id || "N/A"}</span></div>
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-0.5 block">Delivery Message (ইউজারকে দেখাবে)</label>
                    <div className="flex gap-1.5">
                      <Input
                        value={deliveryMsg}
                        onChange={(e) => setDeliveryMsg(e.target.value)}
                        placeholder="ডেলিভারি মেসেজ লিখুন..."
                        className="h-8 text-[12px] flex-1"
                      />
                      <Button size="sm" className="h-8 px-3" onClick={() => sendDeliveryMessage(order.id)}>
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {["pending", "processing", "completed", "cancelled"].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateOrderStatus.mutate({ id: order.id, status: s })}
                        className={`text-[10px] px-2.5 py-1 rounded-md font-bold border active:opacity-75 ${
                          order.status === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!orders?.length && <div className="p-6 text-center text-muted-foreground text-[12px]">No orders</div>}
      </div>
    </div>
  );
};

export default AdminOrdersTab;

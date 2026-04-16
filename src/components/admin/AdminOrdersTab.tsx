import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, XCircle, MessageSquare, ChevronDown, ChevronUp, Send, Globe, Search, Trash2, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const statusConfig: Record<string, { label: string; color: string; bgCard: string }> = {
  pending: { label: "Pending", color: "bg-notice/20 text-notice-foreground", bgCard: "border-l-notice" },
  processing: { label: "Processing", color: "bg-primary/10 text-primary", bgCard: "border-l-primary" },
  completed: { label: "Completed", color: "bg-success/15 text-success", bgCard: "border-l-success" },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive", bgCard: "border-l-destructive" },
};

const AdminOrdersTab = ({ orders, updateOrderStatus, refetchOrders }: { orders: any[]; updateOrderStatus: any; refetchOrders?: () => void }) => {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [deliveryMsg, setDeliveryMsg] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Counts
  const counts = useMemo(() => {
    const c = { all: 0, pending: 0, processing: 0, completed: 0, cancelled: 0 };
    orders?.forEach((o: any) => {
      c.all++;
      if (c[o.status as keyof typeof c] !== undefined) c[o.status as keyof typeof c]++;
    });
    return c;
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let list = orders || [];
    if (activeFilter !== "all") list = list.filter((o: any) => o.status === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((o: any) =>
        o.game_id?.toLowerCase().includes(q) ||
        o.products?.name?.toLowerCase().includes(q) ||
        o.packages?.name?.toLowerCase().includes(q) ||
        o.id?.toLowerCase().includes(q) ||
        o.transaction_id?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, activeFilter, searchQuery]);

  const sendDeliveryMessage = async (orderId: string) => {
    if (!deliveryMsg.trim()) return;
    updateOrderStatus.mutate(
      { id: orderId, status: orders.find((o: any) => o.id === orderId)?.status || "pending", delivery_message: deliveryMsg },
      { onSuccess: () => { toast({ title: "মেসেজ পাঠানো হয়েছে ✅" }); setDeliveryMsg(""); } }
    );
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm("এই অর্ডারটি ডিলিট করতে চান?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) {
      toast({ title: "ডিলিট ফেইল!", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "অর্ডার ডিলিট হয়েছে ✅" });
      refetchOrders?.();
    }
  };

  const deleteAllByStatus = async (status: string) => {
    const count = orders?.filter((o: any) => o.status === status).length || 0;
    if (!count) return;
    if (!confirm(`${statusConfig[status]?.label || status} স্ট্যাটাসের ${count}টি অর্ডার ডিলিট করতে চান?`)) return;
    const ids = orders.filter((o: any) => o.status === status).map((o: any) => o.id);
    const { error } = await supabase.from("orders").delete().in("id", ids);
    if (error) {
      toast({ title: "ডিলিট ফেইল!", variant: "destructive" });
    } else {
      toast({ title: `${count}টি অর্ডার ডিলিট হয়েছে ✅` });
      refetchOrders?.();
    }
  };

  const filterTabs = [
    { key: "all", label: "All", count: counts.all, color: "bg-foreground/10 text-foreground" },
    { key: "pending", label: "Pending", count: counts.pending, color: statusConfig.pending.color },
    { key: "processing", label: "Processing", count: counts.processing, color: statusConfig.processing.color },
    { key: "completed", label: "Completed", count: counts.completed, color: statusConfig.completed.color },
    { key: "cancelled", label: "Cancelled", count: counts.cancelled, color: statusConfig.cancelled.color },
  ];

  return (
    <div className="space-y-3">
      {/* Status Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all shrink-0 ${
              activeFilter === tab.key
                ? `${tab.color} ring-2 ring-primary/30 shadow-sm`
                : "bg-card border border-border text-muted-foreground"
            }`}
          >
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeFilter === tab.key ? "bg-background/30" : "bg-muted"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Bulk Actions */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Game ID, Product, TrxID দিয়ে খুঁজুন..."
            className="h-9 text-[12px] pl-9"
          />
        </div>
        {activeFilter !== "all" && counts[activeFilter as keyof typeof counts] > 0 && (
          <Button
            variant="destructive"
            size="sm"
            className="h-9 text-[11px] shrink-0"
            onClick={() => deleteAllByStatus(activeFilter)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Delete All ({counts[activeFilter as keyof typeof counts]})
          </Button>
        )}
      </div>

      {/* Orders List */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-foreground">
            Orders ({filteredOrders.length})
          </h3>
        </div>
        <div className="divide-y divide-border">
          {filteredOrders.map((order: any) => {
            const isExpanded = expandedOrder === order.id;
            const status = statusConfig[order.status] || statusConfig.pending;
            return (
              <div key={order.id} className={`border-l-[3px] ${status.bgCard}`}>
                <div className="px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    {/* Product Image */}
                    {order.products?.image_url && (
                      <img src={order.products.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-bold text-foreground truncate">{order.products?.name || "Unknown"}</p>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${status.color} shrink-0`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        <span className="font-semibold text-foreground/80">{order.packages?.name || "—"}</span>
                        {" · "}৳{order.amount} · {order.payment_method}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span className="font-mono">ID: {order.game_id}</span>
                        <span>{new Date(order.created_at).toLocaleString("bn-BD", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      {order.source_url && (
                        <p className="text-[10px] text-blue-500 mt-0.5 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <a href={order.source_url} target="_blank" rel="noopener noreferrer" className="underline truncate max-w-[200px]">
                            {(() => { try { return new URL(order.source_url).hostname; } catch { return order.source_url; } })()}
                          </a>
                        </p>
                      )}
                      {order.delivery_message && (
                        <div className="mt-1.5 bg-primary/5 border border-primary/20 rounded-md px-2.5 py-1.5 flex items-start gap-1.5">
                          <MessageSquare className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                          <p className="text-[10px] text-foreground">{order.delivery_message}</p>
                        </div>
                      )}
                    </div>
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-1 shrink-0">
                      {order.status !== "completed" && (
                        <button onClick={() => updateOrderStatus.mutate({ id: order.id, status: "completed" })} className="p-1.5 active:bg-success/10 rounded-lg" title="Complete">
                          <Check className="w-4 h-4 text-success" />
                        </button>
                      )}
                      {order.status !== "cancelled" && (
                        <button onClick={() => updateOrderStatus.mutate({ id: order.id, status: "cancelled" })} className="p-1.5 active:bg-destructive/10 rounded-lg" title="Cancel">
                          <XCircle className="w-4 h-4 text-destructive" />
                        </button>
                      )}
                      <button onClick={() => deleteOrder(order.id)} className="p-1.5 active:bg-destructive/10 rounded-lg" title="Delete">
                        <Trash2 className="w-3.5 h-3.5 text-destructive/60" />
                      </button>
                      <button onClick={() => { setExpandedOrder(isExpanded ? null : order.id); setDeliveryMsg(order.delivery_message || ""); }} className="p-1.5 active:bg-secondary rounded-lg">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mx-4 mb-3 space-y-2 bg-secondary rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div><span className="text-muted-foreground">Order ID:</span> <span className="text-foreground font-mono text-[10px]">{order.id.slice(0, 8)}...</span></div>
                      <div><span className="text-muted-foreground">TrxID:</span> <span className="text-foreground">{order.transaction_id || "N/A"}</span></div>
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-0.5 block">Delivery Message</label>
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
          {!filteredOrders.length && (
            <div className="p-8 text-center">
              <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-[12px]">
                {searchQuery ? "কোনো অর্ডার পাওয়া যায়নি" : "No orders"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersTab;

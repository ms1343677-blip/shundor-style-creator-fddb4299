import { CheckCircle2 } from "lucide-react";

const orders = [
  { name: "Md alamgir Hossen", item: "Weekly 🟰 ৳154", avatar: "A" },
  { name: "MD siam", item: "Weekly 🟰 ৳154", avatar: "S" },
  { name: "MR SOHAN BARFI", item: "Monthly 🟰 ৳750", avatar: "S" },
  { name: "Arman Sordar", item: "25 Diamond 💎 ৳22", avatar: "A" },
  { name: "MD Siful", item: "1x Weekly Lite ৳43", avatar: "M" },
];

const LatestOrders = () => (
  <section className="max-w-lg mx-auto px-3 py-4">
    <div className="flex items-center gap-2 mb-3 px-1">
      <div className="w-1 h-4 bg-primary rounded-full" />
      <h2 className="text-[15px] font-bold text-foreground">Latest Orders</h2>
    </div>
    <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
      {orders.map((order, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
            {order.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">{order.name}</p>
            <p className="text-[11px] text-muted-foreground">{order.item}</p>
          </div>
          <div className="flex items-center gap-1 text-success shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">Done</span>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default LatestOrders;

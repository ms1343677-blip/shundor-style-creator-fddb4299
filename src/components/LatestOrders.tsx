import { CheckCircle } from "lucide-react";

const orders = [
  { name: "Md alamgir Hossen", item: "Weekly 🟰 - ৳154", avatar: "A" },
  { name: "MD siam", item: "Weekly 🟰 - ৳154", avatar: "S" },
  { name: "MR SOHAN BARFI", item: "Monthly 🟰 - ৳750", avatar: "S" },
  { name: "Arman Sordar", item: "25 Diamond 💎 - ৳22", avatar: "A" },
  { name: "MD Siful", item: "1x Weekly Lite - ৳43", avatar: "M" },
  { name: "MD Siful", item: "1x Weekly Lite - ৳43", avatar: "M" },
];

const LatestOrders = () => (
  <section className="px-4 py-5 max-w-lg mx-auto">
    <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
      <span className="w-1 h-5 bg-primary rounded-full" />
      Latest Orders
    </h2>
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {orders.map((order, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-4 py-3 ${i !== orders.length - 1 ? "border-b border-border" : ""}`}
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {order.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground truncate">{order.name}</p>
            <p className="text-xs text-muted-foreground">{order.item}</p>
          </div>
          <div className="flex items-center gap-1 text-success shrink-0">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold">Done</span>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default LatestOrders;

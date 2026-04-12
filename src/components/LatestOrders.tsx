const orders = [
  { name: "Md alamgir Hossen", item: "Weekly 🟰 - ৳154", avatar: "A" },
  { name: "MD siam", item: "Weekly 🟰 - ৳154", avatar: "S" },
  { name: "MR SOHAN BARFI", item: "Monthly 🟰 - ৳750", avatar: "S" },
  { name: "Arman Sordar", item: "25 Diamond 💎 - ৳22", avatar: "A" },
  { name: "MD Siful", item: "1x Weekly Lite - ৳43", avatar: "M" },
  { name: "MD Siful", item: "1x Weekly Lite - ৳43", avatar: "M" },
];

const LatestOrders = () => (
  <section className="px-4 py-6 max-w-lg mx-auto">
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
      <h2 className="text-lg font-bold text-center text-foreground mb-1">Latest Orders</h2>
      <p className="text-xs text-center text-muted-foreground mb-4">
        সর্বশেষ আপডেট করা হয়েছে <span className="text-primary font-semibold">10 মিনিট আগে</span>
      </p>
      <div className="space-y-3">
        {orders.map((order, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3 animate-slide-up"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {order.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{order.name}</p>
              <p className="text-xs text-muted-foreground">{order.item}</p>
            </div>
            <span className="text-xs bg-success text-success-foreground px-3 py-1 rounded-full font-medium shrink-0">
              Completed
            </span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default LatestOrders;

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Orders = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm animate-fade-in">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5" /> My Orders
          </h2>
          <div className="text-center py-10">
            <p className="text-foreground font-medium mb-3">No order data found !</p>
            <button
              onClick={() => navigate("/")}
              className="bg-destructive text-destructive-foreground px-6 py-2 rounded-lg text-sm font-semibold"
            >
              ORDER NOW
            </button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Orders;

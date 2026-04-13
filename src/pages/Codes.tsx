import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Grid2X2, Gift } from "lucide-react";

const Codes = () => (
  <div className="min-h-screen bg-background pb-14">
    <Header />
    <div className="max-w-lg mx-auto px-3 py-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h2 className="text-[15px] font-bold text-foreground">My Codes</h2>
        </div>
        <button className="bg-primary text-primary-foreground h-8 px-4 rounded-lg text-[12px] font-bold active:opacity-80">
          Redeem
        </button>
      </div>
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <Gift className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-[13px] text-muted-foreground">No codes available</p>
      </div>
    </div>
    <BottomNav />
  </div>
);

export default Codes;

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Grid2X2 } from "lucide-react";

const Codes = () => (
  <div className="min-h-screen bg-background pb-20">
    <Header />
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Grid2X2 className="w-5 h-5" /> My Codes
          </h2>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold">
            Redeem Code
          </button>
        </div>
        <div className="text-center py-10 text-muted-foreground text-sm">
          No codes available yet
        </div>
      </div>
    </div>
    <BottomNav />
  </div>
);

export default Codes;

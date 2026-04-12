import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { RefreshCw, ShieldCheck } from "lucide-react";

const stats = [
  { label: "Support Pin", value: "3984" },
  { label: "Weekly Spent", value: "0 ৳" },
  { label: "Total Spent", value: "0" },
  { label: "Total Order", value: "0" },
];

const Profile = () => (
  <div className="min-h-screen bg-background pb-20">
    <Header />
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="text-center mb-6 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-primary/20 border-4 border-primary/30 mx-auto mb-3 flex items-center justify-center text-primary text-3xl font-bold">
          U
        </div>
        <h2 className="text-lg font-bold text-primary">Hi, MD Siful Gaming</h2>
        <p className="text-sm text-foreground font-medium flex items-center justify-center gap-2 mt-1">
          Available Balance : 0 Tk <RefreshCw className="w-4 h-4 text-muted-foreground cursor-pointer" />
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
            <p className="text-lg font-bold text-primary">{s.value}</p>
            <p className="text-sm text-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-5 shadow-sm animate-slide-up">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          🔒 Account Information
        </h3>
        <div className="text-center space-y-4">
          <div className="border border-border rounded-lg p-4">
            <div className="bg-primary text-primary-foreground rounded-lg py-2 px-6 inline-block text-sm font-semibold mb-2">
              0.00৳
            </div>
            <p className="font-bold text-foreground">Available Balance</p>
          </div>
          <div className="border border-border rounded-lg p-4 flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-blue-500" />
          </div>
        </div>
      </div>
    </div>
    <BottomNav />
  </div>
);

export default Profile;

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const AddMoney = () => {
  const [amount, setAmount] = useState("");

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm animate-fade-in">
          <h2 className="text-xl font-bold text-foreground mb-4">Add Money</h2>
          <div className="border-t border-border pt-4">
            <label className="text-sm font-semibold text-foreground mb-2 block">Enter the amount</label>
            <Input
              placeholder="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mb-4"
            />
            <Button className="w-full bg-primary text-primary-foreground font-semibold">
              Click Here To Add Money
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm mt-6">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
            💬 How to add money
          </h3>
          <div className="bg-muted rounded-lg aspect-video flex items-center justify-center text-muted-foreground">
            Video tutorial coming soon
          </div>
        </div>
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default AddMoney;

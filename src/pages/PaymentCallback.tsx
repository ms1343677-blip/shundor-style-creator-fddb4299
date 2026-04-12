import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get("status");
  const [display, setDisplay] = useState<"loading" | "success" | "cancel">("loading");

  useEffect(() => {
    if (status === "cancel") {
      setDisplay("cancel");
    } else {
      // Payment was redirected back - assume success (webhook handles actual verification)
      setDisplay("success");
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm text-center animate-fade-in">
          {display === "loading" && (
            <>
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <h2 className="text-lg font-bold text-foreground">পেমেন্ট যাচাই হচ্ছে...</h2>
            </>
          )}
          {display === "success" && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">পেমেন্ট সফল! ✅</h2>
              <p className="text-sm text-muted-foreground mb-6">আপনার পেমেন্ট সফলভাবে সম্পন্ন হয়েছে।</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/orders")}>আমার অর্ডার</Button>
                <Button variant="outline" onClick={() => navigate("/")}>হোমপেজ</Button>
              </div>
            </>
          )}
          {display === "cancel" && (
            <>
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">পেমেন্ট বাতিল হয়েছে</h2>
              <p className="text-sm text-muted-foreground mb-6">আপনার পেমেন্ট বাতিল হয়েছে।</p>
              <Button onClick={() => navigate("/")}>হোমপেজে ফিরুন</Button>
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default PaymentCallback;

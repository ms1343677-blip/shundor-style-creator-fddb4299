import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle, XCircle, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

type ViewState = "loading" | "success" | "cancel" | "pending" | "error";
type PaymentKind = "add_money" | "payment";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [display, setDisplay] = useState<ViewState>("loading");
  const [paymentKind, setPaymentKind] = useState<PaymentKind>("payment");
  const [message, setMessage] = useState("পেমেন্ট যাচাই হচ্ছে...");

  const searchParamsObject = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);

  useEffect(() => {
    let active = true;

    const verifyPayment = async () => {
      const transactionId = searchParams.get("transaction_id");
      const isCancelled = searchParams.get("status") === "cancel";

      if (!transactionId) {
        setDisplay(isCancelled ? "cancel" : "pending");
        setMessage("পেমেন্ট রেফারেন্স পাওয়া যায়নি।");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("uddoktapay-finalize", {
          body: {
            transactionId,
            params: searchParamsObject,
            cancelled: isCancelled,
          },
        });

        if (!active) return;
        if (error) throw error;

        const nextType = data?.type === "add_money" ? "add_money" : "payment";
        setPaymentKind(nextType);

        if (data?.status === "completed" || data?.status === "already_completed") {
          setDisplay("success");
          setMessage(nextType === "add_money" ? "টাকা আপনার ওয়ালেটে যুক্ত হয়েছে।" : "আপনার অর্ডার সফলভাবে প্লেস হয়েছে।");
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["wallet"] }),
            queryClient.invalidateQueries({ queryKey: ["my-orders"] }),
          ]);
          return;
        }

        if (data?.status === "cancelled") {
          setDisplay("cancel");
          setMessage("আপনার পেমেন্ট বাতিল হয়েছে।");
          return;
        }

        if (data?.status === "failed") {
          setDisplay("error");
          setMessage("পেমেন্ট সফল হয়নি। আবার চেষ্টা করুন।");
          return;
        }

        setDisplay("pending");
        setMessage("পেমেন্ট এখনো নিশ্চিত হয়নি। কিছুক্ষণ পর আবার চেক করুন।");
      } catch (error: any) {
        if (!active) return;
        setDisplay("error");
        setMessage(error?.message || "পেমেন্ট যাচাই করা যায়নি।");
      }
    };

    verifyPayment();

    return () => {
      active = false;
    };
  }, [queryClient, searchParams, searchParamsObject]);

  const primaryAction = () => {
    if (display === "success" && paymentKind === "add_money") {
      navigate("/add-money");
      return;
    }
    if (display === "success") {
      navigate("/orders");
      return;
    }
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm text-center animate-fade-in">
          {display === "loading" && (
            <>
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <h2 className="text-lg font-bold text-foreground mb-2">পেমেন্ট যাচাই হচ্ছে...</h2>
              <p className="text-sm text-muted-foreground">অপেক্ষা করুন, আমরা আপনার পেমেন্ট স্ট্যাটাস চেক করছি।</p>
            </>
          )}

          {display === "success" && (
            <>
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">পেমেন্ট সফল! ✅</h2>
              <p className="text-sm text-muted-foreground mb-6">{message}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={primaryAction}>{paymentKind === "add_money" ? "ওয়ালেট দেখুন" : "আমার অর্ডার"}</Button>
                <Button variant="outline" onClick={() => navigate("/")}>হোমপেজ</Button>
              </div>
            </>
          )}

          {display === "cancel" && (
            <>
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">পেমেন্ট বাতিল হয়েছে</h2>
              <p className="text-sm text-muted-foreground mb-6">{message}</p>
              <Button onClick={() => navigate("/")}>হোমপেজে ফিরুন</Button>
            </>
          )}

          {display === "pending" && (
            <>
              <Clock3 className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">পেমেন্ট অপেক্ষমাণ</h2>
              <p className="text-sm text-muted-foreground mb-6">{message}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => window.location.reload()}>আবার চেক করুন</Button>
                <Button variant="outline" onClick={() => navigate("/")}>হোমপেজ</Button>
              </div>
            </>
          )}

          {display === "error" && (
            <>
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">ভেরিফিকেশন ব্যর্থ</h2>
              <p className="text-sm text-muted-foreground mb-6">{message}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => window.location.reload()}>আবার চেষ্টা করুন</Button>
                <Button variant="outline" onClick={() => navigate("/")}>হোমপেজ</Button>
              </div>
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default PaymentCallback;

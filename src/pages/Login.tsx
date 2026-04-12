import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({ title: "Error", description: String(result.error), variant: "destructive" });
      return;
    }
    if (result.redirected) return;
    navigate("/");
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({ title: "সফল!", description: "একাউন্ট তৈরি হয়েছে। এখন লগইন করুন।" });
        setIsRegister(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground mb-6">{isRegister ? "Register" : "Login"}</h2>

          <button
            onClick={handleGoogleLogin}
            className="w-full border border-border rounded-lg py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Login with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">Or sign in with credentials</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Email</label>
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Password</label>
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button className="w-full bg-primary text-primary-foreground" onClick={handleSubmit} disabled={loading}>
              {loading ? "Loading..." : isRegister ? "Register" : "Login"}
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-5">
            {isRegister ? "Already have an account? " : "New user to RG BAZZER? "}
            <button className="text-primary font-semibold" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? "Login" : "Register"}
            </button>
            {!isRegister && " Now"}
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;

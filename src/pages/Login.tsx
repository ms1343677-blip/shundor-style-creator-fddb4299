import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle Google OAuth callback redirect (token + user in URL)
  useEffect(() => {
    const token = searchParams.get("token");
    const userParam = searchParams.get("user");
    const error = searchParams.get("error");

    if (error) {
      toast({ title: "Google Login Failed", description: error, variant: "destructive" });
      // clean URL
      window.history.replaceState({}, "", "/login");
      return;
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_user", JSON.stringify(user));
        toast({ title: "Welcome!", description: `${user.full_name || user.email} সফলভাবে লগইন!` });
        navigate("/", { replace: true });
      } catch {
        toast({ title: "Error", description: "Invalid login response", variant: "destructive" });
      }
      return;
    }

    // Already logged in?
    if (api.getToken()) navigate("/", { replace: true });
  }, [searchParams, navigate]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isRegister) {
        await api.register(email, password);
        toast({ title: "সফল!", description: "একাউন্ট তৈরি হয়েছে। এখন লগইন করুন।" });
        setIsRegister(false);
      } else {
        await api.login(email, password);
        navigate("/");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Server-side OAuth flow — redirects to /api/auth/google → Google → /api/auth/google/callback → /login?token=...
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="text-center mb-5">
            <h2 className="text-lg font-black text-foreground">{isRegister ? "Create Account" : "Welcome Back"}</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {isRegister ? "একটি নতুন একাউন্ট তৈরি করুন" : "আপনার একাউন্টে লগইন করুন"}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[12px] font-semibold text-foreground mb-1 block">Email</label>
              <Input placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 text-[13px]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-foreground mb-1 block">Password</label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 text-[13px]" />
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground h-11 rounded-xl text-[14px] font-bold active:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Loading..." : isRegister ? "Register" : "Login"}
            </button>

            <button
              onClick={handleGoogleLogin}
              className="w-full border border-border text-foreground h-11 rounded-xl text-[13px] font-bold active:opacity-80 flex items-center justify-center gap-2"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
              Google দিয়ে লগইন
            </button>
          </div>

          <p className="text-center text-[12px] text-muted-foreground mt-4">
            {isRegister ? "Already have an account? " : "New here? "}
            <button className="text-primary font-bold" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? "Login" : "Register"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

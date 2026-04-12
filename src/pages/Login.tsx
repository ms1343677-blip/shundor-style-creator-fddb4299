import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground mb-6">Login</h2>

          <button className="w-full border border-border rounded-lg py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors mb-4">
            <span className="text-xl">G</span> Login with Google
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
            <Button className="w-full bg-primary text-primary-foreground" onClick={() => navigate("/")}>
              Login
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-5">
            New user to RG BAZZER?{" "}
            <button className="text-primary font-semibold">Register</button> Now
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;

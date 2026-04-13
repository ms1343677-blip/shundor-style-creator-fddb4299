import { Wallet, Menu, X, LogOut, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isReady, signOut } = useAuth();

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      await supabase.rpc("ensure_wallet");
      const { data, error } = await supabase.from("wallets").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const menuItems = [
    { label: "My Account", path: "/profile", icon: "👤" },
    { label: "My Orders", path: "/orders", icon: "📦" },
    { label: "My Codes", path: "/codes", icon: "🔑" },
    { label: "Transaction History", path: "/orders", icon: "📊" },
    { label: "Add Money", path: "/add-money", icon: "💳" },
    { label: "Contact Us", path: "/", icon: "📞" },
  ];

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-nav border-b border-border/10">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <h1
            className="text-lg font-extrabold tracking-tight cursor-pointer select-none"
            onClick={() => navigate("/")}
          >
            <span className="text-destructive">RG</span>
            <span className="text-nav-foreground"> BAZZER</span>
          </h1>
          <div className="flex items-center gap-2">
            {isReady && user ? (
              <>
                <button
                  onClick={() => navigate("/add-money")}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3.5 py-1.5 rounded-lg text-sm font-semibold active:scale-95"
                >
                  <Wallet className="w-4 h-4" />
                  {wallet?.balance?.toFixed(0) || "0"}৳
                </button>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-9 h-9 rounded-lg bg-nav-foreground/10 flex items-center justify-center active:scale-95"
                >
                  {menuOpen ? <X className="w-5 h-5 text-nav-foreground" /> : <Menu className="w-5 h-5 text-nav-foreground" />}
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="bg-primary text-primary-foreground px-5 py-1.5 rounded-lg text-sm font-semibold active:scale-95"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {menuOpen && user && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="ml-auto relative bg-card w-72 h-full shadow-2xl overflow-y-auto">
            <div className="p-5 bg-nav">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-base">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-nav-foreground text-sm truncate">
                    {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-xs text-nav-foreground/60 truncate">{user.email}</p>
                </div>
              </div>
            </div>
            <div className="py-1">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { navigate(item.path); setMenuOpen(false); }}
                  className="w-full text-left px-5 py-3 text-foreground active:bg-muted flex items-center gap-3 text-sm"
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-border">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive py-2.5 rounded-lg text-sm font-semibold active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;

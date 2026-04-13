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
    { label: "Transactions", path: "/orders", icon: "📊" },
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
      <header className="sticky top-0 z-40 bg-nav">
        <div className="flex items-center justify-between px-4 h-[52px] max-w-lg mx-auto">
          <h1 className="text-[17px] font-black tracking-tight cursor-pointer select-none" onClick={() => navigate("/")}>
            <span className="text-destructive">RG</span>
            <span className="text-nav-foreground"> BAZZER</span>
          </h1>
          <div className="flex items-center gap-2">
            {isReady && user ? (
              <>
                <button
                  onClick={() => navigate("/add-money")}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground h-8 px-3 rounded-lg text-[13px] font-bold active:opacity-80"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  {wallet?.balance?.toFixed(0) || "0"}৳
                </button>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-8 h-8 rounded-lg bg-nav-foreground/10 flex items-center justify-center active:opacity-80"
                >
                  {menuOpen ? <X className="w-[18px] h-[18px] text-nav-foreground" /> : <Menu className="w-[18px] h-[18px] text-nav-foreground" />}
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="bg-primary text-primary-foreground h-8 px-4 rounded-lg text-[13px] font-bold active:opacity-80"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {menuOpen && user && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 bg-card w-[280px] shadow-2xl flex flex-col">
            <div className="p-4 bg-nav">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-nav-foreground text-sm truncate">
                    {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-[11px] text-nav-foreground/50 truncate">{user.email}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { navigate(item.path); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-3.5 text-foreground active:bg-secondary flex items-center gap-3 text-[13px] border-b border-border"
                >
                  <span>{item.icon}</span>
                  <span className="flex-1 font-medium">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-border">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 border border-destructive text-destructive h-10 rounded-lg text-[13px] font-bold active:opacity-80"
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

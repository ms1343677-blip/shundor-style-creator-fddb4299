import { Wallet, Menu, X, LogOut, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/use-site-settings";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isReady, signOut } = useAuth();
  const { settings } = useSiteSettings();
  const siteName = settings.site_name || "RG BAZZER";
  const logoUrl = settings.logo_url || "";

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

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
    { label: "API Docs", path: "/docs", icon: "📄" },
    { label: "Contact Us", path: "/", icon: "📞" },
  ];

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
    navigate("/login");
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <>
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-[56px] max-w-lg mx-auto">
          <div className="cursor-pointer select-none flex items-center gap-2" onClick={() => navigate("/")}>
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-8 object-contain" />
            ) : (
              <h1 className="text-[18px] font-black tracking-tight flex items-center gap-1">
                <span className="text-destructive">{siteName.split(" ")[0]}</span>
                <span className="text-foreground">{siteName.split(" ").slice(1).join(" ")}</span>
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {isReady && user ? (
              <>
                <button
                  onClick={() => navigate("/add-money")}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground h-9 px-4 rounded-full text-[13px] font-bold active:opacity-80"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  {wallet?.balance?.toFixed(0) || "0"}৳
                </button>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary/30 active:opacity-80"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="bg-primary text-primary-foreground h-9 px-5 rounded-full text-[13px] font-bold active:opacity-80"
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
            <div className="p-4 bg-primary">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary-foreground/30">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-primary-foreground text-sm truncate">{displayName}</p>
                  <p className="text-[11px] text-primary-foreground/60 truncate">{user.email}</p>
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
                className="w-full flex items-center justify-center gap-2 border border-destructive text-destructive h-10 rounded-xl text-[13px] font-bold active:opacity-80"
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

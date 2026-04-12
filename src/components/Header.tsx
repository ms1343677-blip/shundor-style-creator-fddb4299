import { Wallet, Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = location.pathname !== "/login";

  const menuItems = [
    { label: "My Account", path: "/profile" },
    { label: "My Orders", path: "/orders" },
    { label: "My Codes", path: "/codes" },
    { label: "My Transaction", path: "/orders" },
    { label: "Add Money", path: "/add-money" },
    { label: "Contact Us", path: "/" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-card shadow-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1
            className="text-xl font-extrabold tracking-tight cursor-pointer"
            onClick={() => navigate("/")}
          >
            <span className="text-destructive">RG</span>
            <span className="text-primary"> BAZZER</span>
          </h1>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <button className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium">
                  <Wallet className="w-4 h-4" /> ০৳
                </button>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  {menuOpen ? <X className="w-5 h-5 text-primary" /> : <Menu className="w-5 h-5 text-primary" />}
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="bg-primary text-primary-foreground px-5 py-1.5 rounded-lg text-sm font-semibold"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setMenuOpen(false)} />
          <div className="ml-auto relative bg-card w-72 h-full shadow-xl animate-fade-in overflow-y-auto">
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  U
                </div>
                <div>
                  <p className="font-semibold text-foreground">Hi, User</p>
                  <p className="text-xs text-muted-foreground">user@example.com</p>
                </div>
              </div>
              <button className="mt-3 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm">
                Logout
              </button>
            </div>
            <div className="py-2">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { navigate(item.path); setMenuOpen(false); }}
                  className="w-full text-left px-5 py-3.5 text-foreground hover:bg-secondary transition-colors text-sm font-medium"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="p-5">
              <button className="w-full bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2">
                🎧 Support
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;

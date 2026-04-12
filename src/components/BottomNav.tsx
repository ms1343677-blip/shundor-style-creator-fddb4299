import { Home, Wallet, Bookmark, Grid2X2, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Wallet, label: "Add Money", path: "/add-money" },
  { icon: Bookmark, label: "My Orders", path: "/orders" },
  { icon: Grid2X2, label: "My Codes", path: "/codes" },
  { icon: User, label: "My Account", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 text-xs transition-colors ${
                isActive ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

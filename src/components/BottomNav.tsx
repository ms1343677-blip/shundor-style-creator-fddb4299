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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex items-stretch max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 active:bg-secondary relative ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-primary rounded-b-full" />}
              <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

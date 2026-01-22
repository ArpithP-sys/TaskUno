import { Link, useLocation } from "react-router-dom";
import { Calendar, BarChart3, Search } from "lucide-react";
import NotificationBell from "./NotificationBell";
import UserAvatar from "./UserAvatar";
import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { connectSocket } from "../utils/socket";

const Header = () => {
  const location = useLocation();
 const {userId} =useAuth();
  useEffect(() => {
    if (userId) {
      connectSocket({ userId });
    }
  }, [userId]);
  const navLinks = [
    { to: "/calendar", label: "Calendar", icon: Calendar },
    { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/search", label: "Search", icon: Search },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold italic text-foreground">
            Task<span className="text-gradient">Uno</span>
          </span>
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  location.pathname === to
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <NotificationBell />
          <UserAvatar />
        </div>

      </div>
    </header>
  );
};

export default Header;

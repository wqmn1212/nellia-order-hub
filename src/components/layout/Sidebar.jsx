import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { canAccess } from "@/lib/roleConfig";
import { APP_NAV } from "@/lib/navigation";
import { Settings } from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.role || "cs";
  const visibleNav = APP_NAV.filter((item) => canAccess(role, item.to));

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card/80 backdrop-blur-sm h-screen sticky top-0 min-h-0">
      <div className="px-6 py-6 border-b border-border">
        <Link to="/" className="flex flex-col items-start">
          <img src="https://media.base44.com/images/public/69e37e5e767e8ab3b10b5da8/6eb42ef0d_NelliaLogo_BlackPink_1.png" alt="Nellia" className="h-10 w-auto object-contain" />
          <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mt-1">Order Studio</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => {
          const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/70 hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "" : "text-muted-foreground group-hover:text-foreground"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-6 border-t border-border">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Settings className="w-3.5 h-3.5" />
          <span>Nellia CRM v1.0</span>
        </div>
      </div>
    </aside>
  );
}
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { canAccess } from "@/lib/roleConfig";
import { LayoutDashboard, Package, BotMessageSquare, CalendarDays, Gauge } from "lucide-react";

const NAV = [
  { to: "/", label: "대시보드", icon: LayoutDashboard },
  { to: "/summary", label: "현황", icon: Gauge },
  { to: "/orders", label: "주문", icon: Package },
  { to: "/calendar", label: "캘린더", icon: CalendarDays },
  { to: "/ai-team", label: "AI팀", icon: BotMessageSquare },
];

export default function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.role || "cs";
  const visibleNav = NAV.filter((item) => canAccess(role, item.to));
  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-5 py-4 flex items-center justify-between">
        <Link to="/"><img src="https://media.base44.com/images/public/69e37e5e767e8ab3b10b5da8/6eb42ef0d_NelliaLogo_BlackPink_1.png" alt="Nellia" className="h-8 w-auto object-contain" /></Link>
        <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Order Studio</span>
      </header>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border">
        <div className={`grid grid-cols-${Math.min(visibleNav.length, 5)}`}>
          {visibleNav.map((item) => {
            const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
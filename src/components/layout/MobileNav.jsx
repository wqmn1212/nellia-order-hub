import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, Truck, Upload, Plug } from "lucide-react";

const NAV = [
  { to: "/", label: "대시보드", icon: LayoutDashboard },
  { to: "/orders", label: "주문", icon: Package },
  { to: "/shipping", label: "송장", icon: Truck },
  { to: "/upload", label: "업로드", icon: Upload },
  { to: "/api-settings", label: "API 연동", icon: Plug },
];

export default function MobileNav() {
  const location = useLocation();
  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-5 py-4 flex items-center justify-between">
        <Link to="/" className="font-serif text-2xl tracking-tight text-primary">Nellia</Link>
        <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Order Studio</span>
      </header>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border">
        <div className="grid grid-cols-5">
          {NAV.map((item) => {
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
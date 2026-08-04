import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { canAccess } from "@/lib/roleConfig";
import { APP_NAV, MOBILE_PRIMARY_NAV } from "@/lib/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import AllMenuDrawer from "@/components/layout/AllMenuDrawer";

export default function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.role || "cs";
  const visibleNav = APP_NAV.filter((item) => MOBILE_PRIMARY_NAV.includes(item.to) && canAccess(role, item.to));
  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border px-4 h-16 flex items-center justify-between pt-[env(safe-area-inset-top)]">
        <Link to="/"><img src="https://media.base44.com/images/public/69e37e5e767e8ab3b10b5da8/6eb42ef0d_NelliaLogo_BlackPink_1.png" alt="Nellia" className="h-8 w-auto object-contain" /></Link>
        <Sheet><SheetTrigger className="inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-background" aria-label="전체 메뉴 열기"><Menu className="h-5 w-5" /></SheetTrigger><AllMenuDrawer role={role} /></Sheet>
      </header>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4">
          {visibleNav.map((item) => {
            const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors ${
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
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, Truck, Upload, Settings, Plug, BotMessageSquare, BarChart2, ShoppingBag, Megaphone, CalendarDays, Globe } from "lucide-react";

const NAV = [
  { to: "/", label: "대시보드", icon: LayoutDashboard },
  { to: "/orders", label: "주문 관리", icon: Package },
  { to: "/shipping", label: "송장 출력", icon: Truck },
  { to: "/upload", label: "주문 업로드", icon: Upload },
  { to: "/analytics", label: "KPI 분석", icon: BarChart2 },
  { to: "/marketing-kpi", label: "마케팅 성과", icon: Megaphone },
  { to: "/products", label: "제품 DB", icon: ShoppingBag },
  { to: "/ai-team", label: "AI 직원팀", icon: BotMessageSquare },
  { to: "/calendar", label: "팀 캘린더", icon: CalendarDays },
  { to: "/sourcing", label: "글로벌 소싱", icon: Globe },
  { to: "/api-settings", label: "API 연동 설정", icon: Plug },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-sm h-screen sticky top-0 min-h-0">
      <div className="px-7 py-8 border-b border-border">
        <Link to="/" className="flex flex-col">
          <span className="font-serif text-3xl tracking-tight text-primary">Nellia</span>
          <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mt-1">Order Studio</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
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
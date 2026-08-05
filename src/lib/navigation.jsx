import { Sparkles, LayoutDashboard, Package, Truck, Upload, Plug, BotMessageSquare, BarChart2, ShoppingBag, Megaphone, CalendarDays, Globe, HardDrive, MessageSquareWarning, Calculator, Wand2, Boxes, Handshake, Star, Instagram, BadgePercent, Gauge } from "lucide-react";

export const APP_NAV = [
  { to: "/", label: "대시보드", icon: LayoutDashboard },
  { to: "/summary", label: "모바일 현황", icon: Gauge },
  { to: "/calendar", label: "팀 캘린더", icon: CalendarDays },
  { to: "/orders", label: "주문 관리", icon: Package },
  { to: "/shipping", label: "송장 출력", icon: Truck },
  { to: "/upload", label: "주문 업로드", icon: Upload },
  { to: "/analytics", label: "KPI 분석", icon: BarChart2 },
  { to: "/marketing-kpi", label: "마케팅 성과", icon: Megaphone },
  { to: "/ad-hub", label: "광고 관리", icon: Megaphone },
  { to: "/influencers", label: "인플루언서 협찬", icon: Handshake },
  { to: "/instagram", label: "인스타 분석", icon: Instagram },
  { to: "/reviews", label: "후기 관리", icon: Star },
  { to: "/products", label: "제품 DB", icon: ShoppingBag },
  { to: "/inventory", label: "재고 관리", icon: Boxes },
  { to: "/image-studio", label: "제품 이미지 스튜디오", icon: Wand2 },
  { to: "/assistant", label: "AI 비서", icon: Sparkles },
  { to: "/ai-team", label: "AI 직원팀", icon: BotMessageSquare },
  { to: "/sourcing", label: "글로벌 소싱", icon: Globe },
  { to: "/profitability", label: "수익성 관리", icon: Calculator },
  { to: "/group-buying", label: "공동구매", icon: BadgePercent },
  { to: "/cs-tickets", label: "CS / 클레임", icon: MessageSquareWarning },
  { to: "/drive", label: "파일 드라이브", icon: HardDrive },
  { to: "/api-settings", label: "API 연동 설정", icon: Plug },
];

export const MOBILE_PRIMARY_NAV = ["/", "/summary", "/orders", "/calendar"];
// 역할별 접근 가능 경로 매핑
export const ROLE_ROUTES = {
  admin: "all", // 모든 페이지 접근 가능
  marketing: ["/", "/calendar", "/analytics", "/marketing-kpi", "/products", "/ai-team", "/drive"],
  logistics: ["/", "/calendar", "/orders", "/shipping", "/upload", "/sourcing", "/drive"],
  cs: ["/", "/calendar", "/orders", "/cs-tickets", "/ai-team"],
};

export function canAccess(role, path) {
  if (!role) return false;
  if (role === "admin") return true;
  const allowed = ROLE_ROUTES[role];
  if (!allowed) return false;
  return allowed.some((r) => (r === "/" ? path === "/" : path.startsWith(r)));
}

export const ROLE_LABELS = {
  admin: "총괄 관리자",
  marketing: "마케터",
  logistics: "물류 담당",
  cs: "고객만족",
};
export const PLATFORMS = [
  { key: "meta", label: "Meta", color: "#1877F2", emoji: "📘" },
  { key: "tiktok", label: "TikTok", color: "#111827", emoji: "🎵" },
  { key: "google", label: "Google", color: "#EA4335", emoji: "🔍" },
  { key: "naver", label: "Naver", color: "#03C75A", emoji: "🟢" },
  { key: "coupang", label: "Coupang", color: "#F23847", emoji: "🚀" },
];

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.key, p]));

export const won = (n) => `₩${Math.round(Number(n) || 0).toLocaleString()}`;

// 행 단위 성과 → 집계 지표 계산
export function aggregate(rows) {
  const spend = rows.reduce((s, r) => s + (Number(r.spend_krw) || 0), 0);
  const clicks = rows.reduce((s, r) => s + (Number(r.clicks) || 0), 0);
  const impressions = rows.reduce((s, r) => s + (Number(r.impressions) || 0), 0);
  const conversions = rows.reduce((s, r) => s + (Number(r.conversions) || 0), 0);
  const revenue = rows.reduce((s, r) => s + (Number(r.conversion_value_krw) || 0), 0);
  return {
    spend,
    clicks,
    impressions,
    conversions,
    revenue,
    cpc: clicks > 0 ? Math.round(spend / clicks) : 0,
    cpa: conversions > 0 ? Math.round(spend / conversions) : 0,
    roas: spend > 0 ? Math.round((revenue / spend) * 100) : 0,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
  };
}
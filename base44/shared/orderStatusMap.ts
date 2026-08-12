// 채널 원본 주문 상태 → Order.status enum 매핑 (여러 수집 함수에서 공용 사용)
// Order.status enum: new | preparing | shipped | delivered | cancelled

export const NAVER_STATUS_MAP = {
  PAYMENT_WAITING: "new",
  PAYED: "new",
  DELIVERING: "shipped",
  DELIVERED: "delivered",
  PURCHASE_DECIDED: "delivered",
  EXCHANGED: "delivered",
  CANCELED: "cancelled",
  CANCELED_BY_NOPAYMENT: "cancelled",
  RETURNED: "cancelled",
};

export const COUPANG_STATUS_MAP = {
  ACCEPT: "new",
  INSTRUCT: "preparing",
  DEPARTURE: "shipped",
  DELIVERING: "shipped",
  FINAL_DELIVERY: "delivered",
  NONE_TRACKING: "shipped",
  CANCEL: "cancelled",
};

export const NAVER_COURIER_MAP = {
  CJGLS: "cj",
  HANJIN: "hanjin",
  LOTTE: "lotte",
  LOGEN: "logen",
  EPOST: "post",
  KUNYOUNG: "kunyoung",
};

export const COUPANG_COURIER_MAP = {
  CJGLS: "cj",
  HANJIN: "hanjin",
  LOTTE: "lotte",
  KGB: "logen",
  EPOST: "post",
  KOREXG: "cj",
  KUNYOUNG: "kunyoung",
};

export function mapStatus(map, raw) {
  return map[String(raw || "").toUpperCase()] || "new";
}

export function mapCourier(map, raw) {
  return map[String(raw || "").toUpperCase()] || (raw ? "other" : undefined);
}

// 로그용 개인정보 마스킹 (원문 저장 금지)
export function maskPii(value) {
  const s = String(value || "");
  if (s.length <= 2) return "**";
  return `${s.slice(0, 1)}**${s.slice(-1)}`;
}
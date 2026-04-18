export const CHANNELS = {
  coupang: { label: "쿠팡", color: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" },
  naver: { label: "네이버 스마트스토어", color: "bg-green-50 text-green-700 border-green-100", dot: "bg-green-500" },
  wadiz: { label: "와디즈", color: "bg-sky-50 text-sky-700 border-sky-100", dot: "bg-sky-500" },
  toss: { label: "토스", color: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" },
  kakao: { label: "카카오톡 선물하기", color: "bg-yellow-50 text-yellow-800 border-yellow-100", dot: "bg-yellow-500" },
  self_mall: { label: "자사몰", color: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary" },
  other: { label: "기타", color: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
};

export const STATUSES = {
  new: { label: "신규 주문", color: "bg-amber-50 text-amber-800 border-amber-200" },
  preparing: { label: "출고 준비", color: "bg-blue-50 text-blue-700 border-blue-200" },
  shipped: { label: "출고 완료", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  delivered: { label: "배송 완료", color: "bg-primary/10 text-primary border-primary/20" },
  cancelled: { label: "취소", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const COURIERS = {
  cj: "CJ대한통운",
  hanjin: "한진택배",
  lotte: "롯데택배",
  logen: "로젠택배",
  post: "우체국택배",
  kunyoung: "건영택배",
  other: "기타",
};
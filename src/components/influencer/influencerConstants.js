export const CHANNEL_TYPES = {
  instagram: { label: "인스타그램", color: "bg-pink-100 text-pink-700" },
  youtube: { label: "유튜브", color: "bg-red-100 text-red-700" },
  tiktok: { label: "틱톡", color: "bg-slate-100 text-slate-700" },
  blog: { label: "블로그", color: "bg-green-100 text-green-700" },
  naver_cafe: { label: "네이버 카페", color: "bg-emerald-100 text-emerald-700" },
  other: { label: "기타", color: "bg-gray-100 text-gray-700" },
};

export const TIERS = {
  mega: { label: "메가", color: "bg-purple-100 text-purple-700" },
  macro: { label: "매크로", color: "bg-blue-100 text-blue-700" },
  micro: { label: "마이크로", color: "bg-cyan-100 text-cyan-700" },
  nano: { label: "나노", color: "bg-teal-100 text-teal-700" },
};

export const CONTACT_STATUS = {
  candidate: { label: "후보", color: "bg-gray-100 text-gray-700" },
  contacting: { label: "컨택중", color: "bg-yellow-100 text-yellow-700" },
  contracted: { label: "계약완료", color: "bg-blue-100 text-blue-700" },
  done: { label: "완료", color: "bg-green-100 text-green-700" },
  paused: { label: "보류", color: "bg-slate-100 text-slate-700" },
};

export const COLLAB_TYPES = {
  seeding_only: { label: "제품제공만", color: "bg-teal-100 text-teal-700" },
  paid_sponsorship: { label: "비용지불 협찬", color: "bg-purple-100 text-purple-700" },
  review_agency: { label: "리뷰작업 대행", color: "bg-amber-100 text-amber-700" },
};

export const CONTENT_TYPES = {
  reels: { label: "릴스" },
  feed: { label: "피드" },
  story: { label: "스토리" },
  youtube_video: { label: "유튜브 영상" },
  blog_post: { label: "블로그 포스팅" },
  review_comment: { label: "후기/댓글" },
};

export const SHIPMENT_TYPES = {
  real_product: { label: "실제 제품 발송", color: "bg-green-100 text-green-700" },
  empty_box: { label: "빈박스 발송", color: "bg-orange-100 text-orange-700" },
  not_shipped: { label: "미발송", color: "bg-gray-100 text-gray-700" },
};

export const WORK_STATUS = {
  planned: { label: "예정", color: "bg-gray-100 text-gray-700" },
  shipped: { label: "발송완료", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "작업중", color: "bg-yellow-100 text-yellow-700" },
  published: { label: "게시완료", color: "bg-green-100 text-green-700" },
  cancelled: { label: "취소", color: "bg-red-100 text-red-700" },
};

export const PAYMENT_STATUS = {
  not_required: { label: "정산불필요", color: "bg-gray-100 text-gray-700" },
  pending: { label: "정산예정", color: "bg-yellow-100 text-yellow-700" },
  paid: { label: "정산완료", color: "bg-green-100 text-green-700" },
};

export const REVIEW_SOURCES = {
  blog: { label: "블로그", color: "bg-green-100 text-green-700" },
  naver_shopping: { label: "네이버쇼핑", color: "bg-emerald-100 text-emerald-700" },
  coupang: { label: "쿠팡", color: "bg-red-100 text-red-700" },
  own_mall: { label: "자사몰", color: "bg-pink-100 text-pink-700" },
  instagram: { label: "인스타그램", color: "bg-purple-100 text-purple-700" },
  other: { label: "기타", color: "bg-gray-100 text-gray-700" },
};

export const SENTIMENTS = {
  positive: { label: "긍정", color: "bg-green-100 text-green-700" },
  neutral: { label: "중립", color: "bg-gray-100 text-gray-700" },
  negative: { label: "부정", color: "bg-red-100 text-red-700" },
};

export const REVIEW_STATUS = {
  unchecked: { label: "미확인", color: "bg-yellow-100 text-yellow-700" },
  checked: { label: "확인완료", color: "bg-green-100 text-green-700" },
  action_needed: { label: "대응필요", color: "bg-red-100 text-red-700" },
};
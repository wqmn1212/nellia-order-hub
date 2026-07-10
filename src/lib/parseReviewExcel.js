import * as XLSX from "xlsx";

// 리뷰작업 엑셀 양식은 고정 헤더가 없어 열 이름/위치 기반으로 매핑한다.
// 대표 헤더명: 품명, 옵션, 리뷰(채널), 주문번호, 구매자, 수취인, 아이디, 연락처, 주소, 계좌, 금액, 택배사, 송장번호
const HEADER_ALIASES = {
  product_name: ["품명", "상품명", "제품명"],
  option: ["옵션"],
  channel: ["리뷰", "채널", "구매처"],
  order_number: ["주문번호", "주문번호1"],
  reviewer_name: ["구매자"],
  reviewer_account: ["아이디", "계정"],
  customer_phone: ["연락처", "전화번호"],
  customer_address: ["주소", "배송지"],
  account_info: ["계좌"],
  amount: ["금액", "결제금액"],
};

// "리뷰" 채널 텍스트 → CustomerReview.source enum
const SOURCE_MAP = {
  "네이버": "naver_shopping",
  "네이버쇼핑": "naver_shopping",
  "쿠팡": "coupang",
  "자사몰": "own_mall",
  "블로그": "blog",
  "인스타": "instagram",
  "인스타그램": "instagram",
};

const clean = (v) => {
  if (v == null) return "";
  const s = String(v).trim();
  return s === "null" || s.toLowerCase() === "nan" ? "" : s;
};

const toNum = (v) => {
  if (v == null || v === "") return undefined;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? undefined : n;
};

// 헤더 행에서 각 필드의 열 인덱스를 찾는다.
function buildColumnIndex(headerRow) {
  const idx = {};
  const headers = headerRow.map((h) => clean(h));
  for (const [field, names] of Object.entries(HEADER_ALIASES)) {
    for (const name of names) {
      const found = headers.indexOf(name);
      if (found !== -1) { idx[field] = found; break; }
    }
  }
  return idx;
}

export async function parseReviewExcel(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });
  if (!rows.length) return [];

  const colIdx = buildColumnIndex(rows[0]);
  const get = (row, field) => (colIdx[field] != null ? clean(row[colIdx[field]]) : "");

  return rows
    .slice(1)
    .map((row) => {
      const reviewer_name = get(row, "reviewer_name");
      const order_number = get(row, "order_number");
      const product_name = get(row, "product_name");
      // 데이터가 거의 없는 빈 줄 제외
      if (!reviewer_name && !order_number && !product_name) return null;

      const channelText = get(row, "channel");
      const source = SOURCE_MAP[channelText] || "other";
      const option = get(row, "option");

      return {
        source,
        channel_text: channelText || "기타",
        product_name: product_name || "미상",
        product_option: option || undefined,
        order_number: order_number || undefined,
        reviewer_name: reviewer_name || undefined,
        reviewer_account: get(row, "reviewer_account") || undefined,
        customer_phone: get(row, "customer_phone") || undefined,
        customer_address: get(row, "customer_address") || undefined,
        account_info: get(row, "account_info") || undefined,
        amount: toNum(get(row, "amount")),
        status: "unchecked",
      };
    })
    .filter(Boolean);
}
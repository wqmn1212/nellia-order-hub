import * as XLSX from "xlsx";
import { base44 } from "@/api/base44Client";

const FIELDS = [
  "order_date",
  "order_number",
  "product_order_number",
  "product_name",
  "product_option",
  "customer_name",
  "customer_phone",
  "customer_zipcode",
  "customer_address",
  "quantity",
  "price",
  "delivery_memo",
];

const clean = (v) => {
  if (v == null) return "";
  const s = String(v).trim();
  return s === "null" || s === "undefined" ? "" : s;
};

const toNum = (v) => {
  const n = Number(clean(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? undefined : n;
};

// 엑셀 날짜(시리얼/문자)를 YYYY-MM-DD로 변환
const toDate = (v) => {
  if (v == null || v === "") return undefined;
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return undefined;
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = clean(v).replace(/[.]/g, "-").replace(/\//g, "-");
  const m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
};

// 파일에서 시트 행들을 읽고, 헤더 행 위치를 추정한다.
export async function readSheetRows(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });
  const headerIndex = rows.findIndex((r) => r.filter((c) => clean(c)).length >= 3);
  if (headerIndex === -1) return { headers: [], dataRows: [] };
  return {
    headers: rows[headerIndex].map((h) => clean(h)),
    dataRows: rows.slice(headerIndex + 1).filter((r) => r.some((c) => clean(c))),
  };
}

// AI가 헤더와 샘플 데이터를 보고 우리 필드에 맞는 열을 찾아준다.
export async function requestAiMapping(headers, sampleRows) {
  const table = [headers, ...sampleRows.slice(0, 3)]
    .map((r, i) => `${i === 0 ? "헤더" : `샘플${i}`}: ${r.map((c) => clean(c)).join(" | ")}`)
    .join("\n");

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `아래는 한국 이커머스 플랫폼에서 내려받은 주문 엑셀의 헤더와 샘플 데이터입니다. 각 열이 어떤 주문 정보인지 판단해서, 우리 시스템 필드별로 해당하는 열 번호(0부터 시작하는 인덱스)를 알려주세요.

${table}

필드 설명:
- order_date: 주문일시/결제일
- order_number: 주문번호 (묶음/전체 주문번호)
- product_order_number: 상품주문번호 (상품 단위 주문 고유번호)
- product_name: 상품명
- product_option: 옵션정보/선택옵션
- customer_name: 구매자명 (구매자와 수취인이 모두 있으면 구매자명)
- customer_phone: 연락처/휴대폰번호
- customer_zipcode: 우편번호
- customer_address: 배송지 주소
- quantity: 수량
- price: 구매금액/결제금액/총 결제금액
- delivery_memo: 배송메모/요청사항

규칙:
- 해당하는 열이 없는 필드는 -1로 표기하세요.
- 반드시 위 표의 헤더 열 순서 기준 인덱스를 사용하세요.`,
    response_json_schema: {
      type: "object",
      properties: Object.fromEntries(FIELDS.map((f) => [f, { type: "number" }])),
      required: FIELDS,
    },
  });

  return result;
}

// 매핑 결과로 실제 주문 객체 배열을 만든다.
export function buildOrders(dataRows, mapping) {
  const at = (row, field) => {
    const i = mapping?.[field];
    return i != null && i >= 0 ? clean(row[i]) : "";
  };
  const rawAt = (row, field) => {
    const i = mapping?.[field];
    return i != null && i >= 0 ? row[i] : undefined;
  };

  return dataRows
    .map((row) => {
      const product_name = at(row, "product_name");
      const customer_name = at(row, "customer_name");
      if (!product_name && !customer_name) return null;
      return {
        order_date: toDate(rawAt(row, "order_date")),
        order_number: at(row, "order_number") || undefined,
        product_order_number: at(row, "product_order_number") || undefined,
        product_name: product_name || "미상",
        product_option: at(row, "product_option") || undefined,
        customer_name: customer_name || "미상",
        customer_phone: at(row, "customer_phone") || undefined,
        customer_zipcode: at(row, "customer_zipcode") || undefined,
        customer_address: at(row, "customer_address") || undefined,
        quantity: toNum(at(row, "quantity")) ?? 1,
        price: toNum(at(row, "price")),
        delivery_memo: at(row, "delivery_memo") || undefined,
      };
    })
    .filter(Boolean);
}
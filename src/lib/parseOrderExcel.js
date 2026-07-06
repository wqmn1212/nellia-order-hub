import * as XLSX from "xlsx";

// 실제 운송장 엑셀 양식의 헤더명 기준 매핑 (열 위치가 밀려도 안전)
// 받는분→이름, 받는분전화→연락처, 받는분우편번호→우편번호, 받는분주소→주소,
// 수량→수량, 품목명→품목명, 운임Type→운임타입(메모 기록), 메모1→배송메모
const HEADER_MAP = {
  customer_name: ["받는분"],
  customer_phone: ["받는분전화", "받는분핸드폰"],
  customer_zipcode: ["받는분우편번호"],
  customer_address: ["받는분주소"],
  quantity: ["수량"],
  product_name: ["품목명", "내품명1"],
  shipping_type: ["운임Type", "운임타입"],
  delivery_memo: ["메모1"],
  order_number: ["운송장번호", "주문번호1"],
};

const clean = (v) => {
  if (v == null) return "";
  const s = String(v).trim();
  return s === "null" ? "" : s;
};

const toNum = (v) => {
  if (v == null || v === "") return undefined;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? undefined : n;
};

// 헤더 행에서 각 필드에 해당하는 열 인덱스를 찾는다.
function buildColumnIndex(headerRow) {
  const idx = {};
  const headers = headerRow.map((h) => clean(h));
  for (const [field, names] of Object.entries(HEADER_MAP)) {
    for (const name of names) {
      const found = headers.indexOf(name);
      if (found !== -1) {
        idx[field] = found;
        break;
      }
    }
  }
  return idx;
}

// 파일(File)을 읽어 주문 배열을 반환한다.
export async function parseOrderExcel(file) {
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
      const customer_name = get(row, "customer_name");
      const product_name = get(row, "product_name");
      if (!customer_name && !product_name) return null;

      const shippingType = get(row, "shipping_type");
      const order_number = get(row, "order_number");

      return {
        order_number: order_number || undefined,
        customer_name: customer_name || "미상",
        customer_phone: get(row, "customer_phone") || undefined,
        customer_zipcode: get(row, "customer_zipcode") || undefined,
        customer_address: get(row, "customer_address") || undefined,
        quantity: toNum(get(row, "quantity")) ?? 1,
        product_name: product_name || "미상",
        delivery_memo: get(row, "delivery_memo") || undefined,
        notes: shippingType ? `운임타입: ${shippingType}` : undefined,
      };
    })
    .filter(Boolean);
}
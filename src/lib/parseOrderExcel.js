import * as XLSX from "xlsx";

// 고정 열 매핑 규칙 (0-based 인덱스)
// A(0)=받으시는분, B(1)=연락처, E(4)=우편번호, F(5)=주소,
// G(6)=수량, H(7)=품목명, I(8)=운임타입, M(12)=배송메모
const COL = {
  customer_name: 0,
  customer_phone: 1,
  customer_zipcode: 4,
  customer_address: 5,
  quantity: 6,
  product_name: 7,
  shipping_type: 8,
  delivery_memo: 12,
};

const cell = (row, idx) => {
  const v = row[idx];
  if (v == null) return "";
  return String(v).trim();
};

const toNum = (v) => {
  if (v == null || v === "") return undefined;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? undefined : n;
};

// 파일(File)을 읽어 지정된 열 규칙대로 주문 배열을 반환한다.
export async function parseOrderExcel(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // header: 1 → 각 행을 배열로 반환 (셀 위치 그대로 인덱스 접근)
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });

  // 첫 행은 헤더로 간주하고 건너뜀
  const dataRows = rows.slice(1);

  return dataRows
    .map((row) => {
      const customer_name = cell(row, COL.customer_name);
      const product_name = cell(row, COL.product_name);
      // 이름과 품목명이 모두 비어있으면 빈 행으로 판단하여 제외
      if (!customer_name && !product_name) return null;

      const shippingType = cell(row, COL.shipping_type);

      return {
        customer_name: customer_name || "미상",
        customer_phone: cell(row, COL.customer_phone) || undefined,
        customer_zipcode: cell(row, COL.customer_zipcode) || undefined,
        customer_address: cell(row, COL.customer_address) || undefined,
        quantity: toNum(cell(row, COL.quantity)) ?? 1,
        product_name: product_name || "미상",
        delivery_memo: cell(row, COL.delivery_memo) || undefined,
        notes: shippingType ? `운임타입: ${shippingType}` : undefined,
      };
    })
    .filter(Boolean);
}
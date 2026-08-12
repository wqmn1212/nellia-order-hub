// 주문 상품명 → 제품(Product) 매칭 로직 (여러 함수에서 공용 사용)

export function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^0-9a-z가-힣]/g, "");
}

// products: Product 배열, aliases: ProductAlias 배열
export function matchProduct(order, products, aliases) {
  const orderName = order.product_name || "";
  const searchText = normalizeName(`${orderName} ${order.product_option || ""}`);
  const normOrderName = normalizeName(orderName);

  // 1) 사용자가 직접 연결해 둔 별칭이 최우선
  const alias = (aliases || []).find(
    (a) => normalizeName(a.order_product_name) === normOrderName
  );
  if (alias) {
    const product = products.find((p) => p.id === alias.product_id);
    if (product) return { product, unitsPerOrder: alias.units_per_order || 1, via: "alias" };
  }

  // 2) 제품명 정규화 일치
  let product = products.find((p) => normalizeName(p.name) === normOrderName);
  if (product) return { product, unitsPerOrder: 1, via: "name" };

  // 3) 모델번호가 주문 텍스트에 포함
  product = products.find(
    (p) => p.model_number && searchText.includes(normalizeName(p.model_number))
  );
  if (product) return { product, unitsPerOrder: 1, via: "model" };

  // 4) 제품명이 주문 텍스트에 포함 (가장 긴 이름 우선)
  const candidates = products
    .filter((p) => {
      const n = normalizeName(p.name);
      return n.length >= 4 && searchText.includes(n);
    })
    .sort((a, b) => normalizeName(b.name).length - normalizeName(a.name).length);
  if (candidates.length) return { product: candidates[0], unitsPerOrder: 1, via: "partial" };

  return null;
}

// 재고를 차감해야 하는 주문 상태
export const DEDUCT_STATUSES = ["shipped", "delivered"];
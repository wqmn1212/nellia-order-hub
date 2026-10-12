// 중복 주문 판별 키 생성 (엑셀 업로드 + 마이그레이션 공용)
import { normalizeName } from './productMatch.ts';

export function makeDedupeKey(order) {
  const parts = [
    order.channel || '',
    order.order_number || '',
    order.product_name || '',
    order.customer_name || '',
    order.order_date || '',
  ].map((s) => normalizeName(s));
  return parts.join('|');
}
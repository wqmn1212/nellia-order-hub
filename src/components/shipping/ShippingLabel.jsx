import React from "react";
import { COURIERS } from "@/components/shared/constants";

export default function ShippingLabel({ order }) {
  return (
    <div className="border-2 border-foreground bg-white p-5 text-foreground break-inside-avoid" style={{ width: "100mm", minHeight: "150mm" }}>
      {/* 보내는 사람 */}
      <div className="border-b border-foreground/40 pb-3 mb-3">
        <p className="text-[10px] uppercase tracking-widest text-foreground/60 mb-1">From · 보내는 사람</p>
        <p className="font-serif text-lg">Nellia</p>
        <p className="text-xs mt-0.5">고객센터 문의는 구매처로 부탁드립니다</p>
      </div>

      {/* 받는 사람 */}
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-widest text-foreground/60 mb-1.5">To · 받는 사람</p>
        <p className="text-xl font-bold mb-1">{order.customer_name}</p>
        <p className="text-sm">{order.customer_phone || "-"}</p>
        <p className="text-sm mt-2 leading-snug">
          {order.customer_zipcode && <span className="font-mono mr-2">[{order.customer_zipcode}]</span>}
          {order.customer_address || "주소 없음"}
        </p>
        {order.delivery_memo && (
          <p className="text-xs mt-2 p-2 bg-muted rounded italic">메모: {order.delivery_memo}</p>
        )}
      </div>

      {/* 상품 정보 */}
      <div className="border-t border-foreground/40 pt-3 mb-4">
        <p className="text-[10px] uppercase tracking-widest text-foreground/60 mb-1.5">Product · 상품</p>
        <p className="text-sm font-medium leading-snug">{order.product_name}</p>
        {order.product_option && <p className="text-xs text-foreground/70">{order.product_option}</p>}
        <p className="text-xs mt-1">수량 {order.quantity || 1}개</p>
      </div>

      {/* 송장 정보 */}
      <div className="border-t-2 border-foreground pt-3 mt-auto">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] uppercase tracking-widest text-foreground/60">
            {order.courier ? COURIERS[order.courier] : "택배사"}
          </span>
          <span className="text-[10px] text-foreground/60">주문번호 {order.order_number || "-"}</span>
        </div>
        <p className="font-mono text-base font-bold mt-1">
          {order.tracking_number || "송장번호 미입력"}
        </p>
      </div>
    </div>
  );
}
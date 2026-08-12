import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const COLS = [
  ["order_date", "주문일"],
  ["order_number", "주문번호"],
  ["product_order_number", "상품주문번호"],
  ["product_name", "상품명"],
  ["product_option", "옵션"],
  ["customer_name", "구매자"],
  ["quantity", "수량"],
  ["price", "구매금액"],
];

export default function OrderPreviewTable({ orders }) {
  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between border-b px-3 py-2 text-xs text-muted-foreground">
        <span>AI 추출 결과 미리보기</span>
        <span>총 {orders.length}건 (최대 10건 표시)</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>{COLS.map(([k, l]) => <TableHead key={k} className="whitespace-nowrap text-xs">{l}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {orders.slice(0, 10).map((o, i) => (
            <TableRow key={i}>
              {COLS.map(([k]) => (
                <TableCell key={k} className="whitespace-nowrap text-xs">
                  {k === "price" && o[k] != null ? `₩${Number(o[k]).toLocaleString()}` : o[k] ?? "-"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
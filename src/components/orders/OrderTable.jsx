import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Package } from "lucide-react";
import ChannelBadge from "@/components/shared/ChannelBadge";
import { STATUSES } from "@/components/shared/constants";

export default function OrderTable({ orders, selected, onToggleSelect, onToggleAll, onStatusChange }) {
  const allSelected = orders.length > 0 && selected.length === orders.length;

  if (orders.length === 0) {
    return (
      <Card className="border-border/70 shadow-sm p-16 text-center">
        <Package className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
        <p className="font-serif text-lg text-foreground">주문이 없습니다</p>
        <p className="text-sm text-muted-foreground mt-1">조건을 변경하거나 새 주문을 추가해보세요</p>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="w-12 px-5 py-4">
                <Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
              </th>
              <th className="text-left px-3 py-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">채널</th>
              <th className="text-left px-3 py-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">주문일</th>
              <th className="text-left px-3 py-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">주문번호</th>
              <th className="text-left px-3 py-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">고객명</th>
              <th className="text-left px-3 py-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">상품</th>
              <th className="text-right px-3 py-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">수량</th>
              <th className="text-right px-3 py-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">금액</th>
              <th className="text-left px-3 py-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">상태</th>
              <th className="text-left px-3 py-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">송장</th>
              <th className="w-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-secondary/30 transition-colors group">
                <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.includes(order.id)}
                    onCheckedChange={() => onToggleSelect(order.id)}
                  />
                </td>
                <td className="px-3 py-4"><ChannelBadge channel={order.channel} /></td>
                <td className="px-3 py-4 text-muted-foreground text-xs whitespace-nowrap">
                  {order.order_date ? format(new Date(order.order_date), "yy.MM.dd", { locale: ko }) : "-"}
                </td>
                <td className="px-3 py-4 font-mono text-xs text-muted-foreground">{order.order_number || "-"}</td>
                <td className="px-3 py-4 font-medium text-foreground whitespace-nowrap">{order.customer_name}</td>
                <td className="px-3 py-4 text-foreground/90 max-w-xs truncate">
                  <Link to={`/orders/${order.id}`} className="hover:text-primary hover:underline">
                    {order.product_name}
                  </Link>
                  {order.product_option && (
                    <span className="text-xs text-muted-foreground block">{order.product_option}</span>
                  )}
                </td>
                <td className="px-3 py-4 text-right tabular-nums text-foreground">{order.quantity || 1}</td>
                <td className="px-3 py-4 text-right tabular-nums font-medium text-foreground whitespace-nowrap">
                  {order.price ? `₩${order.price.toLocaleString()}` : "-"}
                </td>
                <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={order.status || "new"}
                    onValueChange={(value) => onStatusChange(order.id, value)}
                  >
                    <SelectTrigger className={`h-7 text-xs border px-2.5 py-1 rounded-full w-28 ${STATUSES[order.status]?.color || STATUSES.new.color}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUSES).map(([key, val]) => (
                        <SelectItem key={key} value={key} className="text-xs">{val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {order.tracking_number || <span className="text-muted-foreground/50">미입력</span>}
                </td>
                <td className="pr-5"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import ChannelBadge from "@/components/shared/ChannelBadge";
import StatusBadge from "@/components/shared/StatusBadge";

export default function RecentOrders({ orders }) {
  const recent = orders.slice(0, 6);

  return (
    <Card className="border-border/70 shadow-sm overflow-hidden">
      <div className="flex items-baseline justify-between p-7 pb-4">
        <h3 className="font-serif text-xl text-foreground">최근 주문</h3>
        <Link to="/orders" className="text-xs text-primary hover:underline flex items-center gap-1">
          전체 보기 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-border/70">
        {recent.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">아직 주문이 없습니다</p>
        )}
        {recent.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="flex items-center gap-4 px-7 py-4 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <ChannelBadge channel={order.channel} />
                <StatusBadge status={order.status} />
              </div>
              <p className="text-sm font-medium text-foreground truncate">{order.product_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {order.customer_name} · {order.order_date && format(new Date(order.order_date), "M월 d일", { locale: ko })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground tabular-nums">
                {order.price ? `₩${order.price.toLocaleString()}` : "-"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">수량 {order.quantity || 1}</p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
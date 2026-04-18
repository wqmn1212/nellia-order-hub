import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trash2 } from "lucide-react";
import OrderForm from "@/components/orders/OrderForm";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const list = await base44.entities.Order.filter({ id });
      return list[0];
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      navigate("/orders");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Order.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      navigate("/orders");
    },
  });

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">불러오는 중...</div>;
  if (!order) return <div className="p-12 text-center text-muted-foreground">주문을 찾을 수 없습니다</div>;

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-4xl mx-auto">
      <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> 주문 목록으로
      </Link>

      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">
            주문번호 · {order.order_number || "—"}
          </p>
          <h1 className="font-serif text-4xl text-foreground tracking-tight">{order.customer_name}</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => confirm("삭제하시겠습니까?") && deleteMutation.mutate()}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" /> 삭제
        </Button>
      </div>

      <Card className="p-8 border-border/70 shadow-sm">
        <OrderForm
          initial={order}
          onSubmit={(data) => updateMutation.mutate(data)}
          onCancel={() => navigate("/orders")}
          submitLabel="변경사항 저장"
        />
      </Card>
    </div>
  );
}
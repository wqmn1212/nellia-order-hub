import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Truck } from "lucide-react";
import OrderFilters from "@/components/orders/OrderFilters";
import OrderTable from "@/components/orders/OrderTable";
import BulkActions from "@/components/orders/BulkActions";
import OrderForm from "@/components/orders/OrderForm";

export default function Orders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: "", channel: "all", status: "all" });
  const [selected, setSelected] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState(null);

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => base44.entities.Order.list("-created_date", 500),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Order.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Order.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const filtered = orders.filter((o) => {
    const searchMatch = !filters.search || [o.order_number, o.customer_name, o.product_name]
      .filter(Boolean)
      .some((s) => s.toLowerCase().includes(filters.search.toLowerCase()));
    const channelMatch = filters.channel === "all" || o.channel === filters.channel;
    const statusMatch = filters.status === "all" || o.status === filters.status;
    return searchMatch && channelMatch && statusMatch;
  });

  const toggleSelect = (id) =>
    setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map((o) => o.id));

  const bulkUpdate = async (data) => {
    await Promise.all(selected.map((id) => updateMutation.mutateAsync({ id, data })));
    setSelected([]);
  };

  const bulkDelete = async () => {
    if (!confirm(`선택한 ${selected.length}건을 삭제하시겠습니까?`)) return;
    await Promise.all(selected.map((id) => deleteMutation.mutateAsync(id)));
    setSelected([]);
  };

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-[1600px] mx-auto">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Orders</p>
          <h1 className="font-serif text-4xl text-foreground tracking-tight">주문 관리</h1>
          <p className="text-muted-foreground mt-2">모든 채널의 주문을 한 곳에서 관리하세요 · 전체 {orders.length}건</p>
        </div>
        <div className="flex gap-2">
          <Link to="/shipping">
            <Button variant="outline" className="h-11">
              <Truck className="w-4 h-4 mr-2" />
              송장 출력
            </Button>
          </Link>
          <Button onClick={() => setShowForm(true)} className="h-11 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            주문 추가
          </Button>
        </div>
      </div>

      <OrderFilters filters={filters} setFilters={setFilters} />

      <BulkActions
        selectedCount={selected.length}
        onStatusChange={(status) => bulkUpdate({ status })}
        onCourierChange={(courier) => bulkUpdate({ courier })}
        onChannelChange={(channel) => bulkUpdate({ channel })}
        onDelete={bulkDelete}
        onClear={() => setSelected([])}
      />

      <OrderTable
        orders={filtered}
        selected={selected}
        onToggleSelect={toggleSelect}
        onToggleAll={toggleAll}
        onStatusChange={(id, status) => updateMutation.mutate({ id, data: { status } })}
        onEdit={setEditOrder}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">새 주문 추가</DialogTitle>
          </DialogHeader>
          <OrderForm
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
            submitLabel="주문 생성"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editOrder} onOpenChange={(o) => { if (!o) setEditOrder(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">주문 수정</DialogTitle>
          </DialogHeader>
          {editOrder && (
            <OrderForm
              initial={editOrder}
              onSubmit={(data) => {
                updateMutation.mutate({ id: editOrder.id, data });
                setEditOrder(null);
              }}
              onCancel={() => setEditOrder(null)}
              submitLabel="수정 저장"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import GroupBuyForm from "@/components/groupbuy/GroupBuyForm";
import GroupBuyStats from "@/components/groupbuy/GroupBuyStats";
import GroupBuyTable from "@/components/groupbuy/GroupBuyTable";
import MarginPreview from "@/components/groupbuy/MarginPreview";

export default function GroupBuying() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { data: items = [], isLoading } = useQuery({ queryKey: ["groupBuys"], queryFn: () => base44.entities.GroupBuy.list("-created_date") });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => base44.entities.Product.list("name") });
  const save = useMutation({ mutationFn: (data) => editing ? base44.entities.GroupBuy.update(editing.id, data) : base44.entities.GroupBuy.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["groupBuys"] }); setOpen(false); setEditing(null); } });
  const remove = useMutation({ mutationFn: (id) => base44.entities.GroupBuy.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groupBuys"] }) });
  const edit = (item) => { setEditing(item); setOpen(true); };
  const create = () => { setEditing(null); setOpen(true); };
  const preview = editing || items.find((item) => item.status === "active") || items[0] || { sale_price: 0, unit_cost: 0, commission_rate: 0, shipping_fee: 2270 };

  return <div className="p-5 md:p-8 space-y-6 max-w-7xl mx-auto">
    <div className="flex items-start justify-between gap-4"><div><h1 className="font-serif text-3xl font-semibold">공동구매</h1><p className="text-muted-foreground mt-1">공동구매별 원가와 판매 실적을 기준으로 수익을 계산합니다.</p></div><Button onClick={create}><Plus />공동구매 등록</Button></div>
    <GroupBuyStats items={items} />
    <div className="grid lg:grid-cols-[1fr_320px] gap-6"><div>{isLoading ? <div className="py-16 text-center text-muted-foreground">불러오는 중...</div> : <GroupBuyTable items={items} onEdit={edit} onDelete={(item) => { if (window.confirm(`'${item.name}' 공동구매를 삭제할까요?`)) remove.mutate(item.id); }} />}</div><MarginPreview item={preview} /></div>
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) setEditing(null); }}><GroupBuyForm item={editing} products={products} pending={save.isPending} onSubmit={(data) => save.mutate(data)} onClose={() => setOpen(false)} /></Dialog>
  </div>;
}
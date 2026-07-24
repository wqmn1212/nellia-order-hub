import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GroupBuyFields from "@/components/groupbuy/GroupBuyFields";
import MarginPreview from "@/components/groupbuy/MarginPreview";

const empty = { name: "", product_id: "", product_name: "", partner_name: "", status: "planned", start_date: "", end_date: "", unit_cost: 0, sale_price: 0, commission_rate: 0, shipping_fee: 2270, sold_quantity: 0 };
const numeric = ["unit_cost", "sale_price", "commission_rate", "shipping_fee", "sold_quantity"];

export default function GroupBuyForm({ item, products, pending, onSubmit, onClose }) {
  const [form, setForm] = useState(empty);
  useEffect(() => setForm(item ? { ...empty, ...item } : empty), [item]);
  const submit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    numeric.forEach((key) => { payload[key] = Number(payload[key]) || 0; });
    onSubmit(payload);
  };
  return <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader><DialogTitle>{item ? "공동구매 수정" : "공동구매 등록"}</DialogTitle></DialogHeader>
    <form onSubmit={submit} className="space-y-5">
      <GroupBuyFields form={form} setForm={setForm} products={products} />
      <MarginPreview item={form} />
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>취소</Button><Button disabled={pending}>{pending ? "저장 중..." : "저장"}</Button></DialogFooter>
    </form>
  </DialogContent>;
}
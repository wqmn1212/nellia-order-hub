import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fields = [
  ["unit_cost", "제품 원가 (원)", "number"], ["sale_price", "공동구매 가격 (원)", "number"],
  ["commission_rate", "공동구매 수수료 (%)", "number"], ["shipping_fee", "택배비 (원)", "number"],
  ["sold_quantity", "판매 수량", "number"], ["partner_name", "진행처 / 파트너", "text"],
  ["start_date", "시작일", "date"], ["end_date", "종료일", "date"],
];

export default function GroupBuyFields({ form, setForm, products }) {
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="sm:col-span-2 space-y-1.5"><Label>공동구매명</Label><Input required value={form.name} onChange={(e) => update("name", e.target.value)} /></div>
    <div className="space-y-1.5"><Label>제품</Label><select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.product_id} onChange={(e) => { const product = products.find((p) => p.id === e.target.value); setForm((prev) => ({ ...prev, product_id: e.target.value, product_name: product?.name || "" })); }}><option value="">제품 선택</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
    <div className="space-y-1.5"><Label>상태</Label><select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={form.status} onChange={(e) => update("status", e.target.value)}><option value="planned">예정</option><option value="active">진행 중</option><option value="completed">완료</option></select></div>
    {fields.map(([key, label, type]) => <div key={key} className="space-y-1.5"><Label>{label}</Label><Input type={type} min={type === "number" ? 0 : undefined} step={key === "commission_rate" ? "0.1" : "1"} value={form[key]} onChange={(e) => update(key, e.target.value)} /></div>)}
  </div>;
}
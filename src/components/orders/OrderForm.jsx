import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CHANNELS, STATUSES, COURIERS } from "@/components/shared/constants";

export default function OrderForm({ initial, onSubmit, onCancel, submitLabel = "저장" }) {
  const [data, setData] = useState(
    initial || {
      channel: "self_mall",
      status: "new",
      order_date: new Date().toISOString().split("T")[0],
      quantity: 1,
    }
  );

  const set = (k, v) => setData({ ...data, [k]: v });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="채널 *">
          <Select value={data.channel} onValueChange={(v) => set("channel", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CHANNELS).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="주문 상태">
          <Select value={data.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUSES).map(([k, s]) => <SelectItem key={k} value={k}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="주문번호">
          <Input value={data.order_number || ""} onChange={(e) => set("order_number", e.target.value)} placeholder="예: 2024-0001" />
        </Field>
        <Field label="주문일">
          <Input type="date" value={data.order_date || ""} onChange={(e) => set("order_date", e.target.value)} />
        </Field>
      </div>

      <Divider>수령인 정보</Divider>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="수령인 이름 *">
          <Input required value={data.customer_name || ""} onChange={(e) => set("customer_name", e.target.value)} />
        </Field>
        <Field label="연락처">
          <Input value={data.customer_phone || ""} onChange={(e) => set("customer_phone", e.target.value)} placeholder="010-0000-0000" />
        </Field>
        <Field label="우편번호">
          <Input value={data.customer_zipcode || ""} onChange={(e) => set("customer_zipcode", e.target.value)} />
        </Field>
        <Field label="주소" className="md:col-span-2">
          <Input value={data.customer_address || ""} onChange={(e) => set("customer_address", e.target.value)} />
        </Field>
        <Field label="배송 메모" className="md:col-span-2">
          <Input value={data.delivery_memo || ""} onChange={(e) => set("delivery_memo", e.target.value)} placeholder="부재시 문 앞에 놓아주세요" />
        </Field>
      </div>

      <Divider>상품 정보</Divider>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="상품명 *" className="md:col-span-2">
          <Input required value={data.product_name || ""} onChange={(e) => set("product_name", e.target.value)} />
        </Field>
        <Field label="옵션">
          <Input value={data.product_option || ""} onChange={(e) => set("product_option", e.target.value)} />
        </Field>
        <Field label="수량">
          <Input type="number" min="1" value={data.quantity || 1} onChange={(e) => set("quantity", parseInt(e.target.value) || 1)} />
        </Field>
        <Field label="결제 금액 (원)">
          <Input type="number" value={data.price || ""} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} />
        </Field>
      </div>

      <Divider>배송 정보</Divider>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="택배사">
          <Select value={data.courier || ""} onValueChange={(v) => set("courier", v)}>
            <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
            <SelectContent>
              {Object.entries(COURIERS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="송장 번호">
          <Input value={data.tracking_number || ""} onChange={(e) => set("tracking_number", e.target.value)} />
        </Field>
        <Field label="내부 메모" className="md:col-span-2">
          <Textarea value={data.notes || ""} onChange={(e) => set("notes", e.target.value)} rows={3} />
        </Field>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>취소</Button>}
        <Button type="submit" className="bg-primary hover:bg-primary/90">{submitLabel}</Button>
      </div>
    </form>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );
}

function Divider({ children }) {
  return (
    <div className="flex items-center gap-4 pt-2">
      <h4 className="font-serif text-base text-foreground">{children}</h4>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
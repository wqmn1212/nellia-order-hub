import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CLAIM_TYPES = [
  { value: "simple_change", label: "단순 변심" },
  { value: "damaged", label: "파손" },
  { value: "wrong_delivery", label: "오배송" },
  { value: "defective", label: "제품 불량" },
  { value: "delay", label: "배송 지연" },
  { value: "refund", label: "환불 요청" },
  { value: "other", label: "기타" },
];

export default function CsTicketForm({ open, onOpenChange, order }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    claim_type: "",
    priority: "medium",
    memo: "",
  });

  const create = useMutation({
    mutationFn: (data) => base44.entities.CsTicket.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cs-tickets"] });
      onOpenChange(false);
      setForm({ claim_type: "", priority: "medium", memo: "" });
    },
  });

  const handleSubmit = () => {
    create.mutate({
      ...form,
      order_id: order?.id || "",
      order_number: order?.order_number || "",
      customer_name: order?.customer_name || "",
      product_name: order?.product_name || "",
      channel: order?.channel || "",
      status: "received",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>CS 티켓 접수</DialogTitle>
        </DialogHeader>
        {order && (
          <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
            <p><span className="text-muted-foreground">주문번호:</span> {order.order_number || "-"}</p>
            <p><span className="text-muted-foreground">고객:</span> {order.customer_name}</p>
            <p><span className="text-muted-foreground">상품:</span> {order.product_name}</p>
          </div>
        )}
        <div className="space-y-4 pt-2">
          <div>
            <Label>클레임 유형 *</Label>
            <Select value={form.claim_type} onValueChange={(v) => setForm({ ...form, claim_type: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="선택" /></SelectTrigger>
              <SelectContent>
                {CLAIM_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>우선순위</Label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">낮음</SelectItem>
                <SelectItem value="medium">보통</SelectItem>
                <SelectItem value="high">높음</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>상담 메모</Label>
            <Textarea
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              rows={4}
              placeholder="고객 문의 내용, 상황 설명 등"
              className="mt-1.5"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>취소</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!form.claim_type || create.isPending}>
              접수하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ShippingCostDialog({ project, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [currency, setCurrency] = useState(project.shipping_currency || "USD");
  const [amount, setAmount] = useState(project.shipping_cost_foreign ?? "");
  const [rate, setRate] = useState(project.shipping_exchange_rate ?? "");
  const [date, setDate] = useState(project.shipping_date || "");

  const isKrw = currency === "KRW";
  const krw = useMemo(
    () => Math.round((Number(amount) || 0) * (isKrw ? 1 : (Number(rate) || 0))),
    [amount, rate, isKrw]
  );
  const symbol = currency === "USD" ? "$" : currency === "RMB" ? "¥" : "₩";

  const save = useMutation({
    mutationFn: () =>
      base44.entities.SourcingProject.update(project.id, {
        shipping_currency: currency,
        shipping_cost_foreign: Number(amount) || 0,
        shipping_exchange_rate: isKrw ? 1 : (Number(rate) || 0),
        shipping_date: date || undefined,
        shipping_cost_krw: krw,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sourcing"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>물류비 입력 (중국 → 한국)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">통화</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="RMB">RMB (¥)</SelectItem>
                  <SelectItem value="KRW">KRW (₩)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">물류비 ({symbol})</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder={`${symbol} 금액`} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {!isKrw && (
              <div>
                <Label className="text-xs">적용 환율 ({currency}→KRW)</Label>
                <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)}
                  placeholder="예: 1380" className="mt-1" />
              </div>
            )}
            <div>
              <Label className="text-xs">{isKrw ? "기준일" : "환율 기준일"}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50 border border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">환산 물류비 (KRW)</span>
            <span className="text-base font-bold text-primary tabular-nums">₩{krw.toLocaleString()}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
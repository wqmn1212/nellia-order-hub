import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import ShipmentTimeline from "@/components/sourcing/ShipmentTimeline";

const NUM_FIELDS = [
  "factory_price_usd", "total_order_qty",
  "deposit_amount_usd", "deposit_exchange_rate",
  "balance_amount_usd", "balance_exchange_rate",
  "shipping_cost_krw", "customs_tax_krw", "vat_krw", "inland_freight_krw",
];

function calc(f) {
  const depositKrw = (Number(f.deposit_amount_usd) || 0) * (Number(f.deposit_exchange_rate) || 0);
  const balanceKrw = (Number(f.balance_amount_usd) || 0) * (Number(f.balance_exchange_rate) || 0);
  const paymentKrw = depositKrw + balanceKrw;
  const importCosts =
    (Number(f.shipping_cost_krw) || 0) +
    (Number(f.customs_tax_krw) || 0) +
    (Number(f.vat_krw) || 0) +
    (Number(f.inland_freight_krw) || 0);
  const totalLanded = paymentKrw + importCosts;
  const qty = Number(f.total_order_qty) || 0;
  const perUnit = qty > 0 ? Math.round(totalLanded / qty) : 0;
  return { depositKrw, balanceKrw, paymentKrw, importCosts, totalLanded, perUnit };
}

function NumField({ label, value, onChange, suffix }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="relative mt-1">
        <Input type="number" value={value ?? ""} onChange={onChange} className="text-sm" />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

export default function LandedCostBoard({ project }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => {
    const init = {};
    [...NUM_FIELDS, "deposit_date", "balance_date", "production_start_date", "production_end_date", "etd", "eta", "forwarder_name"].forEach((k) => {
      init[k] = project[k] ?? "";
    });
    return init;
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const c = useMemo(() => calc(form), [form]);

  const save = useMutation({
    mutationFn: () => {
      const payload = {};
      NUM_FIELDS.forEach((k) => { payload[k] = Number(form[k]) || 0; });
      ["deposit_date", "balance_date", "production_start_date", "production_end_date", "etd", "eta", "forwarder_name"].forEach((k) => {
        payload[k] = form[k] || undefined;
      });
      payload.total_landed_cost_krw = c.totalLanded;
      return base44.entities.SourcingProject.update(project.id, payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sourcing"] }),
  });

  const won = (n) => `₩${Math.round(n).toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* 선적/물류 일정 */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">선적/물류 일정 (SCM)</h4>
        <div className="bg-secondary/40 rounded-lg p-4">
          <ShipmentTimeline project={{ ...project, ...form }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">생산 시작일</Label>
            <Input type="date" value={form.production_start_date} onChange={set("production_start_date")} className="text-sm mt-1" />
          </div>
          <div>
            <Label className="text-xs">생산 완료일</Label>
            <Input type="date" value={form.production_end_date} onChange={set("production_end_date")} className="text-sm mt-1" />
          </div>
          <div>
            <Label className="text-xs">출항 예정 (ETD)</Label>
            <Input type="date" value={form.etd} onChange={set("etd")} className="text-sm mt-1" />
          </div>
          <div>
            <Label className="text-xs">입항 예정 (ETA)</Label>
            <Input type="date" value={form.eta} onChange={set("eta")} className="text-sm mt-1" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <Label className="text-xs">물류사</Label>
            <Input value={form.forwarder_name} onChange={set("forwarder_name")} placeholder="포워더명" className="text-sm mt-1" />
          </div>
        </div>
      </section>

      {/* 구매/송금 */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">구매 · 송금 (환율 적용)</h4>
        <div className="grid grid-cols-2 gap-3">
          <NumField label="공장 단가 (USD)" value={form.factory_price_usd} onChange={set("factory_price_usd")} suffix="$" />
          <NumField label="총 발주 수량" value={form.total_order_qty} onChange={set("total_order_qty")} suffix="개" />
        </div>
        <div className="rounded-lg border border-border p-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">선금</p>
          <div className="grid grid-cols-3 gap-2">
            <NumField label="금액(USD)" value={form.deposit_amount_usd} onChange={set("deposit_amount_usd")} />
            <NumField label="환율" value={form.deposit_exchange_rate} onChange={set("deposit_exchange_rate")} />
            <div>
              <Label className="text-xs">송금일</Label>
              <Input type="date" value={form.deposit_date} onChange={set("deposit_date")} className="text-sm mt-1" />
            </div>
          </div>
          <p className="text-xs text-right text-muted-foreground">= {won(c.depositKrw)}</p>
        </div>
        <div className="rounded-lg border border-border p-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">잔금</p>
          <div className="grid grid-cols-3 gap-2">
            <NumField label="금액(USD)" value={form.balance_amount_usd} onChange={set("balance_amount_usd")} />
            <NumField label="환율" value={form.balance_exchange_rate} onChange={set("balance_exchange_rate")} />
            <div>
              <Label className="text-xs">송금일</Label>
              <Input type="date" value={form.balance_date} onChange={set("balance_date")} className="text-sm mt-1" />
            </div>
          </div>
          <p className="text-xs text-right text-muted-foreground">= {won(c.balanceKrw)}</p>
        </div>
      </section>

      {/* 수입 부대비용 */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">수입 부대비용 (KRW)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumField label="해운/항공비" value={form.shipping_cost_krw} onChange={set("shipping_cost_krw")} />
          <NumField label="관세" value={form.customs_tax_krw} onChange={set("customs_tax_krw")} />
          <NumField label="부가세" value={form.vat_krw} onChange={set("vat_krw")} />
          <NumField label="내륙/용달" value={form.inland_freight_krw} onChange={set("inland_freight_krw")} />
        </div>
      </section>

      {/* Landed Cost 계산 */}
      <section className="rounded-xl bg-secondary/50 border border-border p-5 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">총 송금액</span>
          <span className="tabular-nums">{won(c.paymentKrw)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">수입 부대비용 합계</span>
          <span className="tabular-nums">{won(c.importCosts)}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-border pt-2">
          <span className="text-muted-foreground">총 수입 원가</span>
          <span className="tabular-nums font-medium">{won(c.totalLanded)}</span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-semibold text-foreground">개당 진짜 원가 (Landed Cost)</span>
          <span className="text-2xl font-bold text-red-600 tabular-nums">{won(c.perUnit)}</span>
        </div>
      </section>

      <Button className="w-full gap-2" onClick={() => save.mutate()} disabled={save.isPending}>
        <Save className="w-4 h-4" /> {save.isPending ? "저장 중..." : "원가/물류 정보 저장"}
      </Button>
    </div>
  );
}
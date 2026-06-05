import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Save, Settings2, Trash2, Megaphone, Ship, ListPlus } from "lucide-react";
import AdCampaignDialog from "@/components/sourcing/AdCampaignDialog";
import ShippingCostDialog from "@/components/sourcing/ShippingCostDialog";
import ExtraCostsDialog from "@/components/sourcing/ExtraCostsDialog";

const NUM_FIELDS = [
  "factory_price_usd", "total_order_qty",
  "deposit_amount_usd", "deposit_exchange_rate",
  "balance_amount_usd", "balance_exchange_rate",
  "customs_tax_krw", "vat_krw", "inland_freight_krw", "sample_cost_krw",
];
const FIELDS = [...NUM_FIELDS, "product_name", "model_number", "etd", "eta"];

function calcPerUnit(f, adTotal = 0, extraTotal = 0) {
  const pay = (Number(f.deposit_amount_usd) || 0) * (Number(f.deposit_exchange_rate) || 0)
    + (Number(f.balance_amount_usd) || 0) * (Number(f.balance_exchange_rate) || 0);
  const extra = (Number(f.shipping_cost_krw) || 0) + (Number(f.customs_tax_krw) || 0)
    + (Number(f.vat_krw) || 0) + (Number(f.inland_freight_krw) || 0)
    + (Number(f.sample_cost_krw) || 0) + (Number(adTotal) || 0) + (Number(extraTotal) || 0);
  const total = pay + extra;
  const qty = Number(f.total_order_qty) || 0;
  return { total, perUnit: qty > 0 ? Math.round(total / qty) : 0 };
}

const Cell = ({ value, onChange, w = "w-20", type = "number", placeholder }) => (
  <td className="px-1.5 py-1.5 border-r border-border/60">
    <input
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      className={`${w} h-8 px-2 text-xs rounded border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring`}
    />
  </td>
);

export default function CostRow({ project, onDetail }) {
  const queryClient = useQueryClient();
  const [f, setF] = useState(() => {
    const init = {};
    FIELDS.forEach((k) => { init[k] = project[k] ?? ""; });
    return init;
  });
  const [dirty, setDirty] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [showShip, setShowShip] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const set = (k) => (e) => { setF((p) => ({ ...p, [k]: e.target.value })); setDirty(true); };
  const adTotal = (project.ad_campaigns || []).reduce((s, a) => s + (Number(a.amount_krw) || 0), 0);
  const extraTotal = (project.extra_costs || []).reduce((s, e) => s + (Number(e.amount_krw) || 0), 0);
  const shippingKrw = Number(project.shipping_cost_krw) || 0;
  const c = useMemo(() => calcPerUnit({ ...f, shipping_cost_krw: shippingKrw }, adTotal, extraTotal), [f, adTotal, shippingKrw, extraTotal]);
  const won = (n) => `₩${Math.round(n).toLocaleString()}`;

  const save = useMutation({
    mutationFn: () => {
      const payload = { product_name: f.product_name, model_number: f.model_number };
      NUM_FIELDS.forEach((k) => { payload[k] = Number(f[k]) || 0; });
      payload.etd = f.etd || undefined;
      payload.eta = f.eta || undefined;
      payload.total_landed_cost_krw = c.total;
      return base44.entities.SourcingProject.update(project.id, payload);
    },
    onSuccess: () => { setDirty(false); queryClient.invalidateQueries({ queryKey: ["sourcing"] }); },
  });

  const del = useMutation({
    mutationFn: () => base44.entities.SourcingProject.delete(project.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sourcing"] }),
  });

  return (
    <tr className="border-b border-border hover:bg-secondary/30">
      <td className="px-1.5 py-1.5 border-r border-border/60 sticky left-0 bg-card z-10">
        <input value={f.product_name} onChange={set("product_name")} placeholder="제품명"
          className="w-32 h-8 px-2 text-xs font-medium rounded border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
        <input value={f.model_number} onChange={set("model_number")} placeholder="품번"
          className="w-32 h-7 px-2 mt-1 text-[11px] text-muted-foreground rounded border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
      </td>
      <Cell value={f.total_order_qty} onChange={set("total_order_qty")} w="w-16" />
      <Cell value={f.factory_price_usd} onChange={set("factory_price_usd")} w="w-16" />
      <Cell value={f.deposit_amount_usd} onChange={set("deposit_amount_usd")} w="w-16" />
      <Cell value={f.deposit_exchange_rate} onChange={set("deposit_exchange_rate")} w="w-16" />
      <Cell value={f.balance_amount_usd} onChange={set("balance_amount_usd")} w="w-16" />
      <Cell value={f.balance_exchange_rate} onChange={set("balance_exchange_rate")} w="w-16" />
      <td className="px-1.5 py-1.5 border-r border-border/60">
        <button onClick={() => setShowShip(true)}
          className="w-28 h-8 px-2 text-xs rounded border border-input bg-transparent hover:bg-secondary/60 flex items-center justify-between gap-1">
          <span className="tabular-nums truncate">{shippingKrw ? `₩${shippingKrw.toLocaleString()}` : "입력"}</span>
          <Ship className="w-3 h-3 text-muted-foreground shrink-0" />
        </button>
        {project.shipping_cost_foreign ? (
          <div className="text-[10px] text-muted-foreground mt-0.5 truncate w-28">
            {project.shipping_currency === "RMB" ? "¥" : "$"}{Number(project.shipping_cost_foreign).toLocaleString()} @{project.shipping_exchange_rate || "-"} · {project.shipping_date || "-"}
          </div>
        ) : null}
      </td>
      <Cell value={f.customs_tax_krw} onChange={set("customs_tax_krw")} w="w-20" />
      <Cell value={f.vat_krw} onChange={set("vat_krw")} w="w-20" />
      <Cell value={f.inland_freight_krw} onChange={set("inland_freight_krw")} w="w-20" />
      <Cell value={f.sample_cost_krw} onChange={set("sample_cost_krw")} w="w-20" />
      <td className="px-1.5 py-1.5 border-r border-border/60">
        <button onClick={() => setShowExtra(true)}
          className="w-28 h-8 px-2 text-xs rounded border border-input bg-transparent hover:bg-secondary/60 flex items-center justify-between gap-1">
          <span className="tabular-nums truncate">{extraTotal ? `₩${extraTotal.toLocaleString()}` : "입력"}</span>
          <ListPlus className="w-3 h-3 text-muted-foreground shrink-0" />
        </button>
        {(project.extra_costs || []).length ? (
          <div className="text-[10px] text-muted-foreground mt-0.5 truncate w-28">
            {(project.extra_costs || []).map((e) => `${e.label}(${e.currency || "KRW"})`).join(", ")}
          </div>
        ) : null}
      </td>
      <td className="px-2 py-1.5 border-r border-border/60 text-right tabular-nums whitespace-nowrap text-muted-foreground">{won(adTotal)}</td>
      <td className="px-2 py-1.5 border-r border-border/60 text-right font-bold text-red-600 tabular-nums whitespace-nowrap text-sm">
        {won(c.perUnit)}
      </td>
      <Cell value={f.eta} onChange={set("eta")} w="w-32" type="date" />
      <td className="px-2 py-1.5 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <Button size="icon" variant={dirty ? "default" : "ghost"} className="h-7 w-7"
            onClick={() => save.mutate()} disabled={save.isPending} title="저장">
            <Save className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDetail(project)} title="QC/RFQ">
            <Settings2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowAd(true)} title="송금일정·광고비">
            <Megaphone className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => del.mutate()} title="삭제">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
      <AdCampaignDialog project={project} open={showAd} onOpenChange={setShowAd} />
      <ShippingCostDialog project={project} open={showShip} onOpenChange={setShowShip} />
      <ExtraCostsDialog project={project} open={showExtra} onOpenChange={setShowExtra} />
    </tr>
  );
}
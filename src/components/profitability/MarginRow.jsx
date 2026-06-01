import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NumCell = ({ value, onChange, w = "w-24" }) => (
  <td className="px-1.5 py-1.5 border-r border-border/60">
    <input type="number" value={value ?? ""} onChange={onChange}
      className={`${w} h-8 px-2 text-xs rounded border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring`} />
  </td>
);

function perUnitCost(proj) {
  if (!proj || !proj.total_order_qty) return 0;
  return Math.round((proj.total_landed_cost_krw || 0) / proj.total_order_qty);
}

export default function MarginRow({ scenario, channels, projects }) {
  const queryClient = useQueryClient();
  const [f, setF] = useState(() => ({
    project_id: scenario.project_id || "",
    channel_name: scenario.channel_name || "",
    commission_rate: scenario.commission_rate ?? 0,
    sale_price_krw: scenario.sale_price_krw ?? "",
    delivery_fee_krw: scenario.delivery_fee_krw ?? "",
    box_cost_krw: scenario.box_cost_krw ?? "",
  }));
  const [dirty, setDirty] = useState(false);
  const upd = (patch) => { setF((p) => ({ ...p, ...patch })); setDirty(true); };

  const proj = projects.find((p) => p.id === f.project_id);
  const cost = perUnitCost(proj);
  const won = (n) => `₩${Math.round(n).toLocaleString()}`;

  const { profit, margin } = useMemo(() => {
    const price = Number(f.sale_price_krw) || 0;
    const commission = Math.round(price * ((Number(f.commission_rate) || 0) / 100));
    const p = price - cost - commission - (Number(f.delivery_fee_krw) || 0) - (Number(f.box_cost_krw) || 0);
    return { profit: p, margin: price > 0 ? (p / price) * 100 : 0 };
  }, [f, cost]);

  const save = useMutation({
    mutationFn: () => base44.entities.MarginScenario.update(scenario.id, {
      project_id: f.project_id,
      product_label: proj ? `${proj.product_name}${proj.model_number ? ` (${proj.model_number})` : ""}` : "",
      channel_name: f.channel_name,
      commission_rate: Number(f.commission_rate) || 0,
      sale_price_krw: Number(f.sale_price_krw) || 0,
      delivery_fee_krw: Number(f.delivery_fee_krw) || 0,
      box_cost_krw: Number(f.box_cost_krw) || 0,
    }),
    onSuccess: () => { setDirty(false); queryClient.invalidateQueries({ queryKey: ["margin-scenarios"] }); },
  });
  const del = useMutation({
    mutationFn: () => base44.entities.MarginScenario.delete(scenario.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["margin-scenarios"] }),
  });

  const marginColor = margin <= 30 ? "bg-red-100 text-red-700" : margin >= 50 ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-foreground";

  return (
    <tr className="border-b border-border hover:bg-secondary/30">
      <td className="px-1.5 py-1.5 border-r border-border/60 sticky left-0 bg-card z-10">
        <Select value={f.channel_name} onValueChange={(v) => {
          const ch = channels.find((c) => c.channel_name === v);
          upd({ channel_name: v, commission_rate: ch?.commission_rate ?? f.commission_rate });
        }}>
          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="플랫폼" /></SelectTrigger>
          <SelectContent>
            {channels.map((c) => <SelectItem key={c.id} value={c.channel_name}>{c.channel_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </td>
      <td className="px-1.5 py-1.5 border-r border-border/60">
        <Select value={f.project_id} onValueChange={(v) => upd({ project_id: v })}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="제품 선택" /></SelectTrigger>
          <SelectContent>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.product_name}{p.model_number ? ` (${p.model_number})` : ""}</SelectItem>)}
          </SelectContent>
        </Select>
      </td>
      <td className="px-2 py-1.5 border-r border-border/60 text-right tabular-nums whitespace-nowrap text-muted-foreground">{won(cost)}</td>
      <NumCell value={f.sale_price_krw} onChange={(e) => upd({ sale_price_krw: e.target.value })} />
      <NumCell value={f.commission_rate} onChange={(e) => upd({ commission_rate: e.target.value })} w="w-16" />
      <NumCell value={f.delivery_fee_krw} onChange={(e) => upd({ delivery_fee_krw: e.target.value })} w="w-20" />
      <NumCell value={f.box_cost_krw} onChange={(e) => upd({ box_cost_krw: e.target.value })} w="w-20" />
      <td className={`px-2 py-1.5 border-r border-border/60 text-right font-bold tabular-nums whitespace-nowrap ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{won(profit)}</td>
      <td className="px-2 py-1.5 border-r border-border/60 text-center whitespace-nowrap">
        <Badge className={`${marginColor} text-[11px]`}>{margin.toFixed(1)}%</Badge>
      </td>
      <td className="px-2 py-1.5 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <Button size="icon" variant={dirty ? "default" : "ghost"} className="h-7 w-7" onClick={() => save.mutate()} disabled={save.isPending} title="저장">
            <Save className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => del.mutate()} title="삭제">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
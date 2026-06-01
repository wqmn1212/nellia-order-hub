import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProfitComparisonChart from "@/components/profitability/ProfitComparisonChart";

export default function MarginSimulator({ channels, projects, logistics }) {
  const [projectId, setProjectId] = useState("");
  const [manualCost, setManualCost] = useState("");
  const [price, setPrice] = useState("");
  const [channelId, setChannelId] = useState("");

  const fixedCost = (logistics?.box_cost_krw || 0) + (logistics?.delivery_fee_krw || 0);

  const landedCost = useMemo(() => {
    const proj = projects.find((p) => p.id === projectId);
    if (proj && proj.total_landed_cost_krw && proj.total_order_qty) {
      return Math.round(proj.total_landed_cost_krw / proj.total_order_qty);
    }
    return Number(manualCost) || 0;
  }, [projectId, manualCost, projects]);

  const compute = (commissionRate) => {
    const p = Number(price) || 0;
    const commission = Math.round(p * (commissionRate / 100));
    const profit = p - landedCost - commission - fixedCost;
    const marginPct = p > 0 ? (profit / p) * 100 : 0;
    return { commission, profit, marginPct };
  };

  const selectedChannel = channels.find((c) => c.id === channelId);
  const result = selectedChannel ? compute(selectedChannel.commission_rate || 0) : null;

  const chartData = useMemo(
    () => channels.map((c) => ({ name: c.channel_name, profit: compute(c.commission_rate || 0).profit })),
    [channels, price, landedCost, fixedCost]
  );

  const won = (n) => `₩${Math.round(n).toLocaleString()}`;

  return (
    <div className="space-y-5">
      <Card className="p-5 space-y-4">
        <h4 className="text-sm font-semibold">마진 시뮬레이터</h4>

        <div>
          <Label className="text-xs">원가 기준 (소싱 프로젝트)</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="프로젝트 선택 (또는 직접 입력)" /></SelectTrigger>
            <SelectContent>
              {projects.filter((p) => p.total_landed_cost_krw).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.product_name} (개당 {won(Math.round((p.total_landed_cost_krw || 0) / (p.total_order_qty || 1)))})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!projectId && (
          <div>
            <Label className="text-xs">원가 직접 입력 (₩)</Label>
            <Input type="number" value={manualCost} onChange={(e) => setManualCost(e.target.value)} placeholder="개당 원가" className="text-sm mt-1" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">판매가 (₩)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="89000" className="text-sm mt-1" />
          </div>
          <div>
            <Label className="text-xs">채널</Label>
            <Select value={channelId} onValueChange={setChannelId}>
              <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="채널 선택" /></SelectTrigger>
              <SelectContent>
                {channels.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.channel_name} ({c.commission_rate || 0}%)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {result && (
          <div className="rounded-xl bg-secondary/50 border border-border p-4 space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">개당 원가</span><span className="tabular-nums">{won(landedCost)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">채널 수수료</span><span className="tabular-nums">-{won(result.commission)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">박스+택배비</span><span className="tabular-nums">-{won(fixedCost)}</span></div>
            <div className="flex items-center justify-between border-t border-border pt-2 mt-1">
              <span className="text-sm font-semibold">순수익</span>
              <span className={`text-2xl font-bold tabular-nums ${result.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{won(result.profit)}</span>
            </div>
            <p className="text-right text-xs text-muted-foreground">마진율 {result.marginPct.toFixed(1)}%</p>
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-3">
        <h4 className="text-sm font-semibold">채널별 순수익 비교</h4>
        <ProfitComparisonChart data={chartData} />
      </Card>
    </div>
  );
}
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 행별 추가비용 입력 셀: 통화 + 금액 + (외화일 때)환율 → KRW 자동 환산
export default function ExtraCostCell({ value, onChange }) {
  const v = value || { currency: "KRW", amount: "", exchange_rate: "" };
  const isForeign = v.currency !== "KRW";
  const rate = isForeign ? Number(v.exchange_rate) || 0 : 1;
  const krw = Math.round((Number(v.amount) || 0) * rate);

  const upd = (patch) => onChange({ ...v, ...patch });

  return (
    <td className="px-1.5 py-1.5 border-r border-border/60 bg-accent/10 align-top">
      <div className="flex flex-col gap-1 w-24">
        <Select value={v.currency || "KRW"} onValueChange={(c) => upd({ currency: c })}>
          <SelectTrigger className="h-7 px-2 text-[11px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="KRW">₩ KRW</SelectItem>
            <SelectItem value="USD">$ USD</SelectItem>
            <SelectItem value="RMB">¥ RMB</SelectItem>
          </SelectContent>
        </Select>
        <input
          type="number"
          value={v.amount ?? ""}
          onChange={(e) => upd({ amount: e.target.value })}
          placeholder="금액"
          className="w-24 h-7 px-2 text-xs rounded border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {isForeign && (
          <input
            type="number"
            value={v.exchange_rate ?? ""}
            onChange={(e) => upd({ exchange_rate: e.target.value })}
            placeholder="환율"
            className="w-24 h-7 px-2 text-[11px] rounded border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
          />
        )}
        {isForeign && (
          <span className="text-[10px] text-muted-foreground tabular-nums">= ₩{krw.toLocaleString()}</span>
        )}
      </div>
    </td>
  );
}
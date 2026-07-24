import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateGroupBuy, formatWon } from "@/lib/groupBuyCalculations";
import { Pencil, Trash2 } from "lucide-react";

const status = { planned: ["예정", "bg-muted text-muted-foreground"], active: ["진행 중", "bg-primary/10 text-primary"], completed: ["완료", "bg-secondary text-secondary-foreground"] };
export default function GroupBuyTable({ items, onEdit, onDelete }) {
  if (!items.length) return <div className="border border-dashed rounded-xl py-16 text-center text-muted-foreground">등록된 공동구매가 없습니다.</div>;
  return <div className="rounded-xl border bg-card"><Table><TableHeader><TableRow><TableHead>공동구매 / 제품</TableHead><TableHead>상태</TableHead><TableHead className="text-right">판매가</TableHead><TableHead className="text-right">판매수량</TableHead><TableHead className="text-right">건당 수익</TableHead><TableHead className="text-right">총수익</TableHead><TableHead /></TableRow></TableHeader><TableBody>
    {items.map((item) => { const calc = calculateGroupBuy(item); const state = status[item.status] || status.planned; return <TableRow key={item.id}>
      <TableCell><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.product_name || "제품 미지정"}{item.partner_name ? ` · ${item.partner_name}` : ""}</p></TableCell>
      <TableCell><span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${state[1]}`}>{state[0]}</span></TableCell>
      <TableCell className="text-right">{formatWon(item.sale_price)}</TableCell><TableCell className="text-right">{Number(item.sold_quantity || 0).toLocaleString()}개</TableCell>
      <TableCell className="text-right"><p className={calc.unitProfit < 0 ? "text-destructive font-medium" : "font-medium"}>{formatWon(calc.unitProfit)}</p><p className="text-xs text-muted-foreground">{calc.marginRate.toFixed(1)}%</p></TableCell>
      <TableCell className="text-right font-semibold">{formatWon(calc.totalProfit)}</TableCell>
      <TableCell><div className="flex justify-end"><Button size="icon" variant="ghost" onClick={() => onEdit(item)}><Pencil /></Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => onDelete(item)}><Trash2 /></Button></div></TableCell>
    </TableRow>; })}
  </TableBody></Table></div>;
}
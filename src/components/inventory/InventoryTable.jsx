import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SlidersHorizontal, Package } from "lucide-react";

const CATEGORY_LABELS = {
  hair_dryer: "드라이어",
  styler: "스타일러",
  straightener: "고데기",
  accessory: "액세서리",
  other: "기타",
};

function stockBadge(p) {
  const stock = p.stock_quantity || 0;
  const threshold = p.stock_alert_threshold ?? 10;
  if (stock <= 0) return <Badge className="bg-rose-100 text-rose-700">품절</Badge>;
  if (stock <= threshold) return <Badge className="bg-amber-100 text-amber-700">부족</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700">정상</Badge>;
}

export default function InventoryTable({ products, onAdjust }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
        <Package className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">제품이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>제품명</TableHead>
            <TableHead>모델번호</TableHead>
            <TableHead>카테고리</TableHead>
            <TableHead className="text-right">현재 재고</TableHead>
            <TableHead className="text-center">상태</TableHead>
            <TableHead className="text-right">조정</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{p.model_number || "-"}</TableCell>
              <TableCell className="text-sm">{CATEGORY_LABELS[p.category] || "-"}</TableCell>
              <TableCell className="text-right font-bold tabular-nums">{(p.stock_quantity || 0).toLocaleString()}개</TableCell>
              <TableCell className="text-center">{stockBadge(p)}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onAdjust(p)}>
                  <SlidersHorizontal className="w-3.5 h-3.5" /> 조정
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
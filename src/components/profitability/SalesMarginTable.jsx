import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import MarginRow from "@/components/profitability/MarginRow";

const COLS = ["판매 플랫폼", "소싱 제품", "개당 수입원가(₩)", "판매가(₩)", "수수료율(%)", "배송비(₩)", "박스비(₩)", "진짜 순수익(₩)", "마진율", "판매수량", "총매출(₩)", "총지출(₩)", "총이익(₩)", ""];

export default function SalesMarginTable({ channels, projects }) {
  const queryClient = useQueryClient();
  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ["margin-scenarios"],
    queryFn: () => base44.entities.MarginScenario.list("-created_date", 100),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("-created_date", 200),
  });

  const addRow = useMutation({
    mutationFn: () => base44.entities.MarginScenario.create({ commission_rate: 0, sale_price_krw: 0 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["margin-scenarios"] }),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">채널별 판매 · 마진 시뮬레이션</h2>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => addRow.mutate()}>
          <Plus className="w-4 h-4" /> 행 추가
        </Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-secondary/60 border-b border-border">
              {COLS.map((c, i) => (
                <th key={i} className={`px-2 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap border-r border-border/60 ${i === 0 ? "sticky left-0 bg-secondary z-10" : ""} ${["진짜 순수익(₩)", "총매출(₩)", "총지출(₩)", "총이익(₩)"].includes(c) ? "text-right text-primary" : ""} ${c === "판매수량" ? "text-right" : ""}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={COLS.length} className="py-10 text-center text-muted-foreground">불러오는 중...</td></tr>
            ) : scenarios.length === 0 ? (
              <tr><td colSpan={COLS.length} className="py-10 text-center text-muted-foreground">‘행 추가’로 판매 시나리오를 만들어보세요</td></tr>
            ) : (
              scenarios.map((s) => <MarginRow key={s.id} scenario={s} channels={channels} projects={projects} products={products} />)
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        마진율 30% 이하 <span className="text-red-600 font-medium">빨강</span> · 50% 이상 <span className="text-emerald-600 font-medium">초록</span>으로 강조됩니다.
      </p>
    </div>
  );
}
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, TrendingUp } from "lucide-react";
import KpiGauge from "@/components/kpi/KpiGauge";
import KpiTrendChart from "@/components/kpi/KpiTrendChart";
import KpiEditModal from "@/components/kpi/KpiEditModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import AiTaskRecommender from "@/components/shared/AiTaskRecommender";
import moment from "moment";

const THIS_MONTH = moment().format("YYYY-MM");

const METRIC_PRESETS = [
  { key: "new_customers", label: "신규 고객 수", unit: "명" },
  { key: "roas", label: "ROAS", unit: "배" },
  { key: "conversion_rate", label: "전환율", unit: "%" },
  { key: "sns_followers", label: "SNS 팔로워 증가", unit: "명" },
  { key: "ad_spend", label: "광고비 집행", unit: "원" },
  { key: "revenue", label: "매출액", unit: "원" },
];

export default function MarketingKpi() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState(THIS_MONTH);
  const [editTarget, setEditTarget] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ metric_name: "", metric_key: "", target_value: "", current_value: "0", unit: "", notes: "" });

  const { data: allKpis = [] } = useQuery({
    queryKey: ["kpis", "marketing"],
    queryFn: () => base44.entities.Kpi.filter({ team: "marketing" }, "-period", 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, current_value }) => base44.entities.Kpi.update(id, { current_value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kpis"] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Kpi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      setShowAdd(false);
      setAddForm({ metric_name: "", metric_key: "", target_value: "", current_value: "0", unit: "", notes: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Kpi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kpis"] }),
  });

  // 이번 달 KPIs
  const monthKpis = useMemo(
    () => allKpis.filter((k) => k.period === period),
    [allKpis, period]
  );

  // 추이 데이터: 지표별로 최근 6개월
  const trendData = useMemo(() => {
    const periods = Array.from(new Set(allKpis.map((k) => k.period))).sort().slice(-6);
    return periods.map((p) => {
      const row = { period: p };
      METRIC_PRESETS.forEach(({ key, label }) => {
        const found = allKpis.find((k) => k.period === p && k.metric_key === key);
        if (found) row[key] = found.current_value;
      });
      return row;
    });
  }, [allKpis]);

  const existingMetricKeys = useMemo(() => monthKpis.map((k) => k.metric_key).filter(Boolean), [monthKpis]);

  // 월 선택지 (최근 6개월)
  const periodOptions = Array.from({ length: 6 }, (_, i) =>
    moment().subtract(i, "months").format("YYYY-MM")
  );

  const handleAddSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...addForm,
      team: "marketing",
      target_value: Number(addForm.target_value),
      current_value: Number(addForm.current_value),
      period,
    });
  };

  const applyPreset = (preset) => {
    setAddForm((prev) => ({ ...prev, metric_name: preset.label, metric_key: preset.key, unit: preset.unit }));
  };

  const overallPct = useMemo(() => {
    if (!monthKpis.length) return 0;
    const avg = monthKpis.reduce((acc, k) => acc + (k.target_value > 0 ? (k.current_value / k.target_value) * 100 : 0), 0) / monthKpis.length;
    return Math.round(avg);
  }, [monthKpis]);

  const overallColor = overallPct >= 100 ? "text-green-600" : overallPct >= 70 ? "text-amber-600" : "text-rose-600";

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-[1400px] mx-auto">
      {/* 헤더 */}
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">KPI</p>
          <h1 className="font-serif text-4xl text-foreground tracking-tight">마케팅 성과 관리</h1>
          <p className="text-muted-foreground mt-2">월별 목표 대비 달성 현황 · 추이 분석</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAdd(true)} className="h-10 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-1" /> KPI 추가
          </Button>
        </div>
      </div>

      {/* 종합 달성률 배너 */}
      {monthKpis.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-8 flex items-center gap-6">
          <TrendingUp className="w-8 h-8 text-primary shrink-0" />
          <div>
            <p className="text-sm text-muted-foreground">{period} 종합 달성률</p>
            <p className={`text-3xl font-bold ${overallColor}`}>{overallPct}%</p>
          </div>
          <div className="ml-auto hidden md:flex gap-6 text-sm text-muted-foreground">
            <span>총 {monthKpis.length}개 지표</span>
            <span className="text-green-600 font-medium">목표 달성 {monthKpis.filter(k => k.current_value >= k.target_value).length}개</span>
            <span className="text-rose-600 font-medium">미달 {monthKpis.filter(k => k.current_value < k.target_value).length}개</span>
          </div>
        </div>
      )}

      {/* 게이지 그리드 */}
      {monthKpis.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-16 text-center text-muted-foreground mb-8">
          <p className="text-lg mb-2">이 달의 KPI가 없습니다</p>
          <p className="text-sm">상단의 'KPI 추가' 버튼으로 지표를 등록해보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
          {monthKpis.map((kpi) => (
            <div
              key={kpi.id}
              className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow group relative"
            >
              <KpiGauge
                label={kpi.metric_name}
                current={kpi.current_value}
                target={kpi.target_value}
                unit={kpi.unit}
              />
              <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditTarget(kpi)}
                  className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" /> 수정
                </button>
                <button
                  onClick={() => { if (confirm("삭제하시겠습니까?")) deleteMutation.mutate(kpi.id); }}
                  className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100"
                >
                  삭제
                </button>
              </div>
              {kpi.notes && (
                <p className="text-[10px] text-muted-foreground text-center">{kpi.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 추이 차트 */}
      {trendData.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <KpiTrendChart
            data={trendData}
            metrics={METRIC_PRESETS.slice(0, 3)}
            title="신규 고객 · 전환율 · ROAS 추이"
          />
          <KpiTrendChart
            data={trendData}
            metrics={METRIC_PRESETS.slice(3, 6)}
            title="SNS 팔로워 · 광고비 · 매출 추이"
          />
        </div>
      )}

      {/* AI 태스크 추천 */}
      <div className="mt-8">
        <AiTaskRecommender context="marketing" />
      </div>

      {/* KPI 수정 모달 */}
      {editTarget && (
        <KpiEditModal
          kpi={editTarget}
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(id, current_value) => {
            updateMutation.mutate({ id, current_value });
            setEditTarget(null);
          }}
          isSaving={updateMutation.isPending}
        />
      )}

      {/* KPI 추가 모달 */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">KPI 추가 · {period}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            {/* 프리셋 */}
            <div className="space-y-1.5">
              <Label>빠른 선택</Label>
              <div className="flex flex-wrap gap-2">
                {METRIC_PRESETS.filter(p => !existingMetricKeys.includes(p.key)).map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      addForm.metric_key === p.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>지표명 *</Label>
                <Input
                  value={addForm.metric_name}
                  onChange={(e) => setAddForm(f => ({ ...f, metric_name: e.target.value }))}
                  placeholder="예: 신규 고객 수"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>단위</Label>
                <Input
                  value={addForm.unit}
                  onChange={(e) => setAddForm(f => ({ ...f, unit: e.target.value }))}
                  placeholder="예: 명, %, 원"
                />
              </div>
              <div className="space-y-1.5">
                <Label>목표값 *</Label>
                <Input
                  type="number"
                  value={addForm.target_value}
                  onChange={(e) => setAddForm(f => ({ ...f, target_value: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>현재 달성값</Label>
                <Input
                  type="number"
                  value={addForm.current_value}
                  onChange={(e) => setAddForm(f => ({ ...f, current_value: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>비고</Label>
              <Input
                value={addForm.notes}
                onChange={(e) => setAddForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="선택 사항"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>취소</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                추가
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
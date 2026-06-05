import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertTriangle, Lightbulb, Loader2 } from "lucide-react";
import { PLATFORMS, aggregate, won } from "./adConstants";

const SEVERITY = {
  high: { label: "긴급", cls: "bg-destructive/10 text-destructive border-destructive/30" },
  medium: { label: "주의", cls: "bg-amber-100 text-amber-700 border-amber-300" },
  low: { label: "참고", cls: "bg-secondary text-secondary-foreground border-border" },
};

export default function AiInsightsPanel({ rows }) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState([]);
  const [summary, setSummary] = useState("");

  const analyze = async () => {
    setLoading(true);
    const byPlatform = PLATFORMS.map((p) => {
      const m = aggregate(rows.filter((r) => r.platform === p.key));
      return { 매체: p.label, 지출: m.spend, ROAS: `${m.roas}%`, CPC: m.cpc, 전환: m.conversions };
    }).filter((x) => x.지출 > 0);

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `너는 넬리아(헤어 뷰티 브랜드)의 시니어 퍼포먼스 마케터다. 아래는 매체별 광고 성과 데이터다.\n${JSON.stringify(byPlatform, null, 2)}\n\n각 매체의 효율(ROAS, CPC, 전환)을 진단해 문제점을 찾고, 예산 재배분/캠페인 ON-OFF 관점의 구체적 액션을 제시하라. ROAS 200% 미만은 비효율로 본다. 한국어로 답하라.`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string", description: "전체 광고 운영 한줄 총평" },
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                platform: { type: "string" },
                severity: { type: "string", enum: ["high", "medium", "low"] },
                problem: { type: "string" },
                action: { type: "string" },
              },
            },
          },
        },
      },
    });
    setSummary(res.summary || "");
    setInsights(res.insights || []);
    setLoading(false);
  };

  const total = aggregate(rows);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" /> AI 퍼포먼스 마케터
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            총 지출 {won(total.spend)} · 평균 ROAS {total.roas}%
          </p>
        </div>
        <Button size="sm" onClick={analyze} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          분석 실행
        </Button>
      </div>

      {summary && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm mb-3">{summary}</div>
      )}

      <div className="space-y-2">
        {!loading && insights.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
            [분석 실행]을 누르면 AI가 광고 문제점과 해결책을 제시합니다
          </p>
        )}
        {insights.map((ins, i) => {
          const sev = SEVERITY[ins.severity] || SEVERITY.low;
          return (
            <div key={i} className="p-3 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${sev.cls}`}>{sev.label}</span>
                <span className="text-sm font-semibold">{ins.platform}</span>
              </div>
              <p className="text-xs text-foreground/80 flex gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" /> {ins.problem}
              </p>
              <p className="text-xs text-foreground/80 flex gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> {ins.action}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
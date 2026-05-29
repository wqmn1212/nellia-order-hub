import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Plus, Loader2, ChevronDown, ChevronUp } from "lucide-react";

const ASSIGNEE_MAP = { ceo: "대표", designer: "디자이너", marketer: "마케터", logistics: "물류/운영" };
const PRIORITY_COLOR = { low: "bg-slate-100 text-slate-600", medium: "bg-blue-50 text-blue-700", high: "bg-orange-100 text-orange-700", urgent: "bg-red-100 text-red-700" };
const PRIORITY_LABEL = { low: "낮음", medium: "보통", high: "높음", urgent: "긴급" };

export default function AiTaskRecommender({ context = "general" }) {
  const queryClient = useQueryClient();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [addingIdx, setAddingIdx] = useState(null);

  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: () => base44.entities.Order.list("-created_date", 100) });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => base44.entities.Product.list("-created_date", 50) });
  const { data: kpis = [] } = useQuery({ queryKey: ["kpis", "marketing"], queryFn: () => base44.entities.Kpi.filter({ team: "marketing" }, "-period", 50) });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => base44.entities.Task.list("-created_date", 100) });

  const buildPrompt = () => {
    const orderSummary = orders.length > 0
      ? `최근 주문 ${orders.length}건. 채널별: ${[...new Set(orders.map(o => o.channel))].map(ch => `${ch}: ${orders.filter(o => o.channel === ch).length}건`).join(", ")}. 상태별: ${["new","preparing","shipped","delivered","cancelled"].map(s => `${s}: ${orders.filter(o => o.status === s).length}건`).join(", ")}`
      : "주문 데이터 없음";

    const productSummary = products.length > 0
      ? products.map(p => `${p.name} (재고:${p.stock_quantity || 0}, 가격:${p.price || "미정"}원, 카테고리:${p.category || "기타"})`).join("; ")
      : "제품 데이터 없음";

    const kpiSummary = kpis.length > 0
      ? kpis.slice(0, 10).map(k => `${k.metric_name}: 목표 ${k.target_value}${k.unit} / 현재 ${k.current_value}${k.unit} (${k.period})`).join("; ")
      : "KPI 데이터 없음";

    const existingTasks = tasks.filter(t => t.status !== "done" && t.status !== "cancelled").map(t => t.title).join(", ");

    const contextHint = {
      general: "전반적인 판매 증대 전략",
      calendar: "팀 일정과 업무 흐름 최적화 관점에서의 판매 증대",
      marketing: "마케팅 성과 개선과 KPI 달성 관점에서의 판매 증대",
      analytics: "데이터 분석 기반 매출 성장과 전환율 개선",
    }[context] || "전반적인 판매 증대 전략";

    return `당신은 뷰티 브랜드 '넬리아(Nellia)'의 전략 컨설턴트입니다. 넬리아는 헤어드라이어와 스타일링 도구를 판매하는 브랜드입니다.

현재 데이터:
- 주문 현황: ${orderSummary}
- 제품 목록: ${productSummary}
- 마케팅 KPI: ${kpiSummary}
- 진행 중인 업무: ${existingTasks || "없음"}

분석 관점: ${contextHint}

위 데이터와 최신 뷰티/헤어케어 시장 트렌드, 경쟁사 동향을 종합적으로 분석하여, 제품 판매를 극대화하기 위한 구체적이고 실행 가능한 업무 태스크 5개를 추천해주세요.
기존 진행 중인 업무와 중복되지 않는 새로운 태스크를 제안해주세요.`;
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt(),
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                assignee: { type: "string", enum: ["ceo", "designer", "marketer", "logistics"] },
                priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                reason: { type: "string" },
              },
            },
          },
        },
      },
    });
    setRecommendations(result.tasks || []);
    setLoading(false);
  };

  const addTask = async (rec, idx) => {
    setAddingIdx(idx);
    await base44.entities.Task.create({
      title: rec.title,
      description: rec.description,
      assignee: rec.assignee,
      priority: rec.priority,
      status: "todo",
    });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    setRecommendations(prev => prev.filter((_, i) => i !== idx));
    setAddingIdx(null);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">AI 태스크 추천</p>
            <p className="text-[11px] text-muted-foreground">데이터 기반 판매 증대 업무 제안</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3">
          {recommendations.length === 0 && !loading && (
            <Button onClick={fetchRecommendations} className="w-full gap-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700">
              <Sparkles className="w-4 h-4" /> AI 추천 태스크 생성하기
            </Button>
          )}

          {loading && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">데이터를 분석하고 있습니다...</p>
            </div>
          )}

          {recommendations.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">{recommendations.length}개의 추천 태스크</p>
                <Button variant="ghost" size="sm" onClick={fetchRecommendations} disabled={loading} className="gap-1.5 text-xs h-7">
                  <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> 다시 분석
                </Button>
              </div>
              <div className="space-y-2.5">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-background border border-border rounded-lg p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground leading-snug flex-1">{rec.title}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1 text-xs h-7"
                        onClick={() => addTask(rec, idx)}
                        disabled={addingIdx === idx}
                      >
                        {addingIdx === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        추가
                      </Button>
                    </div>
                    {rec.description && <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLOR[rec.priority] || ""}`}>
                        {PRIORITY_LABEL[rec.priority] || rec.priority}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {ASSIGNEE_MAP[rec.assignee] || rec.assignee}
                      </Badge>
                    </div>
                    {rec.reason && (
                      <p className="text-[11px] text-violet-600 bg-violet-50 rounded-md px-2.5 py-1.5 leading-relaxed">
                        💡 {rec.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
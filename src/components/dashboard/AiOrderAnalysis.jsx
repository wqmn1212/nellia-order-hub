import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, AlertTriangle, MessageSquare, RefreshCw } from "lucide-react";

const URGENCY_STYLE = {
  긴급: "bg-red-100 text-red-700 border-red-200",
  보통: "bg-amber-100 text-amber-700 border-amber-200",
  여유: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const INQUIRY_STYLE = {
  배송문의: "bg-blue-100 text-blue-700",
  교환반품: "bg-rose-100 text-rose-700",
  제품문의: "bg-violet-100 text-violet-700",
  일반: "bg-gray-100 text-gray-600",
};

export default function AiOrderAnalysis({ orders }) {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const recentOrders = orders.slice(0, 20);

  const analyze = async () => {
    setIsLoading(true);
    setResult(null);

    const today = new Date().toISOString().split("T")[0];
    const orderSummaries = recentOrders.map((o) => ({
      id: o.id,
      order_number: o.order_number || "번호없음",
      customer_name: o.customer_name,
      product_name: o.product_name,
      order_date: o.order_date,
      status: o.status,
      delivery_memo: o.delivery_memo || "",
      channel: o.channel,
    }));

    const prompt = `오늘 날짜: ${today}
당신은 넬리아(Nellia) 뷰티 브랜드의 주문 분석 AI입니다.
아래 최근 주문 목록을 분석하여 각 주문의 시급성과 고객 문의 유형을 분류해주세요.

주문 목록:
${JSON.stringify(orderSummaries, null, 2)}

분류 기준:
- urgency(시급성): "긴급"(오늘 주문이거나 배송 메모에 빠른 처리 요청 있는 경우), "보통"(일반 처리), "여유"(출고완료 또는 여유 있는 경우)
- inquiry_type(문의유형): "배송문의"(배송 메모에 위치/배송 관련), "교환반품"(교환/반품 관련 메모), "제품문의"(제품 관련 메모), "일반"(특이사항 없음)
- reason: 분류 이유를 한 문장으로 간략하게

각 주문의 분석 결과와 함께 전체 요약도 제공해주세요.`;

    const data = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          orders: {
            type: "array",
            items: {
              type: "object",
              properties: {
                order_number: { type: "string" },
                customer_name: { type: "string" },
                urgency: { type: "string" },
                inquiry_type: { type: "string" },
                reason: { type: "string" },
              },
            },
          },
          summary: { type: "string" },
          urgent_count: { type: "number" },
          inquiry_breakdown: {
            type: "object",
            properties: {
              배송문의: { type: "number" },
              교환반품: { type: "number" },
              제품문의: { type: "number" },
              일반: { type: "number" },
            },
          },
        },
      },
    });

    setResult(data);
    setIsLoading(false);
  };

  return (
    <Card className="p-6 border-border/70 shadow-sm bg-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">AI 주문 분석</p>
            <p className="text-sm font-semibold text-foreground">시급성 · 문의 자동 태깅</p>
          </div>
        </div>
        <Button
          size="sm"
          variant={result ? "outline" : "default"}
          onClick={analyze}
          disabled={isLoading || orders.length === 0}
          className="h-8 text-xs"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin mr-1" />
          ) : result ? (
            <RefreshCw className="w-3 h-3 mr-1" />
          ) : (
            <Sparkles className="w-3 h-3 mr-1" />
          )}
          {isLoading ? "분석 중..." : result ? "재분석" : "AI 분석 시작"}
        </Button>
      </div>

      {/* 초기 상태 */}
      {!result && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">최근 {Math.min(orders.length, 20)}건의 주문을 AI가 분석합니다</p>
          <p className="text-xs mt-1 opacity-70">시급성과 고객 문의 유형을 자동으로 태깅합니다</p>
        </div>
      )}

      {/* 로딩 */}
      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary opacity-60" />
          <p className="text-sm">주문 데이터를 분석하는 중...</p>
        </div>
      )}

      {/* 결과 */}
      {result && !isLoading && (
        <div className="space-y-4">
          {/* 요약 */}
          <div className="bg-secondary/50 rounded-lg px-4 py-3 text-sm text-foreground/80 leading-relaxed">
            {result.summary}
          </div>

          {/* 집계 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">긴급 주문</p>
                <p className="text-xl font-serif font-semibold text-red-700">{result.urgent_count ?? 0}건</p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 px-4 py-3 flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">교환/반품</p>
                <p className="text-xl font-serif font-semibold text-foreground">
                  {result.inquiry_breakdown?.교환반품 ?? 0}건
                </p>
              </div>
            </div>
          </div>

          {/* 문의 유형 분포 */}
          {result.inquiry_breakdown && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.inquiry_breakdown).map(([type, count]) =>
                count > 0 ? (
                  <span key={type} className={`text-xs px-2.5 py-1 rounded-full font-medium ${INQUIRY_STYLE[type] || "bg-gray-100 text-gray-600"}`}>
                    {type} {count}건
                  </span>
                ) : null
              )}
            </div>
          )}

          {/* 주문별 태그 목록 */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {result.orders?.map((o, i) => (
              <div key={i} className="flex items-start gap-2 py-2 border-b border-border/40 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{o.reason}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Badge className={`text-[10px] px-2 py-0.5 border ${URGENCY_STYLE[o.urgency] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    {o.urgency}
                  </Badge>
                  <Badge className={`text-[10px] px-2 py-0.5 ${INQUIRY_STYLE[o.inquiry_type] || "bg-gray-100 text-gray-600"}`}>
                    {o.inquiry_type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
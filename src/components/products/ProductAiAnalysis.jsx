import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";

export default function ProductAiAnalysis({ product }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const hasAnalysis = product.ai_features || product.ai_advantages || product.ai_selling_points;

  const generateAnalysis = async () => {
    setLoading(true);
    const prompt = `당신은 뷰티 브랜드 전문 마케팅 컨설턴트입니다.

아래 제품 정보를 바탕으로 한국 시장에 맞는 상세 분석을 해주세요:

제품명: ${product.name}
카테고리: ${product.category || "미분류"}
가격: ${product.price ? product.price + "원" : "미정"}
제품 설명: ${product.short_description || "없음"}
스펙: ${product.specs || "없음"}
특징: ${product.features || "없음"}
현재 타겟: ${product.target_audience || "없음"}

각 항목을 구체적이고 실행 가능하게 3-5줄로 작성해주세요.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          ai_features: { type: "string", description: "제품 핵심 특징 분석" },
          ai_advantages: { type: "string", description: "제품 강점/장점 분석" },
          ai_selling_points: { type: "string", description: "효과적인 판매 포인트" },
          ai_target_audience: { type: "string", description: "최적 타겟 고객 분석" },
          ai_sales_strategy: { type: "string", description: "판매 전략 제안" },
        },
      },
    });

    await base44.entities.Product.update(product.id, {
      ai_features: result.ai_features,
      ai_advantages: result.ai_advantages,
      ai_selling_points: result.ai_selling_points,
      ai_target_audience: result.ai_target_audience,
      ai_sales_strategy: result.ai_sales_strategy,
    });

    queryClient.invalidateQueries({ queryKey: ["products"] });
    setLoading(false);
  };

  const sections = [
    { key: "ai_features", label: "핵심 특징", emoji: "🔍" },
    { key: "ai_advantages", label: "강점/장점", emoji: "💪" },
    { key: "ai_selling_points", label: "판매 포인트", emoji: "🎯" },
    { key: "ai_target_audience", label: "타겟 고객", emoji: "👤" },
    { key: "ai_sales_strategy", label: "판매 전략", emoji: "📈" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold">AI 제품 분석</span>
        </div>
        <Button
          variant={hasAnalysis ? "ghost" : "default"}
          size="sm"
          onClick={generateAnalysis}
          disabled={loading}
          className={`gap-1.5 text-xs ${!hasAnalysis ? "bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700" : ""}`}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : hasAnalysis ? <RefreshCw className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
          {loading ? "분석 중..." : hasAnalysis ? "재분석" : "AI 분석 생성"}
        </Button>
      </div>

      {hasAnalysis && (
        <div className="space-y-2">
          {sections.map(({ key, label, emoji }) => product[key] && (
            <div key={key} className="bg-muted/40 rounded-lg px-3 py-2.5">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1">{emoji} {label}</p>
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{product[key]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, Truck, Bell, CheckCircle2, Loader2, ChevronDown, ChevronUp, Copy, Slack
} from "lucide-react";

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

const CHANNEL_KO = {
  coupang: "쿠팡", naver: "네이버", wadiz: "와디즈",
  toss: "토스", kakao: "카카오", self_mall: "자사몰", other: "기타",
};

function TrackingDraftModal({ order, onClose }) {
  const [draft, setDraft] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setIsLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `넬리아 CRM 시스템입니다. 아래 긴급 주문에 대한 운송장 처리 요청서 초안을 작성해주세요.

주문 정보:
- 주문번호: ${order.order_number || "미등록"}
- 고객명: ${order.customer_name}
- 상품명: ${order.product_name || "-"}
- 채널: ${CHANNEL_KO[order.channel] || order.channel}
- 주문일: ${order.order_date || "-"}
- 배송 메모: ${order.delivery_memo || "없음"}
- 분류 이유: ${order.reason}

다음 형식으로 간결한 운송장 처리 요청서를 한국어로 작성해주세요:
1. 처리 요청 사유 (1-2문장)
2. 필요 조치 (출고 준비, 택배사 연락 등)
3. 예상 출고 일정 제안
4. 물류팀 전달 메모`,
    });
    setDraft(result);
    setIsLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            <p className="font-semibold text-sm">운송장 처리 요청서 초안</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">닫기</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p><span className="font-medium text-foreground">고객:</span> {order.customer_name}</p>
            <p><span className="font-medium text-foreground">주문번호:</span> {order.order_number || "미등록"}</p>
            <p><span className="font-medium text-foreground">채널:</span> {CHANNEL_KO[order.channel] || order.channel}</p>
          </div>

          {!draft && !isLoading && (
            <Button onClick={generate} className="w-full gap-2" size="sm">
              <Truck className="w-3.5 h-3.5" />
              AI로 요청서 초안 생성
            </Button>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> 초안 작성 중...
            </div>
          )}

          {draft && (
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap text-foreground leading-relaxed max-h-64 overflow-y-auto">
                {draft}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={handleCopy}>
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "복사됨" : "클립보드 복사"}
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={generate}>
                  <Loader2 className="w-3.5 h-3.5" /> 재생성
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SlackNotifyModal({ order, onClose }) {
  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateMessage = async () => {
    setIsGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `넬리아 CRM에서 물류팀 슬랙 채널에 보낼 긴급 주문 알림 메시지를 작성해주세요.
슬랙 마크다운 형식으로 간결하고 명확하게 작성하세요. 이모지 활용.

주문 정보:
- 주문번호: ${order.order_number || "미등록"}
- 고객명: ${order.customer_name}
- 상품명: ${order.product_name || "-"}
- 채널: ${CHANNEL_KO[order.channel] || order.channel}
- 주문일: ${order.order_date || "-"}
- 배송 메모: ${order.delivery_memo || "없음"}
- 긴급 사유: ${order.reason}

메시지 형식: 제목(긴급 알림), 주요 정보 요약, 필요 조치, 담당자 태그(@물류팀)`,
    });
    setMessage(result);
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setIsSent(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <p className="font-semibold text-sm">물류팀 슬랙 알림</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">닫기</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p><span className="font-medium text-foreground">고객:</span> {order.customer_name}</p>
            <p><span className="font-medium text-foreground">채널:</span> {CHANNEL_KO[order.channel] || order.channel}</p>
            <p><span className="font-medium text-foreground">긴급 사유:</span> {order.reason}</p>
          </div>

          {!message && !isGenerating && (
            <Button onClick={generateMessage} className="w-full gap-2" size="sm">
              <Bell className="w-3.5 h-3.5" />
              AI로 슬랙 메시지 초안 생성
            </Button>
          )}

          {isGenerating && (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> 메시지 작성 중...
            </div>
          )}

          {message && (
            <div className="space-y-3">
              <textarea
                className="w-full rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground leading-relaxed resize-none h-52 focus:outline-none focus:ring-1 focus:ring-ring"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">직접 편집 후 슬랙에 붙여넣기하세요</p>
              <div className="flex gap-2">
                <Button size="sm" className="gap-1.5 flex-1" onClick={handleCopy}>
                  {isSent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "복사됨!" : isSent ? "다시 복사" : "슬랙에 붙여넣기 (복사)"}
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={generateMessage}>
                  재생성
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UrgentOrderActions({ analysisOrders = [], rawOrders = [] }) {
  const [expanded, setExpanded] = useState(true);
  const [trackingTarget, setTrackingTarget] = useState(null);
  const [slackTarget, setSlackTarget] = useState(null);

  const urgentOrders = analysisOrders.filter((o) => o.urgency === "긴급");
  if (urgentOrders.length === 0) return null;

  // 원본 주문 데이터와 매칭
  const enriched = urgentOrders.map((ao) => {
    const raw = rawOrders.find(
      (r) => r.order_number === ao.order_number || r.customer_name === ao.customer_name
    );
    return { ...ao, ...(raw || {}) };
  });

  return (
    <>
      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 overflow-hidden">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-100/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-800">긴급 주문 조치 필요 · {urgentOrders.length}건</span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-red-400" /> : <ChevronDown className="w-4 h-4 text-red-400" />}
        </button>

        {expanded && (
          <div className="divide-y divide-red-100 border-t border-red-200">
            {enriched.map((order, i) => (
              <div key={i} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-red-900">{order.customer_name}</p>
                    {order.order_number && (
                      <span className="text-[11px] text-muted-foreground">{order.order_number}</span>
                    )}
                    <Badge className={`text-[10px] px-2 py-0.5 border ${URGENCY_STYLE[order.urgency]}`}>{order.urgency}</Badge>
                    <Badge className={`text-[10px] px-2 py-0.5 ${INQUIRY_STYLE[order.inquiry_type] || "bg-gray-100 text-gray-600"}`}>{order.inquiry_type}</Badge>
                  </div>
                  <p className="text-xs text-red-700/80 mt-0.5 truncate">{order.reason}</p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-100 gap-1.5"
                    onClick={() => setTrackingTarget(order)}
                  >
                    <Truck className="w-3 h-3" /> 운송장 요청
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-100 gap-1.5"
                    onClick={() => setSlackTarget(order)}
                  >
                    <Bell className="w-3 h-3" /> 슬랙 알림
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {trackingTarget && (
        <TrackingDraftModal order={trackingTarget} onClose={() => setTrackingTarget(null)} />
      )}
      {slackTarget && (
        <SlackNotifyModal order={slackTarget} onClose={() => setSlackTarget(null)} />
      )}
    </>
  );
}
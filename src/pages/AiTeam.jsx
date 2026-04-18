import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AgentCard, { AGENTS } from "@/components/ai/AgentCard";
import ChatBubble from "@/components/ai/ChatBubble";
import ChatInput from "@/components/ai/ChatInput";
import TeamMeeting from "@/components/ai/TeamMeeting";
import { Loader2, MessageSquare, Users } from "lucide-react";

const WELCOME_MESSAGES = {
  coo: "안녕하세요! 저는 넬리아의 COO AI입니다. ⚙️\n\n주문 처리 현황, 물류 최적화, 운영 프로세스 개선 등 어떤 것이든 도와드릴게요. 지금 어떤 운영 이슈가 있으신가요?",
  cmo: "안녕하세요! 저는 넬리아의 CMO AI입니다. 📣\n\n인스타그램, 유튜브, 틱톡, X, 쓰레드 채널 전략과 콘텐츠 기획을 함께 해드릴게요. 요즘 어떤 마케팅 고민이 있으신가요?",
  cfo: "안녕하세요! 저는 넬리아의 CFO AI입니다. 💰\n\n매출 현황, 채널별 수익성, 비용 구조 분석을 도와드릴게요. 재무적으로 궁금한 점이 있으신가요?",
  cdo: "안녕하세요! 저는 넬리아의 CDO AI입니다. 📊\n\n주문 데이터 분석, 고객 패턴, 채널 성과 등 데이터 기반 인사이트를 제공해드릴게요. 어떤 데이터를 분석해드릴까요?",
  cs: "안녕하세요! 저는 넬리아의 CS AI입니다. 🤝\n\n고객 응대 전략, 클레임 처리, 고객 경험 개선을 함께 고민해드릴게요. 어떤 고객 서비스 이슈가 있으신가요?",
};

function buildProductContext(products) {
  if (!products || products.length === 0) return "등록된 제품 없음";
  return products
    .filter((p) => p.is_active !== false)
    .map((p) => {
      const lines = [`[${p.name}${p.model_number ? ` (${p.model_number})` : ""}]`];
      if (p.short_description) lines.push(`설명: ${p.short_description}`);
      if (p.price) lines.push(`가격: ${p.price.toLocaleString()}원`);
      if (p.specs) lines.push(`스펙:\n${p.specs}`);
      if (p.features) lines.push(`특징: ${p.features}`);
      if (p.target_audience) lines.push(`타겟: ${p.target_audience}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

function buildSystemPrompt(agentKey, orders, products = []) {
  const agent = AGENTS[agentKey];
  const totalOrders = orders.length;
  const newOrders = orders.filter((o) => o.status === "new").length;
  const shippedOrders = orders.filter((o) => o.status === "shipped").length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.price || 0), 0);
  const channels = [...new Set(orders.map((o) => o.channel))];

  return `당신은 넬리아(Nellia) 뷰티/헤어케어 브랜드의 ${agent.title}(${agent.short}) AI 직원입니다.
이름: ${agent.name}
역할: ${agent.personality}

=== 넬리아 제품 DB ===
${buildProductContext(products)}

=== CRM 데이터 요약 ===
- 총 주문 수: ${totalOrders}건
- 신규 주문: ${newOrders}건
- 출고 완료: ${shippedOrders}건
- 총 매출: ${totalRevenue.toLocaleString()}원
- 활성 판매 채널: ${channels.join(", ") || "없음"}

소셜 미디어 채널: 인스타그램, 유튜브, 틱톡, X(트위터), 쓰레드(Threads)

지침:
- 한국어로 답변하세요.
- 넬리아의 ${agent.short}로서 역할에 맞는 전문적인 조언을 제공하세요.
- 제품 DB의 스펙, 특징, 타겟 정보를 적극 활용하여 구체적인 인사이트를 제공하세요.
- CRM 데이터를 함께 참고하여 답변하세요.
- 답변은 명확하고 실행 가능한 조언 위주로 작성하세요.
- 이모지를 자연스럽게 활용하여 친근감을 유지하세요.`;
}

export default function AiTeam() {
  const [activeAgent, setActiveAgent] = useState("cmo");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState("chat");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => base44.entities.Order.list("-created_date", 500),
    initialData: [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("-created_date", 100),
    initialData: [],
  });

  // 현재 에이전트의 채팅 기록 로드
  const { data: chatHistory = [], isLoading: isLoadingChat } = useQuery({
    queryKey: ["aiChat", activeAgent],
    queryFn: () => base44.entities.AiChat.filter({ agent: activeAgent }, "created_date", 200),
  });

  // 저장된 메시지가 없으면 환영 메시지 표시
  const messages = chatHistory.length > 0
    ? chatHistory
    : [{ role: "assistant", content: WELCOME_MESSAGES[activeAgent] }];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, activeAgent]);

  const saveMutation = useMutation({
    mutationFn: (msg) => base44.entities.AiChat.create(msg),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["aiChat", activeAgent] }),
  });

  const handleSend = async (text) => {
    setIsLoading(true);

    // 사용자 메시지 저장
    await saveMutation.mutateAsync({ agent: activeAgent, role: "user", content: text, session_id: activeAgent });

    // LLM 컨텍스트: DB 기록 + 새 메시지
    const historyForLLM = [...chatHistory.slice(-14), { role: "user", content: text }];
    const systemPrompt = buildSystemPrompt(activeAgent, orders, products);
    const fullPrompt = `${systemPrompt}

대화 내역:
${historyForLLM.map((m) => `${m.role === "user" ? "사용자" : "AI"}: ${m.content}`).join("\n")}

위 대화에 이어서 ${AGENTS[activeAgent].title}로서 답변해주세요.`;

    const response = await base44.integrations.Core.InvokeLLM({ prompt: fullPrompt });

    // AI 응답 저장
    await saveMutation.mutateAsync({ agent: activeAgent, role: "assistant", content: response, session_id: activeAgent });
    setIsLoading(false);
  };

  const agent = AGENTS[activeAgent];

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* 사이드바 - AI 직원 목록 */}
      <div className="w-64 flex-shrink-0 border-r border-border bg-card/50 flex flex-col">
        <div className="px-5 py-6 border-b border-border">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-1">AI Team</p>
          <h2 className="font-serif text-2xl text-foreground">넬리아 직원</h2>
          <p className="text-xs text-muted-foreground mt-1">AI 임직원과 실시간 소통</p>
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {Object.keys(AGENTS).map((key) => (
            <AgentCard
              key={key}
              agentKey={key}
              isActive={activeAgent === key}
              onClick={() => setActiveAgent(key)}
            />
          ))}
        </div>
        <div className="px-4 py-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">CRM 데이터 기반 · 실시간 응답</p>
        </div>
      </div>

      {/* 오른쪽 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 탭 헤더 */}
        <div className="flex border-b border-border bg-card/80 backdrop-blur-sm">
          <button
            onClick={() => setMode("chat")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              mode === "chat"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            1:1 대화
          </button>
          <button
            onClick={() => setMode("meeting")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              mode === "meeting"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            팀 미팅
            <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">NEW</span>
          </button>

          {mode === "chat" && (
            <div className="ml-auto flex items-center gap-3 px-6">
              <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-lg shadow-sm">
                {agent.emoji}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-none">{agent.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{agent.title}</p>
              </div>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] text-emerald-600 font-medium">온라인</span>
              </div>
            </div>
          )}
        </div>

        {mode === "chat" ? (
          <>
            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {isLoadingChat && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isLoadingChat && messages.map((msg, i) => (
                <ChatBubble key={msg.id || i} message={msg} agentKey={activeAgent} />
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-lg shadow-sm">
                    {agent.emoji}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl rounded-tl-sm border border-border/50 ${agent.bubbleColor}`}>
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <ChatInput onSend={handleSend} isLoading={isLoading} agentKey={activeAgent} />
          </>
        ) : (
          <TeamMeeting orders={orders} />
        )}
      </div>
    </div>
  );
}
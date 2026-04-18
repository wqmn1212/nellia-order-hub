import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AgentCard, { AGENTS } from "@/components/ai/AgentCard";
import ChatBubble from "@/components/ai/ChatBubble";
import ChatInput from "@/components/ai/ChatInput";
import { Loader2 } from "lucide-react";

const SESSION_ID = `session_${Date.now()}`;

const WELCOME_MESSAGES = {
  coo: "안녕하세요! 저는 넬리아의 COO AI입니다. ⚙️\n\n주문 처리 현황, 물류 최적화, 운영 프로세스 개선 등 어떤 것이든 도와드릴게요. 지금 어떤 운영 이슈가 있으신가요?",
  cmo: "안녕하세요! 저는 넬리아의 CMO AI입니다. 📣\n\n인스타그램, 유튜브, 틱톡, X, 쓰레드 채널 전략과 콘텐츠 기획을 함께 해드릴게요. 요즘 어떤 마케팅 고민이 있으신가요?",
  cfo: "안녕하세요! 저는 넬리아의 CFO AI입니다. 💰\n\n매출 현황, 채널별 수익성, 비용 구조 분석을 도와드릴게요. 재무적으로 궁금한 점이 있으신가요?",
  cdo: "안녕하세요! 저는 넬리아의 CDO AI입니다. 📊\n\n주문 데이터 분석, 고객 패턴, 채널 성과 등 데이터 기반 인사이트를 제공해드릴게요. 어떤 데이터를 분석해드릴까요?",
  cs: "안녕하세요! 저는 넬리아의 CS AI입니다. 🤝\n\n고객 응대 전략, 클레임 처리, 고객 경험 개선을 함께 고민해드릴게요. 어떤 고객 서비스 이슈가 있으신가요?",
};

function buildSystemPrompt(agentKey, orders) {
  const agent = AGENTS[agentKey];
  const totalOrders = orders.length;
  const newOrders = orders.filter((o) => o.status === "new").length;
  const shippedOrders = orders.filter((o) => o.status === "shipped").length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.price || 0), 0);
  const channels = [...new Set(orders.map((o) => o.channel))];

  return `당신은 넬리아(Nellia) 뷰티/화장품 브랜드의 ${agent.title}(${agent.short}) AI 직원입니다.
이름: ${agent.name}
역할: ${agent.personality}

현재 넬리아 CRM 데이터 요약:
- 총 주문 수: ${totalOrders}건
- 신규 주문: ${newOrders}건
- 출고 완료: ${shippedOrders}건
- 총 매출: ${totalRevenue.toLocaleString()}원
- 활성 판매 채널: ${channels.join(", ") || "없음"}

소셜 미디어 채널: 인스타그램, 유튜브, 틱톡, X(트위터), 쓰레드(Threads)

지침:
- 한국어로 답변하세요.
- 넬리아의 ${agent.short}로서 역할에 맞는 전문적인 조언을 제공하세요.
- CRM 데이터를 적극 활용하여 구체적인 인사이트를 제공하세요.
- 답변은 명확하고 실행 가능한 조언 위주로 작성하세요.
- 이모지를 자연스럽게 활용하여 친근감을 유지하세요.`;
}

export default function AiTeam() {
  const [activeAgent, setActiveAgent] = useState("cmo");
  const [conversations, setConversations] = useState({
    coo: [{ role: "assistant", content: WELCOME_MESSAGES.coo }],
    cmo: [{ role: "assistant", content: WELCOME_MESSAGES.cmo }],
    cfo: [{ role: "assistant", content: WELCOME_MESSAGES.cfo }],
    cdo: [{ role: "assistant", content: WELCOME_MESSAGES.cdo }],
    cs: [{ role: "assistant", content: WELCOME_MESSAGES.cs }],
  });
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => base44.entities.Order.list("-created_date", 500),
    initialData: [],
  });

  const messages = conversations[activeAgent] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeAgent]);

  const handleSend = async (text) => {
    const userMsg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];

    setConversations((prev) => ({
      ...prev,
      [activeAgent]: updatedMessages,
    }));
    setIsLoading(true);

    const historyForLLM = updatedMessages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const systemPrompt = buildSystemPrompt(activeAgent, orders);
    const fullPrompt = `${systemPrompt}

대화 내역:
${historyForLLM.map((m) => `${m.role === "user" ? "사용자" : "AI"}: ${m.content}`).join("\n")}

위 대화에 이어서 ${AGENTS[activeAgent].title}로서 답변해주세요.`;

    const response = await base44.integrations.Core.InvokeLLM({ prompt: fullPrompt });

    const assistantMsg = { role: "assistant", content: response };
    setConversations((prev) => ({
      ...prev,
      [activeAgent]: [...prev[activeAgent], assistantMsg],
    }));
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

      {/* 채팅 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-white border border-border flex items-center justify-center text-2xl shadow-sm">
            {agent.emoji}
          </div>
          <div>
            <p className="font-semibold text-foreground">{agent.name}</p>
            <p className="text-xs text-muted-foreground">{agent.title} · 현재 주문 {orders.length}건 인지 중</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-emerald-600 font-medium">온라인</span>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} agentKey={activeAgent} />
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

        {/* 입력창 */}
        <ChatInput onSend={handleSend} isLoading={isLoading} agentKey={activeAgent} />
      </div>
    </div>
  );
}
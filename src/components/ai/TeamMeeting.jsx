import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AGENTS } from "./AgentCard";
import { Button } from "@/components/ui/button";
import { Loader2, Play, RefreshCw, ChevronDown } from "lucide-react";

const MEETING_TOPICS = [
  "넬리아 헤어드라이어 글로벌 런칭 전략 수립",
  "인스타그램·틱톡 바이럴 캠페인 기획",
  "일본/미국 시장 진출 우선순위 결정",
  "헤어드라이어 프리미엄 포지셔닝 전략",
  "인플루언서 파트너십 및 예산 배분",
  "고객 리뷰 전략 및 브랜드 신뢰도 구축",
];

const AGENT_ORDER = ["coo", "cmo", "cfo", "cdo", "cs"];

function buildAgentPrompt(speakerKey, topic, previousMessages, orders) {
  const speaker = AGENTS[speakerKey];
  const totalRevenue = orders.reduce((sum, o) => sum + (o.price || 0), 0);
  const context = previousMessages
    .map((m) => `${AGENTS[m.agent].short} ${AGENTS[m.agent].name}: ${m.content}`)
    .join("\n");

  return `당신은 넬리아(Nellia) 뷰티 브랜드의 ${speaker.title}(${speaker.short}) AI 직원입니다.

넬리아의 첫 번째 제품: 헤어드라이어 (프리미엄 포지셔닝 목표)
목표: 넬리아를 세계적인 뷰티 브랜드로 성장시키기

현재 CRM 현황:
- 총 주문 ${orders.length}건, 총 매출 ${totalRevenue.toLocaleString()}원

팀 미팅 주제: "${topic}"

${context ? `지금까지 팀원들의 발언:\n${context}\n` : ""}

당신의 역할(${speaker.short})로서 위 주제에 대해 발언하세요.
- ${speaker.personality}
- 다른 팀원의 의견을 참고하고 자신의 전문 분야에서 구체적인 의견을 추가하세요.
- 2~4문장으로 핵심만 명확하게 말하세요.
- 이모지를 1~2개 자연스럽게 사용하세요.
- 다른 팀원에게 질문하거나 제안하는 방식으로 상호작용하세요.
- 절대 이름이나 역할 소개 없이 바로 발언 내용만 출력하세요.`;
}

export default function TeamMeeting({ orders }) {
  const [topic, setTopic] = useState(MEETING_TOPICS[0]);
  const [customTopic, setCustomTopic] = useState("");
  const [messages, setMessages] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [round, setRound] = useState(0);
  const messagesEndRef = useRef(null);
  const abortRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startMeeting = async () => {
    abortRef.current = false;
    const finalTopic = customTopic.trim() || topic;
    setMessages([]);
    setIsRunning(true);
    setRound(1);

    const history = [];

    // 2라운드 진행 (각 라운드마다 모든 직원 발언)
    for (let r = 0; r < 2; r++) {
      if (abortRef.current) break;
      if (r > 0) {
        setRound(2);
        // 라운드 구분선
        setMessages((prev) => [...prev, { type: "divider", content: "💬 2라운드 — 심화 논의" }]);
      }

      for (const agentKey of AGENT_ORDER) {
        if (abortRef.current) break;

        // 로딩 표시
        setMessages((prev) => [...prev, { type: "loading", agent: agentKey, id: `loading_${agentKey}_${r}` }]);

        const prompt = buildAgentPrompt(agentKey, finalTopic, history, orders);
        const response = await base44.integrations.Core.InvokeLLM({ prompt });

        history.push({ agent: agentKey, content: response });

        // 로딩 제거 후 실제 메시지 추가
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== `loading_${agentKey}_${r}`),
          { type: "message", agent: agentKey, content: response },
        ]);
      }
    }

    // 최종 합의 요약 (COO가 정리)
    if (!abortRef.current) {
      setMessages((prev) => [...prev, { type: "divider", content: "✅ COO 최종 정리" }]);
      setMessages((prev) => [...prev, { type: "loading", agent: "coo", id: "loading_summary" }]);

      const summaryPrompt = `당신은 넬리아의 COO AI입니다.
팀 미팅 주제: "${customTopic.trim() || topic}"

팀원들의 논의:
${history.map((m) => `${AGENTS[m.agent].short}: ${m.content}`).join("\n\n")}

위 논의를 바탕으로 실행 가능한 액션 아이템 3~5개를 정리해주세요.
형식: 번호 목록으로, 각 항목은 담당자(COO/CMO/CFO/CDO/CS)와 함께 명시하세요.`;

      const summary = await base44.integrations.Core.InvokeLLM({ prompt: summaryPrompt });
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== "loading_summary"),
        { type: "summary", content: summary },
      ]);
    }

    setIsRunning(false);
  };

  const stopMeeting = () => {
    abortRef.current = true;
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 설정 영역 */}
      <div className="p-5 border-b border-border bg-card/80 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">미팅 주제 선택</p>
          <div className="relative">
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-ring"
              disabled={isRunning}
            >
              {MEETING_TOPICS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5 font-medium">또는 직접 입력</p>
          <input
            type="text"
            placeholder="예: 헤어드라이어 미국 아마존 런칭 전략"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            disabled={isRunning}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-2">
          {!isRunning ? (
            <Button onClick={startMeeting} className="flex-1 bg-primary hover:bg-primary/90">
              <Play className="w-4 h-4 mr-2" />
              팀 미팅 시작
            </Button>
          ) : (
            <Button onClick={stopMeeting} variant="destructive" className="flex-1">
              미팅 중단
            </Button>
          )}
          {messages.length > 0 && !isRunning && (
            <Button variant="outline" size="icon" onClick={() => setMessages([])}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
        {isRunning && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            {round}라운드 진행 중 · AI 직원들이 논의하고 있습니다...
          </p>
        )}
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && !isRunning && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <div className="text-5xl mb-4">🏢</div>
            <p className="font-medium text-foreground mb-1">팀 미팅 준비 완료</p>
            <p className="text-sm">주제를 선택하고 미팅을 시작하면<br />5명의 AI 직원이 함께 논의합니다</p>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.type === "divider") {
            return (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-medium text-muted-foreground px-2">{msg.content}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            );
          }

          if (msg.type === "loading") {
            const agent = AGENTS[msg.agent];
            return (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-lg shadow-sm flex-shrink-0">
                  {agent.emoji}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground">{agent.short} · {agent.name}</span>
                  <div className={`px-4 py-3 rounded-2xl rounded-tl-sm border border-border/50 ${agent.bubbleColor}`}>
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              </div>
            );
          }

          if (msg.type === "summary") {
            return (
              <div key={i} className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wide">📋 액션 아이템</p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            );
          }

          const agent = AGENTS[msg.agent];
          return (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-lg shadow-sm flex-shrink-0">
                {agent.emoji}
              </div>
              <div className="flex flex-col gap-1 max-w-[85%]">
                <span className="text-xs font-semibold text-muted-foreground">{agent.short} · {agent.name}</span>
                <div className={`px-4 py-3 rounded-2xl rounded-tl-sm border border-border/50 text-sm leading-relaxed ${agent.bubbleColor}`}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
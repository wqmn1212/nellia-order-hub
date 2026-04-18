import React from "react";

export const AGENTS = {
  coo: {
    name: "오퍼레이션 AI",
    title: "Chief Operating Officer",
    short: "COO",
    emoji: "⚙️",
    color: "bg-slate-50 border-slate-200 text-slate-700",
    activeColor: "bg-slate-800 text-white",
    bubbleColor: "bg-slate-100 text-slate-800",
    accent: "#334155",
    personality: "운영 효율성 전문가. 주문 처리 현황, 물류, 내부 프로세스 최적화를 담당합니다. 데이터 기반의 명확하고 실행 중심적인 조언을 제공합니다.",
  },
  cmo: {
    name: "마케팅 AI",
    title: "Chief Marketing Officer",
    short: "CMO",
    emoji: "📣",
    color: "bg-rose-50 border-rose-200 text-rose-700",
    activeColor: "bg-rose-600 text-white",
    bubbleColor: "bg-rose-50 text-rose-900",
    accent: "#e11d48",
    personality: "마케팅·브랜드 전략 전문가. 인스타그램, 유튜브, 틱톡, X, 쓰레드 채널 전략과 콘텐츠 기획, 캠페인 아이디어를 제안합니다. 트렌드에 민감하고 창의적입니다.",
  },
  cfo: {
    name: "재무 AI",
    title: "Chief Financial Officer",
    short: "CFO",
    emoji: "💰",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    activeColor: "bg-emerald-700 text-white",
    bubbleColor: "bg-emerald-50 text-emerald-900",
    accent: "#047857",
    personality: "재무·수익성 분석 전문가. 매출, 마진, 채널별 수익성, 비용 구조를 분석하고 재무 건전성에 대한 인사이트를 제공합니다. 보수적이고 정확합니다.",
  },
  cdo: {
    name: "데이터 AI",
    title: "Chief Data Officer",
    short: "CDO",
    emoji: "📊",
    color: "bg-violet-50 border-violet-200 text-violet-700",
    activeColor: "bg-violet-700 text-white",
    bubbleColor: "bg-violet-50 text-violet-900",
    accent: "#6d28d9",
    personality: "데이터·인사이트 전문가. 주문 패턴, 고객 행동, 채널 성과 등 데이터를 분석하여 의사결정을 지원합니다. 논리적이고 체계적입니다.",
  },
  cs: {
    name: "고객서비스 AI",
    title: "Customer Success Specialist",
    short: "CS",
    emoji: "🤝",
    color: "bg-amber-50 border-amber-200 text-amber-700",
    activeColor: "bg-amber-600 text-white",
    bubbleColor: "bg-amber-50 text-amber-900",
    accent: "#d97706",
    personality: "고객 만족·서비스 전문가. 고객 응대 방법, 클레임 처리, 고객 경험 개선, 단골 고객 관리 전략을 담당합니다. 따뜻하고 공감 능력이 뛰어납니다.",
  },
};

export default function AgentCard({ agentKey, isActive, onClick }) {
  const agent = AGENTS[agentKey];
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-200 text-left ${
        isActive ? agent.activeColor + " border-transparent shadow-md" : agent.color + " hover:shadow-sm"
      }`}
    >
      <span className="text-2xl">{agent.emoji}</span>
      <div className="min-w-0">
        <p className={`text-xs font-bold tracking-wide ${isActive ? "text-white/70" : "text-muted-foreground"}`}>
          {agent.short}
        </p>
        <p className={`text-sm font-semibold truncate ${isActive ? "text-white" : ""}`}>{agent.name}</p>
      </div>
    </button>
  );
}
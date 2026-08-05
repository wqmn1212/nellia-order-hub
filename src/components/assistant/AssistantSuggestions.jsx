import React from "react";
import { Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "이번 달 채널별 매출과 주문 수를 정리해줘",
  "재고 부족 임계치 아래인 제품들을 알려줘",
  "최근 후기에서 자주 나오는 불만 키워드를 요약해줘",
  "오늘 회의 내용을 기록해줘:",
];

export default function AssistantSuggestions({ onPick }) {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"><Sparkles className="h-6 w-6 text-primary" /></div>
      <h2 className="font-serif text-xl">넬리아 AI 비서</h2>
      <p className="mt-1 text-sm text-muted-foreground">앱에 기록된 주문·재고·광고·후기 데이터를 근거로 답변합니다.</p>
      <div className="mt-5 grid gap-2 text-left">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => onPick(s)} className="min-h-12 rounded-xl border bg-card px-4 py-3 text-sm hover:bg-accent">{s}</button>
        ))}
      </div>
    </div>
  );
}
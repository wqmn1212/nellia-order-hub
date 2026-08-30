import React, { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import AssistantMessage from "@/components/assistant/AssistantMessage";
import AssistantComposer from "@/components/assistant/AssistantComposer";
import AssistantSuggestions from "@/components/assistant/AssistantSuggestions";
import CanvasPanel from "@/components/assistant/CanvasPanel";
import { Toaster } from "@/components/ui/sonner";
import { parseCanvasBlocks } from "@/lib/parseCanvasBlocks";
import { Loader2 } from "lucide-react";

const AGENT_NAME = "nellia_assistant";

export default function Assistant() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [canvas, setCanvas] = useState(null);
  const [autoOpenDisabled, setAutoOpenDisabled] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    (async () => {
      const existing = await base44.agents.listConversations({ agent_name: AGENT_NAME });
      const convo = existing?.length
        ? await base44.agents.getConversation(existing[0].id)
        : await base44.agents.createConversation({ agent_name: AGENT_NAME, metadata: { name: "넬리아 AI 비서" } });
      setConversation(convo);
      setMessages(convo.messages || []);
    })();
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      setSending(false);
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // 메시지별 캔버스 산출물 (완료된 메시지만 파싱)
  const canvasByIndex = useMemo(() => {
    const map = {};
    messages.forEach((m, i) => {
      if (m.role === "user" || !m.content) return;
      const { canvas: c } = parseCanvasBlocks(m.content);
      if (c) map[i] = c;
    });
    return map;
  }, [messages]);

  const openCanvas = (index) => {
    const c = canvasByIndex[index];
    if (c) setCanvas({ messageIndex: index, ...c, isDirty: false });
  };

  // 새 답변에 캔버스가 있으면 자동으로 엽니다 (사용자가 닫은 뒤에는 중단).
  const lastCanvasIndex = useMemo(() => {
    const keys = Object.keys(canvasByIndex).map(Number);
    return keys.length ? Math.max(...keys) : -1;
  }, [canvasByIndex]);

  useEffect(() => {
    if (sending || autoOpenDisabled || lastCanvasIndex === -1) return;
    if (canvas?.messageIndex === lastCanvasIndex) return;
    openCanvas(lastCanvasIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCanvasIndex, sending, autoOpenDisabled]);

  const closeCanvas = () => { setCanvas(null); setAutoOpenDisabled(true); };

  const send = async (content) => {
    setSending(true);
    await base44.agents.addMessage(conversation, { role: "user", content });
  };

  const regenerate = (index) => {
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === "user" && messages[i].content) return send(messages[i].content);
    }
  };

  if (!conversation) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const canvasOpen = !!canvas;

  const chat = (
    <div className="flex h-full min-h-[calc(100vh-4rem)] flex-col lg:min-h-screen">
      <div className="flex-1 overflow-y-auto px-4 py-5 md:px-8">
        <div className={`space-y-5 ${canvasOpen ? "max-w-none" : "mx-auto max-w-3xl"}`}>
          {messages.length === 0
            ? <AssistantSuggestions onPick={send} />
            : messages.map((m, i) => (
                <AssistantMessage
                  key={i}
                  message={m}
                  canvas={canvasByIndex[i]}
                  isCanvasOpen={canvas?.messageIndex === i}
                  onOpenCanvas={() => openCanvas(i)}
                  onRegenerate={m.role !== "user" ? () => regenerate(i) : undefined}
                />
              ))}
          {sending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />비서가 데이터를 확인하고 있어요…</div>}
          <div ref={bottomRef} />
        </div>
      </div>
      <AssistantComposer onSend={send} disabled={sending} />
    </div>
  );

  const panel = canvas && (
    <CanvasPanel
      canvas={canvas}
      onChange={(content) => setCanvas((c) => ({ ...c, content, isDirty: true }))}
      onClose={closeCanvas}
    />
  );

  return (
    <>
      <Toaster />
      <div className="flex">
        <div className={canvasOpen ? "min-w-0 flex-1 lg:w-[45%] lg:flex-none" : "min-w-0 flex-1"}>{chat}</div>
        {canvasOpen && (
          <>
            {/* 데스크톱: 우측 분할 */}
            <div className="hidden h-[calc(100vh-4rem)] w-[55%] shrink-0 border-l lg:sticky lg:top-0 lg:block lg:h-screen">
              {panel}
            </div>
            {/* 모바일: 하단 시트 */}
            <div className="fixed inset-x-0 bottom-0 z-40 h-[80vh] rounded-t-2xl border-t bg-background shadow-2xl lg:hidden">
              {panel}
            </div>
          </>
        )}
      </div>
    </>
  );
}
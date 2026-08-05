import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import AssistantMessage from "@/components/assistant/AssistantMessage";
import AssistantComposer from "@/components/assistant/AssistantComposer";
import AssistantSuggestions from "@/components/assistant/AssistantSuggestions";
import { Loader2 } from "lucide-react";

const AGENT_NAME = "nellia_assistant";

export default function Assistant() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
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

  const send = async (content) => {
    setSending(true);
    await base44.agents.addMessage(conversation, { role: "user", content });
  };

  if (!conversation) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:min-h-screen">
      <div className="flex-1 space-y-4 px-4 py-5 md:px-8">
        {messages.length === 0
          ? <AssistantSuggestions onPick={send} />
          : messages.map((m, i) => <AssistantMessage key={i} message={m} />)}
        {sending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />비서가 데이터를 확인하고 있어요…</div>}
        <div ref={bottomRef} />
      </div>
      <AssistantComposer onSend={send} disabled={sending} />
    </div>
  );
}
import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export default function AssistantComposer({ onSend, disabled }) {
  const [text, setText] = useState("");
  const send = () => {
    const value = text.trim();
    if (!value || disabled) return;
    setText("");
    onSend(value);
  };
  return (
    <div className="sticky bottom-0 border-t bg-background/95 p-3 backdrop-blur">
      <div className="flex items-end gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
          placeholder="넬리아 데이터에 대해 질문하거나, 기록할 내용을 알려주세요"
          className="min-h-12 max-h-40 flex-1 resize-none"
        />
        <Button size="icon" onClick={send} disabled={disabled || !text.trim()} aria-label="보내기"><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
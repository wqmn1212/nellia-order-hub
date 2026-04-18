import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

export default function ChatInput({ onSend, isLoading, agentKey }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  const handleSend = () => {
    if (!text.trim() || isLoading) return;
    onSend(text.trim());
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    const t = e.target;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 120) + "px";
    setText(t.value);
  };

  return (
    <div className="flex gap-2 items-end p-4 border-t border-border bg-card/80 backdrop-blur-sm">
      <Textarea
        ref={textareaRef}
        value={text}
        onInput={handleInput}
        onChange={() => {}}
        onKeyDown={handleKeyDown}
        placeholder="메시지를 입력하세요... (Enter 전송, Shift+Enter 줄바꿈)"
        className="resize-none min-h-[44px] max-h-[120px] text-sm overflow-hidden"
        rows={1}
        disabled={isLoading}
      />
      <Button
        onClick={handleSend}
        disabled={!text.trim() || isLoading}
        size="icon"
        className="h-11 w-11 flex-shrink-0 bg-primary hover:bg-primary/90"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </Button>
    </div>
  );
}
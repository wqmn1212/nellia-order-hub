import React from "react";
import { AGENTS } from "./AgentCard";

export default function ChatBubble({ message, agentKey }) {
  const agent = AGENTS[agentKey];
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-lg shadow-sm">
          {agent.emoji}
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : `${agent.bubbleColor} rounded-tl-sm border border-border/50`
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
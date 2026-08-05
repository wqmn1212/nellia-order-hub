import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, Loader2, CheckCircle2, XCircle } from "lucide-react";

const isFailed = (tc) => {
  const raw = typeof tc.results === "string" ? tc.results : JSON.stringify(tc.results ?? "");
  return ["failed", "error"].includes(tc.status) || /error|failed/i.test(raw);
};

function ToolCall({ toolCall }) {
  const [open, setOpen] = useState(false);
  const running = ["pending", "running", "in_progress"].includes(toolCall.status);
  const failed = isFailed(toolCall);
  const p = toolCall.display_projection || {};
  const label = running ? (p.active_label || "데이터 조회 중") : failed ? (p.error_label || "조회 실패") : (p.label || `${toolCall.name} 완료`);
  const hidden = p.hide_details && p.details_redacted;
  let parsed = toolCall.results;
  try { parsed = typeof toolCall.results === "string" ? JSON.parse(toolCall.results) : toolCall.results; } catch { /* raw */ }

  return (
    <div className="mt-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs">
      <button onClick={() => !hidden && setOpen(!open)} className="flex w-full items-center gap-2 text-left text-muted-foreground">
        {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : failed ? <XCircle className="h-3.5 w-3.5 text-destructive" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
        <span className="flex-1 truncate">{label}</span>
        {!hidden && <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>
      {open && !hidden && (
        <div className="mt-2 space-y-2">
          <pre className="overflow-x-auto rounded bg-background p-2">{toolCall.arguments_string || "{}"}</pre>
          {parsed !== undefined && <pre className="max-h-52 overflow-auto rounded bg-background p-2">{typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2)}</pre>}
        </div>
      )}
    </div>
  );
}

export default function AssistantMessage({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div className={`max-w-[88%] rounded-2xl px-4 py-3 ${isUser ? "bg-primary text-primary-foreground" : "bg-card border"}`}>
        {message.content && (isUser
          ? <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          : <ReactMarkdown className="prose prose-sm max-w-none text-sm prose-table:text-xs">{message.content}</ReactMarkdown>)}
        {message.tool_calls?.map((tc, i) => <ToolCall key={i} toolCall={tc} />)}
      </div>
    </div>
  );
}
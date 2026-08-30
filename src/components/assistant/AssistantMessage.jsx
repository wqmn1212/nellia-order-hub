import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { ChevronDown, Loader2, CheckCircle2, XCircle, Copy, RotateCcw } from "lucide-react";
import { parseCanvasBlocks } from "@/lib/parseCanvasBlocks";
import CanvasCard from "./CanvasCard";

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

export default function AssistantMessage({ message, canvas, isCanvasOpen, onOpenCanvas, onRegenerate }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  const { text } = parseCanvasBlocks(message.content || "");

  return (
    <div className="group">
      {text && <ReactMarkdown className="prose prose-sm max-w-none text-sm">{text}</ReactMarkdown>}
      {canvas && <CanvasCard canvas={canvas} isOpen={isCanvasOpen} onOpen={onOpenCanvas} />}
      {message.tool_calls?.map((tc, i) => <ToolCall key={i} toolCall={tc} />)}
      {message.content && (
        <div className="mt-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={async () => { await navigator.clipboard.writeText(message.content); toast.success("복사했어요"); }}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            <Copy className="h-3.5 w-3.5" />복사
          </button>
          {onRegenerate && (
            <button onClick={onRegenerate} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted">
              <RotateCcw className="h-3.5 w-3.5" />다시 생성
            </button>
          )}
        </div>
      )}
    </div>
  );
}
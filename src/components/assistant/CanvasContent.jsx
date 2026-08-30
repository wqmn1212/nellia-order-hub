import React from "react";
import ReactMarkdown from "react-markdown";
import { parseMarkdownTable, isNumericCell } from "@/lib/canvasExport";

function CanvasTable({ content }) {
  const rows = parseMarkdownTable(content);
  if (rows.length < 1) return <ReactMarkdown className="prose prose-sm max-w-none">{content}</ReactMarkdown>;
  const [head, ...body] = rows;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-muted">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap border-b px-3 py-2 text-left font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, ri) => (
            <tr key={ri} className={ri % 2 === 1 ? "bg-muted/30" : ""}>
              {r.map((c, ci) => (
                <td key={ci} className={`border-b px-3 py-2 ${isNumericCell(c) ? "text-right tabular-nums" : ""}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CanvasContent({ type, content }) {
  if (type === "table") return <CanvasTable content={content} />;
  return (
    <ReactMarkdown
      components={{
        p: ({ node, ...p }) => <p className="mb-3 leading-7" {...p} />,
        h1: ({ node, ...p }) => <h1 className="mb-3 mt-5 text-xl font-bold" {...p} />,
        h2: ({ node, ...p }) => <h2 className="mb-2 mt-5 text-lg font-semibold" {...p} />,
        h3: ({ node, ...p }) => <h3 className="mb-2 mt-4 text-base font-semibold" {...p} />,
        ul: ({ node, ...p }) => <ul className="mb-3 list-disc space-y-1 pl-5" {...p} />,
        ol: ({ node, ...p }) => <ol className="mb-3 list-decimal space-y-1 pl-5" {...p} />,
        li: ({ node, ...p }) => <li className="leading-7" {...p} />,
        code: ({ node, ...p }) => <code className="rounded bg-muted px-1" {...p} />,
        pre: ({ node, ...p }) => <pre className="mb-3 overflow-x-auto rounded-lg bg-muted p-3 text-xs" {...p} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
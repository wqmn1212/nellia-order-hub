import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export default function TaskHistoryFeed({ taskId }) {
  const { data: logs = [] } = useQuery({
    queryKey: ["task-logs", taskId],
    queryFn: () => base44.entities.TaskLog.filter({ task_id: taskId }, "-created_date", 30),
  });

  if (!logs.length) return null;

  return (
    <div className="space-y-1.5 pt-1 border-t border-border/50">
      <p className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase">변경 이력</p>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-foreground leading-snug">
                <span className="font-semibold">{log.field_name}</span>
                {log.old_value ? (
                  <>
                    {" "}
                    <span className="line-through text-muted-foreground/70">{log.old_value}</span>
                    {" → "}
                    <span className="text-primary font-medium">{log.new_value}</span>
                  </>
                ) : (
                  <> → <span className="text-primary font-medium">{log.new_value}</span></>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {log.changed_by_name || "알 수 없음"} ·{" "}
                {formatDistanceToNow(new Date(log.created_date), { addSuffix: true, locale: ko })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
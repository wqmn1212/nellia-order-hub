import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { CalendarDays, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

const ASSIGNEE_MAP = { ceo: "대표", designer: "디자이너", marketer: "마케터", logistics: "물류/운영" };
const STATUS_LABEL = { todo: "예정", in_progress: "진행중", done: "완료", blocked: "블로킹", cancelled: "취소" };
const STATUS_DOT = { todo: "bg-slate-400", in_progress: "bg-blue-500", done: "bg-green-500", blocked: "bg-red-500", cancelled: "bg-slate-300" };
const PRIORITY_LABEL = { low: "낮음", medium: "보통", high: "높음", urgent: "긴급" };

export default function RecentTaskUpdates() {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list("-updated_date", 50),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["task-logs-recent"],
    queryFn: () => base44.entities.TaskLog.list("-created_date", 30),
  });

  // Group logs by task for quick lookup
  const logsByTask = {};
  logs.forEach((log) => {
    if (!logsByTask[log.task_id]) logsByTask[log.task_id] = [];
    logsByTask[log.task_id].push(log);
  });

  // Sort tasks by updated_date descending
  const recentTasks = tasks
    .filter((t) => t.due_date || t.updated_date)
    .sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date))
    .slice(0, 8);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">최근 업무 업데이트</h2>
        </div>
        <Link to="/calendar" className="text-xs text-primary hover:underline flex items-center gap-1">
          캘린더 보기 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</div>
      ) : recentTasks.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">등록된 업무가 없습니다</div>
      ) : (
        <div className="space-y-2">
          {recentTasks.map((task) => {
            const taskLogs = logsByTask[task.id] || [];
            const latestLog = taskLogs[0];
            return (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${STATUS_DOT[task.status] || "bg-slate-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                    <span>{ASSIGNEE_MAP[task.assignee] || task.assignee}</span>
                    <span>·</span>
                    <span>{STATUS_LABEL[task.status] || task.status}</span>
                    {task.due_date && (
                      <>
                        <span>·</span>
                        <span>{task.due_date.split("T")[0]}</span>
                      </>
                    )}
                  </div>
                  {latestLog && (
                    <p className="text-[11px] text-violet-600 mt-1 truncate">
                      ↳ {latestLog.field_name}: <span className="line-through opacity-60">{latestLog.old_value}</span> → {latestLog.new_value}
                      <span className="text-muted-foreground ml-1">
                        ({formatDistanceToNow(new Date(latestLog.created_date), { addSuffix: true, locale: ko })})
                      </span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Clock, CheckCircle2, Loader2, XCircle, AlertCircle } from "lucide-react";

const ASSIGNEE_MAP = {
  ceo: { label: "대표", cls: "bg-purple-100 text-purple-700" },
  designer: { label: "디자이너", cls: "bg-blue-100 text-blue-700" },
  marketer: { label: "마케터", cls: "bg-pink-100 text-pink-700" },
  logistics: { label: "물류/운영", cls: "bg-amber-100 text-amber-700" },
};

const STATUS_MAP = {
  todo: { label: "예정", icon: Clock, cls: "text-slate-400" },
  in_progress: { label: "진행중", icon: Loader2, cls: "text-blue-500" },
  done: { label: "완료", icon: CheckCircle2, cls: "text-green-500" },
  cancelled: { label: "취소", icon: XCircle, cls: "text-slate-400" },
};

export default function TaskFeed() {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks-feed"],
    queryFn: () => base44.entities.Task.list("-updated_date", 10),
  });

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm text-foreground">최근 업무 업데이트</h2>
        <Link to="/calendar" className="text-xs text-primary hover:underline">전체 보기</Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">업무가 없습니다</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const StatusIcon = STATUS_MAP[task.status]?.icon || Clock;
            const isDueSoon = task.due_date && task.due_date.split("T")[0] <= new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0] && task.due_date.split("T")[0] >= today && task.status !== "done" && task.status !== "cancelled";

            return (
              <div key={task.id} className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors ${isDueSoon ? "border-orange-200 bg-orange-50" : "border-transparent hover:bg-muted/40"}`}>
                <StatusIcon className={`w-4 h-4 mt-0.5 shrink-0 ${STATUS_MAP[task.status]?.cls || "text-slate-400"} ${task.status === "in_progress" ? "animate-spin" : ""}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${task.status === "done" || task.status === "cancelled" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.title}
                    {isDueSoon && <span className="ml-1.5 text-[10px] text-orange-600 font-semibold">마감 임박</span>}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {task.assignee && (
                      <span className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${ASSIGNEE_MAP[task.assignee]?.cls || "bg-slate-100 text-slate-600"}`}>
                        {ASSIGNEE_MAP[task.assignee]?.label || task.assignee}
                      </span>
                    )}
                    {task.due_date && (
                      <span className="text-[10px] text-muted-foreground">
                        마감 {task.due_date.split("T")[0]}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                  {formatDistanceToNow(new Date(task.updated_date || task.created_date), { addSuffix: true, locale: ko })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
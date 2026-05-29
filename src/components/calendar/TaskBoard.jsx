import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Clock, Loader2, ChevronRight, User } from "lucide-react";

const ASSIGNEE_MAP = {
  ceo: { label: "대표", color: "bg-purple-100 text-purple-700" },
  designer: { label: "디자이너", color: "bg-blue-100 text-blue-700" },
  marketer: { label: "마케터", color: "bg-pink-100 text-pink-700" },
  logistics: { label: "물류/운영", color: "bg-amber-100 text-amber-700" },
};

const STATUS_MAP = {
  todo: { label: "예정", icon: Clock, color: "text-slate-500" },
  in_progress: { label: "진행 중", icon: Loader2, color: "text-blue-500" },
  done: { label: "완료", icon: CheckCircle2, color: "text-green-500" },
  blocked: { label: "블로킹", icon: AlertCircle, color: "text-red-500" },
};

const PRIORITY_COLOR = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-600",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default function TaskBoard({ tasks, allTasks }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState({});

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const STATUS_CYCLE = ["todo", "in_progress", "done", "blocked"];

  const getBlockedByTasks = (task) => {
    if (!task.depends_on?.length) return [];
    return (task.depends_on || [])
      .map((depId) => allTasks?.find((t) => t.id === depId))
      .filter((t) => t && t.status !== "done");
  };

  const grouped = ASSIGNEE_MAP
    ? Object.keys(ASSIGNEE_MAP).map((key) => ({
        key,
        ...ASSIGNEE_MAP[key],
        tasks: tasks.filter((t) => t.assignee === key),
      }))
    : [];

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.key} className="bg-card border border-border rounded-xl overflow-hidden">
          <div className={`px-4 py-3 flex items-center gap-2 ${group.color} border-b border-border/30`}>
            <User className="w-4 h-4" />
            <span className="font-semibold text-sm">{group.label}</span>
            <Badge variant="secondary" className="ml-auto text-xs">{group.tasks.length}건</Badge>
          </div>
          {group.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 py-3">등록된 업무 없음</p>
          ) : (
            <div className="divide-y divide-border/40">
              {group.tasks.map((task) => {
                const StatusIcon = STATUS_MAP[task.status]?.icon || Clock;
                const blockedBy = getBlockedByTasks(task);
                const isExpanded = expanded[task.id];
                return (
                  <div key={task.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => {
                          const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(task.status) + 1) % STATUS_CYCLE.length];
                          updateTask.mutate({ id: task.id, data: { status: next } });
                        }}
                        className={`mt-0.5 ${STATUS_MAP[task.status]?.color}`}
                      >
                        <StatusIcon className="w-4 h-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </span>
                          <Badge className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLOR[task.priority]}`}>
                            {task.priority === "urgent" ? "긴급" : task.priority === "high" ? "높음" : task.priority === "medium" ? "보통" : "낮음"}
                          </Badge>
                          {task.milestone && (
                            <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">{task.milestone}</span>
                          )}
                        </div>
                        {blockedBy.length > 0 && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            선행 업무 미완: {blockedBy.map((t) => t.title).join(", ")}
                          </p>
                        )}
                        {task.due_date && (
                          <p className="text-xs text-muted-foreground mt-0.5">마감: {task.due_date}</p>
                        )}
                      </div>
                      {task.description && (
                        <button onClick={() => setExpanded((p) => ({ ...p, [task.id]: !p[task.id] }))} className="text-muted-foreground">
                          <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </button>
                      )}
                    </div>
                    {isExpanded && task.description && (
                      <p className="mt-2 ml-7 text-xs text-muted-foreground bg-muted/40 rounded p-2">{task.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
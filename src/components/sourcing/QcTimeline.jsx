import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Circle, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const STAGES = [
  { key: "sketch", label: "디자인 스케치", days: "D-45" },
  { key: "3d_print", label: "3D 프린터 시제품", days: "D-35" },
  { key: "t1_sample", label: "T1 사출 샘플", days: "D-25" },
  { key: "mold_fix", label: "금형 수정", days: "D-15" },
  { key: "mass_production", label: "양산(MP)", days: "D-0" },
  { key: "completed", label: "출하 완료", days: "완료" },
];

const STAGE_ORDER = STAGES.map((s) => s.key);

function StageIcon({ status }) {
  if (status === "approved") return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  if (status === "in_progress") return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
  if (status === "revision") return <RefreshCw className="w-5 h-5 text-orange-500" />;
  return <Circle className="w-5 h-5 text-slate-300" />;
}

export default function QcTimeline({ project }) {
  const queryClient = useQueryClient();
  const currentIdx = STAGE_ORDER.indexOf(project.current_stage);

  const advance = useMutation({
    mutationFn: () => {
      const next = STAGE_ORDER[Math.min(currentIdx + 1, STAGE_ORDER.length - 1)];
      const newLog = {
        stage: project.current_stage,
        status: "approved",
        date: new Date().toISOString().split("T")[0],
        notes: "승인 완료",
      };
      return base44.entities.SourcingProject.update(project.id, {
        current_stage: next,
        stage_logs: [...(project.stage_logs || []), newLog],
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sourcing"] }),
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        {STAGES.map((stage, idx) => {
          const log = project.stage_logs?.find((l) => l.stage === stage.key);
          let status = "pending";
          if (idx < currentIdx) status = "approved";
          else if (idx === currentIdx) status = "in_progress";

          return (
            <div key={stage.key} className="flex items-start gap-3 pb-4 relative">
              {idx < STAGES.length - 1 && (
                <div className={`absolute left-[10px] top-5 w-0.5 h-full ${idx < currentIdx ? "bg-green-300" : "bg-border"}`} />
              )}
              <div className="z-10 bg-background">
                <StageIcon status={status} />
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${status === "approved" ? "text-muted-foreground line-through" : ""}`}>
                    {stage.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">{stage.days}</span>
                </div>
                {log?.notes && <p className="text-xs text-muted-foreground mt-0.5">{log.notes} · {log.date}</p>}
              </div>
            </div>
          );
        })}
      </div>
      {project.current_stage !== "completed" && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => advance.mutate()}
          disabled={advance.isPending}
        >
          다음 단계로 승인 →
        </Button>
      )}
    </div>
  );
}
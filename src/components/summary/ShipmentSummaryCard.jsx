import React from "react";
import { Card } from "@/components/ui/card";
import { Ship, Factory, Anchor, Warehouse, CheckCircle2 } from "lucide-react";

const STEPS = [
  { key: "production_start_date", label: "생산 시작", icon: Factory },
  { key: "production_end_date", label: "생산 완료", icon: CheckCircle2 },
  { key: "etd", label: "출항", icon: Ship },
  { key: "eta", label: "입항", icon: Anchor },
];

function dday(date) {
  if (!date) return null;
  const diff = Math.ceil((new Date(date) - new Date()) / 86400000);
  if (diff === 0) return "D-DAY";
  return diff > 0 ? `D-${diff}` : `D+${-diff}`;
}

export default function ShipmentSummaryCard({ project }) {
  const today = new Date().toISOString().split("T")[0];
  // current step = last passed, next pending
  let currentIdx = -1;
  STEPS.forEach((s, i) => { if (project[s.key] && project[s.key] <= today) currentIdx = i; });
  const arrived = project.eta && project.eta <= today;
  const nextStep = arrived ? { label: "국내 입고", icon: Warehouse, date: project.eta } : STEPS[Math.min(currentIdx + 1, STEPS.length - 1)];
  const NextIcon = nextStep?.icon || Ship;
  const nextDate = nextStep?.date !== undefined ? nextStep.date : project[nextStep?.key];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${arrived ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary"}`}>
            <NextIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-sm">{project.product_name}</p>
            <p className="text-xs text-muted-foreground">
              {arrived ? "국내 입고 완료" : `다음: ${nextStep?.label || "-"}`}
              {nextDate ? ` · ${new Date(nextDate).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}` : ""}
            </p>
          </div>
        </div>
        {!arrived && nextDate && (
          <span className="text-sm font-bold text-primary tabular-nums">{dday(nextDate)}</span>
        )}
      </div>
    </Card>
  );
}
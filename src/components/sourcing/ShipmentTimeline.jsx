import React from "react";
import { Factory, Ship, Anchor, Warehouse, CheckCircle2 } from "lucide-react";

const STEPS = [
  { key: "production_start_date", label: "생산 시작", icon: Factory },
  { key: "production_end_date", label: "생산 완료", icon: CheckCircle2 },
  { key: "etd", label: "출항 (ETD)", icon: Ship },
  { key: "eta", label: "입항 (ETA)", icon: Anchor },
];

function fmt(d) {
  if (!d) return "미정";
  return new Date(d).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

export default function ShipmentTimeline({ project }) {
  const today = new Date().toISOString().split("T")[0];
  const steps = [
    ...STEPS,
    { key: "_warehouse", label: "국내 입고", icon: Warehouse, date: project.eta && project.eta < today ? project.eta : null },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-0">
      {steps.map((step, idx) => {
        const date = step.date !== undefined ? step.date : project[step.key];
        const done = date && date <= today;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex md:flex-col md:flex-1 items-center md:text-center gap-3 md:gap-2">
            <div className="flex md:flex-col items-center md:w-full">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                <Icon className="w-4 h-4" />
              </div>
              {idx < steps.length - 1 && (
                <div className={`hidden md:block h-0.5 w-full mt-0 ${done ? "bg-primary" : "bg-border"}`} style={{ marginTop: "-18px", marginLeft: "50%", width: "100%" }} />
              )}
            </div>
            <div className="md:mt-1">
              <p className="text-xs font-medium text-foreground">{step.label}</p>
              <p className="text-xs text-muted-foreground">{fmt(date)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
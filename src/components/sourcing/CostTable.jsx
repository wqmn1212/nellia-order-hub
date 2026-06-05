import React from "react";
import { Factory } from "lucide-react";
import CostRow from "@/components/sourcing/CostRow";

const COLS = [
  { label: "제품명 / 품번", sticky: true },
  { label: "수량" },
  { label: "공장단가($)" },
  { label: "선금($)" },
  { label: "선금환율" },
  { label: "잔금($)" },
  { label: "잔금환율" },
  { label: "물류비($/¥)" },
  { label: "관세(₩)" },
  { label: "부가세(₩)" },
  { label: "용달비(₩)" },
  { label: "샘플비(₩)" },
  { label: "추가비용(KC인증 등)" },
  { label: "광고비(₩)" },
  { label: "개당 수입원가(₩)" },
  { label: "입항(ETA)" },
  { label: "" },
];

export default function CostTable({ projects, isLoading, onDetail }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (projects.length === 0) {
    return (
      <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
        <Factory className="w-9 h-9 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">소싱 프로젝트를 추가해보세요</p>
      </div>
    );
  }
  return (
    <div className="bg-card border border-border rounded-xl overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-secondary/60 border-b border-border">
            {COLS.map((col, i) => (
              <th key={i}
                className={`px-2 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap border-r border-border/60 ${
                  col.sticky ? "sticky left-0 bg-secondary z-10" : ""
                } ${col.label === "개당 수입원가(₩)" ? "text-right text-primary" : ""}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <CostRow key={p.id} project={p} onDetail={onDetail} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
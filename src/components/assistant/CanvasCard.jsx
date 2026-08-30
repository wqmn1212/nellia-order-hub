import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Table2, ListChecks } from "lucide-react";

const ICONS = { table: Table2, list: ListChecks, document: FileText };

export default function CanvasCard({ canvas, isOpen, onOpen }) {
  const Icon = ICONS[canvas.type] || FileText;
  return (
    <div className={`mt-3 flex items-center gap-3 rounded-xl border px-3 py-2.5 ${isOpen ? "border-primary bg-primary/5" : "bg-card"}`}>
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="flex-1 truncate text-sm font-medium">{canvas.title}</p>
      <Button size="sm" variant={isOpen ? "secondary" : "outline"} onClick={onOpen}>
        {isOpen ? "열림" : "열기"}
      </Button>
    </div>
  );
}
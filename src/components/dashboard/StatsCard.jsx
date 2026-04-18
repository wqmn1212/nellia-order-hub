import React from "react";
import { Card } from "@/components/ui/card";

export default function StatsCard({ label, value, sublabel, icon: Icon, accent = "primary" }) {
  const accentMap = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    rose: "bg-rose-100 text-rose-700",
  };

  return (
    <Card className="p-6 border-border/70 shadow-sm hover:shadow-md transition-shadow duration-300 bg-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">{label}</p>
          <p className="mt-3 font-serif text-4xl text-foreground tracking-tight">{value}</p>
          {sublabel && <p className="text-xs text-muted-foreground mt-2">{sublabel}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${accentMap[accent]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </Card>
  );
}
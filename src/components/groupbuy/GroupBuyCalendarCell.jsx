import React from "react";
import { format, isSameMonth, isToday } from "date-fns";

export default function GroupBuyCalendarCell({ day, month, entries, onSelect }) {
  const dim = !isSameMonth(day, month);

  return (
    <div className={`min-h-[86px] rounded-lg border p-1.5 ${dim ? "bg-muted/30" : "bg-card"}`}>
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
          isToday(day) ? "bg-primary text-primary-foreground" : dim ? "text-muted-foreground/60" : "text-muted-foreground"
        }`}
      >
        {format(day, "d")}
      </span>
      <div className="mt-1 space-y-1">
        {entries.map((e) => (
          <button
            key={`${e.item.id}-${e.kind}`}
            type="button"
            onClick={() => onSelect(e.item)}
            className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] ${
              e.kind === "end" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
            }`}
            title={e.item.name}
          >
            {e.kind === "end" ? "마감" : "시작"} · {e.item.name}
          </button>
        ))}
      </div>
    </div>
  );
}
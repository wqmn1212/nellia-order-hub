import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subMonths,
} from "date-fns";
import GroupBuyCalendarCell from "./GroupBuyCalendarCell";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function GroupBuyCalendar({ items, onSelect }) {
  const [month, setMonth] = useState(new Date());
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });

  const entriesFor = (day) => {
    const key = format(day, "yyyy-MM-dd");
    const list = [];
    items.forEach((item) => {
      if (item.start_date && String(item.start_date).split("T")[0] === key) list.push({ item, kind: "start" });
      if (item.end_date && String(item.end_date).split("T")[0] === key) list.push({ item, kind: "end" });
    });
    return list;
  };

  return (
    <Card className="p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-xl">{format(month, "yyyy년 M월")}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="text-emerald-700">시작</span> · <span className="text-rose-700">마감</span> 일정 · 마감일은 구글 캘린더에도 자동 등록됩니다
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setMonth(subMonths(month, 1))}><ChevronLeft /></Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date())}>오늘</Button>
          <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((d) => <div key={d} className="pb-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <GroupBuyCalendarCell
            key={day.toISOString()}
            day={day}
            month={month}
            entries={entriesFor(day)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </Card>
  );
}
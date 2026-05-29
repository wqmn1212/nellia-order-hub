import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle, Loader2, X, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

const ASSIGNEE_MAP = {
  ceo: { label: "대표", chip: "bg-purple-500", light: "bg-purple-100 text-purple-800" },
  designer: { label: "디자이너", chip: "bg-blue-500", light: "bg-blue-100 text-blue-800" },
  marketer: { label: "마케터", chip: "bg-pink-500", light: "bg-pink-100 text-pink-800" },
  logistics: { label: "물류/운영", chip: "bg-amber-500", light: "bg-amber-100 text-amber-800" },
};

const STATUS_MAP = {
  todo: { label: "예정", icon: Clock, color: "text-slate-500" },
  in_progress: { label: "진행 중", icon: Loader2, color: "text-blue-500" },
  done: { label: "완료", icon: CheckCircle2, color: "text-green-500" },
  blocked: { label: "블로킹", icon: AlertCircle, color: "text-red-500" },
};

const PRIORITY_COLOR = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const DEFAULT_TASKS = [
  { title: "글로벌 공장 계약 체결", assignee: "ceo", priority: "urgent", milestone: "D-30", due_date: "", description: "택배사(한진) 계약서 최종 조율 및 비즈니스 마진 승인", status: "todo" },
  { title: "도넛 빗 3D 모델링 설계", assignee: "designer", priority: "high", milestone: "D-45", description: "3D 프린터 시제품 출력, 완료 즉시 공장 및 마케팅팀으로 도면 이관", status: "todo" },
  { title: "와디즈 상세페이지 시각화", assignee: "designer", priority: "high", milestone: "D-15", description: "패키지 칼선 드롭 포함", status: "todo" },
  { title: "메타 광고 캠페인 세팅", assignee: "marketer", priority: "high", milestone: "D-14", description: "디자인 에셋 완료 후 광고 집행 가능", status: "todo" },
  { title: "인플루언서 제휴 가이드라인", assignee: "marketer", priority: "medium", milestone: "D-14", status: "todo" },
  { title: "택배사 ERP 송장 연동 테스트", assignee: "logistics", priority: "high", milestone: "D-15", description: "대표의 택배사 최종 계약 확정 후 시스템 가동", status: "todo" },
  { title: "분실/파손 보상 매뉴얼 수립", assignee: "logistics", priority: "medium", status: "todo" },
];

export default function TeamCalendar() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [form, setForm] = useState({ title: "", assignee: "", priority: "medium", due_date: "", milestone: "", description: "", status: "todo" });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list("-created_date", 200),
  });

  const createTask = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setShowForm(false);
      setForm({ title: "", assignee: "", priority: "medium", due_date: selectedDay ? format(selectedDay, "yyyy-MM-dd") : "", milestone: "", description: "", status: "todo" });
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const seedTasks = useMutation({
    mutationFn: () => base44.entities.Task.bulkCreate(DEFAULT_TASKS),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  // 달력 셀 계산
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    const days = [];
    let d = start;
    while (d <= end) { days.push(d); d = addDays(d, 1); }
    return days;
  }, [currentDate]);

  const filteredTasks = filterAssignee === "all" ? tasks : tasks.filter(t => t.assignee === filterAssignee);

  const tasksByDate = useMemo(() => {
    const map = {};
    filteredTasks.forEach((t) => {
      if (t.due_date) {
        const key = t.due_date.split("T")[0];
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    });
    return map;
  }, [filteredTasks]);

  const tasksWithoutDate = filteredTasks.filter((t) => !t.due_date);

  const selectedDayTasks = selectedDay
    ? (tasksByDate[format(selectedDay, "yyyy-MM-dd")] || [])
    : [];

  const openDayNew = (day) => {
    setSelectedDay(day);
    setForm({ title: "", assignee: "", priority: "medium", due_date: format(day, "yyyy-MM-dd"), milestone: "", description: "", status: "todo" });
    setShowForm(true);
  };

  const STATUS_CYCLE = ["todo", "in_progress", "done", "blocked"];

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden bg-background">
      {/* 메인 캘린더 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-border flex items-center gap-4 bg-card/60 backdrop-blur-sm shrink-0">
          <h1 className="font-serif text-xl text-foreground mr-2">
            {format(currentDate, "yyyy년 M월", { locale: ko })}
          </h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setCurrentDate(new Date())}>오늘</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* 담당자 필터 */}
          <div className="flex items-center gap-1.5 ml-2">
            {["all", ...Object.keys(ASSIGNEE_MAP)].map((key) => (
              <button
                key={key}
                onClick={() => setFilterAssignee(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  filterAssignee === key
                    ? key === "all" ? "bg-foreground text-background" : `${ASSIGNEE_MAP[key].chip} text-white`
                    : "bg-muted text-muted-foreground hover:bg-secondary"
                }`}
              >
                {key === "all" ? "전체" : ASSIGNEE_MAP[key].label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-2">
            {tasks.length === 0 && (
              <Button variant="outline" size="sm" onClick={() => seedTasks.mutate()} className="text-xs">
                샘플 불러오기
              </Button>
            )}
            <Button size="sm" onClick={() => { setSelectedDay(new Date()); setForm({ title: "", assignee: "", priority: "medium", due_date: format(new Date(), "yyyy-MM-dd"), milestone: "", description: "", status: "todo" }); setShowForm(true); }} className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> 업무 추가
            </Button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-border shrink-0">
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <div key={d} className={`py-2 text-center text-xs font-semibold ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* 캘린더 그리드 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 h-full" style={{ gridAutoRows: "minmax(100px, 1fr)" }}>
              {calendarDays.map((day, idx) => {
                const key = format(day, "yyyy-MM-dd");
                const dayTasks = tasksByDate[key] || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const dayOfWeek = idx % 7;

                return (
                  <div
                    key={key}
                    onClick={() => setSelectedDay(isSameDay(day, selectedDay) ? null : day)}
                    className={`border-r border-b border-border/50 p-1.5 cursor-pointer transition-colors min-h-[100px] ${
                      !isCurrentMonth ? "bg-muted/20" : "bg-background hover:bg-muted/30"
                    } ${isSelected ? "ring-2 ring-inset ring-primary" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday(day) ? "bg-primary text-primary-foreground" :
                          !isCurrentMonth ? "text-muted-foreground/50" :
                          dayOfWeek === 0 ? "text-red-500" : dayOfWeek === 6 ? "text-blue-500" : "text-foreground"
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                      {isCurrentMonth && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openDayNew(day); }}
                          className="opacity-0 hover:opacity-100 group-hover:opacity-100 w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs leading-none hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 3).map((t) => (
                        <div
                          key={t.id}
                          className={`text-[11px] leading-tight rounded px-1.5 py-0.5 truncate flex items-center gap-1 ${ASSIGNEE_MAP[t.assignee]?.light || "bg-slate-100 text-slate-700"} ${t.status === "done" ? "opacity-50 line-through" : ""}`}
                          title={t.title}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ASSIGNEE_MAP[t.assignee]?.chip || "bg-slate-400"}`} />
                          {t.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <p className="text-[10px] text-muted-foreground px-1">+{dayTasks.length - 3}개 더</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 사이드 패널 */}
      <div className="w-72 border-l border-border bg-card flex flex-col shrink-0 overflow-hidden">
        {selectedDay ? (
          <>
            <div className="px-4 py-4 border-b border-border flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{format(selectedDay, "M월 d일 (EEEE)", { locale: ko })}</p>
                <p className="text-xs text-muted-foreground">{selectedDayTasks.length}건의 업무</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setForm({ ...form, due_date: format(selectedDay, "yyyy-MM-dd") }); setShowForm(true); }}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedDay(null)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {selectedDayTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">이 날에 업무가 없습니다</p>
                  <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => { setForm({ title: "", assignee: "", priority: "medium", due_date: format(selectedDay, "yyyy-MM-dd"), milestone: "", description: "", status: "todo" }); setShowForm(true); }}>
                    <Plus className="w-3 h-3 mr-1" /> 업무 추가
                  </Button>
                </div>
              ) : (
                selectedDayTasks.map((task) => {
                  const StatusIcon = STATUS_MAP[task.status]?.icon || Clock;
                  return (
                    <div key={task.id} className="bg-background border border-border rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => {
                            const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(task.status) + 1) % STATUS_CYCLE.length];
                            updateTask.mutate({ id: task.id, data: { status: next } });
                          }}
                          className={`mt-0.5 shrink-0 ${STATUS_MAP[task.status]?.color}`}
                        >
                          <StatusIcon className={`w-4 h-4 ${task.status === "in_progress" ? "animate-spin" : ""}`} />
                        </button>
                        <p className={`text-xs font-medium leading-snug flex-1 ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </p>
                        <button onClick={() => deleteTask.mutate(task.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-6">
                        <Badge className={`text-[10px] px-1.5 py-0 ${ASSIGNEE_MAP[task.assignee]?.light}`}>
                          {ASSIGNEE_MAP[task.assignee]?.label}
                        </Badge>
                        <Badge className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLOR[task.priority]}`}>
                          {task.priority === "urgent" ? "긴급" : task.priority === "high" ? "높음" : task.priority === "medium" ? "보통" : "낮음"}
                        </Badge>
                        {task.milestone && (
                          <span className="text-[10px] border border-border rounded px-1.5 py-0.5 text-muted-foreground">{task.milestone}</span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-[11px] text-muted-foreground ml-6 leading-relaxed">{task.description}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            {/* 날짜 없는 업무 */}
            <div className="px-4 py-4 border-b border-border">
              <p className="text-sm font-semibold">미정 업무</p>
              <p className="text-xs text-muted-foreground">{tasksWithoutDate.length}건 · 마감일 미설정</p>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {tasksWithoutDate.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">모든 업무에 마감일이 설정되어 있습니다</p>
              ) : (
                tasksWithoutDate.map((task) => {
                  const StatusIcon = STATUS_MAP[task.status]?.icon || Clock;
                  return (
                    <div key={task.id} className="bg-background border border-border rounded-lg p-3 space-y-1.5">
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => {
                            const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(task.status) + 1) % STATUS_CYCLE.length];
                            updateTask.mutate({ id: task.id, data: { status: next } });
                          }}
                          className={`mt-0.5 shrink-0 ${STATUS_MAP[task.status]?.color}`}
                        >
                          <StatusIcon className={`w-4 h-4 ${task.status === "in_progress" ? "animate-spin" : ""}`} />
                        </button>
                        <p className={`text-xs font-medium leading-snug flex-1 ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </p>
                        <button onClick={() => deleteTask.mutate(task.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <Badge className={`text-[10px] px-1.5 py-0 ml-6 ${ASSIGNEE_MAP[task.assignee]?.light}`}>
                        {ASSIGNEE_MAP[task.assignee]?.label}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
            <div className="px-4 py-4 border-t border-border">
              <p className="text-[11px] text-muted-foreground text-center">날짜를 클릭하면 해당 일의 업무를 볼 수 있어요</p>
            </div>
          </div>
        )}
      </div>

      {/* 업무 추가 다이얼로그 */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>업무 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>업무 제목 *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="업무 제목" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>담당자 *</Label>
                <Select value={form.assignee} onValueChange={(v) => setForm({ ...form, assignee: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ASSIGNEE_MAP).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>우선순위</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">낮음</SelectItem>
                    <SelectItem value="medium">보통</SelectItem>
                    <SelectItem value="high">높음</SelectItem>
                    <SelectItem value="urgent">긴급</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>마감일</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>마일스톤</Label>
                <Input value={form.milestone} onChange={(e) => setForm({ ...form, milestone: e.target.value })} placeholder="예: D-30" className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>메모</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1.5 text-sm" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>취소</Button>
              <Button className="flex-1" onClick={() => createTask.mutate(form)} disabled={!form.title || !form.assignee}>추가</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
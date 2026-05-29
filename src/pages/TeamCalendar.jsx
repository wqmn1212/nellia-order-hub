import React, { useState, useMemo, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import TaskHistoryFeed from "@/components/calendar/TaskHistoryFeed";
import AiTaskRecommender from "@/components/shared/AiTaskRecommender";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronLeft, ChevronRight, CheckCircle2, Clock, XCircle, Loader2, X, Trash2, Pencil } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from "date-fns";
import { ko } from "date-fns/locale";

const ASSIGNEE_MAP = {
  ceo: { label: "대표", chip: "bg-purple-500", light: "bg-purple-100 text-purple-800" },
  designer: { label: "디자이너", chip: "bg-blue-500", light: "bg-blue-100 text-blue-800" },
  marketer: { label: "마케터", chip: "bg-pink-500", light: "bg-pink-100 text-pink-800" },
  logistics: { label: "물류/운영", chip: "bg-amber-500", light: "bg-amber-100 text-amber-800" },
};

const STATUS_MAP = {
  todo: { label: "예정", icon: Clock, color: "text-slate-400" },
  in_progress: { label: "진행중", icon: Loader2, color: "text-blue-500" },
  done: { label: "완료", icon: CheckCircle2, color: "text-green-500" },
  cancelled: { label: "취소", icon: XCircle, color: "text-slate-400" },
};

const STATUS_OPTIONS = [
  { value: "todo", label: "예정", cls: "bg-slate-100 text-slate-600" },
  { value: "in_progress", label: "진행중", cls: "bg-blue-100 text-blue-700" },
  { value: "done", label: "완료", cls: "bg-green-100 text-green-700" },
  { value: "cancelled", label: "취소", cls: "bg-slate-100 text-slate-400" },
];

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
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [form, setForm] = useState({ title: "", assignee: "", priority: "medium", due_date: "", start_time: "", end_time: "", milestone: "", description: "", status: "todo", attachments: [] });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [editingTask, setEditingTask] = useState(null);
  const [dragTaskId, setDragTaskId] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list("-created_date", 200),
  });

  const createTask = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setShowForm(false);
      setForm({ title: "", assignee: "", priority: "medium", due_date: selectedDay ? format(selectedDay, "yyyy-MM-dd") : "", start_time: "", end_time: "", milestone: "", description: "", status: "todo", attachments: [] });
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

  const FIELD_LABELS = { status: "상태", assignee: "담당자", priority: "우선순위", due_date: "마감일", title: "제목", description: "내용", milestone: "마일스톤" };
  const VALUE_LABELS = {
    status: { todo: "예정", in_progress: "진행중", done: "완료", cancelled: "취소", blocked: "블로킹" },
    assignee: { ceo: "대표", designer: "디자이너", marketer: "마케터", logistics: "물류/운영" },
    priority: { low: "낮음", medium: "보통", high: "높음", urgent: "긴급" },
  };

  const logChanges = (taskId, taskTitle, newData, oldData) => {
    const changedByName = user?.full_name || "사용자";
    Object.entries(newData).forEach(([key, newVal]) => {
      const oldVal = oldData?.[key];
      if (String(oldVal ?? "") !== String(newVal ?? "") && FIELD_LABELS[key]) {
        const lm = VALUE_LABELS[key];
        base44.entities.TaskLog.create({
          task_id: taskId,
          task_title: taskTitle,
          field_name: FIELD_LABELS[key],
          old_value: lm ? (lm[oldVal] || String(oldVal || "")) : String(oldVal || ""),
          new_value: lm ? (lm[newVal] || String(newVal || "")) : String(newVal || ""),
          changed_by_name: changedByName,
        }).then(() => queryClient.invalidateQueries({ queryKey: ["task-logs", taskId] }));
      }
    });
  };

  const doUpdate = (taskId, taskTitle, newData, oldData) => {
    updateTask.mutate({ id: taskId, data: newData });
    logChanges(taskId, taskTitle, newData, oldData);
  };

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
  const selectedDayTasks = selectedDay ? (tasksByDate[format(selectedDay, "yyyy-MM-dd")] || []) : [];
  const STATUS_CYCLE = ["todo", "in_progress", "done", "blocked"];

  const openNew = (day) => {
    setEditingTask(null);
    setSelectedDay(day);
    setForm({ title: "", assignee: "", priority: "medium", due_date: format(day, "yyyy-MM-dd"), start_time: "", end_time: "", milestone: "", description: "", status: "todo", attachments: [] });
    setShowForm(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title || "",
      assignee: task.assignee || "",
      priority: task.priority || "medium",
      due_date: task.due_date ? task.due_date.split("T")[0] : "",
      start_time: task.start_time || "",
      end_time: task.end_time || "",
      milestone: task.milestone || "",
      description: task.description || "",
      status: task.status || "todo",
      attachments: task.attachments || [],
    });
    setShowForm(true);
  };

  const handleDrop = (day) => {
    if (!dragTaskId) return;
    const newDate = format(day, "yyyy-MM-dd");
    const draggedTask = tasks.find(t => t.id === dragTaskId);
    updateTask.mutate({ id: dragTaskId, data: { due_date: newDate } });
    if (draggedTask) logChanges(dragTaskId, draggedTask.title, { due_date: newDate }, { due_date: draggedTask.due_date });
    setDragTaskId(null);
    setDragOverDay(null);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push({ name: file.name, url: file_url });
    }
    setForm(prev => ({ ...prev, attachments: [...(prev.attachments || []), ...uploaded] }));
    setUploading(false);
    e.target.value = "";
  };

  const handleSubmit = () => {
    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, data: form }, { onSuccess: () => { setShowForm(false); setEditingTask(null); } });
      logChanges(editingTask.id, editingTask.title, form, editingTask);
    } else {
      createTask.mutate(form);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-0px)] lg:overflow-hidden bg-background">
      {/* 메인 캘린더 영역 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 헤더 */}
        <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-border flex items-center gap-3 bg-card/60 backdrop-blur-sm shrink-0 flex-wrap">
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
          <div className="flex items-center gap-1 ml-1 flex-wrap">
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
            <Button size="sm" onClick={() => openNew(new Date())} className="gap-1.5 text-xs">
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
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7" style={{ gridAutoRows: "minmax(100px, 1fr)" }}>
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
                    onDragOver={(e) => { e.preventDefault(); setDragOverDay(key); }}
                    onDragLeave={() => setDragOverDay(null)}
                    onDrop={(e) => { e.preventDefault(); handleDrop(day); }}
                    className={`border-r border-b border-border/50 p-1.5 cursor-pointer transition-colors min-h-[100px] ${dragOverDay === key ? "bg-primary/10 ring-2 ring-inset ring-primary/50" : !isCurrentMonth ? "bg-muted/20" : "bg-background hover:bg-muted/30"} ${isSelected ? "ring-2 ring-inset ring-primary" : ""}`}
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
                          onClick={(e) => { e.stopPropagation(); openNew(day); }}
                          className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all opacity-0 hover:opacity-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 3).map((t) => (
                       <div
                         key={t.id}
                         draggable
                         onDragStart={(e) => { e.stopPropagation(); setDragTaskId(t.id); }}
                         onDragEnd={() => { setDragTaskId(null); setDragOverDay(null); }}
                         className={`text-[11px] leading-tight rounded px-1.5 py-0.5 truncate flex items-center gap-1 cursor-grab active:cursor-grabbing select-none ${ASSIGNEE_MAP[t.assignee]?.light || "bg-slate-100 text-slate-700"} ${t.status === "done" ? "opacity-50 line-through" : ""} ${dragTaskId === t.id ? "opacity-40" : ""}`}
                         title={t.title}
                       >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ASSIGNEE_MAP[t.assignee]?.chip || "bg-slate-400"}`} />
                          {t.start_time && <span className="opacity-70 shrink-0">{t.start_time}</span>}
                          <span className="truncate">{t.title}</span>
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
      <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border bg-card flex flex-col shrink-0 overflow-hidden lg:h-full max-h-[45vh] lg:max-h-none">
        {selectedDay ? (
          <>
            <div className="px-4 py-4 border-b border-border flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{format(selectedDay, "M월 d일 (EEEE)", { locale: ko })}</p>
                <p className="text-xs text-muted-foreground">{selectedDayTasks.length}건의 업무</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openNew(selectedDay)}>
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
                  <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => openNew(selectedDay)}>
                    <Plus className="w-3 h-3 mr-1" /> 업무 추가
                  </Button>
                </div>
              ) : (
                selectedDayTasks.map((task) => {
                  return (
                    <div key={task.id} className={`bg-background border border-border rounded-lg p-3 space-y-2 ${task.status === "cancelled" ? "opacity-50" : ""}`}>
                      <div className="flex items-start gap-2">
                        <p className={`text-xs font-medium leading-snug flex-1 ${task.status === "done" ? "line-through text-muted-foreground" : task.status === "cancelled" ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </p>
                        <button onClick={() => openEdit(task)} className="text-muted-foreground hover:text-foreground shrink-0">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => deleteTask.mutate(task.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex gap-1">
                        {STATUS_OPTIONS.filter(o => o.value !== "todo" || task.status === "todo").map(o => (
                          <button
                            key={o.value}
                            onClick={() => doUpdate(task.id, task.title, { status: o.value }, { status: task.status })}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all border ${
                              task.status === o.value ? `${o.cls} border-transparent` : "bg-transparent border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
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
                      {(task.start_time || task.end_time) && (
                        <p className="text-[11px] text-blue-600 font-medium ml-6">
                          {task.start_time || ""}{task.end_time ? ` ~ ${task.end_time}` : ""}
                        </p>
                      )}
                      {task.description && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{task.description}</p>
                      )}
                      {task.attachments?.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold text-muted-foreground">첨부 파일</p>
                          {task.attachments.map((att, i) => (
                            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] text-primary hover:underline">
                              <span className="w-3 h-3 text-muted-foreground">📎</span> {att.name}
                            </a>
                          ))}
                        </div>
                      )}
                      <TaskHistoryFeed taskId={task.id} />
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <div className="px-4 py-4 border-b border-border">
              <p className="text-sm font-semibold">미정 업무</p>
              <p className="text-xs text-muted-foreground">{tasksWithoutDate.length}건 · 마감일 미설정</p>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {tasksWithoutDate.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">모든 업무에 마감일이 설정되어 있습니다</p>
              ) : (
                tasksWithoutDate.map((task) => {
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDragTaskId(task.id)}
                      onDragEnd={() => { setDragTaskId(null); setDragOverDay(null); }}
                      className={`bg-background border border-border rounded-lg p-3 space-y-1.5 cursor-grab active:cursor-grabbing select-none ${task.status === "cancelled" ? "opacity-50" : ""} ${dragTaskId === task.id ? "opacity-40" : ""}`}>
                      <div className="flex items-start gap-2">
                        <p className={`text-xs font-medium leading-snug flex-1 ${task.status === "done" || task.status === "cancelled" ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </p>
                        <button onClick={() => openEdit(task)} className="text-muted-foreground hover:text-foreground shrink-0">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => deleteTask.mutate(task.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge className={`text-[10px] px-1.5 py-0 ${ASSIGNEE_MAP[task.assignee]?.light}`}>
                          {ASSIGNEE_MAP[task.assignee]?.label}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        {STATUS_OPTIONS.filter(o => o.value !== "todo" || task.status === "todo").map(o => (
                          <button
                            key={o.value}
                            onClick={() => doUpdate(task.id, task.title, { status: o.value }, { status: task.status })}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all border ${
                              task.status === o.value ? `${o.cls} border-transparent` : "bg-transparent border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="px-3 py-3 border-t border-border overflow-y-auto">
              <AiTaskRecommender context="calendar" />
            </div>
          </div>
        )}
      </div>

      {/* 업무 추가/수정 다이얼로그 */}
      <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) setEditingTask(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? "업무 수정" : "업무 추가"}</DialogTitle>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>시작 시간</Label>
                <Input type="time" value={form.start_time || ""} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>종료 시간</Label>
                <Input type="time" value={form.end_time || ""} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>메모</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1.5 text-sm" />
            </div>
            <div>
              <Label>첨부 파일</Label>
              <div className="mt-1.5 space-y-1.5">
                {(form.attachments || []).map((att, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-muted/50 rounded-md px-2.5 py-1.5">
                    <span className="flex-1 truncate text-foreground">{att.name}</span>
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline shrink-0">다운</a>
                    <button onClick={() => setForm(prev => ({ ...prev, attachments: prev.attachments.filter((_, j) => j !== i) }))} className="text-muted-foreground hover:text-destructive">×</button>
                  </div>
                ))}
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
                <Button type="button" variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Plus className="w-3 h-3" />}
                  {uploading ? "업로드 중..." : "파일 첨부"}
                </Button>
              </div>
            </div>
            {editingTask && (
              <div>
                <Label>상태</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditingTask(null); }}>취소</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={!form.title || !form.assignee}>
                {editingTask ? "저장" : "추가"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, AlertTriangle, Trash2 } from "lucide-react";
import TaskBoard from "@/components/calendar/TaskBoard";

const ASSIGNEES = [
  { value: "ceo", label: "대표 (Product Director)" },
  { value: "designer", label: "디자이너 (Product & UIUX)" },
  { value: "marketer", label: "마케터 (Growth Marketer)" },
  { value: "logistics", label: "물류/운영 담당자" },
];

const DEFAULT_TASKS = [
  { title: "글로벌 공장 계약 체결", assignee: "ceo", priority: "urgent", milestone: "D-30", due_date: "", description: "택배사(한진) 계약서 최종 조율 및 비즈니스 마진 승인", status: "todo" },
  { title: "도넛 빗 3D 모델링 설계", assignee: "designer", priority: "high", milestone: "D-45", description: "3D 프린터 시제품 출력, 완료 즉시 공장 및 마케팅팀으로 도면 이관", status: "todo" },
  { title: "와디즈 상세페이지 시각화", assignee: "designer", priority: "high", milestone: "D-15", description: "패키지 칼선 드롭 포함", status: "todo" },
  { title: "메타 트래픽 광고 캠페인 세팅", assignee: "marketer", priority: "high", milestone: "D-14", description: "디자인 에셋 완료 후 광고 집행 가능", status: "todo" },
  { title: "인플루언서 제휴 가이드라인 배포", assignee: "marketer", priority: "medium", milestone: "D-14", status: "todo" },
  { title: "택배사 ERP 송장 출력 연동 테스트", assignee: "logistics", priority: "high", milestone: "D-15", description: "대표의 택배사 최종 계약 확정 후 시스템 가동", status: "todo" },
  { title: "분실/파손 사고 보상 매뉴얼 수립", assignee: "logistics", priority: "medium", status: "todo" },
];

export default function TeamCalendar() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", assignee: "", priority: "medium", due_date: "", milestone: "", description: "", status: "todo" });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list("-created_date", 100),
  });

  const createTask = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tasks"] }); setShowForm(false); setForm({ title: "", assignee: "", priority: "medium", due_date: "", milestone: "", description: "", status: "todo" }); },
  });

  const deleteTask = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const seedTasks = useMutation({
    mutationFn: () => base44.entities.Task.bulkCreate(DEFAULT_TASKS),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const blocked = tasks.filter((t) => t.status === "blocked").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">팀 캘린더</h1>
          <p className="text-sm text-muted-foreground mt-1">담당자별 업무 및 종속성 기반 일정 관리</p>
        </div>
        <div className="flex gap-2">
          {tasks.length === 0 && (
            <Button variant="outline" size="sm" onClick={() => seedTasks.mutate()}>
              샘플 일정 불러오기
            </Button>
          )}
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> 업무 추가
          </Button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "전체", value: tasks.length, color: "text-foreground" },
          { label: "진행 중", value: inProgress, color: "text-blue-600" },
          { label: "완료", value: done, color: "text-green-600" },
          { label: "블로킹", value: blocked, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {blocked > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>블로킹된 업무 {blocked}건이 있습니다. 선행 업무 완료 여부를 확인하세요.</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <TaskBoard tasks={tasks} allTasks={tasks} />
      )}

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
                  <SelectContent>{ASSIGNEES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
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
              <Button className="flex-1" onClick={() => createTask.mutate(form)} disabled={!form.title || !form.assignee}>
                추가
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Factory, Trash2 } from "lucide-react";
import RfqGenerator from "@/components/sourcing/RfqGenerator";
import QcTimeline from "@/components/sourcing/QcTimeline";
import LandedCostBoard from "@/components/sourcing/LandedCostBoard";

const STAGE_LABEL = {
  sketch: "스케치",
  "3d_print": "3D 시제품",
  t1_sample: "T1 샘플",
  mold_fix: "금형 수정",
  mass_production: "양산",
  completed: "완료",
};

const STAGE_COLOR = {
  sketch: "bg-slate-100 text-slate-600",
  "3d_print": "bg-blue-100 text-blue-600",
  t1_sample: "bg-purple-100 text-purple-700",
  mold_fix: "bg-orange-100 text-orange-700",
  mass_production: "bg-green-100 text-green-700",
  completed: "bg-emerald-100 text-emerald-700",
};

export default function Sourcing() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("qc");
  const [form, setForm] = useState({
    product_name: "",
    product_type: "",
    target_qty: "",
    factory_name: "",
    factory_country: "중국",
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["sourcing"],
    queryFn: () => base44.entities.SourcingProject.list("-created_date", 50),
  });

  const createProject = useMutation({
    mutationFn: (data) =>
      base44.entities.SourcingProject.create({
        ...data,
        target_qty: Number(data.target_qty) || 0,
        current_stage: "sketch",
        stage_logs: [],
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["sourcing"] });
      setShowNew(false);
      setSelected(created);
      setForm({ product_name: "", product_type: "", target_qty: "", factory_name: "", factory_country: "중국" });
    },
  });

  const deleteProject = useMutation({
    mutationFn: (id) => base44.entities.SourcingProject.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sourcing"] });
      setSelected(null);
    },
  });

  const saveRfq = async (rfqContent, specs) => {
    if (!selected) return;
    await base44.entities.SourcingProject.update(selected.id, { rfq_content: rfqContent, specs });
    queryClient.invalidateQueries({ queryKey: ["sourcing"] });
  };

  const currentProject = selected
    ? projects.find((p) => p.id === selected.id) || selected
    : null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">글로벌 소싱 &amp; QC 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            OEM/ODM 공장 소싱 · RFQ 자동 생성 · 양산 타임라인 관리
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> 신규 소싱 프로젝트
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 프로젝트 목록 */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">프로젝트 목록</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center">
              <Factory className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">소싱 프로젝트를 추가해보세요</p>
            </div>
          ) : (
            projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={`w-full text-left bg-card border rounded-xl p-4 transition-all hover:shadow-sm ${
                  currentProject?.id === p.id ? "border-primary shadow-sm" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{p.product_name}</p>
                    {p.factory_name && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.factory_name} · {p.factory_country}
                      </p>
                    )}
                  </div>
                  <Badge className={`text-[10px] shrink-0 ${STAGE_COLOR[p.current_stage]}`}>
                    {STAGE_LABEL[p.current_stage]}
                  </Badge>
                </div>
              </button>
            ))
          )}
        </div>

        {/* 상세 패널 */}
        <div className="lg:col-span-2">
          {!currentProject ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
              <Factory className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">프로젝트를 선택하거나 새로 만들어보세요</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{currentProject.product_name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {currentProject.factory_name || "공장 미지정"} · 목표 수량{" "}
                    {currentProject.target_qty?.toLocaleString() || "-"}개
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${STAGE_COLOR[currentProject.current_stage]}`}>
                    {STAGE_LABEL[currentProject.current_stage]}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteProject.mutate(currentProject.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex border-b border-border">
                {[
                  { key: "qc", label: "QC 타임라인" },
                  { key: "cost", label: "원가/물류" },
                  { key: "rfq", label: "RFQ 생성기" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-5 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {activeTab === "qc" && <QcTimeline project={currentProject} />}
                {activeTab === "cost" && <LandedCostBoard key={currentProject.id} project={currentProject} />}
                {activeTab === "rfq" && <RfqGenerator project={currentProject} onRfqSaved={saveRfq} />}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>신규 소싱 프로젝트</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>제품명 *</Label>
              <Input
                value={form.product_name}
                onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                placeholder="예: 도넛 빗"
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>제품 종류</Label>
                <Input
                  value={form.product_type}
                  onChange={(e) => setForm({ ...form, product_type: e.target.value })}
                  placeholder="예: 헤어 빗"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>목표 수량</Label>
                <Input
                  type="number"
                  value={form.target_qty}
                  onChange={(e) => setForm({ ...form, target_qty: e.target.value })}
                  placeholder="1000"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>공장/업체명</Label>
                <Input
                  value={form.factory_name}
                  onChange={(e) => setForm({ ...form, factory_name: e.target.value })}
                  placeholder="공장명"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>생산국</Label>
                <Input
                  value={form.factory_country}
                  onChange={(e) => setForm({ ...form, factory_country: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowNew(false)}>
                취소
              </Button>
              <Button
                className="flex-1"
                onClick={() => createProject.mutate(form)}
                disabled={!form.product_name}
              >
                프로젝트 생성
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
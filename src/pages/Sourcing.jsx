import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import CostTable from "@/components/sourcing/CostTable";
import RfqGenerator from "@/components/sourcing/RfqGenerator";
import QcTimeline from "@/components/sourcing/QcTimeline";

export default function Sourcing() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailTab, setDetailTab] = useState("qc");
  const [form, setForm] = useState({ product_name: "", model_number: "", product_type: "", factory_name: "", factory_country: "중국", product_id: "" });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["sourcing"],
    queryFn: () => base44.entities.SourcingProject.list("-created_date", 100),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("-created_date", 200),
  });

  const createProject = useMutation({
    mutationFn: async (data) => {
      let productId = data.product_id;
      // 제품 DB에 없으면 자동 등록
      if (!productId) {
        const created = await base44.entities.Product.create({ name: data.product_name, model_number: data.model_number });
        productId = created.id;
      }
      return base44.entities.SourcingProject.create({
        product_name: data.product_name,
        model_number: data.model_number,
        product_type: data.product_type,
        factory_name: data.factory_name,
        factory_country: data.factory_country,
        product_id: productId,
        current_stage: "sketch",
        stage_logs: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sourcing"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowNew(false);
      setForm({ product_name: "", model_number: "", product_type: "", factory_name: "", factory_country: "중국", product_id: "" });
    },
  });

  const saveRfq = async (rfqContent, specs) => {
    if (!detail) return;
    await base44.entities.SourcingProject.update(detail.id, { rfq_content: rfqContent, specs });
    queryClient.invalidateQueries({ queryKey: ["sourcing"] });
  };

  const currentDetail = detail ? projects.find((p) => p.id === detail.id) || detail : null;

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-foreground">글로벌 소싱 원가표</h1>
          <p className="text-sm text-muted-foreground mt-1">
            구입은 달러($)로, 부대비용은 원화(₩)로 입력 → 개당 수입원가 자동 계산
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)} className="gap-1.5 shrink-0">
          <Plus className="w-4 h-4" /> 신규 제품
        </Button>
      </div>

      <CostTable projects={projects} isLoading={isLoading} onDetail={(p) => { setDetail(p); setDetailTab("qc"); }} />
      <p className="text-xs text-muted-foreground">
        각 행을 수정한 뒤 저장 버튼(💾)을 눌러주세요. ⚙️ 버튼으로 QC 타임라인·RFQ를 관리할 수 있습니다.
      </p>

      {/* 신규 제품 */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>신규 소싱 제품 등록</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>제품 DB 연동</Label>
              <Select value={form.product_id || "new"} onValueChange={(v) => {
                if (v === "new") { setForm({ ...form, product_id: "", product_name: "", model_number: "" }); return; }
                const p = products.find((x) => x.id === v);
                setForm({ ...form, product_id: v, product_name: p?.name || "", model_number: p?.model_number || "" });
              }}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">+ 새 제품 직접 입력</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}{p.model_number ? ` (${p.model_number})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">기존 제품을 선택하거나, 새로 입력하면 제품 DB에도 자동 등록됩니다.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>제품명 *</Label>
                <Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                  placeholder="넬리아 엔젤링 드라이어" className="mt-1.5" />
              </div>
              <div>
                <Label>품번/모델명</Label>
                <Input value={form.model_number} onChange={(e) => setForm({ ...form, model_number: e.target.value })}
                  placeholder="NEL330-PK" className="mt-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>공장/업체명</Label>
                <Input value={form.factory_name} onChange={(e) => setForm({ ...form, factory_name: e.target.value })}
                  placeholder="공장명" className="mt-1.5" />
              </div>
              <div>
                <Label>생산국</Label>
                <Input value={form.factory_country} onChange={(e) => setForm({ ...form, factory_country: e.target.value })} className="mt-1.5" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowNew(false)}>취소</Button>
              <Button className="flex-1" onClick={() => createProject.mutate(form)} disabled={!form.product_name}>등록</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QC / RFQ 상세 */}
      <Dialog open={!!currentDetail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentDetail?.product_name} {currentDetail?.model_number ? `(${currentDetail.model_number})` : ""}</DialogTitle>
          </DialogHeader>
          {currentDetail && (
            <>
              <div className="flex border-b border-border">
                {[{ key: "qc", label: "QC 타임라인" }, { key: "rfq", label: "RFQ 생성기" }].map((t) => (
                  <button key={t.key} onClick={() => setDetailTab(t.key)}
                    className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                      detailTab === t.key ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="pt-4">
                {detailTab === "qc" && <QcTimeline project={currentDetail} />}
                {detailTab === "rfq" && <RfqGenerator project={currentDetail} onRfqSaved={saveRfq} />}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
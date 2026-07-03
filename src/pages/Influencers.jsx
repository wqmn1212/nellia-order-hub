import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Users, Handshake, Wallet, Truck } from "lucide-react";
import InfluencerForm from "@/components/influencer/InfluencerForm";
import CollaborationForm from "@/components/influencer/CollaborationForm";
import {
  CHANNEL_TYPES, TIERS, CONTACT_STATUS, COLLAB_TYPES, CONTENT_TYPES,
  SHIPMENT_TYPES, WORK_STATUS, PAYMENT_STATUS,
} from "@/components/influencer/influencerConstants";

const Badge = ({ config }) => config ? <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>{config.label}</span> : null;
const won = (n) => (n || 0).toLocaleString() + "원";

export default function Influencers() {
  const qc = useQueryClient();
  const [infDialog, setInfDialog] = useState(false);
  const [collabDialog, setCollabDialog] = useState(false);
  const [editingInf, setEditingInf] = useState(null);
  const [editingCollab, setEditingCollab] = useState(null);

  const { data: influencers = [] } = useQuery({ queryKey: ["influencers"], queryFn: () => base44.entities.Influencer.list("-created_date", 200) });
  const { data: collabs = [] } = useQuery({ queryKey: ["collaborations"], queryFn: () => base44.entities.Collaboration.list("-created_date", 300) });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => base44.entities.Product.list("-created_date", 200) });

  const saveInf = useMutation({
    mutationFn: (d) => editingInf ? base44.entities.Influencer.update(editingInf.id, d) : base44.entities.Influencer.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["influencers"] }); setInfDialog(false); setEditingInf(null); },
  });
  const saveCollab = useMutation({
    mutationFn: (d) => editingCollab ? base44.entities.Collaboration.update(editingCollab.id, d) : base44.entities.Collaboration.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["collaborations"] }); setCollabDialog(false); setEditingCollab(null); },
  });

  const totalPending = collabs.filter((c) => c.payment_status === "pending").reduce((s, c) => s + (c.fee_agreed || 0), 0);
  const totalPaid = collabs.filter((c) => c.payment_status === "paid").reduce((s, c) => s + (c.fee_agreed || 0), 0);
  const activeCount = collabs.filter((c) => !["published", "cancelled"].includes(c.work_status)).length;

  const stats = [
    { label: "등록 인플루언서", value: influencers.length + "명", icon: Users },
    { label: "진행중 협찬", value: activeCount + "건", icon: Handshake },
    { label: "정산 예정액", value: won(totalPending), icon: Wallet },
    { label: "정산 완료액", value: won(totalPaid), icon: Truck },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-foreground">인플루언서 협찬 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">협찬·리뷰 작업의 비용, 물류 이력, 성과를 통합 관리합니다</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><s.icon className="w-4 h-4 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-semibold">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="collabs">
        <TabsList>
          <TabsTrigger value="collabs">협찬/작업 현황</TabsTrigger>
          <TabsTrigger value="influencers">인플루언서 목록</TabsTrigger>
        </TabsList>

        <TabsContent value="collabs" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingCollab(null); setCollabDialog(true); }} disabled={influencers.length === 0}>
              <Plus className="w-4 h-4" /> 협찬/작업 추가
            </Button>
          </div>
          {influencers.length === 0 && <p className="text-sm text-muted-foreground">먼저 인플루언서를 등록해 주세요.</p>}
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/40">
                <tr className="text-left text-muted-foreground">
                  <th className="p-3 font-medium">인플루언서</th>
                  <th className="p-3 font-medium">제품</th>
                  <th className="p-3 font-medium">유형</th>
                  <th className="p-3 font-medium">콘텐츠</th>
                  <th className="p-3 font-medium">비용</th>
                  <th className="p-3 font-medium">발송</th>
                  <th className="p-3 font-medium">작업상태</th>
                  <th className="p-3 font-medium">정산</th>
                </tr>
              </thead>
              <tbody>
                {collabs.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer" onClick={() => { setEditingCollab(c); setCollabDialog(true); }}>
                    <td className="p-3 font-medium">{c.influencer_name || "-"}</td>
                    <td className="p-3 text-muted-foreground">{c.product_name || "-"}</td>
                    <td className="p-3"><Badge config={COLLAB_TYPES[c.collab_type]} /></td>
                    <td className="p-3">{c.content_url ? <a href={c.content_url} target="_blank" rel="noreferrer" className="text-primary underline" onClick={(e) => e.stopPropagation()}>{CONTENT_TYPES[c.content_type]?.label || "링크"}</a> : <span className="text-muted-foreground">{CONTENT_TYPES[c.content_type]?.label || "-"}</span>}</td>
                    <td className="p-3">{won(c.fee_agreed)}</td>
                    <td className="p-3"><Badge config={SHIPMENT_TYPES[c.shipment_type]} /></td>
                    <td className="p-3"><Badge config={WORK_STATUS[c.work_status]} /></td>
                    <td className="p-3"><Badge config={PAYMENT_STATUS[c.payment_status]} /></td>
                  </tr>
                ))}
                {collabs.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">등록된 협찬/작업이 없습니다</td></tr>}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="influencers" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingInf(null); setInfDialog(true); }}><Plus className="w-4 h-4" /> 인플루언서 추가</Button>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/40">
                <tr className="text-left text-muted-foreground">
                  <th className="p-3 font-medium">이름</th>
                  <th className="p-3 font-medium">채널</th>
                  <th className="p-3 font-medium">계정</th>
                  <th className="p-3 font-medium">등급</th>
                  <th className="p-3 font-medium">팔로워</th>
                  <th className="p-3 font-medium">건당 비용</th>
                  <th className="p-3 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {influencers.map((i) => (
                  <tr key={i.id} className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer" onClick={() => { setEditingInf(i); setInfDialog(true); }}>
                    <td className="p-3 font-medium">{i.name}</td>
                    <td className="p-3"><Badge config={CHANNEL_TYPES[i.channel_type]} /></td>
                    <td className="p-3 text-muted-foreground">{i.handle || "-"}</td>
                    <td className="p-3"><Badge config={TIERS[i.tier]} /></td>
                    <td className="p-3">{(i.follower_count || 0).toLocaleString()}</td>
                    <td className="p-3">{won(i.fee_per_post)}</td>
                    <td className="p-3"><Badge config={CONTACT_STATUS[i.contact_status]} /></td>
                  </tr>
                ))}
                {influencers.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">등록된 인플루언서가 없습니다</td></tr>}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={infDialog} onOpenChange={setInfDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingInf ? "인플루언서 수정" : "인플루언서 추가"}</DialogTitle></DialogHeader>
          <InfluencerForm influencer={editingInf} onSubmit={(d) => saveInf.mutate(d)} onCancel={() => setInfDialog(false)} isSaving={saveInf.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={collabDialog} onOpenChange={setCollabDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingCollab ? "협찬/작업 수정" : "협찬/작업 추가"}</DialogTitle></DialogHeader>
          <CollaborationForm collab={editingCollab} influencers={influencers} products={products} onSubmit={(d) => saveCollab.mutate(d)} onCancel={() => setCollabDialog(false)} isSaving={saveCollab.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
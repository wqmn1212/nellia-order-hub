import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, MessageCircle, Eye, Bookmark, Share2, Loader2, RefreshCw } from "lucide-react";
import { COLLAB_TYPES, CONTENT_TYPES, SHIPMENT_TYPES, WORK_STATUS, PAYMENT_STATUS } from "./influencerConstants";

export default function CollaborationForm({ collab, influencers, products, onSubmit, onCancel, isSaving }) {
  const [form, setForm] = useState({
    influencer_id: collab?.influencer_id || "",
    product_id: collab?.product_id || "",
    collab_type: collab?.collab_type || "seeding_only",
    content_type: collab?.content_type || "reels",
    content_url: collab?.content_url || "",
    fee_agreed: collab?.fee_agreed || "",
    giveaway_qty: collab?.giveaway_qty || "",
    shipment_type: collab?.shipment_type || "not_shipped",
    tracking_number: collab?.tracking_number || "",
    work_status: collab?.work_status || "planned",
    payment_status: collab?.payment_status || "pending",
    published_date: collab?.published_date || "",
    notes: collab?.notes || "",
    ig_likes: collab?.ig_likes,
    ig_comments: collab?.ig_comments,
    ig_views: collab?.ig_views,
    ig_reach: collab?.ig_reach,
    ig_saves: collab?.ig_saves,
    ig_shares: collab?.ig_shares,
    ig_synced_at: collab?.ig_synced_at || "",
  });

  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const fetchMetrics = async () => {
    setFetchError("");
    setFetching(true);
    try {
      const res = await base44.functions.invoke("fetchInstagramMetrics", { content_url: form.content_url });
      const m = res.data?.metrics;
      if (m) {
        setForm((p) => ({
          ...p,
          ig_likes: m.likes,
          ig_comments: m.comments,
          ig_views: m.views,
          ig_reach: m.reach,
          ig_saves: m.saves,
          ig_shares: m.shares,
          ig_synced_at: m.fetched_at,
        }));
      }
    } catch (err) {
      setFetchError(err?.response?.data?.error || "지표를 가져오지 못했습니다.");
    } finally {
      setFetching(false);
    }
  };

  const hasMetrics = form.ig_synced_at;

  const handleSubmit = () => {
    const influencer = influencers.find((i) => i.id === form.influencer_id);
    const product = products.find((p) => p.id === form.product_id);
    onSubmit({
      ...form,
      influencer_name: influencer?.name || "",
      product_name: product?.name || "",
      fee_agreed: form.fee_agreed ? Number(form.fee_agreed) : 0,
      giveaway_qty: form.giveaway_qty ? Number(form.giveaway_qty) : 0,
      published_date: form.published_date || undefined,
      ig_synced_at: form.ig_synced_at || undefined,
    });
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>인플루언서</Label>
          <Select value={form.influencer_id} onValueChange={(v) => set("influencer_id", v)}>
            <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
            <SelectContent>
              {influencers.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>제품</Label>
          <Select value={form.product_id} onValueChange={(v) => set("product_id", v)}>
            <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
            <SelectContent>
              {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>협찬 유형</Label>
          <Select value={form.collab_type} onValueChange={(v) => set("collab_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(COLLAB_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>콘텐츠 형태</Label>
          <Select value={form.content_type} onValueChange={(v) => set("content_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CONTENT_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>합의 작업 비용 (원)</Label>
          <Input type="number" value={form.fee_agreed} onChange={(e) => set("fee_agreed", e.target.value)} placeholder="제품제공만이면 0" />
        </div>
        <div>
          <Label>제공 수량</Label>
          <Input type="number" value={form.giveaway_qty} onChange={(e) => set("giveaway_qty", e.target.value)} placeholder="0" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>발송 유형</Label>
          <Select value={form.shipment_type} onValueChange={(v) => set("shipment_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(SHIPMENT_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>운송장 번호</Label>
          <Input value={form.tracking_number} onChange={(e) => set("tracking_number", e.target.value)} placeholder="송장번호" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>작업 상태</Label>
          <Select value={form.work_status} onValueChange={(v) => set("work_status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(WORK_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>정산 상태</Label>
          <Select value={form.payment_status} onValueChange={(v) => set("payment_status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PAYMENT_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>게시일</Label>
          <Input type="date" value={form.published_date} onChange={(e) => set("published_date", e.target.value)} />
        </div>
        <div>
          <Label>콘텐츠 링크</Label>
          <Input value={form.content_url} onChange={(e) => set("content_url", e.target.value)} placeholder="릴스/영상/블로그 URL" />
        </div>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-3 bg-secondary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">인스타그램 성과 지표</p>
            <p className="text-xs text-muted-foreground">회사 공식 계정이 올린 게시물만 자동 수집됩니다</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={fetching || !form.content_url}
          >
            {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : (hasMetrics ? <RefreshCw className="w-4 h-4" /> : null)}
            {fetching ? "가져오는 중..." : hasMetrics ? "새로고침" : "지표 가져오기"}
          </Button>
        </div>

        {fetchError && <p className="text-xs text-destructive">{fetchError}</p>}

        {hasMetrics && (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { icon: Heart, label: "좋아요", value: form.ig_likes },
                { icon: MessageCircle, label: "댓글", value: form.ig_comments },
                { icon: Eye, label: "조회수", value: form.ig_views },
                { icon: Eye, label: "도달", value: form.ig_reach },
                { icon: Bookmark, label: "저장", value: form.ig_saves },
                { icon: Share2, label: "공유", value: form.ig_shares },
              ].map((m) => (
                <div key={m.label} className="rounded-md bg-background border border-border p-2 text-center">
                  <m.icon className="w-3.5 h-3.5 mx-auto text-primary mb-1" />
                  <p className="text-sm font-semibold">{(m.value ?? 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">마지막 수집: {new Date(form.ig_synced_at).toLocaleString("ko-KR")}</p>
          </>
        )}
      </div>

      <div>
        <Label>메모</Label>
        <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="특이사항 (빈박스 사유 등)" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>취소</Button>
        <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? "저장 중..." : "저장"}</Button>
      </div>
    </div>
  );
}
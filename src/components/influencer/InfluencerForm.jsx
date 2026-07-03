import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CHANNEL_TYPES, TIERS, CONTACT_STATUS } from "./influencerConstants";

export default function InfluencerForm({ influencer, onSubmit, onCancel, isSaving }) {
  const [form, setForm] = useState({
    name: influencer?.name || "",
    channel_type: influencer?.channel_type || "instagram",
    handle: influencer?.handle || "",
    tier: influencer?.tier || "micro",
    follower_count: influencer?.follower_count || "",
    fee_per_post: influencer?.fee_per_post || "",
    payment_info: influencer?.payment_info || "",
    contact_status: influencer?.contact_status || "candidate",
    notes: influencer?.notes || "",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSubmit({
      ...form,
      follower_count: form.follower_count ? Number(form.follower_count) : undefined,
      fee_per_post: form.fee_per_post ? Number(form.fee_per_post) : 0,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>이름 *</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="인플루언서 이름" />
        </div>
        <div>
          <Label>채널</Label>
          <Select value={form.channel_type} onValueChange={(v) => set("channel_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CHANNEL_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>계정 ID / 링크</Label>
          <Input value={form.handle} onChange={(e) => set("handle", e.target.value)} placeholder="@handle 또는 URL" />
        </div>
        <div>
          <Label>등급</Label>
          <Select value={form.tier} onValueChange={(v) => set("tier", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TIERS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>팔로워 수</Label>
          <Input type="number" value={form.follower_count} onChange={(e) => set("follower_count", e.target.value)} placeholder="0" />
        </div>
        <div>
          <Label>1건당 작업 비용 (원)</Label>
          <Input type="number" value={form.fee_per_post} onChange={(e) => set("fee_per_post", e.target.value)} placeholder="0" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>컨택 상태</Label>
          <Select value={form.contact_status} onValueChange={(v) => set("contact_status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CONTACT_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>정산 정보</Label>
          <Input value={form.payment_info} onChange={(e) => set("payment_info", e.target.value)} placeholder="계좌 / 연락처" />
        </div>
      </div>

      <div>
        <Label>메모</Label>
        <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="특이사항" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>취소</Button>
        <Button onClick={handleSubmit} disabled={isSaving || !form.name.trim()}>{isSaving ? "저장 중..." : "저장"}</Button>
      </div>
    </div>
  );
}
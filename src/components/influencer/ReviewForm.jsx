import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REVIEW_SOURCES, REVIEW_STATUS } from "./influencerConstants";
import ReviewImageUploader from "./ReviewImageUploader";

export default function ReviewForm({ review, products, onSubmit, onCancel, isSaving }) {
  const [form, setForm] = useState({
    source: review?.source || "coupang",
    product_id: review?.product_id || "",
    reviewer_name: review?.reviewer_name || "",
    customer_phone: review?.customer_phone || "",
    customer_address: review?.customer_address || "",
    image_urls: review?.image_urls || [],
    content: review?.content || "",
    review_url: review?.review_url || "",
    rating: review?.rating || "",
    status: review?.status || "unchecked",
    review_date: review?.review_date || "",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.content.trim()) return;
    const product = products.find((p) => p.id === form.product_id);
    onSubmit({
      ...form,
      product_name: product?.name || "",
      rating: form.rating ? Number(form.rating) : undefined,
      review_date: form.review_date || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>구매 장소 / 채널</Label>
          <Select value={form.source} onValueChange={(v) => set("source", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(REVIEW_SOURCES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
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
          <Label>구매자 (작성자)</Label>
          <Input value={form.reviewer_name} onChange={(e) => set("reviewer_name", e.target.value)} placeholder="구매자명" />
        </div>
        <div>
          <Label>연락처</Label>
          <Input value={form.customer_phone} onChange={(e) => set("customer_phone", e.target.value)} placeholder="010-0000-0000" />
        </div>
      </div>

      <div>
        <Label>주소</Label>
        <Input value={form.customer_address} onChange={(e) => set("customer_address", e.target.value)} placeholder="배송지 주소" />
      </div>

      <ReviewImageUploader urls={form.image_urls} onChange={(v) => set("image_urls", v)} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>별점 (1~5)</Label>
          <Input type="number" min="1" max="5" value={form.rating} onChange={(e) => set("rating", e.target.value)} placeholder="5" />
        </div>
        <div>
          <Label>작성일</Label>
          <Input type="date" value={form.review_date} onChange={(e) => set("review_date", e.target.value)} />
        </div>
      </div>

      <div>
        <Label>후기 내용 *</Label>
        <Textarea rows={4} value={form.content} onChange={(e) => set("content", e.target.value)} placeholder="후기 텍스트를 입력하면 AI가 감정/키워드를 분석합니다" />
      </div>

      <div>
        <Label>처리 상태</Label>
        <Select value={form.status} onValueChange={(v) => set("status", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(REVIEW_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>후기 링크</Label>
        <Input value={form.review_url} onChange={(e) => set("review_url", e.target.value)} placeholder="URL" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>취소</Button>
        <Button onClick={handleSubmit} disabled={isSaving || !form.content.trim()}>{isSaving ? "저장 중..." : "저장"}</Button>
      </div>
    </div>
  );
}
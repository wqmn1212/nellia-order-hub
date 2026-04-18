import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload } from "lucide-react";

const CATEGORIES = {
  hair_dryer: "헤어드라이어",
  styler: "스타일러",
  straightener: "고데기",
  accessory: "액세서리",
  other: "기타",
};

export default function ProductForm({ product, onSubmit, onCancel, isLoading }) {
  const [form, setForm] = useState({
    name: product?.name || "",
    model_number: product?.model_number || "",
    category: product?.category || "hair_dryer",
    price: product?.price || "",
    image_url: product?.image_url || "",
    short_description: product?.short_description || "",
    specs: product?.specs || "",
    features: product?.features || "",
    target_audience: product?.target_audience || "",
    is_active: product?.is_active ?? true,
    stock_quantity: product?.stock_quantity ?? "",
    stock_alert_threshold: product?.stock_alert_threshold ?? 10,
  });
  const [uploading, setUploading] = useState(false);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("image_url", file_url);
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      price: form.price ? Number(form.price) : undefined,
      stock_quantity: form.stock_quantity !== "" ? Number(form.stock_quantity) : undefined,
      stock_alert_threshold: form.stock_alert_threshold ? Number(form.stock_alert_threshold) : 10,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>제품명 *</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="예: 넬리아 프로 드라이어" />
        </div>
        <div className="space-y-1.5">
          <Label>모델 번호</Label>
          <Input value={form.model_number} onChange={(e) => set("model_number", e.target.value)} placeholder="예: NL-HD100" />
        </div>
        <div className="space-y-1.5">
          <Label>카테고리</Label>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>판매가 (원)</Label>
          <Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="예: 89000" />
        </div>
      </div>

      {/* 이미지 업로드 */}
      <div className="space-y-1.5">
        <Label>제품 이미지</Label>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border hover:bg-secondary transition-colors text-sm text-muted-foreground">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "업로드 중..." : "이미지 업로드"}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          {form.image_url && (
            <img src={form.image_url} alt="preview" className="w-14 h-14 object-cover rounded-lg border border-border" />
          )}
        </div>
        <Input value={form.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="또는 이미지 URL 직접 입력" className="mt-1" />
      </div>

      <div className="space-y-1.5">
        <Label>짧은 설명</Label>
        <Input value={form.short_description} onChange={(e) => set("short_description", e.target.value)} placeholder="예: 1875W 고출력 이온 헤어드라이어" />
      </div>

      <div className="space-y-1.5">
        <Label>제품 스펙</Label>
        <Textarea
          value={form.specs}
          onChange={(e) => set("specs", e.target.value)}
          placeholder="전력: 1875W&#10;중량: 380g&#10;전압: 220V&#10;풍속 단계: 3단계&#10;온도 단계: 3단계&#10;코드 길이: 2m"
          rows={5}
        />
      </div>

      <div className="space-y-1.5">
        <Label>주요 특징 / 셀링 포인트</Label>
        <Textarea
          value={form.features}
          onChange={(e) => set("features", e.target.value)}
          placeholder="예: 마이너스 이온으로 정전기 방지, 세라믹 히터 기술로 두피 보호..."
          rows={4}
        />
      </div>

      <div className="space-y-1.5">
        <Label>타겟 고객층</Label>
        <Input value={form.target_audience} onChange={(e) => set("target_audience", e.target.value)} placeholder="예: 20-40대 여성, 볼륨 케어에 관심 있는 고객" />
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
        <div className="space-y-1.5">
          <Label>현재 재고 수량</Label>
          <Input type="number" min="0" value={form.stock_quantity} onChange={(e) => set("stock_quantity", e.target.value)} placeholder="예: 50" />
        </div>
        <div className="space-y-1.5">
          <Label>재고 알림 기준 수량</Label>
          <Input type="number" min="0" value={form.stock_alert_threshold} onChange={(e) => set("stock_alert_threshold", e.target.value)} placeholder="기본: 10" />
          <p className="text-[11px] text-muted-foreground">이 수량 이하면 대시보드에 긴급 알림이 표시됩니다</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>취소</Button>
        <Button type="submit" disabled={isLoading || uploading}>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
          {product ? "수정 저장" : "제품 등록"}
        </Button>
      </div>
    </form>
  );
}
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, X, ImagePlus } from "lucide-react";

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
    short_description: product?.short_description || "",
    specs: product?.specs || "",
    features: product?.features || "",
    target_audience: product?.target_audience || "",
    is_active: product?.is_active ?? true,
    stock_quantity: product?.stock_quantity ?? "",
    stock_alert_threshold: product?.stock_alert_threshold ?? 10,
  });

  // 이미지 목록: 기존 image_url(대표) + image_urls 배열 통합
  const initImages = () => {
    const urls = product?.image_urls || [];
    if (product?.image_url && !urls.includes(product.image_url)) {
      return [product.image_url, ...urls];
    }
    return [...urls];
  };
  const [images, setImages] = useState(initImages);
  const [uploadingCount, setUploadingCount] = useState(0);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 20 - images.length;
    const toUpload = files.slice(0, remaining);
    setUploadingCount(toUpload.length);
    const results = await Promise.all(
      toUpload.map((file) => base44.integrations.Core.UploadFile({ file }))
    );
    setImages((prev) => [...prev, ...results.map((r) => r.file_url)]);
    setUploadingCount(0);
    e.target.value = "";
  };

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      price: form.price ? Number(form.price) : undefined,
      stock_quantity: form.stock_quantity !== "" ? Number(form.stock_quantity) : undefined,
      stock_alert_threshold: form.stock_alert_threshold ? Number(form.stock_alert_threshold) : 10,
      image_url: images[0] || "",
      image_urls: images,
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

      {/* 이미지 업로드 (최대 20개) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>제품 이미지 <span className="text-muted-foreground font-normal">(최대 20개)</span></Label>
          <span className="text-xs text-muted-foreground">{images.length} / 20</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {images.map((url, idx) => (
            <div key={idx} className="relative group aspect-square">
              <img src={url} alt={`이미지 ${idx + 1}`} className="w-full h-full object-cover rounded-lg border border-border" />
              {idx === 0 && (
                <span className="absolute bottom-0 left-0 right-0 text-[9px] text-center bg-primary/80 text-primary-foreground rounded-b-lg py-0.5">대표</span>
              )}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {images.length < 20 && (
            <label className="aspect-square cursor-pointer flex flex-col items-center justify-center rounded-lg border border-dashed border-border hover:bg-secondary transition-colors text-muted-foreground">
              {uploadingCount > 0 ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mb-1" />
                  <span className="text-[10px]">{uploadingCount}개 중...</span>
                </>
              ) : (
                <>
                  <ImagePlus className="w-5 h-5 mb-1" />
                  <span className="text-[10px]">추가</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploadingCount > 0}
              />
            </label>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">첫 번째 이미지가 대표 이미지로 사용됩니다. 여러 파일을 한 번에 선택할 수 있습니다.</p>
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
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2 } from "lucide-react";
import ShotLibrary from "@/components/studio/ShotLibrary";
import GeneratePanel from "@/components/studio/GeneratePanel";
import ResultGallery from "@/components/studio/ResultGallery";

export default function ImageStudio() {
  const [productId, setProductId] = useState("all");
  const [selectedUrls, setSelectedUrls] = useState([]);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("-created_date", 100),
  });

  const { data: shots = [] } = useQuery({
    queryKey: ["shotImages"],
    queryFn: () => base44.entities.ShotImage.list("-created_date", 200),
  });

  const { data: generated = [] } = useQuery({
    queryKey: ["generatedImages"],
    queryFn: () => base44.entities.GeneratedImage.list("-created_date", 100),
  });

  const activeProductId = productId === "all" ? null : productId;

  const productShots = shots.filter(
    (s) => s.type === "product" && (productId === "all" || s.product_id === productId)
  );
  const modelShots = shots.filter((s) => s.type === "model");
  const galleryImages = generated.filter(
    (g) => productId === "all" || g.product_id === productId
  );

  const toggleSelect = (url) => {
    setSelectedUrls((prev) => (prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]));
  };
  const removeSelect = (url) => setSelectedUrls((prev) => prev.filter((u) => u !== url));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-1">Product Image Studio</p>
          <h1 className="font-serif text-3xl text-foreground flex items-center gap-2">
            <Wand2 className="w-7 h-7 text-primary" /> 제품 이미지 스튜디오
          </h1>
          <p className="text-sm text-muted-foreground mt-1">실제 촬영 이미지를 업로드하고, 각도·모델을 지정해 AI 광고컷을 생성하세요</p>
        </div>
        <div className="w-full md:w-64">
          <Select value={productId} onValueChange={(v) => { setProductId(v); setSelectedUrls([]); }}>
            <SelectTrigger><SelectValue placeholder="제품 선택" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 제품</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 왼쪽: 라이브러리 */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <ShotLibrary
              type="product"
              shots={productShots}
              productId={activeProductId}
              selectedUrls={selectedUrls}
              onToggleSelect={toggleSelect}
            />
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <ShotLibrary
              type="model"
              shots={modelShots}
              productId={null}
              selectedUrls={selectedUrls}
              onToggleSelect={toggleSelect}
            />
          </div>
        </div>

        {/* 가운데: 생성 패널 */}
        <div className="lg:col-span-4">
          <GeneratePanel
            productId={activeProductId}
            selectedUrls={selectedUrls}
            onClearSelection={removeSelect}
          />
        </div>

        {/* 오른쪽: 결과 갤러리 */}
        <div className="lg:col-span-4">
          <h3 className="font-semibold text-sm mb-3">생성된 이미지</h3>
          <ResultGallery images={galleryImages} />
        </div>
      </div>
    </div>
  );
}
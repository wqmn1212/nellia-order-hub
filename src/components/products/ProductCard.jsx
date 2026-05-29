import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import ProductAiAnalysis from "@/components/products/ProductAiAnalysis";

const CATEGORY_LABELS = {
  hair_dryer: "헤어드라이어",
  styler: "스타일러",
  straightener: "고데기",
  accessory: "액세서리",
  other: "기타",
};

export default function ProductCard({ product, onEdit, onDelete }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-secondary flex items-center justify-center text-muted-foreground text-sm">
          이미지 없음
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-semibold text-foreground">{product.name}</p>
            {product.model_number && (
              <p className="text-xs text-muted-foreground">{product.model_number}</p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge variant={product.is_active ? "default" : "secondary"} className="text-[10px]">
              {product.is_active ? "판매중" : "중단"}
            </Badge>
          </div>
        </div>

        {product.category && (
          <Badge variant="outline" className="text-[10px] mb-2">
            {CATEGORY_LABELS[product.category] || product.category}
          </Badge>
        )}

        {product.short_description && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.short_description}</p>
        )}

        {product.price && (
          <p className="text-sm font-semibold text-primary mb-3">{product.price.toLocaleString()}원</p>
        )}

        {product.specs && (
          <div className="bg-secondary/50 rounded-lg p-2.5 mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">스펙</p>
            <p className="text-xs text-foreground whitespace-pre-line line-clamp-3">{product.specs}</p>
          </div>
        )}

        <ProductAiAnalysis product={product} />

        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => onEdit(product)}>
            <Pencil className="w-3.5 h-3.5" />수정
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
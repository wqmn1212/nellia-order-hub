import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, X } from "lucide-react";

export default function GeneratePanel({ productId, selectedUrls, onClearSelection }) {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState(null);

  const genMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt,
        existing_image_urls: selectedUrls.length > 0 ? selectedUrls : undefined,
      });
      return base44.entities.GeneratedImage.create({
        product_id: productId || undefined,
        prompt,
        reference_image_urls: selectedUrls,
        result_url: url,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generatedImages"] });
      setPrompt("");
    },
    onError: (e) => setError(e.message || "이미지 생성에 실패했습니다."),
  });

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">AI 이미지 생성</h3>
      </div>

      {/* 선택된 참조 이미지 */}
      <div>
        <Label className="text-xs">참조 이미지 ({selectedUrls.length}장 선택됨)</Label>
        {selectedUrls.length === 0 ? (
          <p className="text-xs text-muted-foreground mt-1">왼쪽에서 제품·모델 이미지를 클릭해 참조로 선택하세요.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedUrls.map((url) => (
              <div key={url} className="relative">
                <img src={url} alt="ref" className="w-14 h-14 object-cover rounded-md border border-border" />
                <button
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  onClick={() => onClearSelection(url)}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs">생성 프롬프트</Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="text-sm mt-1"
          placeholder="예: 밝은 화이트 배경의 깔끔한 제품 광고컷, 부드러운 조명, 화장대 위에 놓인 모습. 참조 이미지의 제품 디자인과 색상을 그대로 유지."
        />
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      <Button
        className="w-full gap-2"
        disabled={!prompt.trim() || genMutation.isPending}
        onClick={() => genMutation.mutate()}
      >
        {genMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {genMutation.isPending ? "생성 중... (10~20초)" : "이미지 생성"}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">생성 시 Integration 크레딧이 사용됩니다.</p>
    </div>
  );
}
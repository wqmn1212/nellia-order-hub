import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, Check, Loader2, ImagePlus, User } from "lucide-react";

export default function ShotLibrary({ type, shots, productId, selectedUrls, onToggleSelect }) {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [name, setName] = useState("");
  const [angle, setAngle] = useState("");
  const [uploading, setUploading] = useState(false);

  const isProduct = type === "product";

  const createMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: pendingFile });
      return base44.entities.ShotImage.create({
        type,
        name: name || pendingFile.name,
        angle: isProduct ? angle : undefined,
        product_id: isProduct ? productId : undefined,
        image_url: file_url,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shotImages"] });
      setPendingFile(null);
      setName("");
      setAngle("");
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: () => setUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ShotImage.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shotImages"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {isProduct ? <ImagePlus className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-primary" />}
        <h3 className="font-semibold text-sm">{isProduct ? "제품 촬영 이미지" : "모델 이미지"}</h3>
        <span className="text-xs text-muted-foreground">{shots.length}장</span>
      </div>

      {/* 업로드 영역 */}
      <div className="rounded-lg border border-dashed border-border p-3 space-y-2.5">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setPendingFile(f); if (!name) setName(f.name.replace(/\.[^.]+$/, "")); }
          }}
        />
        {!pendingFile ? (
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => fileRef.current?.click()}>
            <Upload className="w-3.5 h-3.5" /> 이미지 선택
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground truncate">{pendingFile.name}</p>
            <div>
              <Label className="text-xs">이름</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" placeholder={isProduct ? "예: 드라이어 정면" : "예: 모델 A"} />
            </div>
            {isProduct && (
              <div>
                <Label className="text-xs">각도</Label>
                <Input value={angle} onChange={(e) => setAngle(e.target.value)} className="h-8 text-sm" placeholder="예: 정면 / 측면 / 후면 / 디테일" />
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 gap-1.5" disabled={uploading} onClick={() => createMutation.mutate()}>
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                업로드
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setPendingFile(null); if (fileRef.current) fileRef.current.value = ""; }}>취소</Button>
            </div>
          </div>
        )}
      </div>

      {/* 이미지 그리드 */}
      <div className="grid grid-cols-2 gap-2">
        {shots.map((shot) => {
          const selected = selectedUrls.includes(shot.image_url);
          return (
            <div
              key={shot.id}
              className={`group relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"}`}
              onClick={() => onToggleSelect(shot.image_url)}
            >
              <img src={shot.image_url} alt={shot.name} className="w-full h-24 object-cover" />
              {selected && (
                <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                  <Check className="w-3 h-3" />
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                <p className="text-[10px] text-white truncate font-medium">{shot.name}</p>
                {shot.angle && <Badge className="text-[9px] h-3.5 px-1 mt-0.5 bg-white/20 text-white border-0">{shot.angle}</Badge>}
              </div>
              <button
                className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 bg-black/60 text-white rounded p-1 transition-opacity"
                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(shot.id); }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
      {shots.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">아직 업로드된 이미지가 없습니다.</p>
      )}
    </div>
  );
}
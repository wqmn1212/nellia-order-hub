import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Download, Trash2, Images } from "lucide-react";

export default function ResultGallery({ images }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GeneratedImage.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["generatedImages"] }),
  });

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
        <Images className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">아직 생성된 이미지가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((img) => (
        <div key={img.id} className="group relative rounded-xl overflow-hidden border border-border bg-card">
          <img src={img.result_url} alt={img.prompt} className="w-full aspect-square object-cover" />
          <div className="p-2.5">
            <p className="text-xs text-muted-foreground line-clamp-2">{img.prompt}</p>
          </div>
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <a
              href={img.result_url}
              target="_blank"
              rel="noreferrer"
              download
              className="bg-black/60 text-white rounded-md p-1.5 hover:bg-black/80"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
            <button
              className="bg-black/60 text-white rounded-md p-1.5 hover:bg-destructive"
              onClick={() => deleteMutation.mutate(img.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
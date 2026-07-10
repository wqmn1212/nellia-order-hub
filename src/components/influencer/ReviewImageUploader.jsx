import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { useDropPaste } from "@/hooks/useDropPaste";

export default function ReviewImageUploader({ urls = [], onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const uploadFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push(file_url);
      }
      onChange([...urls, ...uploaded]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const { isDragging, dropHandlers } = useDropPaste(uploadFiles, { imagesOnly: true });

  const handleFiles = (e) => uploadFiles(Array.from(e.target.files || []));
  const remove = (i) => onChange(urls.filter((_, idx) => idx !== i));

  return (
    <div>
      <Label>사진 (여러 장 첨부 · 드래그·붙여넣기 가능)</Label>
      <div
        {...dropHandlers}
        className={`flex flex-wrap gap-2 mt-1.5 rounded-lg transition-colors ${isDragging ? "ring-2 ring-primary ring-offset-2 bg-primary/5 p-2" : ""}`}
      >
        {urls.map((url, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border group">
            <img src={url} alt={`후기 사진 ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
          <span className="text-[10px] mt-1">{uploading ? "업로드중" : "추가"}</span>
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
    </div>
  );
}
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Folder, FileText, ExternalLink, ChevronRight, AlertCircle } from "lucide-react";

const FOLDER_MIME = "application/vnd.google-apps.folder";

function formatBytes(bytes) {
  if (!bytes) return "";
  const n = Number(bytes);
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(1) + " MB";
}

export default function GoogleDriveBrowser() {
  const [path, setPath] = useState([]); // [{id, name}]
  const current = path[path.length - 1];

  const { data, isLoading, error } = useQuery({
    queryKey: ["gdrive", current?.id || "root"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listGoogleDriveFiles", { folderId: current?.id });
      return res.data;
    },
  });

  const files = data?.files || [];
  const rootName = data && path.length === 0 ? data.folder?.name : "공유 폴더";

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* 경로 */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-1.5 bg-card/60 shrink-0 flex-wrap">
        <button
          onClick={() => setPath([])}
          className="text-sm font-medium text-foreground/70 hover:text-foreground"
        >
          {rootName || "구글 드라이브"}
        </button>
        {path.map((p, i) => (
          <React.Fragment key={p.id}>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <button
              onClick={() => setPath(path.slice(0, i + 1))}
              className="text-sm text-foreground/70 hover:text-foreground truncate max-w-[180px]"
            >
              {p.name}
            </button>
          </React.Fragment>
        ))}
        {data?.folder?.webViewLink && (
          <a
            href={data.folder.webViewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            구글 드라이브에서 열기
          </a>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertCircle className="w-8 h-8 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground">구글 드라이브를 불러올 수 없습니다.</p>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl">
            <Folder className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">이 폴더는 비어 있습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {files.map((f) => {
              const isFolder = f.mimeType === FOLDER_MIME;
              const Wrapper = isFolder ? "button" : "a";
              const props = isFolder
                ? { onClick: () => setPath([...path, { id: f.id, name: f.name }]) }
                : { href: f.webViewLink, target: "_blank", rel: "noopener noreferrer" };
              return (
                <Wrapper
                  key={f.id}
                  {...props}
                  className="text-left bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all"
                >
                  <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                    {f.thumbnailLink ? (
                      <img src={f.thumbnailLink} alt={f.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : isFolder ? (
                      <Folder className="w-10 h-10 text-primary/60" />
                    ) : (
                      <FileText className="w-10 h-10 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="text-[11px] font-medium truncate text-foreground">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {isFolder ? "폴더" : formatBytes(f.size)}
                    </p>
                  </div>
                </Wrapper>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
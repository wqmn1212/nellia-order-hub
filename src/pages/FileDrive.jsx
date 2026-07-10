import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FolderOpen, Folder, FileText, Image, Film, FileArchive, Upload, Plus, Trash2, Download, Search, MoreVertical } from "lucide-react";
import { useDropPaste } from "@/hooks/useDropPaste";

function getFileIcon(mimeType) {
  if (!mimeType) return FileText;
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Film;
  if (mimeType.includes("zip") || mimeType.includes("rar")) return FileArchive;
  return FileText;
}

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function FileDrive() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [selectedFolder, setSelectedFolder] = useState("기본 폴더");
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folders, setFolders] = useState(["기본 폴더", "마케팅", "소싱", "주문/물류"]);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["drive-files"],
    queryFn: () => base44.entities.DriveFile.list("-created_date", 200),
  });

  const deleteFile = useMutation({
    mutationFn: (id) => base44.entities.DriveFile.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drive-files"] }),
  });

  const allFolders = [...new Set([...folders, ...files.map(f => f.folder || "기본 폴더")])];

  const folderFiles = files.filter(f => {
    const inFolder = (f.folder || "기본 폴더") === selectedFolder;
    if (!inFolder) return false;
    if (searchQuery) return f.name.toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  });

  const uploadFiles = async (selectedFiles) => {
    if (!selectedFiles.length) return;
    setUploading(true);
    for (const file of selectedFiles) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.DriveFile.create({
        name: file.name || "붙여넣은 파일",
        file_url,
        folder: selectedFolder,
        mime_type: file.type,
        file_size: file.size,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["drive-files"] });
    setUploading(false);
  };

  const handleUpload = async (e) => {
    await uploadFiles(Array.from(e.target.files || []));
    e.target.value = "";
  };

  const { isDragging, dropHandlers } = useDropPaste(uploadFiles);

  const handleFolderUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    setUploading(true);
    for (const file of selectedFiles) {
      const relativePath = file.webkitRelativePath || file.name;
      const parts = relativePath.split("/");
      const rootFolder = parts[0];
      const fileName = parts.length > 1 ? parts.slice(1).join("/") : file.name;
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.DriveFile.create({
        name: fileName,
        file_url,
        folder: rootFolder,
        mime_type: file.type,
        file_size: file.size,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["drive-files"] });
    setUploading(false);
    e.target.value = "";
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    setFolders(prev => [...new Set([...prev, newFolderName.trim()])]);
    setSelectedFolder(newFolderName.trim());
    setNewFolderName("");
    setShowNewFolder(false);
  };

  const folderFileCounts = allFolders.reduce((acc, f) => {
    acc[f] = files.filter(file => (file.folder || "기본 폴더") === f).length;
    return acc;
  }, {});

  return (
    <div className="flex h-[calc(100vh-56px)] lg:h-screen bg-background overflow-hidden">
      {/* 왼쪽 폴더 사이드바 */}
      <aside className="w-56 shrink-0 border-r border-border bg-card/60 flex flex-col">
        <div className="px-4 py-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm">파일 드라이브</h2>
          <button
            onClick={() => setShowNewFolder(true)}
            className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {allFolders.map((folder) => {
            const active = selectedFolder === folder;
            return (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  active ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }`}
              >
                {active ? <FolderOpen className="w-4 h-4 shrink-0" /> : <Folder className="w-4 h-4 shrink-0" />}
                <span className="flex-1 truncate">{folder}</span>
                <span className={`text-[10px] ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {folderFileCounts[folder] || 0}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* 메인 파일 영역 */}
      <div className="flex-1 flex flex-col min-w-0 relative" {...dropHandlers}>
        {isDragging && (
          <div className="absolute inset-0 z-20 bg-primary/10 border-2 border-dashed border-primary rounded-lg m-2 flex flex-col items-center justify-center pointer-events-none">
            <Upload className="w-12 h-12 text-primary mb-2" />
            <p className="text-sm font-medium text-primary">여기에 파일을 놓으세요 · "{selectedFolder}" 폴더에 업로드됩니다</p>
          </div>
        )}
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-border flex items-center gap-3 bg-card/60 shrink-0">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="파일 검색..."
              className="pl-9 h-8 text-sm"
            />
          </div>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
          <input ref={folderInputRef} type="file" className="hidden" onChange={handleFolderUpload} webkitdirectory="" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => folderInputRef.current?.click()}
            disabled={uploading}
            className="gap-1.5 text-xs"
          >
            <Folder className="w-3.5 h-3.5" />
            폴더 업로드
          </Button>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-1.5 text-xs"
          >
            {uploading ? (
              <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {uploading ? "업로드 중..." : "파일 업로드"}
          </Button>
        </div>

        {/* 파일 그리드 */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-xs text-muted-foreground mb-4 font-medium">
            {selectedFolder} · {folderFiles.length}개 파일
          </p>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : folderFiles.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">클릭 · 드래그앤드롭 · 붙여넣기로 업로드</p>
              <p className="text-xs text-muted-foreground/60 mt-1">이미지, PDF, 문서 등 모든 파일 지원</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {folderFiles.map((file) => {
                const Icon = getFileIcon(file.mime_type);
                const isImage = file.mime_type?.startsWith("image/");
                return (
                  <div
                    key={file.id}
                    className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all"
                  >
                    {/* 썸네일 */}
                    <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                      {isImage ? (
                        <img src={file.file_url} alt={file.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon className="w-10 h-10 text-muted-foreground/50" />
                      )}
                    </div>
                    {/* 파일 정보 */}
                    <div className="px-2.5 py-2">
                      <p className="text-[11px] font-medium truncate text-foreground">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatBytes(file.file_size)}</p>
                    </div>
                    {/* 액션 버튼 */}
                    <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-6 h-6 rounded-md bg-card/90 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Download className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => deleteFile.mutate(file.id)}
                        className="w-6 h-6 rounded-md bg-card/90 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 새 폴더 다이얼로그 */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>새 폴더 만들기</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="폴더 이름"
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewFolder(false)}>취소</Button>
              <Button className="flex-1" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>만들기</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
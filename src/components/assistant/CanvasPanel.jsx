import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Copy, Download, Pencil, X, Eye } from "lucide-react";
import CanvasContent from "./CanvasContent";
import { downloadMarkdown, downloadXlsx, downloadPdf } from "@/lib/canvasExport";

const TYPE_LABEL = { table: "표", document: "문서", list: "목록" };

export default function CanvasPanel({ canvas, onChange, onClose }) {
  const [editing, setEditing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const viewRef = useRef(null);

  const copy = async () => {
    await navigator.clipboard.writeText(canvas.content);
    toast.success("캔버스 내용을 복사했어요");
  };

  const exportAs = async (fmt) => {
    if (fmt === "md") return downloadMarkdown(canvas.title, canvas.content);
    if (fmt === "xlsx") {
      if (!downloadXlsx(canvas.title, canvas.content)) toast.error("표 형식이 아니어서 엑셀로 내보낼 수 없어요");
      return;
    }
    if (fmt === "pdf") {
      if (editing) setEditing(false);
      toast.info("PDF를 만들고 있어요…");
      await downloadPdf(canvas.title, viewRef.current);
    }
  };

  const tryClose = () => (canvas.isDirty ? setConfirmClose(true) : onClose());

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{canvas.title}</p>
            <Badge variant="secondary">{TYPE_LABEL[canvas.type] || "문서"}</Badge>
            {canvas.isDirty && <span className="text-xs text-muted-foreground">편집됨</span>}
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={copy} title="복사"><Copy className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => setEditing(!editing)} title={editing ? "미리보기" : "편집"}>
          {editing ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" title="내보내기"><Download className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportAs("md")}>마크다운(.md)</DropdownMenuItem>
            {canvas.type === "table" && <DropdownMenuItem onClick={() => exportAs("xlsx")}>엑셀(.xlsx)</DropdownMenuItem>}
            <DropdownMenuItem onClick={() => exportAs("pdf")}>PDF(.pdf)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="icon" variant="ghost" onClick={tryClose} title="닫기"><X className="h-4 w-4" /></Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {editing ? (
          <Textarea
            value={canvas.content}
            onChange={(e) => onChange(e.target.value)}
            className="h-full min-h-[50vh] resize-none font-mono text-xs"
          />
        ) : (
          <div ref={viewRef} className="bg-background">
            <CanvasContent type={canvas.type} content={canvas.content} />
          </div>
        )}
      </div>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>편집한 내용이 사라집니다</AlertDialogTitle>
            <AlertDialogDescription>캔버스를 닫으면 수정한 내용은 저장되지 않아요. 닫을까요?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>닫기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
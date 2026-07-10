import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileSpreadsheet, Loader2, AlertTriangle } from "lucide-react";
import { parseReviewExcel } from "@/lib/parseReviewExcel";
import { REVIEW_SOURCES } from "./influencerConstants";

export default function ReviewUploadDialog({ open, onOpenChange, existingReviews = [], onImported }) {
  const inputRef = useRef(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]); // { data, isDup, dupReason, checked }
  const [fileName, setFileName] = useState("");

  const reset = () => { setRows([]); setFileName(""); };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setFileName(file.name);
    try {
      const parsed = await parseReviewExcel(file);
      const existingOrders = new Set(existingReviews.map((r) => r.order_number).filter(Boolean));
      const seen = new Set();
      const processed = parsed.map((data) => {
        let isDup = false;
        let dupReason = "";
        const key = data.order_number;
        if (key && existingOrders.has(key)) { isDup = true; dupReason = "이미 등록됨"; }
        else if (key && seen.has(key)) { isDup = true; dupReason = "파일 내 중복"; }
        if (key) seen.add(key);
        return { data, isDup, dupReason, checked: !isDup };
      });
      setRows(processed);
    } finally {
      setParsing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const toggle = (i) => setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, checked: !r.checked } : r));
  const setAll = (val) => setRows((prev) => prev.map((r) => ({ ...r, checked: val && !r.isDup ? true : val })));

  const selectedCount = rows.filter((r) => r.checked).length;
  const dupCount = rows.filter((r) => r.isDup).length;

  const handleImport = async () => {
    const toCreate = rows.filter((r) => r.checked).map((r) => {
      const { channel_text, product_option, ...rest } = r.data;
      return {
        ...rest,
        content: product_option ? `[옵션] ${product_option}` : "",
      };
    });
    if (toCreate.length === 0) return;
    setSaving(true);
    try {
      await base44.entities.CustomerReview.bulkCreate(toCreate);
      onImported?.(toCreate.length);
      reset();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader><DialogTitle>리뷰작업 엑셀 업로드</DialogTitle></DialogHeader>

        {rows.length === 0 ? (
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer hover:border-primary transition-colors"
          >
            {parsing ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p>분석 중...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <FileSpreadsheet className="w-10 h-10" />
                <p className="font-medium text-foreground">엑셀 파일을 선택하세요</p>
                <p className="text-sm">품명·채널·주문번호·구매자·연락처·주소 열을 자동 인식합니다</p>
              </div>
            )}
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{fileName}</span>
                <span className="font-medium">총 {rows.length}건</span>
                {dupCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="w-3.5 h-3.5" /> 중복 {dupCount}건 자동 제외
                  </span>
                )}
                <span className="text-primary font-medium">선택 {selectedCount}건</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setAll(true)}>전체 선택</Button>
                <Button variant="outline" size="sm" onClick={() => setAll(false)}>전체 해제</Button>
              </div>
            </div>

            <div className="overflow-auto border rounded-lg flex-1">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="p-2 w-10"></th>
                    <th className="p-2">채널</th>
                    <th className="p-2">구매자</th>
                    <th className="p-2">연락처</th>
                    <th className="p-2">주문번호</th>
                    <th className="p-2">금액</th>
                    <th className="p-2">주소</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={`border-t ${r.isDup ? "bg-amber-50/50" : ""}`}>
                      <td className="p-2"><Checkbox checked={r.checked} onCheckedChange={() => toggle(i)} /></td>
                      <td className="p-2 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${REVIEW_SOURCES[r.data.source]?.color || "bg-gray-100 text-gray-700"}`}>
                          {REVIEW_SOURCES[r.data.source]?.label || r.data.channel_text}
                        </span>
                        {r.dupReason && <span className="ml-1 text-[10px] text-amber-600">{r.dupReason}</span>}
                      </td>
                      <td className="p-2 whitespace-nowrap">{r.data.reviewer_name || "-"}</td>
                      <td className="p-2 whitespace-nowrap">{r.data.customer_phone || "-"}</td>
                      <td className="p-2 whitespace-nowrap text-xs">{r.data.order_number || "-"}</td>
                      <td className="p-2 whitespace-nowrap">{r.data.amount ? r.data.amount.toLocaleString() + "원" : "-"}</td>
                      <td className="p-2 max-w-[240px] truncate text-xs text-muted-foreground">{r.data.customer_address || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={reset}>다시 선택</Button>
              <Button onClick={handleImport} disabled={selectedCount === 0 || saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> 등록 중</> : <><Upload className="w-4 h-4" /> 선택 {selectedCount}건 등록</>}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
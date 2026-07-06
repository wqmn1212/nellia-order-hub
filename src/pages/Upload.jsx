import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload as UploadIcon, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { CHANNELS } from "@/components/shared/constants";
import { parseOrderExcel } from "@/lib/parseOrderExcel";

export default function Upload() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | extracting | success | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file || !channel) {
      setError("채널과 파일을 모두 선택해주세요");
      return;
    }
    setError("");
    setStatus("extracting");
    setResult(null);

    try {
      const parsed = await parseOrderExcel(file);

      if (!parsed.length) {
        setStatus("error");
        setError("파일에서 주문 행을 찾지 못했습니다. 열 위치(A,B,E,F,G,H,I,M)와 데이터를 확인해주세요");
        return;
      }

      const orders = parsed.map((o) => ({ ...o, channel, status: "new" }));

      setStatus("uploading");
      await base44.entities.Order.bulkCreate(orders);
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      setStatus("success");
      setResult({ count: orders.length });
    } catch (e) {
      setStatus("error");
      setError(e?.message || "주문 등록 중 오류가 발생했습니다");
    }
  };

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-3xl mx-auto">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Upload</p>
        <h1 className="font-serif text-4xl text-foreground tracking-tight">주문 일괄 업로드</h1>
        <p className="text-muted-foreground mt-2">
          각 플랫폼에서 다운로드한 엑셀/CSV 파일을 업로드하면 주문이 자동으로 등록됩니다
        </p>
      </div>

      <Card className="p-8 border-border/70 shadow-sm">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">판매 채널 *</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="어느 플랫폼에서 다운로드한 파일인가요?" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHANNELS).map(([k, c]) => (
                  <SelectItem key={k} value={k}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">주문 파일 *</Label>
            <label className="block">
              <div className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-primary/50 hover:bg-secondary/30 transition-all cursor-pointer">
                <FileSpreadsheet className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                {file ? (
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(file.size / 1024).toFixed(1)} KB · 다른 파일 선택
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-foreground">파일 선택 또는 드래그</p>
                    <p className="text-xs text-muted-foreground mt-1">CSV, XLSX, XLS 지원</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {status === "success" && result && (
            <div className="flex items-start gap-2 p-4 bg-emerald-50 text-emerald-800 rounded-lg text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{result.count}건의 주문이 등록되었습니다</p>
                <button
                  onClick={() => navigate("/orders")}
                  className="text-xs underline mt-1"
                >
                  주문 목록으로 이동 →
                </button>
              </div>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || !channel || ["uploading", "extracting"].includes(status)}
            className="w-full h-12 bg-primary hover:bg-primary/90"
          >
            {status === "uploading" && <><Loader2 className="w-4 h-4 mr-2 animate-spin" />파일 업로드 중...</>}
            {status === "extracting" && <><Loader2 className="w-4 h-4 mr-2 animate-spin" />주문 데이터 추출 중...</>}
            {(status === "idle" || status === "success" || status === "error") && (
              <><UploadIcon className="w-4 h-4 mr-2" />주문 업로드</>
            )}
          </Button>
        </div>
      </Card>

      <div className="mt-8 text-xs text-muted-foreground space-y-1.5">
        <p className="font-medium text-foreground">📋 엑셀 헤더 매핑 규칙 (운송장 양식)</p>
        <p>• 받는분 → 이름 · 받는분전화 → 연락처</p>
        <p>• 받는분우편번호 → 우편번호 · 받는분주소 → 주소</p>
        <p>• 수량 → 수량 · 품목명 → 품목명</p>
        <p>• 운임Type → 운임타입(메모 기록) · 메모1 → 배송메모</p>
        <p className="pt-1">• 헤더 이름으로 자동 인식하므로 열 순서가 달라도 됩니다</p>
      </div>
    </div>
  );
}
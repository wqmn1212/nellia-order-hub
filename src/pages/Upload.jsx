import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload as UploadIcon, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { CHANNELS } from "@/components/shared/constants";
import { readSheetRows, requestAiMapping, buildOrders } from "@/lib/aiOrderMapper";
import OrderPreviewTable from "@/components/upload/OrderPreviewTable";
import { useDropPaste } from "@/hooks/useDropPaste";

export default function Upload() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | analyzing | ready | uploading | success | error
  const [parsedOrders, setParsedOrders] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const pickFile = (f) => {
    setFile(f || null);
    setParsedOrders([]);
    setResult(null);
    setError("");
    setStatus("idle");
  };

  const { isDragging, dropHandlers } = useDropPaste((files) => pickFile(files[0]));

  const handleAnalyze = async () => {
    if (!file || !channel) {
      setError("채널과 파일을 모두 선택해주세요");
      return;
    }
    setError("");
    setStatus("analyzing");
    try {
      const { headers, dataRows } = await readSheetRows(file);
      if (!headers.length || !dataRows.length) {
        setStatus("error");
        setError("파일에서 데이터를 찾지 못했습니다. 시트 내용을 확인해주세요");
        return;
      }
      const mapping = await requestAiMapping(headers, dataRows);
      const orders = buildOrders(dataRows, mapping);
      if (!orders.length) {
        setStatus("error");
        setError("AI가 주문 데이터를 인식하지 못했습니다. 다른 시트나 파일로 시도해주세요");
        return;
      }
      setParsedOrders(orders);
      setStatus("ready");
    } catch (e) {
      setStatus("error");
      setError(e?.message || "엑셀 분석 중 오류가 발생했습니다");
    }
  };

  const handleRegister = async () => {
    setStatus("uploading");
    setError("");
    try {
      const orders = parsedOrders.map((o) => ({ ...o, channel, status: "new" }));
      await base44.entities.Order.bulkCreate(orders);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setStatus("success");
      setResult({ count: orders.length });
      setParsedOrders([]);
      setFile(null);
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
          양식이 달라도 AI가 엑셀을 분석해 주문일·상품명·옵션·구매자·수량·금액·주문번호를 자동으로 추출합니다
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
            <label className="block" {...dropHandlers}>
              <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/30"}`}>
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
                    <p className="font-medium text-foreground">파일 선택 · 드래그 · 붙여넣기</p>
                    <p className="text-xs text-muted-foreground mt-1">CSV, XLSX, XLS 지원</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {parsedOrders.length > 0 && <OrderPreviewTable orders={parsedOrders} />}

          {status === "success" && result && (
            <div className="flex items-start gap-2 p-4 bg-emerald-50 text-emerald-800 rounded-lg text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{result.count}건의 주문이 등록되었습니다</p>
                <button onClick={() => navigate("/orders")} className="text-xs underline mt-1">
                  주문 목록으로 이동 →
                </button>
              </div>
            </div>
          )}

          {parsedOrders.length === 0 ? (
            <Button
              onClick={handleAnalyze}
              disabled={!file || !channel || status === "analyzing"}
              className="w-full h-12"
            >
              {status === "analyzing"
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />AI가 엑셀 양식을 분석 중...</>
                : <><Sparkles className="w-4 h-4 mr-2" />AI로 주문 데이터 추출</>}
            </Button>
          ) : (
            <Button onClick={handleRegister} disabled={status === "uploading"} className="w-full h-12">
              {status === "uploading"
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />주문 등록 중...</>
                : <><UploadIcon className="w-4 h-4 mr-2" />{parsedOrders.length}건 주문관리에 등록</>}
            </Button>
          )}
        </div>
      </Card>

      <div className="mt-8 text-xs text-muted-foreground space-y-1.5">
        <p className="font-medium text-foreground">📋 AI 자동 인식 항목</p>
        <p>• 주문일 · 주문번호 · 상품주문번호</p>
        <p>• 상품명 · 옵션 · 수량 · 구매금액</p>
        <p>• 구매자명 · 연락처 · 주소 · 우편번호 · 배송메모</p>
        <p className="pt-1">• 열 순서나 헤더 이름이 플랫폼마다 달라도 자동으로 맞춰 인식합니다</p>
      </div>
    </div>
  );
}
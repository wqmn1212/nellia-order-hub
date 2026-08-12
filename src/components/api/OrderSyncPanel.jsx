import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, AlertCircle, Download } from "lucide-react";

const CHANNELS = [
  { key: "naver", label: "네이버 스마트스토어", fn: "syncNaverOrders" },
  { key: "coupang", label: "쿠팡", fn: "syncCoupangOrders" },
];

export default function OrderSyncPanel() {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(null);
  const [results, setResults] = useState({});

  const runSync = async (ch) => {
    setRunning(ch.key);
    try {
      const res = await base44.functions.invoke(ch.fn, {});
      setResults((prev) => ({ ...prev, [ch.key]: res.data }));
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["api-configs"] });
    } catch (e) {
      const data = e?.response?.data;
      setResults((prev) => ({ ...prev, [ch.key]: { error: data?.error || e?.message || "동기화 실패" } }));
      queryClient.invalidateQueries({ queryKey: ["api-configs"] });
    } finally {
      setRunning(null);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-4 h-4 text-primary" />
        <div>
          <h3 className="text-sm font-semibold">주문 수동 수집</h3>
          <p className="text-xs text-muted-foreground">최근 24시간 변경된 주문을 가져옵니다 (중복 없이 갱신)</p>
        </div>
      </div>

      <div className="space-y-3">
        {CHANNELS.map((ch) => {
          const r = results[ch.key];
          return (
            <div key={ch.key} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{ch.label}</p>
                <p className="text-xs text-muted-foreground break-words">
                  {r?.success
                    ? `신규 ${r.created ?? 0}건 · 갱신 ${r.updated ?? 0}건`
                    : r?.error
                    ? r.error
                    : "아직 실행하지 않았습니다"}
                </p>
              </div>
              {r?.success && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {r?.error && <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}
              <Button size="sm" variant="outline" disabled={running === ch.key} onClick={() => runSync(ch)}>
                <RefreshCw className={`w-4 h-4 mr-1.5 ${running === ch.key ? "animate-spin" : ""}`} />
                {running === ch.key ? "수집 중..." : "지금 수집"}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
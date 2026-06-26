import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, AlertCircle, Plug } from "lucide-react";

const PLATFORMS = [
  { key: "naver", label: "네이버 검색광고", emoji: "🟢" },
  { key: "coupang", label: "쿠팡 광고", emoji: "🚀" },
];

export default function AdSyncPanel({ lastDates = {} }) {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    setResults(null);
    try {
      const res = await base44.functions.invoke("syncAllAds", {});
      setResults(res.data?.results || {});
      queryClient.invalidateQueries({ queryKey: ["adPerformance"] });
    } catch (e) {
      setResults({ error: e?.message || "동기화 중 오류가 발생했습니다" });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Plug className="w-4 h-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">광고 API 실시간 연동</h3>
            <p className="text-xs text-muted-foreground">네이버·쿠팡 광고 실적을 직접 가져옵니다 (매일 자동 수집)</p>
          </div>
        </div>
        <Button size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "동기화 중..." : "지금 동기화"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PLATFORMS.map((p) => {
          const r = results?.[p.key];
          const ok = r && r.success;
          const err = r && (r.error || (!r.success && r.detail));
          return (
            <div key={p.key} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40">
              <span className="text-lg">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {ok ? "수집 완료" : err ? String(r.error || "오류") : `최근 수집: ${lastDates[p.key] || "없음"}`}
                </p>
              </div>
              {ok && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {err && <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
import React from "react";
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RefreshCw, ShieldCheck, KeyRound } from "lucide-react";

const CHANNEL_META = {
  coupang: {
    label: "쿠팡",
    color: "bg-red-50 text-red-700 border-red-100",
    adSecrets: ["COUPANG_AD_ACCESS_KEY", "COUPANG_AD_SECRET_KEY", "COUPANG_VENDOR_ID"],
    orderSecrets: ["COUPANG_AD_ACCESS_KEY", "COUPANG_AD_SECRET_KEY", "COUPANG_VENDOR_ID"],
    docUrl: "https://openapi.coupang.com",
    docLabel: "쿠팡 오픈API 문서",
    guide: "Wing → 설정 → 개발자 정보에서 발급",
  },
  naver: {
    label: "네이버 스마트스토어",
    color: "bg-green-50 text-green-700 border-green-100",
    adSecrets: ["NAVER_AD_API_KEY", "NAVER_AD_SECRET_KEY", "NAVER_AD_CUSTOMER_ID"],
    orderSecrets: ["NAVER_COMMERCE_CLIENT_ID", "NAVER_COMMERCE_CLIENT_SECRET"],
    docUrl: "https://apicenter.commerce.naver.com",
    docLabel: "네이버 커머스 API 문서",
    guide: "네이버 커머스 API 센터 → 애플리케이션 등록 후 발급",
  },
};

export default function ChannelConfigCard({ channel, config, onSaved }) {
  const meta = CHANNEL_META[channel];

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (config?.id) {
        return base44.entities.ApiConfig.update(config.id, { is_active: !config.is_active });
      }
      return base44.entities.ApiConfig.create({ channel, is_active: true });
    },
    onSuccess: onSaved,
  });

  const statusBadge = () => {
    if (!config || !config.is_active) return <Badge variant="outline" className="text-xs">비활성</Badge>;
    if (config.sync_status === "success") return <Badge className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">연동 중</Badge>;
    if (config.sync_status === "error") return <Badge className="text-xs bg-rose-50 text-rose-700 border border-rose-200">오류</Badge>;
    return <Badge className="text-xs bg-blue-50 text-blue-700 border border-blue-200">활성화됨</Badge>;
  };

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${meta.color}`}>{meta.label}</span>
            {statusBadge()}
          </div>
          <Button
            size="sm"
            variant={config?.is_active ? "destructive" : "outline"}
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
            className="text-xs h-7"
          >
            {config?.is_active ? "비활성화" : "활성화"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{meta.guide}</p>
        <a href={meta.docUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline underline-offset-2">
          {meta.docLabel} →
        </a>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
          <p className="text-xs font-medium text-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            API 키는 보안 저장소(Secrets)에 안전하게 보관됩니다
          </p>
          <p className="text-[11px] text-emerald-700/80 mt-1 leading-relaxed">
            키 값은 데이터베이스나 화면에 절대 저장·노출되지 않으며, 서버(백엔드)에서만 사용됩니다.
          </p>
        </div>

        <div className="space-y-1.5">
          {[
            { title: "광고 성과 수집용 키", list: meta.adSecrets },
            { title: "주문 수집용 키", list: meta.orderSecrets },
          ].map((group) => (
            <div key={group.title} className="space-y-1.5">
              <p className="text-xs font-medium text-foreground">{group.title}</p>
              {group.list.map((name) => (
                <div key={name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <KeyRound className="w-3 h-3 text-muted-foreground/70" />
                  <code className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">{name}</code>
                </div>
              ))}
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground/80 pt-1">
            위 키 등록을 요청하려면 채팅으로 "{meta.label} 키 등록"이라고 알려주세요.
          </p>
        </div>

        {config?.last_synced_at && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            마지막 동기화: {new Date(config.last_synced_at).toLocaleString("ko-KR")}
          </p>
        )}
        {config?.sync_error && (
          <p className="text-xs text-rose-600 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> {config.sync_error}
          </p>
        )}
        {config?.is_active && (
          <p className="text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 연동이 활성화되어 있습니다
          </p>
        )}
      </CardContent>
    </Card>
  );
}
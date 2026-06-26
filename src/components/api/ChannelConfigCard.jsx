import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RefreshCw, Eye, EyeOff } from "lucide-react";

const CHANNEL_META = {
  coupang: {
    label: "쿠팡",
    color: "bg-red-50 text-red-700 border-red-100",
    fields: [
      { key: "access_key", label: "Access Key", placeholder: "A00xxxxxxxxxxxxxxxx" },
      { key: "secret_key", label: "Secret Key", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", secret: true },
      { key: "vendor_id", label: "Vendor ID", placeholder: "A00xxxxxx" },
    ],
    docUrl: "https://openapi.coupang.com",
    docLabel: "쿠팡 오픈API 문서",
    guide: "Wing → 설정 → 개발자 정보에서 발급",
  },
  naver: {
    label: "네이버 스마트스토어",
    color: "bg-green-50 text-green-700 border-green-100",
    fields: [
      { key: "access_key", label: "Client ID", placeholder: "네이버 Client ID" },
      { key: "secret_key", label: "Client Secret", placeholder: "네이버 Client Secret", secret: true },
    ],
    docUrl: "https://apicenter.commerce.naver.com",
    docLabel: "네이버 커머스 API 문서",
    guide: "네이버 커머스 API 센터 → 애플리케이션 등록 후 발급",
  },
};

// 저장된 키를 마스킹 처리 (앞 3자 + •••• + 뒤 4자)
const maskKey = (value) => {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 3)}••••${value.slice(-4)}`;
};

export default function ChannelConfigCard({ channel, config, onSaved }) {
  const meta = CHANNEL_META[channel];
  // form 값은 '새로 입력하는 값'만 보관. 빈 값이면 기존 저장값 유지
  const [form, setForm] = useState({ access_key: "", secret_key: "", vendor_id: "" });
  // 사용자가 직접 수정 중인 필드만 추적 (수정 안 한 필드는 마스킹된 기존값 표시)
  const [editing, setEditing] = useState({});
  const [showSecret, setShowSecret] = useState(false);
  const [saved, setSaved] = useState(false);

  // config가 바뀌면 입력 상태 초기화 (실제 키는 form에 절대 담지 않음 → 화면 노출 방지)
  useEffect(() => {
    setForm({ access_key: "", secret_key: "", vendor_id: "" });
    setEditing({});
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // 비어있는(=수정 안 한) 필드는 기존 저장값 유지하도록 제외
      const payload = {};
      Object.keys(data).forEach((k) => {
        if (k === "is_active") { payload[k] = data[k]; return; }
        if (editing[k] && data[k] !== "") payload[k] = data[k];
      });
      if (config?.id) {
        return base44.entities.ApiConfig.update(config.id, payload);
      } else {
        return base44.entities.ApiConfig.create({ channel, ...payload });
      }
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSaved();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!config?.id) return;
      return base44.entities.ApiConfig.update(config.id, { is_active: !config.is_active });
    },
    onSuccess: onSaved,
  });

  const handleSave = () => {
    saveMutation.mutate({ ...form, is_active: config?.is_active ?? false });
  };

  const statusBadge = () => {
    if (!config) return <Badge variant="outline" className="text-xs text-muted-foreground">미설정</Badge>;
    if (!config.is_active) return <Badge variant="outline" className="text-xs">비활성</Badge>;
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
          {config?.id && (
            <Button
              size="sm"
              variant={config.is_active ? "destructive" : "outline"}
              onClick={() => toggleMutation.mutate()}
              disabled={toggleMutation.isPending}
              className="text-xs h-7"
            >
              {config.is_active ? "비활성화" : "활성화"}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{meta.guide}</p>
        <a href={meta.docUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline underline-offset-2">
          {meta.docLabel} →
        </a>
      </CardHeader>
      <CardContent className="space-y-3">
        {meta.fields.map((field) => {
          const savedValue = config?.[field.key];
          const isEditing = editing[field.key];
          // 저장된 값이 있고 수정 중이 아니면 마스킹된 값을 표시
          const showMasked = savedValue && !isEditing;
          return (
            <div key={field.key} className="space-y-1">
              <Label className="text-xs">{field.label}</Label>
              <div className="relative">
                <Input
                  type={field.secret && !showSecret && !showMasked ? "password" : "text"}
                  placeholder={field.placeholder}
                  value={showMasked ? maskKey(savedValue) : (form[field.key] || "")}
                  readOnly={showMasked}
                  onFocus={() => {
                    if (showMasked) setEditing({ ...editing, [field.key]: true });
                  }}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className={`text-sm pr-8 ${showMasked ? "text-muted-foreground cursor-pointer font-mono" : ""}`}
                />
                {field.secret && !showMasked && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
              {showMasked && (
                <p className="text-[11px] text-muted-foreground">저장된 키 (보안상 일부만 표시) · 변경하려면 클릭</p>
              )}
            </div>
          );
        })}

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

        <Button
          className="w-full mt-2"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saved ? <><CheckCircle2 className="w-4 h-4 mr-1" /> 저장됨</> : "API 키 저장"}
        </Button>
      </CardContent>
    </Card>
  );
}
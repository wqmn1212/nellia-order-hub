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

export default function ChannelConfigCard({ channel, config, onSaved }) {
  const meta = CHANNEL_META[channel];
  const [form, setForm] = useState({ access_key: "", secret_key: "", vendor_id: "" });
  const [showSecret, setShowSecret] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setForm({
        access_key: config.access_key || "",
        secret_key: config.secret_key || "",
        vendor_id: config.vendor_id || "",
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (config?.id) {
        return base44.entities.ApiConfig.update(config.id, data);
      } else {
        return base44.entities.ApiConfig.create({ channel, ...data });
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
        {meta.fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label className="text-xs">{field.label}</Label>
            <div className="relative">
              <Input
                type={field.secret && !showSecret ? "password" : "text"}
                placeholder={field.placeholder}
                value={form[field.key] || ""}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                className="text-sm pr-8"
              />
              {field.secret && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        ))}

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
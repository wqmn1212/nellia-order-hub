import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CHANNELS } from "./constants";

// 기본 내장 채널 + DB에 저장된 사용자 추가 채널을 병합한 목록을 반환합니다.
// 반환 형태: [{ key, label, color, dot, isCustom }]
const DEFAULT_STYLE = { color: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" };

export function useChannels() {
  const { data: dbChannels = [], isLoading } = useQuery({
    queryKey: ["channels"],
    queryFn: () => base44.entities.Channel.list("-created_date", 200),
  });

  const builtin = Object.entries(CHANNELS).map(([key, c]) => ({
    key,
    label: c.label,
    color: c.color,
    dot: c.dot,
    isCustom: false,
  }));

  const builtinKeys = new Set(builtin.map((c) => c.key));
  const custom = dbChannels
    .filter((c) => !builtinKeys.has(c.key))
    .map((c) => ({ key: c.key, label: c.label, ...DEFAULT_STYLE, isCustom: true }));

  return { channels: [...builtin, ...custom], isLoading };
}
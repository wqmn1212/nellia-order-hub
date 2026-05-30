import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MessageSquareWarning, Clock, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

const CLAIM_LABELS = {
  simple_change: "단순 변심",
  damaged: "파손",
  wrong_delivery: "오배송",
  defective: "제품 불량",
  delay: "배송 지연",
  refund: "환불 요청",
  other: "기타",
};

const STATUS_CONFIG = {
  received: { label: "접수", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  in_progress: { label: "진행중", color: "bg-blue-100 text-blue-700", icon: Loader2 },
  resolved: { label: "완료", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  closed: { label: "종료", color: "bg-slate-100 text-slate-500", icon: XCircle },
};

const PRIORITY_COLOR = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-red-100 text-red-700",
};

export default function CsTickets() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolution, setResolution] = useState("");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["cs-tickets"],
    queryFn: () => base44.entities.CsTicket.list("-created_date", 200),
  });

  const updateTicket = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CsTicket.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cs-tickets"] });
      setSelectedTicket(null);
    },
  });

  const filtered = filterStatus === "all" ? tickets : tickets.filter((t) => t.status === filterStatus);

  const counts = {
    all: tickets.length,
    received: tickets.filter((t) => t.status === "received").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-xl text-foreground">CS / 클레임 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">고객 문의 및 클레임을 추적합니다</p>
        </div>
      </div>

      {/* 상태 필터 탭 */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "전체" },
          { key: "received", label: "접수" },
          { key: "in_progress", label: "진행중" },
          { key: "resolved", label: "완료" },
          { key: "closed", label: "종료" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterStatus === tab.key
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-secondary"
            }`}
          >
            {tab.label}
            {counts[tab.key] != null && <span className="ml-1.5 opacity-70">{counts[tab.key]}</span>}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-16 text-center border-border/70">
          <MessageSquareWarning className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="font-serif text-lg text-foreground">CS 티켓이 없습니다</p>
          <p className="text-sm text-muted-foreground mt-1">주문 목록에서 'CS 접수하기'로 생성할 수 있습니다</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((ticket) => {
            const sc = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.received;
            const Icon = sc.icon;
            return (
              <Card
                key={ticket.id}
                className="border-border/70 p-4 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => { setSelectedTicket(ticket); setResolution(ticket.resolution || ""); }}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${
                    ticket.status === "received" ? "text-yellow-500" :
                    ticket.status === "in_progress" ? "text-blue-500 animate-spin" :
                    ticket.status === "resolved" ? "text-green-500" : "text-slate-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-[10px] px-1.5 py-0 ${sc.color}`}>{sc.label}</Badge>
                      <Badge className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLOR[ticket.priority] || PRIORITY_COLOR.medium}`}>
                        {ticket.priority === "high" ? "높음" : ticket.priority === "low" ? "낮음" : "보통"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {CLAIM_LABELS[ticket.claim_type] || ticket.claim_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-sm">
                      <span className="font-medium text-foreground">{ticket.customer_name || "고객 미상"}</span>
                      <span className="text-muted-foreground text-xs">{ticket.product_name}</span>
                      {ticket.order_number && (
                        <span className="text-xs font-mono text-muted-foreground">#{ticket.order_number}</span>
                      )}
                    </div>
                    {ticket.memo && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ticket.memo}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {formatDistanceToNow(new Date(ticket.created_date), { addSuffix: true, locale: ko })}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 상세/처리 다이얼로그 */}
      <Dialog open={!!selectedTicket} onOpenChange={(o) => { if (!o) setSelectedTicket(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>CS 티켓 상세</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                <p><span className="text-muted-foreground">고객:</span> {selectedTicket.customer_name || "-"}</p>
                <p><span className="text-muted-foreground">주문번호:</span> {selectedTicket.order_number || "-"}</p>
                <p><span className="text-muted-foreground">상품:</span> {selectedTicket.product_name || "-"}</p>
                <p><span className="text-muted-foreground">유형:</span> {CLAIM_LABELS[selectedTicket.claim_type]}</p>
                <p><span className="text-muted-foreground">채널:</span> {selectedTicket.channel || "-"}</p>
              </div>
              {selectedTicket.memo && (
                <div>
                  <Label className="text-xs text-muted-foreground">상담 메모</Label>
                  <p className="text-sm mt-1 bg-secondary/50 rounded-lg p-3">{selectedTicket.memo}</p>
                </div>
              )}
              <div>
                <Label>처리 상태</Label>
                <Select
                  value={selectedTicket.status}
                  onValueChange={(v) => {
                    const data = { status: v };
                    if (v === "resolved") data.resolved_at = new Date().toISOString();
                    updateTicket.mutate({ id: selectedTicket.id, data });
                  }}
                >
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>처리 결과 메모</Label>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={3}
                  placeholder="처리 내용을 기록하세요"
                  className="mt-1.5"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => updateTicket.mutate({ id: selectedTicket.id, data: { resolution } })}
                disabled={updateTicket.isPending}
              >
                저장
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
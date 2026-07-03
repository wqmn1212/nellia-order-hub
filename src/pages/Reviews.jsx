import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Sparkles, Star, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import ReviewForm from "@/components/influencer/ReviewForm";
import { REVIEW_SOURCES, SENTIMENTS, REVIEW_STATUS } from "@/components/influencer/influencerConstants";

const Badge = ({ config }) => config ? <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>{config.label}</span> : null;

export default function Reviews() {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [analyzingId, setAnalyzingId] = useState(null);

  const { data: reviews = [] } = useQuery({ queryKey: ["reviews"], queryFn: () => base44.entities.CustomerReview.list("-created_date", 300) });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => base44.entities.Product.list("-created_date", 200) });

  const save = useMutation({
    mutationFn: async (d) => {
      const saved = editing ? await base44.entities.CustomerReview.update(editing.id, d) : await base44.entities.CustomerReview.create(d);
      const id = editing?.id || saved.id;
      if (id && d.content) {
        await base44.functions.invoke("analyzeReview", { review_id: id, content: d.content });
      }
      return saved;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reviews"] }); setDialog(false); setEditing(null); },
  });

  const analyze = useMutation({
    mutationFn: (r) => base44.functions.invoke("analyzeReview", { review_id: r.id, content: r.content }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
    onSettled: () => setAnalyzingId(null),
  });

  const filtered = reviews.filter((r) =>
    (sourceFilter === "all" || r.source === sourceFilter) &&
    (sentimentFilter === "all" || r.sentiment === sentimentFilter)
  );

  const positive = reviews.filter((r) => r.sentiment === "positive").length;
  const negative = reviews.filter((r) => r.sentiment === "negative").length;
  const avgRating = reviews.filter((r) => r.rating).length
    ? (reviews.filter((r) => r.rating).reduce((s, r) => s + r.rating, 0) / reviews.filter((r) => r.rating).length).toFixed(1)
    : "-";

  const stats = [
    { label: "총 후기", value: reviews.length + "건", icon: MessageSquare },
    { label: "평균 별점", value: avgRating, icon: Star },
    { label: "긍정 후기", value: positive + "건", icon: ThumbsUp },
    { label: "부정 후기", value: negative + "건", icon: ThumbsDown },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-foreground">후기 통합 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">블로그·네이버·쿠팡·자사몰 후기를 모아 AI로 감정과 키워드를 분석합니다</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialog(true); }}><Plus className="w-4 h-4" /> 후기 추가</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><s.icon className="w-4 h-4 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-semibold">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="채널" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 채널</SelectItem>
            {Object.entries(REVIEW_SOURCES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="감정" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 감정</SelectItem>
            {Object.entries(SENTIMENTS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge config={REVIEW_SOURCES[r.source]} />
                  {r.sentiment && <Badge config={SENTIMENTS[r.sentiment]} />}
                  <Badge config={REVIEW_STATUS[r.status]} />
                  {r.rating && <span className="text-xs text-amber-500 flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-400" /> {r.rating}</span>}
                  {r.product_name && <span className="text-xs text-muted-foreground">· {r.product_name}</span>}
                  {r.reviewer_name && <span className="text-xs text-muted-foreground">· {r.reviewer_name}</span>}
                </div>
                <p className="text-sm text-foreground/90 line-clamp-3">{r.content}</p>
                {r.keywords?.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mt-2">
                    {r.keywords.map((k, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">#{k}</span>)}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => { setEditing(r); setDialog(true); }}>수정</Button>
                <Button variant="ghost" size="sm" disabled={analyzingId === r.id} onClick={() => { setAnalyzingId(r.id); analyze.mutate(r); }}>
                  <Sparkles className="w-3.5 h-3.5" /> {analyzingId === r.id ? "분석중" : "AI 분석"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <Card className="p-8 text-center text-muted-foreground">후기가 없습니다</Card>}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "후기 수정" : "후기 추가"}</DialogTitle></DialogHeader>
          <ReviewForm review={editing} products={products} onSubmit={(d) => save.mutate(d)} onCancel={() => setDialog(false)} isSaving={save.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
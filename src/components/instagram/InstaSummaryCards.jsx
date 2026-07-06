import React from "react";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Eye, Users, Bookmark, FileImage } from "lucide-react";

const fmt = (n) => (n || 0).toLocaleString();

export default function InstaSummaryCards({ posts }) {
  const total = posts.reduce(
    (a, p) => ({
      likes: a.likes + (p.likes || 0),
      comments: a.comments + (p.comments || 0),
      views: a.views + (p.views || 0),
      reach: a.reach + (p.reach || 0),
      saves: a.saves + (p.saves || 0),
    }),
    { likes: 0, comments: 0, views: 0, reach: 0, saves: 0 }
  );

  const cards = [
    { label: "게시물", value: fmt(posts.length), icon: FileImage },
    { label: "총 좋아요", value: fmt(total.likes), icon: Heart },
    { label: "총 댓글", value: fmt(total.comments), icon: MessageCircle },
    { label: "총 조회수", value: fmt(total.views), icon: Eye },
    { label: "총 도달", value: fmt(total.reach), icon: Users },
    { label: "총 저장", value: fmt(total.saves), icon: Bookmark },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <c.icon className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
          <p className="text-xl font-semibold">{c.value}</p>
        </Card>
      ))}
    </div>
  );
}
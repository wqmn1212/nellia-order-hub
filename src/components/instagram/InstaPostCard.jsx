import React from "react";
import { Heart, MessageCircle, Eye, Bookmark, ExternalLink } from "lucide-react";

const fmt = (n) => (n || 0).toLocaleString();

export default function InstaPostCard({ post }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card flex flex-col">
      <div className="aspect-square bg-secondary relative overflow-hidden">
        {post.thumbnail ? (
          <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">이미지 없음</div>
        )}
        <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">
          {post.media_product_type === "REELS" ? "릴스" : post.media_type === "CAROUSEL_ALBUM" ? "캐러셀" : post.media_type === "VIDEO" ? "동영상" : "이미지"}
        </span>
      </div>
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{post.caption || "(캡션 없음)"}</p>
        <div className="grid grid-cols-4 gap-1 text-center">
          {[
            { icon: Heart, v: post.likes },
            { icon: MessageCircle, v: post.comments },
            { icon: Eye, v: post.views },
            { icon: Bookmark, v: post.saves },
          ].map((m, i) => (
            <div key={i} className="flex flex-col items-center">
              <m.icon className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium">{fmt(m.v)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border/60">
          <span className="text-[10px] text-muted-foreground">
            {post.timestamp ? new Date(post.timestamp).toLocaleDateString("ko-KR") : ""}
          </span>
          <a href={post.permalink} target="_blank" rel="noreferrer" className="text-primary text-[10px] flex items-center gap-0.5 hover:underline">
            원본 <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
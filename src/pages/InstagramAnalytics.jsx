import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, Loader2, Instagram, AlertCircle } from "lucide-react";
import InstaSummaryCards from "@/components/instagram/InstaSummaryCards";
import InstaEngagementChart from "@/components/instagram/InstaEngagementChart";
import InstaPostCard from "@/components/instagram/InstaPostCard";

export default function InstagramAnalytics() {
  const [posts, setPosts] = useState([]);
  const [username, setUsername] = useState("");
  const [fetchedAt, setFetchedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("fetchInstagramFeed", { limit: 30 });
      setPosts(res.data?.posts || []);
      setUsername(res.data?.username || "");
      setFetchedAt(res.data?.fetched_at || "");
    } catch (err) {
      setError(err?.response?.data?.error || "게시물을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Instagram className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-serif text-foreground">인스타그램 콘텐츠 분석</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            공식 계정{username ? ` @${username}` : ""}이 올린 게시물의 성과를 한눈에 확인하세요
            {fetchedAt && ` · ${new Date(fetchedAt).toLocaleString("ko-KR")} 기준`}
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          새로고침
        </Button>
      </div>

      {error && (
        <Card className="p-4 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500 border-amber-200">
          <AlertCircle className="w-4 h-4" /> {error}
        </Card>
      )}

      {loading && posts.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> 게시물을 불러오는 중...
        </div>
      ) : posts.length === 0 && !error ? (
        <Card className="p-12 text-center text-muted-foreground">게시물이 없습니다.</Card>
      ) : (
        <>
          <InstaSummaryCards posts={posts} />
          <InstaEngagementChart posts={posts} />
          <div>
            <p className="text-sm font-medium mb-3">전체 게시물 ({posts.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {posts.map((p) => <InstaPostCard key={p.id} post={p} />)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
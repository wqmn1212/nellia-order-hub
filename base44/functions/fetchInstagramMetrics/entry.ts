import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Extract the shortcode from an Instagram permalink (post/reel/tv)
function extractShortcode(url) {
  if (!url) return null;
  const m = url.match(/instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { content_url } = await req.json();
    if (!content_url) return Response.json({ error: '콘텐츠 링크가 필요합니다.' }, { status: 400 });

    const shortcode = extractShortcode(content_url);
    if (!shortcode) {
      return Response.json({ error: '인스타그램 게시물/릴스 링크 형식이 아닙니다.' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('instagram');

    // 1) Get the connected business account's user id
    const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
    const me = await meRes.json();
    if (!me.id) {
      return Response.json({ error: '인스타그램 계정 정보를 가져오지 못했습니다.', detail: me }, { status: 400 });
    }

    // 2) List the account's media and find the one matching the shortcode via permalink
    let media = null;
    let nextUrl = `https://graph.instagram.com/${me.id}/media?fields=id,permalink,media_type,caption,timestamp&limit=50&access_token=${accessToken}`;
    let pages = 0;
    while (nextUrl && pages < 10) {
      const listRes = await fetch(nextUrl);
      const list = await listRes.json();
      if (list.error) {
        return Response.json({ error: '미디어 목록 조회 실패', detail: list.error }, { status: 400 });
      }
      const found = (list.data || []).find((item) => (item.permalink || '').includes(`/${shortcode}`));
      if (found) { media = found; break; }
      nextUrl = list.paging?.next || null;
      pages++;
    }

    if (!media) {
      return Response.json({
        error: '연결된 계정에서 해당 게시물을 찾지 못했습니다. 회사 공식 계정이 올린 게시물만 지표를 가져올 수 있습니다.',
      }, { status: 404 });
    }

    // 3) Fetch base engagement fields
    const fieldsRes = await fetch(`https://graph.instagram.com/${media.id}?fields=like_count,comments_count,media_type,media_product_type,permalink&access_token=${accessToken}`);
    const fields = await fieldsRes.json();

    // 4) Fetch insights (views/reach/saved/shares). Available metrics vary by media type.
    const insightMetrics = ['reach', 'saved', 'shares', 'views', 'total_interactions'];
    const insightsRes = await fetch(`https://graph.instagram.com/${media.id}/insights?metric=${insightMetrics.join(',')}&access_token=${accessToken}`);
    const insights = await insightsRes.json();

    const metricMap = {};
    if (Array.isArray(insights.data)) {
      for (const item of insights.data) {
        metricMap[item.name] = item.values?.[0]?.value ?? 0;
      }
    }

    const result = {
      likes: fields.like_count ?? 0,
      comments: fields.comments_count ?? 0,
      views: metricMap.views ?? 0,
      reach: metricMap.reach ?? 0,
      saves: metricMap.saved ?? 0,
      shares: metricMap.shares ?? 0,
      total_interactions: metricMap.total_interactions ?? 0,
      permalink: fields.permalink || media.permalink,
      media_type: fields.media_type || media.media_type,
      fetched_at: new Date().toISOString(),
    };

    return Response.json({ success: true, metrics: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let limit = 24;
    try {
      const body = await req.json();
      if (body?.limit) limit = Math.min(Number(body.limit), 50);
    } catch { /* no body */ }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('instagram');

    // 1) Connected account id
    const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
    const me = await meRes.json();
    if (!me.id) {
      return Response.json({ error: '인스타그램 계정 정보를 가져오지 못했습니다.', detail: me }, { status: 400 });
    }

    // 2) Fetch the account's own media (posts I uploaded)
    const listRes = await fetch(
      `https://graph.instagram.com/${me.id}/media?fields=id,permalink,media_type,media_product_type,caption,timestamp,thumbnail_url,media_url,like_count,comments_count&limit=${limit}&access_token=${accessToken}`
    );
    const list = await listRes.json();
    if (list.error) {
      return Response.json({ error: '미디어 목록 조회 실패', detail: list.error }, { status: 400 });
    }

    // 3) For each post, pull insights (reach/saved/shares/views)
    const posts = [];
    let insightError = null;
    for (const item of (list.data || [])) {
      let reach = 0, saves = 0, shares = 0, views = 0;
      try {
        const insRes = await fetch(
          `https://graph.instagram.com/${item.id}/insights?metric=reach,saved,shares,views&access_token=${accessToken}`
        );
        const ins = await insRes.json();
        if (ins.error && !insightError) insightError = ins.error;
        if (Array.isArray(ins.data)) {
          for (const m of ins.data) {
            const v = m.values?.[0]?.value ?? 0;
            if (m.name === 'reach') reach = v;
            else if (m.name === 'saved') saves = v;
            else if (m.name === 'shares') shares = v;
            else if (m.name === 'views') views = v;
          }
        }
      } catch { /* insights not available for this media type */ }

      posts.push({
        id: item.id,
        permalink: item.permalink,
        media_type: item.media_type,
        media_product_type: item.media_product_type,
        caption: item.caption || '',
        timestamp: item.timestamp,
        thumbnail: item.thumbnail_url || item.media_url || '',
        likes: item.like_count ?? 0,
        comments: item.comments_count ?? 0,
        reach,
        saves,
        shares,
        views,
      });
    }

    return Response.json({
      success: true,
      username: me.username,
      fetched_at: new Date().toISOString(),
      insight_error: insightError,
      posts,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
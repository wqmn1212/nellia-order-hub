import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { review_id, content } = await req.json();
    if (!content) return Response.json({ error: 'no content' }, { status: 400 });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `다음은 헤어 드라이기 제품에 대한 고객 후기입니다. 감정을 분석하고 핵심 키워드를 3개 이내로 추출하세요.\n\n후기: "${content}"`,
      response_json_schema: {
        type: "object",
        properties: {
          sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
          keywords: { type: "array", items: { type: "string" } }
        },
        required: ["sentiment", "keywords"]
      }
    });

    if (review_id) {
      await base44.asServiceRole.entities.CustomerReview.update(review_id, {
        sentiment: result.sentiment,
        keywords: result.keywords,
      });
    }

    return Response.json({ success: true, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// 스케줄 실행 전용: 사용자 세션 없이 서비스 권한으로 하위 수집 함수를 호출
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const results = {};

    try {
      const coupang = await base44.asServiceRole.functions.invoke("syncCoupangAds", {});
      results.coupang = coupang.data || coupang;
    } catch (e) {
      results.coupang = { error: e.message };
    }

    try {
      const naver = await base44.asServiceRole.functions.invoke("syncNaverAds", {});
      results.naver = naver.data || naver;
    } catch (e) {
      results.naver = { error: e.message };
    }

    const success = Object.values(results).every((r) => r && !r.error);
    return Response.json({ success, results, syncedAt: new Date().toISOString() }, { status: success ? 200 : 502 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
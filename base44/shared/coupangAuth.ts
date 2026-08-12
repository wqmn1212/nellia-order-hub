// 쿠팡 Open API CEA HMAC-SHA256 인증 헤더 생성 (광고/주문 함수 공용)

export async function buildCoupangAuth(method, path, query, accessKey, secretKey) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${String(now.getUTCFullYear()).slice(2)}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const message = stamp + method + path + (query || "");

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const signature = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");

  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${stamp}, signature=${signature}`;
}
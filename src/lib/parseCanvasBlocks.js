// AI 답변에서 canvas 코드펜스를 분리합니다.
// 반환: { text, canvas } — canvas: { title, type, content } | null
// 파싱 실패 시 예외를 던지지 않고 원본을 그대로 반환합니다.

const VALID_TYPES = ["table", "document", "list"];

function parseAttrs(attrLine) {
  const title = /title\s*=\s*"([^"]*)"/.exec(attrLine)?.[1]?.trim();
  const type = /type\s*=\s*"([^"]*)"/.exec(attrLine)?.[1]?.trim();
  return {
    title: title || "산출물",
    type: VALID_TYPES.includes(type) ? type : "document",
  };
}

export function parseCanvasBlocks(content) {
  if (typeof content !== "string" || !content.includes("canvas")) {
    return { text: content, canvas: null };
  }

  try {
    const lines = content.split("\n");
    let start = -1;
    let fenceLen = 0;
    let attrLine = "";

    for (let i = 0; i < lines.length; i++) {
      const m = /^(`{3,})canvas\b(.*)$/.exec(lines[i].trim());
      if (m) {
        start = i;
        fenceLen = m[1].length;
        attrLine = m[2] || "";
        break;
      }
    }
    if (start === -1) return { text: content, canvas: null };

    // 중첩 코드펜스를 고려해 닫는 펜스를 찾습니다.
    let depth = 0;
    let end = -1;
    for (let i = start + 1; i < lines.length; i++) {
      const t = lines[i].trim();
      const fence = /^(`{3,})(.*)$/.exec(t);
      if (!fence) continue;
      const len = fence[1].length;
      const hasInfo = fence[2].trim().length > 0;

      if (depth === 0 && !hasInfo && len >= fenceLen) {
        end = i;
        break;
      }
      if (hasInfo) depth++;
      else if (depth > 0) depth--;
    }

    const body = (end === -1 ? lines.slice(start + 1) : lines.slice(start + 1, end)).join("\n").trim();
    if (!body) return { text: content, canvas: null };

    const rest = end === -1 ? [] : lines.slice(end + 1);
    const text = [...lines.slice(0, start), ...rest].join("\n").trim();

    return { text, canvas: { ...parseAttrs(attrLine), content: body } };
  } catch {
    return { text: content, canvas: null };
  }
}
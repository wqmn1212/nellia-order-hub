import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const safeName = (name) => (name || "canvas").replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);

// 마크다운 표 → 2차원 배열
export function parseMarkdownTable(content) {
  const rows = String(content || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|"))
    .filter((l) => !/^\|[\s:|-]+\|?$/.test(l))
    .map((l) =>
      l
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim())
    );
  return rows;
}

export function isNumericCell(value) {
  const v = String(value || "").trim();
  if (!v) return false;
  return /^[₩$]?\s*-?[\d,]+(\.\d+)?\s*%?$/.test(v);
}

export function downloadMarkdown(title, content) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName(title)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadXlsx(title, content) {
  const rows = parseMarkdownTable(content);
  if (!rows.length) return false;
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${safeName(title)}.xlsx`);
  return true;
}

// 한글 렌더링을 위해 DOM을 이미지화한 뒤 PDF에 삽입합니다.
export async function downloadPdf(title, element) {
  if (!element) return false;
  const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff" });
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pageW) / canvas.width;
  const img = canvas.toDataURL("image/png");

  let remaining = imgH;
  let offset = 0;
  while (remaining > 0) {
    pdf.addImage(img, "PNG", 0, -offset, pageW, imgH);
    remaining -= pageH;
    offset += pageH;
    if (remaining > 0) pdf.addPage();
  }
  pdf.save(`${safeName(title)}.pdf`);
  return true;
}
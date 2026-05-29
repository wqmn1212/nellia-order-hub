import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, Copy, CheckCheck } from "lucide-react";

export default function RfqGenerator({ project, onRfqSaved }) {
  const [specs, setSpecs] = useState(project?.specs || "");
  const [loading, setLoading] = useState(false);
  const [rfq, setRfq] = useState(project?.rfq_content || "");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!specs.trim()) return;
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional OEM/ODM sourcing expert. Generate a standard English RFQ (Request for Quotation) document for a manufacturer in China (Alibaba format).

Product: ${project?.product_name || "Hardware Product"}
Specifications: ${specs}

Include:
1. Company Introduction (placeholder)
2. Product Description & Purpose
3. Technical Specifications (from the specs provided)
4. Required Quantity (MOQ & target qty: ${project?.target_qty || "TBD"})
5. Quality Requirements (QC inspection, certifications needed)
6. Sample Requirements (T1 sample, timeline)
7. Packaging Requirements
8. Payment Terms Request
9. Contact Information (placeholder)

Format it professionally with clear sections. Be specific and technical.`,
    });
    setRfq(result);
    setLoading(false);
    if (onRfqSaved) onRfqSaved(result, specs);
  };

  const copy = () => {
    navigator.clipboard.writeText(rfq);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-1.5 block">제품 사양 입력</Label>
        <Textarea
          value={specs}
          onChange={(e) => setSpecs(e.target.value)}
          placeholder="예: 실리콘 일체형 헤어 빗, 와이드 피치 8mm, 대전방지 코팅, ABS 소재, 길이 22cm, 무게 80g 이하, 패키징 개별 OPP 봉투..."
          rows={4}
          className="text-sm"
        />
      </div>
      <Button onClick={generate} disabled={loading || !specs.trim()} className="w-full gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
        영문 RFQ 자동 생성
      </Button>

      {rfq && (
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">생성된 RFQ</span>
            <Button variant="ghost" size="sm" onClick={copy} className="gap-1 text-xs">
              {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "복사됨" : "복사"}
            </Button>
          </div>
          <Textarea value={rfq} readOnly rows={14} className="text-xs font-mono bg-muted/30" />
        </div>
      )}
    </div>
  );
}
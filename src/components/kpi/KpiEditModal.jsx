import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function KpiEditModal({ kpi, open, onClose, onSave, isSaving }) {
  const [val, setVal] = useState(kpi?.current_value ?? 0);

  const handleSave = () => onSave(kpi.id, Number(val));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{kpi?.metric_name} 업데이트</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>현재 달성 값 ({kpi?.unit || ""})</Label>
            <Input
              type="number"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              autoFocus
            />
          </div>
          <div className="text-sm text-muted-foreground">
            목표: {kpi?.target_value?.toLocaleString()}{kpi?.unit}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>취소</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
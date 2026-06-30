import React, { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddChannelDialog({ open, onOpenChange, onAdded }) {
  const [label, setLabel] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (name) => {
      // 영문/숫자 기반 키 생성, 한글 등은 타임스탬프로 고유화
      let key = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
      if (!key) key = `channel_${Date.now()}`;
      return base44.entities.Channel.create({ key, label: name.trim() });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      onAdded?.(created.key);
      setLabel("");
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    mutation.mutate(label);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif">새 채널 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">채널 이름</Label>
            <Input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="예: 11번가, 오늘의집"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
            <Button type="submit" disabled={mutation.isPending || !label.trim()}>
              {mutation.isPending ? "추가 중..." : "추가"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
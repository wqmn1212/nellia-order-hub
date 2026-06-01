import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Save } from "lucide-react";

export default function ChannelTable({ channels, logistics }) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const log = logistics || {};
  const [box, setBox] = useState(log.box_cost_krw ?? 0);
  const [delivery, setDelivery] = useState(log.delivery_fee_krw ?? 0);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["sales-channels"] });
    queryClient.invalidateQueries({ queryKey: ["logistics-cost"] });
  };

  const addChannel = useMutation({
    mutationFn: (name) => base44.entities.SalesChannel.create({ channel_name: name, commission_rate: 0 }),
    onSuccess: () => { invalidate(); setNewName(""); },
  });
  const updateChannel = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SalesChannel.update(id, data),
    onSuccess: invalidate,
  });
  const deleteChannel = useMutation({
    mutationFn: (id) => base44.entities.SalesChannel.delete(id),
    onSuccess: invalidate,
  });
  const saveLogistics = useMutation({
    mutationFn: () => {
      const data = { label: "기본 출고 비용", box_cost_krw: Number(box) || 0, delivery_fee_krw: Number(delivery) || 0 };
      return log.id
        ? base44.entities.LogisticsCost.update(log.id, data)
        : base44.entities.LogisticsCost.create(data);
    },
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-5">
      {/* 출고 비용 */}
      <Card className="p-4 space-y-3">
        <h4 className="text-sm font-semibold">건별 출고 비용</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">박스/포장비 (₩)</Label>
            <Input type="number" value={box} onChange={(e) => setBox(e.target.value)} className="text-sm mt-1" />
          </div>
          <div>
            <Label className="text-xs">택배 발송비 (₩)</Label>
            <Input type="number" value={delivery} onChange={(e) => setDelivery(e.target.value)} className="text-sm mt-1" />
          </div>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => saveLogistics.mutate()} disabled={saveLogistics.isPending}>
          <Save className="w-3.5 h-3.5" /> 저장
        </Button>
      </Card>

      {/* 채널 관리 */}
      <Card className="p-4 space-y-3">
        <h4 className="text-sm font-semibold">판매 채널 관리</h4>
        <div className="space-y-2">
          {channels.map((ch) => (
            <div key={ch.id} className="flex items-center gap-2">
              <span className="flex-1 text-sm font-medium">{ch.channel_name}</span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  defaultValue={ch.commission_rate ?? 0}
                  onBlur={(e) => updateChannel.mutate({ id: ch.id, data: { commission_rate: Number(e.target.value) || 0 } })}
                  className="w-20 h-8 text-sm text-right"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              <Input
                defaultValue={ch.settlement_period || ""}
                placeholder="D+14"
                onBlur={(e) => updateChannel.mutate({ id: ch.id, data: { settlement_period: e.target.value } })}
                className="w-20 h-8 text-xs"
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteChannel.mutate(ch.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="새 채널명" className="text-sm" />
          <Button size="sm" className="gap-1.5" onClick={() => newName && addChannel.mutate(newName)} disabled={!newName}>
            <Plus className="w-4 h-4" /> 추가
          </Button>
        </div>
      </Card>
    </div>
  );
}
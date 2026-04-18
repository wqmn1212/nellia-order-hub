import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { COURIERS } from "@/components/shared/constants";

export default function TrackingInput({ order, onSave }) {
  const [courier, setCourier] = useState(order.courier || "");
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(order.id, { courier, tracking_number: trackingNumber });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="flex gap-2 items-center">
      <Select value={courier} onValueChange={setCourier}>
        <SelectTrigger className="h-9 w-32 text-xs">
          <SelectValue placeholder="택배사" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(COURIERS).map(([k, l]) => (
            <SelectItem key={k} value={k}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        className="h-9 flex-1 text-xs font-mono"
        placeholder="송장번호"
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
      />
      <Button
        size="sm"
        onClick={handleSave}
        disabled={saving}
        variant={saved ? "default" : "outline"}
        className="h-9 w-16"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : "저장"}
      </Button>
    </div>
  );
}
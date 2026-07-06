import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUSES, COURIERS } from "@/components/shared/constants";
import { useChannels } from "@/components/shared/useChannels";
import { X } from "lucide-react";

const triggerClass = "w-36 h-9 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground";

export default function BulkActions({ selectedCount, onStatusChange, onCourierChange, onChannelChange, onPriceChange, onDelete, onClear }) {
  const { channels } = useChannels();
  const [price, setPrice] = useState("");

  const applyPrice = () => {
    const n = Number(price);
    if (price === "" || isNaN(n)) return;
    onPriceChange(n);
    setPrice("");
  };

  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-4 z-20 mb-4 bg-primary text-primary-foreground rounded-xl px-5 py-3 shadow-lg flex items-center gap-3 flex-wrap">
      <span className="text-sm font-medium">
        <span className="font-serif text-lg">{selectedCount}</span>건 선택됨
      </span>
      <div className="flex-1" />

      <Select onValueChange={onStatusChange}>
        <SelectTrigger className={triggerClass}>
          <SelectValue placeholder="상태 변경" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(STATUSES).map(([k, s]) => (
            <SelectItem key={k} value={k}>{s.label}로 변경</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={onCourierChange}>
        <SelectTrigger className={triggerClass}>
          <SelectValue placeholder="택배사 변경" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(COURIERS).map(([k, label]) => (
            <SelectItem key={k} value={k}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={onChannelChange}>
        <SelectTrigger className={triggerClass}>
          <SelectValue placeholder="채널 변경" />
        </SelectTrigger>
        <SelectContent>
          {channels.map((c) => (
            <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyPrice()}
          placeholder="금액 입력"
          className="w-28 h-9 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
        />
        <Button
          size="sm"
          onClick={applyPrice}
          className="h-9 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
        >
          적용
        </Button>
      </div>

      <Button variant="destructive" size="sm" onClick={onDelete} className="h-9">
        삭제
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClear}
        className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/10"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUSES } from "@/components/shared/constants";
import { X } from "lucide-react";

export default function BulkActions({ selectedCount, onStatusChange, onDelete, onClear }) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-4 z-20 mb-4 bg-primary text-primary-foreground rounded-xl px-5 py-3 shadow-lg flex items-center gap-4 flex-wrap">
      <span className="text-sm font-medium">
        <span className="font-serif text-lg">{selectedCount}</span>건 선택됨
      </span>
      <div className="flex-1" />
      <Select onValueChange={onStatusChange}>
        <SelectTrigger className="w-40 h-9 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
          <SelectValue placeholder="상태 변경" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(STATUSES).map(([k, s]) => (
            <SelectItem key={k} value={k}>{s.label}로 변경</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        className="h-9"
      >
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
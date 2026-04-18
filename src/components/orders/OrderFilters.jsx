import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { CHANNELS, STATUSES } from "@/components/shared/constants";

export default function OrderFilters({ filters, setFilters }) {
  return (
    <div className="flex flex-col md:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="주문번호, 고객명, 상품명으로 검색"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="pl-10 h-11 bg-card border-border"
        />
      </div>
      <Select value={filters.channel} onValueChange={(v) => setFilters({ ...filters, channel: v })}>
        <SelectTrigger className="w-full md:w-48 h-11 bg-card">
          <SelectValue placeholder="채널" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 채널</SelectItem>
          {Object.entries(CHANNELS).map(([key, c]) => (
            <SelectItem key={key} value={key}>{c.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
        <SelectTrigger className="w-full md:w-40 h-11 bg-card">
          <SelectValue placeholder="상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 상태</SelectItem>
          {Object.entries(STATUSES).map(([key, s]) => (
            <SelectItem key={key} value={key}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
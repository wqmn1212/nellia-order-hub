import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2 } from "lucide-react";

export default function UnmatchedProductRow({ item, products, onLink, isLinking }) {
  const [productId, setProductId] = useState("");

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground">미반영 {item.count}건</p>
      </div>
      <Select value={productId} onValueChange={setProductId}>
        <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="연결할 제품 선택" /></SelectTrigger>
        <SelectContent>
          {products.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        disabled={!productId || isLinking}
        onClick={() => onLink(item.name, productId)}
      >
        <Link2 className="mr-1 h-3.5 w-3.5" /> 연결
      </Button>
    </div>
  );
}
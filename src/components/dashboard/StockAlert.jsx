import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Bell, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function StockAlert() {
  const [dismissed, setDismissed] = useState([]);
  const [notifying, setNotifying] = useState(null);
  const [notified, setNotified] = useState([]);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("-created_date", 100),
    initialData: [],
    refetchInterval: 60000, // 1분마다 자동 갱신
  });

  const lowStockProducts = products.filter((p) => {
    if (p.is_active === false) return false;
    if (p.stock_quantity == null) return false;
    const threshold = p.stock_alert_threshold ?? 10;
    return p.stock_quantity <= threshold && !dismissed.includes(p.id);
  });

  if (lowStockProducts.length === 0) return null;

  const handleNotify = async (product) => {
    setNotifying(product.id);
    await base44.integrations.Core.InvokeLLM({
      prompt: `넬리아 CRM 알림: 제품 "${product.name}" (모델: ${product.model_number || "-"})의 재고가 ${product.stock_quantity}개로 기준치(${product.stock_alert_threshold ?? 10}개) 이하로 내려갔습니다. 운영팀에서 즉시 재고를 확인하고 발주를 검토해주세요.`,
    });
    setNotified((prev) => [...prev, product.id]);
    setNotifying(null);
  };

  return (
    <Card className="border-red-200 bg-red-50 shadow-sm mb-6 overflow-hidden">
      <div className="px-5 py-4 border-b border-red-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <p className="text-sm font-semibold text-red-800">
            재고 부족 알림 · {lowStockProducts.length}개 제품
          </p>
        </div>
        <Link to="/products" className="text-xs text-red-600 hover:underline font-medium">
          제품 DB 바로가기 →
        </Link>
      </div>

      <div className="divide-y divide-red-100">
        {lowStockProducts.map((product) => (
          <div key={product.id} className="flex items-center justify-between px-5 py-3 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-9 h-9 rounded-lg object-cover border border-red-200 flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center flex-shrink-0 text-red-400 text-xs font-bold">
                  {product.name[0]}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-red-900 truncate">{product.name}</p>
                <p className="text-xs text-red-600">
                  현재 재고: <strong>{product.stock_quantity}개</strong> / 기준: {product.stock_alert_threshold ?? 10}개
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {notified.includes(product.id) ? (
                <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 알림 전송됨
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-100"
                  onClick={() => handleNotify(product)}
                  disabled={notifying === product.id}
                >
                  {notifying === product.id ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Bell className="w-3 h-3 mr-1" />
                  )}
                  운영팀 알림
                </Button>
              )}
              <button
                onClick={() => setDismissed((prev) => [...prev, product.id])}
                className="text-red-400 hover:text-red-600 transition-colors p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
export const calculateGroupBuy = (item) => {
  const price = Number(item.sale_price) || 0;
  const cost = Number(item.unit_cost) || 0;
  const rate = Number(item.commission_rate) || 0;
  const shipping = Number(item.shipping_fee) || 0;
  const quantity = Number(item.sold_quantity) || 0;
  const commission = price * (rate / 100);
  const vat = price / 11;
  const unitProfit = price - cost - commission - shipping - vat;

  return {
    commission,
    vat,
    unitProfit,
    marginRate: price ? (unitProfit / price) * 100 : 0,
    revenue: price * quantity,
    totalProfit: unitProfit * quantity,
  };
};

export const formatWon = (value) => `${Math.round(value || 0).toLocaleString("ko-KR")}원`;
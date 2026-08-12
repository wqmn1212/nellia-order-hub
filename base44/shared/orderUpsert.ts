// 주문 멱등 저장 + ApiConfig 동기화 상태 갱신 (채널 수집 함수 공용)

// product_order_number 기준으로 있으면 update, 없으면 create (유입 경로 무관 중복 방지)
export async function upsertOrders(svc, orders) {
  let created = 0;
  let updated = 0;
  for (const order of orders) {
    const key = order.product_order_number;
    const existing = key
      ? await svc.Order.filter({ product_order_number: key })
      : [];
    if (existing.length > 0) {
      await svc.Order.update(existing[0].id, order);
      updated++;
    } else {
      await svc.Order.create(order);
      created++;
    }
  }
  return { created, updated };
}

export async function updateApiConfig(svc, channel, patch) {
  const configs = await svc.ApiConfig.filter({ channel });
  if (configs.length > 0) {
    await svc.ApiConfig.update(configs[0].id, patch);
  } else {
    await svc.ApiConfig.create({ channel, is_active: true, ...patch });
  }
}
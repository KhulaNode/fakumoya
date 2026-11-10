import { assembleOperations, operationsPreview, saDay } from "../fakumoya-operations"

describe("Fakumoya operations", () => {
  const now = new Date("2026-11-10T23:00:00Z")

  it("uses the South African day boundary", () => {
    expect(saDay(now)).toEqual({
      date: "2026-11-11",
      start: new Date("2026-11-10T22:00:00Z"),
      end: new Date("2026-11-11T22:00:00Z"),
    })
  })

  it("keeps captured, projected, reported, and settled amounts separate", () => {
    const result = assembleOperations({
      now,
      todayOrders: [
        { id: "paid", display_id: 1, created_at: now, status: "pending", payment_status: "captured", fulfillment_status: "not_fulfilled", total: 156, currency_code: "zar", items: [{ quantity: 3, unit_price: 22, item: { product_id: "bread" } }, { quantity: 1, unit_price: 90, item: { product_id: "other" } }] },
        { id: "unpaid", display_id: 2, created_at: now, status: "pending", payment_status: "awaiting", fulfillment_status: "not_fulfilled", total: 44, currency_code: "zar", items: [{ quantity: 2, unit_price: 22, item: { product_id: "bread" } }] },
      ],
      recentOrders: [],
      productMetadata: { bread: { fakumoya_revenue_type: "bread" }, other: {} },
      subscriptions: [{ id: "plan", email: "sample@example.invalid", status: "active", loaves_per_month: 24, deliveries_per_month: 12, khulanode_share_cents: 7200 }],
      invoices: [{ status: "paid", khulanode_share_cents: 7200, metadata: { paystack_event: "charge.success" } }],
    })
    expect(result.production).toEqual({ bread_loaves_today: 3, subscription_loaves_per_month: 24, subscription_deliveries_per_month: 12 })
    expect(result.sales).toEqual({ captured_cents_today: 15600, reported_subscription_invoices: 1 })
    expect(result.commission).toEqual({ earned_cents: 1800, projected_cents: 7800, settled_cents: null })
  })

  it("marks the complete sample response as a preview", () => {
    expect(operationsPreview(now).preview).toBe(true)
    expect(operationsPreview(now).orders.every((order) => order.display_id.startsWith("SAMPLE-"))).toBe(true)
  })

  it("does not schedule already fulfilled bread or treat unverified invoices as settlement", () => {
    const result = assembleOperations({
      now,
      todayOrders: [{ id: "done", display_id: 3, created_at: now, payment_status: "captured", fulfillment_status: "fulfilled", currency_code: "zar", total: 22, items: [{ quantity: 1, unit_price: 22, item: { product_id: "bread" } }] }],
      recentOrders: [],
      productMetadata: { bread: { fakumoya_revenue_type: "bread" } },
      subscriptions: [],
      invoices: [{ status: "paid", khulanode_share_cents: 7200, metadata: { settled_at: "2026-11-11", settlement_reference: "sample" } }],
    })
    expect(result.production.bread_loaves_today).toBe(0)
    expect(result.commission).toEqual({ projected_cents: 0, earned_cents: 300, settled_cents: 7200 })
  })
})

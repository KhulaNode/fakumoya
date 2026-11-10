import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { FAKUMOYA_SUBSCRIPTION_MODULE } from "../../../../modules/fakumoya-subscription"

const breadShareCents = 300
const otherProductRate = 0.1

const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0
// Medusa monetary fields are already stored in the currency's minor unit.
const money = (value: unknown) => Math.round(number(value))

function isBread(item: any) {
  return item?.variant?.product?.metadata?.fakumoya_revenue_type === "bread" ||
    item?.product?.metadata?.fakumoya_revenue_type === "bread" ||
    /bread|loaf|borotho/i.test(String(item?.title || ""))
}

function commissionForItem(item: any) {
  const quantity = Math.max(0, number(item?.quantity))
  const lineValue = money(item?.unit_price) * quantity
  return isBread(item) ? Math.round(quantity * breadShareCents) : Math.round(lineValue * otherProductRate)
}

function dateRange(date = new Date()) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

function testOrders() {
  return [
    {
      id: "test-order-001",
      display_id: "TEST-1001",
      created_at: new Date().toISOString(),
      payment_status: "awaiting_webhook",
      fulfillment_status: "not_fulfilled",
      total_cents: 18600,
      currency_code: "zar",
      bread_loaves: 3,
      commission_cents: 900,
      commission_state: "projected",
      source: "test",
    },
    {
      id: "test-order-002",
      display_id: "TEST-1002",
      created_at: new Date().toISOString(),
      payment_status: "paid_test_only",
      fulfillment_status: "fulfilled",
      total_cents: 25000,
      currency_code: "zar",
      bread_loaves: 0,
      commission_cents: 2500,
      commission_state: "earned_test_only",
      source: "test",
    },
  ]
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { start, end } = dateRange()
  const includeTest = String(req.query?.test_data || "false") === "true"
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id", "display_id", "created_at", "payment_status", "fulfillment_status",
      "total", "currency_code", "items.quantity", "items.unit_price", "items.title",
      "items.variant.product.metadata", "items.product.metadata",
    ],
    filters: { created_at: { $gte: start, $lt: end } },
  })

  const orderRows = (orders as any[]).map((order) => {
    const items = order.items || []
    const breadLoaves = items.reduce((sum, item) => sum + (isBread(item) ? number(item.quantity) : 0), 0)
    const commission = items.reduce((sum, item) => sum + commissionForItem(item), 0)
    const earned = ["captured", "paid", "partially_refunded"].includes(String(order.payment_status))
    return {
      id: order.id,
      display_id: order.display_id,
      created_at: order.created_at,
      payment_status: order.payment_status || "unknown",
      fulfillment_status: order.fulfillment_status || "not_fulfilled",
      total_cents: money(order.total),
      currency_code: order.currency_code || "zar",
      bread_loaves: breadLoaves,
      commission_cents: commission,
      commission_state: earned ? "earned" : "projected",
      source: "medusa",
    }
  })

  let subscriptions: any[] = []
  let invoices: any[] = []
  try {
    const subscriptionService = req.scope.resolve(FAKUMOYA_SUBSCRIPTION_MODULE) as any
    subscriptions = await subscriptionService.listFakumoyaSubscriptions({})
    invoices = await subscriptionService.listFakumoyaSubscriptionInvoices({})
  } catch {
    // The dashboard remains usable while the Phase 3 subscription module is
    // awaiting its production migration or Paystack verification.
  }

  const subscriptionDemand = subscriptions.reduce((sum, subscription) => {
    return sum + (["pending", "active", "past_due", "canceling"].includes(subscription.status) ? number(subscription.loaves_per_month || 24) : 0)
  }, 0)
  const earnedInvoices = invoices.filter((invoice) => invoice.status === "paid")
  const earnedCommissionCents = earnedInvoices.reduce((sum, invoice) => sum + number(invoice.khulanode_share_cents), 0)
  const settledCommissionCents = earnedInvoices.filter((invoice) => invoice.metadata?.settled_at).reduce((sum, invoice) => sum + number(invoice.khulanode_share_cents), 0)
  const projectedCommissionCents = orderRows.reduce((sum, order) => sum + number(order.commission_cents), 0) +
    subscriptions.filter((subscription) => ["pending", "active", "past_due"].includes(subscription.status)).reduce((sum, subscription) => sum + number(subscription.khulanode_share_cents || 7200), 0)

  res.json({
    date: start.toISOString().slice(0, 10),
    orders: includeTest ? [...orderRows, ...testOrders()] : orderRows,
    subscriptions: subscriptions.map((subscription) => ({
      id: subscription.id,
      name: [subscription.first_name, subscription.last_name].filter(Boolean).join(" ") || subscription.email,
      status: subscription.status,
      loaves_per_month: number(subscription.loaves_per_month || 24),
      deliveries_per_month: number(subscription.deliveries_per_month || 12),
      monthly_amount_cents: number(subscription.monthly_amount_cents || 62000),
      payment_state: subscription.status === "active" ? "verified" : "awaiting_verification",
    })),
    fulfilments: orderRows.filter((order) => order.fulfillment_status !== "fulfilled").map((order) => ({
      id: order.id,
      display_id: order.display_id,
      status: order.fulfillment_status,
      bread_loaves: order.bread_loaves,
    })),
    production: {
      bread_loaves_today: orderRows.reduce((sum, order) => sum + order.bread_loaves, 0),
      subscription_loaves_upcoming: subscriptionDemand,
      total_loaves: orderRows.reduce((sum, order) => sum + order.bread_loaves, 0) + subscriptionDemand,
    },
    commission: {
      projected_cents: projectedCommissionCents,
      earned_cents: earnedCommissionCents,
      settled_cents: settledCommissionCents,
      note: "Projected is based on order demand; earned requires a captured payment; settled requires an explicit settlement record.",
    },
  })
}

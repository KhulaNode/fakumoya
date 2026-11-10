import { calculateKhulaNodeShare } from "./paystack-revenue-share"

export type OrderInput = {
  id: string
  display_id: number | string
  created_at: string | Date
  status?: string | null
  payment_status?: string | null
  fulfillment_status?: string | null
  currency_code?: string | null
  total?: unknown
  items?: Array<{
    quantity?: unknown
    unit_price?: unknown
    item?: { product_id?: string | null; metadata?: Record<string, unknown> | null }
  }>
}

export type SubscriptionInput = {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  status: string
  loaves_per_month?: number | null
  deliveries_per_month?: number | null
  khulanode_share_cents?: number | null
}

export type InvoiceInput = {
  status: string
  khulanode_share_cents?: number | null
  paid_at?: string | Date | null
  metadata?: Record<string, unknown> | null
}

const cents = (majorUnits: unknown) => Math.round(Number(majorUnits || 0) * 100)
const count = (value: unknown) => Math.max(0, Number(value || 0))
const settled = (invoice: InvoiceInput) =>
  invoice.status === "paid" && Boolean(invoice.metadata?.settled_at && invoice.metadata?.settlement_reference)

export function saDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now)
  const part = (type: string) => parts.find((item) => item.type === type)?.value
  const date = `${part("year")}-${part("month")}-${part("day")}`
  const start = new Date(`${date}T00:00:00+02:00`)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { date, start, end }
}

export function assembleOperations(input: {
  todayOrders: OrderInput[]
  recentOrders: OrderInput[]
  productMetadata: Record<string, Record<string, unknown> | null>
  subscriptions: SubscriptionInput[]
  invoices: InvoiceInput[]
  now?: Date
  preview?: boolean
}) {
  const { date, start, end } = saDay(input.now)
  const today = input.todayOrders.filter((order) => {
    const created = new Date(order.created_at).getTime()
    return created >= start.getTime() && created < end.getTime() && order.status !== "canceled"
  })
  const rows = today.map((order) => {
    const lines = (order.items || []).map((line) => ({
      quantity: line.quantity,
      unit_price: line.unit_price,
      product: {
        metadata: line.item?.product_id
          ? input.productMetadata[line.item.product_id] ?? line.item.metadata ?? null
          : line.item?.metadata ?? null,
      },
    }))
    const breadLoaves = lines.reduce((total, line) =>
      total + (line.product.metadata?.fakumoya_revenue_type === "bread" ? count(line.quantity) : 0), 0)
    const captured = order.payment_status === "captured"
    return {
      id: order.id,
      display_id: String(order.display_id),
      payment_status: order.payment_status || "unknown",
      fulfillment_status: order.fulfillment_status || "unknown",
      total_cents: cents(order.total),
      currency_code: order.currency_code || "",
      bread_loaves: breadLoaves,
      commission_cents: calculateKhulaNodeShare(lines),
      commission_state: captured ? "earned" : "projected",
    }
  })

  const activeSubscriptions = input.subscriptions.filter((subscription) =>
    ["active", "canceling"].includes(subscription.status))
  const reportedInvoices = input.invoices.filter((invoice) => invoice.status === "paid")
  const settledInvoices = reportedInvoices.filter(settled)
  const zarOrders = rows.filter((order) => order.currency_code.toLowerCase() === "zar")
  const capturedOrders = zarOrders.filter((order) => order.commission_state === "earned")
  const outstanding = input.recentOrders.filter((order) =>
    order.status !== "canceled" &&
    !["fulfilled", "delivered", "canceled"].includes(order.fulfillment_status || "") &&
    order.payment_status === "captured")

  return {
    date,
    preview: Boolean(input.preview),
    orders: rows,
    subscriptions: input.subscriptions.map((subscription) => ({
      id: subscription.id,
      name: [subscription.first_name, subscription.last_name].filter(Boolean).join(" ") || subscription.email,
      status: subscription.status,
      loaves_per_month: count(subscription.loaves_per_month),
      deliveries_per_month: count(subscription.deliveries_per_month),
    })),
    fulfilments: outstanding.map((order) => ({
      id: order.id,
      display_id: String(order.display_id),
      status: order.fulfillment_status || "not_fulfilled",
    })),
    production: {
      bread_loaves_today: capturedOrders.filter((order) =>
        !["fulfilled", "delivered", "canceled"].includes(order.fulfillment_status))
        .reduce((sum, order) => sum + order.bread_loaves, 0),
      subscription_loaves_per_month: activeSubscriptions.reduce((sum, subscription) => sum + count(subscription.loaves_per_month), 0),
      subscription_deliveries_per_month: activeSubscriptions.reduce((sum, subscription) => sum + count(subscription.deliveries_per_month), 0),
    },
    sales: {
      captured_cents_today: capturedOrders.reduce((sum, order) => sum + order.total_cents, 0),
      reported_subscription_invoices: reportedInvoices.length,
    },
    commission: {
      projected_cents: zarOrders.filter((order) => order.commission_state === "projected")
        .reduce((sum, order) => sum + order.commission_cents, 0) +
        activeSubscriptions.reduce((sum, subscription) => sum + count(subscription.khulanode_share_cents), 0),
      earned_cents: capturedOrders.reduce((sum, order) => sum + order.commission_cents, 0),
      settled_cents: settledInvoices.length
        ? settledInvoices.reduce((sum, invoice) => sum + count(invoice.khulanode_share_cents), 0)
        : null,
    },
  }
}

export function operationsPreview(now = new Date()) {
  return assembleOperations({
    now,
    preview: true,
    productMetadata: { "sample-bread": { fakumoya_revenue_type: "bread" }, "sample-other": {} },
    todayOrders: [
      { id: "preview-1", display_id: "SAMPLE-101", created_at: now, status: "pending", payment_status: "captured", fulfillment_status: "not_fulfilled", currency_code: "zar", total: 156, items: [{ quantity: 3, unit_price: 22, item: { product_id: "sample-bread" } }, { quantity: 1, unit_price: 90, item: { product_id: "sample-other" } }] },
      { id: "preview-2", display_id: "SAMPLE-102", created_at: now, status: "pending", payment_status: "awaiting", fulfillment_status: "not_fulfilled", currency_code: "zar", total: 44, items: [{ quantity: 2, unit_price: 22, item: { product_id: "sample-bread" } }] },
    ],
    recentOrders: [{ id: "preview-1", display_id: "SAMPLE-101", created_at: now, status: "pending", payment_status: "captured", fulfillment_status: "not_fulfilled" }],
    subscriptions: [{ id: "preview-sub", email: "sample@example.invalid", status: "active", loaves_per_month: 24, deliveries_per_month: 12, khulanode_share_cents: 7200 }],
    invoices: [],
  })
}

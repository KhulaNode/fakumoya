import crypto from "crypto"

export const PAYSTACK_BREAD_LOAF_SHARE_CENTS = 300
export const PAYSTACK_OTHER_PRODUCTS_RATE = 0.1
export const MONTHLY_BREAD_SUBSCRIPTION_CENTS = 62_000
export const MONTHLY_BREAD_SUBSCRIPTION_LOAVES = 24
export const MONTHLY_BREAD_SUBSCRIPTION_DELIVERIES = 12
export const MONTHLY_BREAD_SUBSCRIPTION_SHARE_CENTS =
  PAYSTACK_BREAD_LOAF_SHARE_CENTS * MONTHLY_BREAD_SUBSCRIPTION_LOAVES

type CartLine = {
  quantity?: unknown
  unit_price?: unknown
  product?: { metadata?: Record<string, unknown> | null } | null
}

export function calculateKhulaNodeShare(lines: CartLine[]) {
  return lines.reduce((total, line) => {
    const quantity = Math.max(0, Number(line.quantity) || 0)
    const lineAmountCents = Math.max(0, Math.round((Number(line.unit_price) || 0) * quantity * 100))
    const revenueType = line.product?.metadata?.fakumoya_revenue_type
    return total + (revenueType === "bread"
      ? quantity * PAYSTACK_BREAD_LOAF_SHARE_CENTS
      : Math.round(lineAmountCents * PAYSTACK_OTHER_PRODUCTS_RATE))
  }, 0)
}

export function signRevenueShare(input: {
  amount: number
  commission_cents: number
  secret: string
}) {
  const payload = Buffer.from(JSON.stringify({
    amount: input.amount,
    commission_cents: input.commission_cents,
    expires_at: Date.now() + 10 * 60 * 1000,
  })).toString("base64url")
  const signature = crypto.createHmac("sha256", input.secret).update(payload).digest("hex")
  return `${payload}.${signature}`
}

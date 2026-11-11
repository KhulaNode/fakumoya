import type { NextResponse } from "next/server"

export const PAYSTACK_PROVIDER_ID = "pp_paystack_paystack"
export const MEDUSA_CART_ID_COOKIE = "_medusa_cart_id"
export const MEDUSA_COMPLETED_ORDER_COOKIE = "_medusa_completed_order_id"
export const COMPLETED_ORDER_COOKIE_MAX_AGE = 60 * 15

type PaystackPayment = {
  provider_id?: string | null
  captured_at?: string | Date | null
}

type PaystackPaymentCollection = {
  payments?: PaystackPayment | PaystackPayment[] | null
}

export type PaystackPaymentOrder = {
  id: string
  payment_status?: string | null
  shipping_address?: { country_code?: string | null } | null
  payment_collections?:
    | PaystackPaymentCollection
    | PaystackPaymentCollection[]
    | null
}

const asArray = <T>(value: T | T[] | null | undefined): T[] =>
  value == null ? [] : Array.isArray(value) ? value : [value]

/**
 * Medusa normally returns payment_collections and payments as arrays. The
 * Cart -> Order graph can also be represented as a single linked object, so
 * normalize both forms before checking the captured Paystack payment.
 *
 * `payment_status` is a Store API presentation field, not a persisted Order
 * model field. A direct Graph Query can therefore omit it. `captured_at` on
 * the provider payment is the durable capture record written by Medusa's
 * payment workflow and is the only fallback accepted here.
 */
export const hasCapturedPaystackPayment = (order: PaystackPaymentOrder) => {
  const payments = asArray(order.payment_collections).flatMap((collection) =>
    asArray(collection.payments)
  )

  return payments.some(
    (payment) =>
      payment.provider_id === PAYSTACK_PROVIDER_ID &&
      (order.payment_status === "captured" || Boolean(payment.captured_at))
  )
}

export const isFailedPaymentStatus = (status?: string | null) =>
  ["canceled", "cancelled", "failed", "not_paid", "refunded"].includes(
    status || ""
  )

export type PaymentResolution<
  T extends PaystackPaymentOrder = PaystackPaymentOrder
> =
  | { status: "captured"; order: T }
  | { status: "processing"; reason: "order_pending" | "lookup_unavailable" }
  | { status: "failed"; reason: "payment_failed" }
  | {
      status: "error"
      reason: "missing_cart" | "order_not_confirmed" | "lookup_unavailable"
    }

type LookupOperation = "cart_order" | "completed_order"

type ResolvePaymentOptions<T extends PaystackPaymentOrder> = {
  cartId?: string
  completedOrderId?: string
  attempts: number
  lookupOrderByCartId: (cartId: string) => Promise<T | null>
  lookupOrderById: (orderId: string) => Promise<T | null>
  delay?: (milliseconds: number) => Promise<void>
  onLookupError?: (
    operation: LookupOperation,
    identifier: string,
    error: unknown
  ) => void | Promise<void>
  retryDelayMs?: number
}

/**
 * Resolves payment using server-side Medusa state only. A browser callback is
 * never treated as payment proof, and lookup failures remain distinguishable
 * from a valid response with no linked order.
 */
export async function resolvePaystackPayment<T extends PaystackPaymentOrder>({
  cartId,
  completedOrderId,
  attempts,
  lookupOrderByCartId,
  lookupOrderById,
  delay = async () => undefined,
  onLookupError,
  retryDelayMs = 750,
}: ResolvePaymentOptions<T>): Promise<PaymentResolution<T>> {
  if (cartId) {
    let lookupUnavailable = false
    const boundedAttempts = Math.max(1, Math.floor(attempts))

    for (let attempt = 0; attempt < boundedAttempts; attempt += 1) {
      let order: T | null = null

      try {
        order = await lookupOrderByCartId(cartId)
      } catch (error) {
        lookupUnavailable = true
        await onLookupError?.("cart_order", cartId, error)
      }

      if (order && hasCapturedPaystackPayment(order)) {
        return { status: "captured", order }
      }

      if (order && isFailedPaymentStatus(order.payment_status)) {
        return { status: "failed", reason: "payment_failed" }
      }

      if (attempt < boundedAttempts - 1) {
        await delay(retryDelayMs)
      }
    }

    return {
      status: "processing",
      reason: lookupUnavailable ? "lookup_unavailable" : "order_pending",
    }
  }

  if (!completedOrderId) {
    return { status: "error", reason: "missing_cart" }
  }

  let order: T | null = null
  try {
    order = await lookupOrderById(completedOrderId)
  } catch (error) {
    await onLookupError?.("completed_order", completedOrderId, error)
    return { status: "error", reason: "lookup_unavailable" }
  }

  if (!order) {
    return { status: "error", reason: "order_not_confirmed" }
  }

  if (hasCapturedPaystackPayment(order)) {
    return { status: "captured", order }
  }

  if (isFailedPaymentStatus(order.payment_status)) {
    return { status: "failed", reason: "payment_failed" }
  }

  return { status: "processing", reason: "order_pending" }
}

/** Applies completion cookies to the actual response returned by the route. */
export const setPaymentCompletionCookies = (
  response: NextResponse,
  orderId: string
) => {
  const secure = process.env.NODE_ENV === "production"

  response.cookies.set(MEDUSA_COMPLETED_ORDER_COOKIE, orderId, {
    maxAge: COMPLETED_ORDER_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
  })
  response.cookies.set(MEDUSA_CART_ID_COOKIE, "", {
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
  })

  return response
}

import {
  clearCartAfterOrder,
  retrieveOrderByCartId,
  retrieveOrderForPayment,
} from "@lib/data/cart"
import { getCartId, getCompletedOrderId } from "@lib/data/cookies"
import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

const PAYSTACK_PROVIDER_ID = "pp_paystack_paystack"
const SERVER_ATTEMPTS = 3
const SERVER_RETRY_DELAY_MS = 750

type PaymentResolution =
  | { status: "captured"; order: HttpTypes.StoreOrder }
  | { status: "processing" }
  | { status: "failed"; reason: string }
  | { status: "error"; reason: string }

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

const hasCapturedPaystackPayment = (order: HttpTypes.StoreOrder) => {
  const paymentCollections = (order as any).payment_collections || []
  const payments = paymentCollections.flatMap(
    (collection: any) => collection.payments || []
  )

  return (
    order.payment_status === "captured" &&
    payments.some(
      (payment: any) => payment.provider_id === PAYSTACK_PROVIDER_ID
    )
  )
}

const isFailedPaymentStatus = (status?: string | null) =>
  ["canceled", "cancelled", "failed", "not_paid", "refunded"].includes(
    status || ""
  )

const resolvePayment = async (attempts: number): Promise<PaymentResolution> => {
  const cartId = await getCartId()

  if (cartId) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const order = await retrieveOrderByCartId(cartId)

      if (order && hasCapturedPaystackPayment(order)) {
        return { status: "captured", order }
      }

      if (order && isFailedPaymentStatus(order.payment_status)) {
        return { status: "failed", reason: "payment_failed" }
      }

      if (attempt < attempts - 1) {
        await wait(SERVER_RETRY_DELAY_MS)
      }
    }

    return { status: "processing" }
  }

  // Paystack can retry the browser callback after the first response has
  // already cleared the cart cookie. Verify the remembered order again rather
  // than ever treating the callback itself as proof of payment.
  const completedOrderId = await getCompletedOrderId()
  if (!completedOrderId) {
    return { status: "error", reason: "missing_cart" }
  }

  const order = await retrieveOrderForPayment(completedOrderId)
  if (order && hasCapturedPaystackPayment(order)) {
    return { status: "captured", order }
  }

  return { status: "error", reason: "order_not_confirmed" }
}

const getBaseUrl = (request: NextRequest) =>
  process.env.STOREFRONT_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  request.nextUrl.origin

const getCountryCode = (order?: HttpTypes.StoreOrder) =>
  order?.shipping_address?.country_code?.toLowerCase() ||
  process.env.NEXT_PUBLIC_DEFAULT_REGION ||
  "za"

const getOrderUrl = (baseUrl: string, order: HttpTypes.StoreOrder) =>
  new URL(
    `/${getCountryCode(order)}/order/${order.id}/confirmed`,
    baseUrl
  ).toString()

const getStatusResponse = (resolution: PaymentResolution, baseUrl: string) => {
  if (resolution.status === "captured") {
    return {
      status: "complete",
      redirect_url: getOrderUrl(baseUrl, resolution.order),
    }
  }

  return {
    status: resolution.status,
    reason: "reason" in resolution ? resolution.reason : undefined,
  }
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request)
  const isPoll = request.nextUrl.searchParams.get("poll") === "1"
  const resolution = await resolvePayment(isPoll ? 1 : SERVER_ATTEMPTS)

  if (resolution.status === "captured") {
    await clearCartAfterOrder(resolution.order.id)
  }

  if (isPoll) {
    return NextResponse.json(getStatusResponse(resolution, baseUrl), {
      headers: { "cache-control": "no-store" },
    })
  }

  if (resolution.status === "captured") {
    return NextResponse.redirect(getOrderUrl(baseUrl, resolution.order))
  }

  const url = new URL("/", baseUrl)
  url.searchParams.set(
    "payment",
    resolution.status === "failed" ? "failed" : resolution.status
  )

  return NextResponse.redirect(url)
}

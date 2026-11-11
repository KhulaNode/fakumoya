import {
  invalidateCartAfterOrder,
  retrieveOrderByCartId,
  retrieveOrderForPayment,
} from "@lib/data/cart"
import {
  getCartId,
  getCompletedOrderId,
  setPaymentCompletionCookies,
} from "@lib/data/cookies"
import { resolvePaystackPayment } from "@lib/paystack-return"
import type { PaymentResolution } from "@lib/paystack-return"
import type { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

const SERVER_ATTEMPTS = 3
const SERVER_RETRY_DELAY_MS = 750

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds))

const safeErrorMessage = (error: unknown) => {
  const record =
    typeof error === "object" && error !== null
      ? (error as Record<string, unknown>)
      : undefined
  const message =
    error instanceof Error
      ? error.message
      : typeof record?.message === "string"
      ? record.message
      : "Unknown Medusa order lookup error"

  return message
    .replace(
      /(authorization|cookie|token|secret|password)[^\s]*/gi,
      "$1=[redacted]"
    )
    .slice(0, 200)
}

const logLookupError = (
  operation: string,
  identifier: string,
  error: unknown
) => {
  const record =
    typeof error === "object" && error !== null
      ? (error as Record<string, unknown>)
      : undefined
  const status =
    typeof record?.status === "number" || typeof record?.status === "string"
      ? record.status
      : undefined

  console.error("[paystack-return] Medusa order lookup failed", {
    operation,
    identifier_prefix: identifier.slice(0, 8),
    status,
    message: safeErrorMessage(error),
  })
}

const resolvePayment = async (
  attempts: number
): Promise<PaymentResolution<HttpTypes.StoreOrder>> => {
  const cartId = await getCartId()

  const completedOrderId = await getCompletedOrderId()

  return resolvePaystackPayment({
    cartId,
    completedOrderId,
    attempts,
    lookupOrderByCartId: retrieveOrderByCartId,
    lookupOrderById: retrieveOrderForPayment,
    delay: wait,
    retryDelayMs: SERVER_RETRY_DELAY_MS,
    onLookupError: (operation, identifier, error) =>
      logLookupError(operation, identifier, error),
  })
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

const getStatusResponse = (
  resolution: PaymentResolution<HttpTypes.StoreOrder>,
  baseUrl: string
) => {
  if (resolution.status === "captured") {
    return {
      status: "complete",
      redirect_url: getOrderUrl(baseUrl, resolution.order),
    }
  }

  const status =
    resolution.status === "error" && resolution.reason === "lookup_unavailable"
      ? "processing"
      : resolution.status

  return {
    status,
    reason: "reason" in resolution ? resolution.reason : undefined,
  }
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request)
  const isPoll = request.nextUrl.searchParams.get("poll") === "1"
  const resolution = await resolvePayment(isPoll ? 1 : SERVER_ATTEMPTS)

  if (resolution.status === "captured") {
    await invalidateCartAfterOrder()

    if (isPoll) {
      return setPaymentCompletionCookies(
        NextResponse.json(getStatusResponse(resolution, baseUrl), {
          headers: { "cache-control": "no-store" },
        }),
        resolution.order.id
      )
    }

    return setPaymentCompletionCookies(
      NextResponse.redirect(getOrderUrl(baseUrl, resolution.order)),
      resolution.order.id
    )
  }

  if (isPoll) {
    return NextResponse.json(getStatusResponse(resolution, baseUrl), {
      headers: { "cache-control": "no-store" },
    })
  }

  const url = new URL("/", baseUrl)
  const paymentState =
    resolution.status === "failed"
      ? "failed"
      : resolution.status === "processing" ||
        (resolution.status === "error" &&
          resolution.reason === "lookup_unavailable")
      ? "processing"
      : "error"
  url.searchParams.set("payment", paymentState)

  const response = NextResponse.redirect(url)
  response.headers.set("cache-control", "no-store")
  return response
}

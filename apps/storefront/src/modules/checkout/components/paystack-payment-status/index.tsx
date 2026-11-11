"use client"

import { CART_UPDATED_EVENT } from "@lib/util/cart-events"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

const MAX_ATTEMPTS = 10
const RETRY_DELAY_MS = 1500

type PaymentState = "processing" | "failed" | "error" | null

export default function PaystackPaymentStatus() {
  const searchParams = useSearchParams()
  const payment = searchParams.get("payment") as PaymentState
  const [state, setState] = useState<PaymentState>(
    payment === "processing" || payment === "failed" || payment === "error"
      ? payment
      : null
  )

  useEffect(() => {
    if (payment !== "processing") {
      setState(payment === "failed" || payment === "error" ? payment : null)
      return
    }

    let cancelled = false
    let attempts = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    const poll = async () => {
      attempts += 1

      try {
        const response = await fetch("/api/paystack/return?poll=1", {
          cache: "no-store",
        })
        const result = (await response.json()) as {
          status?: string
          redirect_url?: string
        }

        if (cancelled) {
          return
        }

        if (result.status === "complete" && result.redirect_url) {
          window.dispatchEvent(new Event(CART_UPDATED_EVENT))
          window.location.assign(result.redirect_url)
          return
        }

        if (result.status === "failed" || result.status === "error") {
          setState(result.status)
          return
        }
      } catch {
        // Keep the bounded retry state. The customer can still recover via
        // the cart link if the callback endpoint is temporarily unavailable.
      }

      if (!cancelled && attempts < MAX_ATTEMPTS) {
        timer = setTimeout(poll, RETRY_DELAY_MS)
      } else if (!cancelled) {
        setState("error")
      }
    }

    setState("processing")
    poll()

    return () => {
      cancelled = true
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [payment])

  if (!state) {
    return null
  }

  if (state === "processing") {
    return (
      <div
        className="border-b border-brand-border bg-brand-parchment px-4 py-3 text-center text-sm text-brand-secondary"
        role="status"
        aria-live="polite"
      >
        We&apos;re confirming your Paystack payment. Please keep this page open…
      </div>
    )
  }

  return (
    <div
      className="border-b border-brand-border bg-brand-parchment px-4 py-3 text-center text-sm text-brand-secondary"
      role="alert"
    >
      <span>
        We couldn&apos;t confirm the payment yet. Your cart is still safe, so
        you can try again or contact Fakumoya if you were charged.
      </span>{" "}
      <LocalizedClientLink
        href="/cart"
        className="font-semibold text-brand-primary underline underline-offset-4"
      >
        Return to cart
      </LocalizedClientLink>
    </div>
  )
}

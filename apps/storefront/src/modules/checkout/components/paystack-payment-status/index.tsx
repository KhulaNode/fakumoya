"use client"

import { CART_UPDATED_EVENT } from "@lib/util/cart-events"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useEffect, useState } from "react"

const MAX_ATTEMPTS = 10
const RETRY_DELAY_MS = 1500

type PaymentState = "processing" | "failed" | "error" | null
type PaymentStatusResponse = {
  status?: "complete" | "processing" | "failed" | "error"
  redirect_url?: string
}

const getPaymentState = (value: string | null): PaymentState =>
  value === "processing" || value === "failed" || value === "error"
    ? value
    : null

export default function PaystackPaymentStatus() {
  // Read the query string after hydration. The home page is statically
  // rendered, so reading it during the first render would make the server
  // markup differ from the browser markup and trigger React hydration #418.
  const [state, setState] = useState<PaymentState>(null)

  useEffect(() => {
    const payment = getPaymentState(
      new URLSearchParams(window.location.search).get("payment")
    )

    if (payment !== "processing") {
      setState(payment)
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
        const result = (await response.json()) as PaymentStatusResponse

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
  }, [])

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
        We&apos;re confirming your Paystack payment. Please don&apos;t start
        another payment while we check.
      </div>
    )
  }

  if (state === "failed") {
    return (
      <div
        className="border-b border-brand-border bg-brand-parchment px-4 py-3 text-center text-sm text-brand-secondary"
        role="alert"
      >
        <span>
          Your Paystack payment did not complete. You can return to your cart
          and try again.
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

  return (
    <div
      className="border-b border-brand-border bg-brand-parchment px-4 py-3 text-center text-sm text-brand-secondary"
      role="alert"
    >
      <span>
        We couldn&apos;t confirm the payment outcome yet. Your cart is still
        safe. Please don&apos;t start another payment until Fakumoya confirms
        whether you were charged.
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

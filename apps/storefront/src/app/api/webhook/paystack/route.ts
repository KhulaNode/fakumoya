import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const backendUrl = () =>
  (process.env.MEDUSA_INTERNAL_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "").replace(/\/$/, "")

const validSignature = (body: string, signature: string | null) => {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret || !signature) return false
  const expected = crypto.createHmac("sha512", secret).update(body).digest("hex")
  if (signature.length !== expected.length) return false
  let difference = 0
  for (let index = 0; index < expected.length; index += 1) {
    difference |= signature.charCodeAt(index) ^ expected.charCodeAt(index)
  }
  return difference === 0
}

type PaystackEvent = {
  data?: { metadata?: { session_id?: string; fakumoya_subscription_id?: string } }
}

// Paystack accepts one account-level webhook URL. Keep that public endpoint on
// the storefront and relay the signed raw payload to the relevant private
// Medusa handler, where payment and subscription state are recorded.
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-paystack-signature")
  if (!signature || !validSignature(rawBody, signature)) {
    return NextResponse.json({ message: "Invalid Paystack signature" }, { status: 401 })
  }

  let event: PaystackEvent
  try {
    event = JSON.parse(rawBody) as PaystackEvent
  } catch {
    return NextResponse.json({ message: "Invalid Paystack payload" }, { status: 400 })
  }

  const destination = event.data?.metadata?.session_id
    ? "/hooks/payment/paystack_paystack"
    : "/hooks/paystack/subscriptions"
  const url = `${backendUrl()}${destination}`
  if (!backendUrl()) {
    return NextResponse.json({ message: "Medusa backend is not configured" }, { status: 500 })
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": request.headers.get("content-type") || "application/json",
        "x-paystack-signature": signature,
      },
      body: rawBody,
      cache: "no-store",
    })
    if (!response.ok) {
      return NextResponse.json({ message: "Medusa webhook handling failed" }, { status: 502 })
    }
  } catch {
    return NextResponse.json({ message: "Medusa webhook handling failed" }, { status: 502 })
  }

  return NextResponse.json({ received: true })
}

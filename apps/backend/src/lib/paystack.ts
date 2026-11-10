import crypto from "crypto"
import { MedusaError } from "@medusajs/framework/utils"

const PAYSTACK_API = "https://api.paystack.co"

export type PaystackEvent = {
  event?: string
  data?: Record<string, any>
}

function secret() {
  const value = process.env.PAYSTACK_SECRET_KEY
  if (!value) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "PAYSTACK_SECRET_KEY is not configured")
  return value
}

export async function paystackRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  })
  const body = await response.json().catch(() => ({})) as { status?: boolean; message?: string; data?: T }
  if (!response.ok || !body.status || !body.data) {
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, body.message || `Paystack request failed (${response.status})`)
  }
  return body.data
}

export function validPaystackSignature(rawBody: string | Buffer | undefined, signature: string | undefined) {
  if (!rawBody || !signature || !process.env.PAYSTACK_SECRET_KEY) return false
  const expected = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex")
  const received = Buffer.from(signature, "utf8")
  const calculated = Buffer.from(expected, "utf8")
  return received.length === calculated.length && crypto.timingSafeEqual(received, calculated)
}

export function hashManageToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

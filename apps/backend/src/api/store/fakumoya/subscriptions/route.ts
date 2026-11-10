import crypto from "crypto"
import { MedusaError } from "@medusajs/framework/utils"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { paystackRequest } from "../../../../lib/paystack"
import {
  MONTHLY_BREAD_SUBSCRIPTION_CENTS,
  MONTHLY_BREAD_SUBSCRIPTION_DELIVERIES,
  MONTHLY_BREAD_SUBSCRIPTION_LOAVES,
  MONTHLY_BREAD_SUBSCRIPTION_SHARE_CENTS,
} from "../../../../lib/paystack-revenue-share"
import { FAKUMOYA_SUBSCRIPTION_MODULE } from "../../../../modules/fakumoya-subscription"

type SubscriptionInput = { email?: string; first_name?: string; last_name?: string; phone?: string }

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as SubscriptionInput
  const email = body.email?.trim().toLowerCase()
  if (!email) throw new MedusaError(MedusaError.Types.INVALID_DATA, "email is required")
  const plan = process.env.PAYSTACK_MONTHLY_BREAD_PLAN_CODE || process.env.PAYSTACK_PLAN_CODE
  const storefrontUrl = process.env.STOREFRONT_URL?.replace(/\/$/, "")
  if (!plan || !storefrontUrl) {
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Monthly subscription checkout is not configured")
  }

  const subscriptions = req.scope.resolve(FAKUMOYA_SUBSCRIPTION_MODULE) as any
  const reference = `FKSB${crypto.randomUUID().replace(/-/g, "")}`
  const manageToken = crypto.randomBytes(32).toString("base64url")
  const recurringSplitConfirmed = process.env.PAYSTACK_ENABLE_RECURRING_SPLIT === "true" && !!process.env.PAYSTACK_SUBSCRIPTION_SPLIT_CODE
  const subscription = await subscriptions.createFakumoyaSubscriptions({
    email,
    first_name: body.first_name?.trim() || null,
    last_name: body.last_name?.trim() || null,
    phone: body.phone?.trim() || null,
    initial_reference: reference,
    manage_token_hash: crypto.createHash("sha256").update(manageToken).digest("hex"),
    monthly_amount_cents: MONTHLY_BREAD_SUBSCRIPTION_CENTS,
    loaves_per_month: MONTHLY_BREAD_SUBSCRIPTION_LOAVES,
    deliveries_per_month: MONTHLY_BREAD_SUBSCRIPTION_DELIVERIES,
    khulanode_share_cents: MONTHLY_BREAD_SUBSCRIPTION_SHARE_CENTS,
    settlement_mode: recurringSplitConfirmed ? "provider_split_confirmed" : "manual_review",
    metadata: { source: "storefront" },
  })

  const payload: Record<string, unknown> = {
    email,
    plan,
    reference,
    currency: "ZAR",
    callback_url: `${storefrontUrl}/api/paystack/subscription-return`,
    metadata: { fakumoya_subscription_id: subscription.id, source: "fakumoya-subscription" },
  }
  // Paystack must confirm that this merchant's split-code applies to recurring
  // invoices before this is enabled. Once-off transaction split fields are not
  // assumed to carry over to subscription renewals.
  if (recurringSplitConfirmed) payload.split_code = process.env.PAYSTACK_SUBSCRIPTION_SPLIT_CODE!

  const initialized = await paystackRequest<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  res.status(201).json({ authorization_url: initialized.authorization_url, subscription_id: subscription.id, manage_token: manageToken })
}

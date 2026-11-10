import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { validPaystackSignature } from "../../../../lib/paystack"
import { FAKUMOYA_SUBSCRIPTION_MODULE } from "../../../../modules/fakumoya-subscription"

function asText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const signature = req.headers["x-paystack-signature"]
  const providedSignature = Array.isArray(signature) ? signature[0] : signature
  if (!validPaystackSignature(req.rawBody, providedSignature)) {
    return res.status(401).json({ message: "Invalid Paystack signature" })
  }

  const event = req.body as { event?: string; data?: Record<string, any> }
  const data = event.data || {}
  const service = req.scope.resolve(FAKUMOYA_SUBSCRIPTION_MODULE) as any
  const metadataSubscriptionId = asText(data.metadata?.fakumoya_subscription_id)
  const code = asText(data.subscription_code)
  let subscription: any
  if (metadataSubscriptionId) {
    subscription = await service.retrieveFakumoyaSubscription(metadataSubscriptionId).catch(() => undefined)
  } else if (code) {
    subscription = (await service.listFakumoyaSubscriptions({ paystack_subscription_code: code }))[0]
  }
  // This endpoint also receives unrelated events if configured as an account
  // webhook. Acknowledge them safely rather than treating them as failures.
  if (!subscription) return res.status(200).json({ received: true })

  if (event.event === "subscription.create") {
    await service.updateFakumoyaSubscriptions({
      id: subscription.id,
      status: "active",
      paystack_subscription_code: code || subscription.paystack_subscription_code,
      paystack_email_token: asText(data.email_token) || subscription.paystack_email_token,
    })
  }

  if (event.event === "subscription.not_renew") {
    await service.updateFakumoyaSubscriptions({ id: subscription.id, status: "canceling" })
  }
  if (event.event === "subscription.disable") {
    await service.updateFakumoyaSubscriptions({ id: subscription.id, status: "cancelled" })
  }
  if (event.event === "invoice.payment_failed") {
    await service.updateFakumoyaSubscriptions({ id: subscription.id, status: "past_due" })
  }

  if (event.event === "charge.success") {
    const reference = asText(data.reference)
    const amount = Number(data.amount)
    if (reference && Number.isInteger(amount) && amount > 0) {
      const existing = await service.listFakumoyaSubscriptionInvoices({ paystack_reference: reference })
      if (!existing.length) {
        await service.createFakumoyaSubscriptionInvoices({
          subscription_id: subscription.id,
          paystack_reference: reference,
          status: "paid",
          amount_cents: amount,
          khulanode_share_cents: subscription.khulanode_share_cents,
          bakery_net_cents: amount - subscription.khulanode_share_cents,
          paid_at: data.paid_at ? new Date(data.paid_at) : new Date(),
          metadata: { paystack_event: event.event, subscription_code: code },
        })
      }
      await service.updateFakumoyaSubscriptions({ id: subscription.id, status: "active" })
    }
  }
  return res.status(200).json({ received: true })
}

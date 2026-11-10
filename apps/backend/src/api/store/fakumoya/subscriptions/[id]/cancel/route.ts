import { MedusaError } from "@medusajs/framework/utils"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { hashManageToken, paystackRequest } from "../../../../../../lib/paystack"
import { FAKUMOYA_SUBSCRIPTION_MODULE } from "../../../../../../modules/fakumoya-subscription"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const token = (req.body as { manage_token?: string })?.manage_token
  const subscriptionId = req.params.id
  if (!token) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "A subscription management token is required")
  const service = req.scope.resolve(FAKUMOYA_SUBSCRIPTION_MODULE) as any
  const subscription = await service.retrieveFakumoyaSubscription(subscriptionId)
  if (subscription.manage_token_hash !== hashManageToken(token)) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Invalid subscription management token")
  }
  if (!subscription.paystack_subscription_code || !subscription.paystack_email_token) {
    throw new MedusaError(MedusaError.Types.CONFLICT, "This subscription is not active yet")
  }
  await paystackRequest("/subscription/disable", {
    method: "POST",
    body: JSON.stringify({ code: subscription.paystack_subscription_code, token: subscription.paystack_email_token }),
  })
  await service.updateFakumoyaSubscriptions({ id: subscriptionId, status: "canceling" })
  res.json({ id: subscriptionId, status: "canceling" })
}

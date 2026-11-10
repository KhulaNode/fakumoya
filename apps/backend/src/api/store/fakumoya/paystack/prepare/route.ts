import { MedusaError } from "@medusajs/framework/utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { calculateKhulaNodeShare, signRevenueShare } from "../../../../../lib/paystack-revenue-share"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cartId = (req.body as { cart_id?: string })?.cart_id
  if (!cartId) throw new MedusaError(MedusaError.Types.INVALID_DATA, "cart_id is required")
  const secret = process.env.PAYSTACK_REVENUE_SHARE_SECRET
  if (!secret) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Revenue-share signing is not configured")

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "email", "total", "items.quantity", "items.unit_price", "items.product.metadata"],
    filters: { id: cartId },
  })
  const cart = carts[0] as any
  if (!cart) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart was not found")
  if (!cart.email) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Add an email address before paying")

  const amount = Math.round(Number(cart.total) * 100)
  const commissionCents = Math.min(amount, calculateKhulaNodeShare(cart.items || []))
  res.json({
    email: cart.email,
    commission_cents: commissionCents,
    commission_token: signRevenueShare({ amount, commission_cents: commissionCents, secret }),
  })
}

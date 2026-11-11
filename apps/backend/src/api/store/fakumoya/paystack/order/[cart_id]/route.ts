import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";

/**
 * Returns the order linked to a cart after Medusa completes it.
 *
 * The cart ID is supplied by the storefront's httpOnly cookie. This route
 * reads Medusa's built-in Cart -> Order link and intentionally returns no
 * order ID until the link exists, allowing the Paystack return flow to retry
 * safely while the signed webhook is being processed.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cartId = req.params.cart_id;
  if (!cartId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "cart_id is required"
    );
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "order.id",
      "order.payment_status",
      "order.shipping_address.country_code",
      "order.payment_collections.payments.provider_id",
    ],
    filters: { id: cartId },
  });

  const linkedOrder = (carts[0] as any)?.order;
  const order = Array.isArray(linkedOrder) ? linkedOrder[0] : linkedOrder;

  return res.json({ order: order || null });
}

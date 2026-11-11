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
  let carts;
  try {
    ({ data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "order.id",
        "order.payment_status",
        "order.shipping_address.country_code",
        "order.payment_collections.id",
        "order.payment_collections.payments.id",
        "order.payment_collections.payments.provider_id",
      ],
      filters: { id: cartId },
    }));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown query error";
    console.error("[paystack-order-lookup] Cart -> Order query failed", {
      cart_id_prefix: cartId.slice(0, 8),
      message: message
        .replace(
          /(authorization|cookie|token|secret|password)[^\s]*/gi,
          "$1=[redacted]"
        )
        .slice(0, 200),
    });
    throw error;
  }

  const linkedOrder = (carts[0] as any)?.order;
  const order = Array.isArray(linkedOrder) ? linkedOrder[0] : linkedOrder;

  return res.json({ order: order || null });
}

import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { GET } from "../[cart_id]/route";

const makeRequest = (cartId: string, query: { graph: jest.Mock }) =>
  ({
    params: { cart_id: cartId },
    scope: {
      resolve: jest.fn().mockReturnValue(query),
    },
  } as any);

const makeResponse = () => {
  const response = { json: jest.fn() };
  response.json.mockImplementation(() => response);
  return response as any;
};

describe("Paystack cart order lookup", () => {
  it("returns the order linked through Medusa's persistent OrderCart graph", async () => {
    const order = {
      id: "order_123",
      payment_status: "captured",
      payment_collections: [
        {
          payments: [
            {
              provider_id: "pp_paystack_paystack",
              captured_at: "2026-11-11T16:00:00.000Z",
            },
          ],
        },
      ],
    };
    const query = {
      graph: jest.fn().mockResolvedValue({
        data: [{ id: "ordercart_123", cart_id: "cart_123", order: [order] }],
      }),
    };
    const response = makeResponse();

    await GET(makeRequest("cart_123", query), response);

    expect(query.graph).toHaveBeenCalledWith({
      entity: "order_cart",
      fields: expect.arrayContaining([
        "order.id",
        "order.payment_collections.id",
        "order.payment_collections.payments.provider_id",
        "order.payment_collections.payments.captured_at",
      ]),
      filters: { cart_id: "cart_123" },
    });
    expect(response.json).toHaveBeenCalledWith({ order });
  });

  it("returns null when the cart exists but has no linked order yet", async () => {
    const query = { graph: jest.fn().mockResolvedValue({ data: [] }) };
    const response = makeResponse();

    await GET(makeRequest("cart_pending", query), response);

    expect(response.json).toHaveBeenCalledWith({ order: null });
  });

  it("logs a safe diagnostic and preserves backend query failures", async () => {
    const error = new Error("database unavailable");
    const query = { graph: jest.fn().mockRejectedValue(error) };
    const response = makeResponse();
    const log = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(
      GET(makeRequest("cart_123456", query), response)
    ).rejects.toThrow("database unavailable");
    expect(log).toHaveBeenCalledWith(
      "[paystack-order-lookup] OrderCart query failed",
      expect.objectContaining({ cart_id_prefix: "cart_123" })
    );

    log.mockRestore();
  });

  it("resolves Medusa's query service from the request scope", async () => {
    const query = { graph: jest.fn().mockResolvedValue({ data: [] }) };
    const response = makeResponse();
    const request = makeRequest("cart_123", query);

    await GET(request, response);

    expect(request.scope.resolve).toHaveBeenCalledWith(
      ContainerRegistrationKeys.QUERY
    );
  });
});

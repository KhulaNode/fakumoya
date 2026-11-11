import assert from "node:assert/strict"

declare const require: (moduleName: string) => any

const { test } = require("node:test")

import {
  MEDUSA_CART_ID_COOKIE,
  MEDUSA_COMPLETED_ORDER_COOKIE,
  PAYSTACK_PROVIDER_ID,
  resolvePaystackPayment,
  setPaymentCompletionCookies,
} from "../paystack-return"

const capturedOrder = {
  id: "order_123",
  payment_status: "captured",
  payment_collections: [{ payments: [{ provider_id: PAYSTACK_PROVIDER_ID }] }],
}

test("recognises a captured Paystack order returned through the cart lookup", async () => {
  const resolution = await resolvePaystackPayment({
    cartId: "cart_123",
    attempts: 1,
    lookupOrderByCartId: async () => capturedOrder,
    lookupOrderById: async () => null,
  })

  assert.equal(resolution.status, "captured")
  assert.deepEqual(resolution.order, capturedOrder)
})

test("keeps a missing cart order in the bounded pending state", async () => {
  const resolution = await resolvePaystackPayment({
    cartId: "cart_123",
    attempts: 2,
    lookupOrderByCartId: async () => null,
    lookupOrderById: async () => null,
    delay: async () => undefined,
  })

  assert.deepEqual(resolution, {
    status: "processing",
    reason: "order_pending",
  })
})

test("keeps backend lookup failures distinct from a missing order", async () => {
  const failures: Array<{ operation: string; identifier: string }> = []
  const resolution = await resolvePaystackPayment({
    cartId: "cart_123456",
    attempts: 2,
    lookupOrderByCartId: async () => {
      throw new Error("Medusa returned HTTP 503")
    },
    lookupOrderById: async () => null,
    delay: async () => undefined,
    onLookupError: async (operation, identifier) => {
      failures.push({ operation, identifier })
    },
  })

  assert.deepEqual(resolution, {
    status: "processing",
    reason: "lookup_unavailable",
  })
  assert.deepEqual(failures, [
    { operation: "cart_order", identifier: "cart_123456" },
    { operation: "cart_order", identifier: "cart_123456" },
  ])
})

test("recognises a webhook that captures the order during polling", async () => {
  let calls = 0
  const resolution = await resolvePaystackPayment({
    cartId: "cart_123",
    attempts: 2,
    lookupOrderByCartId: async () => {
      calls += 1
      return calls === 1
        ? {
            id: "order_123",
            payment_status: "awaiting",
            payment_collections: [],
          }
        : capturedOrder
    },
    lookupOrderById: async () => null,
    delay: async () => undefined,
  })

  assert.equal(calls, 2)
  assert.equal(resolution.status, "captured")
})

test("reports an explicitly failed payment without treating an unknown state as failed", async () => {
  const resolution = await resolvePaystackPayment({
    cartId: "cart_failed",
    attempts: 1,
    lookupOrderByCartId: async () => ({
      id: "order_failed",
      payment_status: "failed",
      payment_collections: [],
    }),
    lookupOrderById: async () => null,
  })

  assert.deepEqual(resolution, {
    status: "failed",
    reason: "payment_failed",
  })
})

test("repeated callbacks verify the remembered order after the cart cookie is gone", async () => {
  let cartLookupCalled = false
  const resolution = await resolvePaystackPayment({
    completedOrderId: "order_123",
    attempts: 1,
    lookupOrderByCartId: async () => {
      cartLookupCalled = true
      return null
    },
    lookupOrderById: async (orderId) => {
      assert.equal(orderId, "order_123")
      return {
        ...capturedOrder,
        payment_collections: {
          payments: { provider_id: PAYSTACK_PROVIDER_ID },
        },
      }
    },
  })

  assert.equal(cartLookupCalled, false)
  assert.equal(resolution.status, "captured")
})

test("returns a recoverable error when a remembered order still cannot be found", async () => {
  const resolution = await resolvePaystackPayment({
    completedOrderId: "order_missing",
    attempts: 1,
    lookupOrderByCartId: async () => null,
    lookupOrderById: async () => null,
  })

  assert.deepEqual(resolution, {
    status: "error",
    reason: "order_not_confirmed",
  })
})

test("sets the completed-order cookie and deletes the cart on the returned response", () => {
  const writes: Array<{
    name: string
    value: string
    options: Record<string, unknown>
  }> = []
  const response = {
    cookies: {
      set(name: string, value: string, options: Record<string, unknown>) {
        writes.push({ name, value, options })
      },
    },
  }

  setPaymentCompletionCookies(response as any, "order_123")

  assert.deepEqual(writes, [
    {
      name: MEDUSA_COMPLETED_ORDER_COOKIE,
      value: "order_123",
      options: {
        maxAge: 60 * 15,
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
      },
    },
    {
      name: MEDUSA_CART_ID_COOKIE,
      value: "",
      options: {
        maxAge: 0,
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
      },
    },
  ])
})

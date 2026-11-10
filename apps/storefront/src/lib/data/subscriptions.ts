"use server"

import { sdk } from "@lib/config"

export async function createBreadSubscription(input: {
  email: string
  first_name?: string
  last_name?: string
  phone?: string
}) {
  return sdk.client.fetch<{ authorization_url: string }>("/store/fakumoya/subscriptions", {
    method: "POST",
    body: input,
    cache: "no-store",
  })
}

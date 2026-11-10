import { model } from "@medusajs/framework/utils"

const FakumoyaSubscription = model.define("fakumoya_subscription", {
  id: model.id().primaryKey(),
  email: model.text().searchable(),
  first_name: model.text().nullable(),
  last_name: model.text().nullable(),
  phone: model.text().nullable(),
  status: model.enum(["pending", "active", "past_due", "canceling", "cancelled"]).default("pending"),
  initial_reference: model.text().unique(),
  paystack_subscription_code: model.text().unique().nullable(),
  paystack_email_token: model.text().nullable(),
  manage_token_hash: model.text().unique(),
  monthly_amount_cents: model.number().default(62000),
  loaves_per_month: model.number().default(24),
  deliveries_per_month: model.number().default(12),
  khulanode_share_cents: model.number().default(7200),
  settlement_mode: model.enum(["manual_review", "provider_split_confirmed"]).default("manual_review"),
  metadata: model.json().nullable(),
})

export default FakumoyaSubscription

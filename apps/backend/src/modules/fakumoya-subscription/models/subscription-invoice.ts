import { model } from "@medusajs/framework/utils"

const FakumoyaSubscriptionInvoice = model.define("fakumoya_subscription_invoice", {
  id: model.id().primaryKey(),
  subscription_id: model.text(),
  paystack_reference: model.text().unique(),
  status: model.enum(["pending", "paid", "failed"]).default("pending"),
  amount_cents: model.number(),
  khulanode_share_cents: model.number(),
  bakery_net_cents: model.number(),
  paid_at: model.dateTime().nullable(),
  medusa_order_id: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default FakumoyaSubscriptionInvoice

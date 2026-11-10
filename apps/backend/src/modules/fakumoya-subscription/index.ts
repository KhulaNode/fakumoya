import { Module } from "@medusajs/framework/utils"
import FakumoyaSubscriptionService from "./service"

export const FAKUMOYA_SUBSCRIPTION_MODULE = "fakumoya_subscription"

export default Module(FAKUMOYA_SUBSCRIPTION_MODULE, {
  service: FakumoyaSubscriptionService,
})

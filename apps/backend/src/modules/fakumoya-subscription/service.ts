import { MedusaService } from "@medusajs/framework/utils"
import FakumoyaSubscription from "./models/subscription"
import FakumoyaSubscriptionInvoice from "./models/subscription-invoice"

class FakumoyaSubscriptionService extends MedusaService({
  FakumoyaSubscription,
  FakumoyaSubscriptionInvoice,
}) {}

export default FakumoyaSubscriptionService

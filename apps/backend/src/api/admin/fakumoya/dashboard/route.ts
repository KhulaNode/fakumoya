import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { FAKUMOYA_SUBSCRIPTION_MODULE } from "../../../../modules/fakumoya-subscription"
import { assembleOperations, operationsPreview, saDay } from "../../../../lib/fakumoya-operations"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (req.query.test_data === "true") return res.json(operationsPreview())

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { start, end } = saDay()
  const dailyFields = [
      "id", "display_id", "created_at", "status", "payment_status", "fulfillment_status",
      "currency_code", "total", "items.quantity", "items.unit_price",
      "items.item.product_id", "items.item.metadata",
  ]
  const todayOrders: any[] = []
  const pageSize = 200
  for (let skip = 0; ; skip += pageSize) {
    const { data } = await query.graph({
      entity: "order", fields: dailyFields,
      filters: { created_at: { $gte: start, $lt: end } },
      pagination: { take: pageSize, skip },
    })
    todayOrders.push(...data)
    if (data.length < pageSize) break
  }
  const { data: recentOrders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "created_at", "status", "payment_status", "fulfillment_status"],
    pagination: { take: 200, skip: 0, order: { created_at: "DESC" } },
  })

  const productIds = [...new Set(todayOrders.flatMap((order) =>
    (order.items || []).map((line: any) => line.item?.product_id).filter(Boolean)))] as string[]
  const { data: products } = productIds.length
    ? await query.graph({ entity: "product", fields: ["id", "metadata"], filters: { id: productIds } })
    : { data: [] as Array<{ id: string; metadata: Record<string, unknown> | null }> }
  const metadata = Object.fromEntries(products.map((product) => [product.id, product.metadata]))

  const service = req.scope.resolve(FAKUMOYA_SUBSCRIPTION_MODULE) as any
  const [subscriptions, invoices] = await Promise.all([
    service.listFakumoyaSubscriptions({}),
    service.listFakumoyaSubscriptionInvoices({}),
  ])

  res.json(assembleOperations({
    todayOrders,
    recentOrders: recentOrders as any[],
    productMetadata: metadata,
    subscriptions,
    invoices,
  }))
}

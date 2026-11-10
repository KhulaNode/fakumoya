import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartBar } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"

type DashboardResponse = {
  date: string
  orders: Array<{
    id: string
    display_id: string
    payment_status: string
    fulfillment_status: string
    total_cents: number
    currency_code: string
    bread_loaves: number
    commission_cents: number
    commission_state: string
    source: string
  }>
  subscriptions: Array<{
    id: string
    name: string
    status: string
    loaves_per_month: number
    deliveries_per_month: number
    payment_state: string
  }>
  fulfilments: Array<{ id: string; display_id: string; status: string; bread_loaves: number }>
  production: { bread_loaves_today: number; subscription_loaves_upcoming: number; total_loaves: number }
  commission: { projected_cents: number; earned_cents: number; settled_cents: number; note: string }
}

const money = (cents: number) => `R${(cents / 100).toFixed(2)}`
const titleCase = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())

const Metric = ({ label, value, detail }: { label: string; value: string; detail: string }) => (
  <div className="rounded-lg border border-ui-border-base bg-ui-bg-base p-4">
    <Text size="small" className="text-ui-fg-subtle">{label}</Text>
    <Heading level="h2" className="mt-2">{value}</Heading>
    <Text size="small" className="mt-1 text-ui-fg-subtle">{detail}</Text>
  </div>
)

const FakumoyaOperationsPage = () => {
  const [testData, setTestData] = useState(false)
  const { data, isLoading, error } = useQuery({
    queryKey: ["fakumoya-operations", testData],
    queryFn: () => sdk.client.fetch<DashboardResponse>("/admin/fakumoya/dashboard", {
      query: { test_data: String(testData) },
    }),
  })

  if (isLoading) return <Container><Text>Loading Fakumoya operations…</Text></Container>
  if (error || !data) return <Container><Text>Operations data could not be loaded. Check the backend service.</Text></Container>

  return <div className="flex flex-col gap-6 pb-8">
    <div className="flex flex-col gap-2 small:flex-row small:items-center small:justify-between">
      <div>
        <Heading level="h1">Fakumoya Operations</Heading>
        <Text className="text-ui-fg-subtle">Tshepo’s daily kasi bakery view · {data.date}</Text>
      </div>
      <label className="flex items-center gap-2 text-sm text-ui-fg-subtle">
        <input type="checkbox" checked={testData} onChange={(event) => setTestData(event.target.checked)} />
        Show realistic test data
      </label>
    </div>

    <div className="grid grid-cols-1 small:grid-cols-3 gap-3">
      <Metric label="Orders today" value={String(data.orders.length)} detail="Medusa orders and test rows" />
      <Metric label="Loaves to bake" value={String(data.production.total_loaves)} detail={`${data.production.bread_loaves_today} ordered · ${data.production.subscription_loaves_upcoming} subscription demand`} />
      <Metric label="Active subscriptions" value={String(data.subscriptions.filter((subscription) => subscription.status === "active").length)} detail="Payment status shown separately" />
    </div>

    <div className="grid grid-cols-1 small:grid-cols-3 gap-3">
      <Metric label="Commission projected" value={money(data.commission.projected_cents)} detail="Demand, not yet payment-confirmed" />
      <Metric label="Commission earned" value={money(data.commission.earned_cents)} detail="Captured or paid invoices" />
      <Metric label="Commission settled" value={money(data.commission.settled_cents)} detail="Explicit settlement record only" />
    </div>

    <Container className="p-0 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-ui-border-base px-5 py-4"><ChartBar /><Heading level="h2">Today’s orders</Heading></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm"><thead><tr className="border-b border-ui-border-base text-left text-ui-fg-subtle"><th className="px-5 py-3">Order</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Bread</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3">Commission</th></tr></thead>
          <tbody>{data.orders.map((order) => <tr key={order.id} className="border-b border-ui-border-base last:border-0"><td className="px-5 py-3 font-medium">{order.display_id}{order.source === "test" && <span className="ml-2 text-xs text-ui-fg-subtle">TEST</span>}</td><td className="px-5 py-3">{money(order.total_cents)}</td><td className="px-5 py-3">{order.bread_loaves} loaves</td><td className="px-5 py-3">{titleCase(order.payment_status)}</td><td className="px-5 py-3">{money(order.commission_cents)} · {titleCase(order.commission_state)}</td></tr>)}</tbody>
        </table>
        {!data.orders.length && <Text className="block px-5 py-8 text-center text-ui-fg-subtle">No orders yet. Turn on test data to preview the workflow.</Text>}
      </div>
    </Container>

    <div className="grid grid-cols-1 small:grid-cols-2 gap-6">
      <Container className="p-0 overflow-hidden"><div className="flex items-center gap-2 border-b border-ui-border-base px-5 py-4"><ChartBar /><Heading level="h2">Upcoming fulfilments</Heading></div><div className="divide-y divide-ui-border-base">{data.fulfilments.map((fulfilment) => <div key={fulfilment.id} className="flex justify-between px-5 py-4 text-sm"><span>{fulfilment.display_id}</span><span>{fulfilment.bread_loaves} loaves · {titleCase(fulfilment.status)}</span></div>)}{!data.fulfilments.length && <Text className="block px-5 py-6 text-ui-fg-subtle">No outstanding fulfilments.</Text>}</div></Container>
      <Container className="p-0 overflow-hidden"><div className="flex items-center gap-2 border-b border-ui-border-base px-5 py-4"><ChartBar /><Heading level="h2">Subscription demand</Heading></div><div className="divide-y divide-ui-border-base">{data.subscriptions.map((subscription) => <div key={subscription.id} className="flex flex-col gap-1 px-5 py-4 text-sm"><span className="font-medium">{subscription.name}</span><span className="text-ui-fg-subtle">{subscription.loaves_per_month} loaves · {subscription.deliveries_per_month} deliveries · {titleCase(subscription.payment_state)}</span></div>)}{!data.subscriptions.length && <Text className="block px-5 py-6 text-ui-fg-subtle">No subscription records yet.</Text>}</div></Container>
    </div>
  </div>
}

export const config = defineRouteConfig({ label: "Fakumoya Operations", icon: ChartBar, rank: 1 })
export default FakumoyaOperationsPage

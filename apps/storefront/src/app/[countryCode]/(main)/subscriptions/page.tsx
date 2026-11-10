import BreadPlanForm from "@modules/subscriptions/bread-plan-form"

export const metadata = { title: "Monthly Bread Plan | Fakumoya Bakery" }

export default function SubscriptionsPage() {
  return <main className="content-container py-12 small:py-16">
    <p className="text-[#a96812] font-medium mb-3">Fakumoya bread plan</p>
    <h1 className="text-4xl small:text-5xl text-[#28180e] mb-5">Fresh bread for your kasi, every month.</h1>
    <p className="max-w-2xl text-ui-fg-subtle mb-8">
      R620 each month covers 24 loaves and 12 deliveries. Pay securely through Paystack and manage or cancel your plan whenever you need to.
    </p>
    <div className="grid small:grid-cols-[1fr_1.4fr] gap-10 items-start">
      <div className="bg-[#fff8ec] border border-[#e5cfad] rounded-lg p-6 text-[#28180e]">
        <p className="text-3xl font-semibold">R620 <span className="text-base font-normal">/ month</span></p>
        <ul className="mt-5 space-y-3 text-sm">
          <li>24 fresh Fakumoya loaves</li>
          <li>12 deliveries a month</li>
          <li>Monthly billing through Paystack</li>
          <li>Cancel before your next renewal</li>
        </ul>
      </div>
      <BreadPlanForm />
    </div>
  </main>
}

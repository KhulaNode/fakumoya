"use client"

import { createBreadSubscription } from "@lib/data/subscriptions"
import { useState } from "react"

export default function BreadPlanForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(formData: FormData) {
    setError(null)
    setLoading(true)
    try {
      const result = await createBreadSubscription({
        email: String(formData.get("email") || ""),
        first_name: String(formData.get("first_name") || ""),
        last_name: String(formData.get("last_name") || ""),
        phone: String(formData.get("phone") || ""),
      })
      window.location.assign(result.authorization_url)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not start your bread plan. Please try again.")
      setLoading(false)
    }
  }

  return <form action={submit} className="grid gap-4 max-w-xl">
    <div className="grid grid-cols-2 gap-3">
      <input required name="first_name" placeholder="First name" className="border border-ui-border-base rounded-md px-4 py-3" />
      <input required name="last_name" placeholder="Last name" className="border border-ui-border-base rounded-md px-4 py-3" />
    </div>
    <input required type="email" name="email" placeholder="Email address" className="border border-ui-border-base rounded-md px-4 py-3" />
    <input required type="tel" name="phone" placeholder="Phone number" className="border border-ui-border-base rounded-md px-4 py-3" />
    {error && <p className="text-red-600 text-sm">{error}</p>}
    <button disabled={loading} className="bg-[#a96812] text-white rounded-md px-5 py-3 font-medium disabled:opacity-60">
      {loading ? "Taking you to Paystack…" : "Start the R620 monthly plan"}
    </button>
  </form>
}

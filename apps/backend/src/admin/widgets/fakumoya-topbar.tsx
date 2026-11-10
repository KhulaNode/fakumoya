import { defineWidgetConfig } from "@medusajs/admin-sdk"

const FakumoyaTopbar = () => {
  return (
    <div className="mr-3 hidden items-center gap-2 text-sm font-semibold text-[#4A2C1D] md:flex">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4A2C1D] font-serif text-[#D79530]">
        F
      </span>
      <span>Fakumoya Bakery</span>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "topbar",
})

export default FakumoyaTopbar

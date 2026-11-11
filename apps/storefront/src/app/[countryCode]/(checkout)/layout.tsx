import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import Image from "next/image"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-brand-cream relative small:min-h-screen">
      <div className="h-[76px] bg-brand-cream border-b border-brand-border shadow-[0_1px_0_rgba(40,24,14,0.04)]">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-ui-fg-base flex items-center gap-x-2 uppercase flex-1 basis-0"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base ">
              Back to shopping cart
            </span>
            <span className="mt-px block small:hidden txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base">
              Back
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="flex items-center gap-3 text-brand-secondary"
            data-testid="store-link"
          >
            <Image src="/images/bread-logo.jpeg" width={52} height={52} alt="Fakumoya Bakery" className="rounded-full object-cover ring-2 ring-brand-border ring-offset-2 ring-offset-brand-cream" />
            <span className="brand-heading hidden small:block text-xl tracking-tight">Fakumoya Bakery</span>
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">{children}</div>
      <div className="py-6 w-full flex items-center justify-center text-sm text-brand-secondary/70">
        Secure checkout by Fakumoya Bakery
      </div>
    </div>
  )
}

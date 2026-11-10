import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import Search from "@modules/layout/components/search"
import SideMenu from "@modules/layout/components/side-menu"
import Image from "next/image"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-20 mx-auto border-b duration-200 bg-brand-cream/95 border-brand-border backdrop-blur-md">
        <nav className="content-container text-brand-secondary flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 small:static small:translate-x-0 flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-3 text-brand-secondary"
              data-testid="nav-store-link"
            >
              <Image
                src="/images/bread-logo.jpeg"
                width={58}
                height={58}
                alt="Fakumoya Bakery"
                className="h-14 w-14 rounded-full border border-brand-border object-cover"
                priority
              />
              <span className="brand-heading hidden medium:block text-xl">
                Fakumoya Bakery
              </span>
            </LocalizedClientLink>
          </div>

          <div className="hidden small:flex items-center gap-x-6 h-full flex-1 justify-center">
            <LocalizedClientLink className="hover:text-brand-primary" href="/">
              Home
            </LocalizedClientLink>
            <LocalizedClientLink className="hover:text-brand-primary" href="/store">
              Shop
            </LocalizedClientLink>
            <LocalizedClientLink className="hover:text-brand-primary" href="/about">
              Our Story
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-4 small:gap-x-6 h-full flex-1 basis-0 justify-end">
            <Search />
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="hover:text-brand-primary"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-brand-primary flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}

import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

export default async function Footer() {
  const [{ collections }, productCategories] = await Promise.all([
    listCollections({ fields: "id,handle,title" }),
    listCategories({ fields: "id,name,handle,parent_category_id" }),
  ])
  const linkClass = "text-[#f3dfc0] transition-colors hover:text-brand-accent"

  return (
    <footer className="w-full border-t border-brand-border bg-brand-secondary text-white">
      <div className="content-container">
        <div className="grid gap-12 py-16 small:grid-cols-[1.2fr_2fr] small:py-24">
          <div className="max-w-xs">
            <LocalizedClientLink href="/" className="flex items-center gap-3">
              <Image src="/images/bread-logo.jpeg" width={64} height={64} alt="Fakumoya Bakery" className="rounded-full border border-white/20" />
              <span className="brand-heading text-2xl">Fakumoya Bakery</span>
            </LocalizedClientLink>
            <p className="brand-heading mt-6 text-3xl text-brand-accent">We are breadwinners.</p>
            <p className="mt-3 text-sm leading-6 text-[#f3dfc0]">Freshly baked in Seshego, Polokwane. Borotho for the kasi since 2016.</p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm small:grid-cols-4">
            {productCategories?.length > 0 && <div><h2 className="mb-4 font-semibold text-brand-accent">Categories</h2><ul className="grid gap-3">{productCategories.filter((c) => !c.parent_category_id).slice(0, 6).map((c) => <li key={c.id}><LocalizedClientLink className={linkClass} href={`/categories/${c.handle}`}>{c.name}</LocalizedClientLink></li>)}</ul></div>}
            {collections?.length > 0 && <div><h2 className="mb-4 font-semibold text-brand-accent">Collections</h2><ul className="grid gap-3">{collections.slice(0, 6).map((c) => <li key={c.id}><LocalizedClientLink className={linkClass} href={`/collections/${c.handle}`}>{c.title}</LocalizedClientLink></li>)}</ul></div>}
            <div><h2 className="mb-4 font-semibold text-brand-accent">Customer care</h2><ul className="grid gap-3"><li><LocalizedClientLink className={linkClass} href="/shipping">Shipping information</LocalizedClientLink></li><li><LocalizedClientLink className={linkClass} href="/returns">Return policy</LocalizedClientLink></li><li><LocalizedClientLink className={linkClass} href="/contact">Contact</LocalizedClientLink></li><li><LocalizedClientLink className={linkClass} href="/privacy">Privacy policy</LocalizedClientLink></li></ul></div>
            <div><h2 className="mb-4 font-semibold text-brand-accent">Bakery</h2><ul className="grid gap-3"><li><LocalizedClientLink className={linkClass} href="/store">Shop</LocalizedClientLink></li><li><LocalizedClientLink className={linkClass} href="/about">Our Story</LocalizedClientLink></li><li><LocalizedClientLink className={linkClass} href="/account">My account</LocalizedClientLink></li><li><LocalizedClientLink className={linkClass} href="/terms">Terms of service</LocalizedClientLink></li></ul></div>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-white/15 py-8 text-xs text-[#f3dfc0] small:flex-row small:justify-between"><span>© {new Date().getFullYear()} Fakumoya Bakery. All rights reserved.</span><span>Seshego, Polokwane</span></div>
      </div>
    </footer>
  )
}

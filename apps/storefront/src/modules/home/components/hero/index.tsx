import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import Image from "next/image"

const Hero = () => {
  return (
    <section className="border-b border-brand-border bg-brand-parchment overflow-hidden">
      <div className="content-container grid min-h-[620px] grid-cols-1 items-center gap-8 py-12 small:grid-cols-2 small:py-20">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">
            Seshego · Est. 2016
          </p>
          <h1 className="brand-heading text-5xl leading-[1.03] text-brand-secondary xsmall:text-6xl medium:text-7xl">
            Fresh Bread Delivered to Your Door.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#68503b]">
            Freshly baked bread and neighbourhood favourites, made with care
            in Seshego, Polokwane.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LocalizedClientLink href="/store">
              <Button size="large">Shop the Bakery</Button>
            </LocalizedClientLink>
            <LocalizedClientLink href="/about">
              <Button size="large" variant="secondary">Our Story</Button>
            </LocalizedClientLink>
          </div>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden rounded-[2rem] border border-brand-border bg-brand-cream shadow-[0_30px_80px_rgb(40_24_14_/_0.18)]">
          <Image
            src="/images/bread-logo.jpeg"
            alt="Fakumoya Bakery bread mark with golden loaves and wheat"
            fill
            sizes="(max-width: 1024px) 90vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  )
}

export default Hero

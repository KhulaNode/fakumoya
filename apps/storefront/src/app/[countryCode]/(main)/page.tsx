import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import { listCollections } from "@lib/data/collections"
import { getRegion, listRegions } from "@lib/data/regions"
import { toJsonLd } from "@lib/util/product-structured-data"
import { getSiteOrigin, listCountryCodes, STORE_NAME } from "@lib/util/site"
import { buildRegionsReturnPolicies } from "@lib/util/store-policies"
import { Button } from "@modules/common/components/ui"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const [origin, regions] = await Promise.all([getSiteOrigin(), listRegions()])

  return {
    title: "Fresh borotho from Seshego",
    description: "Freshly baked bread and kasi favourites from Seshego, Polokwane.",
    alternates: {
      canonical: `${origin}/${countryCode}`,
      languages: {
        ...Object.fromEntries(
          listCountryCodes(regions).map((code) => [
            `en-${code.toUpperCase()}`,
            `${origin}/${code}`,
          ])
        ),
        "x-default": origin,
      },
    },
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  const [origin, regions] = await Promise.all([getSiteOrigin(), listRegions()])
  const homeUrl = `${origin}/${countryCode}`
  const returnPolicies = buildRegionsReturnPolicies(regions)
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: STORE_NAME,
      url: origin,
      ...(returnPolicies.length
        ? { hasMerchantReturnPolicy: returnPolicies }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: STORE_NAME,
      url: homeUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${homeUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(structuredData) }}
      />
      <Hero />
      <section className="py-12 small:py-20" aria-labelledby="featured-heading">
        <div className="content-container mb-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary">From our ovens</p>
          <h2 id="featured-heading" className="brand-heading mt-2 text-4xl text-brand-secondary small:text-5xl">Kasi favourites</h2>
        </div>
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </section>
      <section
        className="border-y border-brand-border bg-brand-parchment py-14 small:py-20"
        aria-labelledby="subscription-heading"
      >
        <div className="content-container flex flex-col items-start justify-between gap-8 small:flex-row small:items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">
              Fresh from our ovens
            </p>
            <h2
              id="subscription-heading"
              className="brand-heading mt-3 text-4xl leading-tight text-brand-secondary small:text-5xl"
            >
              Fresh Bread, Delivered Regularly.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-8 text-[#68503b]">
              Enjoy freshly baked Fakumoya bread delivered to your doorstep
              three times a week with our convenient monthly subscription.
            </p>
          </div>
          <LocalizedClientLink
            href="/subscriptions"
            className="w-full small:w-auto"
          >
            <Button size="large" className="w-full small:w-auto">
              Subscribe to Fresh Bread
            </Button>
          </LocalizedClientLink>
        </div>
      </section>
      <section className="bg-brand-secondary py-16 text-white small:py-24">
        <div className="content-container grid items-center gap-10 small:grid-cols-[0.85fr_1.15fr]">
          <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-[2rem] border border-white/20">
            <Image
              src="/images/tshepo-face-and-bread-logo.jpeg"
              alt="Fakumoya Bakery heritage logo, established 2016"
              fill
              sizes="(max-width: 1024px) 90vw, 40vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-accent">Proudly local since 2016</p>
            <h2 className="brand-heading mt-4 text-5xl leading-tight small:text-6xl">We are breadwinners.</h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#f3dfc0]">
              Fakumoya Bakery is part of the rhythm of Seshego: warm loaves,
              familiar favourites and good food made for the kasi.
            </p>
            <LocalizedClientLink href="/about" className="mt-8 inline-flex font-semibold text-brand-accent underline decoration-2 underline-offset-8">
              Read our story
            </LocalizedClientLink>
          </div>
        </div>
      </section>
    </>
  )
}

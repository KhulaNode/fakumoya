import { Metadata } from "next"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Meet Fakumoya Bakery, a neighbourhood bakery serving Seshego since 2016.",
}

export default function AboutPage() {
  return (
    <main>
      <section className="bg-brand-parchment py-16 small:py-24">
        <div className="content-container grid items-center gap-10 small:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">
              Our story
            </p>
            <h1 className="brand-heading mt-4 text-5xl leading-tight text-brand-secondary small:text-7xl">
              A neighbourhood bakery with heart.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#68503b]">
              Fakumoya Bakery was established in 2016 in Seshego, Polokwane.
              We bake for the people around us, with the warmth, pride and
              everyday care a neighbourhood bakery should bring.
            </p>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-brand-border bg-brand-cream">
            <Image
              src="/images/tshepo-face-logo-2.jpeg"
              alt="Fakumoya Bakery portrait mark framed by wheat"
              fill
              sizes="(max-width: 1024px) 90vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>
      <section className="py-16 small:py-24">
        <div className="content-container grid items-center gap-10 small:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-brand-border bg-white">
            <Image
              src="/images/tshepo-face-logo-1.jpeg"
              alt="Fakumoya Bakery heritage portrait and slogan"
              fill
              sizes="(max-width: 1024px) 90vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="small:pl-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">
              Our promise
            </p>
            <h2 className="brand-heading mt-4 text-5xl text-brand-secondary">
              We are breadwinners.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#68503b]">
              The line is more than a slogan. It speaks to honest work, local
              pride and the simple joy of putting fresh bread on the table.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

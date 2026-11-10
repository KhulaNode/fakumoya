import { Metadata } from "next"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "The story of Fakumoya Bakery, founded by Tshepo Palafala in 2016.",
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
              A Kasi Bakery with Heart
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#68503b]">
              Fakumoya Bakery is more than a place where bread is made. It&apos;s
              a story of humble beginnings, hard work, and a dream built from
              the streets of Polokwane.
            </p>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#68503b]">
              Founded in 2016 by <strong>Tshepo Palafala</strong>, Fakumoya
              grew from selling baked goods on the streets to becoming a bakery
              rooted in the heart of the community. What began with
              determination and a belief in making good bread has grown into
              something the people of Seshego can proudly call their own.
            </p>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#68503b]">
              Through challenges and changing times, Tshepo has held on to one
              belief: <strong>quality should never be a luxury reserved for a few.</strong>{" "}
              Every household deserves good, fresh bread, baked with care and
              sold with pride.
            </p>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#68503b]">
              <em>Ke ya rena</em> — it belongs to us. Fakumoya carries the
              spirit of kasi: hard work, resilience, generosity, and the belief
              that something great can grow from humble beginnings.
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
              Our Promise
            </p>
            <h2 className="brand-heading mt-4 text-5xl text-brand-secondary">
              We Are Breadwinners.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#68503b]">
              At Fakumoya, quality isn&apos;t something we compromise on. It&apos;s the
              reason we wake up every morning, prepare our dough, and put our
              hearts into every bake.
            </p>
            <p className="mt-5 text-lg leading-8 text-[#68503b]">
              We believe good bread should be fresh, delicious, affordable, and
              made with the same care we&apos;d give our own families. From the
              first loaf to the last, every product carries our commitment to
              consistency, honest craftsmanship, and the people who trust us.
            </p>
            <p className="mt-5 text-lg leading-8 text-[#68503b]">
              Because we&apos;re not just baking bread. <strong>We&apos;re earning our
              community&apos;s trust, one loaf at a time.</strong>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { DM_Serif_Display, Inter } from "next/font/google"
import "styles/globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Fakumoya Bakery",
    template: "%s | Fakumoya Bakery",
  },
  description:
    "Freshly baked bread and kasi favourites from Seshego, Polokwane.",
  icons: {
    icon: "/images/tshepo-face-and-bread-logo.jpeg",
    apple: "/images/tshepo-face-and-bread-logo.jpeg",
  },
  openGraph: {
    title: "Fakumoya Bakery",
    description:
      "Freshly baked bread and kasi favourites from Seshego, Polokwane.",
    type: "website",
    images: [
      {
        url: "/images/bread-logo.jpeg",
        width: 1254,
        height: 1254,
        alt: "Fakumoya Bakery bread mark",
      },
    ],
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <head>
        <link rel="ucp" href="/.well-known/ucp" />
      </head>
      <body className={`${inter.variable} ${dmSerif.variable} font-sans antialiased`}>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}

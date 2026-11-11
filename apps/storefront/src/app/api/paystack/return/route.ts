import { NextResponse } from "next/server"

export async function GET() {
  const baseUrl =
    process.env.STOREFRONT_URL ||
    process.env.NEXT_PUBLIC_BASE_URL

  if (!baseUrl) {
    return NextResponse.json(
      { error: "Storefront URL is not configured" },
      { status: 500 }
    )
  }

  const url = new URL("/", baseUrl)
  url.searchParams.set("payment", "processing")

  return NextResponse.redirect(url)
}
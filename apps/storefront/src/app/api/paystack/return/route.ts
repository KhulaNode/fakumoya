import { NextRequest, NextResponse } from "next/server"

// Paystack returns the shopper here after checkout. The webhook, not this
// browser redirect, is authoritative for payment completion.
export async function GET(request: NextRequest) {
  const url = new URL("/", request.url)
  url.searchParams.set("payment", "processing")
  return NextResponse.redirect(url)
}

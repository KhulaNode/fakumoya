import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = new URL("/", request.url)
  url.searchParams.set("subscription", "processing")
  return NextResponse.redirect(url)
}

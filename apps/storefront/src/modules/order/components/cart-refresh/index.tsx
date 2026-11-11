"use client"

import { CART_UPDATED_EVENT } from "@lib/util/cart-events"
import { useEffect } from "react"

export default function CartRefresh() {
  useEffect(() => {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT))
  }, [])

  return null
}

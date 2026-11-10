import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
  baseUrl: import.meta.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  debug: import.meta.env.NODE_ENV === "development",
  // Medusa Admin authenticates with its connect.sid session cookie. Without
  // this setting, custom /admin routes are sent as unauthenticated requests.
  auth: {
    type: "session",
    fetchCredentials: "include",
  },
})

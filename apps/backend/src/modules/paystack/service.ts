import crypto from "crypto"
import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"

type PaystackOptions = {
  secret_key?: string
  storefront_url?: string
  bakery_subaccount_code?: string
  revenue_share_secret?: string
}

type PaystackTransaction = {
  id?: number
  reference: string
  status: string
  amount: number
  currency: string
  authorization_url?: string
  paid_at?: string
  gateway_response?: string
}

type PaystackResponse<T> = {
  status: boolean
  message: string
  data?: T
}

const PAYSTACK_API = "https://api.paystack.co"

const asString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined

const asNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const timingSafeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left, "utf8")
  const rightBuffer = Buffer.from(right, "utf8")
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

/**
 * Paystack hosted checkout provider. It uses deferred authorization: Paystack's
 * signed charge.success webhook authorizes and completes the Medusa cart.
 */
class PaystackPaymentProvider extends AbstractPaymentProvider<PaystackOptions> {
  static identifier = "paystack"

  private readonly options_: PaystackOptions

  constructor(container: Record<string, unknown>, options: PaystackOptions) {
    super(container, options)
    this.options_ = options
  }

  private get secretKey() {
    return this.options_.secret_key || process.env.PAYSTACK_SECRET_KEY
  }

  private get storefrontUrl() {
    return (this.options_.storefront_url || process.env.STOREFRONT_URL || "").replace(/\/$/, "")
  }

  private requireSecret() {
    if (!this.secretKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Paystack is not configured. Set PAYSTACK_SECRET_KEY before enabling this payment method."
      )
    }
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    this.requireSecret()
    const response = await fetch(`${PAYSTACK_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    })
    const body = (await response.json().catch(() => ({}))) as PaystackResponse<T>

    if (!response.ok || !body.status || !body.data) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        body.message || `Paystack request failed with status ${response.status}`
      )
    }

    return body.data
  }

  private verifyCommissionToken(token: unknown, amount: number) {
    const secret = this.options_.revenue_share_secret || process.env.PAYSTACK_REVENUE_SHARE_SECRET
    if (!secret || typeof token !== "string") {
      return undefined
    }

    const [payload, signature] = token.split(".")
    if (!payload || !signature) return undefined
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex")
    if (!timingSafeEqual(signature, expected)) return undefined

    try {
      const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
        amount?: number
        commission_cents?: number
        expires_at?: number
      }
      const commission = decoded.commission_cents
      if (
        decoded.amount !== amount ||
        typeof commission !== "number" ||
        !Number.isInteger(commission) ||
        commission < 0 ||
        commission > amount ||
        !decoded.expires_at ||
        decoded.expires_at < Date.now()
      ) {
        return undefined
      }
      return commission
    } catch {
      return undefined
    }
  }

  private toSubunit(amount: unknown) {
    return Math.round(asNumber(amount) * 100)
  }

  private async verify(reference: string) {
    return this.request<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`, {
      method: "GET",
    })
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const currentReference = asString(input.data?.reference)
    const checkoutUrl = asString(input.data?.authorization_url)
    if (currentReference && checkoutUrl) {
      return { id: currentReference, data: input.data, status: PaymentSessionStatus.PENDING_AUTHORIZATION }
    }

    const email = asString(input.data?.email) || input.context?.customer?.email
    const sessionId = asString(input.data?.session_id)
    if (!email || !sessionId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Paystack checkout requires the cart email address and payment session."
      )
    }

    const amount = this.toSubunit(input.amount)
    const reference = `FK${crypto.randomUUID().replace(/-/g, "")}`
    const payload: Record<string, unknown> = {
      email,
      amount,
      currency: input.currency_code.toUpperCase(),
      reference,
      callback_url: this.storefrontUrl ? `${this.storefrontUrl}/api/paystack/return` : undefined,
      metadata: {
        session_id: sessionId,
        cart_id: asString(input.data?.cart_id),
        source: "fakumoya-medusa",
      },
    }

    // The commission token is issued by the backend after reading the cart. A
    // browser cannot forge a smaller KhulaNode share because the provider
    // verifies its HMAC and its expiry before sending Paystack split fields.
    const commissionCents = this.verifyCommissionToken(input.data?.commission_token, amount)
    const subaccount = this.options_.bakery_subaccount_code || process.env.PAYSTACK_BAKERY_SUBACCOUNT_CODE
    if (subaccount && commissionCents !== undefined) {
      payload.subaccount = subaccount
      payload.transaction_charge = commissionCents
      payload.bearer = "account"
    }

    const initialized = await this.request<{
      reference: string
      authorization_url: string
      access_code?: string
    }>("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    return {
      id: initialized.reference,
      status: PaymentSessionStatus.PENDING_AUTHORIZATION,
      data: {
        reference: initialized.reference,
        authorization_url: initialized.authorization_url,
        access_code: initialized.access_code,
        currency_code: input.currency_code,
        amount,
        session_id: sessionId,
        cart_id: asString(input.data?.cart_id),
        commission_cents: commissionCents,
      },
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const reference = asString(input.data?.reference)
    if (!reference) return { status: PaymentSessionStatus.ERROR, data: input.data }
    const transaction = await this.verify(reference)
    return {
      status: transaction.status === "success" ? PaymentSessionStatus.CAPTURED : PaymentSessionStatus.PENDING_AUTHORIZATION,
      data: { ...input.data, paystack_transaction_id: transaction.id, paid_at: transaction.paid_at },
    }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    return this.authorizePayment(input)
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    // A Paystack hosted transaction cannot be safely repriced. Returning the
    // old data causes Medusa to create a fresh session only when needed.
    return { data: input.data, status: PaymentSessionStatus.PENDING }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: input.data }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return { data: input.data }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const reference = asString(input.data?.reference)
    if (!reference) return { data: input.data }
    const transaction = await this.verify(reference)
    return { data: { ...input.data, paystack_transaction_id: transaction.id, paid_at: transaction.paid_at } }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const reference = asString(input.data?.reference)
    if (!reference) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Paystack reference is required to refund a payment.")
    }
    await this.request("/refund", {
      method: "POST",
      body: JSON.stringify({ transaction: reference, amount: this.toSubunit(input.amount) }),
    })
    return { data: input.data }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const signature = asString(payload.headers["x-paystack-signature"])
    const raw = Buffer.isBuffer(payload.rawData) ? payload.rawData.toString("utf8") : payload.rawData
    if (!signature || !this.secretKey) return { action: PaymentActions.NOT_SUPPORTED }
    const expected = crypto.createHmac("sha512", this.secretKey).update(raw).digest("hex")
    if (!timingSafeEqual(signature, expected)) return { action: PaymentActions.NOT_SUPPORTED }

    const event = payload.data as {
      event?: string
      data?: { amount?: number; metadata?: { session_id?: string }; reference?: string }
    }
    const sessionId = event.data?.metadata?.session_id
    if (!sessionId) return { action: PaymentActions.NOT_SUPPORTED }

    const amount = new BigNumber((event.data?.amount || 0) / 100)
    if (event.event === "charge.success") {
      return { action: PaymentActions.SUCCESSFUL, data: { session_id: sessionId, amount } }
    }
    if (event.event === "charge.failed") {
      return { action: PaymentActions.FAILED, data: { session_id: sessionId, amount } }
    }
    return { action: PaymentActions.NOT_SUPPORTED }
  }
}

export default PaystackPaymentProvider

import crypto from 'node:crypto';

const PAYSTACK_API = 'https://api.paystack.co';

export type PaystackStatus = 'success' | 'failed' | 'abandoned' | string;

export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  const supplied = Buffer.from(signature, 'utf8');
  const calculated = Buffer.from(expected, 'utf8');
  return supplied.length === calculated.length && crypto.timingSafeEqual(supplied, calculated);
}

export async function initializePaystackTransaction(input: {
  email: string; amountMinor: number; reference: string; metadata: Record<string, unknown>;
}) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not configured');
  const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, amount: input.amountMinor, currency: 'ZAR', callback_url: `${process.env.APP_BASE_URL ?? 'http://localhost:3000'}/checkout/complete` }),
  });
  const data = await response.json() as { status?: boolean; message?: string; data?: { authorization_url: string; reference: string } };
  if (!response.ok || !data.status || !data.data?.authorization_url) throw new Error(data.message ?? `Paystack returned ${response.status}`);
  return data.data;
}

export async function verifyPaystackTransaction(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not configured');
  const response = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secret}` } });
  const data = await response.json() as { status?: boolean; message?: string; data?: { status: PaystackStatus; amount: number; currency: string; paid_at?: string } };
  if (!response.ok || !data.status || !data.data) throw new Error(data.message ?? `Paystack returned ${response.status}`);
  return data.data;
}

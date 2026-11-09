import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { initializePaystackTransaction } from '@/lib/paystack';
import { MONTHLY_BREAD_PLAN } from '@/lib/commerce';

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const phone = String(form.get('phone') ?? '').trim();
  const breadType = String(form.get('breadType') ?? 'mixed');
  if (!email || !email.includes('@') || !phone) return NextResponse.json({ error: 'A valid email and phone number are required.' }, { status: 400 });
  if (!['white', 'brown', 'mixed'].includes(breadType)) return NextResponse.json({ error: 'Invalid bread preference.' }, { status: 400 });
  const reference = `faku_sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  try {
    const checkout = await initializePaystackTransaction({ email, amountMinor: MONTHLY_BREAD_PLAN.amountMinor, reference, metadata: { type: 'subscription', planId: MONTHLY_BREAD_PLAN.id, breadType, phone } });
    return NextResponse.redirect(checkout.authorization_url, 303);
  } catch (error) {
    console.error('[subscribe]', error);
    return NextResponse.json({ error: 'Unable to start checkout. Please try again.' }, { status: 502 });
  }
}

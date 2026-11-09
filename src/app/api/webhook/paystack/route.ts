import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MONTHLY_BREAD_PLAN, selectExactlyTwelveDeliveryDates } from '@/lib/commerce';
import { verifyPaystackSignature } from '@/lib/paystack';

type Event = { event?: string; data?: { reference?: string; amount?: number; currency?: string; status?: string; paid_at?: string; customer?: { email?: string; customer_code?: string }; metadata?: { type?: string; planId?: string; breadType?: string } } };

export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verifyPaystackSignature(raw, request.headers.get('x-paystack-signature'))) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  let event: Event;
  try { event = JSON.parse(raw) as Event; } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const data = event.data;
  if (!data?.reference || !data.amount || data.currency !== 'ZAR') return NextResponse.json({ error: 'Invalid payment payload' }, { status: 400 });
  if (event.event !== 'charge.success' && event.event !== 'charge.failed') return NextResponse.json({ received: true });

  const status = event.event === 'charge.success' ? 'PAID' : 'FAILED';
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.paymentEvent.findUnique({ where: { reference: data.reference } });
      if (existing?.processedAt) return;
      const payment = existing ?? await tx.paymentEvent.create({ data: { reference: data.reference!, eventType: event.event!, amountMinor: data.amount!, currency: data.currency!, status, payload: event } });
      if (status !== 'PAID') { await tx.paymentEvent.update({ where: { id: payment.id }, data: { status, processedAt: new Date() } }); return; }
      if (data.metadata?.type !== 'subscription' || data.amount !== MONTHLY_BREAD_PLAN.amountMinor) throw new Error('Payment does not reconcile to a known subscription plan');
      const email = data.customer?.email;
      if (!email) throw new Error('Subscription payment has no customer email');
      const subscription = await tx.subscription.upsert({ where: { id: data.reference }, create: { id: data.reference, email, paystackCustomerId: data.customer?.customer_code, status: 'ACTIVE' }, update: { status: 'ACTIVE', paystackCustomerId: data.customer?.customer_code } });
      const cycleStart = data.paid_at ? new Date(data.paid_at) : new Date();
      const cycleEnd = new Date(cycleStart); cycleEnd.setUTCMonth(cycleEnd.getUTCMonth() + 1); cycleEnd.setUTCSeconds(cycleEnd.getUTCSeconds() - 1);
      const entitlement = await tx.entitlement.upsert({ where: { paymentEventId: payment.id }, create: { subscriptionId: subscription.id, paymentEventId: payment.id, cycleStart, cycleEnd }, update: {} });
      const dates = selectExactlyTwelveDeliveryDates(cycleStart, cycleEnd);
      for (const date of dates) await tx.delivery.upsert({ where: { entitlementId_deliveryDate: { entitlementId: entitlement.id, deliveryDate: date } }, create: { entitlementId: entitlement.id, deliveryDate: date, breadType: data.metadata?.breadType ?? 'mixed' }, update: {} });
      await tx.paymentEvent.update({ where: { id: payment.id }, data: { status, processedAt: new Date() } });
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[paystack webhook]', error);
    return NextResponse.json({ error: 'Payment could not be reconciled' }, { status: 422 });
  }
}

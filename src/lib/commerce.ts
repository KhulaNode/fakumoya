export const MONTHLY_BREAD_PLAN = {
  id: 'bread-monthly',
  name: 'Monthly Bread Plan',
  amountMinor: 62000,
  currency: 'ZAR',
  loaves: 24,
  deliveries: 12,
  deliveryQuantity: 2,
  deliveryDays: ['Monday', 'Wednesday', 'Friday'],
} as const;

export type Product = { slug: string; name: string; category: string; priceMinor: number; unit: string };

export const PRODUCTS: Product[] = [
  { slug: 'standard-bread', name: 'Standard bread loaf', category: 'Bread', priceMinor: 1500, unit: 'loaf' },
  { slug: 'cross-buns', name: 'Cross buns', category: 'Bread & rolls', priceMinor: 1999, unit: 'pack of 6' },
  { slug: 'burger-buns', name: 'Burger buns', category: 'Bread & rolls', priceMinor: 1499, unit: 'pack of 6' },
  { slug: 'hot-dog-rolls', name: 'Hot dog rolls', category: 'Bread & rolls', priceMinor: 1499, unit: 'pack of 6' },
  { slug: 'sugar-free-buns', name: 'Sugar-free buns', category: 'Bread & rolls', priceMinor: 1499, unit: 'pack' },
  { slug: 'banana-bread', name: 'Banana bread', category: 'Bakes', priceMinor: 1499, unit: '300g' },
  { slug: 'jumbo-banana-muffin', name: 'Jumbo banana muffin', category: 'Bakes', priceMinor: 399, unit: 'each' },
  { slug: 'banana-muffins', name: 'Banana muffins', category: 'Bakes', priceMinor: 2499, unit: 'pack of 6' },
  { slug: 'oldene-crispy-scones-3', name: 'Oldéne Crispy Scones', category: 'Bakes', priceMinor: 999, unit: 'pack of 3' },
  { slug: 'oldene-crispy-scones-5l', name: 'Oldéne Crispy Scones', category: 'Bakes', priceMinor: 13499, unit: '5L' },
  { slug: 'more-and-more-butter-biscuits', name: 'More & More Butter Biscuits', category: 'Bakes', priceMinor: 2999, unit: '1L' },
];

export function zar(minor: number) { return `R${(minor / 100).toFixed(2)}`; }

export function commissionForLine(input: { slug: string; quantity: number; unitPriceMinor: number }) {
  const grossMinor = input.quantity * input.unitPriceMinor;
  if (input.slug === 'standard-bread') return { grossMinor, commissionMinor: input.quantity * 300, deliveryMinor: input.quantity * 200 };
  return { grossMinor, commissionMinor: Math.round(grossMinor * 0.1), deliveryMinor: 0 };
}

export function selectExactlyTwelveDeliveryDates(start: Date, end: Date, timezone = 'Africa/Johannesburg'): Date[] {
  void timezone;
  const dates: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end && dates.length < 12) {
    const day = cursor.getUTCDay();
    if (day === 1 || day === 3 || day === 5) dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

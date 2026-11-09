import test from 'node:test';
import assert from 'node:assert/strict';
import { commissionForLine, selectExactlyTwelveDeliveryDates } from '../src/lib/commerce';

test('once-off bread commission allocates R3 commission and R2 delivery per loaf', () => {
  assert.deepEqual(commissionForLine({ slug: 'standard-bread', quantity: 2, unitPriceMinor: 1500 }), { grossMinor: 3000, commissionMinor: 600, deliveryMinor: 400 });
});

test('other products receive ten percent commission', () => {
  assert.deepEqual(commissionForLine({ slug: 'banana-bread', quantity: 1, unitPriceMinor: 1499 }), { grossMinor: 1499, commissionMinor: 150, deliveryMinor: 0 });
});

test('subscription scheduling selects exactly twelve MWF dates when available', () => {
  const dates = selectExactlyTwelveDeliveryDates(new Date('2026-01-01T00:00:00Z'), new Date('2026-02-01T00:00:00Z'));
  assert.equal(dates.length, 12);
  assert.ok(dates.every((date) => [1, 3, 5].includes(date.getUTCDay())));
});

import assert from 'node:assert/strict';

const ALL_ALPHA_EPOCH = '2025-03-27T00:00:00+02:00';

function getAlphaVigilDay(now) {
  return Math.floor((now.getTime() - Date.parse(ALL_ALPHA_EPOCH)) / 86400000) + 1;
}

function formatAlphaVigilNumber(day) {
  const raw = String(Math.max(1, Number(day)));
  const padded = raw.length < 6 ? raw.padStart(6, '0') : raw;
  return padded.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function nextMaputoMidnightDelay(now) {
  const maputoParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Maputo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = Number(part.value);
    return acc;
  }, {});

  const nextMidnightUtc = Date.UTC(
    maputoParts.year,
    maputoParts.month - 1,
    maputoParts.day + 1,
  ) - (2 * 60 * 60 * 1000);

  return Math.max(1000, nextMidnightUtc - now.getTime());
}

assert.equal(getAlphaVigilDay(new Date('2025-03-27T00:00:00+02:00')), 1);
assert.equal(getAlphaVigilDay(new Date('2025-03-27T23:59:59+02:00')), 1);
assert.equal(getAlphaVigilDay(new Date('2025-03-28T00:00:00+02:00')), 2);
assert.equal(getAlphaVigilDay(new Date('2026-03-27T00:00:00+02:00')), 366);
assert.equal(getAlphaVigilDay(new Date('2028-03-27T00:00:00+02:00')), 1097);
assert.equal(getAlphaVigilDay(new Date('2025-03-27T22:00:00Z')), 2);
assert.equal(getAlphaVigilDay(new Date('2025-03-27T17:00:00-03:00')), 1);
assert.equal(getAlphaVigilDay(new Date('2025-03-27T20:00:00Z')), 1);
assert.equal(getAlphaVigilDay(new Date('2025-03-27T20:00:00Z')), getAlphaVigilDay(new Date('2025-03-27T22:00:00+02:00')));
assert.equal(formatAlphaVigilNumber(1), '000 001');
assert.equal(formatAlphaVigilNumber(474), '000 474');
assert.equal(formatAlphaVigilNumber(1245), '001 245');
assert.equal(formatAlphaVigilNumber(999999), '999 999');
assert.equal(formatAlphaVigilNumber(1000000), '1 000 000');

const beforeMidnight = new Date('2025-03-27T23:59:58+02:00');
const delay = nextMaputoMidnightDelay(beforeMidnight);
assert.ok(delay >= 1000 && delay <= 2000);

assert.equal(typeof globalThis.localStorage, 'undefined');

console.log('Alpha Vigil date tests passed');

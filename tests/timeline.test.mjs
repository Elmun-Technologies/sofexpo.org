/**
 * The show timeline (docs/24): a show flips to "past" the day after it closes (Samarkand
 * time), the next show takes its place, and the backend's cabinet select follows the same
 * clock — no hand edit, no deploy.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { events, onTimeline, phaseOf, samarkandToday } from '../src/data/events.ts';
import { archive } from '../src/data/archive.ts';
import { isUpcomingEdition, portalEventsOn, showsOn, samarkandToday as backendToday } from '../scripts/backend/shows.mjs';

const foodera = events.find((e) => e.slug === 'foodera-expo');

test('samarkandToday is UTC+5 on both sides', () => {
  /* 29 Oct 19:30 UTC is already 30 Oct 00:30 in Samarkand */
  const late = new Date('2026-10-29T19:30:00Z');
  assert.equal(samarkandToday(late), '2026-10-30');
  assert.equal(backendToday(late), '2026-10-30');
  assert.equal(samarkandToday(new Date('2026-10-29T18:59:00Z')), '2026-10-29');
});

test('a show is ahead, then live during its days, then past the day after', () => {
  const e = { status: 'open', dates: { start: '2026-10-27', end: '2026-10-29' } };
  assert.equal(phaseOf(e, '2026-10-26'), 'ahead');
  assert.equal(phaseOf(e, '2026-10-27'), 'live');
  assert.equal(phaseOf(e, '2026-10-29'), 'live');
  assert.equal(phaseOf(e, '2026-10-30'), 'past');
});

test('onTimeline turns a finished show into an archive entry without its sales highlight', () => {
  const raw = { ...foodera, status: 'open', highlight: { label: { ru: 'x', en: 'x' }, text: { ru: 'x', en: 'x' } } };
  const before = onTimeline(raw, '2026-10-20');
  assert.equal(before.status, 'open');
  assert.ok(before.highlight);
  const after = onTimeline(raw, '2026-10-30');
  assert.equal(after.status, 'past');
  assert.equal(after.highlight, null);
  assert.equal(raw.status, 'open', 'the source object is not mutated');
});

test('every show finished by the last data update has a post-show report to link to', () => {
  /* pinned, not TODAY: a show that closed last night must not turn CI red — its hero falls
     back to the archive index until the report is written (docs/24 §4) */
  for (const e of events.filter((x) => phaseOf(x, '2026-11-02') === 'past')) {
    assert.ok(archive.some((a) => a.eventSlug === e.slug), `${e.slug} is past but has no archive entry in src/data/archive.ts`);
  }
});

test('announced next editions really are after the edition they follow', () => {
  for (const e of events) {
    if (!e.nextEdition) continue;
    assert.ok(e.nextEdition.start > e.dates.end, `${e.slug}: nextEdition must start after ${e.dates.end}`);
    assert.ok(e.nextEdition.end >= e.nextEdition.start, `${e.slug}: nextEdition ends before it starts`);
  }
});

test('the cabinet stops offering a show the day after it closes', () => {
  const during = new Date('2026-10-29T12:00:00+05:00');
  const after = new Date('2026-10-30T00:05:00+05:00');
  assert.ok(portalEventsOn(during).some((e) => e.slug === 'foodera-expo'));
  assert.ok(!portalEventsOn(after).some((e) => e.slug === 'foodera-expo'));
  assert.ok(portalEventsOn(after).some((e) => e.slug === 'buildpro-expo'));
  assert.ok(portalEventsOn(after).every((e) => !('end' in e)), 'the internal end date is not sent to the client');

  assert.equal(isUpcomingEdition('foodera-expo', 2026, during), true);
  assert.equal(isUpcomingEdition('foodera-expo', 2026, after), false);
  const foodShow = showsOn(after).find((s) => s.slug === 'foodera-expo');
  assert.deepEqual(foodShow.editions, [{ year: 2026, upcoming: false }]);
});

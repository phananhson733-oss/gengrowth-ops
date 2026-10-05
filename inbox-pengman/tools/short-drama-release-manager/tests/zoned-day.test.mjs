import test from 'node:test';
import assert from 'node:assert/strict';
import {zonedDay,zonedDayStart,nextDay} from '../src/zoned-day.mjs';

test('Chicago publication-day boundaries follow both daylight saving changes',()=>{
 assert.equal(zonedDayStart('2026-03-08','America/Chicago'),Date.parse('2026-03-08T06:00:00Z'));
 assert.equal(zonedDayStart(nextDay('2026-03-08'),'America/Chicago')-zonedDayStart('2026-03-08','America/Chicago'),23*3600000);
 assert.equal(zonedDayStart(nextDay('2026-11-01'),'America/Chicago')-zonedDayStart('2026-11-01','America/Chicago'),25*3600000);
 assert.equal(zonedDay('2026-09-25T04:00:00Z','America/Chicago'),'2026-09-24');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GOAL,
  ISLANDS,
  bridgeSolids,
  BACK,
  bonusSpots,
  clockLabel,
  clockSpots,
  fightSpots,
  grantClock,
  freeSpot,
  roamPace,
  mapForward,
  mapMarkerAngle,
  mapView,
  onIsland,
  overlapsSolid,
  whichIsland,
} from '../src/game/phase2layout.js';

test('minimap marker points where Mochi is facing', () => {
  assert.equal(mapMarkerAngle(0), 0);
  const north = mapForward(0);
  assert.ok(north.y < 0);
  assert.ok(Math.abs(north.x) < 1e-6);
  const east = mapForward(Math.PI / 2);
  assert.ok(east.x > 0.9);
  assert.ok(Math.abs(east.y) < 1e-6);
  assert.ok(mapMarkerAngle(Math.PI / 2) > 0);
  const west = mapForward(-Math.PI / 2);
  assert.ok(west.x < -0.9);
});

test('minimap frames only the island under Mochi', () => {
  const home = mapView(0, -20);
  assert.equal(home.island.name, 'Contract Market');
  assert.equal(home.onBridge, false);
  assert.equal(home.bridge, null);
  assert.ok(home.span < ISLANDS[0].r * 1.2);
  assert.equal(home.exits.length, 1);
  assert.ok(home.exits[0].east);
  assert.ok(home.exits[0].x > ISLANDS[0].r - 1);

  const port = mapView(ISLANDS[1].cx, 12);
  assert.equal(port.island.name, 'Oracle Port');
  assert.equal(port.exits.length, 2);

  const rally = mapView(ISLANDS[2].cx, 4);
  assert.equal(rally.island.name, 'Rally Square');
  assert.equal(rally.exits.length, 1);
  assert.equal(rally.exits[0].east, false);

  const mid = (ISLANDS[0].cx + ISLANDS[1].cx) / 2;
  const crossing = mapView(mid, 0);
  assert.equal(crossing.onBridge, true);
  assert.ok(crossing.bridge);
  assert.ok(crossing.span > ISLANDS[0].r);
  assert.equal(crossing.island.name, 'Oracle Port');

  const leaving = mapView(ISLANDS[0].r + 4, 0);
  assert.equal(leaving.onBridge, true);
  assert.equal(leaving.island.name, 'Contract Market');
});

test('the course is 45 conflicts across three linked islands', () => {
  assert.equal(GOAL, 45);
  assert.equal(ISLANDS.length, 3);
  const spots = fightSpots();
  assert.equal(spots.length, 45);
  for (const isle of ISLANDS) {
    const n = spots.filter((s) => s.island === isle.index).length;
    assert.ok(n >= 10 && n <= 20, `${isle.name} has ${n}`);
  }
  const bridges = bridgeSolids();
  assert.equal(bridges.length, 2);
  const gap = { x: (ISLANDS[0].cx + ISLANDS[1].cx) / 2, z: 0 };
  assert.equal(onIsland(gap.x, gap.z), false);
  assert.equal(whichIsland(gap.x, gap.z), null);
  const deck = bridges[0];
  assert.ok(Math.abs(gap.x - deck.x) <= deck.hw);
  assert.ok(Math.abs(gap.z - deck.z) <= deck.hd);
  assert.equal(ISLANDS[0].name, 'Contract Market');
  assert.equal(ISLANDS[1].name, 'Oracle Port');
  assert.equal(ISLANDS[2].name, 'Rally Square');
  for (const isle of ISLANDS) {
    const mine = spots.filter((s) => s.island === isle.index);
    for (let i = 0; i < mine.length; i++) {
      for (let j = i + 1; j < mine.length; j++) {
        const d = Math.hypot(mine[i].x - mine[j].x, mine[i].z - mine[j].z);
        assert.ok(d > 9, `${isle.name} fights ${i} and ${j} are ${d.toFixed(1)}m apart`);
      }
    }
  }
});

test('fights are spread across heights and only some sit in moats', () => {
  const spots = fightSpots();
  const kinds = new Set(spots.map((spot) => spot.kind));
  assert.ok(kinds.size >= 5);
  const moats = spots.filter((spot) => spot.kind === 'moat');
  assert.ok(moats.length > 0 && moats.length < spots.length / 2);
  assert.ok(spots.some((spot) => spot.y >= 1.5));
  assert.ok(spots.some((spot) => spot.kind === 'bridge' || spot.kind === 'dock'));
  const coins = bonusSpots();
  assert.ok(coins.length >= 6 && coins.length <= 9);
  assert.ok(coins.every((coin) => coin.value === 3));
});

test('clock pickups add time once', () => {
  const clocks = clockSpots();
  assert.equal(clocks.length, 2);
  const port = clocks.find((clock) => clock.island === 1);
  const rally = clocks.find((clock) => clock.island === 2);
  assert.equal(port.seconds, 30);
  assert.equal(port.label, '+0:30');
  assert.equal(rally.seconds, 60);
  assert.equal(rally.label, '+1:00');
  assert.equal(clockLabel(30), '+0:30');
  assert.equal(clockLabel(60), '+1:00');
  const first = grantClock(100, { taken: false, seconds: 30 });
  assert.equal(first.timeLeft, 130);
  assert.equal(first.gained, 30);
  assert.equal(first.label, '+0:30');
  const again = grantClock(first.timeLeft, { taken: true, seconds: 30 });
  assert.equal(again.timeLeft, 130);
  assert.equal(again.gained, 0);
  const minute = grantClock(20, { taken: false, seconds: 60 });
  assert.equal(minute.timeLeft, 80);
  assert.equal(minute.label, '+1:00');
});

test('down walks backwards slower than forward', () => {
  const pace = 12.4;
  assert.equal(roamPace({ forward: false, back: true }, pace, BACK), -BACK);
  assert.ok(BACK < pace);
  assert.equal(roamPace({ forward: true, back: true }, pace, BACK), pace);
  assert.equal(roamPace({ forward: false, back: false }, pace), 0);
});

test('respawn nudges out of a solid and stays put on clear floor', () => {
  const solids = [{ x: 2, z: 4, hw: 1.1, hd: 0.8, top: 1.4 }];
  const blocked = freeSpot(2, 4, solids);
  assert.equal(overlapsSolid(blocked.x, blocked.z, solids), false);
  const open = freeSpot(12, -8, solids);
  assert.deepEqual(open, { x: 12, z: -8 });
  const deck = [{ x: 0, z: 0, hw: 4, hd: 2, top: 0.12 }];
  assert.equal(overlapsSolid(0, 0, deck), false);
});

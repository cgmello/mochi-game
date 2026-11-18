export const RUN_SECONDS = 300;
export const GOAL = 45;
export const ISLAND_R = 68;

export const ISLANDS = [
  { index: 0, id: 'market', name: 'Contract Market', cx: 0, cz: 0, r: ISLAND_R, map: '#ff4db2', floor: 'pink', kind: 'market', accent: 0xff4db2, fog: 0x5a1848, hemi: 0xff7ad4, sun: 0xff8ac8 },
  { index: 1, id: 'harbor', name: 'Oracle Port', cx: 196, cz: 0, r: ISLAND_R, map: '#2ad4c8', floor: 'grate', kind: 'harbor', accent: 0x2ad4c8, fog: 0x0a4a58, hemi: 0x7af6ff, sun: 0x9aefff },
  { index: 2, id: 'rally', name: 'Rally Square', cx: 392, cz: 0, r: ISLAND_R, map: '#ff9a2a', floor: 'pcb', kind: 'rally', accent: 0xff8a1a, fog: 0x7a3410, hemi: 0xffb15a, sun: 0xffb15a },
];

export const BACK = 4.8;

const FIGHTS = {
  market: [
    [-42, 22, 0, 'alley'], [-24, 36, 0.85, 'crate'], [-4, 40, 0.14, 'moat'], [22, 30, 1.75, 'rack'],
    [42, 16, 0, 'corner'], [-48, 2, 0.12, 'bridge'], [-26, 4, 1.35, 'platform'], [6, 8, 0, 'alley'],
    [28, 2, 0.85, 'crate'], [50, -6, 0.12, 'bridge'], [-36, -20, 0.14, 'moat'], [-10, -24, 1.75, 'rack'],
    [16, -18, 0, 'alley'], [38, -30, 1.35, 'platform'], [-18, -44, 0, 'corner'],
  ],
  harbor: [
    [-64, 22, 0.32, 'dock'], [-30, 38, 1.75, 'rack'], [-6, 46, 0.14, 'moat'], [20, 34, 0.85, 'crate'],
    [46, 18, 1.35, 'platform'], [-48, -8, 0.32, 'dock'], [-18, 10, 0, 'corner'], [10, 14, 1.75, 'rack'],
    [40, 2, 0.12, 'bridge'], [58, -16, 0.85, 'crate'], [-32, -26, 0, 'alley'], [-6, -30, 1.35, 'platform'],
    [22, -24, 0.14, 'moat'], [70, -18, 0.32, 'dock'], [-20, -48, 1.75, 'rack'],
  ],
  rally: [
    [-40, 30, 1.35, 'terrace'], [-14, 38, 0.9, 'stage'], [14, 34, 1.75, 'rack'], [40, 22, 0, 'corner'],
    [-48, 8, 0.85, 'crate'], [-16, 10, 0.14, 'moat'], [12, 6, 0.9, 'stage'], [46, -2, 0.12, 'bridge'],
    [28, -16, 1.35, 'terrace'], [-38, -18, 0, 'alley'], [-10, -22, 1.75, 'rack'], [16, -28, 0.85, 'crate'],
    [40, -34, 0.14, 'moat'], [-22, -44, 1.35, 'platform'], [4, -42, 0, 'corner'],
  ],
};

const BONUS = [
  { island: 0, lx: -32, lz: 12, y: 1.65 },
  { island: 0, lx: 20, lz: -36, y: 1.55 },
  { island: 1, lx: -8, lz: 22, y: 1.7 },
  { island: 1, lx: 48, lz: -30, y: 1.5 },
  { island: 1, lx: -44, lz: 36, y: 1.6 },
  { island: 2, lx: 2, lz: 20, y: 1.65 },
  { island: 2, lx: -30, lz: -6, y: 1.45 },
];

export const MAP = { originX: 196, originZ: 0, span: 290 };

export function bridgeSolids() {
  const out = [];
  for (let i = 0; i < ISLANDS.length - 1; i++) {
    const a = ISLANDS[i];
    const b = ISLANDS[i + 1];
    const x0 = a.cx + a.r - 8;
    const x1 = b.cx - b.r + 8;
    out.push({
      x: (x0 + x1) / 2,
      z: 0,
      hw: (x1 - x0) / 2,
      hd: 2.15,
      top: 0.12,
      from: a.id,
      to: b.id,
    });
  }
  return out;
}

export function fightSpots() {
  const spots = [];
  for (const isle of ISLANDS) {
    for (const [lx, lz, y, kind] of FIGHTS[isle.kind]) {
      spots.push({
        x: isle.cx + lx,
        z: isle.cz + lz,
        lx,
        lz,
        y,
        kind,
        island: isle.index,
      });
    }
  }
  return spots;
}

export function clusterCenters() {
  return fightSpots().filter((spot) => spot.kind === 'moat');
}

export function bonusSpots() {
  return BONUS.map((spot) => {
    const isle = ISLANDS[spot.island];
    return { x: isle.cx + spot.lx, z: isle.cz + spot.lz, y: spot.y, value: 3, island: spot.island };
  });
}

export function roamPace(holds, pace, backPace = BACK) {
  if (holds.forward) return pace;
  if (holds.back) return -backPace;
  return 0;
}

export function overlapsSolid(x, z, solids, radius = 0.45) {
  return solids.some((solid) => {
    if (!solid || solid.dead) return false;
    if (solid.top != null && solid.top <= 0.2) return false;
    return Math.abs(x - solid.x) <= solid.hw + radius && Math.abs(z - solid.z) <= solid.hd + radius;
  });
}

export function freeSpot(x, z, solids, radius = 0.45) {
  if (!overlapsSolid(x, z, solids, radius)) return { x, z };
  for (let ring = 1; ring <= 10; ring++) {
    const dist = 0.65 * ring;
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2 + ring;
      const nx = x + Math.cos(ang) * dist;
      const nz = z + Math.sin(ang) * dist;
      if (!overlapsSolid(nx, nz, solids, radius)) return { x: nx, z: nz };
    }
  }
  return { x, z: z - 3 };
}

export function onIsland(x, z) {
  return ISLANDS.some((isle) => Math.hypot(x - isle.cx, z - isle.cz) <= isle.r);
}

export function whichIsland(x, z) {
  return ISLANDS.find((isle) => Math.hypot(x - isle.cx, z - isle.cz) <= isle.r - 10) || null;
}

export function mapMarkerAngle(yaw) {
  return yaw;
}

export function mapView(x, z) {
  const bridges = bridgeSolids();
  const standing = ISLANDS.find((isle) => Math.hypot(x - isle.cx, z - isle.cz) <= isle.r);
  let onBridge = false;
  let bridge = null;
  let island = standing;
  if (!island) {
    let best = null;
    let bestD = Infinity;
    for (const deck of bridges) {
      const dx = Math.max(Math.abs(x - deck.x) - deck.hw, 0);
      const dz = Math.max(Math.abs(z - deck.z) - deck.hd, 0);
      const d = Math.hypot(dx, dz);
      if (d < bestD) {
        bestD = d;
        best = deck;
      }
    }
    if (best && bestD < 14) {
      onBridge = true;
      bridge = best;
      const from = ISLANDS.find((isle) => isle.id === best.from);
      const to = ISLANDS.find((isle) => isle.id === best.to);
      const fromD = Math.hypot(x - from.cx, z - from.cz);
      const toD = Math.hypot(x - to.cx, z - to.cz);
      island = fromD < toD ? from : toD < fromD ? to : (x >= best.x ? to : from);
    } else {
      island = ISLANDS.slice().sort((a, b) => Math.hypot(x - a.cx, z - a.cz) - Math.hypot(x - b.cx, z - b.cz))[0];
    }
  }
  const exits = bridges
    .filter((deck) => deck.from === island.id || deck.to === island.id)
    .map((deck) => {
      const east = deck.from === island.id;
      return { x: island.cx + (east ? island.r : -island.r), z: island.cz, east };
    });
  const margin = island.r * 1.08;
  const reach = Math.hypot(x - island.cx, z - island.cz);
  const span = onBridge ? Math.max(margin, reach * 1.12) : margin;
  return {
    island: { x: island.cx, z: island.cz, r: island.r, color: island.map, name: island.name, index: island.index },
    span,
    onBridge,
    bridge: onBridge ? { x: bridge.x, z: bridge.z, hw: bridge.hw, hd: bridge.hd } : null,
    exits,
  };
}

export function mapForward(yaw) {
  return { x: Math.sin(yaw), y: -Math.cos(yaw) };
}

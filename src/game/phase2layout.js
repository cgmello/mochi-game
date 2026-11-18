export const RUN_SECONDS = 300;
export const GOAL = 45;
export const ISLAND_R = 68;

export const ISLANDS = [
  { index: 0, id: 'market', name: 'Contract Market', cx: 0, cz: 0, r: ISLAND_R, map: '#ff4db2', floor: 'pink', kind: 'market', accent: 0xff4db2 },
  { index: 1, id: 'harbor', name: 'Oracle Port', cx: 196, cz: 0, r: ISLAND_R, map: '#2ad4c8', floor: 'grate', kind: 'harbor', accent: 0x2ad4c8 },
  { index: 2, id: 'rally', name: 'Rally Square', cx: 392, cz: 0, r: ISLAND_R, map: '#ff9a2a', floor: 'pcb', kind: 'rally', accent: 0xff8a1a },
];

export const MAP = { originX: 196, originZ: 0, span: 290 };

const CLUSTERS = [
  [14, 26],
  [-20, 18],
  [18, -28],
  [-16, -24],
  [32, 14],
];

const OFFSETS = [
  [0, -0.15],
  [2.4, 1.2],
  [-2.4, 1.05],
];

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
    for (const [lx, lz] of CLUSTERS) {
      for (const [ox, oz] of OFFSETS) {
        spots.push({
          x: isle.cx + lx + ox,
          z: isle.cz + lz + oz,
          y: 0.14,
          island: isle.index,
        });
      }
    }
  }
  return spots;
}

export function clusterCenters() {
  const out = [];
  for (const isle of ISLANDS) {
    for (const [lx, lz] of CLUSTERS) {
      out.push({ x: isle.cx + lx, z: isle.cz + lz, island: isle.index });
    }
  }
  return out;
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

export function mapForward(yaw) {
  return { x: Math.sin(yaw), y: -Math.cos(yaw) };
}

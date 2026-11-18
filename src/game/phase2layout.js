export const RUN_SECONDS = 300;
export const GOAL = 45;
export const ISLAND_R = 68;

export const ISLANDS = [
  { index: 0, id: 'market', name: 'Contract Market', cx: 0, cz: 0, r: ISLAND_R, map: '#ff4db2', floor: 'pink', kind: 'market', accent: 0xff4db2 },
  { index: 1, id: 'harbor', name: 'Oracle Port', cx: 196, cz: 0, r: ISLAND_R, map: '#2ad4c8', floor: 'grate', kind: 'harbor', accent: 0x2ad4c8 },
  { index: 2, id: 'rally', name: 'Rally Square', cx: 392, cz: 0, r: ISLAND_R, map: '#ff9a2a', floor: 'pcb', kind: 'rally', accent: 0xff8a1a },
];

export const MAP = { originX: 196, originZ: 0, span: 290 };

export const MOATS = [
  [-40, 30], [-16, 38], [12, 36], [38, 24],
  [-46, 10], [-20, 16], [22, 18], [44, 14],
  [-38, -16], [-14, -20], [16, -14], [40, -22],
  [-30, -40], [12, -44], [34, -36],
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
    for (const [lx, lz] of MOATS) {
      spots.push({
        x: isle.cx + lx,
        z: isle.cz + lz,
        y: 0.14,
        island: isle.index,
      });
    }
  }
  return spots;
}

export function clusterCenters() {
  return fightSpots();
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

export function mapForward(yaw) {
  return { x: Math.sin(yaw), y: -Math.cos(yaw) };
}

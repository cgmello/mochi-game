import * as THREE from 'three';
import { matte } from './phase2tex.js';
import { addSetPieces } from './phase2set.js';
import { ISLANDS, bridgeSolids, clusterCenters } from './phase2layout.js';

const TRICK = [
  [12, 6.2], [14.8, 6.2], [17.6, 6.2], [20.4, 6.2], [23.2, 6.2],
];

const RIM = {
  market: 0xff4db2,
  harbor: 0x3ce7ff,
  rally: 0xffb15a,
};

export function buildCourse(tex) {
  const group = new THREE.Group();
  const solids = [];
  const pits = [];
  const checks = [];
  const cables = [];
  const zaps = [];
  const bugs = [];
  const boosts = [];
  const pink = [];
  const orbits = [];
  let whale = null;
  let portal = null;
  let leds = null;

  for (const isle of ISLANDS) addIsland(group, isle, tex);
  for (const bridge of bridgeSolids()) addBridge(group, solids, tex, bridge);
  for (const spot of clusterCenters()) addMoat(group, solids, pits, spot);
  addScatter(group, solids, tex);
  leds = addLeds(group);
  addTricks(group, solids, tex);
  addBoostPads(group, boosts);
  addHazards(group, cables, zaps, bugs);
  addCheckpoint(group, checks, 0, -52, true);
  for (const isle of ISLANDS) {
    addCheckpoint(group, checks, isle.cx, isle.cz - 36, false);
    const holder = new THREE.Group();
    holder.position.set(isle.cx, 0, isle.cz);
    group.add(holder);
    const pieces = addSetPieces(holder, isle);
    pink.push(...pieces.bolts);
    orbits.push(...pieces.orbits);
    if (pieces.whale) {
      whale = pieces.whale;
      whale.userData.home = {
        x: whale.position.x,
        y: whale.position.y,
        yaw: whale.rotation.y,
      };
    }
    if (pieces.portal) portal = pieces.portal;
    addSign(group, isle);
  }
  for (const spot of clusterCenters()) {
    addCheckpoint(group, checks, spot.x, spot.z - 9.2, false);
  }
  for (const bridge of bridgeSolids()) {
    addCheckpoint(group, checks, bridge.x - bridge.hw + 6, 0, false);
    addCheckpoint(group, checks, bridge.x + bridge.hw - 6, 0, false);
  }

  return {
    group, solids, pits, cables, zaps, unstables: [], bugs, checks, leds, boosts, pink, whale, orbits, portal,
  };
}

function discGeo(radius) {
  const geo = new THREE.CircleGeometry(radius, 56);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (uv.getX(i) - 0.5) * 16, (uv.getY(i) - 0.5) * 16);
  }
  return geo;
}

function addIsland(group, isle, tex) {
  const floor = new THREE.Mesh(discGeo(isle.r), matte(tex[isle.floor], 0xffffff, 0.86));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(isle.cx, 0.02, isle.cz);
  floor.userData.ownGeo = true;
  const cliff = new THREE.Mesh(
    new THREE.CylinderGeometry(isle.r * 0.98, isle.r * 0.72, 3.2, 36),
    matte(tex.mountain, 0xffffff, 1),
  );
  cliff.position.set(isle.cx, -1.6, isle.cz);
  group.add(floor, cliff);
  if (isle.kind === 'harbor') {
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(isle.r + 28, 48),
      new THREE.MeshStandardMaterial({ color: 0x147a9a, roughness: 0.22, metalness: 0.35, emissive: 0x083848, emissiveIntensity: 0.45 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(isle.cx, -0.45, isle.cz);
    group.add(water);
  }
}

function addBridge(group, solids, tex, bridge) {
  const len = bridge.hw * 2;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 4.3), matte(tex.rack, 0xffffff, 0.55));
  deck.position.set(bridge.x, 0.06, bridge.z);
  deck.userData.kind = 'bridge';
  group.add(deck);
  solids.push({ x: bridge.x, z: bridge.z, hw: bridge.hw, hd: bridge.hd, top: 0.12 });
  const railMat = matte(tex.metal, 0xd7fff8, 0.4);
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.1, 0.1), railMat);
    rail.position.set(bridge.x, 0.62, side * 2.35);
    const cable = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0xff8a1a, toneMapped: false }));
    cable.position.set(bridge.x, 0.38, side * 2.15);
    group.add(rail, cable);
    solids.push({ x: bridge.x, z: side * 2.35, hw: bridge.hw, hd: 0.14, top: 0.72 });
  }
  const postGeo = new THREE.BoxGeometry(0.16, 0.7, 0.16);
  const posts = new THREE.InstancedMesh(postGeo, railMat, Math.ceil(len / 4) * 2);
  const dummy = new THREE.Object3D();
  let n = 0;
  for (let x = -bridge.hw; x <= bridge.hw; x += 4) {
    for (const side of [-1, 1]) {
      dummy.position.set(bridge.x + x, 0.35, side * 2.35);
      dummy.updateMatrix();
      posts.setMatrixAt(n, dummy.matrix);
      n += 1;
    }
  }
  posts.count = n;
  group.add(posts);
}

function addMoat(group, solids, pits, spot) {
  const pit = { x: spot.x, z: spot.z, hw: 5.5, hd: 4.3 };
  pits.push(pit);
  const mouth = new THREE.Mesh(
    new THREE.PlaneGeometry(pit.hw * 2, pit.hd * 2),
    new THREE.MeshBasicMaterial({ color: 0x070212 }),
  );
  mouth.rotation.x = -Math.PI / 2;
  mouth.position.set(pit.x, 0.045, pit.z);
  const inner = new THREE.Mesh(
    new THREE.PlaneGeometry(pit.hw * 2 - 0.7, pit.hd * 2 - 0.7),
    new THREE.MeshBasicMaterial({ color: 0x5a2088 }),
  );
  inner.rotation.x = -Math.PI / 2;
  inner.position.set(pit.x, 0.05, pit.z);
  group.add(mouth, inner);
  const stripe = new THREE.MeshBasicMaterial({ color: RIM[ISLANDS[spot.island].id] || 0xff4db2 });
  const rims = [
    [0, pit.hd, pit.hw * 2 + 0.2, 0.18],
    [0, -pit.hd, pit.hw * 2 + 0.2, 0.18],
    [pit.hw, 0, 0.18, pit.hd * 2 + 0.2],
    [-pit.hw, 0, 0.18, pit.hd * 2 + 0.2],
  ];
  for (const [ox, oz, rw, rd] of rims) {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.08, rd), stripe);
    rim.position.set(pit.x + ox, 0.1, pit.z + oz);
    group.add(rim);
  }
  const chev = new THREE.MeshBasicMaterial({ color: 0xffe14a, side: THREE.DoubleSide });
  for (const side of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.36), chev);
      mark.rotation.x = -Math.PI / 2;
      mark.rotation.z = Math.PI / 4;
      mark.position.set(pit.x + side * (pit.hw + 0.5), 0.14, pit.z + i * 1.1);
      group.add(mark);
    }
  }
  const pad = new THREE.Mesh(new THREE.BoxGeometry((pit.hw - 1.45) * 2, 0.12, (pit.hd - 1.35) * 2), matteMaterial(spot.island));
  pad.position.set(spot.x, 0.08, spot.z);
  group.add(pad);
  solids.push({ x: spot.x, z: spot.z, hw: pit.hw - 1.45, hd: pit.hd - 1.35, top: 0.14 });
  const plank = new THREE.Mesh(new THREE.BoxGeometry(pit.hw * 2 + 1.4, 0.12, 4.8), matteMaterial(spot.island));
  plank.position.set(spot.x, 0.08, spot.z - 3.4);
  group.add(plank);
  solids.push({ x: spot.x, z: spot.z - 3.4, hw: pit.hw + 0.7, hd: 2.4, top: 0.14 });
}

const PAD_MATS = {};
function matteMaterial(index) {
  if (!PAD_MATS[index]) {
    const color = index === 1 ? 0xb7fff4 : index === 2 ? 0xffd7a1 : 0xffd0ea;
    PAD_MATS[index] = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.2 });
  }
  return PAD_MATS[index];
}

function nearCluster(x, z) {
  return clusterCenters().some((spot) => Math.hypot(x - spot.x, z - spot.z) < 8);
}

function nearSegment(x, z, ax, az, bx, bz, pad) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2));
  return Math.hypot(x - (ax + dx * t), z - (az + dz * t)) < pad;
}

function blocksRoad(isle, x, z) {
  const lx = x - isle.cx;
  const lz = z - isle.cz;
  if (Math.abs(lz) < 9 || Math.abs(lx) < 8) return true;
  const clusters = [[14, 26], [-20, 18], [18, -28], [-16, -24], [32, 14]];
  for (const [cx, cz] of clusters) {
    if (nearSegment(lx, lz, 0, 0, cx, cz, 4.2)) return true;
    if (nearSegment(lx, lz, 0, -56, cx, cz, 4.2)) return true;
  }
  return false;
}

function addScatter(group, solids, tex) {
  const rackGeo = new THREE.BoxGeometry(1.1, 2.4, 0.7);
  const rackMat = matte(tex.rack, 0xffffff, 0.6);
  const racks = new THREE.InstancedMesh(rackGeo, rackMat, 96);
  const monGeo = new THREE.BoxGeometry(0.9, 0.7, 0.08);
  const mons = new THREE.InstancedMesh(monGeo, matte(tex.screen, 0xffffff, 0.4), 60);
  const facade = matte(tex.facade, 0xffffff, 0.7);
  const dummy = new THREE.Object3D();
  let ri = 0;
  let mi = 0;
  ISLANDS.forEach((isle, ii) => {
    for (let n = 0; n < 28 && ri < racks.count; n++) {
      const ang = 0.55 + n * 0.22;
      const rad = 22 + (n % 5) * 7;
      const x = isle.cx + Math.cos(ang) * rad;
      const z = isle.cz + Math.sin(ang) * rad;
      if (Math.hypot(x - isle.cx, z - isle.cz) > isle.r - 6) continue;
      if (nearCluster(x, z) || blocksRoad(isle, x, z)) continue;
      dummy.position.set(x, 1.2, z);
      dummy.rotation.set(0, ang, 0);
      dummy.updateMatrix();
      racks.setMatrixAt(ri, dummy.matrix);
      ri += 1;
      solids.push({ x, z, hw: 0.55, hd: 0.4, top: 2.4 });
    }
    for (let n = 0; n < 8; n++) {
      const ang = 0.85 + n * 0.68;
      const rad = 38 + (n % 3) * 6;
      const x = isle.cx + Math.cos(ang) * rad;
      const z = isle.cz + Math.sin(ang) * rad;
      if (nearCluster(x, z) || blocksRoad(isle, x, z)) continue;
      if (Math.hypot(x - isle.cx, z - isle.cz) > isle.r - 8) continue;
      const h = 4.5 + (n % 4) * 1.6;
      const box = new THREE.Mesh(new THREE.BoxGeometry(4.2, h, 3.4), facade);
      box.position.set(x, h / 2, z);
      box.rotation.y = ang;
      const neon = new THREE.Mesh(
        new THREE.BoxGeometry(4.3, 0.12, 3.5),
        new THREE.MeshBasicMaterial({ color: isle.accent, toneMapped: false }),
      );
      neon.position.set(x, h - 0.4, z);
      neon.rotation.y = ang;
      group.add(box, neon);
      solids.push({ x, z, hw: 2.3, hd: 1.9, top: h });
    }
    for (let n = 0; n < 16 && mi < mons.count; n++) {
      const z = isle.cz - 28 + n * 3.6;
      if (Math.abs(z - isle.cz) < 7) continue;
      const x = isle.cx + (n % 2 ? 16 : -16);
      if (nearCluster(x, z)) continue;
      dummy.position.set(x, 1.5, z);
      dummy.rotation.set(0, n % 2 ? -Math.PI / 2 : Math.PI / 2, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mons.setMatrixAt(mi, dummy.matrix);
      mi += 1;
    }
    const cubeMat = new THREE.MeshStandardMaterial({
      color: ii === 2 ? 0xff8a1a : ii === 1 ? 0x2ad4c8 : 0xff4db2,
      emissive: 0x2a1040,
      emissiveIntensity: 0.35,
      roughness: 0.4,
    });
    for (let n = 0; n < 7; n++) {
      const ang = n * 0.9 + 0.4;
      const cube = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), cubeMat);
      cube.position.set(isle.cx + Math.cos(ang) * (isle.r - 10), 3.2 + (n % 3), isle.cz + Math.sin(ang) * (isle.r - 10));
      cube.rotation.y = ang;
      group.add(cube);
    }
  });
  racks.count = ri;
  mons.count = mi;
  group.add(racks, mons);
}

function addLeds(group) {
  const geo = new THREE.BoxGeometry(0.12, 0.08, 0.04);
  const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
  const mesh = new THREE.InstancedMesh(geo, mat, 140);
  const color = new THREE.InstancedBufferAttribute(new Float32Array(140 * 3), 3);
  mesh.instanceColor = color;
  const dummy = new THREE.Object3D();
  let n = 0;
  for (const isle of ISLANDS) {
    for (let i = 0; i < 40 && n < 140; i++) {
      const ang = i * 0.55;
      dummy.position.set(
        isle.cx + Math.cos(ang) * (20 + (i % 6) * 6),
        0.8 + (i % 5) * 0.35,
        isle.cz + Math.sin(ang) * (20 + (i % 6) * 6),
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      color.setXYZ(n, 0.4, 1, 1);
      n += 1;
    }
  }
  mesh.count = n;
  group.add(mesh);
  return mesh;
}

function addTricks(group, solids, tex) {
  TRICK.forEach(([x, z], i) => {
    const rack = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.92, 1.15), matte(tex.rack));
    rack.position.set(x, 0.46, z);
    group.add(rack);
    solids.push({ x, z, hw: 1.15, hd: 0.58, top: 0.92, trick: i });
  });
}

function addBoostPads(group, boosts) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.42);
  shape.lineTo(0.28, -0.28);
  shape.lineTo(-0.28, -0.28);
  const geo = new THREE.ShapeGeometry(shape);
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0x7af6ff, side: THREE.DoubleSide, toneMapped: false });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x1a2438, roughness: 0.5, metalness: 0.4 });
  const spots = [];
  for (const isle of ISLANDS) {
    spots.push({ x: isle.cx - 18, z: isle.cz, len: 10, rot: Math.PI / 2 });
    spots.push({ x: isle.cx + 18, z: isle.cz, len: 10, rot: Math.PI / 2 });
  }
  for (const bridge of bridgeSolids()) {
    spots.push({ x: bridge.x, z: 0, len: 14, rot: Math.PI / 2 });
  }
  for (const spot of spots) {
    const pad = new THREE.Group();
    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, spot.len), deckMat);
    pad.add(deck);
    const arrows = [];
    const count = Math.max(3, Math.round(spot.len / 2.4));
    for (let i = 0; i < count; i++) {
      const arrow = new THREE.Mesh(geo, arrowMat);
      arrow.rotation.x = -Math.PI / 2;
      arrow.position.set(0, 0.06, -spot.len / 2 + 0.8 + i * ((spot.len - 1.2) / count));
      pad.add(arrow);
      arrows.push(arrow);
    }
    pad.position.set(spot.x, 0.06, spot.z);
    pad.rotation.y = spot.rot;
    group.add(pad);
    const alongX = Math.abs(Math.sin(spot.rot)) > 0.5;
    boosts.push({
      x: spot.x,
      z: spot.z,
      hw: alongX ? spot.len / 2 : 1.25,
      hd: alongX ? 1.25 : spot.len / 2,
      len: spot.len,
      arrows,
    });
  }
}

function addHazards(group, cables, zaps, bugs) {
  const cableMat = new THREE.MeshStandardMaterial({ color: 0xff8a1a, roughness: 0.45, emissive: 0x7a3208, emissiveIntensity: 0.45 });
  const zapMat = new THREE.MeshStandardMaterial({ color: 0xff4db2, emissive: 0x6a1048, emissiveIntensity: 0.6, roughness: 0.35 });
  const bugMat = new THREE.MeshStandardMaterial({ color: 0x3dff9a, emissive: 0x0a4030, emissiveIntensity: 0.4 });
  for (const isle of ISLANDS) {
    const cableSpots = [
      { x: isle.cx + 24, z: isle.cz + 14, rot: 0.4, hw: 1.5 },
      { x: isle.cx - 26, z: isle.cz - 16, rot: -0.3, hw: 1.4 },
    ];
    for (const cable of cableSpots) {
      if (nearCluster(cable.x, cable.z)) continue;
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, cable.hw * 2, 6), cableMat);
      mesh.rotation.z = Math.PI / 2;
      mesh.rotation.y = cable.rot;
      mesh.position.set(cable.x, 0.08, cable.z);
      group.add(mesh);
      cables.push(cable);
    }
    const zapSpots = [
      [isle.cx + 30, isle.cz + 20],
      [isle.cx - 28, isle.cz - 22],
    ];
    for (const [x, z] of zapSpots) {
      if (nearCluster(x, z)) continue;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), zapMat);
      mesh.position.set(x, 0.4, z);
      group.add(mesh);
      zaps.push({ x, z, y: 0.4, cool: 0, mesh });
    }
  }
  for (const spot of clusterCenters()) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), bugMat);
    mesh.scale.set(1.4, 0.6, 1);
    group.add(mesh);
    bugs.push({ mesh, cx: spot.x + 6.6, cz: spot.z + 0.4, r: 1.15, y: 0.25, phase: spot.x * 0.1 });
  }
}

function addCheckpoint(group, checks, x, z, active) {
  const g = new THREE.Group();
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.7, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x9aa4b8, roughness: 0.4, metalness: 0.45 }),
  );
  block.position.y = 0.35;
  const glow = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.28, 0),
    new THREE.MeshBasicMaterial({ color: active ? 0x7af6ff : 0x6a5488, transparent: true, opacity: active ? 1 : 0.45 }),
  );
  glow.position.y = 1.15;
  g.add(block, glow);
  g.position.set(x, 0, z);
  group.add(g);
  checks.push({ x, z, y: 0, active, glow, mesh: g });
}

function addSign(group, isle) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#14081c';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = isle.map;
  ctx.font = '700 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isle.name.toUpperCase(), 256, 64);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 1.8),
    new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide }),
  );
  board.position.set(isle.cx, 3.2, isle.cz - 46);
  group.add(board);
}

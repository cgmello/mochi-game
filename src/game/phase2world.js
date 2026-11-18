import * as THREE from 'three';
import { matte } from './phase2tex.js';
import { addSetPieces } from './phase2set.js';
import { ISLANDS, ISLAND_R, bridgeSolids, clusterCenters, fightSpots, bonusSpots, freeSpot } from './phase2layout.js';

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
  for (const spot of fightSpots()) {
    if (spot.kind === 'moat') addMoat(group, solids, pits, spot);
    else if (spot.kind !== 'alley' && spot.kind !== 'corner' && spot.kind !== 'bridge') addPerch(group, solids, tex, spot);
  }
  addScatter(group, solids, tex);
  leds = addLeds(group);
  addTricks(group, solids, tex);
  addBoostPads(group, boosts);
  addHazards(group, cables, zaps, bugs);
  for (const isle of ISLANDS) {
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
    solidifySetPieces(holder, solids);
    addSign(group, isle, solids);
    dressIsland(group, solids, tex, isle);
  }
  const bonuses = addBonuses(group, solids, tex);
  clearBridgeDeck(group);
  addCheckpoint(group, checks, solids, 0, -52, true);
  for (const isle of ISLANDS) addCheckpoint(group, checks, solids, isle.cx + 6, isle.cz - 30, false);
  for (const spot of clusterCenters()) addCheckpoint(group, checks, solids, spot.x, spot.z - 5.4, false);
  for (const bridge of bridgeSolids()) {
    addCheckpoint(group, checks, solids, bridge.x - bridge.hw + 8, 1.15, false);
    addCheckpoint(group, checks, solids, bridge.x + bridge.hw - 8, -1.15, false);
  }

  return {
    group, solids, pits, cables, zaps, unstables: [], bugs, checks, leds, boosts, pink, whale, orbits, portal, bonuses,
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
  const floorMat = matte(tex[isle.floor], 0xffffff, 0.72);
  floorMat.emissive = new THREE.Color(isle.accent);
  floorMat.emissiveIntensity = isle.kind === 'rally' ? 0.34 : isle.kind === 'harbor' ? 0.28 : 0.18;
  const floor = new THREE.Mesh(discGeo(isle.r), floorMat);
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
      new THREE.MeshStandardMaterial({ color: 0x14d4d0, roughness: 0.18, metalness: 0.28, emissive: 0x0c6e78, emissiveIntensity: 0.7 }),
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
  const pit = { x: spot.x, z: spot.z, hw: 3.15, hd: 2.45 };
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
  const pad = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 2.7), matteMaterial(spot.island));
  pad.position.set(spot.x, 0.08, spot.z);
  group.add(pad);
  solids.push({ x: spot.x, z: spot.z, hw: 1.7, hd: 1.35, top: 0.14 });
  const plank = new THREE.Mesh(new THREE.BoxGeometry(pit.hw * 2 + 0.8, 0.12, 3.2), matteMaterial(spot.island));
  plank.position.set(spot.x, 0.08, spot.z - 2.9);
  group.add(plank);
  solids.push({ x: spot.x, z: spot.z - 2.9, hw: pit.hw + 0.4, hd: 1.6, top: 0.14 });
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
  return clusterCenters().some((spot) => Math.hypot(x - spot.x, z - spot.z) < 4.6);
}

function onDeck(x, z) {
  return bridgeSolids().some((bridge) => Math.abs(x - bridge.x) <= bridge.hw + 2 && Math.abs(z - bridge.z) <= bridge.hd + 1.4);
}

function blocked(isle, x, z) {
  const lx = x - isle.cx;
  const lz = z - isle.cz;
  const road = isle.kind === 'rally' ? 10 : isle.kind === 'harbor' ? 5.2 : 3.3;
  if (Math.abs(lz) < road) return true;
  if (Math.hypot(lx - 16, lz + 50) < 5) return true;
  if (Math.abs(lx) < 4.2 && lz < -6) return true;
  if (Math.hypot(lx, lz) > isle.r - 5) return true;
  if (onDeck(x, z)) return true;
  if (fightSpots().some((spot) => Math.hypot(x - spot.x, z - spot.z) < 3.6)) return true;
  if (clusterCenters().some((spot) => Math.abs(x - spot.x) < 3.6 && z < spot.z && z > spot.z - 8)) return true;
  return false;
}

function stamp(mesh, dummy, i, x, y, z, rot = 0, sx = 1, sy = 1, sz = 1) {
  dummy.position.set(x, y, z);
  dummy.rotation.set(0, rot, 0);
  dummy.scale.set(sx, sy, sz);
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);
}

function addScatter(group, solids, tex) {
  const racks = new THREE.InstancedMesh(new THREE.BoxGeometry(1.05, 2.2, 0.62), matte(tex.rack, 0xffffff, 0.55), 210);
  const mons = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.62, 0.08), matte(tex.screen, 0xffffff, 0.35), 120);
  const crates = new THREE.InstancedMesh(new THREE.BoxGeometry(0.72, 0.72, 0.72), matte(tex.metal, 0xd8c4a4, 0.55), 120);
  const laps = new THREE.InstancedMesh(new THREE.BoxGeometry(0.64, 0.07, 0.44), matte(tex.metal, 0xb7fff4, 0.35), 90);
  const dummy = new THREE.Object3D();
  const facade = matte(tex.facade, 0xffffff, 0.65);
  const deskMat = matte(tex.metal, 0xc8d0dc, 0.45);
  let ri = 0;
  let mi = 0;
  let ci = 0;
  let li = 0;
  ISLANDS.forEach((isle, ii) => {
    const rows = [[-28, 10, 0.15], [24, -10, 0.4], [-10, 28, 1.15], [6, -30, -0.2], [34, 8, 0.9], [-36, -8, 0.05]];
    for (const [lx, lz, rot] of rows) {
      for (let n = 0; n < 5 && ri < racks.count; n++) {
        const x = isle.cx + lx + Math.cos(rot) * n * 1.28;
        const z = isle.cz + lz + Math.sin(rot) * n * 1.28;
        if (blocked(isle, x, z)) continue;
        stamp(racks, dummy, ri, x, 1.1, z, rot);
        ri += 1;
        solids.push({ x, z, hw: 0.55, hd: 0.36, top: 2.2 });
      }
    }
    for (let n = 0; n < 22 && ri < racks.count; n++) {
      const ang = 0.4 + n * 0.48;
      const rad = 14 + (n % 7) * 6.5;
      const x = isle.cx + Math.cos(ang) * rad;
      const z = isle.cz + Math.sin(ang) * rad;
      if (blocked(isle, x, z)) continue;
      stamp(racks, dummy, ri, x, 1.1, z, ang);
      ri += 1;
      solids.push({ x, z, hw: 0.55, hd: 0.36, top: 2.2 });
    }
    const towers = isle.kind === 'market' ? 9 : isle.kind === 'harbor' ? 3 : 2;
    for (let n = 0; n < towers; n++) {
      const ang = 0.5 + n * 0.5;
      const rad = 28 + (n % 4) * 8;
      const x = isle.cx + Math.cos(ang) * rad;
      const z = isle.cz + Math.sin(ang) * rad;
      if (blocked(isle, x, z)) continue;
      const h = 4.8 + (n % 5) * 1.7;
      const box = new THREE.Mesh(new THREE.BoxGeometry(4.2, h, 3.4), facade);
      box.position.set(x, h / 2, z);
      box.rotation.y = ang;
      const neon = new THREE.Mesh(
        new THREE.BoxGeometry(4.3, 0.14, 3.5),
        new THREE.MeshBasicMaterial({ color: isle.accent, toneMapped: false }),
      );
      neon.position.set(x, h - 0.45, z);
      neon.rotation.y = ang;
      group.add(box, neon);
      solids.push({ x, z, hw: 2.3, hd: 1.9, top: h });
    }
    for (let n = 0; n < 28 && mi < mons.count; n++) {
      const ang = 0.2 + n * 0.42;
      const rad = 12 + (n % 5) * 8;
      const x = isle.cx + Math.cos(ang) * rad;
      const z = isle.cz + Math.sin(ang) * rad;
      if (blocked(isle, x, z)) continue;
      stamp(mons, dummy, mi, x, 1.35, z, ang + Math.PI / 2);
      mi += 1;
      solids.push({ x, z, hw: 0.48, hd: 0.12, top: 1.66 });
    }
    for (let n = 0; n < 16 && ci < crates.count; n++) {
      const ang = 1.1 + n * 0.7;
      const rad = 10 + (n % 6) * 8;
      const x = isle.cx + Math.cos(ang) * rad;
      const z = isle.cz + Math.sin(ang) * rad;
      if (blocked(isle, x, z)) continue;
      const tall = n % 3 === 0;
      const top = tall ? 1.15 : 0.62;
      stamp(crates, dummy, ci, x, top / 2, z, ang * 0.2, 1.15, top / 0.72, 1.05);
      ci += 1;
      solids.push({ x, z, hw: 0.42, hd: 0.38, top });
    }
    for (let n = 0; n < 10 && li < laps.count; n++) {
      const ang = 0.8 + n * 0.9;
      const rad = 16 + (n % 4) * 9;
      const x = isle.cx + Math.cos(ang) * rad;
      const z = isle.cz + Math.sin(ang) * rad;
      if (blocked(isle, x, z)) continue;
      stamp(laps, dummy, li, x, 0.78, z, ang);
      li += 1;
    }
    for (let n = 0; n < 8; n++) {
      const ang = 0.3 + n * 0.78;
      const rad = 20 + (n % 3) * 12;
      const x = isle.cx + Math.cos(ang) * rad;
      const z = isle.cz + Math.sin(ang) * rad;
      if (blocked(isle, x, z)) continue;
      const desk = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.85), deskMat);
      desk.position.set(x, 0.72, z);
      desk.rotation.y = ang;
      const leg = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.66, 0.08), deskMat);
      leg.position.set(x, 0.33, z);
      leg.rotation.y = ang;
      group.add(desk, leg);
      solids.push({ x, z, hw: 0.9, hd: 0.48, top: 0.78 });
      if (li < laps.count) {
        stamp(laps, dummy, li, x, 0.86, z, ang);
        li += 1;
      }
    }
    for (let n = 0; n < 7; n++) {
      const ang = 0.9 + n * 0.85;
      const rad = 22 + (n % 4) * 9;
      const x = isle.cx + Math.cos(ang) * rad;
      const z = isle.cz + Math.sin(ang) * rad;
      if (blocked(isle, x, z)) continue;
      const top = 0.7 + (n % 3) * 0.28;
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.7, top, 1.25), matte(tex.rack, isle.accent, 0.4));
      step.position.set(x, top / 2, z);
      group.add(step);
      solids.push({ x, z, hw: 0.85, hd: 0.62, top });
    }
    const cubeMat = new THREE.MeshStandardMaterial({
      color: ii === 2 ? 0xff9a22 : ii === 1 ? 0x1ad4d0 : 0xff4db2,
      emissive: ii === 2 ? 0x7a3a08 : ii === 1 ? 0x084848 : 0x4a1038,
      emissiveIntensity: 0.55,
      roughness: 0.35,
    });
    for (let n = 0; n < 8; n++) {
      const ang = n * 0.78 + 0.3;
      const cube = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.15, 1.15), cubeMat);
      cube.position.set(isle.cx + Math.cos(ang) * (isle.r - 8), 6.5 + (n % 4) * 1.4, isle.cz + Math.sin(ang) * (isle.r - 8));
      cube.rotation.y = ang;
      group.add(cube);
    }
    const bundle = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.12, 6, 10),
      new THREE.MeshStandardMaterial({ color: 0xff8a1a, emissive: 0x6a2808, emissiveIntensity: 0.4, roughness: 0.5 }),
    );
    bundle.position.set(isle.cx - 22, 0.2, isle.cz + 22);
    bundle.rotation.x = Math.PI / 2;
    if (!blocked(isle, bundle.position.x, bundle.position.z)) group.add(bundle);
  });
  racks.count = ri;
  mons.count = mi;
  crates.count = ci;
  laps.count = li;
  racks.instanceMatrix.needsUpdate = true;
  mons.instanceMatrix.needsUpdate = true;
  crates.instanceMatrix.needsUpdate = true;
  laps.instanceMatrix.needsUpdate = true;
  group.add(racks, mons, crates, laps);
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

const SPIDER = {
  abdomen: new THREE.SphereGeometry(0.34, 12, 9),
  head: new THREE.SphereGeometry(0.2, 10, 8),
  eye: new THREE.SphereGeometry(0.075, 8, 6),
  limb: new THREE.CylinderGeometry(0.028, 0.018, 0.42, 5),
  shin: new THREE.CylinderGeometry(0.02, 0.014, 0.4, 5),
  antenna: new THREE.CylinderGeometry(0.012, 0.012, 0.28, 4),
  tip: new THREE.SphereGeometry(0.035, 6, 5),
};

let spiderMat = null;
function spiderMaterial() {
  if (spiderMat) return spiderMat;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1c2836';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#ff4db2';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const y = 12 + i * 16;
    ctx.moveTo(6, y);
    ctx.lineTo(36 + (i % 3) * 10, y);
    ctx.lineTo(36 + (i % 3) * 10, y + 8);
    ctx.lineTo(118, y + 8);
  }
  ctx.stroke();
  ctx.strokeStyle = '#3ce7ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 108, 108);
  ctx.fillStyle = '#7af6ff';
  for (let i = 0; i < 10; i++) ctx.fillRect(18 + (i * 19) % 90, 20 + (i * 27) % 88, 5, 5);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  spiderMat = new THREE.MeshStandardMaterial({
    map,
    color: 0xffffff,
    roughness: 0.42,
    metalness: 0.35,
    emissive: 0x4a1030,
    emissiveIntensity: 0.45,
  });
  return spiderMat;
}

function makeSpider() {
  const g = new THREE.Group();
  const shell = spiderMaterial();
  const metal = new THREE.MeshStandardMaterial({ color: 0x8aa0b4, roughness: 0.35, metalness: 0.6 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2258, toneMapped: false });
  const tipMat = new THREE.MeshBasicMaterial({ color: 0xff4db2, toneMapped: false });
  const abdomen = new THREE.Mesh(SPIDER.abdomen, shell);
  abdomen.scale.set(1.05, 0.72, 1.35);
  abdomen.position.set(0, 0.5, -0.12);
  const headMat = shell.clone();
  headMat.color = new THREE.Color(0xffd6ee);
  headMat.emissiveIntensity = 0.28;
  const head = new THREE.Mesh(SPIDER.head, headMat);
  head.scale.set(1.05, 0.82, 0.95);
  head.position.set(0, 0.52, 0.36);
  g.add(abdomen, head);
  const eyes = [];
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1a0610 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(SPIDER.eye, eyeMat);
    eye.scale.setScalar(0.55);
    eye.position.set(side * 0.08, 0.56, 0.5);
    const pupil = new THREE.Mesh(SPIDER.eye, pupilMat);
    pupil.scale.setScalar(0.22);
    pupil.position.set(side * 0.08, 0.56, 0.545);
    g.add(eye, pupil);
    eyes.push(eye);
    const ant = new THREE.Group();
    ant.position.set(side * 0.07, 0.68, 0.4);
    ant.rotation.z = side * -0.35;
    ant.rotation.x = -0.55;
    const stalk = new THREE.Mesh(SPIDER.antenna, metal);
    stalk.position.y = 0.16;
    const tip = new THREE.Mesh(SPIDER.tip, tipMat);
    tip.position.y = 0.32;
    ant.add(stalk, tip);
    g.add(ant);
  }
  const legs = [];
  const slots = [-0.28, -0.1, 0.08, 0.24];
  for (const side of [-1, 1]) {
    slots.forEach((z, index) => {
      const hip = new THREE.Group();
      hip.position.set(side * 0.22, 0.5, z);
      const upper = new THREE.Group();
      upper.rotation.z = side * (0.95 + index * 0.04);
      const thigh = new THREE.Mesh(SPIDER.limb, metal);
      thigh.position.y = -0.21;
      const knee = new THREE.Group();
      knee.position.y = -0.42;
      knee.rotation.z = -side * 1.15;
      const shin = new THREE.Mesh(SPIDER.shin, metal);
      shin.position.y = -0.2;
      knee.add(shin);
      upper.add(thigh, knee);
      hip.add(upper);
      g.add(hip);
      legs.push({ hip, knee });
    });
  }
  g.userData.legs = legs;
  g.userData.eyes = eyes;
  g.scale.setScalar(0.78);
  return g;
}

export function stepSpider(mesh, time) {
  const legs = mesh.userData.legs;
  if (!legs) return;
  legs.forEach((leg, i) => {
    const stride = Math.sin(time * 9 + (i % 4) * 1.15 + (i < 4 ? 0 : Math.PI));
    leg.hip.rotation.x = stride * 0.7;
    leg.knee.rotation.x = stride * 0.28;
  });
  const eyes = mesh.userData.eyes || [];
  const pulse = 0.9 + Math.abs(Math.sin(time * 6)) * 0.18;
  for (const eye of eyes) eye.scale.setScalar(0.55 * pulse);
}

function addHazards(group, cables, zaps, bugs) {
  const cableMat = new THREE.MeshStandardMaterial({ color: 0xff8a1a, roughness: 0.45, emissive: 0x7a3208, emissiveIntensity: 0.45 });
  const zapMat = new THREE.MeshStandardMaterial({ color: 0xff4db2, emissive: 0x6a1048, emissiveIntensity: 0.6, roughness: 0.35 });
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
  for (const isle of ISLANDS) {
    const patrols = [[-24, 18], [30, -22], [-16, -34], [22, 26]];
    patrols.forEach(([lx, lz], i) => {
      const mesh = makeSpider();
      group.add(mesh);
      bugs.push({ mesh, cx: isle.cx + lx, cz: isle.cz + lz, r: 1.5, y: 0, phase: isle.index + i });
    });
  }
}

function addCheckpoint(group, checks, solids, x, z, active) {
  const spot = freeSpot(x, z, solids, 0.55);
  const g = new THREE.Group();
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, 1.35, 6),
    new THREE.MeshStandardMaterial({ color: 0x9aa4b8, roughness: 0.4, metalness: 0.45 }),
  );
  post.position.set(0.95, 0.67, 0);
  const glow = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.26, 0),
    new THREE.MeshBasicMaterial({ color: active ? 0x7af6ff : 0x6a5488, transparent: true, opacity: active ? 1 : 0.45 }),
  );
  glow.position.set(0.95, 1.5, 0);
  g.add(post, glow);
  g.position.set(spot.x, 0, spot.z);
  group.add(g);
  solids.push({ x: spot.x + 0.95, z: spot.z, hw: 0.16, hd: 0.16, top: 1.4 });
  checks.push({ x: spot.x, z: spot.z, y: 0, active, glow, mesh: g });
}

function addSign(group, isle, solids) {
  const spot = freeSpot(isle.cx + 16, isle.cz - 50, solids, 0.4);
  const c = document.createElement('canvas');
  c.width = 640;
  c.height = 160;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#120814';
  ctx.fillRect(0, 0, 640, 160);
  ctx.strokeStyle = isle.map;
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 624, 144);
  ctx.fillStyle = isle.map;
  ctx.font = '700 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isle.name.toUpperCase(), 320, 82);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(3.6, 0.9);
  const front = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map, side: THREE.FrontSide, toneMapped: false }));
  const back = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map, side: THREE.FrontSide, toneMapped: false }));
  front.userData.kind = 'sign';
  front.position.set(spot.x, 2.05, spot.z + 0.07);
  back.position.set(spot.x, 2.05, spot.z - 0.07);
  back.rotation.y = Math.PI;
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.13, 2.15, 8),
    new THREE.MeshStandardMaterial({ color: 0x2a2438, roughness: 0.5, metalness: 0.4 }),
  );
  post.position.set(spot.x, 1.05, spot.z);
  group.add(front, back, post);
  solids.push({ x: spot.x, z: spot.z, hw: 0.22, hd: 0.18, top: 2.2 });
}

function solidifySetPieces(holder, solids) {
  holder.updateMatrixWorld(true);
  const point = new THREE.Vector3();
  holder.traverse((obj) => {
    const kind = obj.userData && obj.userData.kind;
    if (!kind || kind === 'whale') return;
    obj.getWorldPosition(point);
    if (point.y > 6) return;
    if (kind === 'capsule') solids.push({ x: point.x, z: point.z, hw: 1.35, hd: 0.85, top: 1.15 });
    else if (kind === 'hand') solids.push({ x: point.x, z: point.z, hw: 1.6, hd: 1.4, top: 2.4 });
    else if (kind === 'telescope' || kind === 'tower') solids.push({ x: point.x, z: point.z, hw: 0.7, hd: 0.7, top: 3.2 });
    else if (kind === 'portal') solids.push({ x: point.x, z: point.z, hw: 1.8, hd: 0.45, top: 3.4 });
  });
}

function clearBridgeDeck(group) {
  group.updateMatrixWorld(true);
  const doomed = [];
  const point = new THREE.Vector3();
  group.traverse((obj) => {
    if (!obj.isMesh || obj.userData.keep || obj.userData.kind === 'bridge') return;
    if (!obj.geometry) return;
    if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
    const box = obj.geometry.boundingBox;
    const height = (box.max.y - box.min.y) * (obj.scale.y || 1);
    if (height < 1.2) return;
    obj.getWorldPosition(point);
    if (point.y > 8) return;
    for (const bridge of bridgeSolids()) {
      if (Math.abs(point.x - bridge.x) < bridge.hw - 2 && Math.abs(point.z - bridge.z) < 1.55) {
        doomed.push(obj);
        break;
      }
    }
  });
  for (const obj of doomed) obj.parent?.remove(obj);
}

function addPerch(group, solids, tex, spot) {
  const isle = ISLANDS[spot.island];
  const top = spot.y;
  if (spot.kind === 'dock') {
    const edge = Math.sign(spot.lx || 1) * (isle.r - 1);
    const mid = (edge + spot.lx) / 2;
    const len = Math.abs(spot.lx - edge) + 3;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(len, 0.2, 2.6), matte(tex.rack, 0xd7b07a, 0.62));
    plank.position.set(isle.cx + mid, top - 0.1, spot.z);
    group.add(plank);
    solids.push({ x: isle.cx + mid, z: spot.z, hw: len / 2, hd: 1.3, top });
    return;
  }
  const wide = spot.kind === 'stage' || spot.kind === 'terrace';
  const hw = wide ? 2.6 : 1.45;
  const hd = wide ? 1.7 : 1.05;
  const mat = spot.kind === 'rack' ? matte(tex.rack) : matte(tex.metal, spot.kind === 'crate' ? 0xd8b48a : isle.accent, 0.48);
  const box = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, Math.max(0.2, top), hd * 2), mat);
  box.position.set(spot.x, top / 2, spot.z);
  group.add(box);
  solids.push({ x: spot.x, z: spot.z, hw, hd, top });
  if (top > 1.05) {
    const stepTop = Math.min(0.8, top * 0.5);
    const step = new THREE.Mesh(new THREE.BoxGeometry(hw * 1.3, stepTop, 1.15), mat);
    step.position.set(spot.x, stepTop / 2, spot.z - hd - 0.5);
    group.add(step);
    solids.push({ x: spot.x, z: spot.z - hd - 0.5, hw: hw * 0.65, hd: 0.55, top: stepTop });
  }
}

function addBonuses(group, solids, tex) {
  const gold = new THREE.MeshStandardMaterial({ color: 0xffd15a, emissive: 0xff9a1a, emissiveIntensity: 0.7, metalness: 0.55, roughness: 0.28 });
  const coins = [];
  for (const spot of bonusSpots()) {
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.5, spot.y, 1.5), matte(tex.metal, 0xffe08a, 0.4));
    pedestal.position.set(spot.x, spot.y / 2, spot.z);
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.18, 24), gold);
    const mark = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.08, 8, 18), gold);
    mark.rotation.x = Math.PI / 2;
    mark.position.y = 0.12;
    const mesh = new THREE.Group();
    mesh.add(coin, mark);
    mesh.position.set(spot.x, spot.y + 1.25, spot.z);
    mesh.scale.setScalar(1.7);
    mesh.userData.kind = 'bonus';
    group.add(pedestal, mesh);
    solids.push({ x: spot.x, z: spot.z, hw: 0.75, hd: 0.75, top: spot.y });
    const stepTop = Math.min(0.75, spot.y * 0.48);
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.2, stepTop, 1.05), matte(tex.metal, 0xffd7a1, 0.45));
    step.position.set(spot.x, stepTop / 2, spot.z - 1.5);
    group.add(step);
    solids.push({ x: spot.x, z: spot.z - 1.5, hw: 0.6, hd: 0.5, top: stepTop });
    coins.push({ ...spot, mesh, hover: spot.y + 1.25, taken: false });
  }
  return coins;
}

function occupied(x, z) {
  return fightSpots().some((spot) => Math.hypot(x - spot.x, z - spot.z) < 3.4);
}

function dressIsland(group, solids, tex, isle) {
  addSkyline(group, isle);
  if (isle.kind === 'market') dressMarket(group, solids, tex, isle);
  else if (isle.kind === 'harbor') dressHarbor(group, solids, tex, isle);
  else dressRally(group, solids, tex, isle);
}

function addSkyline(group, isle) {
  const colors = isle.kind === 'harbor'
    ? [0x147a86, 0x0e4e62, 0x2ad4c8]
    : isle.kind === 'rally'
      ? [0xff8a1a, 0xc45a12, 0xffd15a]
      : [0xff4db2, 0x9a2a78, 0x6a3cff];
  for (let i = 0; i < 8; i++) {
    const ang = -0.85 + (i / 7) * 1.7;
    const r = isle.r + 6 + (i % 3);
    const x = isle.cx + Math.sin(ang) * r;
    const z = isle.cz + Math.cos(ang) * r;
    const h = isle.kind === 'harbor' ? 7 + (i % 4) * 2 : 9 + (i % 5) * 2.4;
    let mesh;
    if (isle.kind === 'harbor') {
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, h, 6), new THREE.MeshStandardMaterial({ color: colors[i % 3], roughness: 0.45 }));
    } else if (isle.kind === 'rally') {
      mesh = new THREE.Mesh(new THREE.ConeGeometry(1.3 + (i % 2) * 0.4, h, 5), new THREE.MeshStandardMaterial({ color: colors[i % 3], roughness: 0.4 }));
    } else {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, h, 1.4), new THREE.MeshStandardMaterial({ color: colors[i % 3], roughness: 0.42 }));
    }
    mesh.position.set(x, h / 2 - 1, z);
    group.add(mesh);
  }
}

function dressMarket(group, solids, tex, isle) {
  const cloth = [0xff4db2, 0xc45cff, 0xff8ad4, 0xff5a9a];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const x = isle.cx - 16 + col * 11;
      const z = isle.cz + 16 + row * 9;
      if (occupied(x, z) || Math.abs(z - isle.cz) < 3.3) continue;
      const counter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 1.3), matte(tex.metal, 0xffd0ea, 0.5));
      counter.position.set(x, 0.45, z);
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 0.1, 1.8),
        new THREE.MeshStandardMaterial({ color: cloth[(row + col) % cloth.length], roughness: 0.55, emissive: cloth[(row + col) % cloth.length], emissiveIntensity: 0.25 }),
      );
      awning.position.set(x, 1.7, z);
      awning.rotation.x = -0.35;
      const holo = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 1.3),
        new THREE.MeshBasicMaterial({ color: 0xb7fff4, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
      );
      holo.position.set(x + 1.1, 1.15, z + 0.2);
      group.add(counter, awning, holo);
      solids.push({ x, z, hw: 1.6, hd: 0.65, top: 0.9 });
    }
  }
  for (const [lx, lz, label] of [[-30, 28, 'DEAL'], [24, 22, 'GEN'], [-8, -32, 'STAKE']]) {
    const x = isle.cx + lx;
    const z = isle.cz + lz;
    if (occupied(x, z)) continue;
    group.add(neonSign(x, z, label, '#ff4db2'));
    solids.push({ x, z, hw: 0.2, hd: 0.8, top: 2.4 });
  }
}

function dressHarbor(group, solids, tex, isle) {
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x147a86, roughness: 0.4, metalness: 0.25 });
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0xfff4e0, roughness: 0.5 });
  for (const [lx, lz, rot] of [[-18, 78, 0.4], [26, 82, -0.5], [40, -76, 1.1]]) {
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.7, 1.5), hullMat);
    hull.position.y = 0.15;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.85, 1.1), cabinMat);
    cabin.position.set(-0.5, 0.75, 0);
    boat.add(hull, cabin);
    boat.position.set(isle.cx + lx, -0.2, isle.cz + lz);
    boat.rotation.y = rot;
    group.add(boat);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 8, 6), matte(tex.metal, 0xd7fff8, 0.35));
  mast.position.set(isle.cx + 28, 4, isle.cz + 42);
  const boom = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.18, 0.18), matte(tex.metal, 0xffb15a, 0.4));
  boom.position.set(isle.cx + 30.2, 7.2, isle.cz + 42);
  group.add(mast, boom);
  solids.push({ x: isle.cx + 28, z: isle.cz + 42, hw: 0.5, hd: 0.5, top: 8 });
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.5, 10, 8), matte(tex.metal, 0xe8fff8, 0.4));
  beacon.position.set(isle.cx - 6, 5, isle.cz + 52);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8), new THREE.MeshBasicMaterial({ color: 0x7af6ff, toneMapped: false }));
  lamp.position.set(isle.cx - 6, 10.4, isle.cz + 52);
  group.add(beacon, lamp);
  solids.push({ x: isle.cx - 6, z: isle.cz + 52, hw: 1.5, hd: 1.5, top: 10 });
  const boxes = [0x2ad4c8, 0xff8a1a, 0x243056, 0xff4db2];
  for (let i = 0; i < 8; i++) {
    const x = isle.cx - 40 + (i % 4) * 2.2;
    const z = isle.cz + 8 + Math.floor(i / 4) * 2.4;
    if (occupied(x, z)) continue;
    const h = 1.1 + (i % 3) * 0.7;
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.8, h, 1.6), new THREE.MeshStandardMaterial({ color: boxes[i % 4], roughness: 0.45, metalness: 0.2 }));
    box.position.set(x, h / 2, z);
    group.add(box);
    solids.push({ x, z, hw: 0.9, hd: 0.8, top: h });
  }
}

function dressRally(group, solids, tex, isle) {
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x9dffe8, toneMapped: false });
  for (const side of [-1, 1]) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.2, 6.2), matte(tex.metal, 0x2a2018, 0.4));
    frame.position.set(isle.cx + side * 14, 2.4, isle.cz + 40);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 3.2), screenMat);
    screen.position.set(isle.cx + side * 14, 2.5, isle.cz + 39.7);
    screen.rotation.y = side > 0 ? 0.15 : -0.15;
    group.add(frame, screen);
    solids.push({ x: isle.cx + side * 14, z: isle.cz + 40, hw: 0.4, hd: 3.1, top: 4.2 });
  }
  for (let i = 0; i < 4; i++) {
    const h = 0.4 + i * 0.32;
    for (const side of [-1, 1]) {
      const x = isle.cx + side * (26 + i * 1.5);
      const z = isle.cz + 4;
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.3, h, 8), matte(tex.metal, 0xffb15a, 0.45));
      bench.position.set(x, h / 2, z);
      group.add(bench);
      solids.push({ x, z, hw: 0.65, hd: 4, top: h });
    }
  }
  for (const [lx, lz] of [[-20, 16], [18, 12], [-8, -16], [22, -8]]) {
    const x = isle.cx + lx;
    const z = isle.cz + lz;
    if (occupied(x, z)) continue;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 5), matte(tex.metal, 0x2a2018, 0.4));
    pole.position.set(x, 1.6, z);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8), new THREE.MeshBasicMaterial({ color: 0xff8a1a, side: THREE.DoubleSide, toneMapped: false }));
    flag.position.set(x + 0.7, 2.7, z);
    group.add(pole, flag);
  }
}

function neonSign(x, z, label, color) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 96;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#140814';
  ctx.fillRect(0, 0, 256, 96);
  ctx.fillStyle = color;
  ctx.font = '700 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 128, 50);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.8), new THREE.MeshBasicMaterial({ map, toneMapped: false }));
  board.position.set(x, 2.3, z);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.3, 6), new THREE.MeshStandardMaterial({ color: 0x241428, roughness: 0.5 }));
  pole.position.set(x, 1.15, z);
  const g = new THREE.Group();
  g.add(board, pole);
  return g;
}

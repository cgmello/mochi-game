import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TILE, ROAD_W } from './constants.js';

function rng(seed) {
  let s = seed % 2147483646;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function blinkMat(color) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.4,
    roughness: 0.35,
  });
}

export function makeGroundTile(lib, index) {
  const root = new THREE.Group();
  const blinkers = [];
  const rand = rng(1000 + index * 97);

  const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, TILE + 0.3), lib.groundMat);
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.02;
  root.add(road);

  for (const side of [-1, 1]) {
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(10, TILE + 0.3), lib.grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(side * (ROAD_W / 2 + 5), 0.01, 0);
    root.add(grass);
    const skirt = new THREE.Mesh(new THREE.PlaneGeometry(26, TILE + 0.3), lib.skirtMat);
    skirt.rotation.x = -Math.PI / 2;
    skirt.position.set(side * 22, -0.02, 0);
    root.add(skirt);
  }

  for (const side of [-1, 1]) {
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, TILE, 6), side > 0 ? lib.cable : lib.cableAlt);
    cable.rotation.x = Math.PI / 2;
    cable.position.set(side * (ROAD_W / 2 - 0.15), 0.06, 0);
    root.add(cable);
  }

  const propCount = 4 + Math.floor(rand() * 2);
  for (let i = 0; i < propCount; i++) {
    const side = rand() > 0.5 ? 1 : -1;
    const x = side * (4.7 + rand() * 1.8);
    const z = (rand() - 0.5) * (TILE - 4);
    const kind = rand();
    const prop = kind < 0.45 ? makeCrt(lib, blinkers, rand) : kind < 0.8 ? makeRack(lib, blinkers, rand, 1.25 + rand() * 0.6) : makeDish(lib, blinkers, rand);
    prop.position.set(x, 0, z);
    prop.rotation.y = side > 0 ? -Math.PI / 2 + 0.45 : Math.PI / 2 - 0.45;
    prop.scale.setScalar(1.2);
    root.add(prop);
  }
  for (let i = 0; i < 8; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const tuft = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.38, 5),
      new THREE.MeshStandardMaterial({ color: i % 2 ? 0x2f7d3c : 0x4eaf5c, roughness: 1 }),
    );
    tuft.position.set(side * (4.25 + (i % 3) * 0.18), 0.16, -TILE / 2 + 3 + i * 3.1);
    root.add(tuft);
  }

  const cubes = 2 + Math.floor(rand() * 2);
  for (let i = 0; i < cubes; i++) {
    const size = 0.35 + rand() * 0.9;
    const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), lib.cubeMat);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size)),
      new THREE.LineBasicMaterial({ color: 0xff6ec8 }),
    );
    const g = new THREE.Group();
    g.add(cube, edges);
    g.position.set((rand() - 0.5) * 10, 3.2 + rand() * 4.5, (rand() - 0.5) * TILE);
    g.userData.bob = { base: g.position.y, phase: rand() * 6, speed: 0.6 + rand(), amp: 0.18 + rand() * 0.25 };
    root.add(g);
  }

  root.userData.blinkers = blinkers;
  return root;
}

function makeCrt(lib, blinkers, rand) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.35, 0.95, 0.28, 3, 0.05), lib.bezel);
  body.position.y = 0.95;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 0.68), lib.screenMat);
  screen.position.set(0, 0.98, 0.15);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: lib.glow,
    color: 0x7af6ff,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  glow.position.set(0, 0.98, 0.22);
  glow.scale.set(1.5, 1.05, 1);
  const chin = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.1, 0.32), lib.bezelDark);
  chin.position.set(0, 0.46, 0);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.12), lib.rackTrim);
  stand.position.y = 0.24;
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.42), lib.bezelDark);
  foot.position.y = 0.04;
  g.add(body, screen, glow, chin, stand, foot);
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), blinkMat(rand() > 0.5 ? 0x39f3ff : 0xee8521));
  light.position.set(0.55, 0.55, 0.16);
  blinkers.push({ mat: light.material, phase: rand() * 6 });
  g.add(light);
  return g;
}

function makeRack(lib, blinkers, rand, scale) {
  const h = 1.2 * scale;
  return buildRack(lib, blinkers, rand, { h, w: 0.78, d: 0.46, units: 4 + Math.floor(rand() * 2) });
}

function buildRack(lib, blinkers, rand, { h, w, d, units }) {
  const g = new THREE.Group();
  for (const x of [-w / 2, w / 2]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, h, d), lib.rackFrame);
    post.position.set(x, h / 2, 0);
    g.add(post);
    for (const z of [-d / 2, d / 2]) {
      for (let i = 0; i < 3; i++) {
        const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), lib.rackTrim);
        rivet.position.set(x, h * (0.2 + i * 0.3), z);
        g.add(rivet);
      }
    }
  }
  const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.07, d + 0.06), lib.rackFrame);
  cap.position.y = h;
  const base = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.08, d + 0.08), lib.rackTrim);
  base.position.y = 0.04;
  g.add(cap, base);

  const faceZ = -d / 2;
  const badge = new THREE.Mesh(lib.mark, new THREE.MeshBasicMaterial({ color: 0xff4fa3, side: THREE.DoubleSide }));
  badge.scale.setScalar(0.16);
  badge.position.set(0, h - 0.02, faceZ - 0.02);
  badge.rotation.y = Math.PI;
  g.add(badge);

  const colors = [0x39f3ff, 0xee8521, 0xff4f9a, 0x7dffb2];
  const ledMats = colors.map((color, i) => {
    const mat = blinkMat(color);
    blinkers.push({ mat, phase: rand() * 6 + i });
    return mat;
  });

  for (let i = 0; i < units; i++) {
    const slot = (h - 0.22) / units;
    const y = 0.14 + slot * i + slot * 0.5;
    const face = new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, slot * 0.78, 0.04), lib.rackFace);
    face.position.set(0, y, faceZ + 0.01);
    g.add(face);
    const bay = new THREE.Mesh(new THREE.BoxGeometry((w - 0.16) * 0.55, slot * 0.55, 0.02), lib.rackBay);
    bay.position.set(-w * 0.14, y, faceZ - 0.02);
    g.add(bay);
    const vent = new THREE.Mesh(new THREE.BoxGeometry((w - 0.2) * 0.35, slot * 0.45, 0.015), lib.rackTrim);
    vent.position.set(w * 0.02, y, faceZ - 0.015);
    g.add(vent);
    const ledCount = 4;
    for (let k = 0; k < ledCount; k++) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.028, 0.02), ledMats[(i + k) % ledMats.length]);
      lamp.position.set(w * 0.28, y + (k - (ledCount - 1) / 2) * 0.04, faceZ - 0.02);
      g.add(lamp);
    }
  }

  const cableMat = rand() > 0.5 ? lib.cable : lib.cableAlt;
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(w / 2 + 0.02, h * 0.72, d * 0.2),
    new THREE.Vector3(w / 2 + 0.28, h * 0.4, d * 0.35),
    new THREE.Vector3(w / 2 + 0.05, 0.05, d * 0.1),
  );
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.025, 5, false), cableMat);
  g.add(tube);
  const curve2 = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-w / 2 - 0.02, h * 0.4, 0),
    new THREE.Vector3(-w / 2 - 0.22, h * 0.2, 0.1),
    new THREE.Vector3(-w / 2 - 0.04, 0.02, -0.05),
  );
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve2, 8, 0.018, 5, false), lib.cableAlt));
  return g;
}

function makeDish(lib, blinkers, rand) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.3, 8), lib.bezelDark);
  pole.position.y = 0.65;
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), lib.bezel);
  dish.position.y = 1.35;
  dish.rotation.x = 0.5;
  const node = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), blinkMat(0xff4f9a));
  node.position.set(0, 1.45, 0.12);
  blinkers.push({ mat: node.material, phase: rand() * 4 });
  g.add(pole, dish, node);
  return g;
}

export function makeCoin(lib, tier) {
  const aerial = tier >= 10000;
  const scale = aerial ? 1.28 : tier >= 5000 ? 0.96 : tier >= 1000 ? 0.66 : 0.48;
  const g = new THREE.Group();
  const rim = new THREE.Mesh(lib.coin, aerial ? lib.coinRimGold : lib.coinRim);
  rim.scale.set(1.12, 1.12, aerial ? 0.7 : 0.55);
  let bodyMat = lib.coinMat;
  if (aerial) bodyMat = lib.coinGold;
  else if (tier >= 5000) {
    bodyMat = lib.coinMat.clone();
    bodyMat.emissiveIntensity = 0.7;
  } else if (tier >= 1000) {
    bodyMat = lib.coinMat.clone();
    bodyMat.emissiveIntensity = 0.42;
  }
  const body = new THREE.Mesh(lib.coin, bodyMat);
  g.add(rim, body);
  const logo = new THREE.Mesh(lib.mark, lib.markMat);
  logo.scale.setScalar(aerial ? 0.52 : 0.46);
  logo.position.z = 0.08;
  const logoBack = logo.clone();
  logoBack.position.z = -0.08;
  logoBack.rotation.y = Math.PI;
  g.add(logo, logoBack);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: lib.glow,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: aerial ? 1 : tier >= 5000 ? 0.9 : tier >= 1000 ? 0.55 : 0.34,
    color: aerial ? 0xfff1a8 : tier >= 5000 ? 0xff6ad5 : tier >= 1000 ? 0xff8a3d : 0xffc56a,
  }));
  glow.scale.setScalar(aerial ? 3.4 : tier >= 5000 ? 2.6 : tier >= 1000 ? 1.9 : 1.35);
  g.add(glow);
  if (aerial) {
    const halo = glow.clone();
    halo.material = glow.material.clone();
    halo.material.color.setHex(0xff4fa3);
    halo.material.opacity = 0.55;
    halo.scale.setScalar(4.6);
    g.add(halo);
    const sparks = [];
    const sparkMatA = new THREE.MeshBasicMaterial({ color: 0xfff6c2 });
    const sparkMatB = new THREE.MeshBasicMaterial({ color: 0xff6ad5 });
    const sparkMatC = new THREE.MeshBasicMaterial({ color: 0x7af6ff });
    const mats = [sparkMatA, sparkMatB, sparkMatC];
    for (let i = 0; i < 12; i++) {
      const spark = new THREE.Mesh(new THREE.OctahedronGeometry(i % 3 === 0 ? 0.07 : 0.04, 0), mats[i % 3]);
      g.add(spark);
      sparks.push(spark);
    }
    g.userData.sparks = sparks;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.72, 28),
      new THREE.MeshBasicMaterial({ color: 0xffe08a, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.name = 'marker';
    g.add(ring);
  }
  g.scale.setScalar(scale);
  return g;
}

export function makeObstacle(lib, type) {
  if (type === 'low') return lowServer(lib);
  if (type === 'cable') return cableBarrier(lib, false);
  if (type === 'cable-all') return cableBarrier(lib, true);
  if (type === 'tall') return tallRack(lib);
  if (type === 'overhead') return overhead(lib, false);
  if (type === 'overhead-all') return overhead(lib, true);
  return lowServer(lib);
}

function lowServer(lib) {
  const blinkers = [];
  const g = buildRack(lib, blinkers, () => 0.4, { h: 0.78, w: 1.15, d: 0.7, units: 3 });
  const chev = new THREE.Mesh(lib.mark, new THREE.MeshBasicMaterial({ color: 0xffb15a, side: THREE.DoubleSide }));
  chev.scale.setScalar(0.32);
  chev.position.set(0, 1.05, 0);
  g.add(chev);
  return { mesh: g, type: 'low', clearY: 0.84, roofY: 0, halfZ: 0.48, allLanes: false, blinkers };
}

function cableBarrier(lib, all) {
  const g = new THREE.Group();
  const width = all ? 7.2 : 1.5;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, width, 8), lib.cable);
  mesh.rotation.z = Math.PI / 2;
  mesh.position.y = 0.28;
  const mesh2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, width, 8), lib.cableAlt);
  mesh2.rotation.z = Math.PI / 2;
  mesh2.position.y = 0.42;
  g.add(mesh, mesh2);
  return { mesh: g, type: 'cable', clearY: 0.5, roofY: 0, halfZ: 0.4, allLanes: all };
}

function tallRack(lib) {
  const blinkers = [];
  const g = buildRack(lib, blinkers, () => 0.35, { h: 2.15, w: 1.15, d: 0.72, units: 7 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.28), lib.screenMat);
  screen.position.set(0, 1.72, -0.4);
  screen.rotation.y = Math.PI;
  g.add(screen);
  return { mesh: g, type: 'tall', clearY: 0, roofY: 0, halfZ: 0.46, allLanes: false, blinkers };
}

function overhead(lib, all) {
  const g = new THREE.Group();
  const width = all ? 7.4 : 1.45;
  const bar = new THREE.Mesh(new RoundedBoxGeometry(width, 0.16, 0.28, 2, 0.04), lib.cableAlt);
  bar.position.y = 1.42;
  const glow = new THREE.Mesh(new THREE.BoxGeometry(width, 0.04, 0.3), blinkMat(0x7af6ff));
  glow.position.y = 1.28;
  g.add(bar, glow);
  if (!all) {
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), lib.bezel);
    dish.position.set(0, 1.22, 0);
    dish.rotation.x = Math.PI;
    g.add(dish);
  } else {
    for (const x of [-2.2, 0, 2.2]) {
      const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 6), lib.cyan);
      drop.position.set(x, 1.2, 0);
      g.add(drop);
    }
  }
  return { mesh: g, type: 'overhead', clearY: 0, roofY: 1.02, halfZ: 0.36, allLanes: all };
}

function rampGeometry(length, height, width) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(length, 0);
  shape.lineTo(length, height);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
  geo.translate(0, 0, -width / 2);
  geo.rotateY(-Math.PI / 2);
  return geo;
}

export function makePlatform(lib, opts = {}) {
  const height = opts.height ?? 0.92;
  const length = opts.length ?? 6.4;
  const ramp = opts.ramp ?? 0;
  const width = opts.width ?? 1.75;
  const g = new THREE.Group();
  const blinkers = [];
  const bodyLen = Math.max(0.8, length - ramp);
  const bodyZ = -length / 2 + ramp + bodyLen / 2;
  const body = new THREE.Mesh(new RoundedBoxGeometry(width, height, bodyLen, 3, 0.05), lib.rackFrame);
  body.position.set(0, height / 2, bodyZ);
  const top = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, 0.07, bodyLen - 0.12), lib.bezelDark);
  top.position.set(0, height + 0.03, bodyZ);
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.04, bodyLen - 0.4),
    new THREE.MeshBasicMaterial({ color: 0x7af6ff }),
  );
  stripe.position.set(0, height + 0.08, bodyZ);
  g.add(body, top, stripe);

  if (ramp > 0.2) {
    const rampMesh = new THREE.Mesh(rampGeometry(ramp, height, width - 0.08), lib.rackFace);
    rampMesh.position.set(0, 0, -length / 2);
    g.add(rampMesh);
    for (let i = 0; i < 3; i++) {
      const t = (i + 1) / 4;
      const chev = new THREE.Mesh(lib.mark, new THREE.MeshBasicMaterial({ color: 0xffb15a, side: THREE.DoubleSide }));
      chev.scale.setScalar(0.32);
      chev.rotation.x = Math.PI / 2;
      chev.position.set(0, height * t + 0.08, -length / 2 + ramp * t);
      g.add(chev);
    }
  } else {
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.72, Math.min(0.7, height * 0.48)), lib.screenMat);
    screen.position.set(0, height * 0.55, -length / 2 - 0.02);
    screen.rotation.y = Math.PI;
    g.add(screen);
  }

  const colors = [0x39f3ff, 0xee8521, 0xff4f9a];
  const mats = colors.map((color, i) => {
    const mat = blinkMat(color);
    blinkers.push({ mat, phase: i * 1.4 });
    return mat;
  });
  const rows = Math.max(3, Math.round(bodyLen / 1.35));
  for (let i = 0; i < rows; i++) {
    const z = bodyZ - bodyLen * 0.42 + (i * bodyLen * 0.84) / rows;
    for (const side of [-1, 1]) {
      const bay = new THREE.Mesh(new THREE.BoxGeometry(0.05, height * 0.5, Math.min(0.85, bodyLen / rows * 0.7)), lib.rackBay);
      bay.position.set(side * (width / 2 + 0.02), height * 0.46, z);
      g.add(bay);
      for (let k = 0; k < 3; k++) {
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mats[(i + k) % mats.length]);
        lamp.position.set(side * (width / 2 + 0.06), height * 0.28 + k * (height * 0.16), z);
        g.add(lamp);
      }
    }
  }
  return { mesh: g, height, length, ramp, width, blinkers };
}

export function makeBoostPad(lib, span = 1) {
  const lanes = span === 3 ? 3 : span === 2 ? 2 : 1;
  const width = lanes === 1 ? 1.9 : lanes === 2 ? 4.15 : 6.7;
  const g = new THREE.Group();
  const length = 5.2;
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.08, length),
    new THREE.MeshStandardMaterial({
      color: 0x102838,
      emissive: 0x0e7490,
      emissiveIntensity: 0.85,
      roughness: 0.35,
      metalness: 0.4,
    }),
  );
  belt.position.y = 0.06;
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.1, 0.04, length + 0.1),
    new THREE.MeshStandardMaterial({ color: 0xee8521, emissive: 0xee8521, emissiveIntensity: 0.35, roughness: 0.4 }),
  );
  edge.position.y = 0.03;
  g.add(edge, belt);
  const arrows = [];
  const gap = lanes === 1 ? 0 : 2.05;
  for (let col = 0; col < lanes; col++) {
    const x = (col - (lanes - 1) / 2) * gap;
    for (let i = 0; i < 4; i++) {
      const arrow = new THREE.Mesh(
        lib.mark,
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffb15a : 0x7af6ff, side: THREE.DoubleSide }),
      );
      arrow.rotation.x = Math.PI / 2;
      arrow.position.set(x, 0.12, -length / 2 + 0.7 + i * 1.15);
      arrow.scale.setScalar(lanes === 1 ? 0.34 : 0.4);
      g.add(arrow);
      arrows.push(arrow);
    }
  }
  g.userData.arrows = arrows;
  g.userData.beltLen = length;
  return { mesh: g, length, width, lanes };
}

function makeCloud(tint, opacity) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity, fog: false, depthWrite: false });
  const puffs = [[0, 0, 0, 1.4], [-1.3, -0.15, 0.2, 1], [1.25, -0.1, 0.1, 1.05], [0.3, 0.45, -0.1, 0.85]];
  for (const [x, y, z, s] of puffs) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), mat);
    puff.scale.set(1.7 * s, 0.7 * s, 1.1 * s);
    puff.position.set(x, y, z);
    g.add(puff);
  }
  return g;
}

export function buildAtmosphere(lib) {
  const rig = new THREE.Group();

  const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 20), skyMaterial());
  sky.frustumCulled = false;
  sky.renderOrder = -2;
  rig.add(sky);

  const sunMat = new THREE.MeshBasicMaterial({ color: 0xff8a1a, fog: false, toneMapped: false });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(6.4, 28, 18), sunMat);
  sun.position.set(0.5, 16, -108);
  sun.frustumCulled = false;
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: lib.glow,
    color: 0xff7a12,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  }));
  sunGlow.scale.set(22, 22, 1);
  sunGlow.position.copy(sun.position);
  sunGlow.frustumCulled = false;
  rig.add(sun, sunGlow);

  const cloudSpots = [
    [-34, 24, -96, 2.0, 0xfff7fb, 0.2],
    [34, 22, -102, 1.7, 0xf4f7ff, 0.18],
    [-16, 32, -128, 1.4, 0xf6ecff, 0.14],
    [20, 30, -124, 1.5, 0xfffdf8, 0.14],
  ];
  for (const [x, y, z, s, tint, opacity] of cloudSpots) {
    const cloud = makeCloud(tint, opacity);
    cloud.position.set(x, y, z);
    cloud.scale.setScalar(s);
    rig.add(cloud);
  }

  const decor = [];
  const anchors = [];
  const skyCube = lib.cubeMat.clone();
  skyCube.fog = false;
  skyCube.emissiveIntensity = 0.7;
  for (let i = 0; i < 9; i++) {
    const size = 1.1 + (i % 3) * 0.55;
    const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), skyCube);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(cube.geometry),
      new THREE.LineBasicMaterial({ color: 0xff6ec8, fog: false }),
    );
    const g = new THREE.Group();
    g.add(cube, edges);
    const side = i < 4 ? -1 : 1;
    g.position.set(side * (22 + (i % 4) * 8), 26 + (i % 5) * 3.4, -150 - (i % 4) * 18);
    g.userData.bob = { base: g.position.y, phase: i * 0.7, speed: 0.45 + (i % 3) * 0.12, amp: 0.35 };
    rig.add(g);
    decor.push(g);
    anchors.push(g);
  }

  const bolts = [];
  for (let i = 0; i < 5; i++) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(8 * 3), 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: i % 2 ? 0xff5ad8 : 0xff8ad8,
      transparent: true,
      opacity: 0,
      fog: false,
    }));
    rig.add(line);
    bolts.push({ line, timer: i * 0.35, life: 0, a: anchors[i % anchors.length], b: anchors[(i + 3) % anchors.length] });
  }

  const islands = [
    [-48, 36, -220, 3.6, 1],
    [54, 32, -240, 3.0, 2],
    [-8, 46, -280, 4.6, 3],
    [62, 40, -260, 2.4, 4],
    [-70, 38, -250, 2.6, 5],
  ];
  for (const [x, y, z, s, seed] of islands) {
    const island = makeFloatingIsland(lib, seed);
    island.position.set(x, y, z);
    island.scale.setScalar(s);
    rig.add(island);
  }

  rig.traverse((obj) => {
    obj.frustumCulled = false;
    obj.renderOrder = -1;
    const mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
    for (const mat of mats) {
      mat.depthWrite = false;
      mat.fog = false;
    }
  });

  return { rig, decor, bolts };
}

function makeFloatingIsland(lib, seed) {
  const g = new THREE.Group();
  const topMat = lib.island.clone();
  topMat.fog = false;
  const rockMat = lib.islandRock.clone();
  rockMat.fog = false;
  const teal = lib.cityA.clone();
  teal.fog = false;
  const purple = lib.cityB.clone();
  purple.fog = false;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.25, 0.26, 8), topMat);
  top.position.y = 0.08;
  const rock = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 0.28, 0.72, 7), rockMat);
  rock.position.y = -0.32;
  g.add(top, rock);
  const count = 4 + (seed % 3);
  for (let i = 0; i < count; i++) {
    const h = 0.55 + ((seed * 5 + i * 7) % 6) * 0.16;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.22, h, 0.22), i % 2 ? purple : teal);
    const ang = (i / count) * Math.PI * 2 + seed;
    const r = 0.28 + (i % 3) * 0.26;
    tower.position.set(Math.cos(ang) * r, 0.2 + h / 2, Math.sin(ang) * r * 0.72);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.1, h * 0.45), lib.cyanDot);
    win.position.set(0, 0, 0.12);
    tower.add(win);
    g.add(tower);
  }
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.07, 1.15, 6), teal);
  spire.position.y = 1.35;
  g.add(spire);
  return g;
}

function skyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      uTop: { value: new THREE.Color('#0c2ea8') },
      uMid: { value: new THREE.Color('#1d62e6') },
      uHorizon: { value: new THREE.Color('#ff6a12') },
      uSun: { value: new THREE.Color('#ff8a1a') },
      uCore: { value: new THREE.Color('#ffd15a') },
      uSunDir: { value: new THREE.Vector3(0, 14, -150).normalize() },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 uTop;
      uniform vec3 uMid;
      uniform vec3 uHorizon;
      uniform vec3 uSun;
      uniform vec3 uCore;
      uniform vec3 uSunDir;
      void main() {
        vec3 dir = normalize(vDir);
        float h = dir.y;
        vec3 col = mix(uHorizon, uMid, smoothstep(-0.04, 0.22, h));
        col = mix(col, uTop, smoothstep(0.16, 0.7, h));
        float d = max(dot(dir, normalize(uSunDir)), 0.0);
        col = mix(col, uSun, pow(d, 70.0) * 0.9);
        col = mix(col, uCore, pow(d, 260.0));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

export function updateBolts(bolts, dt) {
  for (const bolt of bolts) {
    bolt.timer -= dt;
    bolt.life -= dt;
    if (bolt.timer <= 0) {
      bolt.timer = 0.35 + Math.random() * 1.4;
      bolt.life = 0.1 + Math.random() * 0.08;
      const pos = bolt.line.geometry.attributes.position;
      const a = bolt.a.position;
      const b = bolt.b.position;
      for (let i = 0; i < 8; i++) {
        const t = i / 7;
        pos.setXYZ(
          i,
          a.x + (b.x - a.x) * t + (Math.random() - 0.5) * 0.8,
          a.y + (b.y - a.y) * t + (Math.random() - 0.5) * 0.6,
          a.z + (b.z - a.z) * t,
        );
      }
      pos.needsUpdate = true;
    }
    bolt.line.material.opacity = bolt.life > 0 ? 0.85 : 0;
  }
}

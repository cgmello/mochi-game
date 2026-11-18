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
    prop.rotation.y = side * (0.15 + rand() * 0.4);
    prop.scale.setScalar(1.35);
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
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.15, 0.85, 0.7, 3, 0.06), lib.bezel);
  body.position.y = 0.7;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.52), lib.screenMat);
  screen.position.set(0, 0.74, 0.36);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28, 0.16), lib.bezelDark);
  stand.position.y = 0.16;
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.4), lib.bezelDark);
  foot.position.y = 0.03;
  g.add(body, screen, stand, foot);
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), blinkMat(rand() > 0.5 ? 0x39f3ff : 0xee8521));
  light.position.set(0.42, 0.4, 0.36);
  blinkers.push({ mat: light.material, phase: rand() * 6 });
  g.add(light);
  return g;
}

function makeRack(lib, blinkers, rand, scale) {
  const g = new THREE.Group();
  const h = 1.15 * scale;
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.7, h, 0.5, 2, 0.04), lib.server);
  body.position.y = h / 2;
  g.add(body);
  const rows = 3 + Math.floor(rand() * 3);
  const matA = blinkMat(0x39f3ff);
  const matB = blinkMat(0xee8521);
  blinkers.push({ mat: matA, phase: rand() * 5 }, { mat: matB, phase: rand() * 5 + 1 });
  for (let i = 0; i < rows; i++) {
    const y = 0.2 + (i * (h - 0.3)) / rows;
    for (let k = 0; k < 3; k++) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.045, 0.02), k === 1 ? matB : matA);
      lamp.position.set(-0.18 + k * 0.16, y, 0.26);
      g.add(lamp);
    }
  }
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
  const scale = tier >= 5000 ? 0.96 : tier >= 1000 ? 0.66 : 0.48;
  const g = new THREE.Group();
  const rim = new THREE.Mesh(lib.coin, lib.coinRim);
  rim.scale.set(1.08, 1.08, 0.55);
  const body = new THREE.Mesh(lib.coin, tier >= 5000 ? lib.coinMat.clone() : lib.coinMat);
  if (tier >= 5000) body.material.emissiveIntensity = 0.7;
  else if (tier >= 1000) {
    body.material = lib.coinMat.clone();
    body.material.emissiveIntensity = 0.42;
  }
  g.add(rim, body);
  const logo = new THREE.Mesh(lib.mark, lib.markMat);
  logo.scale.setScalar(0.46);
  logo.position.z = 0.07;
  const logoBack = logo.clone();
  logoBack.position.z = -0.07;
  logoBack.rotation.y = Math.PI;
  g.add(logo, logoBack);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: lib.glow,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: tier >= 5000 ? 0.9 : tier >= 1000 ? 0.55 : 0.34,
    color: tier >= 5000 ? 0xff6ad5 : tier >= 1000 ? 0xff8a3d : 0xffc56a,
  }));
  glow.scale.setScalar(tier >= 5000 ? 2.6 : tier >= 1000 ? 1.9 : 1.35);
  g.add(glow);
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
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.78, 0.85, 2, 0.05), lib.serverLow);
  body.position.y = 0.39;
  g.add(body);
  const stripMat = blinkMat(0xffc857);
  for (let i = 0; i < 3; i++) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.03), stripMat);
    strip.position.set(0, 0.2 + i * 0.18, 0.43);
    g.add(strip);
  }
  const chev = new THREE.Mesh(lib.mark, new THREE.MeshBasicMaterial({ color: 0xffb15a, side: THREE.DoubleSide }));
  chev.scale.setScalar(0.35);
  chev.position.set(0, 1.15, 0);
  g.add(chev);
  return { mesh: g, type: 'low', clearY: 0.84, roofY: 0, halfZ: 0.48, allLanes: false };
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
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.15, 2.15, 0.8, 2, 0.06), lib.server);
  body.position.y = 1.08;
  g.add(body);
  const a = blinkMat(0x39f3ff);
  const b = blinkMat(0xff4f9a);
  for (let i = 0; i < 6; i++) {
    for (let k = 0; k < 3; k++) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.03), k === 1 ? b : a);
      lamp.position.set(-0.28 + k * 0.28, 0.28 + i * 0.3, 0.42);
      g.add(lamp);
    }
  }
  return { mesh: g, type: 'tall', clearY: 0, roofY: 0, halfZ: 0.46, allLanes: false, blinkers: [{ mat: a, phase: 0.4 }, { mat: b, phase: 2.1 }] };
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

export function makePlatform(lib) {
  const g = new THREE.Group();
  const height = 0.92;
  const length = 6.4;
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.7, height, length, 3, 0.08), lib.bezel);
  body.position.y = height / 2;
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, length - 0.3), lib.bezelDark);
  top.position.y = height + 0.01;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.62), lib.screenMat);
  screen.position.set(0, height * 0.58, -length / 2 - 0.01);
  screen.rotation.y = Math.PI;
  const lip = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.35), lib.bezelDark);
  lip.position.set(0, 0.18, -length / 2 - 0.15);
  g.add(body, top, screen, lip);
  return { mesh: g, height, length };
}

export function buildAtmosphere(lib, camera) {
  const rig = new THREE.Group();
  camera.add(rig);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(380, 28, 16), skyMaterial());
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  rig.add(sky);

  const sun = new THREE.Mesh(new THREE.SphereGeometry(6.2, 24, 16), new THREE.MeshBasicMaterial({ color: 0xff8c2a, fog: false }));
  sun.position.set(-10, 18, -78);
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: lib.glow,
    color: 0xffb15a,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    fog: false,
    blending: THREE.AdditiveBlending,
  }));
  sunGlow.scale.set(16, 16, 1);
  sunGlow.position.copy(sun.position);
  rig.add(sun, sunGlow);

  for (let i = 0; i < 6; i++) {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(2.2 + (i % 3), 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92, fog: false }));
    cloud.scale.set(2.4, 0.7, 1);
    cloud.position.set(-30 + i * 12, 8 + (i % 3) * 2.5, -70 - (i % 2) * 10);
    rig.add(cloud);
  }

  const island = new THREE.Group();
  const rock = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 8.2, 2.4, 8), lib.islandRock);
  rock.position.y = -1.3;
  const grass = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 6.2, 0.7, 8), lib.island);
  grass.position.y = 0.05;
  island.add(rock, grass);
  for (let i = 0; i < 26; i++) {
    const h = 1.2 + ((i * 37) % 70) / 10;
    const w = 0.45 + (i % 4) * 0.18;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), i % 2 ? lib.cityA : lib.cityB);
    const ang = i * 0.7;
    const rad = (i * 13) % 48 / 10;
    b.position.set(Math.cos(ang) * rad, h / 2 + 0.2, Math.sin(ang) * rad);
    island.add(b);
  }
  island.position.set(2, 7.5, -62);
  island.scale.setScalar(1.35);
  rig.add(island);

  const decor = [];
  const anchors = [];
  for (let i = 0; i < 7; i++) {
    const size = 0.7 + (i % 3) * 0.45;
    const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), lib.cubeMat);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(cube.geometry), new THREE.LineBasicMaterial({ color: 0xff6ec8 }));
    const g = new THREE.Group();
    g.add(cube, edges);
    g.position.set(-18 + i * 6.5, 6 + (i % 4) * 2.2, -40 - (i % 3) * 6);
    g.userData.bob = { base: g.position.y, phase: i, speed: 0.5 + i * 0.05, amp: 0.35 };
    rig.add(g);
    decor.push(g);
    anchors.push(g);
  }

  for (let i = 0; i < 4; i++) {
    const coin = makeCoin(lib, i === 0 ? 5000 : 1000);
    coin.position.set(8 + i * 2.2, 8 + (i % 2), -28 - i);
    coin.scale.multiplyScalar(1.6);
    coin.userData.decor = true;
    coin.userData.bob = { base: coin.position.y, phase: i * 1.3, speed: 0.8, amp: 0.25 };
    rig.add(coin);
    decor.push(coin);
  }

  const bolts = [];
  for (let i = 0; i < 4; i++) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(8 * 3), 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xff5ad8, transparent: true, opacity: 0 }));
    rig.add(line);
    bolts.push({ line, timer: i * 0.4, life: 0, a: anchors[i % anchors.length], b: anchors[(i + 2) % anchors.length] });
  }

  return { rig, decor, bolts };
}

function skyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color('#3d78e6') },
      uHorizon: { value: new THREE.Color('#b7e6f8') },
      uSun: { value: new THREE.Color('#ff9a3c') },
      uSunDir: { value: new THREE.Vector3(-10, 18, -78).normalize() },
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
      uniform vec3 uHorizon;
      uniform vec3 uSun;
      uniform vec3 uSunDir;
      void main() {
        vec3 dir = normalize(vDir);
        float h = clamp(dir.y * 0.55 + 0.45, 0.0, 1.0);
        vec3 col = mix(uHorizon, uTop, smoothstep(0.0, 0.75, h));
        float glow = pow(max(dot(dir, normalize(uSunDir)), 0.0), 8.0);
        float sun = pow(max(dot(dir, normalize(uSunDir)), 0.0), 120.0);
        col += uSun * glow * 0.18;
        col += vec3(1.0, 0.9, 0.7) * sun * 0.65;
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

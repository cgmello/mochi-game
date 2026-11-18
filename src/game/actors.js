import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const VARIANTS = [
  { body: 0x3aa8c4, limb: 0x2e8eae, accent: 0xe9783a, dark: 0x1c2a32, chest: 'grill', antennas: 1, wide: 0.78, tall: 0.96 },
  { body: 0x3cb4c8, limb: 0x49c4d0, accent: 0xf0a04a, dark: 0x1a2830, chest: 'vents', antennas: 2, wide: 0.84, tall: 1.12 },
  { body: 0xe36a32, limb: 0x3cb6c8, accent: 0xffc14a, dark: 0x3a241c, chest: 'screen', antennas: 1, wide: 0.86, tall: 1.05 },
  { body: 0x49c0c8, limb: 0xf29a4a, accent: 0xffe08a, dark: 0x243038, chest: 'panel', antennas: 1, wide: 0.7, tall: 0.86 },
  { body: 0x2f8f9a, limb: 0xe07a3a, accent: 0x7af6ff, dark: 0x1c2830, chest: 'screen', antennas: 2, wide: 0.8, tall: 1.0 },
];

function metal(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.38,
    metalness: 0.55,
    ...extra,
  });
}

export function makeMochi(lib) {
  const root = new THREE.Group();
  const tilt = new THREE.Group();
  const bob = new THREE.Group();
  root.add(tilt);
  tilt.add(bob);

  const legL = makeLeg(lib, -1);
  const legR = makeLeg(lib, 1);
  bob.add(legL, legR);

  const upper = new THREE.Group();
  upper.position.y = 0.34;
  bob.add(upper);

  const hip = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), lib.suit);
  hip.scale.set(0.85, 1.15, 0.72);
  hip.position.y = 0.12;
  upper.add(hip);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.16, 6, 12), lib.suit);
  torso.position.y = 0.28;
  upper.add(torso);

  const yoke = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 12), lib.yoke);
  yoke.scale.set(1.35, 0.55, 0.7);
  yoke.position.set(0, 0.24, -0.16);
  upper.add(yoke);

  const logo = new THREE.Mesh(lib.mark, lib.logo);
  logo.scale.setScalar(0.18);
  logo.position.set(0, 0.26, 0.14);
  upper.add(logo);

  const backDot = new THREE.Mesh(new THREE.CircleGeometry(0.05, 18), lib.cyanDot);
  backDot.position.set(0, 0.26, -0.28);
  backDot.rotation.y = Math.PI;
  upper.add(backDot);

  const head = new THREE.Group();
  head.position.y = 0.64;
  upper.add(head);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 22), lib.helmet);
  helmet.scale.set(1.08, 1.0, 0.98);
  head.add(helmet);

  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 12), new THREE.MeshStandardMaterial({
    color: 0x062833,
    emissive: 0x1ad4ff,
    emissiveIntensity: 0.7,
    roughness: 0.15,
    metalness: 0.1,
  }));
  visor.position.set(0, -0.02, 0.28);
  visor.scale.set(0.7, 0.5, 0.22);
  head.add(visor);

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.24),
    new THREE.MeshBasicMaterial({ map: lib.face, transparent: true, depthWrite: false }),
  );
  face.position.set(0, -0.02, 0.42);
  head.add(face);

  const earL = makeEar(lib, -1);
  const earR = makeEar(lib, 1);
  head.add(earL, earR);
  head.add(makeHeadphone(lib, -1), makeHeadphone(lib, 1));

  const armL = makeArm(lib, 1);
  const armR = makeArm(lib, -1);
  upper.add(armL, armR);

  const tail = makeTail(lib);
  upper.add(tail);

  return { root, tilt, bob, upper, legL, legR, armL, armR, tail, earL, earR, head };
}

function makeEar(lib, side) {
  const g = new THREE.Group();
  const outline = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.78, 3), lib.suit);
  outline.scale.set(1, 1, 0.62);
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.6, 3), lib.ear);
  inner.position.set(0, 0.02, -0.03);
  inner.scale.set(1, 1, 0.7);
  g.add(outline, inner);
  g.position.set(side * 0.22, 0.46, -0.08);
  g.rotation.z = side * 0.1;
  g.rotation.x = -0.08;
  return g;
}

function makeHeadphone(lib, side) {
  const g = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 20), lib.silver);
  cup.rotation.z = Math.PI / 2;
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 16), lib.ear);
  pad.rotation.z = Math.PI / 2;
  pad.position.x = side * 0.03;
  const shine = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), new THREE.MeshBasicMaterial({ color: 0xff4fa3 }));
  shine.position.set(side * 0.02, 0.01, -0.055);
  shine.rotation.y = Math.PI;
  g.add(cup, pad, shine);
  g.position.set(side * 0.46, -0.02, -0.04);
  return g;
}

function makeArm(lib, side) {
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.26, 0.32, -0.02);
  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), lib.cyanDot);
  pivot.add(joint);
  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.07, 4, 8), lib.arm);
  upper.position.y = -0.1;
  const elbow = new THREE.Group();
  elbow.position.y = -0.17;
  const elbowDot = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), lib.cyanDot);
  const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.06, 4, 8), lib.arm);
  fore.position.y = -0.08;
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), lib.arm);
  hand.position.y = -0.15;
  elbow.add(elbowDot, fore, hand);
  pivot.add(upper, elbow);
  pivot.elbow = elbow;
  pivot.rotation.z = side * 0.28;
  return pivot;
}

function makeLeg(lib, side) {
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.08, 0.26, 0);
  const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.04, 4, 8), lib.suit);
  thigh.position.y = -0.07;
  const knee = new THREE.Group();
  knee.position.y = -0.12;
  const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.03, 4, 8), lib.suit);
  shin.position.y = -0.06;
  const foot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), lib.suit);
  foot.scale.set(1.05, 0.5, 1.25);
  foot.position.set(0, -0.12, 0.02);
  knee.add(shin, foot);
  pivot.add(thigh, knee);
  pivot.knee = knee;
  return pivot;
}

function makeTail(lib) {
  const g = new THREE.Group();
  g.position.set(0.02, 0.14, -0.12);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.18, -0.04, -0.16),
    new THREE.Vector3(-0.42, -0.02, -0.28),
    new THREE.Vector3(-0.68, 0.12, -0.34),
    new THREE.Vector3(-0.88, 0.32, -0.22),
  ]);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.034, 6, false), lib.tail);
  g.add(mesh);
  g.userData.segs = [];
  return g;
}

export function updateMochi(m, time, speed, grounded, duck, lean, dt, still = false) {
  if (still) {
    m.legL.rotation.x = 0;
    m.legR.rotation.x = 0;
    m.legL.knee.rotation.x = 0.15;
    m.legR.knee.rotation.x = 0.15;
    m.armL.rotation.x = 0;
    m.armR.rotation.x = 0;
    m.armL.rotation.z = 0.28;
    m.armR.rotation.z = -0.28;
    m.armL.elbow.rotation.x = -0.15;
    m.armR.elbow.rotation.x = -0.15;
    m.upper.rotation.x = 0;
    m.upper.rotation.z = 0;
    m.upper.position.y = 0.34;
    m.upper.position.z = 0;
    m.bob.position.y = 0;
    m.bob.rotation.y = 0;
    m.tilt.rotation.z = 0;
    m.tilt.rotation.y = 0;
    m.tail.rotation.y = 0;
    m.tail.rotation.z = 0;
    m.earL.rotation.x = -0.08;
    m.earR.rotation.x = -0.08;
    m.earL.rotation.z = -0.1;
    m.earR.rotation.z = 0.1;
    return;
  }

  const rate = grounded ? 4.2 + Math.min(speed, 18) * 0.5 : 3.4;
  const pace = time * rate;
  const s = Math.sin(pace);
  const ducking = duck > 0.05 && grounded;

  if (!grounded) {
    m.legL.rotation.x = -0.75;
    m.legR.rotation.x = 0.3;
    m.legL.knee.rotation.x = 1.25;
    m.legR.knee.rotation.x = 0.8;
    m.armL.rotation.x = -1.15;
    m.armR.rotation.x = -0.5;
    m.armL.elbow.rotation.x = -0.35;
    m.armR.elbow.rotation.x = -0.15;
  } else if (ducking) {
    m.legL.rotation.x = 0.95 + s * 0.2;
    m.legR.rotation.x = 0.5 - s * 0.2;
    m.legL.knee.rotation.x = 1.35;
    m.legR.knee.rotation.x = 1.15;
    m.armL.rotation.x = 0.65;
    m.armR.rotation.x = 0.8;
    m.armL.elbow.rotation.x = -1.15;
    m.armR.elbow.rotation.x = -1.15;
  } else {
    m.legL.rotation.x = s * 1.05;
    m.legR.rotation.x = -s * 1.05;
    m.legL.knee.rotation.x = 0.18 + Math.max(0, s) * 1.2;
    m.legR.knee.rotation.x = 0.18 + Math.max(0, -s) * 1.2;
    m.armL.rotation.x = -s * 0.95;
    m.armR.rotation.x = s * 0.95;
    m.armL.elbow.rotation.x = -0.28 - Math.max(0, -s) * 0.55;
    m.armR.elbow.rotation.x = -0.28 - Math.max(0, s) * 0.55;
  }

  m.armL.rotation.z = 0.28;
  m.armR.rotation.z = -0.28;
  m.upper.rotation.x = duck * 1.05 + (grounded && !ducking ? 0.06 : 0);
  m.upper.rotation.z = grounded && !ducking ? s * 0.04 : 0;
  m.upper.position.y = 0.34 - duck * 0.22;
  m.upper.position.z = duck * 0.12;
  m.bob.position.y = grounded && !ducking ? Math.abs(Math.cos(pace)) * 0.045 : 0;
  m.bob.rotation.y = grounded && !ducking ? s * 0.04 : 0;
  m.tilt.rotation.z = THREE.MathUtils.damp(m.tilt.rotation.z, THREE.MathUtils.clamp(-lean * 0.02, -0.16, 0.16), 8, dt);
  m.tilt.rotation.y = THREE.MathUtils.damp(m.tilt.rotation.y, THREE.MathUtils.clamp(-lean * 0.015, -0.14, 0.14), 8, dt);

  m.tail.rotation.y = Math.sin(time * 3.2) * 0.12 + s * 0.06;
  m.tail.rotation.z = 0.06 + Math.sin(pace) * 0.04;
  m.earL.rotation.x = -0.08;
  m.earR.rotation.x = -0.08;
  m.earL.rotation.z = -0.1 + Math.sin(time * 3) * 0.02;
  m.earR.rotation.z = 0.1 - Math.sin(time * 3) * 0.02;
}

export function makeRobot(index) {
  const v = VARIANTS[index % VARIANTS.length];
  const body = metal(v.body);
  const limb = metal(v.limb);
  const dark = metal(v.dark, { roughness: 0.48, metalness: 0.4 });
  const accent = metal(v.accent, { emissive: v.accent, emissiveIntensity: 0.35, roughness: 0.32 });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xffe56a,
    emissive: 0xffd15a,
    emissiveIntensity: 0.85,
    roughness: 0.22,
    metalness: 0.05,
  });
  const pupil = new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.4 });
  const catchlight = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const rivetMat = metal(0xd5dde6, { metalness: 0.8, roughness: 0.25 });

  const root = new THREE.Group();
  root.scale.setScalar(v.tall);

  const legL = robotLeg(limb, dark, rivetMat, -1);
  const legR = robotLeg(limb, dark, rivetMat, 1);
  root.add(legL, legR);

  const torsoW = v.wide;
  const torso = new THREE.Mesh(new RoundedBoxGeometry(torsoW, 0.7, 0.48, 3, 0.04), body);
  torso.position.y = 1.02;
  root.add(torso);

  const plate = new THREE.Mesh(new RoundedBoxGeometry(torsoW * 0.78, 0.5, 0.06, 2, 0.02), dark);
  plate.position.set(0, 1.02, 0.24);
  root.add(plate);
  addChest(root, v, accent, dark);
  addRivets(root, rivetMat, torsoW, 1.02, 0.26);

  const seam = new THREE.Mesh(new THREE.BoxGeometry(torsoW * 0.92, 0.015, 0.02), rivetMat);
  seam.position.set(0, 1.02, 0.25);
  root.add(seam);

  const headW = torsoW * 0.78;
  const head = new THREE.Mesh(new RoundedBoxGeometry(headW, 0.52, 0.46, 3, 0.045), body);
  head.position.y = 1.68;
  root.add(head);
  const brow = new THREE.Mesh(new THREE.BoxGeometry(headW * 0.92, 0.06, 0.08), dark);
  brow.position.set(0, 1.84, 0.2);
  root.add(brow);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 14), eyeMat);
  const eyeR = eyeL.clone();
  eyeL.position.set(-headW * 0.24, 1.7, 0.2);
  eyeR.position.set(headW * 0.24, 1.7, 0.2);
  root.add(eyeL, eyeR);
  for (const eye of [eyeL, eyeR]) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), pupil);
    p.position.set(0, -0.01, 0.085);
    eye.add(p);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), catchlight);
    h.position.set(0.035, 0.04, 0.09);
    eye.add(h);
  }

  const boltL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 8), dark);
  const boltR = boltL.clone();
  boltL.rotation.z = Math.PI / 2;
  boltR.rotation.z = Math.PI / 2;
  boltL.position.set(-headW * 0.52, 1.7, 0);
  boltR.position.set(headW * 0.52, 1.7, 0);
  root.add(boltL, boltR);

  for (let i = 0; i < v.antennas; i++) {
    const side = v.antennas === 1 ? 0 : (i === 0 ? -0.16 : 0.16);
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.32, 8), dark);
    antenna.position.set(side, 2.08, 0);
    antenna.rotation.z = side * -0.15;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), accent);
    ball.position.set(side + side * 0.15, 2.26, 0);
    root.add(antenna, ball);
  }

  const armL = robotArm(limb, dark, rivetMat, 1, torsoW);
  const armR = robotArm(limb, dark, rivetMat, -1, torsoW);
  root.add(armL, armR);

  return { group: root, armL, armR, legL, legR, eyeL, eyeR, scheme: v };
}

function addChest(root, v, accent, dark) {
  if (v.chest === 'screen') {
    const bezel = new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.26, 0.04, 2, 0.02), dark);
    bezel.position.set(0, 1.04, 0.28);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.18), accent);
    glass.position.set(0, 1.04, 0.31);
    root.add(bezel, glass);
    return;
  }
  if (v.chest === 'vents') {
    for (let i = 0; i < 4; i++) {
      const slit = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.03), i % 2 ? accent : dark);
      slit.position.set(-0.14 + i * 0.09, 1.04, 0.28);
      root.add(slit);
    }
    return;
  }
  if (v.chest === 'panel') {
    const panel = new THREE.Mesh(new RoundedBoxGeometry(0.32, 0.22, 0.04, 2, 0.02), accent);
    panel.position.set(0, 1.05, 0.28);
    root.add(panel);
    return;
  }
  for (let i = 0; i < 4; i++) {
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.035, 0.03), i === 1 ? accent : dark);
    slit.position.set(0, 1.18 - i * 0.09, 0.28);
    root.add(slit);
  }
}

function addRivets(root, mat, width, y, z) {
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), mat);
      rivet.position.set(sx * (width * 0.42), y + sy * 0.28, z);
      root.add(rivet);
    }
  }
}

function robotLeg(limb, dark, rivet, side) {
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.18, 0.66, 0);
  const hip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), dark);
  const thigh = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.28, 0.16, 2, 0.03), limb);
  thigh.position.y = -0.16;
  const knee = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), rivet);
  knee.position.y = -0.3;
  const shin = new THREE.Mesh(new RoundedBoxGeometry(0.13, 0.22, 0.14, 2, 0.03), limb);
  shin.position.y = -0.42;
  const foot = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.08, 0.28, 2, 0.02), dark);
  foot.position.set(0, -0.54, 0.04);
  pivot.add(hip, thigh, knee, shin, foot);
  return pivot;
}

function robotArm(limb, dark, rivet, side, torsoW) {
  const pivot = new THREE.Group();
  pivot.position.set(side * (torsoW * 0.5 + 0.06), 1.22, 0);
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), dark);
  const upper = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.28, 0.12, 2, 0.03), limb);
  upper.position.y = -0.18;
  const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), rivet);
  elbow.position.y = -0.34;
  const fore = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.24, 0.1, 2, 0.025), limb);
  fore.position.y = -0.48;
  const grip = new THREE.Group();
  grip.position.y = -0.62;
  const palm = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.08, 0.1, 2, 0.02), dark);
  const fingerA = new THREE.Mesh(new RoundedBoxGeometry(0.035, 0.1, 0.04, 1, 0.01), rivet);
  const fingerB = fingerA.clone();
  fingerA.position.set(-0.03, -0.08, 0.02);
  fingerB.position.set(0.03, -0.08, 0.02);
  grip.add(palm, fingerA, fingerB);
  pivot.add(shoulder, upper, elbow, fore, grip);
  pivot.rotation.z = side * 0.18;
  return pivot;
}

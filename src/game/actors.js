import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const SCHEMES = [
  { body: 0x3cb6c8, limb: 0x49c8d0, trim: 0xf08a3c, dark: 0x243038 },
  { body: 0xe36a32, limb: 0x3cb6c8, trim: 0xf2c14e, dark: 0x3a2418 },
  { body: 0x49c0c8, limb: 0xf29a4a, trim: 0xffe08a, dark: 0x243038 },
  { body: 0xf08a3c, limb: 0x2f8f9a, trim: 0x7af6ff, dark: 0x3a2418 },
  { body: 0x2f8f9a, limb: 0xe36a32, trim: 0xffe08a, dark: 0x1c2830 },
];

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.12, ...extra });
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
  upper.position.y = 0.64;
  bob.add(upper);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.34, 6, 12), lib.suit);
  torso.position.y = 0.32;
  torso.castShadow = false;
  upper.add(torso);

  const logo = new THREE.Mesh(lib.mark, lib.logo);
  logo.scale.setScalar(0.55);
  logo.position.set(0, 0.36, -0.28);
  logo.rotation.y = Math.PI;
  upper.add(logo);

  const head = new THREE.Group();
  head.position.y = 0.86;
  upper.add(head);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.38, 28, 18), lib.helmet);
  head.add(helmet);

  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), new THREE.MeshStandardMaterial({
    color: 0x062833,
    emissive: 0x1ad4ff,
    emissiveIntensity: 0.85,
    roughness: 0.15,
    metalness: 0.1,
  }));
  visor.position.set(0, -0.02, 0.12);
  visor.scale.set(0.92, 0.72, 0.55);
  head.add(visor);

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.42),
    new THREE.MeshBasicMaterial({ map: lib.face, transparent: true, depthWrite: false }),
  );
  face.position.set(0, -0.02, 0.3);
  head.add(face);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.02, 8, 28), lib.cyan);
  rim.position.set(0, -0.02, 0.2);
  head.add(rim);

  const earL = makeEar(lib, -1);
  const earR = makeEar(lib, 1);
  head.add(earL, earR);

  const armL = makeArm(lib, 1);
  const armR = makeArm(lib, -1);
  upper.add(armL, armR);

  const tail = makeTail(lib);
  upper.add(tail);

  return { root, tilt, bob, upper, legL, legR, armL, armR, tail, earL, earR, head };
}

function makeEar(lib, side) {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.32, 5), lib.ear);
  outer.scale.z = 0.7;
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 5), lib.earIn);
  inner.position.y = -0.02;
  inner.position.z = 0.03;
  g.add(outer, inner);
  g.position.set(side * 0.2, 0.3, -0.02);
  g.rotation.z = side * -0.4;
  g.scale.setScalar(1.28);
  return g;
}

function makeArm(lib, side) {
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.34, 0.48, 0);
  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.16, 4, 8), lib.suit);
  upper.position.y = -0.16;
  upper.rotation.z = side * -0.25;
  pivot.add(upper);

  const glove = new THREE.Group();
  glove.position.set(side * 0.08, -0.36, 0.02);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), lib.glove);
  shell.scale.set(1.35, 1.05, 1.15);
  glove.add(shell);
  for (let i = 0; i < 3; i++) {
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), lib.cyan);
    light.position.set(0, 0.05 - i * 0.055, -0.11);
    light.scale.setScalar(1.35);
    glove.add(light);
  }
  pivot.add(glove);
  pivot.rotation.z = side * 0.42;
  return pivot;
}

function makeLeg(lib, side) {
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.13, 0.58, 0);
  const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.28, 4, 8), lib.suit);
  limb.position.y = -0.24;
  const foot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), lib.suit);
  foot.scale.set(1.15, 0.65, 1.4);
  foot.position.set(0, -0.46, 0.05);
  pivot.add(limb, foot);
  return pivot;
}

function makeTail(lib) {
  const g = new THREE.Group();
  g.position.set(0.04, 0.2, -0.24);
  let parent = g;
  for (let i = 0; i < 7; i++) {
    const seg = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.095 - i * 0.009, 10, 8), lib.tail);
    mesh.position.set(-0.11, -0.06, -0.11);
    seg.add(mesh);
    parent.add(seg);
    parent = seg;
  }
  g.rotation.z = 0.85;
  return g;
}

export function updateMochi(m, time, speed, grounded, duck, lean, dt) {
  const pace = time * (grounded ? 10 + speed * 0.22 : 3.2);
  const swing = Math.sin(pace);
  const ducking = duck > 0.05 && grounded;

  m.legL.rotation.x = (ducking ? 0.7 : 0) + swing * (ducking ? 0.25 : 0.95);
  m.legR.rotation.x = (ducking ? 0.35 : 0) - swing * (ducking ? 0.25 : 0.95);
  m.armL.rotation.x = ducking ? 0.4 : (grounded ? -swing * 0.7 : -0.9);
  m.armR.rotation.x = ducking ? 0.55 : (grounded ? swing * 0.7 : -0.45);
  m.armL.rotation.z = 0.42;
  m.armR.rotation.z = -0.42;

  m.upper.rotation.x = duck * 1.12;
  m.upper.position.y = 0.64 - duck * 0.34;
  m.upper.position.z = duck * 0.22;
  m.bob.position.y = grounded && duck < 0.2 ? Math.abs(Math.cos(pace)) * 0.055 : 0;
  m.tilt.rotation.z = THREE.MathUtils.damp(m.tilt.rotation.z, THREE.MathUtils.clamp(-lean * 0.03, -0.22, 0.22), 8, dt);
  m.tilt.rotation.y = THREE.MathUtils.damp(m.tilt.rotation.y, THREE.MathUtils.clamp(-lean * 0.018, -0.18, 0.18), 8, dt);

  m.tail.rotation.y = Math.sin(time * 3.2) * 0.45;
  m.tail.rotation.x = -0.35 + Math.sin(time * 6) * 0.12;
  m.earL.rotation.z = -0.35 + Math.sin(time * 8) * 0.04;
  m.earR.rotation.z = 0.35 - Math.sin(time * 8) * 0.04;
}

export function makeRobot(index) {
  const scheme = SCHEMES[index % SCHEMES.length];
  const body = mat(scheme.body, { roughness: 0.4, metalness: 0.18 });
  const limb = mat(scheme.limb, { roughness: 0.42, metalness: 0.16 });
  const dark = mat(scheme.dark, { roughness: 0.5, metalness: 0.3 });
  const eyeMat = mat(0xffe56a, { emissive: 0xffd15a, emissiveIntensity: 0.7, roughness: 0.3 });
  const pupil = new THREE.MeshStandardMaterial({ color: 0x1a1c22, roughness: 0.4 });
  const catchlight = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const nose = mat(0xf08a3c, { emissive: 0xc2410c, emissiveIntensity: 0.4 });

  const root = new THREE.Group();
  if (index === 4) root.scale.setScalar(1.12);

  const legL = robotLimb(limb, dark, -1);
  const legR = robotLimb(limb, dark, 1);
  root.add(legL, legR);

  const torso = new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.62, 0.48, 3, 0.08), body);
  torso.position.y = 0.98;
  root.add(torso);

  const chest = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.3, 0.1, 2, 0.03), dark);
  chest.position.set(0, 1.0, 0.24);
  root.add(chest);
  for (let i = 0; i < 3; i++) {
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.035, 0.02), mat(scheme.trim, { emissive: scheme.trim, emissiveIntensity: 0.8 }));
    slit.position.set(0, 1.1 - i * 0.09, 0.28);
    root.add(slit);
  }

  const head = new THREE.Mesh(new RoundedBoxGeometry(0.64, 0.5, 0.5, 3, 0.1), body);
  head.position.y = 1.58;
  root.add(head);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), eyeMat);
  const eyeR = eyeL.clone();
  eyeL.position.set(-0.16, 1.6, 0.22);
  eyeR.position.set(0.16, 1.6, 0.22);
  root.add(eyeL, eyeR);
  for (const eye of [eyeL, eyeR]) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), pupil);
    p.position.set(0, 0, 0.09);
    eye.add(p);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), catchlight);
    h.position.set(0.04, 0.04, 0.1);
    eye.add(h);
  }

  const noseMesh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), nose);
  noseMesh.position.set(0, 1.46, 0.28);
  root.add(noseMesh);

  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 6, 12, Math.PI), dark);
  smile.position.set(0, 1.4, 0.26);
  smile.rotation.z = Math.PI;
  smile.rotation.x = 0.2;
  root.add(smile);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 8), dark);
  antenna.position.set(0, 1.96, 0);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat(scheme.trim, { emissive: scheme.trim, emissiveIntensity: 0.9 }));
  ball.position.set(0, 2.12, 0);
  root.add(antenna, ball);
  if (index % 2 === 0) {
    const antenna2 = antenna.clone();
    antenna2.position.x = 0.16;
    antenna2.scale.y = 0.7;
    antenna2.position.y = 1.9;
    root.add(antenna2);
  }

  const armL = robotArm(limb, dark, 1);
  const armR = robotArm(limb, dark, -1);
  root.add(armL, armR);

  return { group: root, armL, armR, legL, legR, eyeL, eyeR, scheme };
}

function robotLimb(limb, dark, side) {
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.18, 0.66, 0);
  const leg = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.42, 0.18, 2, 0.05), limb);
  leg.position.y = -0.22;
  const foot = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.1, 0.3, 2, 0.03), dark);
  foot.position.set(0, -0.44, 0.04);
  pivot.add(leg, foot);
  return pivot;
}

function robotArm(limb, dark, side) {
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.44, 1.16, 0);
  const arm = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.42, 0.16, 2, 0.05), limb);
  arm.position.y = -0.22;
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), dark);
  hand.position.y = -0.46;
  pivot.add(arm, hand);
  pivot.rotation.z = side * 0.25;
  return pivot;
}

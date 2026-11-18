import * as THREE from 'three';

const OUTLINE = new THREE.MeshBasicMaterial({ color: 0x14081c, side: THREE.BackSide });

const MAT = {
  pink: std(0xff4db2, 0x6a1048),
  purple: std(0x6a3cff, 0x24105a),
  teal: std(0x2ad4c8, 0x0a4050),
  cyan: std(0x7af6ff, 0x0a4058),
  orange: std(0xff8a1a, 0x6a3208),
  navy: std(0x243056, 0x101828),
  screen: new THREE.MeshBasicMaterial({ color: 0x9dffe8 }),
  green: new THREE.MeshBasicMaterial({ color: 0x3dff9a }),
  ink: new THREE.MeshStandardMaterial({ color: 0x1a1030, roughness: 0.6, metalness: 0.2 }),
};

function std(color, emissive) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.38,
    metalness: 0.22,
    emissive,
    emissiveIntensity: 0.45,
  });
}

function hull(mesh, amount = 0.06) {
  const shell = new THREE.Mesh(mesh.geometry, OUTLINE);
  shell.scale.setScalar(1 + amount);
  mesh.add(shell);
  return mesh;
}

function boltMesh(color) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 3), 3));
  const ids = [];
  for (let i = 0; i < 6; i++) {
    const o = i * 2;
    ids.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
  }
  geo.setIndex(ids);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color, side: THREE.DoubleSide, toneMapped: false,
  }));
  mesh.frustumCulled = false;
  return mesh;
}

function cube(parent, x, y, z, pink) {
  const g = new THREE.Group();
  const body = hull(new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.15, 1.15), pink ? MAT.pink : MAT.purple), 0.05);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), MAT.green);
  face.position.z = 0.59;
  const face2 = face.clone();
  face2.position.set(0.59, 0, 0);
  face2.rotation.y = Math.PI / 2;
  const chip = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.28), MAT.teal);
  chip.position.y = 0.64;
  g.add(body, face, face2, chip);
  g.position.set(x, y, z);
  g.userData.kind = 'cube';
  parent.add(g);
  return g;
}

function capsule(parent, x, z, yaw) {
  const g = new THREE.Group();
  const shell = hull(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.72, 1.45), MAT.teal), 0.045);
  shell.position.y = 0.46;
  const lip = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.12), MAT.navy);
  lip.position.set(0, 0.84, 0.62);
  const lipB = lip.clone();
  lipB.position.z = -0.62;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.42), MAT.screen);
  screen.position.set(-0.42, 0.56, 0.74);
  g.add(shell, lip, lipB, screen);
  for (let i = 0; i < 3; i++) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.55), i % 2 ? MAT.pink : MAT.purple);
    board.position.set(0.28 + i * 0.26, 0.62, 0.02);
    const trace = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.4), MAT.orange);
    trace.position.set(board.position.x, 0.72, 0);
    g.add(board, trace);
  }
  for (let i = 0; i < 5; i++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.08), MAT.navy);
    vent.position.set(-0.85 + i * 0.22, 0.22, 0.74);
    g.add(vent);
  }
  const pipe = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.055, 8, 16), MAT.orange);
  pipe.rotation.y = Math.PI / 2;
  pipe.position.set(1.05, 0.78, 0);
  const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8), MAT.orange);
  pipe2.rotation.z = Math.PI / 2;
  pipe2.position.set(0.55, 0.98, 0.35);
  const colors = [0xff4db2, 0xffe14a, 0x3dff9a];
  colors.forEach((color, i) => {
    const button = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 6),
      new THREE.MeshBasicMaterial({ color, toneMapped: false }),
    );
    button.position.set(-0.7 + i * 0.22, 0.36, 0.76);
    g.add(button);
  });
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 6, 12), MAT.purple);
  handle.rotation.y = Math.PI / 2;
  handle.position.set(-1.28, 0.62, 0);
  const handleR = handle.clone();
  handleR.position.x = 1.28;
  const footL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.22), MAT.purple);
  footL.position.set(-0.8, 0.08, 0.42);
  const footR = footL.clone();
  footR.position.x = 0.85;
  g.add(pipe, pipe2, handle, handleR, footL, footR);
  g.position.set(x, 0, z);
  g.rotation.y = yaw;
  g.userData.kind = 'capsule';
  parent.add(g);
}

function whale(parent) {
  const g = new THREE.Group();
  const spine = [
    { x: 2.35, s: 0.62, mat: MAT.teal },
    { x: 1.2, s: 0.92, mat: MAT.cyan },
    { x: 0, s: 1.12, mat: MAT.teal },
    { x: -1.25, s: 0.86, mat: MAT.teal },
    { x: -2.3, s: 0.55, mat: MAT.purple },
  ];
  spine.forEach((seg, i) => {
    const body = hull(new THREE.Mesh(new THREE.SphereGeometry(seg.s, 14, 10), seg.mat), 0.04);
    body.scale.set(1.35, 0.62, 0.7);
    body.position.x = seg.x;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(seg.s * 0.7, 0.08, seg.s * 0.9), i % 2 ? MAT.orange : MAT.pink);
    plate.position.set(seg.x, seg.s * 0.48, 0);
    const side = new THREE.Mesh(new THREE.BoxGeometry(seg.s * 0.55, seg.s * 0.36, 0.08), MAT.navy);
    side.position.set(seg.x, 0.02, seg.s * 0.62);
    const side2 = side.clone();
    side2.position.z = -seg.s * 0.62;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, seg.s * 0.5, seg.s * 0.2), MAT.orange);
    stripe.position.set(seg.x + seg.s * 0.2, 0.1, seg.s * 0.5);
    g.add(body, plate, side, side2, stripe);
  });
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 0.7, 7), MAT.navy);
  stalk.rotation.z = Math.PI / 2;
  stalk.position.set(-3.05, 0.02, 0);
  const flukeU = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 1.15), MAT.orange);
  flukeU.position.set(-3.45, 0.35, 0.15);
  flukeU.rotation.x = -0.55;
  const flukeD = flukeU.clone();
  flukeD.position.y = -0.28;
  flukeD.rotation.x = 0.55;
  const fin = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.07, 0.55), MAT.pink);
  fin.position.set(0.4, -0.55, 0.95);
  fin.rotation.x = 0.4;
  fin.rotation.z = 0.25;
  const fin2 = fin.clone();
  fin2.position.z = -0.95;
  fin2.rotation.x = -0.4;
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.85, 5), MAT.purple);
  dorsal.position.set(-0.35, 0.72, 0);
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xb8fff0, toneMapped: false }),
  );
  eye.position.set(2.85, 0.28, 0.42);
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), MAT.navy);
  pupil.position.set(2.98, 0.28, 0.48);
  g.add(stalk, flukeU, flukeD, fin, fin2, dorsal, eye, pupil);
  g.position.set(4, 13.5, -6);
  g.scale.setScalar(1.55);
  g.userData.kind = 'whale';
  parent.add(g);
  return g;
}

function satellite(parent, radius, height, spin) {
  const pivot = new THREE.Group();
  const craft = new THREE.Group();
  const body = hull(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 8), MAT.navy), 0.08);
  body.rotation.z = Math.PI / 2;
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.2, 0.18, 10), MAT.teal);
  dish.position.x = 0.55;
  dish.rotation.z = Math.PI / 2;
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 1.3), MAT.purple);
  panel.position.y = 0.7;
  const panel2 = panel.clone();
  panel2.position.y = -0.7;
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.7, 8), MAT.cyan);
  lens.rotation.z = Math.PI / 2;
  lens.position.x = -0.7;
  craft.add(body, dish, panel, panel2, lens);
  craft.position.set(radius, height, 0);
  pivot.add(craft);
  pivot.userData.spin = spin;
  pivot.userData.kind = 'satellite';
  parent.add(pivot);
  return pivot;
}

function telescope(parent, x, z) {
  const g = new THREE.Group();
  const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 1.1, 6), MAT.navy);
  mount.position.y = 0.55;
  const tube = hull(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.8, 8), MAT.teal), 0.06);
  tube.rotation.z = Math.PI / 2.4;
  tube.position.set(0.35, 1.45, 0);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.2, 10), MAT.screen);
  glass.position.set(1.15, 1.9, 0);
  glass.rotation.y = Math.PI / 2;
  g.add(mount, tube, glass);
  g.position.set(x, 0, z);
  g.userData.kind = 'telescope';
  parent.add(g);
}

function portal(parent) {
  const g = new THREE.Group();
  const colors = [MAT.cyan, MAT.pink, MAT.orange, MAT.purple];
  colors.forEach((mat, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.15 - i * 0.28, 0.09, 8, 28), mat);
    g.add(ring);
  });
  const mouth = new THREE.Mesh(
    new THREE.CircleGeometry(1.15, 24),
    new THREE.MeshBasicMaterial({ color: 0x07041a }),
  );
  g.add(mouth);
  g.position.set(0, 3.4, 48);
  g.userData.kind = 'portal';
  parent.add(g);
  return g;
}

function hand(parent) {
  const g = new THREE.Group();
  const palm = hull(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.38, 1.15), MAT.teal), 0.05);
  palm.position.y = 1.7;
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 1.1, 8), MAT.purple);
  wrist.position.y = 0.85;
  g.add(palm, wrist);
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.55, 3, 5), MAT.cyan);
    finger.position.set(-0.48 + i * 0.32, 2.15, 0.15);
    finger.rotation.x = -0.7;
    g.add(finger);
  }
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.38, 3, 5), MAT.orange);
  thumb.position.set(0.85, 1.85, 0.15);
  thumb.rotation.z = -0.8;
  g.add(thumb);
  g.position.set(40, 0, -20);
  g.rotation.y = -0.6;
  g.scale.setScalar(1.7);
  g.userData.kind = 'hand';
  parent.add(g);
}

function skyline(parent) {
  const g = new THREE.Group();
  const colors = [MAT.navy, MAT.teal, MAT.purple, MAT.pink];
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2;
    const h = 7 + (i % 5) * 3.2;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(2.2, h, 2.2), colors[i % colors.length]);
    tower.position.set(Math.cos(ang) * 92, h / 2 - 2, Math.sin(ang) * 92);
    g.add(tower);
    if (i % 3 === 0) {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(1.15, 10, 8), MAT.cyan);
      dome.position.set(tower.position.x, h - 2, tower.position.z);
      g.add(dome);
    } else if (i % 3 === 1) {
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.4, 5), MAT.orange);
      spire.position.set(tower.position.x, h - 0.6, tower.position.z);
      g.add(spire);
    }
  }
  parent.add(g);
}

function dataTower(parent, x, z) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.4 - i * 0.12, 0.7, 1.4 - i * 0.12), i % 2 ? MAT.teal : MAT.purple);
    box.position.y = 0.4 + i * 0.75;
    g.add(box);
  }
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 5), MAT.orange);
  antenna.position.y = 4.6;
  g.add(antenna);
  g.position.set(x, 0, z);
  g.userData.kind = 'tower';
  parent.add(g);
}

function link(parent, a, b) {
  const mesh = boltMesh(0x9af6ff);
  parent.add(mesh);
  return { mesh, a: a.position, b: b.position };
}

export function addSetPieces(group, theme) {
  const bolts = [];
  let whaleMesh = null;
  const orbits = [];
  let portalMesh = null;
  if (theme.kind === 'market') {
    const pairs = [
      [[-28, 9.2, -8], [-25.4, 10.6, -6]],
      [[22, 8.4, 8], [24.6, 9.8, 6.2]],
      [[-8, 11.2, 40], [-5.4, 10.1, 42]],
    ];
    for (const pair of pairs) {
      const cubes = pair.map(([x, y, z], i) => cube(group, x, y, z, i === 0));
      bolts.push(link(group, cubes[0], cubes[1]));
    }
    cube(group, 36, 7.2, -30, true);
    capsule(group, -34, -8, 0.5);
    capsule(group, 10, -44, -0.4);
    capsule(group, -12, 44, 0.2);
    capsule(group, 42, 6, 1.1);
  } else if (theme.kind === 'harbor') {
    whaleMesh = whale(group);
    orbits.push(satellite(group, 18, 11, 0.18));
    orbits.push(satellite(group, 28, 15, -0.12));
    telescope(group, -40, 28);
    telescope(group, 42, -22);
    telescope(group, 6, 46);
    capsule(group, -30, -36, 0.3);
  } else {
    portalMesh = portal(group);
    hand(group);
    skyline(group);
    dataTower(group, -42, 34);
    dataTower(group, 44, -32);
    cube(group, -28, 8.5, 8, false);
    cube(group, 24, 7.2, -40, true);
    capsule(group, -36, -8, 0.8);
  }
  return { bolts, whale: whaleMesh, orbits, portal: portalMesh };
}

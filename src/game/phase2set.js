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
  const body = hull(new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 12), MAT.teal), 0.045);
  body.scale.set(1.7, 0.72, 1.05);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.07, 8, 18), MAT.orange);
  band.rotation.y = Math.PI / 2;
  const pipe = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 6, 14), MAT.orange);
  pipe.position.set(0.2, 0.55, 0);
  pipe.rotation.x = Math.PI / 2;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.38), MAT.screen);
  screen.position.set(0, 0.22, 0.78);
  const footL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.22), MAT.purple);
  const footR = footL.clone();
  footL.position.set(-0.55, -0.7, 0);
  footR.position.set(0.55, -0.7, 0);
  g.add(body, band, pipe, screen, footL, footR);
  g.position.set(x, 0.95, z);
  g.rotation.y = yaw;
  g.userData.kind = 'capsule';
  parent.add(g);
}

function whale(parent) {
  const g = new THREE.Group();
  const body = hull(new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), MAT.teal), 0.04);
  body.scale.set(3.2, 1.35, 1.65);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.72, 12, 8), MAT.purple);
  belly.scale.set(2.4, 0.55, 1.05);
  belly.position.y = -0.35;
  const bandA = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 0.7), MAT.orange);
  bandA.position.set(0.7, 1.15, 0.55);
  const bandB = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.24, 0.55), MAT.pink);
  bandB.position.set(-0.8, 1.05, -0.6);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.15), MAT.orange);
  tail.position.set(-3.15, 0.45, 0);
  tail.rotation.z = 0.5;
  const tail2 = tail.clone();
  tail2.position.y = -0.35;
  tail2.rotation.z = -0.5;
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.45), MAT.cyan);
  fin.position.set(-0.4, -0.15, 1.15);
  fin.rotation.x = 0.4;
  const fin2 = fin.clone();
  fin2.position.z = -1.15;
  fin2.rotation.x = -0.4;
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), MAT.screen);
  eye.position.set(2.6, 0.35, 0.7);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.08), MAT.orange);
  panel.position.set(0.4, 0.55, 1.15);
  g.add(body, belly, bandA, bandB, tail, tail2, fin, fin2, eye, panel);
  g.position.set(6, 10.5, 4);
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
  g.position.set(0, 2.5, 32.5);
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
  g.position.set(9.5, 0, 11);
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
    tower.position.set(Math.cos(ang) * 74, h / 2 - 2, Math.sin(ang) * 74);
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
      [[-14, 6.2, 2], [-11.6, 7.4, 4.2]],
      [[12, 5.4, 16], [14.4, 6.6, 14.2]],
      [[-6, 8.2, 22], [-3.4, 7.1, 24]],
    ];
    for (const pair of pairs) {
      const cubes = pair.map(([x, y, z], i) => cube(group, x, y, z, i === 0));
      bolts.push(link(group, cubes[0], cubes[1]));
    }
    cube(group, 8, 4.8, -14, true);
    capsule(group, -8, -4, 0.4);
    capsule(group, 7.5, 8, -0.6);
    capsule(group, -6, 18, 0.2);
  } else if (theme.kind === 'harbor') {
    whaleMesh = whale(group);
    orbits.push(satellite(group, 16, 9.5, 0.18));
    orbits.push(satellite(group, 22, 12, -0.12));
    telescope(group, -20, 6);
    telescope(group, 24, 10);
    telescope(group, -8, 22);
  } else {
    portalMesh = portal(group);
    hand(group);
    skyline(group);
    dataTower(group, -16, 26);
    dataTower(group, 15, 28);
    cube(group, -6, 5.5, 20, false);
    cube(group, 5, 4.6, 18, true);
  }
  return { bolts, whale: whaleMesh, orbits, portal: portalMesh };
}

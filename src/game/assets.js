import * as THREE from 'three';

function srgbTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function makeGroundTexture(roadW) {
  const W = 256;
  const H = 512;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  g.fillStyle = '#c48448';
  g.fillRect(0, 0, W, H);

  const u = (x) => ((x / roadW) + 0.5) * W;
  for (let y = 0; y < H; y += 48) {
    const offset = (y / 48) % 2 === 0 ? 0 : 18;
    for (let x = -20; x < W; x += 42) {
      const shade = ((x + y) / 20) % 2 > 1 ? '#e09a58' : '#b46e38';
      g.fillStyle = shade;
      roundRect(g, x + offset, y + 3, 38, 42, 6);
      g.fill();
    }
  }

  g.strokeStyle = 'rgba(90, 190, 196, 0.55)';
  g.lineWidth = 2;
  for (const lane of [-2.2, 0, 2.2]) {
    const x = u(lane);
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, H);
    g.stroke();
  }

  g.strokeStyle = 'rgba(92, 54, 150, 0.55)';
  g.lineWidth = 3;
  for (let y = 16; y < H; y += 46) {
    for (const lane of [-2.2, 0, 2.2]) {
      const x = u(lane);
      g.beginPath();
      g.moveTo(x - 12, y + 10);
      g.lineTo(x, y);
      g.lineTo(x + 12, y + 10);
      g.stroke();
    }
  }

  g.fillStyle = 'rgba(141, 129, 225, 0.95)';
  for (const edge of [-1.1, 1.1]) {
    const x = u(edge);
    g.fillRect(x - 1.5, 0, 3, H);
  }
  g.fillStyle = 'rgba(80, 230, 220, 0.8)';
  g.fillRect(u(-roadW / 2) + 2, 0, 3, H);
  g.fillRect(u(roadW / 2) - 5, 0, 3, H);

  return srgbTexture(c);
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export function makeGrassTexture() {
  const c = canvas(128, 128);
  const g = c.getContext('2d');
  g.fillStyle = '#2f8f3c';
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 220; i++) {
    g.fillStyle = i % 3 === 0 ? '#1f6e30' : i % 3 === 1 ? '#3eae52' : '#2f9440';
    const s = 3 + (i % 5);
    g.fillRect((i * 47) % 128, (i * 29) % 128, s, s);
  }
  const tex = srgbTexture(c);
  tex.repeat.set(5, 12);
  return tex;
}

export function makeGradientTexture() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 220, 256, 20);
  grd.addColorStop(0, '#ee8521');
  grd.addColorStop(0.42, '#ff4f8b');
  grd.addColorStop(1, '#7c3aed');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const gloss = g.createRadialGradient(90, 78, 8, 120, 120, 150);
  gloss.addColorStop(0, 'rgba(255,255,255,0.55)');
  gloss.addColorStop(0.45, 'rgba(255,255,255,0.05)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gloss;
  g.fillRect(0, 0, 256, 256);
  return srgbTexture(c);
}

export function makeScreenTexture() {
  const c = canvas(256, 192);
  const g = c.getContext('2d');
  g.fillStyle = '#12365f';
  g.fillRect(0, 0, 256, 192);
  g.strokeStyle = '#49e7ff';
  g.lineWidth = 2;
  g.strokeRect(12, 12, 232, 150);
  g.fillStyle = '#1c6dff';
  for (let i = 0; i < 7; i++) {
    const w = 40 + ((i * 37) % 120);
    g.globalAlpha = 0.35 + (i % 3) * 0.15;
    g.fillRect(24, 28 + i * 16, w, 6);
  }
  g.globalAlpha = 1;
  g.fillStyle = '#8d81e1';
  g.fillRect(150, 36, 70, 48);
  g.fillStyle = '#ee8521';
  g.fillRect(150, 96, 48, 18);
  return srgbTexture(c);
}

export function makeCubeTexture() {
  const c = canvas(128, 128);
  const g = c.getContext('2d');
  g.fillStyle = '#6a48c9';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#d7c6ff';
  g.lineWidth = 3;
  g.strokeRect(8, 8, 112, 112);
  g.strokeStyle = '#ff6ec8';
  g.beginPath();
  for (let i = 0; i < 5; i++) {
    g.moveTo(16, 24 + i * 18);
    g.lineTo(40 + i * 8, 24 + i * 18);
    g.lineTo(40 + i * 8, 40 + i * 12);
    g.lineTo(100, 40 + i * 12);
  }
  g.stroke();
  return srgbTexture(c);
}

export function makeGoldTexture() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 256, 256, 0);
  grd.addColorStop(0, '#ffe56a');
  grd.addColorStop(0.22, '#ffb03a');
  grd.addColorStop(0.4, '#ff4f9a');
  grd.addColorStop(0.58, '#7af6ff');
  grd.addColorStop(0.76, '#b388ff');
  grd.addColorStop(1, '#fff1a8');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const gloss = g.createRadialGradient(90, 70, 4, 120, 120, 150);
  gloss.addColorStop(0, 'rgba(255,255,255,0.75)');
  gloss.addColorStop(0.4, 'rgba(255,255,255,0.08)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gloss;
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 18; i++) {
    const x = (i * 47) % 256;
    const y = (i * 89) % 256;
    g.fillRect(x, y, 3, 3);
  }
  return srgbTexture(c);
}

function paintCloud(g, x, y, s, color) {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, 70 * s, 28 * s, 0, 0, Math.PI * 2);
  g.ellipse(x - 48 * s, y + 8 * s, 46 * s, 24 * s, 0, 0, Math.PI * 2);
  g.ellipse(x + 52 * s, y + 6 * s, 50 * s, 22 * s, 0, 0, Math.PI * 2);
  g.ellipse(x + 10 * s, y - 16 * s, 40 * s, 24 * s, 0, 0, Math.PI * 2);
  g.fill();
}

function paintCity(g, W, H) {
  const cx = W * 0.5;
  const cy = H * 0.58;
  g.fillStyle = '#8a623c';
  g.beginPath();
  g.ellipse(cx, cy + 18, 250, 46, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#6ea35a';
  g.beginPath();
  g.ellipse(cx, cy, 240, 36, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#8dcc6a';
  g.beginPath();
  g.ellipse(cx - 20, cy - 6, 180, 22, 0, 0, Math.PI * 2);
  g.fill();

  const towers = [
    [-150, 90, 28, '#2f8ea6'], [-110, 140, 22, '#7a5ad4'], [-70, 110, 26, '#3cb6c8'],
    [-30, 170, 24, '#49c0d0'], [10, 200, 30, '#2a7fbe'], [50, 150, 22, '#8d81e1'],
    [90, 120, 26, '#3cb6c8'], [130, 160, 20, '#ee8521'], [168, 100, 24, '#6a48c9'],
    [-180, 70, 18, '#7c3aed'], [200, 80, 16, '#2f8ea6'],
  ];
  for (const [dx, h, w, color] of towers) {
    const x = cx + dx - w / 2;
    const y = cy - h;
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(190, 250, 255, 0.85)';
    for (let row = 8; row < h - 6; row += 12) {
      for (let col = 4; col < w - 4; col += 7) g.fillRect(x + col, y + row, 3, 5);
    }
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fillRect(x, y, w, 3);
  }
}

function paintCubes(g) {
  const spots = [
    [180, 180, 70], [360, 120, 48], [1520, 160, 80], [1760, 240, 46], [1680, 90, 36], [280, 280, 34],
  ];
  for (const [x, y, s] of spots) {
    g.save();
    g.translate(x, y);
    g.rotate(-0.3);
    g.fillStyle = '#6d4ad0';
    g.fillRect(-s / 2, -s / 2, s, s);
    g.strokeStyle = '#ff6ec8';
    g.lineWidth = 3;
    g.strokeRect(-s / 2, -s / 2, s, s);
    g.beginPath();
    g.moveTo(-s * 0.3, -s * 0.2);
    g.lineTo(s * 0.1, -s * 0.2);
    g.lineTo(s * 0.1, s * 0.15);
    g.lineTo(s * 0.32, s * 0.15);
    g.stroke();
    g.restore();
  }
}

export function makeBackdropTexture() {
  const c = canvas(2048, 1024);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  const paint = (img) => {
    paintBackdrop(c, img);
    tex.needsUpdate = true;
  };
  paint(null);
  const img = new Image();
  img.onload = () => {
    paint(img);
    tex.userData.photo = true;
  };
  img.src = '/mockup.jpg';
  return tex;
}

function paintBackdrop(c, img) {
  const g = c.getContext('2d');
  const W = c.width;
  const H = c.height;
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0b2ea6');
  sky.addColorStop(0.34, '#1a58e4');
  sky.addColorStop(0.62, '#2a8ef0');
  sky.addColorStop(0.84, '#ff6a12');
  sky.addColorStop(1, '#e25410');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);

  const glow = g.createRadialGradient(W * 0.5, H * 0.46, 10, W * 0.5, H * 0.46, 280);
  glow.addColorStop(0, 'rgba(255, 150, 40, 0.95)');
  glow.addColorStop(0.22, 'rgba(255, 96, 16, 0.55)');
  glow.addColorStop(0.5, 'rgba(255, 80, 20, 0.08)');
  glow.addColorStop(1, 'rgba(255, 80, 20, 0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ff7a18';
  g.beginPath();
  g.arc(W * 0.5, H * 0.46, 70, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ffb03a';
  g.beginPath();
  g.arc(W * 0.5, H * 0.46, 36, 0, Math.PI * 2);
  g.fill();

  paintCloud(g, 260, 210, 1.4, 'rgba(255,255,255,0.92)');
  paintCloud(g, 520, 150, 0.9, 'rgba(255,246,252,0.88)');
  paintCloud(g, 1560, 180, 1.3, 'rgba(255,255,255,0.9)');
  paintCloud(g, 1820, 260, 1.05, 'rgba(236, 226, 255, 0.85)');
  paintCubes(g);
  paintCity(g, W, H);

  g.strokeStyle = 'rgba(255, 90, 190, 0.8)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(300, 200);
  g.lineTo(360, 250);
  g.lineTo(330, 280);
  g.lineTo(410, 340);
  g.moveTo(1680, 160);
  g.lineTo(1620, 230);
  g.lineTo(1700, 270);
  g.lineTo(1640, 330);
  g.stroke();

  if (img) {
    const off = canvas(W, H);
    const o = off.getContext('2d');
    const cropH = Math.floor(img.height * 0.42);
    o.filter = 'saturate(1.7) contrast(1.2) brightness(0.82)';
    o.drawImage(img, 0, 0, img.width, cropH, W * 0.1, H * 0.0, W * 0.8, H * 0.62);
    o.filter = 'none';
    o.globalCompositeOperation = 'destination-in';
    const mask = o.createLinearGradient(0, H * 0.02, 0, H * 0.74);
    mask.addColorStop(0, 'rgba(0,0,0,1)');
    mask.addColorStop(0.55, 'rgba(0,0,0,0.88)');
    mask.addColorStop(0.82, 'rgba(0,0,0,0.25)');
    mask.addColorStop(1, 'rgba(0,0,0,0)');
    o.fillStyle = mask;
    o.fillRect(0, 0, W, H);
    const side = o.createLinearGradient(W * 0.12, 0, W * 0.88, 0);
    side.addColorStop(0, 'rgba(0,0,0,0)');
    side.addColorStop(0.12, 'rgba(0,0,0,1)');
    side.addColorStop(0.88, 'rgba(0,0,0,1)');
    side.addColorStop(1, 'rgba(0,0,0,0)');
    o.fillStyle = side;
    o.fillRect(0, 0, W, H);
    g.drawImage(off, 0, 0);
  }

  paintCloud(g, 180, 640, 1.3, 'rgba(255,255,255,0.28)');
  paintCloud(g, 1860, 660, 1.2, 'rgba(255,248,252,0.24)');
}

export function makeGlowTexture() {
  const c = canvas(128, 128);
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,0.95)');
  grd.addColorStop(0.25, 'rgba(255,210,140,0.55)');
  grd.addColorStop(0.55, 'rgba(255,80,170,0.18)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeShadowTexture() {
  const c = canvas(128, 128);
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 10, 64, 64, 62);
  grd.addColorStop(0, 'rgba(0,0,0,0.45)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

export function makeFaceTexture() {
  const px = 8;
  const art = [
    '................',
    '................',
    '..####....####..',
    '..#..#....#..#..',
    '..#..#....#..#..',
    '..####....####..',
    '................',
    '......##........',
    '................',
    '...##########...',
    '....########....',
    '................',
    '................',
    '................',
    '................',
    '................',
  ];
  const c = canvas(art[0].length * px, art.length * px);
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  art.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== '#') continue;
      g.fillStyle = '#8af7ff';
      g.fillRect(x * px, y * px, px - 1, px - 1);
    }
  });
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeMarkGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.48);
  shape.lineTo(-0.42, -0.32);
  shape.lineTo(0.42, -0.32);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

export function makeCoinGeometry() {
  const geo = new THREE.CylinderGeometry(0.5, 0.5, 0.11, 6);
  geo.rotateX(Math.PI / 2);
  geo.rotateZ(Math.PI / 6);
  return geo;
}

export function createLibrary() {
  const gradient = makeGradientTexture();
  const gold = makeGoldTexture();
  const ground = makeGroundTexture(8.4);
  const grass = makeGrassTexture();
  const screen = makeScreenTexture();
  const cube = makeCubeTexture();
  const glow = makeGlowTexture();
  const backdrop = makeBackdropTexture();
  const shadow = makeShadowTexture();
  const face = makeFaceTexture();
  const mark = makeMarkGeometry();
  const coin = makeCoinGeometry();

  const suit = new THREE.MeshStandardMaterial({ color: 0xf7f8fb, roughness: 0.42, metalness: 0.06 });
  const helmet = new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 0.32, metalness: 0.08 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xb7c0cc, roughness: 0.28, metalness: 0.72 });
  const ear = new THREE.MeshStandardMaterial({ color: 0xff4fa3, roughness: 0.4, metalness: 0.04, emissive: 0x5a1238, emissiveIntensity: 0.2 });
  const earIn = new THREE.MeshStandardMaterial({ color: 0xffd0e6, roughness: 0.45 });
  const tail = new THREE.MeshStandardMaterial({ color: 0x2a1814, roughness: 0.62 });
  const arm = new THREE.MeshStandardMaterial({ color: 0x3a4150, roughness: 0.42, metalness: 0.35 });
  const glove = arm;
  const cyanDot = new THREE.MeshBasicMaterial({ color: 0x7af6ff });
  const cyan = new THREE.MeshStandardMaterial({
    color: 0x062026,
    emissive: 0x39f3ff,
    emissiveIntensity: 2.4,
    roughness: 0.25,
    metalness: 0.2,
  });
  const logo = new THREE.MeshStandardMaterial({
    color: 0xffe8ff,
    emissive: 0xd946ef,
    emissiveIntensity: 0.7,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });
  const coinMat = new THREE.MeshPhysicalMaterial({
    map: gradient,
    emissiveMap: gradient,
    emissive: 0xffffff,
    emissiveIntensity: 0.28,
    metalness: 0.78,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
  });
  const coinGold = new THREE.MeshPhysicalMaterial({
    map: gold,
    emissiveMap: gold,
    emissive: 0xfff6d0,
    emissiveIntensity: 0.85,
    metalness: 0.85,
    roughness: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
  const coinRim = new THREE.MeshStandardMaterial({ color: 0xfff6ea, metalness: 0.85, roughness: 0.25 });
  const coinRimGold = new THREE.MeshStandardMaterial({
    color: 0xfff1b0,
    emissive: 0xffc14a,
    emissiveIntensity: 0.45,
    metalness: 0.9,
    roughness: 0.18,
  });
  const markMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const server = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.45, metalness: 0.42, emissive: 0x121820, emissiveIntensity: 0.4 });
  const serverLow = new THREE.MeshStandardMaterial({ color: 0x5c6778, roughness: 0.42, metalness: 0.38 });
  const rackFrame = new THREE.MeshStandardMaterial({ color: 0x5c6b80, roughness: 0.34, metalness: 0.62, emissive: 0x1a2433, emissiveIntensity: 0.25 });
  const rackFace = new THREE.MeshStandardMaterial({ color: 0x2a3548, roughness: 0.46, metalness: 0.35, emissive: 0x101820, emissiveIntensity: 0.35 });
  const rackBay = new THREE.MeshStandardMaterial({ color: 0x141c28, roughness: 0.55, metalness: 0.25 });
  const rackTrim = new THREE.MeshStandardMaterial({ color: 0x9aa6b8, roughness: 0.32, metalness: 0.7 });
  const cable = new THREE.MeshStandardMaterial({ color: 0xee8521, roughness: 0.45, emissive: 0x7a3208, emissiveIntensity: 0.35 });
  const cableAlt = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.45, emissive: 0x2a1468, emissiveIntensity: 0.3 });
  const bezel = new THREE.MeshStandardMaterial({ color: 0xd5dce8, roughness: 0.42, metalness: 0.12 });
  const bezelDark = new THREE.MeshStandardMaterial({ color: 0x243044, roughness: 0.5, metalness: 0.2 });
  const screenMat = new THREE.MeshStandardMaterial({
    map: screen,
    emissiveMap: screen,
    emissive: 0xcff6ff,
    emissiveIntensity: 1.15,
    roughness: 0.22,
  });
  const cubeMat = new THREE.MeshStandardMaterial({
    map: cube,
    emissiveMap: cube,
    emissive: 0xb79bff,
    emissiveIntensity: 0.45,
    roughness: 0.4,
    metalness: 0.15,
  });
  const grassMat = new THREE.MeshStandardMaterial({ map: grass, roughness: 1, metalness: 0 });
  const groundMat = new THREE.MeshStandardMaterial({ map: ground, roughness: 0.92, metalness: 0.02 });
  const skirtMat = new THREE.MeshStandardMaterial({ color: 0x1d6a48, roughness: 1 });
  const stone = new THREE.MeshStandardMaterial({ color: 0xc4a574, roughness: 0.9 });
  const cityA = new THREE.MeshStandardMaterial({ color: 0x2f8ea6, emissive: 0x0d3a4a, emissiveIntensity: 0.6, roughness: 0.55 });
  const cityB = new THREE.MeshStandardMaterial({ color: 0x7a5ad4, emissive: 0x2a1860, emissiveIntensity: 0.55, roughness: 0.5 });
  const island = new THREE.MeshStandardMaterial({ color: 0x6ea35a, roughness: 1 });
  const islandRock = new THREE.MeshStandardMaterial({ color: 0x8d6b45, roughness: 1 });

  return {
    gradient, gold, ground, grass, screen, cube, glow, shadow, face, mark, coin, backdrop,
    suit, helmet, silver, ear, earIn, tail, arm, glove, cyan, cyanDot, logo,
    coinMat, coinGold, coinRim, coinRimGold, markMat,
    server, serverLow, rackFrame, rackFace, rackBay, rackTrim,
    cable, cableAlt, bezel, bezelDark, screenMat, cubeMat,
    grassMat, groundMat, skirtMat, stone, cityA, cityB, island, islandRock,
  };
}

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
  g.fillStyle = '#e7c59a';
  g.fillRect(0, 0, W, H);

  const u = (x) => ((x / roadW) + 0.5) * W;
  for (let y = 0; y < H; y += 48) {
    const offset = (y / 48) % 2 === 0 ? 0 : 18;
    for (let x = -20; x < W; x += 42) {
      const shade = ((x + y) / 20) % 2 > 1 ? '#f0d2a8' : '#dcb488';
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
  g.fillStyle = '#3f9a4c';
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 220; i++) {
    g.fillStyle = i % 3 === 0 ? '#2c7a3a' : i % 3 === 1 ? '#58b562' : '#46a352';
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
  const ground = makeGroundTexture(8.4);
  const grass = makeGrassTexture();
  const screen = makeScreenTexture();
  const cube = makeCubeTexture();
  const glow = makeGlowTexture();
  const shadow = makeShadowTexture();
  const face = makeFaceTexture();
  const mark = makeMarkGeometry();
  const coin = makeCoinGeometry();

  const suit = new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 0.48, metalness: 0.08 });
  const helmet = new THREE.MeshStandardMaterial({ color: 0x1a1d27, roughness: 0.28, metalness: 0.62 });
  const ear = new THREE.MeshStandardMaterial({ color: 0xff4fa3, roughness: 0.45, metalness: 0.05, emissive: 0x5a1238, emissiveIntensity: 0.25 });
  const earIn = new THREE.MeshStandardMaterial({ color: 0xffc0dd, roughness: 0.5 });
  const tail = new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.55 });
  const glove = new THREE.MeshStandardMaterial({ color: 0x2a3142, roughness: 0.35, metalness: 0.55 });
  const cyan = new THREE.MeshStandardMaterial({
    color: 0x062026,
    emissive: 0x39f3ff,
    emissiveIntensity: 2.2,
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
  const coinRim = new THREE.MeshStandardMaterial({ color: 0xfff6ea, metalness: 0.85, roughness: 0.25 });
  const markMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const server = new THREE.MeshStandardMaterial({ color: 0x2a2144, roughness: 0.62, metalness: 0.18 });
  const serverLow = new THREE.MeshStandardMaterial({ color: 0x3a4660, roughness: 0.55, metalness: 0.2 });
  const cable = new THREE.MeshStandardMaterial({ color: 0xee8521, roughness: 0.45, emissive: 0x7a3208, emissiveIntensity: 0.35 });
  const cableAlt = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.45, emissive: 0x2a1468, emissiveIntensity: 0.3 });
  const bezel = new THREE.MeshStandardMaterial({ color: 0xd5dce8, roughness: 0.42, metalness: 0.12 });
  const bezelDark = new THREE.MeshStandardMaterial({ color: 0x243044, roughness: 0.5, metalness: 0.2 });
  const screenMat = new THREE.MeshStandardMaterial({
    map: screen,
    emissiveMap: screen,
    emissive: 0x8fd8ff,
    emissiveIntensity: 0.55,
    roughness: 0.32,
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
    gradient, ground, grass, screen, cube, glow, shadow, face, mark, coin,
    suit, helmet, ear, earIn, tail, glove, cyan, logo, coinMat, coinRim, markMat,
    server, serverLow, cable, cableAlt, bezel, bezelDark, screenMat, cubeMat,
    grassMat, groundMat, skirtMat, stone, cityA, cityB, island, islandRock,
  };
}

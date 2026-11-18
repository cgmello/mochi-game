import * as THREE from 'three';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function texOf(c, repeatX = 1, repeatY = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 4;
  return t;
}

function paintGrass() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#2f8a3e';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 420; i++) {
    const x = (i * 47) % 256;
    const y = (i * 91) % 256;
    g.strokeStyle = i % 3 === 0 ? '#1c6a2c' : i % 3 === 1 ? '#57c86a' : '#c6a24a';
    g.globalAlpha = 0.55;
    g.lineWidth = 1 + (i % 3);
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + 6, y - 8, x + (i % 7) - 2, y - 14);
    g.stroke();
  }
  g.globalAlpha = 1;
  return texOf(c, 8, 8);
}

function paintStone() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#8d97a6';
  g.fillRect(0, 0, 256, 256);
  const n = 4;
  const s = 256 / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const light = (x + y) % 2 === 0;
      g.fillStyle = light ? '#e7edf4' : '#c5ced8';
      g.fillRect(x * s + 3, y * s + 3, s - 6, s - 6);
      g.fillStyle = '#5e6874';
      const holes = light ? 4 : 3;
      for (let i = 0; i < holes; i++) {
        for (let j = 0; j < holes; j++) {
          g.beginPath();
          g.arc(x * s + 16 + i * 12, y * s + 16 + j * 12, 2.1, 0, Math.PI * 2);
          g.fill();
        }
      }
      if ((x * 2 + y) % 3 === 0) {
        g.strokeStyle = '#3ce7ff';
        g.globalAlpha = 0.9;
        g.lineWidth = 3;
        g.strokeRect(x * s + 10, y * s + 10, s - 20, s - 20);
        g.globalAlpha = 1;
      }
    }
  }
  return texOf(c, 5, 5);
}

function paintFacade() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#243044';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#8ea0b8';
  g.lineWidth = 3;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 3; x++) {
      const px = 14 + x * 82;
      const py = 16 + y * 60;
      g.fillStyle = (x + y) % 4 === 0 ? '#7af6ff' : (x + y) % 3 === 0 ? '#ffb15a' : '#101820';
      g.fillRect(px, py, 58, 36);
      g.strokeRect(px - 3, py - 3, 64, 42);
    }
  }
  g.fillStyle = '#ff4fa3';
  g.fillRect(0, 124, 256, 6);
  g.fillStyle = '#7af6ff';
  g.fillRect(0, 8, 256, 4);
  return texOf(c, 1, 1);
}

function paintRack() {
  const c = canvas(128, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#3a4658';
  g.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 8; i++) {
    const y = 8 + i * 31;
    g.fillStyle = '#1a2230';
    g.fillRect(10, y, 108, 22);
    g.fillStyle = i % 2 ? '#7af6ff' : '#ee8521';
    g.fillRect(16, y + 8, 10, 6);
    g.fillRect(32, y + 8, 10, 6);
    g.fillStyle = '#9aa6b8';
    g.fillRect(10, y + 22, 108, 2);
  }
  return texOf(c, 1, 1);
}

function paintMountain() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 256, 256);
  grd.addColorStop(0, '#3a2d78');
  grd.addColorStop(0.45, '#24356e');
  grd.addColorStop(1, '#6a3a88');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  g.globalAlpha = 0.45;
  for (let i = 0; i < 28; i++) {
    g.strokeStyle = i % 2 ? '#8d7ad4' : '#142048';
    g.lineWidth = 6 + (i % 4);
    g.beginPath();
    g.moveTo(-10, i * 14);
    g.lineTo(270, i * 14 - 40);
    g.stroke();
  }
  g.globalAlpha = 1;
  return texOf(c, 1, 1);
}

function paintScreen() {
  const c = canvas(256, 160);
  const g = c.getContext('2d');
  g.fillStyle = '#071820';
  g.fillRect(0, 0, 256, 160);
  g.strokeStyle = '#39f3ff';
  g.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    g.beginPath();
    g.moveTo(12, 20 + i * 18);
    g.lineTo(40 + ((i * 37) % 160), 20 + i * 18);
    g.stroke();
  }
  g.fillStyle = '#7af6ff';
  g.fillRect(16, 24, 70, 8);
  g.fillStyle = '#ffb15a';
  g.fillRect(16, 48, 40, 6);
  return texOf(c, 1, 1);
}

function paintMetal() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#e7edf4';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#9aa8b8';
  g.lineWidth = 3;
  g.strokeRect(10, 10, 236, 236);
  g.strokeRect(28, 28, 200, 90);
  g.strokeRect(28, 136, 200, 90);
  g.fillStyle = '#c5d0dc';
  for (let i = 0; i < 40; i++) {
    g.fillRect((i * 53) % 240, (i * 29) % 240, 18, 2);
  }
  g.fillStyle = '#7af6ff';
  g.beginPath();
  g.arc(48, 70, 10, 0, Math.PI * 2);
  g.arc(48, 180, 10, 0, Math.PI * 2);
  g.fill();
  return texOf(c, 1, 1);
}

function paintCloth(hex) {
  const c = canvas(128, 128);
  const g = c.getContext('2d');
  const base = `#${hex.toString(16).padStart(6, '0')}`;
  g.fillStyle = base;
  g.fillRect(0, 0, 128, 128);
  g.globalAlpha = 0.55;
  for (let i = 0; i < 80; i++) {
    const shade = i % 2 ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.28)';
    g.strokeStyle = shade;
    g.lineWidth = 2 + (i % 3);
    const x = (i * 17) % 128;
    const y = (i * 41) % 128;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + 20, y + 6, x + 8, y + 28);
    g.stroke();
  }
  g.globalAlpha = 1;
  return texOf(c, 1, 2);
}

function paintHolo() {
  const c = canvas(128, 256);
  const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 256);
  g.strokeStyle = '#9af6ff';
  g.fillStyle = 'rgba(80, 220, 255, 0.25)';
  g.fillRect(0, 0, 128, 256);
  g.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    g.beginPath();
    g.moveTo(12, 20 + i * 22);
    g.lineTo(110, 20 + i * 22);
    g.stroke();
  }
  return texOf(c, 1, 1);
}

function paintAwning() {
  const c = canvas(128, 64);
  const g = c.getContext('2d');
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? '#ee8521' : '#fff4e4';
    g.fillRect(i * 16, 0, 16, 64);
  }
  return texOf(c, 1, 1);
}

function paintPinkFloor() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#6d5a78';
  g.fillRect(0, 0, 256, 256);
  const n = 4;
  const s = 256 / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      g.fillStyle = (x + y) % 2 ? '#ff7ad4' : '#e43a9a';
      g.fillRect(x * s + 3, y * s + 3, s - 6, s - 6);
      g.fillStyle = '#5a4568';
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          g.beginPath();
          g.arc(x * s + 18 + i * 14, y * s + 18 + j * 14, 2, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.strokeStyle = '#ff4db2';
      g.lineWidth = 4;
      g.strokeRect(x * s + 8, y * s + 8, s - 16, s - 16);
    }
  }
  return texOf(c, 1, 1);
}

function paintGrate() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#1498a4';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#06343c';
  g.lineWidth = 3;
  for (let i = 0; i <= 16; i++) {
    g.beginPath();
    g.moveTo(i * 16, 0);
    g.lineTo(i * 16, 256);
    g.moveTo(0, i * 16);
    g.lineTo(256, i * 16);
    g.stroke();
  }
  g.strokeStyle = '#3ce7ff';
  g.lineWidth = 5;
  g.strokeRect(6, 6, 244, 244);
  return texOf(c, 1, 1);
}

function paintPcb() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#e07018';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#ffe08a';
  g.lineWidth = 3;
  g.beginPath();
  for (let i = 0; i < 14; i++) {
    const y = 16 + i * 16;
    g.moveTo(8, y);
    g.lineTo(40 + (i % 3) * 30, y);
    g.lineTo(40 + (i % 3) * 30, y + 10);
    g.lineTo(220, y + 10);
  }
  g.stroke();
  g.fillStyle = '#ffb15a';
  for (let i = 0; i < 18; i++) {
    g.beginPath();
    g.arc(30 + (i * 37) % 200, 24 + (i * 53) % 200, 5, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = '#ff8a1a';
  g.lineWidth = 4;
  g.strokeRect(8, 8, 240, 240);
  return texOf(c, 1, 1);
}

export function makePhaseTextures() {
  return {
    grass: paintGrass(),
    stone: paintStone(),
    pink: paintPinkFloor(),
    grate: paintGrate(),
    pcb: paintPcb(),
    facade: paintFacade(),
    rack: paintRack(),
    mountain: paintMountain(),
    screen: paintScreen(),
    metal: paintMetal(),
    holo: paintHolo(),
    awning: paintAwning(),
    cloth: paintCloth,
  };
}

export function matte(map, color = 0xffffff, rough = 0.72) {
  return new THREE.MeshStandardMaterial({
    map,
    color,
    roughness: rough,
    metalness: 0.08,
    bumpMap: map,
    bumpScale: 0.08,
  });
}

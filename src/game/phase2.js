import * as THREE from 'three';
import { updateMochi } from './actors.js';
import { GRAVITY } from './constants.js';

const GOAL = 10;
const ISLAND_R = 54;
const RUN = 8.2;
const AIR = 0.46;
const TURN = 2.05;
const JUMP_V = 10.4;
const BODY_R = 0.34;
const FEE = 4000;
const TRICK_PTS = 1500;

const LINES = [
  ['Eu entreguei o trabalho!', 'Não vou pagar!'],
  ['O oráculo errou!', 'Esse dado é falso!'],
  ['O contrato está claro!', 'Você mudou a cláusula!'],
  ['Isso foi combinado!', 'Eu nunca assinei!'],
  ['O modelo acertou!', 'Os dados vazaram!'],
  ['Paga a taxa!', 'O serviço falhou!'],
  ['A prova está aqui!', 'Isso é fabricado!'],
  ['Eu cumpri o prazo!', 'Chegou atrasado!'],
  ['O stake é meu!', 'Você quebrou a regra!'],
  ['Confere o hash!', 'Está adulterado!'],
];

const FIGHTS = [
  { x: 0.4, z: 11, y: 0 },
  { x: -2.2, z: 24, y: 0 },
  { x: 14, z: -6, y: 0 },
  { x: -16, z: 8, y: 0 },
  { x: 6, z: -16, y: 0 },
  { x: -8, z: -22, y: 0 },
  { x: 22, z: 16, y: 0 },
  { x: -22, z: -8, y: 0 },
  { x: 18, z: 28, y: 1.05, platform: true },
  { x: -14, z: 30, y: 0 },
];

const TRICK = [
  { x: 11, z: 7.5 },
  { x: 13.9, z: 7.5 },
  { x: 16.8, z: 7.5 },
  { x: 19.7, z: 7.5 },
  { x: 22.6, z: 7.5 },
];

export function createRoam(game) {
  const world = buildIsland(game.lib);
  world.group.visible = false;
  game.scene.add(world.group);

  const roam = {
    fees: 0,
    resolved: 0,
    goal: GOAL,
    x: 0,
    z: -4,
    y: 0,
    yaw: 0,
    vy: 0,
    support: 0,
    holds: { forward: false, left: false, right: false },
    fights: [],
    coins: [],
    npcs: [],
    trickNext: 0,
    trickArmed: false,
    flipping: false,
    flipAngle: 0,
    wasGrounded: true,
    snapCam: true,
    wave: 1,
    _fwd: new THREE.Vector3(),
    _look: new THREE.Vector3(),

    hold(action, down) {
      if (action === 'back') return;
      if (action in this.holds) this.holds[action] = down;
    },

    release() {
      this.holds.forward = false;
      this.holds.left = false;
      this.holds.right = false;
    },

    enter() {
      world.group.visible = true;
      game.scene.fog.near = 70;
      game.scene.fog.far = 250;
      this.fees = 0;
      this.resolved = 0;
      this.goal = GOAL;
      this.wave = 1;
      this.x = 0;
      this.z = -4;
      this.y = 0;
      this.yaw = 0;
      this.vy = 0;
      this.trickNext = 0;
      this.trickArmed = false;
      this.flipping = false;
      this.flipAngle = 0;
      this.wasGrounded = true;
      this.snapCam = true;
      this.release();
      this._clearActors();
      this._spawnFights();
      this._spawnPeople();
      game.state = 'roam';
      game.mochi.root.visible = true;
      game.bannerText = 'Settle the arguments';
      game.bannerT = 2.2;
      game.audio.setTrack(2);
      this._placeMochi();
    },

    leave() {
      this._clearActors();
      world.group.visible = false;
      this.release();
      this.flipping = false;
    },

    replay() {
      this.enter();
    },

    continueWave() {
      this.wave += 1;
      this.goal += GOAL;
      this._clearActors();
      this._spawnFights();
      this._spawnPeople();
      game.state = 'roam';
      game.bannerText = 'More arguments on the island';
      game.bannerT = 1.8;
      game.audio.setTrack(Math.min(4, 2 + Math.floor(this.resolved / 4)));
    },

    jump() {
      if (game.state !== 'roam') return;
      if (this.y > this.support + 0.08) return;
      if (this.trickArmed) {
        this.flipping = true;
        this.flipAngle = 0;
        this.trickArmed = false;
        this.trickNext = 0;
      }
      this.vy = JUMP_V;
      game.audio.jump();
    },

    mapSnapshot() {
      return {
        x: this.x,
        z: this.z,
        yaw: this.yaw,
        r: ISLAND_R,
        fights: this.fights.filter((f) => !f.resolved).map((f) => ({ x: f.x, z: f.z })),
      };
    },

    update(dt) {
      if (game.state === 'roam') this._updateMove(dt);
      else this._placeMochi();
      this._updateFights(dt);
      this._updatePeople(dt);
      this._updateCoins(dt);
      this._updateCamera(dt);
      this._updateShadow();
    },

    _spawnFights() {
      FIGHTS.forEach((spot, i) => {
        const fight = makeFight(game.lib, world.bubbles, spot, LINES[i % LINES.length]);
        this.fights.push(fight);
        world.group.add(fight.group);
      });
    },

    _spawnPeople() {
      const loops = [
        [[-1.6, -16], [-1.6, 30], [1.6, 30], [1.6, -16]],
        [[-12, 9], [12, 9], [12, 5], [-12, 5]],
        [[-6, -8], [6, -8], [4, 2], [-4, 2]],
        [[20, -4], [28, 6], [20, 18], [12, 8]],
      ];
      const shirts = [0xee8521, 0x7af6ff, 0xc084fc, 0xf7f8fb, 0x3aa8c4, 0xffd15a, 0xff6ea8, 0x9ad27a];
      loops.forEach((loop, li) => {
        for (let n = 0; n < 3; n++) {
          const npc = makePerson(shirts[(li * 3 + n) % shirts.length]);
          const path = loop.map(([x, z]) => new THREE.Vector3(x, 0, z));
          this.npcs.push({ mesh: npc, path, seg: n % path.length, t: n * 0.33, speed: 1.15 + (n % 3) * 0.25 });
          world.group.add(npc);
        }
      });
    },

    _clearActors() {
      for (const fight of this.fights) world.group.remove(fight.group);
      for (const coin of this.coins) world.group.remove(coin.mesh);
      for (const npc of this.npcs) world.group.remove(npc.mesh);
      this.fights = [];
      this.coins = [];
      this.npcs = [];
    },

    _updateMove(dt) {
      if (this.holds.left) this.yaw += TURN * dt;
      if (this.holds.right) this.yaw -= TURN * dt;
      const move = this.holds.forward ? RUN : 0;
      const airborne = this.y > this.support + 0.12;
      const speed = airborne ? move * AIR : move;
      const fx = Math.sin(this.yaw);
      const fz = Math.cos(this.yaw);
      let nx = this.x + fx * speed * dt;
      let nz = this.z + fz * speed * dt;
      for (const solid of world.solids) {
        if (this.y >= solid.top - 0.05) continue;
        const pushed = pushOut(nx, nz, solid, BODY_R);
        nx = pushed.x;
        nz = pushed.z;
      }
      const rad = Math.hypot(nx, nz);
      const limit = ISLAND_R - 1.6;
      if (rad > limit) {
        nx *= limit / rad;
        nz *= limit / rad;
      }
      this.x = nx;
      this.z = nz;

      const prevY = this.y;
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      let support = 0;
      for (const solid of world.solids) {
        if (!inside(this.x, this.z, solid, 0.16)) continue;
        if (prevY >= solid.top - 0.12 && this.y <= solid.top) support = Math.max(support, solid.top);
      }
      const grounded = this.y <= support;
      if (grounded) {
        this.y = support;
        if (this.vy < 0) this.vy = 0;
      }
      this.support = support;

      if (grounded && !this.wasGrounded) this._landed();
      this.wasGrounded = grounded;

      if (this.flipping) this.flipAngle += dt * 13;
      this._placeMochi();
      const lean = (this.holds.left ? 7 : 0) + (this.holds.right ? -7 : 0);
      updateMochi(game.mochi, game.time, Math.abs(speed), grounded && !this.flipping, 0, lean, dt, false);
      this._touchFights();
    },

    _landed() {
      if (this.flipping) {
        this.flipping = false;
        this.flipAngle = 0;
        this.fees += TRICK_PTS;
        game._popup(new THREE.Vector3(this.x, this.y + 1.8, this.z), `Trick +${TRICK_PTS.toLocaleString('en-US')}`, 5000);
        game.audio.coin(5000);
        game._burst(this.x, this.y + 0.6, this.z, 16);
        return;
      }
      const pad = world.solids.find((s) => s.trick != null && inside(this.x, this.z, s, 0.05) && Math.abs(this.support - s.top) < 0.2);
      if (!pad) {
        this.trickNext = 0;
        this.trickArmed = false;
        return;
      }
      if (pad.trick === this.trickNext) {
        this.trickNext += 1;
        this.trickArmed = this.trickNext >= TRICK.length;
      } else if (pad.trick === 0) {
        this.trickNext = 1;
        this.trickArmed = false;
      } else {
        this.trickNext = 0;
        this.trickArmed = false;
      }
    },

    _placeMochi() {
      game.mochi.root.position.set(this.x, this.y, this.z);
      game.mochi.root.rotation.set(this.flipping ? this.flipAngle : 0, this.yaw, 0);
    },

    _touchFights() {
      if (this.flipping) return;
      for (const fight of this.fights) {
        if (fight.resolved) continue;
        const dx = this.x - fight.x;
        const dz = this.z - fight.z;
        if (dx * dx + dz * dz > 1.65 * 1.65) continue;
        if (Math.abs(this.y - fight.y) > 1.05) continue;
        this._resolve(fight);
        return;
      }
    },

    _resolve(fight) {
      fight.resolved = true;
      fight.angry = false;
      fight.leaving = true;
      calmFight(fight);
      const fee = fight.platform ? 6500 : FEE;
      const mesh = new THREE.Mesh(game.lib.coin, game.lib.coinGold);
      mesh.scale.setScalar(0.42);
      mesh.position.set(fight.x, fight.y + 1.2, fight.z);
      world.group.add(mesh);
      this.coins.push({
        mesh,
        fee,
        from: mesh.position.clone(),
        t: 0,
      });
      game.audio.coin(1000);
    },

    _updateFights(dt) {
      for (const fight of this.fights) {
        const wobble = Math.sin(game.time * 16 + fight.x);
        writeBolt(fight.bolt, fight.a.position, fight.b.position, game.time + fight.x);
        fight.bolt.visible = fight.angry;
        fight.bang.visible = fight.angry;
        fight.a.bubble.visible = fight.angry;
        fight.b.bubble.visible = fight.angry;
        if (fight.angry) {
          fight.a.rotation.y = 0.4 + wobble * 0.25;
          fight.b.rotation.y = Math.PI - 0.4 - wobble * 0.25;
          fight.bang.position.y = 2.05 + Math.sin(game.time * 5) * 0.05;
          fight.bang.lookAt(game.camera.position);
          fight.a.bubble.lookAt(game.camera.position);
          fight.b.bubble.lookAt(game.camera.position);
          continue;
        }
        if (!fight.leaving) continue;
        fight.leaveT += dt;
        fight.a.position.x -= 1.8 * dt;
        fight.b.position.x += 1.8 * dt;
        fight.a.rotation.y = -Math.PI / 2;
        fight.b.rotation.y = Math.PI / 2;
        if (fight.leaveT > 2.6) fight.group.visible = false;
      }
    },

    _updatePeople(dt) {
      for (const npc of this.npcs) {
        const a = npc.path[npc.seg];
        const b = npc.path[(npc.seg + 1) % npc.path.length];
        npc.t += dt * npc.speed / Math.max(0.4, a.distanceTo(b));
        if (npc.t >= 1) {
          npc.t = 0;
          npc.seg = (npc.seg + 1) % npc.path.length;
        }
        npc.mesh.position.lerpVectors(a, b, npc.t);
        npc.mesh.position.y = Math.abs(Math.sin(game.time * 6 + npc.seg)) * 0.04;
        npc.mesh.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      }
    },

    _updateCoins(dt) {
      const home = this._look;
      home.set(this.x, this.y + 1.05, this.z);
      this.coins = this.coins.filter((coin) => {
        coin.t += dt / 0.62;
        const k = coin.t < 1 ? coin.t * coin.t : 1;
        coin.mesh.position.lerpVectors(coin.from, home, Math.min(1, k));
        coin.mesh.position.y += Math.sin(Math.min(1, coin.t) * Math.PI) * 0.8;
        coin.mesh.rotation.z += dt * 8;
        if (coin.t < 1) return true;
        world.group.remove(coin.mesh);
        this.fees += coin.fee;
        this.resolved += 1;
        game._popup(home.clone(), `+${coin.fee.toLocaleString('en-US')}`, coin.fee);
        game.audio.coin(5000);
        game.audio.setTrack(Math.min(4, 2 + Math.floor(this.resolved / 3)));
        if (this.resolved >= this.goal && game.state === 'roam') {
          game.state = 'cleared';
          game.bannerText = '';
          game.bannerT = 0;
          game.audio.fanfare();
        }
        return false;
      });
    },

    _updateCamera(dt) {
      const fx = Math.sin(this.yaw);
      const fz = Math.cos(this.yaw);
      const back = 12.4;
      const height = 5.15;
      const desired = this._fwd;
      desired.set(this.x - fx * back, this.y + height, this.z - fz * back);
      this._look.set(this.x + fx * 15, this.y + 1.15, this.z + fz * 15);
      if (this.snapCam) {
        game.camPos.copy(desired);
        game.lookPos.copy(this._look);
        this.snapCam = false;
        game.camera.fov = 50;
        game.camera.updateProjectionMatrix();
      } else {
        const k = 1 - Math.pow(0.002, dt);
        game.camPos.lerp(desired, k);
        game.lookPos.lerp(this._look, k);
      }
      game.camera.position.copy(game.camPos);
      game.camera.lookAt(game.lookPos);
    },

    _updateShadow() {
      const lift = Math.max(0, this.y - this.support);
      const s = Math.max(0.35, 1 - lift * 0.25);
      game.shadow.position.set(this.x, this.support + 0.05, this.z);
      game.shadow.scale.set(s, s, s);
      game.shadow.material.opacity = 0.4 * s;
    },
  };

  return roam;
}

function buildIsland(lib) {
  const group = new THREE.Group();
  const solids = [];

  const grassTex = lib.grass.clone();
  grassTex.wrapS = THREE.RepeatWrapping;
  grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(22, 22);
  grassTex.needsUpdate = true;
  const grass = lib.grassMat.clone();
  grass.map = grassTex;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(ISLAND_R, ISLAND_R * 0.9, 2.2, 56), grass);
  disc.position.y = -1.1;
  const cliff = new THREE.Mesh(new THREE.CylinderGeometry(ISLAND_R * 0.9, ISLAND_R * 0.48, 4.2, 40), lib.islandRock);
  cliff.position.y = -4.1;
  group.add(disc, cliff);

  road(group, lib, 0, 6, 7.2, 62);
  road(group, lib, 0, 8, 40, 6.2);
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(9, 9.4, 0.16, 28), lib.stone);
  plaza.position.set(0, 0.05, 4);
  group.add(plaza);

  addSkyline(group, solids, lib);
  addTrees(group, lib);
  addLamps(group, lib);
  addMountains(group);
  TRICK.forEach((pad, i) => {
    const rack = rackMesh(lib, 2.4, 1.15, 0.92);
    rack.position.set(pad.x, 0, pad.z);
    group.add(rack);
    solids.push({ x: pad.x, z: pad.z, hw: 1.2, hd: 0.58, top: 0.92, trick: i });
  });
  const kiosk = rackMesh(lib, 2.2, 1.6, 1.05);
  kiosk.position.set(18, 0, 28);
  group.add(kiosk);
  solids.push({ x: 18, z: 28, hw: 1.1, hd: 0.8, top: 1.05 });

  return { group, solids, bubbles: bubbleCache() };
}

function road(group, lib, x, z, w, d) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), lib.stone);
  mesh.position.set(x, 0.04, z);
  group.add(mesh);
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xfff6ea });
  const count = Math.max(1, Math.floor(d / 4));
  for (let i = 0; i < count; i++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 1.1), stripeMat);
    stripe.position.set(x, 0.09, z - d / 2 + 2 + i * 4);
    group.add(stripe);
  }
}

function addSkyline(group, solids, lib) {
  const blocks = [
    [-9, -8, 3.2, 2.6, 3.4],
    [-11, 2, 2.4, 2.4, 5.2],
    [-8.5, 16, 3.4, 2.8, 4.1],
    [-10, 28, 2.8, 2.6, 6.4],
    [9, -10, 2.6, 2.4, 3.8],
    [11, 0, 3.2, 2.6, 7.2],
    [8.8, 18, 2.8, 2.4, 4.6],
    [10.5, 30, 3.6, 2.8, 5.5],
    [-18, -18, 3, 3, 4.4],
    [16, -18, 2.6, 2.6, 3.2],
    [-24, 18, 3.2, 2.4, 6.8],
    [26, 8, 2.4, 2.4, 5],
    [0, 36, 4.2, 2.8, 8.2],
    [-28, -2, 2.2, 2.2, 3.6],
    [28, 24, 2.8, 2.2, 4.8],
  ];
  blocks.forEach(([x, z, w, d, h], i) => {
    const tower = building(lib, w, d, h, i);
    tower.position.set(x, 0, z);
    group.add(tower);
    solids.push({ x, z, hw: w / 2, hd: d / 2, top: h });
  });
}

function building(lib, w, d, h, seed) {
  const g = new THREE.Group();
  const mat = seed % 2 ? lib.cityA : lib.rackFrame;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  body.position.y = h / 2;
  g.add(body);
  const floors = Math.max(2, Math.round(h / 0.9));
  for (let i = 0; i < floors; i++) {
    const win = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.72, 0.28),
      i % 3 === 0 ? lib.screenMat : lib.cyanDot,
    );
    win.position.set(0, 0.5 + i * (h * 0.8 / floors), d / 2 + 0.02);
    g.add(win);
  }
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.9, 6), lib.rackTrim);
  antenna.position.y = h + 0.4;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), lib.cyanDot);
  bulb.position.y = h + 0.9;
  g.add(antenna, bulb);
  if (seed % 3 === 0) {
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.45),
      lib.bezel,
    );
    dish.position.set(w * 0.2, h + 0.15, 0);
    dish.rotation.x = Math.PI * 0.85;
    g.add(dish);
  }
  return g;
}

function addTrees(group, lib) {
  const spots = [
    [-5, -12], [5.2, -14], [-5.4, 14], [5.6, 20], [-4.8, 32], [5, 34],
    [-16, 4], [15, 2], [-20, -12], [20, -12], [-26, 8], [24, 20],
    [6, -24], [-8, -28], [12, 24], [-18, 26], [30, -2], [-30, 16],
    [4, 42], [-6, 40], [18, 36], [-22, -20],
  ];
  spots.forEach(([x, z], i) => group.add(tree(lib, x, z, 0.85 + (i % 4) * 0.12, i)));
}

function tree(lib, x, z, s, seed) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 1.1, 6), lib.islandRock);
  trunk.position.y = 0.55;
  const leaf = seed % 2 ? lib.island.clone() : lib.cityA.clone();
  leaf.color = new THREE.Color(seed % 2 ? 0x3ecf7a : 0x2f9e8a);
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.5, 7), leaf);
  canopy.position.y = 1.7;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), lib.cyanDot);
  cap.position.y = 2.35;
  g.add(trunk, canopy, cap);
  g.position.set(x, 0, z);
  g.scale.setScalar(s);
  return g;
}

function addLamps(group, lib) {
  const spots = [];
  for (let z = -18; z <= 36; z += 8) {
    spots.push([-3.8, z], [3.8, z]);
  }
  for (let x = -16; x <= 16; x += 8) spots.push([x, 11.4]);
  spots.forEach(([x, z], i) => {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.3, 6), lib.rackTrim);
    pole.position.y = 1.15;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), lib.rackTrim);
    arm.position.set(0.2, 2.25, 0);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({
      color: i % 2 ? 0xffb15a : 0x7af6ff,
    }));
    glow.position.set(0.42, 2.15, 0);
    g.add(pole, arm, glow);
    g.position.set(x, 0, z);
    group.add(g);
  });
}

function addMountains(group) {
  const cols = [0x24356e, 0x3a2d78, 0x1c4d86, 0x4a3c88, 0x1a3a6a];
  for (let i = 0; i < 14; i++) {
    const ang = (i / 14) * Math.PI * 2;
    const r = 78 + (i % 3) * 10;
    const h = 16 + (i % 5) * 6;
    const mat = new THREE.MeshStandardMaterial({ color: cols[i % cols.length], roughness: 1 });
    const peak = new THREE.Mesh(new THREE.ConeGeometry(8 + (i % 4) * 3, h, 6), mat);
    peak.position.set(Math.cos(ang) * r, h * 0.35 - 2, Math.sin(ang) * r);
    group.add(peak);
    if (i % 2 === 0) {
      const hill = new THREE.Mesh(new THREE.SphereGeometry(7, 8, 6), mat);
      hill.scale.y = 0.45;
      hill.position.set(Math.cos(ang + 0.2) * (r - 8), 0.4, Math.sin(ang + 0.2) * (r - 8));
      group.add(hill);
    }
  }
}

function rackMesh(lib, w, d, h) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lib.rackFrame);
  body.position.y = h / 2;
  const face = new THREE.Mesh(new THREE.BoxGeometry(w * 0.82, h * 0.78, 0.05), lib.rackFace);
  face.position.set(0, h / 2, d / 2 + 0.02);
  g.add(body, face);
  const bays = 3;
  for (let i = 0; i < bays; i++) {
    const bay = new THREE.Mesh(new THREE.BoxGeometry(w * 0.66, 0.08, 0.04), i === 1 ? lib.cyan : lib.rackBay);
    bay.position.set(0, 0.18 + i * 0.22, d / 2 + 0.05);
    g.add(bay);
  }
  return g;
}

function makeFight(lib, bubbles, spot, lines) {
  const group = new THREE.Group();
  group.position.set(spot.x, spot.y, spot.z);
  const a = makeAgent(true);
  const b = makeAgent(false);
  a.position.set(-0.75, 0, 0);
  b.position.set(0.75, 0, 0);
  a.bubble = speechSprite(bubbles, lines[0], -1);
  b.bubble = speechSprite(bubbles, lines[1], 1);
  a.add(a.bubble);
  b.add(b.bubble);
  group.add(a, b);
  const bolt = makeBolt();
  group.add(bolt);
  const bang = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbles.bang, transparent: true, depthWrite: false }));
  bang.position.set(0, 2.05, 0);
  bang.scale.set(0.8, 0.4, 1);
  group.add(bang);
  return {
    group, a, b, bolt, bang,
    x: spot.x, z: spot.z, y: spot.y,
    platform: !!spot.platform,
    angry: true, resolved: false, leaving: false, leaveT: 0,
  };
}

function makeAgent(left) {
  const g = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({
    color: 0x2c3348,
    emissive: 0x9a2040,
    emissiveIntensity: 0.7,
    roughness: 0.38,
    metalness: 0.4,
  });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.32, 6, 10), shell);
  body.position.y = 0.52;
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3358 });
  const eyeGeo = new THREE.SphereGeometry(0.055, 10, 8);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.09, 0.68, 0.18);
  eyeR.position.set(0.09, 0.68, 0.18);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.1), shell);
  fin.position.set(left ? -0.22 : 0.22, 0.74, 0);
  g.add(body, eyeL, eyeR, fin);
  g.userData.shell = shell;
  g.userData.eyes = eyeMat;
  return g;
}

function calmFight(fight) {
  for (const agent of [fight.a, fight.b]) {
    agent.userData.shell.color.setHex(0xd9fff6);
    agent.userData.shell.emissive.setHex(0x14706c);
    agent.userData.shell.emissiveIntensity = 0.35;
    agent.userData.eyes.color.setHex(0x7af6ff);
  }
}

function makeBolt() {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 3), 3));
  const ids = [];
  for (let i = 0; i < 6; i++) {
    const o = i * 2;
    ids.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
  }
  geo.setIndex(ids);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color: 0xff2438,
    side: THREE.DoubleSide,
    toneMapped: false,
  }));
  mesh.frustumCulled = false;
  return mesh;
}

function writeBolt(mesh, a, b, time) {
  const pos = mesh.geometry.attributes.position;
  const segs = 6;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const jag = i === 0 || i === segs ? 0 : Math.sin(time * 22 + i * 1.7) * 0.22;
    const cx = a.x + (b.x - a.x) * t;
    const cz = a.z + (b.z - a.z) * t + jag;
    const cy = 0.85 + Math.sin(t * Math.PI) * 0.45 + (i % 2 ? 0.16 : -0.16);
    pos.setXYZ(i * 2, cx, cy + 0.16, cz);
    pos.setXYZ(i * 2 + 1, cx, cy - 0.16, cz);
  }
  pos.needsUpdate = true;
  mesh.geometry.computeBoundingSphere();
}

function bubbleCache() {
  const cache = new Map();
  function tex(text) {
    if (cache.has(text)) return cache.get(text);
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 160;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 512, 160);
    roundRect(ctx, 8, 16, 496, 112, 28);
    ctx.fillStyle = '#fff7fb';
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ff3358';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(70, 128);
    ctx.lineTo(110, 128);
    ctx.lineTo(78, 154);
    ctx.closePath();
    ctx.fillStyle = '#fff7fb';
    ctx.fill();
    ctx.font = '700 34px sans-serif';
    ctx.fillStyle = '#1a1230';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 72);
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    cache.set(text, texture);
    return texture;
  }
  const bangC = document.createElement('canvas');
  bangC.width = 128;
  bangC.height = 64;
  const bctx = bangC.getContext('2d');
  bctx.font = '800 52px sans-serif';
  bctx.fillStyle = '#ff3355';
  bctx.textAlign = 'center';
  bctx.textBaseline = 'middle';
  bctx.fillText('!!', 64, 34);
  const bang = new THREE.CanvasTexture(bangC);
  bang.colorSpace = THREE.SRGBColorSpace;
  return { tex, bang };
}

function speechSprite(bubbles, text) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: bubbles.tex(text),
    transparent: true,
    depthWrite: false,
  }));
  sprite.position.set(0, 1.7, 0);
  sprite.scale.set(3.6, 1.12, 1);
  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makePerson(shirt) {
  const g = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.55 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xf0c7a4, roughness: 0.6 });
  const legs = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.28, 4, 8), new THREE.MeshStandardMaterial({ color: 0x2a3144, roughness: 0.6 }));
  legs.position.y = 0.28;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.28, 4, 8), cloth);
  torso.position.y = 0.72;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), skin);
  head.position.y = 1.12;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), new THREE.MeshStandardMaterial({ color: 0x2a2118, roughness: 0.7 }));
  hair.position.y = 1.2;
  hair.scale.set(1, 0.55, 1);
  g.add(legs, torso, head, hair);
  return g;
}

function inside(x, z, solid, pad) {
  return Math.abs(x - solid.x) <= solid.hw + pad && Math.abs(z - solid.z) <= solid.hd + pad;
}

function pushOut(x, z, solid, radius) {
  const cx = THREE.MathUtils.clamp(x, solid.x - solid.hw, solid.x + solid.hw);
  const cz = THREE.MathUtils.clamp(z, solid.z - solid.hd, solid.z + solid.hd);
  const dx = x - cx;
  const dz = z - cz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= radius * radius) return { x, z };
  if (d2 < 1e-8) {
    const left = x - (solid.x - solid.hw);
    const right = solid.x + solid.hw - x;
    const back = z - (solid.z - solid.hd);
    const front = solid.z + solid.hd - z;
    const min = Math.min(left, right, back, front);
    if (min === left) return { x: solid.x - solid.hw - radius, z };
    if (min === right) return { x: solid.x + solid.hw + radius, z };
    if (min === back) return { x, z: solid.z - solid.hd - radius };
    return { x, z: solid.z + solid.hd + radius };
  }
  const d = Math.sqrt(d2);
  const push = radius - d;
  return { x: x + (dx / d) * push, z: z + (dz / d) * push };
}

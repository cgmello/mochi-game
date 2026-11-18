import * as THREE from 'three';
import { updateMochi } from './actors.js';
import { GRAVITY } from './constants.js';
import { makePhaseTextures, matte } from './phase2tex.js';
import { addSetPieces } from './phase2set.js';

const GOAL = 20;
const ISLAND_R = 46;
const RUN = 12.4;
const AIR = 0.31;
const BOOST = 1.7;
const TURN = 2.05;
const JUMP_V = 10.4;
const BODY_R = 0.34;

const THEMES = [
  { name: 'Mercado de Contratos', time: 60, accent: 0xee8521, fog: 0xb85a28, water: false, kind: 'market' },
  { name: 'Porto dos Oráculos', time: 45, accent: 0x3ec8d8, fog: 0x1a5688, water: true, kind: 'harbor' },
  { name: 'Praça do Rally', time: 30, accent: 0xc45cff, fog: 0x5a2880, water: false, kind: 'rally' },
];

const FIGHT_SPOTS = [
  [6, -14], [6, -7], [6, 0], [6, 7], [6, 14], [6, 21], [6, 28],
  [0, 30],
  [-6, 28], [-6, 21], [-6, 14], [-6, 7], [-6, 0], [-6, -7], [-6, -14],
  [0, -16],
  [0, 8], [0, 18], [12, 8], [-13, 10],
];

const TRICK = [
  [12, 6.2], [14.8, 6.2], [17.6, 6.2], [20.4, 6.2], [23.2, 6.2],
];

const GEO = {
  helm: new THREE.SphereGeometry(0.28, 14, 10),
  visor: new THREE.SphereGeometry(0.18, 12, 8),
  torso: new THREE.CapsuleGeometry(0.18, 0.26, 4, 8),
  limb: new THREE.CapsuleGeometry(0.045, 0.18, 3, 5),
  joint: new THREE.SphereGeometry(0.055, 8, 6),
  eye: new THREE.SphereGeometry(0.04, 8, 6),
  spark: new THREE.OctahedronGeometry(0.12, 0),
};

let TEX = null;
const CLOTH = new Map();

export function createRoam(game) {
  TEX = makePhaseTextures();
  let world = null;

  const roam = {
    fees: 0,
    islandEarned: 0,
    lostTokens: 0,
    boostT: 0,
    resolved: 0,
    goal: GOAL,
    islandIndex: 0,
    islandName: THEMES[0].name,
    timeLeft: THEMES[0].time,
    x: 0,
    z: -6,
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
    kx: 0,
    kz: 0,
    stun: 0,
    invuln: 0,
    spawn: { x: 0, y: 0, z: -8 },
    _fwd: new THREE.Vector3(),
    _look: new THREE.Vector3(),

    get theme() {
      return THEMES[this.islandIndex];
    },

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
      this.fees = 0;
      this.islandIndex = 0;
      this._boot();
    },
    leave() {
      this._dropWorld();
      this.release();
      this.flipping = false;
    },
    replay() {
      this._boot();
    },
    continueWave() {
      this.nextIsland();
    },
    nextIsland() {
      if (this.islandIndex >= THEMES.length - 1) {
        this.fees = 0;
        this.islandIndex = 0;
      } else this.islandIndex += 1;
      this._boot();
    },
    goIsland(index) {
      this.islandIndex = Math.max(0, Math.min(THEMES.length - 1, index));
      this._boot();
    },

    jump() {
      if (game.state !== 'roam' || this.stun > 0) return;
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
      if (game.state === 'roam') {
        this.timeLeft -= dt;
        if (this.timeLeft <= 0) {
          this.timeLeft = 0;
          this.lostTokens = this.islandEarned;
          this.fees = Math.max(0, this.fees - this.islandEarned);
          this.islandEarned = 0;
          game.state = 'timeout';
          game.audio.crack();
          game.bannerText = '';
          game.bannerT = 0;
        } else this._updateMove(dt);
      } else this._placeMochi();
      this._updateFights(dt);
      this._updatePeople(dt);
      this._updateCoins(dt);
      this._updateWorld(dt);
      this._updateCamera(dt);
      this._updateShadow();
    },

    _boot() {
      this._dropWorld();
      world = buildIsland(game.lib, TEX, this.islandIndex);
      world.group.visible = true;
      game.scene.add(world.group);
      const theme = THEMES[this.islandIndex];
      this.islandName = theme.name;
      this.timeLeft = theme.time;
      this.resolved = 0;
      this.islandEarned = 0;
      this.lostTokens = 0;
      this.boostT = 0;
      this.goal = GOAL;
      game.scene.fog.color.setHex(0x2a4ea6);
      game.scene.fog.near = 120;
      game.scene.fog.far = 340;
      this.x = 0;
      this.z = -6;
      this.y = 0;
      this.yaw = 0;
      this.vy = 0;
      this.kx = 0;
      this.kz = 0;
      this.stun = 0;
      this.invuln = 1.1;
      this.spawn = { x: 0, y: 0, z: -6 };
      this.trickNext = 0;
      this.trickArmed = false;
      this.flipping = false;
      this.flipAngle = 0;
      this.wasGrounded = true;
      this.snapCam = true;
      this.release();
      this.fights = [];
      this.coins = [];
      this.npcs = [];
      this._spawnFights();
      this._spawnPeople();
      game.state = 'roam';
      game.mochi.root.visible = true;
      game.bannerText = theme.name;
      game.bannerT = 2.4;
      game.audio.setTrack(Math.min(4, 2 + this.islandIndex));
      if (world.checks[0]) world.checks[0].active = true;
      this._placeMochi();
    },

    _dropWorld() {
      if (!world) return;
      world.group.traverse((obj) => {
        if (obj.userData.ownGeo && obj.geometry) obj.geometry.dispose();
      });
      game.scene.remove(world.group);
      world = null;
      this.fights = [];
      this.coins = [];
      this.npcs = [];
    },

    _spawnFights() {
      FIGHT_SPOTS.forEach((spot) => {
        const fight = makeFight(spot[0], spot[2] || 0, spot[1]);
        fight.platform = !!spot[2];
        this.fights.push(fight);
        world.group.add(fight.group);
      });
    },

    _spawnPeople() {
      const loops = [
        [[-2.2, -20], [-2.2, 32], [2.2, 32], [2.2, -20]],
        [[-8, 4], [8, 4], [8, 9], [-8, 9]],
        [[16, -10], [24, 2], [16, 12], [10, 0]],
      ];
      const kinds = [
        { hex: 0x2f8a45, dress: true, hat: 0xe6c15a },
        { hex: 0x2a5fd0, shorts: 0x7a4a2a, hat: 0 },
        { hex: 0x1f8a7a, dress: true, hat: 0xc45cff },
        { hex: 0xd4553a, shorts: 0x3a2a22, hat: 0xf2e2b8 },
      ];
      loops.forEach((loop, li) => {
        const count = this.islandIndex === 2 ? 5 : 3;
        for (let n = 0; n < count; n++) {
          const kind = kinds[(li + n + this.islandIndex) % kinds.length];
          const mesh = makePerson(kind);
          const path = loop.map(([x, z]) => new THREE.Vector3(x, 0, z));
          this.npcs.push({ mesh, path, seg: n % path.length, t: n * 0.27, speed: 1.05 + (n % 3) * 0.22 });
          world.group.add(mesh);
        }
      });
    },

    _updateMove(dt) {
      this.invuln = Math.max(0, this.invuln - dt);
      this.stun = Math.max(0, this.stun - dt);
      this.boostT = Math.max(0, this.boostT - dt);
      if (this.stun <= 0) {
        if (this.holds.left) this.yaw += TURN * dt;
        if (this.holds.right) this.yaw -= TURN * dt;
      }
      const pace = this.boostT > 0 ? RUN * BOOST : RUN;
      const move = this.stun > 0 ? 0 : this.holds.forward ? pace : 0;
      const airborne = this.y > this.support + 0.12;
      const speed = airborne ? move * AIR : move;
      const fx = Math.sin(this.yaw);
      const fz = Math.cos(this.yaw);
      this.kx *= Math.pow(0.04, dt);
      this.kz *= Math.pow(0.04, dt);
      let nx = this.x + fx * speed * dt + this.kx * dt;
      let nz = this.z + fz * speed * dt + this.kz * dt;
      for (const solid of world.solids) {
        if (solid.dead) continue;
        if (this.y >= solid.top - 0.05) continue;
        const pushed = pushOut(nx, nz, solid, BODY_R);
        nx = pushed.x;
        nz = pushed.z;
      }
      const rad = Math.hypot(nx, nz);
      const limit = ISLAND_R - 1.5;
      if (rad > limit) {
        nx *= limit / rad;
        nz *= limit / rad;
      }
      this.x = nx;
      this.z = nz;

      const prevY = this.y;
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      let support = this._pitAt(this.x, this.z) ? -8 : 0;
      for (const solid of world.solids) {
        if (solid.dead) continue;
        if (!inside(this.x, this.z, solid, 0.16)) continue;
        if (prevY >= solid.top - 0.15 && this.y <= solid.top) support = Math.max(support, solid.top);
      }
      const grounded = this.y <= support + 0.001;
      if (grounded) {
        this.y = support;
        if (this.vy < 0) this.vy = 0;
      }
      this.support = support;
      if (this.y < -1.7) {
        this._knockout();
        return;
      }
      if (grounded && !this.wasGrounded) this._landed();
      this.wasGrounded = grounded;
      if (this.flipping) this.flipAngle += dt * 13;
      this._placeMochi();
      const lean = (this.holds.left ? 7 : 0) + (this.holds.right ? -7 : 0);
      updateMochi(game.mochi, game.time, Math.abs(speed), grounded && !this.flipping, 0, lean, dt, false);
      this._touchFights();
      this._touchBoosts(grounded);
      if (this.invuln <= 0) this._touchHazards(dt, grounded);
      this._touchChecks();
    },

    _pitAt(x, z) {
      return world.pits.some((p) => inside(x, z, p, 0));
    },

    _landed() {
      if (this.flipping) {
        this.flipping = false;
        this.flipAngle = 0;
        game._popup(new THREE.Vector3(this.x, this.y + 1.8, this.z), 'Trick!', 5000);
        game.audio.coin(5000);
        game._burst(this.x, this.y + 0.6, this.z, 14);
        return;
      }
      const pad = world.solids.find((s) => s.trick != null && !s.dead && inside(this.x, this.z, s, 0.05) && Math.abs(this.support - s.top) < 0.25);
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
        if (dx * dx + dz * dz > 2.05 * 2.05) continue;
        if (Math.abs(this.y - fight.y) > 1.15) continue;
        this._resolve(fight);
        return;
      }
    },

    _resolve(fight) {
      fight.resolved = true;
      fight.angry = false;
      fight.leaving = true;
      calmAgents(fight);
      const mesh = new THREE.Mesh(game.lib.coin, game.lib.coinGold);
      mesh.scale.setScalar(0.36);
      mesh.position.set(fight.x, fight.y + 1.15, fight.z);
      world.group.add(mesh);
      this.coins.push({ mesh, from: mesh.position.clone(), t: 0 });
      game.audio.coin(1000);
    },

    _touchHazards(dt, grounded) {
      for (const cable of world.cables) {
        const dx = this.x - cable.x;
        const dz = this.z - cable.z;
        const lx = dx * Math.cos(cable.rot) + dz * Math.sin(cable.rot);
        const lz = -dx * Math.sin(cable.rot) + dz * Math.cos(cable.rot);
        if (Math.abs(lx) < cable.hw && Math.abs(lz) < 0.45 && grounded && this.y < 0.4) {
          this._trip(-Math.sin(this.yaw), -Math.cos(this.yaw));
          return;
        }
      }
      for (const zap of world.zaps) {
        zap.cool = Math.max(0, zap.cool - dt);
        const d = Math.hypot(this.x - zap.x, this.z - zap.z);
        if (d < 1.45 && zap.cool <= 0 && Math.abs(this.y - zap.y) < 1.4) {
          zap.cool = 1.15;
          const nx = (this.x - zap.x) / Math.max(0.2, d);
          const nz = (this.z - zap.z) / Math.max(0.2, d);
          this.kx = nx * 7;
          this.kz = nz * 7;
          this.vy = Math.max(this.vy, 4);
          this.stun = 0.28;
          game.flash = 0.35;
          game.flashColor = '#ff4fd8';
          game.audio.hit();
        }
      }
      for (const bug of world.bugs) {
        const ang = game.time * 0.7 + bug.phase;
        bug.mesh.position.set(bug.cx + Math.cos(ang) * bug.r, bug.y, bug.cz + Math.sin(ang) * bug.r);
        bug.mesh.rotation.y = -ang;
        const dx = this.x - bug.mesh.position.x;
        const dz = this.z - bug.mesh.position.z;
        if (dx * dx + dz * dz < 1.15 * 1.15 && Math.abs(this.y - bug.y) < 1.2) {
          const len = Math.max(0.2, Math.hypot(dx, dz));
          this.kx = (dx / len) * 9;
          this.kz = (dz / len) * 9;
          this.vy = Math.max(this.vy, 3.2);
          this.stun = 0.2;
          game.audio.hit();
        }
      }
      for (const server of world.unstables) {
        if (server.collapsed) {
          server.mesh.position.y += (server.base - 1.4 - server.mesh.position.y) * Math.min(1, dt * 3);
          continue;
        }
        const on = inside(this.x, this.z, server, 0.1) && Math.abs(this.y - server.top) < 0.35;
        server.mesh.rotation.z = on ? Math.sin(game.time * 18) * 0.08 : 0;
        if (on) server.heat += dt;
        else server.heat = Math.max(0, server.heat - dt);
        if (server.heat > 0.95) {
          server.collapsed = true;
          server.solid.dead = true;
          game.audio.crack();
        }
      }
    },

    _touchBoosts(grounded) {
      if (!grounded || !world.boosts) return;
      for (const pad of world.boosts) {
        if (!inside(this.x, this.z, pad, 0.1)) continue;
        if (this.boostT <= 0.05) {
          game._popup(new THREE.Vector3(this.x, this.y + 1.6, this.z), 'Boost', 1000);
          game.audio.boost();
        }
        this.boostT = 3;
        return;
      }
    },

    _trip(nx, nz) {
      this.kx = nx * 6.5;
      this.kz = nz * 6.5;
      this.vy = 3.4;
      this.stun = 0.45;
      game.audio.hit();
    },

    _touchChecks() {
      for (const check of world.checks) {
        const d = Math.hypot(this.x - check.x, this.z - check.z);
        if (d > 1.55 || Math.abs(this.y - check.y) > 1.3) continue;
        this.spawn = { x: check.x, y: check.y, z: check.z };
        if (!check.active) {
          check.active = true;
          check.glow.material.color.setHex(0x7af6ff);
          check.glow.material.opacity = 1;
          game.bannerText = 'Checkpoint';
          game.bannerT = 0.9;
          game.audio.coin(500);
        }
      }
    },

    _knockout() {
      this.fees = Math.max(0, this.fees - 1);
      this.x = this.spawn.x;
      this.z = this.spawn.z;
      this.y = this.spawn.y;
      this.vy = 0;
      this.kx = 0;
      this.kz = 0;
      this.stun = 0;
      this.invuln = 1.35;
      this.flipping = false;
      this.flipAngle = 0;
      this.wasGrounded = true;
      this.support = this.spawn.y;
      game.bannerText = 'Back to the checkpoint';
      game.bannerT = 1.3;
      game._popup(new THREE.Vector3(this.x, this.y + 1.6, this.z), '-1', 500);
      game.audio.hit();
      this._placeMochi();
    },

    _updateFights(dt) {
      for (const fight of this.fights) {
        writeArc(fight.bolt, fight.a.position, fight.b.position, game.time + fight.x);
        fight.bolt.visible = fight.angry;
        fight.sparks.forEach((spark, i) => {
          spark.visible = fight.angry;
          const s = fight.angry ? 0.12 + Math.abs(Math.sin(game.time * 18 + i * 1.7)) * 0.16 : 0.01;
          spark.scale.setScalar(s);
          spark.rotation.y += dt * 6;
          spark.rotation.z += dt * 3;
        });
        if (fight.angry) {
          fight.a.rotation.y = Math.PI / 2 + Math.sin(game.time * 6) * 0.08;
          fight.b.rotation.y = -Math.PI / 2 - Math.sin(game.time * 6) * 0.08;
          continue;
        }
        if (!fight.leaving) continue;
        fight.leaveT += dt;
        fight.a.position.x -= 1.6 * dt;
        fight.b.position.x += 1.6 * dt;
        fight.a.rotation.y = -Math.PI / 2;
        fight.b.rotation.y = Math.PI / 2;
        if (fight.leaveT > 2.5) fight.group.visible = false;
      }
    },

    _updatePeople(dt) {
      for (const npc of this.npcs) {
        const a = npc.path[npc.seg];
        const b = npc.path[(npc.seg + 1) % npc.path.length];
        npc.t += (dt * npc.speed) / Math.max(0.4, a.distanceTo(b));
        if (npc.t >= 1) {
          npc.t = 0;
          npc.seg = (npc.seg + 1) % npc.path.length;
        }
        npc.mesh.position.lerpVectors(a, b, npc.t);
        npc.mesh.position.y = Math.abs(Math.sin(game.time * 7 + npc.seg)) * 0.03;
        npc.mesh.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
        const swing = Math.sin(game.time * 7 + npc.seg) * 0.45;
        if (npc.mesh.userData.legL) {
          npc.mesh.userData.legL.rotation.x = swing;
          npc.mesh.userData.legR.rotation.x = -swing;
        }
      }
    },

    _updateCoins(dt) {
      const home = new THREE.Vector3(this.x, this.y + 1.05, this.z);
      this.coins = this.coins.filter((coin) => {
        coin.t += dt / 0.55;
        const k = Math.min(1, coin.t * coin.t);
        coin.mesh.position.lerpVectors(coin.from, home, k);
        coin.mesh.position.y += Math.sin(Math.min(1, coin.t) * Math.PI) * 0.7;
        coin.mesh.rotation.z += dt * 8;
        if (coin.t < 1) return true;
        world.group.remove(coin.mesh);
        this.fees += 1;
        this.islandEarned += 1;
        this.resolved += 1;
        game._popup(home.clone(), '+1', 1000);
        game.audio.coin(5000);
        if (this.resolved >= GOAL && game.state === 'roam') {
          game.state = 'cleared';
          game.bannerText = '';
          game.bannerT = 0;
          game.audio.fanfare();
        }
        return false;
      });
    },

    _updateWorld(dt) {
      if (!world) return;
      const leds = world.leds;
      if (leds) {
        const color = leds.instanceColor;
        for (let i = 0; i < leds.count; i++) {
          const on = Math.sin(game.time * 6 + i) > 0.15;
          color.setXYZ(i, on ? 0.5 : 0.05, on ? 1 : 0.25, on ? 1 : 0.3);
        }
        color.needsUpdate = true;
      }
      for (const link of world.pink) {
        writeBolt(link.mesh, link.a, link.b, game.time * 1.4, 0);
      }
      if (world.whale) {
        world.whale.position.x = Math.sin(game.time * 0.22) * 10;
        world.whale.position.y = 10.2 + Math.sin(game.time * 0.4) * 0.45;
        world.whale.rotation.y = 0.15 + Math.sin(game.time * 0.22) * 0.2;
      }
      if (world.orbits) {
        for (const orbit of world.orbits) orbit.rotation.y += dt * orbit.userData.spin;
      }
      if (world.portal) world.portal.rotation.z = Math.sin(game.time * 0.6) * 0.04;
      if (world.boosts) {
        for (const pad of world.boosts) {
          for (const arrow of pad.arrows) {
            arrow.position.z += dt * 3.2;
            if (arrow.position.z > pad.len / 2 - 0.4) arrow.position.z -= pad.len - 0.8;
          }
        }
      }
    },

    _updateCamera(dt) {
      const fx = Math.sin(this.yaw);
      const fz = Math.cos(this.yaw);
      const desired = this._fwd;
      desired.set(this.x - fx * 12.4, this.y + 5.15, this.z - fz * 12.4);
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
      const lift = Math.max(0, this.y - Math.max(0, this.support));
      const s = Math.max(0.35, 1 - lift * 0.25);
      game.shadow.position.set(this.x, Math.max(0, this.support) + 0.05, this.z);
      game.shadow.scale.set(s, s, s);
      game.shadow.material.opacity = 0.4 * s;
    },
  };
  return roam;
}

function buildIsland(lib, tex, index) {
  const theme = THEMES[index];
  const group = new THREE.Group();
  const solids = [];
  const pits = [
    { x: 14, z: 22, hw: 2.35, hd: 1.7 },
    { x: -10, z: 14, hw: 2.2, hd: 1.65 },
    { x: -16, z: -12, hw: 1.35, hd: 1.15 },
  ];
  const grass = new THREE.Mesh(
    new THREE.CylinderGeometry(ISLAND_R, ISLAND_R * 0.9, 2.1, 40),
    matte(tex.grass, 0xffffff, 0.95),
  );
  grass.position.y = -1.05;
  grass.userData.ownGeo = true;
  const cliffMat = matte(tex.mountain, 0xffffff, 1);
  const cliff = new THREE.Mesh(new THREE.CylinderGeometry(ISLAND_R * 0.9, ISLAND_R * 0.5, 3.4, 28), cliffMat);
  cliff.position.y = -3.6;
  cliff.userData.ownGeo = true;
  group.add(grass, cliff);

  const stoneMat = matte(tex.stone, 0xffffff, 0.86);
  road(group, stoneMat, 0, 4, 8.2, 64);
  road(group, stoneMat, 2, 6.2, 36, 7);
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(9.2, 9.5, 0.16, 24), stoneMat);
  plaza.position.set(0, 0.06, 2);
  plaza.userData.ownGeo = true;
  group.add(plaza);

  if (theme.water) {
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(ISLAND_R + 18, 40),
      new THREE.MeshStandardMaterial({ color: 0x1a6a9a, transparent: true, opacity: 0.78, roughness: 0.18, metalness: 0.25 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.55;
    water.userData.ownGeo = true;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(ISLAND_R - 2, ISLAND_R + 24, 56),
      new THREE.MeshStandardMaterial({ color: 0x1f78b4, roughness: 0.12, metalness: 0.35, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    ring.userData.ownGeo = true;
    group.add(water, ring);
    for (const side of [-1, 1]) {
      const dock = new THREE.Mesh(new THREE.BoxGeometry(16, 0.32, 3.4), matte(tex.stone, 0xffffff, 0.72));
      dock.position.set(side * 40, 0.28, -8);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6), matte(tex.metal));
      post.position.set(side * 46.5, 0.9, -6.6);
      const post2 = post.clone();
      post2.position.z = -9.4;
      group.add(dock, post, post2);
      solids.push({ x: side * 38, z: -8, hw: 6, hd: 1.7, top: 0.44 });
      pits.push({ x: side * 44, z: -8, hw: 5, hd: 2.4, water: true });
    }
  }

  addBuildings(group, solids, tex, theme);
  addMountains(group, tex);
  const leds = addProps(group, solids, tex, theme, index);
  const checks = addChecks(group, tex);
  const cables = addCables(group);
  const zaps = addZaps(group, tex);
  const unstables = addUnstable(group, solids, tex);
  const bugs = addBugs(group);
  const decor = addSetPieces(group, theme);
  const boosts = addBoosts(group);
  addTrick(group, solids, tex);
  addPlatform(group, solids, tex, 14, 22, 1.25);
  addPlatform(group, solids, tex, -10, 14, 1.25);
  addBridge(group, solids, tex, 11.5, 22, 3.4);
  addBridge(group, solids, tex, -12.6, 14, 3.2);
  if (theme.kind === 'market') addMarket(group, tex, theme);
  if (theme.kind === 'harbor') addBeacons(group, tex, theme);
  if (theme.kind === 'rally') addRally(group, solids, tex, theme);

  for (const pit of pits) dressPit(group, pit);

  return {
    group, solids, pits, cables, zaps, unstables, bugs, checks, leds, boosts,
    pink: decor.bolts, whale: decor.whale, orbits: decor.orbits, portal: decor.portal,
  };
}

function road(group, mat, x, z, w, d) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), mat);
  mesh.position.set(x, 0.05, z);
  mesh.userData.ownGeo = true;
  group.add(mesh);
}

function addBuildings(group, solids, tex, theme) {
  const facade = matte(tex.facade, 0xffffff, 0.58);
  const neon = new THREE.MeshBasicMaterial({ color: theme.accent });
  const spots = [
    [-9, -10, 3.1, 2.6, 3.6], [9.5, -12, 2.8, 2.4, 4.4],
    [-10, 16, 3.4, 2.6, 5.2], [10, 18, 3, 2.5, 6.4],
    [-18, 0, 2.6, 2.6, 4.2], [18, -2, 2.8, 2.4, 5.6],
    [0, 36, 4.4, 2.6, 7.4], [-22, 20, 2.4, 2.2, 3.8],
    [22, 20, 2.6, 2.2, 4.6], [-14, -22, 3, 2.4, 3.4],
  ];
  spots.forEach(([x, z, w, d, h], i) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), facade);
    body.position.y = h / 2;
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, 0.12, d * 1.02), neon);
    strip.position.y = h * 0.62;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.55, h * 0.22), new THREE.MeshBasicMaterial({ map: tex.screen }));
    screen.position.set(0, h * 0.55, d / 2 + 0.02);
    g.add(body, strip, screen);
    g.position.set(x, 0, z);
    group.add(g);
    solids.push({ x, z, hw: w / 2, hd: d / 2, top: h });
    if (i % 2 === 0) {
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.45),
        matte(tex.metal, 0xffffff, 0.4),
      );
      dish.position.set(x + w * 0.2, h + 0.2, z);
      dish.rotation.x = Math.PI * 0.9;
      group.add(dish);
    }
  });
}

function addMountains(group, tex) {
  const mat = matte(tex.mountain, 0xffffff, 1);
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2;
    const h = 14 + (i % 4) * 5;
    const peak = new THREE.Mesh(new THREE.ConeGeometry(7 + (i % 3) * 2, h, 6), mat);
    peak.position.set(Math.cos(ang) * (62 + (i % 3) * 6), h * 0.28 - 2, Math.sin(ang) * (62 + (i % 3) * 6));
    peak.userData.ownGeo = true;
    group.add(peak);
  }
}

function addProps(group, solids, tex, theme, index) {
  const rack = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 1.35, 0.7), matte(tex.rack), 28);
  const monitor = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.7, 0.18), new THREE.MeshBasicMaterial({ map: tex.screen }), 22);
  const ledGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
  const leds = new THREE.InstancedMesh(ledGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), 56);
  leds.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(56 * 3), 3);
  const dummy = new THREE.Matrix4();
  const rand = mulberry(index * 97 + 3);
  let ri = 0;
  let mi = 0;
  let li = 0;
  for (let n = 0; n < 28; n++) {
    const side = n % 2 ? 1 : -1;
    const x = side * (9 + rand() * 14);
    const z = -24 + rand() * 56;
    if (Math.abs(x) < 5 && Math.abs(z - 4) < 30) continue;
    if (FIGHT_SPOTS.some(([fx, fz]) => Math.hypot(x - fx, z - fz) < 2.6)) continue;
    dummy.makeTranslation(x, 0.68, z);
    rack.setMatrixAt(ri++, dummy);
    if (li < 56) {
      dummy.makeTranslation(x + 0.35, 0.4 + (n % 3) * 0.28, z + 0.36);
      leds.setMatrixAt(li++, dummy);
    }
    solids.push({ x, z, hw: 0.55, hd: 0.35, top: 1.35 });
  }
  rack.count = ri;
  for (let n = 0; n < 22; n++) {
    const x = (n % 2 ? 1 : -1) * (5.2 + (n % 5));
    const z = -16 + n * 2.1;
    dummy.makeTranslation(x, 0.85, z);
    monitor.setMatrixAt(mi++, dummy);
  }
  monitor.count = mi;
  leds.count = li;
  group.add(rack, monitor, leds);

  for (let i = 0; i < 8; i++) {
    const lap = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.06, 0.5), matte(tex.metal));
    const lid = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.4), new THREE.MeshBasicMaterial({ map: tex.screen }));
    lid.position.set(0, 0.24, -0.22);
    lid.rotation.x = -0.4;
    lap.add(base, lid);
    lap.position.set((i % 2 ? 6 : -6) + (i % 3), 0.7, -8 + i * 4);
    group.add(lap);
  }
  return leds;
}

function addChecks(group, tex) {
  const spots = [[0, -6], [0, -16], [0, 4], [0, 14], [0, 24], [0, 32], [8, 20], [-8, 12]];
  return spots.map(([x, z], i) => {
    const g = new THREE.Group();
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), matte(tex.metal));
    block.position.y = 0.35;
    const glow = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 0),
      new THREE.MeshBasicMaterial({ color: i === 0 ? 0x7af6ff : 0x6a5488, transparent: true, opacity: i === 0 ? 1 : 0.45 }),
    );
    glow.position.y = 1.15;
    g.add(block, glow);
    g.position.set(x, 0, z);
    group.add(g);
    return { x, z, y: 0, active: i === 0, glow, mesh: g };
  });
}

function addCables(group) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xee8521, roughness: 0.45, emissive: 0x7a3208, emissiveIntensity: 0.4 });
  const spots = [
    { x: 10, z: 22, rot: 0.3, hw: 1.6 },
    { x: -12, z: 14, rot: 0.6, hw: 1.5 },
    { x: -16, z: -10, rot: 0.2, hw: 1.4 },
  ];
  return spots.map((cable) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, cable.hw * 2, 6), mat);
    mesh.rotation.z = Math.PI / 2;
    mesh.rotation.y = cable.rot;
    mesh.position.set(cable.x, 0.12, cable.z);
    group.add(mesh);
    return cable;
  });
}

function addZaps(group, tex) {
  const spots = [[10, 18], [-12, 6], [9, -14]];
  return spots.map(([x, z]) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), matte(tex.facade));
    mesh.position.set(x, 0.55, z);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color: 0xff5ad8 }));
    mesh.add(edge);
    group.add(mesh);
    return { x, y: 0.55, z, cool: 0, mesh };
  });
}

function addUnstable(group, solids, tex) {
  return [[8.5, -16], [-16, -12]].map(([x, z]) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.9, 1), matte(tex.rack));
    mesh.position.set(x, 0.45, z);
    group.add(mesh);
    const solid = { x, z, hw: 0.65, hd: 0.5, top: 0.9, dead: false };
    solids.push(solid);
    return { mesh, solid, x, z, top: 0.9, hw: 0.65, hd: 0.5, heat: 0, collapsed: false, base: 0.45 };
  });
}

function addBugs(group) {
  const spots = [
    { cx: 16.2, cz: 22, y: 1.4, r: 1.15, phase: 0 },
    { cx: -11.6, cz: 14, y: 1.4, r: 1.1, phase: 1.2 },
    { cx: 6, cz: -14, y: 0.2, r: 1.6, phase: 2 },
    { cx: -4, cz: 30, y: 0.2, r: 1.7, phase: 0.6 },
  ];
  const shell = new THREE.MeshStandardMaterial({
    color: 0x4a5a28, roughness: 0.48, emissive: 0x243810, emissiveIntensity: 0.55,
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xd6ff55 });
  return spots.map((bug) => {
    const mesh = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), shell);
    body.scale.set(1.55, 0.62, 0.9);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), shell);
    head.position.set(0.38, 0.05, 0);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), eyeMat);
    eye.position.set(0.48, 0.12, 0.08);
    const eye2 = eye.clone();
    eye2.position.z = -0.08;
    mesh.userData.kind = 'bug';
    mesh.add(body, head, eye, eye2);
    for (let i = 0; i < 6; i++) {
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.2, 2, 4), shell);
      const side = i < 3 ? 1 : -1;
      const along = (i % 3) - 1;
      leg.position.set(along * 0.18, -0.06, side * 0.18);
      leg.rotation.x = side * 1.05;
      mesh.add(leg);
    }
    group.add(mesh);
    return { ...bug, mesh };
  });
}

function addBridge(group, solids, tex, x, z, len) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, 0.16, 1.2), matte(tex.metal));
  mesh.position.set(x, 0.18, z);
  group.add(mesh);
  solids.push({ x, z, hw: len / 2, hd: 0.6, top: 0.26 });
}

function addBoosts(group) {
  const spots = [
    { x: 6, z: 4, len: 8, rot: 0 },
    { x: 6, z: 20, len: 8, rot: 0 },
    { x: -6, z: 20, len: 8, rot: Math.PI },
    { x: -6, z: 4, len: 8, rot: Math.PI },
  ];
  const padMat = new THREE.MeshStandardMaterial({ color: 0x1c2838, roughness: 0.45, metalness: 0.35, emissive: 0x083040, emissiveIntensity: 0.4 });
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0x3ce7ff, side: THREE.DoubleSide });
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.42);
  shape.lineTo(-0.32, -0.22);
  shape.lineTo(0.32, -0.22);
  const arrowGeo = new THREE.ShapeGeometry(shape);
  return spots.map((spot) => {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, spot.len), padMat);
    pad.position.set(spot.x, 0.12, spot.z);
    pad.rotation.y = spot.rot || 0;
    const arrows = [];
    const count = Math.max(3, Math.floor(spot.len / 1.5));
    for (let i = 0; i < count; i++) {
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.rotation.x = -Math.PI / 2;
      arrow.position.set(0, 0.08, -spot.len / 2 + 0.8 + i * (spot.len / count));
      pad.add(arrow);
      arrows.push(arrow);
    }
    group.add(pad);
    return { x: spot.x, z: spot.z, hw: 1.15, hd: spot.len / 2, len: spot.len, arrows };
  });
}

function dressPit(group, pit) {
  const w = pit.hw * 2;
  const d = pit.hd * 2;
  if (!pit.water) {
    const shaft = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.86, 6, d * 0.86),
      new THREE.MeshBasicMaterial({ color: 0x070212 }),
    );
    shaft.position.set(pit.x, -3.05, pit.z);
    const mouth = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.9, d * 0.9),
      new THREE.MeshBasicMaterial({ color: 0x070212 }),
    );
    mouth.rotation.x = -Math.PI / 2;
    mouth.position.set(pit.x, 0.05, pit.z);
    const grate = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.5, d * 0.5),
      new THREE.MeshBasicMaterial({ color: 0x5a2088 }),
    );
    grate.rotation.x = -Math.PI / 2;
    grate.position.set(pit.x, 0.06, pit.z);
    group.add(shaft, mouth, grate);
  }
  const stripe = new THREE.MeshBasicMaterial({ color: pit.water ? 0x3ce7ff : 0xff2d6a });
  const rims = [
    [0, pit.hd, w + 0.2, 0.16],
    [0, -pit.hd, w + 0.2, 0.16],
    [pit.hw, 0, 0.16, d + 0.2],
    [-pit.hw, 0, 0.16, d + 0.2],
  ];
  for (const [ox, oz, rw, rd] of rims) {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.07, rd), stripe);
    rim.position.set(pit.x + ox, 0.1, pit.z + oz);
    group.add(rim);
  }
  const chev = new THREE.MeshBasicMaterial({ color: 0xffe14a, side: THREE.DoubleSide });
  for (let i = -1; i <= 1; i++) {
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28), chev);
    mark.rotation.x = -Math.PI / 2;
    mark.rotation.z = Math.PI / 4;
    mark.position.set(pit.x + i * 0.55, 0.14, pit.z - pit.hd - 0.38);
    group.add(mark);
  }
}

function addTrick(group, solids, tex) {
  TRICK.forEach(([x, z], i) => {
    const rack = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.92, 1.15), matte(tex.rack));
    rack.position.set(x, 0.46, z);
    group.add(rack);
    solids.push({ x, z, hw: 1.15, hd: 0.58, top: 0.92, trick: i });
  });
}

function addPlatform(group, solids, tex, x, z, top) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, top, 1.8), matte(tex.rack));
  mesh.position.set(x, top / 2, z);
  group.add(mesh);
  solids.push({ x, z, hw: 1.2, hd: 0.9, top });
}

function addMarket(group, tex, theme) {
  const cloth = new THREE.MeshBasicMaterial({ map: tex.awning });
  for (const x of [-7, 7]) {
    const stall = new THREE.Group();
    const table = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 1.2), matte(tex.metal));
    table.position.y = 0.45;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.4), cloth);
    roof.position.y = 1.7;
    stall.add(table, roof);
    stall.position.set(x, 0, -6);
    group.add(stall);
  }
  const holoMat = new THREE.MeshBasicMaterial({ map: tex.holo, transparent: true, side: THREE.DoubleSide });
  for (let i = 0; i < 4; i++) {
    const scroll = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.3), holoMat);
    scroll.position.set(-3 + i * 2, 1.3, 14);
    group.add(scroll);
  }
}

function addBeacons(group, tex, theme) {
  const neon = new THREE.MeshBasicMaterial({ color: theme.accent });
  for (const x of [-12, 12]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 6, 6), matte(tex.metal));
    pole.position.set(x, 3, 28);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), neon);
    lamp.position.set(x, 6.2, 28);
    group.add(pole, lamp);
  }
}

function addRally(group, solids, tex) {
  const stage = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 4.2), matte(tex.stone));
  stage.position.set(14, 0.4, 26);
  group.add(stage);
  solids.push({ x: 14, z: 26, hw: 4, hd: 2.1, top: 0.7 });
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4a1880';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#ffe27a';
  ctx.font = '700 78px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RALLY', 256, 68);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 1.8),
    new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide }),
  );
  banner.position.set(14, 2.6, 28.2);
  banner.rotation.y = Math.PI;
  const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 6), matte(tex.metal));
  const poleR = poleL.clone();
  poleL.position.set(10.2, 1.6, 28.2);
  poleR.position.set(17.8, 1.6, 28.2);
  group.add(banner, poleL, poleR);
}

function makeFight(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const a = makeAgent();
  const b = makeAgent();
  a.position.set(-0.85, 0, 0);
  b.position.set(0.85, 0, 0);
  a.rotation.y = Math.PI / 2;
  b.rotation.y = -Math.PI / 2;
  poseArms(a, true);
  poseArms(b, false);
  group.add(a, b);
  const bolt = makeArc();
  group.add(bolt);
  return { group, a, b, bolt, sparks: [], x, z, y, angry: true, resolved: false, leaving: false, leaveT: 0 };
}

function makeAgent() {
  const g = new THREE.Group();
  const shell = matte(TEX.metal, 0xffffff, 0.42);
  shell.metalness = 0.55;
  const helm = new THREE.Mesh(GEO.helm, shell);
  helm.position.y = 1.22;
  const visor = new THREE.Mesh(GEO.visor, new THREE.MeshStandardMaterial({
    color: 0x101820, roughness: 0.18, metalness: 0.4, emissive: 0x062028, emissiveIntensity: 0.5,
  }));
  visor.scale.set(1.15, 0.78, 0.72);
  visor.position.set(0, 1.22, 0.18);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x7af6ff });
  const eyeL = new THREE.Mesh(GEO.eye, eyeMat);
  const eyeR = new THREE.Mesh(GEO.eye, eyeMat);
  eyeL.position.set(-0.09, 1.24, 0.34);
  eyeR.position.set(0.09, 1.24, 0.34);
  const torso = new THREE.Mesh(GEO.torso, shell);
  torso.position.y = 0.72;
  const armL = makeArm(shell);
  const armR = makeArm(shell);
  armL.position.set(-0.28, 0.98, 0);
  armR.position.set(0.28, 0.98, 0);
  const legL = new THREE.Mesh(GEO.limb, shell);
  const legR = new THREE.Mesh(GEO.limb, shell);
  legL.position.set(-0.09, 0.32, 0);
  legR.position.set(0.09, 0.32, 0);
  g.add(helm, visor, eyeL, eyeR, torso, armL, armR, legL, legR);
  g.userData.shell = shell;
  g.userData.eyes = eyeMat;
  g.userData.armL = armL;
  g.userData.armR = armR;
  return g;
}

function makeArm(shell) {
  const pivot = new THREE.Group();
  const joint = new THREE.Mesh(GEO.joint, shell);
  const upper = new THREE.Mesh(GEO.limb, shell);
  upper.position.y = -0.16;
  const elbow = new THREE.Group();
  elbow.position.y = -0.3;
  const knob = new THREE.Mesh(GEO.joint, shell);
  const fore = new THREE.Mesh(GEO.limb, shell);
  fore.position.y = -0.16;
  elbow.add(knob, fore);
  pivot.add(joint, upper, elbow);
  pivot.userData.elbow = elbow;
  return pivot;
}

function poseArms(agent, pointing) {
  const reach = pointing ? agent.userData.armR : agent.userData.armL;
  const hang = pointing ? agent.userData.armL : agent.userData.armR;
  reach.rotation.x = -1.45;
  reach.rotation.z = pointing ? -0.35 : 0.35;
  reach.userData.elbow.rotation.x = -0.4;
  hang.rotation.z = pointing ? 0.5 : -0.5;
  hang.rotation.x = -0.2;
}

function calmAgents(fight) {
  for (const agent of [fight.a, fight.b]) {
    agent.userData.shell.emissive = agent.userData.shell.emissive || new THREE.Color();
    agent.userData.shell.emissive.setHex(0x14686a);
    agent.userData.shell.emissiveIntensity = 0.35;
    agent.userData.eyes.color.setHex(0xd8fff4);
    agent.userData.armL.rotation.set(0, 0, 0.4);
    agent.userData.armR.rotation.set(0, 0, -0.4);
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
    color: 0xff2438, side: THREE.DoubleSide, toneMapped: false,
  }));
  mesh.frustumCulled = false;
  return mesh;
}

function makeArc() {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(7 * 3), 3));
  const mesh = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xff2438, toneMapped: false }));
  mesh.frustumCulled = false;
  return mesh;
}

function writeArc(mesh, a, b, time) {
  const pos = mesh.geometry.attributes.position;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  for (let i = 0; i < 7; i++) {
    const t = 0.28 + (i / 6) * 0.44;
    const jag = i === 0 || i === 6 ? 0 : (i % 2 ? 0.09 : -0.08) * Math.sin(time * 14 + i);
    pos.setXYZ(i, a.x + dx * t, 1.02 + jag, a.z + dz * t);
  }
  pos.needsUpdate = true;
}

function writeBolt(mesh, a, b, time, lift) {
  const pos = mesh.geometry.attributes.position;
  const segs = 6;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  const px = -dz / len;
  const pz = dx / len;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const jag = i === 0 || i === segs ? 0 : (i % 2 ? 0.28 : -0.22) * Math.sin(time * 18 + i);
    const cx = a.x + dx * t + px * jag * 0.35;
    const cz = a.z + dz * t + pz * jag * 0.35;
    const cy = a.y + (b.y - a.y) * t + lift + jag;
    pos.setXYZ(i * 2, cx + px * 0.05, cy + 0.07, cz + pz * 0.05);
    pos.setXYZ(i * 2 + 1, cx - px * 0.05, cy - 0.07, cz - pz * 0.05);
  }
  pos.needsUpdate = true;
}

function makePerson(kind) {
  const mat = clothMat(kind.hex);
  const skin = new THREE.MeshStandardMaterial({ color: 0xf0c7a4, roughness: 0.7 });
  const g = new THREE.Group();
  const legL = new THREE.Group();
  const legR = new THREE.Group();
  legL.position.set(-0.1, 0.62, 0);
  legR.position.set(0.1, 0.62, 0);
  const legMat = kind.dress ? mat : clothMat(kind.shorts || 0x3a2a22);
  for (const leg of [legL, legR]) {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.36, 3, 6), legMat);
    mesh.position.y = -0.28;
    leg.add(mesh);
  }
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(kind.dress ? 0.22 : 0.18, kind.dress ? 0.55 : 0.38, 4, 8), mat);
  torso.position.y = kind.dress ? 0.95 : 1.02;
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.28, 3, 5), mat);
  const armR = armL.clone();
  armL.position.set(-0.24, 1.05, 0);
  armR.position.set(0.24, 1.05, 0);
  armL.rotation.z = 0.18;
  armR.rotation.z = -0.18;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), skin);
  head.position.y = 1.48;
  g.add(legL, legR, torso, armL, armR, head);
  if (kind.hat) {
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 10), matte(TEX.cloth(kind.hat)));
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 10), hat.material);
    hat.position.y = 1.66;
    brim.position.y = 1.62;
    g.add(hat, brim);
  }
  g.userData.legL = legL;
  g.userData.legR = legR;
  return g;
}

function clothMat(hex) {
  if (!CLOTH.has(hex)) CLOTH.set(hex, matte(TEX.cloth(hex), 0xffffff, 0.88));
  return CLOTH.get(hex);
}

function mulberry(seed) {
  let s = seed || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
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
  return { x: x + (dx / d) * (radius - d), z: z + (dz / d) * (radius - d) };
}

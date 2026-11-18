import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createLibrary } from './assets.js';
import { makeMochi, updateMochi, makeRobot } from './actors.js';
import {
  makeGroundTile,
  makeCoin,
  makeObstacle,
  makePlatform,
  makeBoostPad,
  buildAtmosphere,
  updateBolts,
} from './props.js';
import { bodyTop, obstacleHits, inLane, inDepth, platformSurface } from './collision.js';
import { createRoam } from './phase2.js';
import {
  STAKE,
  VALIDATORS,
  LANES,
  SEGMENT,
  AHEAD,
  DESPAWN_Z,
  TILE,
  TILE_COUNT,
  GRAVITY,
  JUMP_V,
  laneStep,
} from './constants.js';

export { STAKE, VALIDATORS };

export class Game {
  constructor(canvas, audio) {
    this.canvas = canvas;
    this.audio = audio;
    this.lib = createLibrary();
    this.state = 'title';
    this.time = 0;
    this.distance = 0;
    this.speed = 0;
    this.score = 0;
    this.totalGen = 0;
    this.gen = 0;
    this.displayGen = 0;
    this.lives = 3;
    this.doneCount = 0;
    this.lane = 1;
    this.x = LANES[1];
    this.y = 0;
    this.vy = 0;
    this.supportY = 0;
    this.duck = 0;
    this.duckHeld = false;
    this.duckTimer = 0;
    this.jumpBuffer = 0;
    this.invuln = 0;
    this.lean = 0;
    this.shake = 0;
    this.flash = 0;
    this.flashColor = '#ff5d7a';
    this.bannerText = '';
    this.bannerT = 0;
    this.hint = '';
    this.hintCounts = {};
    this.entities = [];
    this.blinkers = [];
    this.popups = [];
    this.popupId = 1;
    this.cursor = 16;
    this.segIndex = 0;
    this.stakeT = 0;
    this.stakeSide = 1;
    this.stakeIndex = 0;
    this.stakeOverflow = 0;
    this.stakeImpact = false;
    this.robot = null;
    this.wipeT = 0;
    this.wipeDelay = 0;
    this.boostT = 0;
    this.auraT = 0;
    this.quietInvuln = false;
    this.phase = 1;
    this.shards = [];
    this.width = 1;
    this.height = 1;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x1a56d6, 200, 460);
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
    this.camPos = new THREE.Vector3(0, 4.1, -8.2);
    this.lookPos = new THREE.Vector3(0, 1.2, 8);
    this._proj = new THREE.Vector3();
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 1;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.28;
    pmrem.dispose();

    this.scene.add(new THREE.HemisphereLight(0x6eb6ff, 0xc46a32, 0.48));
    const sun = new THREE.DirectionalLight(0xffc98a, 1.25);
    sun.position.set(-28, 46, 16);
    const fill = new THREE.DirectionalLight(0x9eb6ff, 0.42);
    fill.position.set(18, 14, -10);
    const rim = new THREE.DirectionalLight(0x8ef6ff, 0.9);
    rim.position.set(4, 8, 22);
    this.scene.add(sun, fill, rim);

    this.mochi = makeMochi(this.lib);
    this.mochi.root.position.set(this.x, 0, 0);
    this.scene.add(this.mochi.root);
    this.aura = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.lib.glow,
      color: 0xff3358,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    this.aura.position.set(0, 0.72, -0.15);
    this.aura.scale.set(1.7, 2.05, 1);
    this.mochi.root.add(this.aura);
    this.auraLight = new THREE.PointLight(0xff3358, 0, 3.2);
    this.auraLight.position.set(0, 0.8, -0.25);
    this.mochi.root.add(this.auraLight);

    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 1.3),
      new THREE.MeshBasicMaterial({ map: this.lib.shadow, transparent: true, depthWrite: false, opacity: 0.4 }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.04;
    this.scene.add(this.shadow);

    this.tiles = [];
    for (let i = 0; i < TILE_COUNT; i++) {
      const tile = makeGroundTile(this.lib, i);
      tile.position.z = (i - 1) * TILE;
      this.blinkers.push(...tile.userData.blinkers);
      this.scene.add(tile);
      this.tiles.push(tile);
    }

    this.atmosphere = buildAtmosphere(this.lib, this.camera);
    this.streaks = [];
    for (let i = 0; i < 12; i++) {
      const side = i < 6 ? -1 : 1;
      const k = i % 6;
      const streak = new THREE.Mesh(
        new THREE.PlaneGeometry(0.018, 0.85),
        new THREE.MeshBasicMaterial({
          color: i % 2 ? 0x7af6ff : 0xff9a3c,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      streak.position.set(side * (1.25 + k * 0.18), -0.05 + (k % 3) * 0.2, -2.4 - k * 0.16);
      streak.rotation.z = side * -0.28;
      this.camera.add(streak);
      this.streaks.push(streak);
    }
    this.trail = [];
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 6),
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0x7af6ff : 0xff9a3c, transparent: true, opacity: 0 }),
      );
      mesh.visible = false;
      this.scene.add(mesh);
      this.trail.push(mesh);
    }

    this.bits = [];
    const bitGeo = new THREE.OctahedronGeometry(0.07, 0);
    for (let i = 0; i < 72; i++) {
      const mesh = new THREE.Mesh(bitGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
      mesh.visible = false;
      this.scene.add(mesh);
      this.bits.push({ mesh, life: 0, max: 1, vel: new THREE.Vector3() });
    }

    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.05, 8, 28),
      new THREE.MeshBasicMaterial({ color: 0xffe3a1, transparent: true, opacity: 0, depthWrite: false }),
    );
    this.ring.visible = false;
    this.ringLife = 0;
    this.scene.add(this.ring);

    this.roam = createRoam(this);
    this._ensureSpawn();
    this.resize();
  }

  startPhase2() {
    if (this.phase === 2) return;
    this.audio.resume();
    this._shelveRunner();
    this.phase = 2;
    this.roam.enter();
  }

  _shelveRunner() {
    this._removeRobot();
    this._maskNearby(false);
    for (const e of this.entities) this.scene.remove(e.mesh);
    this.entities = [];
    this._clearShards();
    for (const tile of this.tiles) tile.visible = false;
    for (const streak of this.streaks) streak.visible = false;
    this.speed = 0;
    this.hint = '';
    this.bannerT = 0;
    this.duck = 0;
    this.invuln = 0;
    this.quietInvuln = false;
    this.auraT = 0;
    this.shake = 0;
    this.mochi.root.visible = true;
  }

  start() {
    if (this.state !== 'title') return;
    this.state = 'run';
    this.speed = 11;
    this.invuln = 1.35;
    this.audio.resume();
  }

  reset() {
    if (this.phase === 2) {
      this.phase = 1;
      this.roam.leave();
      for (const tile of this.tiles) tile.visible = true;
      for (const streak of this.streaks) streak.visible = true;
      this.scene.fog.color.setHex(0x1a56d6);
      this.scene.fog.near = 200;
      this.scene.fog.far = 460;
      this.camera.far = 500;
      this.camera.fov = 50;
      this.camera.updateProjectionMatrix();
    }
    this._removeRobot();
    this._maskNearby(false);
    for (const e of this.entities) this.scene.remove(e.mesh);
    this.entities = [];
    this.popups = [];
    this.cursor = 16;
    this.segIndex = 0;
    this.distance = 0;
    this.speed = 0;
    this.score = 0;
    this.totalGen = 0;
    this.gen = 0;
    this.displayGen = 0;
    this.lives = 3;
    this.doneCount = 0;
    this.lane = 1;
    this.x = LANES[1];
    this.y = 0;
    this.vy = 0;
    this.supportY = 0;
    this.duck = 0;
    this.duckHeld = false;
    this.duckTimer = 0;
    this.jumpBuffer = 0;
    this.invuln = 1.2;
    this.shake = 0;
    this.flash = 0;
    this.bannerT = 0;
    this.boostT = 0;
    this.auraT = 0;
    this.quietInvuln = false;
    this.audio.setTrack(0);
    this._clearShards();
    this.hint = '';
    this.hintCounts = {};
    this.mochi.root.rotation.set(0, 0, 0);
    this.mochi.root.position.set(this.x, 0, 0);
    this.mochi.root.visible = true;
    this.state = 'run';
    this._ensureSpawn();
  }

  hold(action, down) {
    if (this.phase === 2) this.roam.hold(action, down);
  }

  press(action) {
    if (this.phase === 2) {
      if (action === 'hop' || action === 'jump') this.roam.jump();
      return;
    }
    if (this.state !== 'run' && this.state !== 'wipe') return;
    if (action === 'left' || action === 'right') this.lane = laneStep(this.lane, action);
    else if (action === 'jump') this.jumpBuffer = 0.14;
    else if (action === 'duck') {
      this.duckHeld = true;
      this.duckTimer = Math.max(this.duckTimer, 0.42);
    } else if (action === 'duck-end') this.duckHeld = false;
  }

  releaseAll() {
    this.duckHeld = false;
    if (this.roam) this.roam.release();
  }

  debugFill() {
    if (this.state !== 'run') return false;
    this.gen = STAKE;
    this._checkStake();
    return this.state === 'stake';
  }

  debugHurt() {
    if (this.phase === 2 || this.state === 'title' || this.state === 'done') return;
    this.state = 'run';
    this.invuln = 0;
    this._hurt();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / Math.max(1, this.height);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  update(dt) {
    this.time += dt;
    this.flash = Math.max(0, this.flash - dt * 1.5);
    this.bannerT = Math.max(0, this.bannerT - dt);
    for (const p of this.popups) p.life -= dt;
    this.popups = this.popups.filter((p) => p.life > 0);

    if (this.phase === 2) {
      this.roam.update(dt);
      this._updateBits(dt);
      this._updateRing(dt);
      this._updateDecor(dt);
      this.audio.tick();
      this.score = this.roam.fees;
      return;
    }

    if (this.state === 'title') {
      updateMochi(this.mochi, this.time, 0, true, 0, 0, dt);
      this._updateDecor(dt);
      this._updateCamera(dt);
      return;
    }

    if (this.auraT > 0) this.auraT = Math.max(0, this.auraT - dt);
    if (this.state === 'run' || this.state === 'wipe') this._updatePlayer(dt);
    else if (this.state === 'stake') {
      this.y += (0 - this.y) * Math.min(1, dt * 8);
      this.vy = 0;
      this.duck += (0 - this.duck) * Math.min(1, dt * 10);
      this.mochi.root.position.set(this.x, this.y, 0);
    } else if (this.state === 'done') {
      this.y = Math.abs(Math.sin(this.time * 5)) * 0.22;
      this.mochi.root.position.set(this.x, this.y, 0);
    }

    if (this.boostT > 0) this.boostT = Math.max(0, this.boostT - dt);
    const moving = this.state === 'run' || this.state === 'wipe';
    const target = moving ? this._targetSpeed() * (this.state === 'wipe' ? 0.45 : 1) : 0;
    this.speed += (target - this.speed) * Math.min(1, dt * 1.4);
    if (moving || this.speed > 0.05) this._scroll(dt);

    this._animateEntities(dt);
    if (this.state === 'run') {
      this._collect();
      this._collide();
      if (this.state === 'run') this._checkStake();
      if (this.state === 'run') this._updateHint();
      else this.hint = '';
    } else this.hint = '';

    this._despawn();
    this.invuln = Math.max(0, this.invuln - dt);
    if (this.invuln <= 0) this.quietInvuln = false;
    const blink = this.invuln > 0 && this.state === 'run' && !this.quietInvuln && Math.sin(this.time * 30) > 0;
    this.mochi.root.visible = !blink;

    const grounded = this.y <= this.supportY + 0.06;
    const calm = this.state === 'wipe' || this.auraT > 0;
    updateMochi(this.mochi, this.time, calm ? 0 : this.speed, grounded, calm ? 0 : this.duck, calm ? 0 : this.lean, dt, calm);
    this._updateAura();

    if (this.state === 'stake') this._updateStake(dt);
    if (this.state === 'wipe') this._updateWipe(dt);

    this._updateShards(dt);
    this._updateBits(dt);
    this._updateStreaks(dt);
    this._updateRing(dt);
    this._updateShadow();
    this._updateDecor(dt);
    this._updateCamera(dt);
    if (this.state === 'wipe') this.displayGen = Math.max(this.gen, this.displayGen - dt * 32000);
    else this.displayGen += (this.gen - this.displayGen) * Math.min(1, dt * 5);
    this.score = this.totalGen + Math.floor(this.distance * 2);
    if (this.state !== 'title') this.audio.tick();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  snapshot() {
    return {
      state: this.state,
      phase: this.phase,
      score: this.score,
      gen: this.displayGen,
      lives: this.lives,
      done: this.doneCount,
      fees: this.phase === 2 ? this.roam.fees : 0,
      resolved: this.phase === 2 ? this.roam.resolved : 0,
      goal: this.phase === 2 ? this.roam.goal : 45,
      timeLeft: this.phase === 2 ? this.roam.timeLeft : 0,
      islandName: this.phase === 2 ? this.roam.islandName : '',
      islandIndex: this.phase === 2 ? this.roam.islandIndex : 0,
      lostTokens: this.phase === 2 ? this.roam.lostTokens : 0,
      map: this.phase === 2 ? this.roam.mapSnapshot() : null,
      hint: this.hint,
      banner: this.bannerT > 0 ? this.bannerText : '',
      flash: this.flash,
      flashColor: this.flashColor,
      popups: this.popups,
      muted: this.audio.muted,
    };
  }

  _targetSpeed() {
    const base = 12.6 + this.doneCount * 0.85;
    const ramp = Math.min(6.5, this.distance * 0.0024);
    const boost = this.boostT > 0 ? 8.5 : 0;
    return Math.min(28, base + ramp + boost);
  }

  _updatePlayer(dt) {
    if (this.state === 'wipe') {
      this.vy = 0;
      this.lean = 0;
      this.duck = 0;
      const target = LANES[this.lane];
      const dx = target - this.x;
      this.x += Math.sign(dx) * Math.min(Math.abs(dx), 13 * dt);
      this.mochi.root.position.set(this.x, this.y, 0);
      this.mochi.root.rotation.set(0, 0, 0);
      return;
    }
    if (this.duckTimer > 0) this.duckTimer -= dt;
    const onFloor = this.y <= this.supportY + 0.08;
    const wantDuck = (this.duckHeld || this.duckTimer > 0) && onFloor;
    this.duck += ((wantDuck ? 1 : 0) - this.duck) * Math.min(1, dt * 16);
    if (this.jumpBuffer > 0) this.jumpBuffer -= dt;

    const canJump = onFloor && this.vy <= 0.2 && this.duck < 0.45;
    if (this.jumpBuffer > 0 && canJump) {
      this.vy = JUMP_V;
      this.y = this.supportY + 0.02;
      this.jumpBuffer = 0;
      this.duck = 0;
      this.duckTimer = 0;
      this.audio.jump();
    } else if (!onFloor && this.duckHeld) {
      this.vy -= 20 * dt;
    }

    const prevY = this.y;
    const prevX = this.x;
    const target = LANES[this.lane];
    const dx = target - this.x;
    const step = Math.sign(dx) * Math.min(Math.abs(dx), 13 * dt);
    this.x += step;
    this.lean = (this.x - prevX) / Math.max(dt, 0.0001);

    this.vy += GRAVITY * dt;
    this.y += this.vy * dt;

    let support = 0;
    let landed = null;
    for (const e of this.entities) {
      if (e.kind !== 'platform') continue;
      const surface = this._surfaceAt(e);
      if (surface == null) continue;
      if (this.y >= surface - 0.4) support = Math.max(support, surface);
      if (this.vy <= 0 && prevY >= surface - 0.12 && this.y <= surface + 0.05) {
        if (!landed || surface > landed.surface) landed = { surface };
      }
    }
    this.supportY = support;
    if (landed) {
      this.y = landed.surface;
      this.vy = 0;
    } else if (support > 0 && this.vy <= 0.4 && this.y <= support && this.y >= support - 0.55) {
      this.y = support;
      this.vy = 0;
    } else if (this.y <= 0) {
      this.y = 0;
      this.vy = 0;
      this.supportY = 0;
    }
    this.mochi.root.position.set(this.x, this.y, 0);
  }

  _surfaceAt(e) {
    if (!inLane(this.x, LANES[e.lane], false, 0.95)) return null;
    return platformSurface(e.mesh.position.z, e.length, e.height, e.ramp || 0);
  }

  _scroll(dt) {
    const dz = this.speed * dt;
    this.distance += dz;
    for (const e of this.entities) e.mesh.position.z -= dz;
    for (const tile of this.tiles) {
      tile.position.z -= dz;
      if (tile.position.z < -TILE * 1.5) tile.position.z += TILE * TILE_COUNT;
    }
    this.cursor -= dz;
    this._ensureSpawn();
  }

  _ensureSpawn() {
    while (this.cursor < AHEAD) {
      this._spawnSegment(this.cursor);
      this.cursor += SEGMENT;
    }
  }

  _spawnSegment(z) {
    const i = this.segIndex++;
    if (i === 0) return this._coins(z, 1, 500, 5);
    if (i === 1) return this._jump(z, 1);
    if (i === 2) return this._duck(z, 2);
    if (i === 3) return this._tall(z);
    if (i === 4) return this._platform(z);
    if (i === 5) return this._train(z);
    if (i === 6) return this._boost(z);
    const hard = this.doneCount;
    const table = [
      { w: 15, fn: () => this._coins(z, lane(), tier(), 4) },
      { w: 13, fn: () => this._jump(z, lane()) },
      { w: 13, fn: () => this._duck(z, lane()) },
      { w: 9 + hard * 2, fn: () => this._tall(z) },
      { w: 7 + hard * 2, fn: () => this._gate(z) },
      { w: 8, fn: () => this._platform(z) },
      { w: 9, fn: () => this._train(z) },
      { w: 8, fn: () => this._boost(z) },
      { w: 8, fn: () => this._cables(z) },
      { w: 7 + hard, fn: () => this._mixed(z) },
      { w: 6, fn: () => this._jackpot(z) },
      { w: 7, fn: () => this._overheadAll(z) },
    ];
    let total = 0;
    for (const item of table) total += item.w;
    let r = Math.random() * total;
    for (const item of table) {
      r -= item.w;
      if (r <= 0) return item.fn();
    }
    return table[0].fn();
  }

  _coins(z, laneIndex, value, n) {
    for (let i = 0; i < n; i++) this._spawnCoin(z + 6 + i * 2.35, laneIndex, value, 1.05);
  }

  _jump(z, laneIndex) {
    this._spawnObstacle(z + 10, laneIndex, 'low');
    [1.05, 1.5, 1.95, 1.5, 1.05].forEach((h, i) => {
      this._spawnCoin(z + 7.2 + i * 1.45, laneIndex, i === 2 ? 1000 : 500, h);
    });
    for (const other of [0, 1, 2]) {
      if (other !== laneIndex) this._spawnCoin(z + 10, other, 500, 1.05);
    }
  }

  _duck(z, laneIndex) {
    this._spawnObstacle(z + 10, laneIndex, 'overhead');
    for (let i = 0; i < 3; i++) this._spawnCoin(z + 8 + i * 2, laneIndex, 500, 0.46);
  }

  _tall(z) {
    const blocked = lane();
    this._spawnObstacle(z + 10, blocked, 'tall');
    for (const id of [0, 1, 2]) {
      if (id !== blocked) this._spawnCoin(z + 10, id, id === (blocked + 1) % 3 ? 1000 : 500, 1.05);
    }
  }

  _gate(z) {
    const open = lane();
    for (const id of [0, 1, 2]) if (id !== open) this._spawnObstacle(z + 10, id, 'tall');
    for (let i = 0; i < 3; i++) this._spawnCoin(z + 7 + i * 2.5, open, i === 1 ? 1000 : 500, 1.05);
  }

  _platform(z) {
    const id = lane();
    const height = 1.15;
    const length = 8;
    this._spawnPlatform(z + 11, id, { height, length, ramp: 0, width: 1.8 });
    this._spawnCoin(z + 11, id, 10000, height + 2.35, height + 0.08);
    this._spawnCoin(z + 11, id, 1000, height + 1.05);
    for (const other of [0, 1, 2]) if (other !== id) this._spawnCoin(z + 11, other, 500, 1.05);
  }

  _train(z) {
    const id = lane();
    const height = 1.85;
    const length = 16;
    const ramp = 5.2;
    const center = z + 11;
    this._spawnPlatform(center, id, { height, length, ramp, width: 1.85 });
    const flatMid = ((-length / 2 + ramp) + length / 2) / 2;
    this._spawnCoin(center + flatMid, id, 10000, height + 2.35, height + 0.08);
    this._spawnCoin(center + flatMid - 2.2, id, 1000, height + 1.05);
    this._spawnCoin(center + flatMid + 2.2, id, 500, height + 1.05);
  }

  _boost(z) {
    this._spawnBoost(z + 10);
    for (const id of [0, 1, 2]) this._spawnCoin(z + 16, id, 1000, 1.15);
  }

  _cables(z) {
    this._spawnObstacle(z + 10, 1, 'cable-all');
    for (const id of [0, 1, 2]) {
      this._spawnCoin(z + 8.2, id, 500, 1.65);
      this._spawnCoin(z + 12, id, 500, 1.1);
    }
  }

  _mixed(z) {
    const tall = lane();
    const over = (tall + 1) % 3;
    const free = (tall + 2) % 3;
    this._spawnObstacle(z + 10, tall, 'tall');
    this._spawnObstacle(z + 10, over, 'overhead');
    this._spawnCoin(z + 10, free, 1000, 1.05);
    this._spawnCoin(z + 10, over, 500, 0.46);
  }

  _jackpot(z) {
    const id = lane();
    this._spawnCoin(z + 8, id, 1000, 1.1);
    this._spawnCoin(z + 11, id, 5000, 1.3);
    this._spawnCoin(z + 14, id, 1000, 1.1);
  }

  _overheadAll(z) {
    this._spawnObstacle(z + 10, 1, 'overhead-all');
    for (const id of [0, 1, 2]) this._spawnCoin(z + 10, id, 500, 0.46);
  }

  _spawnCoin(z, laneIndex, tier, y, markerY = null) {
    const mesh = makeCoin(this.lib, tier);
    mesh.position.set(LANES[laneIndex], y, z);
    this._add({
      kind: 'coin',
      mesh,
      lane: laneIndex,
      tier,
      baseY: y,
      phase: Math.random() * Math.PI * 2,
      got: false,
      marker: mesh.getObjectByName('marker'),
      markerY,
    });
  }

  _spawnObstacle(z, laneIndex, type) {
    const made = makeObstacle(this.lib, type);
    const all = made.allLanes;
    const laneId = all ? -1 : laneIndex;
    made.mesh.position.set(all ? 0 : LANES[laneId], 0, z);
    this._add({
      kind: 'obstacle',
      mesh: made.mesh,
      lane: laneId,
      type: made.type,
      clearY: made.clearY,
      roofY: made.roofY,
      halfZ: made.halfZ,
      allLanes: all,
      hit: false,
      blinkers: made.blinkers || null,
    });
  }

  _spawnPlatform(z, laneIndex, opts = {}) {
    const made = makePlatform(this.lib, opts);
    made.mesh.position.set(LANES[laneIndex], 0, z);
    this._add({
      kind: 'platform',
      mesh: made.mesh,
      lane: laneIndex,
      height: made.height,
      length: made.length,
      ramp: made.ramp,
      hit: false,
      blinkers: made.blinkers || null,
    });
  }

  _spawnBoost(z, span = null) {
    const roll = Math.random();
    const lanes = span || (roll < 0.5 ? 1 : roll < 0.86 ? 2 : 3);
    let x = 0;
    if (lanes === 1) x = LANES[lane()];
    else if (lanes === 2) {
      const start = Math.random() < 0.5 ? 0 : 1;
      x = (LANES[start] + LANES[start + 1]) / 2;
    }
    const made = makeBoostPad(this.lib, lanes);
    made.mesh.position.set(x, 0, z);
    this._add({
      kind: 'boost',
      mesh: made.mesh,
      lane: -1,
      length: made.length,
      halfW: made.width * 0.5,
      centerX: x,
      allLanes: false,
      pulsed: false,
    });
  }

  _add(ent) {
    this.scene.add(ent.mesh);
    this.entities.push(ent);
  }

  _animateEntities(dt) {
    for (const e of this.entities) {
      if (e.kind === 'coin') {
        const aerial = e.tier >= 10000;
        e.mesh.rotation.y += dt * (aerial ? 1.7 : e.tier >= 5000 ? 1.25 : 2.4);
        e.mesh.position.y = e.baseY + Math.sin(this.time * (aerial ? 2.2 : 3) + e.phase) * (aerial ? 0.16 : 0.12);
        const sparks = e.mesh.userData.sparks;
        if (sparks) {
          sparks.forEach((spark, i) => {
            const a = this.time * 4.2 + i * 0.85;
            const trail = (i % 6) / 5;
            spark.position.set(Math.cos(a) * (0.5 + trail * 0.35), Math.sin(a * 1.35) * 0.3, 0.2 + trail * 1.45);
          });
        }
        if (e.marker) {
          const deck = e.markerY == null ? 0.055 : e.markerY;
          e.marker.position.y = (deck - e.mesh.position.y) / e.mesh.scale.y;
        }
      } else if (e.kind === 'boost' && e.mesh.userData.arrows) {
        const len = e.mesh.userData.beltLen;
        for (const arrow of e.mesh.userData.arrows) {
          arrow.position.z += dt * 3.4;
          if (arrow.position.z > len / 2 - 0.3) arrow.position.z -= len - 0.6;
        }
      } else if (e.blinkers) {
        for (const b of e.blinkers) {
          b.mat.emissiveIntensity = Math.sin(this.time * 6 + b.phase) > 0.1 ? 1.9 : 0.22;
        }
      }
    }
  }

  _collect() {
    const chest = this.y + 1.05;
    const airborne = this.y > this.supportY + 0.45;
    for (const e of this.entities) {
      if (e.kind !== 'coin' || e.got) continue;
      const aerial = e.tier >= 10000;
      const p = e.mesh.position;
      const dx = this.x - p.x;
      const dy = chest - e.baseY;
      const dz = -p.z;
      const magnetY = aerial ? 0.9 : 1.45;
      if ((!aerial || airborne) && dz < 2.5 && dz > -0.4 && Math.abs(dx) < 1.15 && Math.abs(dy) < magnetY) {
        p.x += dx * 0.22;
        e.baseY += dy * 0.22;
      }
      const reach = aerial ? 1.2 : e.tier >= 5000 ? 1.05 : e.tier >= 1000 ? 0.86 : 0.72;
      const dist = Math.hypot(p.x - this.x, e.baseY - chest, p.z);
      const graceY = aerial ? 0.7 : 1.05;
      const grace = p.z < 0.2 && p.z > -1.15 && Math.abs(p.x - this.x) < reach && Math.abs(e.baseY - chest) < graceY;
      if (dist < reach || grace) this._takeCoin(e);
    }
  }

  _takeCoin(e) {
    e.got = true;
    e.dead = true;
    this.totalGen += e.tier;
    this.gen += e.tier;
    this.audio.coin(e.tier);
    this._popup(e.mesh.position, `+${e.tier.toLocaleString('en-US')}`, e.tier);
    const n = e.tier >= 10000 ? 28 : e.tier >= 5000 ? 16 : 8;
    this._burst(e.mesh.position.x, e.mesh.position.y, e.mesh.position.z, n);
    if (e.tier >= 10000) {
      this.flash = Math.max(this.flash, 0.3);
      this.flashColor = '#fff1a8';
      this._ringAt(e.mesh.position.x, e.mesh.position.y, e.mesh.position.z);
    } else if (e.tier >= 5000) {
      this.flash = Math.max(this.flash, 0.22);
      this.flashColor = '#ffe7b0';
    }
    this.scene.remove(e.mesh);
  }

  _collide() {
    if (this.invuln > 0) return;
    const top = bodyTop(this.y, this.duck);
    for (const e of this.entities) {
      if (e.kind === 'obstacle') {
        if (e.hit || !inDepth(e.mesh.position.z, e.halfZ)) continue;
        if (!inLane(this.x, e.lane < 0 ? 0 : LANES[e.lane], e.allLanes)) continue;
        if (!obstacleHits(this.y, top, e.type, e.clearY, e.roofY)) continue;
        e.hit = true;
        this._hurt();
        return;
      }
      if (e.kind === 'platform') {
        if (e.hit) continue;
        const surface = this._surfaceAt(e);
        if (surface == null) continue;
        if (this.y >= surface - 0.2) continue;
        e.hit = true;
        this._hurt();
        return;
      }
      if (e.kind === 'boost') {
        if (Math.abs(e.mesh.position.z) > e.length * 0.5) continue;
        if (Math.abs(this.x - e.centerX) > e.halfW) continue;
        if (this.y > this.supportY + 0.35) continue;
        this.boostT = 3;
        if (!e.pulsed) {
          e.pulsed = true;
          this.audio.boost();
        }
      }
    }
  }

  _hurt() {
    if (this.invuln > 0 || (this.state !== 'run' && this.state !== 'wipe')) return;
    this.lives -= 1;
    this.invuln = 1.75;
    this.audio.hit();
    if (this.lives <= 0) {
      this.state = 'wipe';
      this.wipeT = 0;
      this.wipeDelay = 0.55;
      this.gen = 0;
      this.lives = 0;
      this.shake = 0;
      this.vy = 0;
      this.lean = 0;
      this.flash = 0;
      this.auraT = 1.5;
      this.quietInvuln = true;
      this.boostT = 0;
      this.audio.crack();
      this._spawnShards();
      this.bannerText = 'Stake lost — this validator resets';
      this.bannerT = 1.8;
    } else {
      this.flash = 0.35;
      this.flashColor = '#ff5d7a';
      this.bannerText = `${this.lives} ${this.lives === 1 ? 'life' : 'lives'} left`;
      this.bannerT = 0.95;
    }
  }

  _updateWipe(dt) {
    this.wipeT += dt;
    if (this.wipeDelay > 0) {
      this.wipeDelay -= dt;
      if (this.wipeDelay <= 0) this.lives = 3;
    }
    if (this.wipeT > 1.5) {
      this.state = 'run';
      this.invuln = Math.max(this.invuln, 0.8);
    }
  }

  _checkStake() {
    if (this.state !== 'run' || this.gen < STAKE || this.doneCount >= VALIDATORS) return;
    this.stakeOverflow = this.gen - STAKE;
    this.gen = STAKE;
    this.displayGen = STAKE;
    this.state = 'stake';
    this.stakeT = 0;
    this.stakeImpact = false;
    this.stakeIndex = this.doneCount;
    this.stakeSide = this.lane < 2 ? 1 : -1;
    this._removeRobot();
    this.robot = makeRobot(this.stakeIndex);
    this.robot.group.position.set(this.x + this.stakeSide * 3.8, 0, 0.2);
    this.scene.add(this.robot.group);
    this._maskNearby(true);
  }

  _maskNearby(hide) {
    for (const e of this.entities) {
      if (e.kind === 'coin') continue;
      const z = e.mesh.position.z;
      if (z < -8 || z > 9) continue;
      if (hide) {
        e._masked = true;
        e.mesh.visible = false;
      } else if (e._masked) {
        e.mesh.visible = true;
        e._masked = false;
      }
    }
  }

  _updateStake(dt) {
    this.stakeT += dt;
    const t = this.stakeT;
    const side = this.stakeSide;
    const robot = this.robot;
    if (!robot) return;
    const enter = ease(Math.min(1, t / 0.4));
    const homeX = this.x + side * 1.2;
    const fromX = this.x + side * 3.8;
    robot.group.position.x = fromX + (homeX - fromX) * enter;
    robot.group.position.z = 0.25;
    robot.group.rotation.y = Math.PI + side * 0.55;
    const swing = Math.sin(this.time * 14);
    if (t < 0.55) {
      robot.legL.rotation.x = swing * 0.55;
      robot.legR.rotation.x = -swing * 0.55;
    } else {
      robot.legL.rotation.x *= 0.85;
      robot.legR.rotation.x *= 0.85;
    }
    const raise = smooth(0.22, 0.5, t);
    const arm = side > 0 ? robot.armL : robot.armR;
    const other = side > 0 ? robot.armR : robot.armL;
    const mochiArm = side > 0 ? this.mochi.armL : this.mochi.armR;
    arm.rotation.order = 'YXZ';
    arm.rotation.x = -1.65 * raise;
    arm.rotation.z = side * (0.35 + raise * 0.9);
    other.rotation.z = -side * (0.25 + raise * 0.4);
    mochiArm.rotation.order = 'YXZ';
    mochiArm.rotation.x = -1.35 * raise;
    mochiArm.rotation.z = side * (0.45 + raise * 0.85);
    if (mochiArm.elbow) mochiArm.elbow.rotation.x = -0.12;
    this.mochi.root.rotation.y = side * 0.55 * raise;

    if (!this.stakeImpact && t >= 0.55) {
      this.stakeImpact = true;
      this.shake = 0.32;
      this.flash = 0.5;
      this.flashColor = '#ffe7b0';
      this.audio.stake();
      this.bannerText = `Validator ${this.stakeIndex + 1} staked`;
      this.bannerT = 1.7;
      const hx = this.x + side * 0.62;
      this._burst(hx, 1.55, 0.3, 36);
      this._ringAt(hx, 1.55, 0.3);
    }
    if (t > 1.28) {
      const exit = Math.min(1, (t - 1.28) / 0.6);
      robot.group.position.y = exit * exit * 7.5;
      robot.group.position.z = 0.25 + exit * 4;
      robot.group.rotation.z = -side * exit * 0.4;
    }
    if (t >= 2.05) this._endStake();
  }

  _endStake() {
    this._removeRobot();
    this._maskNearby(false);
    this.doneCount += 1;
    this.mochi.root.rotation.y = 0;
    if (this.doneCount >= VALIDATORS) {
      this.state = 'done';
      this.gen = STAKE;
      this.audio.setTrack(this.doneCount);
      this.audio.fanfare();
      this._burst(this.x, 1.7, 0.4, 40);
      this.bannerText = '';
      this.bannerT = 0;
      return;
    }
    this.gen = this.stakeOverflow;
    this.state = 'run';
    this.invuln = Math.max(this.invuln, 0.7);
    this.audio.setTrack(this.doneCount);
  }

  _removeRobot() {
    if (!this.robot) return;
    this.scene.remove(this.robot.group);
    this.robot = null;
  }

  _updateHint() {
    let best = null;
    for (const e of this.entities) {
      if (e.kind !== 'obstacle') continue;
      const z = e.mesh.position.z;
      if (z < 4.5 || z > 17) continue;
      const near = e.allLanes || Math.abs(this.x - LANES[e.lane]) < 1.35;
      if (!near) continue;
      if (!best || z < best.mesh.position.z) best = e;
    }
    if (!best) {
      for (const e of this.entities) {
        if (e.kind !== 'coin' || e.tier < 10000 || e.got) continue;
        const z = e.mesh.position.z;
        if (z < 3 || z > 16) continue;
        if (Math.abs(this.x - e.mesh.position.x) > 1.5) continue;
        this.hint = '↑  Jump';
        return;
      }
      this.hint = '';
      return;
    }
    const key = best.type;
    if (!best.hinted) {
      best.hinted = true;
      this.hintCounts[key] = (this.hintCounts[key] || 0) + 1;
    }
    if (this.hintCounts[key] > 2) {
      this.hint = '';
      return;
    }
    if (key === 'low' || key === 'cable') this.hint = '↑  Jump';
    else if (key === 'overhead') this.hint = '↓  Duck';
    else this.hint = '←  →  Switch lane';
  }

  _despawn() {
    this.entities = this.entities.filter((e) => {
      if (e.dead || e.mesh.position.z < DESPAWN_Z) {
        this.scene.remove(e.mesh);
        return false;
      }
      return true;
    });
  }

  _burst(x, y, z, n = 18) {
    const colors = [0xee8521, 0xff4f9a, 0x8d81e1, 0x7c3aed, 0x7af6ff, 0xfff2c4];
    let spawned = 0;
    for (const bit of this.bits) {
      if (bit.life > 0) continue;
      bit.life = 0.4 + Math.random() * 0.35;
      bit.max = bit.life;
      bit.mesh.visible = true;
      bit.mesh.position.set(x, y, z);
      bit.vel.set((Math.random() - 0.5) * 7, 2 + Math.random() * 5.5, (Math.random() - 0.5) * 7);
      bit.mesh.material.color.setHex(colors[spawned % colors.length]);
      bit.mesh.material.opacity = 1;
      bit.mesh.scale.setScalar(0.55 + Math.random() * 1.15);
      spawned += 1;
      if (spawned >= n) break;
    }
  }

  _updateBits(dt) {
    for (const bit of this.bits) {
      if (bit.life <= 0) continue;
      bit.life -= dt;
      bit.vel.y -= 11 * dt;
      bit.mesh.position.addScaledVector(bit.vel, dt);
      bit.mesh.position.z -= this.speed * dt;
      bit.mesh.rotation.x += dt * 6;
      bit.mesh.rotation.y += dt * 4;
      bit.mesh.material.opacity = Math.max(0, bit.life / bit.max);
      if (bit.life <= 0) bit.mesh.visible = false;
    }
  }

  _ringAt(x, y, z) {
    this.ring.visible = true;
    this.ring.position.set(x, y, z);
    this.ring.scale.setScalar(0.3);
    this.ring.material.opacity = 0.95;
    this.ringLife = 0.48;
  }

  _updateRing(dt) {
    if (this.ringLife <= 0) return;
    this.ringLife -= dt;
    const k = 1 - Math.max(0, this.ringLife) / 0.48;
    this.ring.scale.setScalar(0.35 + k * 3.4);
    this.ring.material.opacity = (1 - k) * 0.9;
    this.ring.lookAt(this.camera.position);
    if (this.ringLife <= 0) this.ring.visible = false;
  }

  _popup(pos, text, tier) {
    this._proj.copy(pos).project(this.camera);
    this.popups.push({
      id: this.popupId++,
      x: (this._proj.x * 0.5 + 0.5) * this.width,
      y: (-this._proj.y * 0.5 + 0.5) * this.height,
      text,
      tier,
      life: 0.85,
      max: 0.85,
    });
  }

  _updateShadow() {
    const lift = Math.max(0, this.y - this.supportY);
    const s = Math.max(0.38, 1 - lift * 0.3);
    this.shadow.position.set(this.x, this.supportY + 0.045, 0.08);
    this.shadow.scale.set(s, s, s);
    this.shadow.material.opacity = 0.4 * s;
  }

  _updateDecor(dt) {
    const bob = (obj) => {
      obj.traverse((node) => {
        const data = node.userData && node.userData.bob;
        if (!data) return;
        node.position.y = data.base + Math.sin(this.time * data.speed + data.phase) * data.amp;
        node.rotation.y += dt * 0.3;
      });
    };
    for (const tile of this.tiles) bob(tile);
    bob(this.atmosphere.rig);
    updateBolts(this.atmosphere.bolts, dt);
    for (const b of this.blinkers) {
      b.mat.emissiveIntensity = Math.sin(this.time * 6 + b.phase) > 0.1 ? 1.9 : 0.22;
    }
  }

  _updateCamera(dt) {
    const calm = this.state === 'wipe' || this.auraT > 0;
    if (calm) {
      this.shake = 0;
      if (Math.abs(this.camera.fov - 50) > 0.01) {
        this.camera.fov = 50;
        this.camera.updateProjectionMatrix();
      }
      this.camera.position.set(this.x * 0.9, 2.55, -5.15);
      this.camPos.copy(this.camera.position);
      this.lookPos.set(this.x * 0.2, 1.05, 5.5);
      this.camera.lookAt(this.lookPos);
      return;
    }
    const staking = this.state === 'stake';
    const side = this.stakeSide || 1;
    const desired = this._proj;
    if (staking) desired.set(this.x - side * 2.7, 2.25 + this.y, -5.35);
    else desired.set(this.x * 0.9, 2.55 + this.y * 0.25, -5.15);
    if (this.shake > 0) {
      desired.x += (Math.random() - 0.5) * this.shake;
      desired.y += (Math.random() - 0.5) * this.shake * 0.55;
      this.shake *= Math.pow(0.05, dt);
      if (this.shake < 0.012) this.shake = 0;
    }
    const k = staking ? Math.min(1, dt * 2.8) : 1 - Math.pow(0.0012, dt);
    this.camPos.lerp(desired, k);
    this.camera.position.copy(this.camPos);
    const targetFov = this.boostT > 0 ? 62 : 50;
    if (Math.abs(this.camera.fov - targetFov) > 0.04) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 6);
      this.camera.updateProjectionMatrix();
    }
    const look = staking
      ? new THREE.Vector3(this.x + side * 0.5, 1.25, 0.45)
      : new THREE.Vector3(this.x * 0.2, 1.05 + this.y * 0.1, 5.5);
    this.lookPos.lerp(look, k);
    this.camera.lookAt(this.lookPos);
  }

  _spawnShards() {
    this._clearShards();
    const colors = [0xee8521, 0xff4f9a, 0x8d81e1, 0xffe08a, 0x7af6ff, 0xfff6c8];
    for (let i = 0; i < 26; i++) {
      const color = colors[i % colors.length];
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.85,
        roughness: 0.32,
        metalness: 0.4,
        transparent: true,
      });
      const mesh = new THREE.Mesh(i % 2 ? this.lib.coin : new THREE.OctahedronGeometry(0.2, 0), mat);
      mesh.scale.setScalar(0.28 + (i % 5) * 0.08);
      const spread = (i / 26) * Math.PI * 2;
      mesh.position.set(this.x + Math.cos(spread) * 0.2, 1.05 + (i % 4) * 0.12, Math.sin(spread) * 0.15);
      this.scene.add(mesh);
      this.shards.push({
        mesh,
        vel: new THREE.Vector3(Math.cos(spread) * (2.2 + (i % 4)), 3.2 + (i % 5) * 0.7, Math.sin(spread) * 2.4 - 1.2),
        spin: Math.random() * 8 + 2,
        life: 2.4,
      });
    }
  }

  _clearShards() {
    for (const s of this.shards) {
      this.scene.remove(s.mesh);
      s.mesh.material.dispose();
    }
    this.shards = [];
  }

  _updateShards(dt) {
    this.shards = this.shards.filter((s) => {
      s.life -= dt;
      s.vel.y -= 16 * dt;
      s.mesh.position.addScaledVector(s.vel, dt);
      s.mesh.position.z -= this.speed * dt;
      s.mesh.rotation.x += s.spin * dt;
      s.mesh.rotation.y += s.spin * 0.6 * dt;
      if (s.mesh.position.y < 0.08) {
        s.mesh.position.y = 0.08;
        s.vel.y *= -0.28;
        s.vel.x *= 0.65;
        s.vel.z *= 0.65;
        if (Math.abs(s.vel.y) < 0.35) s.vel.y = 0;
      }
      s.mesh.material.opacity = s.life < 0.45 ? Math.max(0, s.life / 0.45) : 1;
      if (s.life > 0) return true;
      this.scene.remove(s.mesh);
      s.mesh.material.dispose();
      return false;
    });
  }

  _updateAura() {
    const on = this.auraT > 0;
    const pulse = 0.55 + 0.45 * Math.sin(this.time * 4.2);
    this.aura.material.opacity = on ? 0.28 + 0.22 * pulse : 0;
    this.aura.scale.set(1.65 + pulse * 0.18, 2.0 + pulse * 0.16, 1);
    this.auraLight.intensity = on ? 0.7 + 0.55 * pulse : 0;
  }

  _updateStreaks(dt) {
    const on = this.boostT > 0;
    for (let i = 0; i < this.streaks.length; i++) {
      const streak = this.streaks[i];
      streak.material.opacity = on ? 0.32 + (i % 3) * 0.14 : 0;
      if (!on) continue;
      streak.position.z += dt * 9;
      if (streak.position.z > -1.15) streak.position.z = -3.4;
      streak.scale.y = 1.6 + (i % 4) * 0.45;
    }
    for (let i = 0; i < this.trail.length; i++) {
      const puff = this.trail[i];
      puff.visible = on;
      puff.material.opacity = on ? 0.55 - i * 0.05 : 0;
      if (!on) continue;
      const lead = i === 0 ? { x: this.x, y: 0.55 + this.y, z: -0.15 } : this.trail[i - 1].position;
      puff.position.x += (lead.x - puff.position.x) * Math.min(1, dt * (14 - i));
      puff.position.y += (lead.y - puff.position.y) * Math.min(1, dt * (14 - i));
      puff.position.z += (lead.z - 0.28 - puff.position.z) * Math.min(1, dt * (14 - i));
    }
  }
}

function lane() {
  return Math.floor(Math.random() * 3);
}

function tier() {
  return Math.random() < 0.22 ? 1000 : 500;
}

function ease(t) {
  return 1 - (1 - t) * (1 - t) * (1 - t);
}

function smooth(a, b, t) {
  if (t <= a) return 0;
  if (t >= b) return 1;
  const x = (t - a) / (b - a);
  return x * x * (3 - 2 * x);
}

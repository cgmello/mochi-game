import './style.css';
import { Game, STAKE, VALIDATORS } from './game/game.js';
import { createAudio } from './game/audio.js';
import { mapMarkerAngle } from './game/phase2layout.js';

const canvas = document.getElementById('c');
const audio = createAudio();
const title = document.getElementById('title');
const hud = document.getElementById('hud');
const phase = document.getElementById('phase');
const banner = document.getElementById('banner');
const hint = document.getElementById('hint');
const flash = document.getElementById('flash');
const pops = document.getElementById('pops');
const scoreEl = document.getElementById('score');
const genEl = document.getElementById('gen');
const whichEl = document.getElementById('which');
const vals = document.getElementById('vals');
const livesEl = document.getElementById('lives');
const muteBtn = document.getElementById('mute');
const phaseScore = document.getElementById('phase-score');
const island = document.getElementById('island');
const islandScore = document.getElementById('island-score');
const islandTitle = document.getElementById('island-title');
const islandBody = document.getElementById('island-body');
const islandContinue = document.getElementById('island-continue');
const timeup = document.getElementById('timeup');
const timeupName = document.getElementById('timeup-name');
const timeupScore = document.getElementById('timeup-score');
const timerEl = document.getElementById('timer');
const islandNameEl = document.getElementById('island-name');
const bonusEl = document.getElementById('bonus');
const runScore = document.getElementById('run-score');
const runStake = document.getElementById('run-stake');
const roamHud = document.getElementById('roam-hud');
const feesEl = document.getElementById('fees');
const resolvedEl = document.getElementById('resolved');
const hopBtn = document.getElementById('hop');
const minimap = document.getElementById('minimap');
const mapCanvas = document.getElementById('map');
const mapCtx = mapCanvas.getContext('2d');
const fail = document.getElementById('fail');

const CIRC = 2 * Math.PI * 15;
const valNodes = [];
for (let i = 0; i < VALIDATORS; i++) {
  const el = document.createElement('div');
  el.className = 'val';
  el.innerHTML = `<svg viewBox="0 0 36 36" aria-hidden="true"><circle class="track" cx="18" cy="18" r="15"></circle><circle class="fill" cx="18" cy="18" r="15"></circle></svg><em>${i + 1}</em>`;
  vals.appendChild(el);
  valNodes.push(el);
}

const heartSvg = `<svg class="heart" viewBox="0 0 32 32" aria-hidden="true"><path fill="#ee8521" d="M16 27s-9.5-6.2-12.4-11.2C1.4 12.2 2.6 7.6 6.8 6.2 9.4 5.3 12 6.4 16 10.2 20 6.4 22.6 5.3 25.2 6.2c4.2 1.4 5.4 6 3.2 9.6C25.5 20.8 16 27 16 27z"/></svg>`;
const hearts = [];
for (let i = 0; i < 3; i++) {
  const wrap = document.createElement('span');
  wrap.innerHTML = heartSvg;
  const node = wrap.firstElementChild;
  livesEl.appendChild(node);
  hearts.push(node);
}

let game;
try {
  game = new Game(canvas, audio);
} catch (err) {
  console.error(err);
  fail.hidden = false;
  title.hidden = true;
  throw err;
}

window.__game = game;

const held = new Set();
const popupNodes = new Map();

const TALKS = {
  run: [
    "Hi! I'm Mochi, the adjudicator of the internet.",
    'Collect 42,000 GEN for each validator so 5 validators can join me!',
    'Up or W jumps. Down or S ducks. Left and right change lanes. Grab every coin you can.',
  ],
  roam: [
    'The validators are with me. Now I help the AI agents resolve their conflicts.',
    'Walk up to an arguing pair. Each conflict you settle pays 1 token. You have 5 minutes.',
    'Gold coins are worth 3 tokens. A clock on Oracle Port adds 30 seconds, and one on Rally Square adds a minute. Bridges link the islands.',
  ],
};

const talkBox = document.getElementById('talk');
const talkText = document.getElementById('talk-text');
const talkNext = document.getElementById('talk-next');
let talk = null;

function openTalk(id) {
  talk = { id, page: 0, shown: 0, t: 0 };
  game.talking = true;
  paintTalk();
}

function advanceTalk() {
  if (!talk) return;
  const pages = TALKS[talk.id];
  const text = pages[talk.page];
  if (talk.shown < text.length) {
    talk.shown = text.length;
    talk.t = 99;
    paintTalk();
    return;
  }
  if (talk.page < pages.length - 1) {
    talk.page += 1;
    talk.shown = 0;
    talk.t = 0;
    paintTalk();
    return;
  }
  talk = null;
  game.talking = false;
  paintTalk();
}

function paintTalk() {
  if (!talk) {
    talkBox.hidden = true;
    return;
  }
  const pages = TALKS[talk.id];
  const text = pages[talk.page];
  talkBox.hidden = false;
  talkText.textContent = text.slice(0, talk.shown);
  talkNext.hidden = talk.shown < text.length;
}

function begin() {
  if (!game || game.state !== 'title') return;
  title.hidden = true;
  game.start();
  openTalk('run');
}

function beginPhase2() {
  title.hidden = true;
  game.startPhase2();
  openTalk('roam');
}

document.getElementById('start').addEventListener('click', begin);
document.getElementById('phase2').addEventListener('click', beginPhase2);
document.getElementById('to-phase2').addEventListener('click', beginPhase2);
document.getElementById('again').addEventListener('click', () => {
  title.hidden = true;
  game.reset();
  openTalk('run');
});
talkBox.addEventListener('click', () => advanceTalk());
function restartPhase() {
  title.hidden = true;
  game.roam.replay();
  openTalk('roam');
}

function mainMenu() {
  game.toTitle();
  title.hidden = false;
}

document.getElementById('island-continue').addEventListener('click', restartPhase);
document.getElementById('island-menu').addEventListener('click', mainMenu);
document.getElementById('timeup-retry').addEventListener('click', restartPhase);
document.getElementById('timeup-menu').addEventListener('click', mainMenu);
muteBtn.addEventListener('click', () => {
  const muted = audio.toggle();
  muteBtn.textContent = muted ? 'Muted' : 'Sound';
});

function actionFor(code) {
  if (game.phase === 2) {
    return {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'forward',
      ArrowDown: 'back',
      KeyA: 'left',
      KeyD: 'right',
      KeyW: 'forward',
      KeyS: 'back',
      Space: 'hop',
    }[code];
  }
  return {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'jump',
    ArrowDown: 'duck',
    KeyA: 'left',
    KeyD: 'right',
    KeyW: 'jump',
    KeyS: 'duck',
    Space: 'jump',
  }[code];
}

window.addEventListener('keydown', (event) => {
  if (game.talking) {
    event.preventDefault();
    if (event.code === 'Enter' || event.code === 'Space') advanceTalk();
    return;
  }
  if (game.phase === 2 && (game.state === 'timeout' || game.state === 'cleared')) {
    if (event.code === 'Enter') {
      event.preventDefault();
      restartPhase();
      return;
    }
    if (event.code === 'Escape') {
      event.preventDefault();
      mainMenu();
      return;
    }
  }
  if (game.state === 'title' && (event.code === 'Enter' || event.code === 'Space')) {
    event.preventDefault();
    begin();
    return;
  }
  const action = actionFor(event.code);
  if (!action) return;
  event.preventDefault();
  if (held.has(event.code)) return;
  held.add(event.code);
  if (game.phase === 2) {
    if (action === 'hop') game.press('hop');
    else game.hold(action, true);
    return;
  }
  game.press(action);
});

window.addEventListener('keyup', (event) => {
  held.delete(event.code);
  if (game.phase === 2) {
    const action = actionFor(event.code);
    if (action && action !== 'hop') game.hold(action, false);
    return;
  }
  if (event.code === 'ArrowDown' || event.code === 'KeyS') game.press('duck-end');
});

window.addEventListener('blur', () => {
  held.clear();
  game.releaseAll();
});

let touchX = 0;
let touchY = 0;
window.addEventListener('touchstart', (event) => {
  if (event.target.closest('button')) return;
  const t = event.changedTouches[0];
  touchX = t.clientX;
  touchY = t.clientY;
}, { passive: true });

window.addEventListener('touchend', (event) => {
  if (event.target.closest('button')) return;
  if (game.state === 'title') {
    begin();
    return;
  }
  if (game.phase === 2) return;
  const t = event.changedTouches[0];
  const dx = t.clientX - touchX;
  const dy = t.clientY - touchY;
  if (Math.hypot(dx, dy) < 28) return;
  if (Math.abs(dx) > Math.abs(dy)) game.press(dx > 0 ? 'right' : 'left');
  else if (dy < 0) game.press('jump');
  else {
    game.press('duck');
    window.setTimeout(() => game.press('duck-end'), 450);
  }
}, { passive: true });

for (const button of document.querySelectorAll('[data-act]')) {
  const act = button.dataset.act;
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (game.phase === 2) {
      const roamAct = act === 'jump' ? 'forward' : act === 'duck' ? 'back' : act === 'left' || act === 'right' || act === 'hop' ? act : null;
      if (!roamAct) return;
      if (roamAct === 'hop') game.press('hop');
      else game.hold(roamAct, true);
      button.dataset.roam = roamAct;
      return;
    }
    if (game.state === 'title') begin();
    game.press(act);
  });
  const release = () => {
    if (game.phase === 2) {
      const roamAct = button.dataset.roam;
      if (roamAct && roamAct !== 'hop') game.hold(roamAct, false);
      return;
    }
    if (act === 'duck') game.press('duck-end');
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('pointerleave', release);
}

window.addEventListener('resize', () => game.resize());

function shade(hex, k) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

function drawMap(map) {
  if (!map || !map.focus) return;
  const ctx = mapCtx;
  const w = mapCanvas.width;
  const h = mapCanvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const focus = map.focus;
  const scale = (w * 0.46) / (map.span || focus.r || 46);
  const ox = cx - focus.x * scale;
  const oy = cy + focus.z * scale;
  const px = (x) => ox + x * scale;
  const py = (z) => oy - z * scale;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.48, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#10243f';
  ctx.fillRect(0, 0, w, h);
  if (map.bridge) {
    const bridge = map.bridge;
    ctx.fillStyle = '#c4924a';
    ctx.fillRect(px(bridge.x - bridge.hw), py(bridge.z + bridge.hd), bridge.hw * 2 * scale, bridge.hd * 2 * scale);
  }
  ctx.fillStyle = shade(focus.color, 0.72);
  ctx.beginPath();
  ctx.arc(px(focus.x), py(focus.z), focus.r * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = focus.color;
  ctx.stroke();
  ctx.fillStyle = '#e7c27a';
  for (const exit of map.exits || []) {
    ctx.fillRect(px(exit.x) + (exit.east ? 0 : -11), py(exit.z) - 5, 11, 10);
  }
  ctx.lineWidth = 2;
  for (const check of map.checks || []) {
    ctx.strokeStyle = check.active ? '#7af6ff' : '#8eb4c8';
    ctx.beginPath();
    ctx.arc(px(check.x), py(check.z), check.active ? 5 : 3.4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd15a';
  for (const coin of map.bonuses || []) {
    ctx.save();
    ctx.translate(px(coin.x), py(coin.z));
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-4.2, -4.2, 8.4, 8.4);
    ctx.restore();
  }
  ctx.strokeStyle = '#7af6ff';
  ctx.fillStyle = '#ffd15a';
  ctx.lineWidth = 1.6;
  for (const clock of map.clocks || []) {
    ctx.save();
    ctx.translate(px(clock.x), py(clock.z));
    ctx.beginPath();
    ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0.4);
    ctx.lineTo(0, -3.2);
    ctx.moveTo(0, 0.4);
    ctx.lineTo(2.4, 1.4);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#ff3358';
  for (const fight of map.fights || []) {
    ctx.beginPath();
    ctx.arc(px(fight.x), py(fight.z), 4.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(px(map.x), py(map.z));
  ctx.rotate(mapMarkerAngle(map.yaw || 0));
  ctx.fillStyle = '#fff4c8';
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(5.5, 7);
  ctx.lineTo(-5.5, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

function paint(snap) {
  title.hidden = snap.state !== 'title';
  const playing = snap.state !== 'title';
  const phase2 = snap.phase === 2;
  hud.hidden = !playing;
  phase.hidden = snap.state !== 'done';
  island.hidden = snap.state !== 'cleared';
  timeup.hidden = snap.state !== 'timeout';
  runScore.hidden = phase2;
  runStake.hidden = phase2;
  livesEl.hidden = phase2;
  roamHud.hidden = !phase2;
  hopBtn.hidden = !phase2;
  minimap.hidden = !phase2;
  if (phase2) {
    feesEl.textContent = Math.floor(snap.fees).toLocaleString('en-US');
    resolvedEl.textContent = `${snap.resolved} / ${snap.goal} conflicts`;
    bonusEl.textContent = `${snap.bonus} / ${snap.bonusTotal} bonus`;
    islandNameEl.textContent = snap.islandName;
    const secs = Math.max(0, Math.ceil(snap.timeLeft));
    timerEl.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    timerEl.classList.toggle('bonus', snap.timeFlash > 0);
    timerEl.classList.toggle('low', secs <= 10 && !(snap.timeFlash > 0));
    drawMap(snap.map);
  }
  banner.textContent = snap.banner;
  hint.textContent = snap.hint;
  flash.style.opacity = String(Math.min(0.62, snap.flash));
  flash.style.background = snap.flashColor;
  scoreEl.textContent = Math.floor(snap.score).toLocaleString('en-US');
  genEl.textContent = `${Math.round(snap.gen).toLocaleString('en-US')} / ${STAKE.toLocaleString('en-US')} GEN`;
  whichEl.textContent = snap.done >= VALIDATORS
    ? 'Five validators staked'
    : `Validator ${snap.done + 1} of ${VALIDATORS}`;
  valNodes.forEach((el, i) => {
    let p = 0;
    if (i < snap.done) p = 1;
    else if (i === snap.done && snap.done < VALIDATORS) p = Math.min(1, Math.max(0, snap.gen / STAKE));
    el.querySelector('.fill').style.strokeDashoffset = String(CIRC * (1 - p));
    el.classList.toggle('done', i < snap.done);
    el.classList.toggle('current', i === snap.done && snap.done < VALIDATORS);
  });
  hearts.forEach((heart, i) => heart.classList.toggle('on', i < snap.lives));
  if (snap.state === 'done') {
    phaseScore.textContent = `Score ${Math.floor(snap.score).toLocaleString('en-US')}`;
  }
  if (snap.state === 'cleared') {
    islandTitle.textContent = 'Course complete';
    islandBody.textContent = 'All 45 conflicts across Contract Market, Oracle Port, and Rally Square are settled.';
    islandScore.textContent = `${Math.floor(snap.fees)} tokens`;
  }
  if (snap.state === 'timeout') {
    timeupName.textContent = "Time's up.";
    const lost = Math.floor(snap.lostTokens || 0);
    timeupScore.textContent = lost > 0
      ? `${lost} tokens from this run are gone.`
      : 'The tokens from this run are gone.';
  }

  const live = new Set();
  for (const popup of snap.popups) {
    live.add(popup.id);
    let node = popupNodes.get(popup.id);
    if (!node) {
      node = document.createElement('div');
      node.className = `pop${popup.tier >= 10000 ? ' mega' : popup.tier >= 5000 ? ' big' : popup.tier >= 1000 ? ' mid' : ''}`;
      node.textContent = popup.text;
      pops.appendChild(node);
      popupNodes.set(popup.id, node);
    }
    const k = 1 - popup.life / popup.max;
    node.style.transform = `translate(${popup.x}px, ${popup.y - k * 48}px)`;
    node.style.opacity = String(Math.max(0, Math.min(1, popup.life / popup.max)));
  }
  for (const [id, node] of popupNodes) {
    if (live.has(id)) continue;
    node.remove();
    popupNodes.delete(id);
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (!document.hidden) game.update(dt);
  if (talk) {
    const text = TALKS[talk.id][talk.page];
    talk.t += dt;
    talk.shown = Math.max(talk.shown, Math.min(text.length, Math.floor(talk.t * 42)));
    paintTalk();
  }
  game.render();
  paint(game.snapshot());
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

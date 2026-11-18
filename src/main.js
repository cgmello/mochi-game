import './style.css';
import { Game, STAKE, VALIDATORS } from './game/game.js';
import { createAudio } from './game/audio.js';

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

function begin() {
  if (!game || game.state !== 'title') return;
  title.hidden = true;
  game.start();
}

document.getElementById('start').addEventListener('click', begin);
document.getElementById('again').addEventListener('click', () => game.reset());
muteBtn.addEventListener('click', () => {
  const muted = audio.toggle();
  muteBtn.textContent = muted ? 'Muted' : 'Sound';
});

window.addEventListener('keydown', (event) => {
  if (game.state === 'title' && (event.code === 'Enter' || event.code === 'Space')) {
    event.preventDefault();
    begin();
    return;
  }
  const action = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'jump',
    ArrowDown: 'duck',
    KeyA: 'left',
    KeyD: 'right',
    KeyW: 'jump',
    KeyS: 'duck',
    Space: 'jump',
  }[event.code];
  if (!action) return;
  event.preventDefault();
  if (held.has(event.code)) return;
  held.add(event.code);
  game.press(action);
});

window.addEventListener('keyup', (event) => {
  held.delete(event.code);
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
    if (game.state === 'title') begin();
    game.press(act);
  });
  const release = () => {
    if (act === 'duck') game.press('duck-end');
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('pointerleave', release);
}

window.addEventListener('resize', () => game.resize());

function paint(snap) {
  const playing = snap.state !== 'title';
  hud.hidden = !playing;
  phase.hidden = snap.state !== 'done';
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

  const live = new Set();
  for (const popup of snap.popups) {
    live.add(popup.id);
    let node = popupNodes.get(popup.id);
    if (!node) {
      node = document.createElement('div');
      node.className = `pop${popup.tier >= 5000 ? ' big' : popup.tier >= 1000 ? ' mid' : ''}`;
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
  game.render();
  paint(game.snapshot());
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

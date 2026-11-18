const TRACKS = [
  { step: 0.36, notes: [262, 330, 392, 330], bass: 98, hat: false, fifth: false },
  { step: 0.3, notes: [294, 370, 440, 370, 494], bass: 110, hat: false, fifth: true },
  { step: 0.24, notes: [330, 415, 494, 415, 554, 494], bass: 131, hat: true, fifth: true },
  { step: 0.19, notes: [349, 440, 523, 440, 587, 523, 659], bass: 147, hat: true, fifth: true },
  { step: 0.15, notes: [392, 494, 587, 494, 659, 587, 784, 659], bass: 165, hat: true, fifth: true },
];

export function createAudio() {
  let ctx = null;
  let master = null;
  let music = null;
  let muted = false;
  let next = 0;
  let step = 0;
  let track = 0;

  function ensure() {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
      music = ctx.createGain();
      music.gain.value = 0.9;
      music.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, when, dur, gain, type = 'sine', bus) {
    if (muted || !ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(bus || master);
    o.start(when);
    o.stop(when + dur + 0.02);
  }

  function noise(dur, gain, freq) {
    if (muted || !ctx) return;
    const n = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start();
  }

  return {
    get muted() {
      return muted;
    },
    resume() {
      ensure();
    },
    toggle() {
      muted = !muted;
      if (ctx && master) {
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(muted ? 0 : 1, t);
      }
      return muted;
    },
    setTrack(index) {
      const n = Math.max(0, Math.min(TRACKS.length - 1, index | 0));
      if (n === track && ctx) return;
      track = n;
      step = 0;
      if (!ctx) return;
      const t = ctx.currentTime;
      music.gain.cancelScheduledValues(t);
      music.gain.setValueAtTime(Math.max(0.0001, music.gain.value), t);
      music.gain.linearRampToValueAtTime(0.0001, t + 0.14);
      music.gain.linearRampToValueAtTime(0.9, t + 0.42);
      next = t + 0.16;
    },
    jump() {
      const t = ensure().currentTime;
      tone(320, t, 0.12, 0.05, 'triangle');
      tone(540, t + 0.04, 0.1, 0.04, 'sine');
    },
    coin(tier) {
      const t = ensure().currentTime;
      if (tier >= 10000) {
        tone(784, t, 0.1, 0.05, 'triangle');
        tone(1175, t + 0.06, 0.12, 0.04, 'sine');
        tone(1568, t + 0.12, 0.2, 0.035, 'sine');
        return;
      }
      const f = tier >= 5000 ? 880 : tier >= 1000 ? 660 : 520;
      tone(f, t, 0.09, 0.045, 'triangle');
      tone(f * 1.5, t + 0.05, 0.12, 0.035, 'sine');
    },
    hit() {
      ensure();
      noise(0.18, 0.12, 280);
    },
    crack() {
      const t = ensure().currentTime;
      noise(0.16, 0.18, 1400);
      tone(160, t, 0.14, 0.07, 'square');
      tone(90, t + 0.06, 0.22, 0.05, 'sine');
      tone(1480, t + 0.02, 0.04, 0.03, 'square');
      tone(880, t + 0.07, 0.05, 0.025, 'triangle');
    },
    boost() {
      const t = ensure().currentTime;
      tone(240, t, 0.16, 0.04, 'sawtooth');
      tone(480, t + 0.06, 0.18, 0.04, 'triangle');
      tone(720, t + 0.12, 0.16, 0.03, 'sine');
    },
    wipe() {
      const t = ensure().currentTime;
      tone(392, t, 0.16, 0.05, 'sawtooth');
      tone(311, t + 0.12, 0.18, 0.05, 'triangle');
      tone(233, t + 0.24, 0.28, 0.05, 'sine');
    },
    stake() {
      const t = ensure().currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        tone(f, t + i * 0.07, 0.22, 0.05, 'triangle');
      });
    },
    fanfare() {
      const t = ensure().currentTime;
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
        tone(f, t + i * 0.09, 0.32, 0.05, 'triangle');
      });
    },
    tick() {
      if (muted || !ctx || !music) return;
      const song = TRACKS[track];
      const t = ctx.currentTime;
      if (next === 0) next = t + 0.05;
      while (next < t + 0.08) {
        const f = song.notes[step % song.notes.length];
        tone(f, next, song.step * 0.92, 0.02, 'triangle', music);
        if (step % 4 === 0) tone(song.bass, next, song.step * 1.6, 0.028, 'sine', music);
        if (song.fifth && step % 2 === 0) tone(f * 1.5, next, song.step * 0.7, 0.012, 'sine', music);
        if (song.hat && step % 2 === 1) tone(1800, next, 0.03, 0.008, 'square', music);
        step += 1;
        next += song.step;
      }
    },
  };
}

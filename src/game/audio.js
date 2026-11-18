export function createAudio() {
  let ctx = null;
  let muted = false;
  let next = 0;
  let step = 0;
  const scale = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 440.0];

  function ensure() {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, when, dur, gain, type = 'sine') {
    if (muted || !ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(ctx.destination);
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
    g.connect(ctx.destination);
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
      return muted;
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
      if (muted || !ctx) return;
      const t = ctx.currentTime;
      if (next === 0) next = t + 0.05;
      while (next < t + 0.08) {
        const f = scale[step % scale.length];
        tone(f, next, 0.16, 0.018, 'triangle');
        if (step % 4 === 0) tone(f / 2, next, 0.2, 0.02, 'sine');
        step += 1;
        next += 0.2;
      }
    },
  };
}

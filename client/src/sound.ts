// ============================================================
// Sound effects via Web Audio API — tanpa file audio sama sekali.
// Semua bunyi dihasilkan dari oscillator sederhana.
// ============================================================

let ctx: AudioContext | null = null;
let enabled = true;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  // beberapa browser men-suspend context sampai ada interaksi user
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setSoundEnabled(v: boolean): void {
  enabled = v;
}
export function isSoundEnabled(): boolean {
  return enabled;
}

interface ToneOpts {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  slideTo?: number;
  delay?: number;
}

function tone({ freq, duration, type = 'sine', gain = 0.15, slideTo, delay = 0 }: ToneOpts): void {
  const audio = getCtx();
  if (!audio || !enabled) return;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  const t0 = audio.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

// --- Efek-efek spesifik ---

export const sfx = {
  // dadu menggelinding: beberapa "klik" cepat
  dice() {
    for (let i = 0; i < 6; i++) {
      tone({
        freq: 180 + Math.random() * 120,
        duration: 0.05,
        type: 'square',
        gain: 0.06,
        delay: i * 0.07,
      });
    }
  },
  // langkah bidak
  step() {
    tone({ freq: 320, duration: 0.06, type: 'triangle', gain: 0.05 });
  },
  // dapat uang: "ka-ching" dua nada naik
  cash() {
    tone({ freq: 880, duration: 0.12, type: 'sine', gain: 0.14 });
    tone({ freq: 1320, duration: 0.18, type: 'sine', gain: 0.12, delay: 0.1 });
  },
  // bayar / kehilangan uang: nada turun murung
  pay() {
    tone({ freq: 440, duration: 0.25, type: 'sawtooth', gain: 0.1, slideTo: 160 });
  },
  // beli properti: nada "pop" ceria
  buy() {
    tone({ freq: 523, duration: 0.1, type: 'triangle', gain: 0.12 });
    tone({ freq: 784, duration: 0.14, type: 'triangle', gain: 0.12, delay: 0.09 });
  },
  // kartu dibuka
  card() {
    tone({ freq: 600, duration: 0.12, type: 'sine', gain: 0.1, slideTo: 900 });
  },
  // masuk penjara / OTT KPK: sirene
  jail() {
    tone({ freq: 700, duration: 0.3, type: 'sawtooth', gain: 0.12, slideTo: 400 });
    tone({ freq: 700, duration: 0.3, type: 'sawtooth', gain: 0.12, slideTo: 400, delay: 0.32 });
  },
  // menang
  win() {
    [523, 659, 784, 1047].forEach((f, i) =>
      tone({ freq: f, duration: 0.2, type: 'triangle', gain: 0.14, delay: i * 0.14 }),
    );
  },
};

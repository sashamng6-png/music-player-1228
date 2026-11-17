/**
 * MusicFlow demo media generator.
 *
 * Every audio file in this project is an original instrumental sketch synthesized
 * from scratch by this script (no samples, no third-party recordings). That keeps
 * the demo library 100% legal and offline-friendly.
 *
 * Run: npm run generate:media
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Mp3Encoder } from '@breezystack/lamejs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const audioDir = path.join(root, 'public', 'audio');
const coverDir = path.join(root, 'public', 'covers');
fs.mkdirSync(audioDir, { recursive: true });
fs.mkdirSync(coverDir, { recursive: true });

const SR = 44100;

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const mulberry32 = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const mtof = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const WAVES = {
  sine: (p) => Math.sin(p * Math.PI * 2),
  triangle: (p) => (2 / Math.PI) * Math.asin(Math.sin(p * Math.PI * 2)),
  saw: (p) => 2 * (p - Math.floor(p + 0.5)),
  square: (p) => (p % 1 < 0.5 ? 1 : -1),
  softsquare: (p) => Math.tanh(3 * Math.sin(p * Math.PI * 2)),
  piano: (p) => {
    const t = p % 1;
    return (
      Math.sin(t * Math.PI * 2) * 0.62 +
      Math.sin(t * Math.PI * 4) * 0.24 +
      Math.sin(t * Math.PI * 6) * 0.1 +
      Math.sin(t * Math.PI * 8) * 0.05
    );
  },
  epiano: (p) => {
    const t = p % 1;
    return (
      Math.sin(t * Math.PI * 2) * 0.55 +
      Math.sin(t * Math.PI * 4 + 0.4) * 0.22 +
      Math.sin(t * Math.PI * 6.02) * 0.08
    );
  },
};

function makeBuffer(seconds) {
  return new Float32Array(Math.ceil(seconds * SR) + SR);
}

function addTone(buf, start, dur, freq, options = {}) {
  const {
    wave = 'sine',
    gain = 0.18,
    attack = 0.008,
    decay = 0.25,
    sustain = 0.6,
    release = 0.12,
    detune = 0,
    vibrato = 0,
    vibratoRate = 5,
    pan = 0,
    filterSweep = 0,
  } = options;

  const startSample = Math.max(0, Math.floor(start * SR));
  const total = Math.floor((dur + release) * SR);
  const waveFn = WAVES[wave] || WAVES.sine;
  let phase = Math.random() * 0.01;
  const inc = (freq * Math.pow(2, detune / 1200)) / SR;
  let lp = 0;
  const lpCoef = filterSweep > 0 ? clamp(1 - filterSweep, 0.02, 0.9) : 0;

  for (let i = 0; i < total; i++) {
    const t = i / SR;
    let env;
    if (t < attack) env = t / attack;
    else if (t < attack + decay) {
      env = 1 - ((1 - sustain) * (t - attack)) / decay;
    } else env = sustain;
    if (t > dur) env *= Math.max(0, 1 - (t - dur) / Math.max(0.001, release));
    if (env <= 0) continue;

    const vib = vibrato ? 1 + Math.sin(t * Math.PI * 2 * vibratoRate) * vibrato : 1;
    phase += inc * vib;
    let sample = waveFn(phase);
    if (lpCoef) {
      lp += (sample - lp) * lpCoef;
      sample = lp;
    }
    const idx = startSample + i;
    if (idx >= buf.length) break;
    buf[idx] += sample * gain * env * (1 - Math.abs(pan) * 0.35);
  }
}

let noiseSeed = 1234567;
function noise() {
  noiseSeed = (noiseSeed * 1103515245 + 12345) & 0x7fffffff;
  return (noiseSeed / 0x7fffffff) * 2 - 1;
}

function addKick(buf, start, gain = 0.7) {
  const dur = 0.42;
  const n = Math.floor(dur * SR);
  const s0 = Math.floor(start * SR);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 42 + 120 * Math.exp(-t * 32);
    phase += f / SR;
    const env = Math.exp(-t * 8.5);
    const click = t < 0.006 ? noise() * 0.25 * (1 - t / 0.006) : 0;
    const idx = s0 + i;
    if (idx < buf.length) buf[idx] += (Math.sin(phase * Math.PI * 2) * env + click) * gain;
  }
}

function addSnare(buf, start, gain = 0.28, tone = 190) {
  const dur = 0.24;
  const n = Math.floor(dur * SR);
  const s0 = Math.floor(start * SR);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 24);
    phase += tone / SR;
    const body = Math.sin(phase * Math.PI * 2) * 0.25;
    const idx = s0 + i;
    if (idx < buf.length) buf[idx] += (noise() * 0.9 + body) * env * gain;
  }
}

function addHat(buf, start, gain = 0.1, open = false) {
  const dur = open ? 0.32 : 0.06;
  const n = Math.floor(dur * SR);
  const s0 = Math.floor(start * SR);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.exp(-t * (open ? 13 : 70));
    const raw = noise();
    const hp = raw - prev; // crude high-pass
    prev = raw;
    const idx = s0 + i;
    if (idx < buf.length) buf[idx] += hp * env * gain;
  }
}

function addClap(buf, start, gain = 0.16) {
  for (const offset of [0, 0.011, 0.022, 0.034]) {
    const dur = 0.16;
    const n = Math.floor(dur * SR);
    const s0 = Math.floor((start + offset) * SR);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const env = Math.exp(-t * 40) * (offset === 0.034 ? 1 : 0.6);
      const idx = s0 + i;
      if (idx < buf.length) buf[idx] += noise() * env * gain;
    }
  }
}

function addVinyl(buf, duration, level = 0.006) {
  const rnd = mulberry32(99);
  let crackle = 0;
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR;
    if (t > duration) break;
    if (rnd() < 0.00035) crackle = (rnd() * 2 - 1) * 0.25;
    crackle *= 0.86;
    buf[i] += (rnd() * 2 - 1) * level + crackle * level * 6;
  }
}

/** Simple differential stereo widener + delay/reverb-ish tail. */
function applySpace(buf, { delay = 0.28, feedback = 0.3, mix = 0.18 } = {}) {
  const d = Math.floor(delay * SR);
  const n = buf.length;
  for (let i = d; i < n; i++) {
    buf[i] += buf[i - d] * mix;
    if (i > d * 2) buf[i] += buf[i - d * 2] * feedback * mix;
  }
}

function normalize(buf, peak = 0.92) {
  let max = 0;
  for (let i = 0; i < buf.length; i++) max = Math.max(max, Math.abs(buf[i]));
  if (max === 0) return;
  const k = peak / max;
  for (let i = 0; i < buf.length; i++) buf[i] = Math.tanh(buf[i] * k * 1.05) * 0.98;
}

function fadeEdges(buf, seconds, fadeIn = 0.02, fadeOut = 1.6) {
  const inN = Math.floor(fadeIn * SR);
  const outN = Math.floor(fadeOut * SR);
  for (let i = 0; i < inN; i++) buf[i] *= i / inN;
  for (let i = 0; i < outN; i++) {
    const idx = buf.length - outN + i;
    if (idx >= 0) buf[idx] *= 1 - i / outN;
  }
  void seconds;
}

function encodeMp3(buf, duration, outPath) {
  const samples = Math.floor(duration * SR);
  const pcm = new Int16Array(samples);
  for (let i = 0; i < samples; i++) pcm[i] = clamp(Math.round(buf[i] * 32767), -32768, 32767);
  const encoder = new Mp3Encoder(1, SR, 128);
  const chunks = [];
  const blockSize = 1152;
  for (let i = 0; i < pcm.length; i += blockSize) {
    const block = pcm.subarray(i, i + blockSize);
    const encoded = encoder.encodeBuffer(block);
    if (encoded.length > 0) chunks.push(Buffer.from(encoded));
  }
  const flush = encoder.flush();
  if (flush.length > 0) chunks.push(Buffer.from(flush));
  fs.writeFileSync(outPath, Buffer.concat(chunks));
}

/* ------------------------------------------------------------------ */
/* composition helpers                                                 */
/* ------------------------------------------------------------------ */

const CHORDS = {
  maj: [0, 4, 7, 11],
  min: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
  min9: [0, 3, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
  sus2: [0, 2, 7, 12],
  sus4: [0, 5, 7, 12],
  add9: [0, 4, 7, 14],
};

function chordNotes(root, quality) {
  return CHORDS[quality].map((n) => root + n);
}

function placeChord(buf, start, dur, notes, opts = {}) {
  const { gain = 0.12, wave = 'sine', attack = 0.02, release = 0.4, detune = 0 } = opts;
  notes.forEach((m, i) => {
    addTone(buf, start + i * (opts.strum || 0), dur, mtof(m), {
      ...opts,
      wave,
      gain: gain / Math.sqrt(notes.length),
      attack,
      release,
      detune: detune + (i - notes.length / 2) * 1.5,
    });
  });
}

function arpeggio(buf, start, bars, bpm, notes, opts = {}) {
  const beat = 60 / bpm;
  const step = opts.step || beat / 2;
  const pattern = opts.pattern || [0, 1, 2, 3, 2, 1];
  const count = Math.floor((bars * 4 * beat) / step);
  for (let i = 0; i < count; i++) {
    const n = notes[pattern[i % pattern.length] % notes.length];
    addTone(buf, start + i * step, step * 0.9, mtof(n + (opts.octave || 12)), {
      wave: opts.wave || 'triangle',
      gain: opts.gain || 0.07,
      attack: 0.004,
      decay: 0.12,
      sustain: 0.25,
      release: 0.1,
      pan: i % 2 ? 0.18 : -0.18,
    });
  }
}

function bassLine(buf, start, bars, bpm, rootNotes, opts = {}) {
  const beat = 60 / bpm;
  const step = opts.step || beat / 2;
  const barsCount = bars;
  for (let b = 0; b < barsCount; b++) {
    const root = rootNotes[b % rootNotes.length];
    const hits = opts.hits || [0, 1.5, 2, 3.5];
    hits.forEach((h, i) => {
      addTone(buf, start + b * 4 * beat + h * beat, step * 1.1, mtof(root - 12), {
        wave: opts.wave || 'triangle',
        gain: (opts.gain || 0.22) * (i === 0 ? 1 : 0.8),
        attack: 0.005,
        decay: 0.18,
        sustain: 0.35,
        release: 0.08,
      });
    });
  }
}

function drumPattern(buf, start, bars, bpm, style = 'pop', swing = 0) {
  const beat = 60 / bpm;
  const rnd = mulberry32(7);
  for (let bar = 0; bar < bars; bar++) {
    const barStart = start + bar * 4 * beat;
    if (style === 'house') {
      for (let b = 0; b < 4; b++) {
        addKick(buf, barStart + b * beat, 0.65);
        addClap(buf, barStart + b * beat + beat / 2, 0.13);
        addHat(buf, barStart + b * beat + beat / 2, 0.09, true);
      }
      for (let s = 0; s < 16; s++) {
        if (s % 2 === 0) addHat(buf, barStart + (s * beat) / 4, 0.045);
        else if (s % 4 === 3) addHat(buf, barStart + (s * beat) / 4, 0.035);
      }
    } else if (style === 'boombap') {
      addKick(buf, barStart, 0.8);
      addKick(buf, barStart + beat * 1.75, 0.7);
      addKick(buf, barStart + beat * 2.5, 0.55);
      addSnare(buf, barStart + beat, 0.3);
      addSnare(buf, barStart + beat * 3, 0.3);
      for (let s = 0; s < 8; s++) addHat(buf, barStart + s * beat * 0.5 + (s % 2 ? 0.02 : 0), 0.045);
    } else if (style === 'jazz') {
      for (let b = 0; b < 4; b++) {
        if (b % 2 === 0) {
          addKick(buf, barStart + b * beat, 0.16);
        }
        addHat(buf, barStart + b * beat + beat * 0.67, 0.08, false);
        if (rnd() > 0.55) addSnare(buf, barStart + b * beat + 0.3, 0.06, 240);
      }
    } else if (style === 'lofi') {
      addKick(buf, barStart, 0.55);
      addKick(buf, barStart + beat * 2.5, 0.45);
      addSnare(buf, barStart + beat, 0.2, 175);
      addSnare(buf, barStart + beat * 3, 0.2, 185);
      for (let s = 0; s < 8; s++) {
        addHat(buf, barStart + s * (beat / 2) + (s % 2 ? 0.035 : 0), 0.03);
      }
    } else if (style === 'pop') {
      addKick(buf, barStart, 0.6);
      addKick(buf, barStart + beat * 2, 0.55);
      addSnare(buf, barStart + beat, 0.22);
      addSnare(buf, barStart + beat * 3, 0.22);
      for (let s = 0; s < 8; s++) addHat(buf, barStart + s * (beat / 2), 0.035);
    } else if (style === 'tribal') {
      addKick(buf, barStart, 0.55);
      addKick(buf, barStart + beat * 1.5, 0.4);
      addKick(buf, barStart + beat * 2.75, 0.5);
      addSnare(buf, barStart + beat * 2, 0.16, 150);
      for (let s = 0; s < 8; s++) addHat(buf, barStart + s * (beat / 2) + (swing ? 0.025 : 0), 0.028);
    }
  }
}

function melodyLine(buf, start, bars, bpm, scale, opts = {}) {
  const beat = 60 / bpm;
  const rnd = mulberry32(opts.seed || 42);
  const stepsPerBar = opts.stepsPerBar || 8;
  const step = (4 * beat) / stepsPerBar;
  let idx = Math.floor(scale.length / 2);
  for (let bar = 0; bar < bars; bar++) {
    for (let s = 0; s < stepsPerBar; s++) {
      if (rnd() < (opts.density ?? 0.45)) {
        idx = clamp(idx + (rnd() > 0.5 ? 1 : -1) * (rnd() > 0.7 ? 2 : 1), 0, scale.length - 1);
        const n = scale[idx] + (opts.octave || 12);
        addTone(buf, start + bar * 4 * beat + s * step, step * 1.6, mtof(n), {
          wave: opts.wave || 'sine',
          gain: opts.gain || 0.08,
          attack: 0.01,
          decay: 0.2,
          sustain: 0.35,
          release: 0.25,
          vibrato: 0.003,
          vibratoRate: 4.5,
        });
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* track blueprints                                                    */
/* ------------------------------------------------------------------ */

const TRACKS = [
  {
    id: 'neon-district',
    file: 'neon-district.mp3',
    title: 'Нічне місто',
    artist: 'Nova Kava',
    album: 'Neon District',
    genre: 'Synthwave',
    bpm: 102,
    bars: 28,
    seed: 11,
    key: 57, // A
    progression: [
      [57, 'min9'],
      [53, 'maj7'],
      [48, 'maj9'],
      [55, 'sus2'],
    ],
    palette: ['#120b2e', '#7c3aed', '#22d3ee', '#fb7185'],
    art: 'rings',
  },
  {
    id: 'lofi-letters',
    file: 'lofi-letters.mp3',
    title: 'Теплий дощ',
    artist: 'Oksamyt',
    album: 'Lo-Fi Letters',
    genre: 'Lo-Fi',
    bpm: 84,
    bars: 24,
    seed: 22,
    key: 50,
    progression: [
      [50, 'min9'],
      [55, 'dom7'],
      [48, 'maj9'],
      [45, 'min7'],
    ],
    palette: ['#1a1a1a', '#0f766e', '#f59e0b', '#fda4af'],
    art: 'sunset',
  },
  {
    id: 'blue-hours',
    file: 'blue-hours.mp3',
    title: 'Океан тиші',
    artist: 'Marlow',
    album: 'Blue Hours',
    genre: 'Ambient',
    bpm: 62,
    bars: 18,
    seed: 33,
    key: 52,
    progression: [
      [52, 'maj7'],
      [47, 'add9'],
      [43, 'sus2'],
      [48, 'maj9'],
    ],
    palette: ['#031a2b', '#0e7490', '#38bdf8', '#a5f3fc'],
    art: 'orb',
  },
  {
    id: 'northbound',
    file: 'northbound.mp3',
    title: 'Північний вітер',
    artist: 'KODA',
    album: 'Northbound',
    genre: 'Cinematic',
    bpm: 78,
    bars: 24,
    seed: 44,
    key: 45,
    progression: [
      [45, 'min'],
      [41, 'maj'],
      [43, 'sus4'],
      [50, 'min7'],
    ],
    palette: ['#06121f', '#334155', '#67e8f9', '#e2e8f0'],
    art: 'mountain',
  },
  {
    id: 'bassline-avenue',
    file: 'bassline-avenue.mp3',
    title: 'Bassline Avenue',
    artist: 'Luma',
    album: 'Deep Cuts',
    genre: 'Deep House',
    bpm: 120,
    bars: 30,
    seed: 55,
    key: 46,
    progression: [
      [46, 'min7'],
      [51, 'min7'],
      [44, 'maj7'],
      [49, 'dom7'],
    ],
    palette: ['#0b1020', '#6d28d9', '#2dd4bf', '#f472b6'],
    art: 'grid',
  },
  {
    id: 'jazz-and-kava',
    file: 'jazz-and-kava.mp3',
    title: 'Кав’ярня на розі',
    artist: 'Trio Sonechko',
    album: 'Jazz & Кава',
    genre: 'Jazz',
    bpm: 100,
    bars: 24,
    seed: 66,
    key: 48,
    progression: [
      [48, 'maj9'],
      [53, 'dom7'],
      [50, 'min7'],
      [55, 'dom7'],
    ],
    palette: ['#21130d', '#b45309', '#fbbf24', '#fef3c7'],
    art: 'sun',
  },
  {
    id: 'golden-dust',
    file: 'golden-dust.mp3',
    title: 'Сонячний пил',
    artist: 'Vesta',
    album: 'Golden Dust',
    genre: 'Chillout',
    bpm: 92,
    bars: 26,
    seed: 77,
    key: 53,
    progression: [
      [53, 'add9'],
      [48, 'maj7'],
      [50, 'min7'],
      [55, 'sus4'],
    ],
    palette: ['#231307', '#c2410c', '#facc15', '#fde68a'],
    art: 'sunset',
  },
  {
    id: 'orbit',
    file: 'orbit.mp3',
    title: 'Гравітація',
    artist: 'ANTIGRAV',
    album: 'Orbit',
    genre: 'Electronic',
    bpm: 126,
    bars: 32,
    seed: 88,
    key: 45,
    progression: [
      [45, 'min7'],
      [52, 'min7'],
      [50, 'maj7'],
      [43, 'maj'],
    ],
    palette: ['#050816', '#4338ca', '#22d3ee', '#c4b5fd'],
    art: 'rings',
  },
  {
    id: 'dream-paths',
    file: 'dream-paths.mp3',
    title: 'Стежками снів',
    artist: 'Myla',
    album: 'Dream Paths',
    genre: 'Piano',
    bpm: 70,
    bars: 22,
    seed: 99,
    key: 50,
    progression: [
      [50, 'min7'],
      [46, 'maj7'],
      [48, 'add9'],
      [43, 'sus2'],
    ],
    palette: ['#140f26', '#8b5cf6', '#e879f9', '#f5d0fe'],
    art: 'orb',
  },
  {
    id: 'after-hours',
    file: 'after-hours.mp3',
    title: 'Пульс',
    artist: 'Riot Room',
    album: 'After Hours',
    genre: 'Hip-Hop',
    bpm: 88,
    bars: 26,
    seed: 111,
    key: 41,
    progression: [
      [41, 'min7'],
      [48, 'maj7'],
      [46, 'dom7'],
      [44, 'sus4'],
    ],
    palette: ['#0d0d0d', '#374151', '#14b8a6', '#f97316'],
    art: 'grid',
  },
];

/* ------------------------------------------------------------------ */
/* arrangement                                                         */
/* ------------------------------------------------------------------ */

function renderTrack(cfg) {
  const beat = 60 / cfg.bpm;
  const bar = beat * 4;
  const totalBars = cfg.bars;
  const duration = totalBars * bar + 2.2;
  const buf = makeBuffer(duration);
  const rnd = mulberry32(cfg.seed);
  const { progression } = cfg;

  const chordAt = (b) => {
    const [root, quality] = progression[b % progression.length];
    return chordNotes(root, quality);
  };
  const rootAt = (b) => progression[b % progression.length][0];

  const sectionPlan = {
    intro: 4,
    a: Math.floor(totalBars / 2) - 2,
    break: 2,
    b: Math.floor(totalBars / 2) - 2,
    outro: 2,
  };

  const sections = [];
  let cursor = 0;
  for (const [name, len] of Object.entries(sectionPlan)) {
    sections.push({ name, startBar: cursor, bars: Math.max(0, len) });
    cursor += len;
  }

  const at = (bars) => bars * bar;

  for (const sec of sections) {
    const start = at(sec.startBar);
    const secBars = sec.bars;
    if (secBars <= 0) continue;
    const intro = sec.name === 'intro';
    const breakSec = sec.name === 'break';
    const outro = sec.name === 'outro';

    // Pads
    for (let b = 0; b < secBars; b++) {
      const notes = chordAt(sec.startBar + b);
      const padNotes = notes.map((n) => (n >= 60 ? n - 12 : n));
      placeChord(buf, start + b * bar, bar * 0.94, padNotes, {
        wave: cfg.genre === 'Ambient' || cfg.genre === 'Piano' ? 'triangle' : 'saw',
        gain: cfg.genre === 'Ambient' ? 0.14 : 0.055,
        attack: cfg.genre === 'Ambient' ? 0.8 : 0.18,
        sustain: 0.5,
        release: bar * 0.4,
        strum: 0.02,
      });
      if (!intro && !breakSec && cfg.genre !== 'Ambient') {
        // upper sparkle
        addTone(buf, start + b * bar + 0.02, bar * 0.5, mtof(notes[notes.length - 1] + 12), {
          wave: 'sine',
          gain: 0.035,
          attack: 0.4,
          decay: 0.8,
          sustain: 0.3,
          release: 0.9,
          pan: 0.2,
        });
      }
    }

    // Bass
    if (!breakSec && cfg.genre !== 'Ambient' && cfg.genre !== 'Piano') {
      const roots = Array.from({ length: secBars }, (_, i) => rootAt(sec.startBar + i));
      const bassGain = cfg.genre === 'Jazz' ? 0.18 : 0.2;
      if (cfg.genre === 'Jazz') {
        for (let b = 0; b < secBars; b++) {
          const root = roots[b];
          const walk = [root, root + 2, root + 4, root + 5];
          for (let q = 0; q < 4; q++) {
            addTone(buf, start + b * bar + q * beat, beat * 0.8, mtof(walk[q] - 12), {
              wave: 'triangle',
              gain: bassGain,
              attack: 0.01,
              decay: 0.3,
              sustain: 0.4,
              release: 0.12,
            });
          }
        }
      } else if (cfg.genre === 'Hip-Hop' || cfg.genre === 'Lo-Fi') {
        bassLine(buf, start, secBars, cfg.bpm, roots, {
          gain: 0.24,
          hits: [0, 0.75, 2.25],
          wave: 'sine',
        });
      } else {
        bassLine(buf, start, secBars, cfg.bpm, roots, {
          gain: bassGain,
          hits: cfg.genre === 'Deep House' || cfg.genre === 'Electronic' ? [0, 0.75, 1.5, 2.5, 3.25] : [0, 1.5, 2, 3.5],
          wave: cfg.genre === 'Deep House' ? 'softsquare' : 'triangle',
        });
      }
    }

    // Drums
    if (!intro && !breakSec && cfg.genre !== 'Ambient' && cfg.genre !== 'Piano' && !(outro && cfg.bars < 20)) {
      const style =
        cfg.genre === 'Deep House'
          ? 'house'
          : cfg.genre === 'Hip-Hop'
            ? 'boombap'
            : cfg.genre === 'Jazz'
              ? 'jazz'
              : cfg.genre === 'Lo-Fi'
                ? 'lofi'
                : cfg.genre === 'Chillout'
                  ? 'tribal'
                  : 'pop';
      drumPattern(buf, start, secBars, cfg.bpm, style, cfg.genre === 'Jazz' ? 0.03 : 0);
    }

    // Arpeggios / plucks
    if (!intro && !outro) {
      const arpNotes = chordAt(sec.startBar).map((n) => n + 12);
      if (cfg.genre === 'Deep House' || cfg.genre === 'Electronic') {
        arpeggio(buf, start, secBars, cfg.bpm, arpNotes, {
          step: beat / 4,
          gain: 0.035,
          wave: 'softsquare',
          pattern: [0, 2, 1, 3, 2, 0, 3, 1],
        });
      } else if (cfg.genre === 'Synthwave') {
        arpeggio(buf, start, secBars, cfg.bpm, arpNotes, {
          step: beat / 2,
          gain: 0.055,
          wave: 'saw',
          octave: 12,
        });
      } else if (cfg.genre === 'Jazz') {
        for (let b = 0; b < secBars; b++) {
          const notes = chordAt(sec.startBar + b);
          for (let q = 0; q < 3; q++) {
            const n = notes[Math.floor(rnd() * notes.length)] + 12;
            addTone(buf, start + b * bar + q * beat + beat * 0.5, beat * 0.9, mtof(n), {
              wave: 'epiano',
              gain: 0.06,
              attack: 0.005,
              decay: 0.4,
              sustain: 0.2,
              release: 0.4,
            });
          }
        }
      }
    }

    // Melody
    if (!intro && (!outro || cfg.genre === 'Ambient')) {
      const scale = chordAt(sec.startBar).concat(chordAt(sec.startBar).map((n) => n + 12));
      melodyLine(buf, start, secBars, cfg.bpm, scale, {
        seed: cfg.seed + sec.startBar,
        density: breakSec ? 0.2 : cfg.genre === 'Ambient' || cfg.genre === 'Piano' ? 0.42 : 0.34,
        wave: cfg.genre === 'Piano' ? 'piano' : cfg.genre === 'Jazz' ? 'epiano' : 'sine',
        gain: cfg.genre === 'Piano' ? 0.12 : 0.07,
        octave: cfg.genre === 'Ambient' ? 24 : 12,
        stepsPerBar: 8,
      });
    }

    // Piano ostinato for the neo-classical piece
    if (cfg.genre === 'Piano') {
      for (let b = 0; b < secBars; b++) {
        const notes = chordAt(sec.startBar + b);
        for (let s = 0; s < 8; s++) {
          const n = notes[s % notes.length] + (s > 3 ? 12 : 0);
          addTone(buf, start + b * bar + (s * bar) / 8, bar / 8, mtof(n), {
            wave: 'piano',
            gain: 0.1,
            attack: 0.003,
            decay: 0.35,
            sustain: 0.18,
            release: 0.5,
            pan: s % 2 ? 0.15 : -0.15,
          });
        }
      }
    }
  }

  // Texture
  if (cfg.genre === 'Lo-Fi' || cfg.genre === 'Hip-Hop' || cfg.genre === 'Jazz') {
    addVinyl(buf, duration, cfg.genre === 'Lo-Fi' ? 0.0055 : 0.0035);
  }
  applySpace(buf, {
    delay: 60 / cfg.bpm,
    feedback: 0.24,
    mix: cfg.genre === 'Ambient' || cfg.genre === 'Piano' ? 0.3 : 0.13,
  });
  normalize(buf, 0.9);
  fadeEdges(buf, duration, 0.05, 2.2);

  return { buf, duration };
}

/* ------------------------------------------------------------------ */
/* cover art                                                           */
/* ------------------------------------------------------------------ */

function coverSvg(cfg) {
  const [bg, c1, c2, highlight] = cfg.palette;
  const rnd = mulberry32(cfg.seed * 17);
  const style = cfg.art;
  let shapes = '';

  if (style === 'rings') {
    shapes = `
      <g opacity="0.9">
        ${Array.from({ length: 9 }, (_, i) => {
          const r = 90 + i * 38;
          return `<circle cx="620" cy="300" r="${r}" fill="none" stroke="${i % 2 ? c2 : highlight}" stroke-width="${i % 3 === 0 ? 2.5 : 1}" opacity="${0.5 - i * 0.04}"/>`;
        }).join('')}
        <circle cx="620" cy="300" r="46" fill="${highlight}"/>
        <circle cx="620" cy="300" r="10" fill="${bg}"/>
      </g>
      <path d="M0 640 C 180 540, 300 720, 470 610 S 720 520, 820 600 L 820 820 L 0 820 Z" fill="${c1}" opacity="0.55"/>
    `;
  } else if (style === 'sunset') {
    shapes = `
      <defs>
        <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${highlight}"/>
          <stop offset="1" stop-color="${c1}"/>
        </linearGradient>
      </defs>
      <circle cx="400" cy="470" r="330" fill="url(#sun)" opacity="0.9"/>
      ${Array.from({ length: 7 }, (_, i) => `<rect x="0" y="${470 + i * 34}" width="800" height="${8 + i * 2}" fill="${bg}" opacity="${0.25 + i * 0.09}"/>`).join('')}
      <circle cx="260" cy="260" r="140" fill="${c2}" opacity="0.18"/>
      ${Array.from({ length: 40 }, (_, i) => `<circle cx="${rnd() * 800}" cy="${rnd() * 300}" r="${1 + rnd() * 2.4}" fill="${highlight}" opacity="${0.3 + rnd() * 0.6}"/>`).join('')}
    `;
  } else if (style === 'orb') {
    shapes = `
      <defs>
        <radialGradient id="orb" cx="38%" cy="32%">
          <stop offset="0" stop-color="${highlight}"/>
          <stop offset="55%" stop-color="${c2}"/>
          <stop offset="100%" stop-color="${c1}"/>
        </radialGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="55"/></filter>
      </defs>
      <circle cx="430" cy="420" r="250" fill="${c2}" opacity="0.35" filter="url(#blur)"/>
      <circle cx="470" cy="390" r="215" fill="url(#orb)"/>
      <ellipse cx="450" cy="440" rx="360" ry="88" fill="none" stroke="${highlight}" stroke-width="2" opacity="0.55" transform="rotate(-18 450 440)"/>
      <ellipse cx="450" cy="440" rx="320" ry="190" fill="none" stroke="${c2}" stroke-width="1" opacity="0.3" transform="rotate(24 450 440)"/>
      <circle cx="700" cy="190" r="4" fill="${highlight}"/>
      <circle cx="170" cy="560" r="2.5" fill="${highlight}" opacity="0.7"/>
      <circle cx="600" cy="660" r="3" fill="${highlight}" opacity="0.5"/>
    `;
  } else if (style === 'mountain') {
    shapes = `
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${c1}" stop-opacity="0.35"/>
          <stop offset="1" stop-color="${bg}"/>
        </linearGradient>
      </defs>
      <rect width="800" height="800" fill="url(#sky)"/>
      <circle cx="620" cy="210" r="86" fill="${highlight}" opacity="0.9"/>
      <path d="M0 690 L200 390 L340 620 L470 330 L650 640 L800 470 L800 800 L0 800 Z" fill="${c1}" opacity="0.85"/>
      <path d="M0 760 L160 540 L300 720 L430 500 L610 740 L800 610 L800 800 L0 800 Z" fill="${bg}" opacity="0.85"/>
      <path d="M200 390 L260 470 L230 460 L250 510" fill="none" stroke="${highlight}" stroke-width="2" opacity="0.7"/>
      <path d="M470 330 L515 415 L480 405 L505 465" fill="none" stroke="${highlight}" stroke-width="2" opacity="0.6"/>
    `;
  } else if (style === 'grid') {
    shapes = `
      <g opacity="0.75" stroke="${c2}" stroke-width="1">
        ${Array.from({ length: 9 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="800"/>`).join('')}
        ${Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${i * 100}" x2="800" y2="${i * 100}"/>`).join('')}
      </g>
      <circle cx="400" cy="400" r="240" fill="none" stroke="${c1}" stroke-width="46" opacity="0.85"/>
      <circle cx="400" cy="400" r="120" fill="${c2}" opacity="0.9"/>
      <path d="M90 690 L90 520 L130 520 L130 610 L170 610 L170 470 L210 470 L210 690 Z" fill="${highlight}" opacity="0.65"/>
      <path d="M590 690 L590 430 L630 430 L630 560 L670 560 L670 500 L710 500 L710 690 Z" fill="${highlight}" opacity="0.4"/>
    `;
  } else {
    shapes = `
      <circle cx="300" cy="330" r="260" fill="${c1}" opacity="0.6"/>
      <circle cx="560" cy="520" r="180" fill="${c2}" opacity="0.35"/>
      <rect x="90" y="560" width="620" height="3" fill="${highlight}" opacity="0.7"/>
    `;
  }

  const label = cfg.album.toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg}"/>
      <stop offset="0.55" stop-color="${c1}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${bg}"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.055"/></feComponentTransfer>
    </filter>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.72"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  ${shapes}
  <rect width="800" height="800" fill="url(#shade)"/>
  <rect width="800" height="800" filter="url(#grain)"/>
  <g font-family="Inter, Segoe UI, Arial, sans-serif" fill="#fff">
    <text x="56" y="622" font-size="19" letter-spacing="5" opacity="0.7">MUSICFLOW · ${cfg.genre.toUpperCase()}</text>
    <text x="56" y="700" font-size="56" font-weight="700" letter-spacing="-1">${escapeXml(cfg.title)}</text>
    <text x="56" y="750" font-size="26" opacity="0.85">${escapeXml(cfg.artist)} — ${escapeXml(label)}</text>
  </g>
  <rect x="56" y="560" width="46" height="4" fill="${c2}"/>
</svg>`;
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ------------------------------------------------------------------ */
/* run                                                                 */
/* ------------------------------------------------------------------ */

const manifest = [];
for (const cfg of TRACKS) {
  const out = path.join(audioDir, cfg.file);
  process.stdout.write(`\n▶ ${cfg.artist} — ${cfg.title} (${cfg.genre}) `);
  const started = Date.now();
  const { buf, duration } = renderTrack(cfg);
  encodeMp3(buf, duration, out);
  fs.writeFileSync(path.join(coverDir, `${cfg.id}.svg`), coverSvg(cfg));
  const size = (fs.statSync(out).size / 1024 / 1024).toFixed(2);
  manifest.push({
    id: cfg.id,
    src: `audio/${cfg.file}`,
    cover: `covers/${cfg.id}.svg`,
    duration,
    bytes: fs.statSync(out).size,
  });
  console.log(`→ ${duration.toFixed(1)}s, ${size} MB, ${((Date.now() - started) / 1000).toFixed(1)}s render`);
}

fs.writeFileSync(path.join(root, 'scripts', 'media-manifest.json'), JSON.stringify(manifest, null, 2));
console.log('\n✅ Demo library generated. Original synthetic recordings, no external audio.');

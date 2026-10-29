// Sound design from a cue list, synthesised entirely with ffmpeg (no samples, no licences).
// Cue types: see RECIPES below. Every cue takes an optional `gain`.
import fs from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { rng } from './lib/util.js';

const SR = 48000;
const ev = (expr, d) => `aevalsrc='${expr}':d=${d.toFixed(3)}:s=${SR}`;
const noise = (color, d, amp = 0.5, seed = 1) => `anoisesrc=d=${d.toFixed(3)}:c=${color}:a=${amp}:r=${SR}:s=${seed}`;

// each recipe returns [{ at, chain }] where chain is a filtergraph producing one mono stream
const RECIPES = {
  ambience: ({ from, to, level = 1, fadeIn = 0.25, fadeOut = 0.3 }) => {
    const d = to - from;
    const fade = `afade=t=in:d=${fadeIn},afade=t=out:st=${Math.max(0, d - fadeOut)}:d=${fadeOut}`;
    return [
      { at: from, chain: `${noise('brown', d, 0.6, 3)},lowpass=f=360,volume=${0.45 * level},${fade}` },
      { at: from, chain: `${noise('pink', d, 0.35, 4)},bandpass=f=1100:w=900,volume=${0.06 * level},${fade}` },
    ];
  },
  tick: ({ at }) => [].concat(at).map((t) => ({ at: t, chain: ev('0.5*sin(2*PI*1760*t)*exp(-45*t)', 0.15) })),
  riser: ({ from, to }) => {
    const d = to - from;
    return [
      { at: from, chain: ev(`0.16*sin(2*PI*(160*t+${(260 / d).toFixed(3)}*t*t))*(t/${d})`, d) },
      { at: from, chain: `${noise('white', d, 0.4, 5)},highpass=f=1800,afade=t=in:d=${d}:curve=exp,volume=0.35` },
    ];
  },
  burst: ({ at }) => [
    { at, chain: `${noise('white', 0.7, 0.9, 6)},highpass=f=350,afade=t=out:st=0.02:d=0.65:curve=exp,volume=1.4` },
    { at, chain: ev('0.95*sin(2*PI*(36+80*exp(-12*t))*t)*exp(-3.5*t)', 1.6) },
    { at: at + 0.16, chain: ev('0.35*(sin(2*PI*523*t)+0.6*sin(2*PI*1307*t)+0.4*sin(2*PI*2141*t))*exp(-8*t)', 0.9) },
  ],
  grind: ({ from, to }) => {
    const d = to - from;
    return [
      { at: from, chain: `${noise('white', d, 0.7, 7)},bandpass=f=2600:w=1800,tremolo=f=27:d=0.7,afade=t=in:d=0.04,afade=t=out:st=${(d * 0.3).toFixed(2)}:d=${(d * 0.7).toFixed(2)},volume=0.75` },
      { at: from, chain: `${noise('brown', d, 0.8, 8)},lowpass=f=220,tremolo=f=13:d=0.6,afade=t=out:st=${(d * 0.4).toFixed(2)}:d=${(d * 0.6).toFixed(2)},volume=0.9` },
    ];
  },
  screech: ({ from, to }) => {
    const d = to - from;
    const env = `min(1,t*25)*max(0,1-t/${d.toFixed(3)})`;
    return [{ at: from, chain: `${ev(`(0.12*sin(2*PI*2250*t+5*sin(2*PI*8*t))+0.06*sin(2*PI*3380*t+4*sin(2*PI*11*t)))*${env}`, d)},highpass=f=900` }];
  },
  whoosh: ({ at }) => [{ at, chain: `${noise('pink', 0.5, 0.8, 9)},bandpass=f=700:w=900,afade=t=in:d=0.38:curve=exp,afade=t=out:st=0.38:d=0.12,volume=0.8` }],
  thump: ({ at }) => [
    { at, chain: ev('0.8*sin(2*PI*(52+45*exp(-15*t))*t)*exp(-6*t)', 0.9) },
    { at, chain: `${noise('brown', 0.4, 0.7, 10)},lowpass=f=260,afade=t=out:st=0:d=0.4:curve=exp` },
  ],
  hit: ({ at }) => [
    { at, chain: ev('0.75*sin(2*PI*(46+95*exp(-20*t))*t)*exp(-4.5*t)', 1.2) },
    { at, chain: `${noise('white', 0.18, 0.6, 11)},highpass=f=3000,afade=t=out:st=0:d=0.18:curve=exp` },
  ],
  rain: ({ from, to, level = 1 }) => {
    const d = to - from;
    const fade = `afade=t=in:d=0.4,afade=t=out:st=${Math.max(0, d - 0.5)}:d=0.5`;
    return [
      { at: from, chain: `${noise('pink', d, 0.9, 12)},highpass=f=300,lowpass=f=7000,volume=${0.8 * level},${fade}` },
      { at: from, chain: `${noise('brown', d, 0.9, 13)},lowpass=f=500,volume=${0.7 * level},${fade}` },
    ];
  },
  splash: ({ at }) => [{ at, chain: `${noise('white', 0.9, 0.9, 14)},bandpass=f=1500:w=2500,afade=t=in:d=0.03,afade=t=out:st=0.05:d=0.85:curve=exp,volume=0.8` }],
  powerdown: ({ at, d = 1.2 }) => [
    { at, chain: ev(`0.5*sin(2*PI*(220*t-80*t*t/${d}))*(1-t/${d})`, d) },
    { at, chain: ev('0.9*sin(2*PI*(60+30*exp(-20*t))*t)*exp(-7*t)', 0.6) },
  ],
  powerup: ({ at, d = 0.8 }) => [
    { at, chain: ev(`0.3*sin(2*PI*(60*t+90*t*t/${d}))*(t/${d})`, d) },
    { at: at + d - 0.05, chain: ev('0.6*sin(2*PI*(70+40*exp(-25*t))*t)*exp(-8*t)', 0.5) },
  ],
  hum: ({ from, to, level = 1 }) => [{ at: from, chain: `${ev(`${0.05 * level}*(sin(2*PI*60*t)+0.5*sin(2*PI*120*t)+0.25*sin(2*PI*180*t))`, to - from)},afade=t=in:d=0.2,afade=t=out:st=${Math.max(0, to - from - 0.05)}:d=0.05` }],
  boom: ({ at }) => [
    { at, chain: ev('1.0*sin(2*PI*(30+60*exp(-6*t))*t)*exp(-1.8*t)', 3) },
    { at, chain: `${noise('brown', 2.5, 1, 15)},lowpass=f=900,afade=t=out:st=0:d=2.5:curve=exp,volume=1.2` },
    { at: at + 0.02, chain: `${noise('white', 0.4, 0.8, 16)},highpass=f=1500,afade=t=out:st=0:d=0.4:curve=exp,volume=0.6` },
  ],
  heartbeat: ({ from, to, bpm = 75, bpmEnd = bpm }) => {
    const out = [];
    for (let t = from; t < to; t += 60 / (bpm + (bpmEnd - bpm) * ((t - from) / (to - from)))) {
      out.push({ at: t, chain: ev('0.6*sin(2*PI*55*t)*exp(-18*t)', 0.25) });
      out.push({ at: t + 0.2, chain: ev('0.4*sin(2*PI*48*t)*exp(-20*t)', 0.22) });
    }
    return out;
  },
  tinnitus: ({ from, to }) => [{ at: from, chain: `${ev('0.03*sin(2*PI*6200*t)', to - from)},afade=t=in:d=0.4,afade=t=out:st=${Math.max(0, to - from - 0.3)}:d=0.3` }],
  wind: ({ from, to, level = 1 }) => {
    const d = to - from;
    return [{ at: from, chain: `${noise('pink', d, 0.8, 17)},bandpass=f=500:w=600,tremolo=f=0.6:d=0.5,volume=${0.6 * level},afade=t=in:d=0.3,afade=t=out:st=${Math.max(0, d - 0.6)}:d=0.6` }];
  },
  thumps: ({ from, to, rate = 7, decay = 0.6 }) => {
    // square wheels slamming the road; slows down as the cars brake
    const out = [];
    let t = from, k = 0;
    while (t < to) {
      const life = (t - from) / (to - from);
      out.push({ at: t, chain: ev(`${(0.55 * (1 - life * decay)).toFixed(3)}*sin(2*PI*(70+50*exp(-30*t))*t)*exp(-22*t)`, 0.2) });
      t += 1 / (rate * Math.max(0.25, 1 - life * 0.8)) * (0.9 + ((k++ * 0.37) % 0.2));
    }
    return out;
  },
  drone: ({ from, to }) => {
    const d = to - from;
    return [{ at: from, chain: `${ev('0.22*(sin(2*PI*41*t)+0.7*sin(2*PI*61.5*t)+0.4*sin(2*PI*82*t+sin(2*PI*0.3*t)))', d)},afade=t=in:d=1.2,afade=t=out:st=${Math.max(0, d - 1)}:d=1` }];
  },
  crack: ({ at }) => [
    { at, chain: `${noise('white', 0.25, 1, 18)},highpass=f=2500,afade=t=out:st=0:d=0.25:curve=exp,volume=0.8` },
    { at, chain: ev('0.3*(sin(2*PI*2900*t)+sin(2*PI*4100*t)+sin(2*PI*5600*t))*exp(-14*t)', 0.6) },
  ],
  drip: ({ from, to, count = 20, seed = 31 }) => {
    const r = rng(seed);
    return Array.from({ length: count }, () => ({ at: from + r() * (to - from), chain: ev(`0.25*sin(2*PI*(900+${Math.round(r() * 700)}*exp(-30*t))*t)*exp(-25*t)`, 0.2) }));
  },
  crowd: ({ from, to, level = 1, fadeIn = 0.5, fadeOut = 0.6 }) => {
    const d = to - from;
    return [{ at: from, chain: `${noise('pink', d, 0.6, 19)},bandpass=f=900:w=700,tremolo=f=3.1:d=0.3,volume=${0.35 * level},afade=t=in:d=${fadeIn},afade=t=out:st=${Math.max(0, d - fadeOut)}:d=${fadeOut}` }];
  },
  horns: ({ from, to, count = 6, seed = 21 }) => {
    const r = rng(seed);
    const out = [];
    for (let i = 0; i < count; i++) {
      const d = 0.25 + r() * 0.7, f = 330 + r() * 160, at = from + r() * Math.max(0.1, to - from - d);
      const vol = 0.35 + r() * 0.65;
      out.push({ at, chain: `${ev(`0.06*(sgn(sin(2*PI*${f.toFixed(1)}*t))+sgn(sin(2*PI*${(f * 1.26).toFixed(1)}*t)))*min(1,t*30)*min(1,(${d.toFixed(3)}-t)*30)`, d)},lowpass=f=2200,volume=${vol.toFixed(2)}` });
    }
    return out;
  },
};

// Integrated loudness (LUFS) of a file, via ffmpeg's EBU R128 meter.
function measureLufs(file) {
  const r = spawnSync('ffmpeg', ['-nostats', '-i', file, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /Summary:[\s\S]*?I:\s+(-?[\d.]+) LUFS/.exec(r.stderr);
  if (!m) throw new Error('could not measure loudness');
  return Number(m[1]);
}

export function buildAudio(cues, duration, outFile) {
  const parts = cues.flatMap((c) => {
    const recipe = RECIPES[c.type];
    if (!recipe) throw new Error(`unknown audio cue type: ${c.type}`);
    return recipe(c).map((p) => (c.gain ? { ...p, chain: `${p.chain},volume=${c.gain}` } : p));
  });
  const graph = parts.map((p, i) => `${p.chain},adelay=delays=${Math.round(p.at * 1000)}:all=1,apad[s${i}]`);
  graph.push(`${parts.map((_, i) => `[s${i}]`).join('')}amix=inputs=${parts.length}:normalize=0:duration=longest,atrim=0:${duration}[out]`);
  const raw = outFile.replace(/\.wav$/, '') + '.mix.wav';
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-filter_complex', graph.join(';'), '-map', '[out]', '-t', String(duration), raw]);
  // One static gain to -14 LUFS (the usual target for TikTok/Reels/Shorts), then a peak
  // limiter. Unlike dynamic loudnorm this keeps the dynamics: the big moments stay big.
  const gain = Math.max(-20, Math.min(20, -14 - measureLufs(raw)));
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=0.7:attack=2:release=60:level=false,aformat=channel_layouts=stereo`, outFile]);
  fs.rmSync(raw, { force: true });
  return outFile;
}

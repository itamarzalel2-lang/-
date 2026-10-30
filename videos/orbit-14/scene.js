// Alone in Orbit Ep 01, Part 14 (Days 360-365). Plot: series/alone-in-orbit/story.md
// Opens on Part 13's last lines (the deorbit burn); Sam stops the engines; Day 365; the closed ending.
import {
  makePart, shot, room, faceShot, paperShot, readoutsShot, calendarShot, outside, stick, clamp, easeInOutCubic,
  waterPct, roundRect, FONTS, INK, HATCH,
} from '/engine/lib/orbit.js';
import { breakers, orbitDiagram, parachutes } from '/engine/lib/props2d.js';
import { narration, loadFonts, interior, space, earth, station, headOnly } from '/engine/lib/toon.js';
import { hash01 } from '/engine/lib/util.js';

const voice = await (await fetch(new URL('./voice.json', import.meta.url))).json();
const N = narration(voice);
const { at, end, word } = N;
const END = end('e4') + 1.2; // the last part ends on a held beat, not a cliffhanger
const STOP = word('stop', 'stopped') - 0.1;
const PULL = ['one', 'two', 'three', 'four'].map((w) => word('mara', w) - 0.05);
const QUAKE = Array.from({ length: 80 }, (_, i) => ({ at: i * 0.18, amp: 3.2, decay: 9 })).filter((k) => k.at < STOP);
const KNOCK = [0.2, 0.6, 1.0].map((d) => end('knocks') + d);
const OPEN = at('opened') + 0.2;
const letter = [
  { text: 'Three rules.', at: -1, y: 84 },
  { text: '1. Never open Hatch 3.', at: -1, y: 130 },
  { text: 'Not for anyone.', at: -1, y: 176, x: 84 },
  { text: 'Not even for me.', at: -1, y: 222, x: 84, underline: true },
  { text: '2. Every morning, check', at: -1, y: 268 },
  { text: 'three numbers:', at: -1, y: 314, x: 84 },
];

export const config = { canvas: '2d', fps: 30, duration: END };
export const subtitles = { top: 516, maxWords: 1, maxChars: 30, className: 'one' };

export const audio = [
  { type: 'grind', from: 0, to: STOP },
  { type: 'thumps', from: 0, to: STOP, rate: 5, decay: 0.5 },
  { type: 'klaxon', from: 0, to: STOP, level: 0.6 },
  { type: 'clank', at: PULL, gain: 0.6 },
  { type: 'powerdown', at: STOP },
  { type: 'pad', from: STOP, to: END, level: 1 },
  { type: 'ambience', from: STOP, to: END, level: 0.3 },
  { type: 'beep', at: [word('water', 'water')] },
  { type: 'clank', at: at('docked') + 1.6, gain: 0.5 },
  { type: 'knock', at: KNOCK },
  { type: 'heartbeat', from: at('knocks'), to: at('hale') + 1, bpm: 70, bpmEnd: 100 },
  { type: 'hiss', at: OPEN, d: 1.6 },
  { type: 'wind', from: at('home'), to: end('rainsaw') },
  { type: 'rain', from: at('rainsaw') - 0.2, to: end('rainsaw') + 0.3, level: 0.7 },
];

export async function setup({ g, overlay, W, H, dpr }) {
  await loadFonts();
  const ring = (t0, cx = 250, cy = 168, rx = 215, ry = 76) => (gg, t) => {
    const u = clamp((t - t0) / 0.8); if (u <= 0) return;
    gg.strokeStyle = '#c0261c'; gg.lineWidth = 3.5; gg.beginPath(); gg.ellipse(cx, cy, rx, ry, -0.02, -0.5, -0.5 + u * Math.PI * 2.05); gg.stroke();
  };
  // the front port (the docking hatch), with daylight pouring in when it opens
  const frontPort = (from, { open = () => 0, people = [], cam, kicks } = {}) => shot(from, cam, (g, t, lt) => {
    const o = open(t);
    interior(g, t, { back: 'hatch', night: 0.2, hatch: { ...HATCH, num: 'F', open: o, wheel: 1.25 * (1 - o) } });
    if (o > 0) {
      const gr = g.createRadialGradient(270, 207, 10, 270, 207, 82); gr.addColorStop(0, `rgba(255,255,245,${o})`); gr.addColorStop(1, `rgba(255,240,210,${0.7 * o})`);
      g.fillStyle = gr; g.beginPath(); g.arc(270, 207, 82 * o, 0, 7); g.fill();
    }
    for (const p of people) stick(g, { t, ...(typeof p === 'function' ? p(t) : p) });
  }, { kicks });
  const shots = [
    // (Part 13's last seconds)
    outside(0, { st: { s: 0.85, x: 330, y: 170, thrust: 1 }, sun: 0.3, cam: [{ t: 0, x: 240, y: 195, z: 1.0 }, { t: 6, x: 225, y: 215, z: 1.05 }] }),
    shot(at('down') - 0.1, [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 2.2, x: 270, y: 250, z: 1.15 }], (g, t, lt) => {
      space(g, t); earth(g, 270, 1100 - lt * 40, 1000, t, { rot: t * 0.006 });
      station(g, 280, 160 + lt * 25, 0.85, t, { rot: -0.05 - lt * 0.06, thrust: 1 });
    }, { kicks: QUAKE }),
    // the flight engineer and the breakers
    room(at('engineer') - 0.1, { back: 'wall', alarm: 0.7, kicks: QUAKE, people: [{ x: 230, y: 300, s: 1.5, who: 'sam', face: 'serious', look: 1, pose: 'reach' }], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 4, x: 300, y: 210, z: 1.15 }] }),
    shot(at('mara') - 0.1, [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 6, x: 270, y: 200, z: 1.06 }], (g, t) => {
      g.fillStyle = '#3a2a2a'; g.fillRect(-60, -60, 660, 560);
      breakers(g, 80, 70, t, { states: PULL.map((p) => easeInOutCubic(clamp((t - p) / 0.25))), warn: t < STOP ? 1 : 0 });
      g.fillStyle = `rgba(255,20,20,${t < STOP ? 0.12 + 0.12 * Math.sin(t * 9) : 0})`; g.fillRect(-60, -60, 660, 560);
    }, { kicks: QUAKE }),
    outside(at('stop') - 0.1, { st: { s: 0.85, x: 330, y: 170, thrust: (t) => 1 - clamp((t - STOP) / 0.4) }, sun: 0.3, cam: { x: 240, y: 200, z: 1.0 } }),
    room(at('laughed') - 0.1, { back: 'window', people: [
      { x: 210, y: 300, s: 1.5, who: 'sam', face: 'calm', look: 1 }, { x: 330, y: 300, s: 1.5, who: 'mara', face: 'calm', dir: -1, look: -1 },
    ], kicks: [0.4, 0.8, 1.2, 1.6].map((d) => ({ at: at('laughed') + d, amp: 1.2, decay: 12 })), cam: [{ t: 0, x: 270, y: 210, z: 1.2 }, { t: 3, x: 270, y: 210, z: 1.1 }] }),
    shot(at('lower') - 0.1, { x: 270, y: 230, z: 1.0 }, (g, t) => {
      orbitDiagram(g, t, { lower: clamp((t - at('lower') - 0.5) / 1.5) });
      g.fillStyle = '#e8f2ff'; g.font = `900 18px ${FONTS.display}`; g.textAlign = 'center';
      g.fillText('LOWER ORBIT', 270, 40);
    }),
    calendarShot(at('days') - 0.1, { first: 336, upTo: (t) => 360 + clamp((t - at('days')) / 3.4) * 3, circle: [{ day: 365, at: at('days') + 0.2, label: 'SHIP' }] }),
    readoutsShot(at('water') - 0.1, { items: [
      { label: 'OXYGEN', value: '113 kg', at: at('water') },
      { label: 'WATER', value: `${Math.floor(waterPct(361))}%`, at: word('water', 'water'), color: '#ff6b5a' },
      { label: 'POWER', value: '96%', at: at('water') + 0.3 },
    ] }),
    room(word('water', 'half') - 0.1, { back: 'window', people: [
      { x: 210, y: 300, s: 1.5, who: 'sam', face: 'calm', look: 1, pose: 'hold' }, { x: 330, y: 300, s: 1.5, who: 'mara', face: 'calm', dir: -1, look: -1 },
    ], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 5, x: 270, y: 210, z: 1.1 }] }),
    // day 365: a capsule docks; three knocks
    frontPort(at('d365') - 0.1, { people: [{ x: 120, y: 320, s: 1.4, who: 'sam', face: 'calm', look: 1 }, { x: 430, y: 320, s: 1.4, who: 'mara', face: 'calm', dir: -1, look: -1 }], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 270, y: 215, z: 1.06 }] }),
    shot(at('docked') - 0.1, [{ t: 0, x: 380, y: 180, z: 1.6 }, { t: 3, x: 400, y: 180, z: 1.8 }], (g, t, lt) => {
      space(g, t); earth(g, 270, 1240, 1000, t, { rot: t * 0.004 });
      station(g, 270, 175, 0.85, t, { rot: -0.03, frontCapsule: { gap: 90 * (1 - easeInOutCubic(clamp((lt - 0.2) / 1.5))) } });
    }),
    frontPort(at('knocks') - 0.1, { kicks: KNOCK.map((a) => ({ at: a, amp: 6, decay: 10 })), cam: [{ t: 0, x: 270, y: 210, z: 1.4 }, { t: 3, x: 270, y: 208, z: 1.6 }] }),
    paperShot(at('rule') - 0.1, { sheet: { x: 30, y: 22, w: 480, h: 390 }, lines: letter, cam: [{ t: 0, x: 270, y: 200, z: 1.0 }, { t: 3, x: 200, y: 222, z: 1.35 }], props: ring(at('rule') + 0.3, 200, 222, 140, 24) }),
    frontPort(at('opened') - 0.1, { open: (t) => easeInOutCubic(clamp((t - OPEN) / 1.2)), people: [{ x: 150, y: 320, s: 1.45, who: 'sam', face: 'serious', look: 1, pose: 'push' }], cam: [{ t: 0, x: 250, y: 215, z: 1.1 }, { t: 4, x: 270, y: 210, z: 1.3 }] }),
    frontPort(at('hale') - 0.1, { open: () => 1, people: [(t) => ({ x: 270, y: 250 + 20 * clamp((t - at('hale')) / 2), s: 1.0 + 0.4 * clamp((t - at('hale')) / 2), who: 'hale', face: 'calm', look: 0 })], cam: { x: 270, y: 210, z: 1.15 } }),
    faceShot(at('said') - 0.1, { who: 'hale', face: 'calm', look: 0.3 }),
    faceShot(at('sorry') - 0.1, { who: 'hale', face: 'sad', look: 0.3 }),
    // home
    shot(at('home') - 0.1, [{ t: 0, x: 270, y: 200, z: 1.0 }, { t: 4, x: 270, y: 210, z: 0.95 }], (g, t) => parachutes(g, t, { y: 120 + (t - at('home')) * 6 })),
    shot(at('rainsaw') - 0.1, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 270, y: 210, z: 1.06 }], (g, t) => {
      const gr = g.createLinearGradient(0, -40, 0, 480); gr.addColorStop(0, '#7d8794'); gr.addColorStop(1, '#b5bcc4');
      g.fillStyle = gr; g.fillRect(-60, -60, 660, 560);
      g.fillStyle = '#5f7a52'; g.fillRect(-60, 340, 660, 160);
      stick(g, { t, x: 140, y: 290, s: 1.4, who: 'mara', pose: 'shock', face: 'calm', look: 0, floaty: 0 });
      stick(g, { t, x: 360, y: 290, s: 1.4, who: 'sam', pose: 'hold', face: 'calm', dir: 1, floaty: 0 });
      stick(g, { t, x: 420, y: 292, s: 1.3, who: 'mom', pose: 'hold', face: 'calm', dir: -1, floaty: 0 });
      g.strokeStyle = 'rgba(220,230,240,0.55)'; g.lineWidth = 1.5;
      for (let i = 0; i < 120; i++) { const x = (hash01(i, 1) * 700 + t * 30) % 700 - 80, y = ((hash01(i, 2) * 520 + t * 420) % 520) - 60; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y + 16); g.stroke(); }
    }),
    // the company, in court
    shot(at('exposed') - 0.1, [{ t: 0, x: 270, y: 200, z: 1.0 }, { t: 8, x: 270, y: 195, z: 1.06 }], (g, t) => {
      g.fillStyle = '#15171c'; g.fillRect(-60, -60, 660, 560);
      roundRect(g, 30, 30, 480, 300, 10); g.fillStyle = '#3b4a68'; g.fill(); g.strokeStyle = '#000'; g.lineWidth = 8; g.stroke();
      g.save(); roundRect(g, 30, 30, 480, 300, 10); g.clip();
      space(g, t, { w: 540, h: 260 }); station(g, 270, 130, 0.55, t, { rot: -0.05 });
      g.fillStyle = '#c0261c'; g.fillRect(30, 250, 480, 30); g.fillStyle = '#fff'; g.fillRect(30, 280, 480, 50);
      g.fillStyle = '#fff'; g.font = `900 16px ${FONTS.display}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('BREAKING', 44, 265);
      g.fillStyle = '#111'; g.font = `900 19px ${FONTS.display}`;
      g.fillText(t < at('shut') ? 'LARKSPUR ORBITAL IN COURT' : 'PROJECT SOLO SHUT DOWN', 44, 305);
      g.restore();
    }),
    // the ending
    shot(at('e1') - 0.2, [{ t: 0, x: 270, y: 200, z: 1.3 }, { t: 6, x: 270, y: 200, z: 1.0 }], (g, t) => {
      space(g, t); earth(g, 270, 1240, 1000, t, { rot: t * 0.004 });
      station(g, 270, 170, 0.62, t, { rot: -0.08 + (t - at('e1')) * 0.004 });
    }),
    room(at('e3') - 0.15, { back: 'window', people: [
      { x: 230, y: 300, s: 1.5, who: 'sam', face: 'calm', look: 1 }, { x: 320, y: 300, s: 1.5, who: 'mara', face: 'calm', dir: -1, look: -1 },
    ], cam: [{ t: 0, x: 270, y: 200, z: 1.25 }, { t: 4, x: 270, y: 210, z: 1.05 }] }),
  ];
  return makePart({
    g, overlay, W, H, dpr, part: 14, end: END, shots,
    days: [{ at: at('engineer'), text: 'DAY 360' }, { at: at('d365'), text: 'DAY 365' }],
  });
}

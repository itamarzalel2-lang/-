// Alone in Orbit Ep 01, Part 10 (Day 240). Plot: series/alone-in-orbit/story.md
// Opens on Part 9's last lines (C. O. 2.); he breaks rule one; ends: she isn't moving.
import {
  makePart, shot, room, splitShot, faceShot, hatchNight, paperShot, planShot, morseMarks, clockPin,
  stick, clamp, easeInOutCubic, roundRect, HATCH,
} from '/engine/lib/orbit.js';
import { locker, valve } from '/engine/lib/props2d.js';
import { narration, loadFonts, interior, spotlight } from '/engine/lib/toon.js';

const voice = await (await fetch(new URL('./voice.json', import.meta.url))).json();
const N = narration(voice);
const { at, end, word } = N;
const END = end('moving') + 0.4;
// C was knocked before this part began; O and 2 land in the pauses before they're said
const MORSE = [
  ...[...'-.-.'].map((sym) => ({ at: -1, sym })),
  ...[...'---'].map((sym, i) => ({ at: at('o') - 1.0 + i * 0.3, sym, group: i === 0 })),
  ...[...'..---'].map((sym, i) => ({ at: at('two2') - 1.0 + i * 0.19, sym, group: i === 0 })),
];
const MINE = [0, 0.25, 0.5].map((d) => word('knock', 'knocked') - 0.05 + d);
const TURN = at('hiss') - 1.15; // the valve turns; air hisses through, then stops
const SPIN0 = at('spun'), OPEN = at('opened') - 0.2;
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
  { type: 'pad', from: 0, to: END, level: 1 },
  { type: 'ambience', from: 0, to: END, level: 0.3 },
  { type: 'knock', at: MORSE.filter((m) => m.at > 0).map((m) => m.at), gain: 0.3 },
  { type: 'heartbeat', from: 0, to: END, bpm: 96, bpmEnd: 112 },
  { type: 'clank', at: at('white') + 0.2, gain: 0.3 },
  { type: 'knock', at: MINE, gain: 0.9 },
  { type: 'hiss', at: TURN + 0.15, d: 1.4 },
  { type: 'clank', at: [SPIN0 + 0.1, word('stiff', 'stiff'), word('days', 'door') - 0.2], gain: 0.4 },
  { type: 'clank', at: OPEN + 0.1, gain: 0.7 },
  { type: 'riser', from: at('opened'), to: END },
  { type: 'boom', at: END - 0.05, gain: 0.6 },
];

export async function setup({ g, overlay, W, H, dpr }) {
  await loadFonts();
  // Sam holding a white cartridge
  const withCart = (o) => (gg, t, lt, figs) => {
    const f = figs?.[0]; if (!f) return;
    gg.save(); gg.translate(f.handF[0] + 4, f.handF[1] - 6); gg.rotate(0.4);
    gg.fillStyle = '#f0efe8'; gg.strokeStyle = '#151515'; gg.lineWidth = 2; roundRect(gg, -8, -22, 16, 44, 6); gg.fill(); gg.stroke();
    gg.fillStyle = '#c0261c'; gg.fillRect(-8, -4, 16, 7); gg.restore();
  };
  const ring = (t0) => (gg, t) => {
    const u = clamp((t - t0) / 0.8); if (u <= 0) return;
    gg.strokeStyle = '#c0261c'; gg.lineWidth = 3.5; gg.beginPath(); gg.ellipse(250, 168, 215, 76, -0.02, -0.5, -0.5 + u * Math.PI * 2.05); gg.stroke();
  };
  const shots = [
    // (Part 9's last seconds)
    hatchNight(0, { light: 0.5, cam: { x: 270, y: 215, z: 1.25 }, pin: (p, t, lt) => { clockPin('03:04')(p, t, lt); morseMarks(p, t, MORSE, { x: 270, y: 80, gap: 30, groupGap: 28, letters: [
      { text: 'C', group: 0, at: at('c') }, { text: 'O', group: 1, at: at('o') }, { text: '2', group: 2, at: at('two2') },
    ] }); } }),
    faceShot(at('failed') - 0.1, { who: 'sam', face: 'shock', look: 1, night: 1, cam: [{ t: 0, x: 270, y: 210, z: 1.15 }, { t: 2.2, x: 270, y: 205, z: 1.45 }] }),
    // locker 7
    shot(at('locker') - 0.1, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 5, x: 300, y: 220, z: 1.12 }], (g, t, lt) => {
      interior(g, t, { back: 'wall', night: 0.5 });
      locker(g, 260, 110, { n: '7', open: clamp((t - at('white') + 0.2) / 0.6) });
      stick(g, { t, x: 140, y: 320, s: 1.45, who: 'sam', face: 'scared', look: 1, pose: 'reach' });
    }, { pin: clockPin('03:06') }),
    room(at('open') - 0.1, { back: 'hatch', night: 0.6, people: [{ x: 130, y: 318, s: 1.5, who: 'sam', face: 'worried', look: 1, pose: 'hold' }], props: withCart(), cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 260, y: 215, z: 1.12 }] }),
    paperShot(at('rule') - 0.1, { sheet: { x: 30, y: 22, w: 480, h: 390 }, lines: letter, cam: [{ t: 0, x: 270, y: 200, z: 1.0 }, { t: 3, x: 270, y: 195, z: 1.06 }], props: ring(at('rule') + 0.4) }),
    faceShot(at('only') - 0.1, { who: 'sam', face: 'serious', look: 1, night: 0.6 }),
    // he knocks. Nothing.
    hatchNight(at('knock') - 0.1, { sam: { x: 205, y: 300, s: 1.5, pose: 'push', face: 'worried', floaty: 0.2 }, light: 0.4, kicks: MINE.map((a) => ({ at: a, amp: 4, decay: 12 })), cam: { x: 250, y: 212, z: 1.12 } }),
    hatchNight(at('noanswer') - 0.4, { light: 0.4, cam: [{ t: 0, x: 270, y: 210, z: 1.4 }, { t: 3, x: 270, y: 210, z: 1.55 }] }),
    faceShot(at('mara') - 0.1, { who: 'sam', face: 'worried', look: 1, night: 1 }),
    hatchNight(at('nothing') - 0.1, { light: 0.4, cam: [{ t: 0, x: 270, y: 210, z: 1.55 }, { t: 3, x: 270, y: 210, z: 1.7 }] }),
    // if it's vacuum, it kills them both; if he waits, she dies
    planShot(at('lied') - 0.1, { open: (t) => clamp((t - word('vacuum', 'opening') + 0.3) / 2.0) }),
    splitShot(at('waiting') - 0.1, { sam: { face: 'scared' }, mara: { face: 'sleep', pose: 'tuck', floaty: 0.1 }, cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 330, y: 230, z: 1.3 }] }),
    // the equalization valve
    shot(at('valve') - 0.1, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 8, x: 270, y: 210, z: 1.15 }], (g, t) => valve(g, 270, 200, 70, t, { turn: 0, hiss: 0 })),
    faceShot(at('long') - 0.1, { who: 'sam', face: 'scared', look: 1, night: 0.5 }),
    shot(at('turned') - 0.1, [{ t: 0, x: 270, y: 210, z: 1.15 }, { t: 5, x: 270, y: 205, z: 1.35 }], (g, t) => valve(g, 270, 200, 70, t, {
      turn: easeInOutCubic(clamp((t - TURN + 0.5) / 0.6)) * 0.5,
      hiss: clamp((t - TURN) / 0.2) * (1 - clamp((t - TURN - 1.2) / 0.5)),
    })),
    planShot(at('equal') - 0.1, { leftKpa: false, airRight: (t) => clamp((t - at('equal') - 0.5) / 1.2), rightText: '101 kPa' }),
    faceShot(at('liar') - 0.1, { who: 'sam', face: 'serious', look: 1, night: 0.5 }),
    paperShot(at('rule1') - 0.1, { sheet: { x: 30, y: 22, w: 480, h: 390 }, lines: letter, cam: [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 3.5, x: 200, y: 222, z: 1.4 }], props: ring(at('rule1') + 0.3) }),
    // he spins the wheel; it's stiff; the hatch opens
    hatchNight(SPIN0 - 0.1, {
      sam: { x: 205, y: 300, s: 1.5, pose: 'push', face: 'serious', floaty: 0.2 }, light: 0.5,
      cam: [{ t: 0, x: 255, y: 212, z: 1.1 }, { t: 6, x: 265, y: 210, z: 1.3 }],
      kicks: [SPIN0 + 0.1, word('stiff', 'stiff'), word('days', 'door') - 0.2].map((a) => ({ at: a, amp: 3, decay: 10 })),
      hatch: (t) => ({ ...HATCH, wheel: 1.25 - easeInOutCubic(clamp((t - SPIN0) / (OPEN - SPIN0))) * 1.25 }),
    }),
    shot(OPEN - 0.3, [{ t: 0, x: 270, y: 210, z: 1.15 }, { t: 3, x: 270, y: 207, z: 1.7 }], (g, t, lt) => {
      const open = easeInOutCubic(clamp((t - OPEN) / 1.3));
      interior(g, t, { back: 'hatch', night: 1, hatch: { ...HATCH, open, wheel: 0 } });
    }, { kicks: [{ at: OPEN + 0.1, amp: 5, decay: 8 }] }),
    // dark inside; she isn't moving
    shot(at('dark') - 0.15, null, (g, t, lt) => {
      interior(g, t, { back: 'wall', seed: 9 });
      stick(g, { t, x: 300, y: 270, s: 1.6, who: 'mara', pose: 'tuck', face: 'sleep', floaty: 0.12, dir: -1, blink: false });
      const sx = 300 + 30 * Math.sin(t * 0.6), sy = 210 + 12 * Math.cos(t * 0.5);
      spotlight(g, t < at('moving') ? 140 + (t - at('dark')) * 60 : sx, t < at('moving') ? 180 : sy, 100, 0.93);
    }, { cam: (lt, t) => ({ x: t < at('moving') ? 220 : 300, y: 215, z: t < at('moving') ? 1.0 : 1.35 }), smooth: 0.7 }),
  ];
  return makePart({
    g, overlay, W, H, dpr, part: 10, end: END, shots,
    days: [{ at: at('locker'), text: 'DAY 240' }],
  });
}

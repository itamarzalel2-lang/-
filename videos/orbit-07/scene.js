// Alone in Orbit Ep 01, Part 7 (Days 151-152). Plot: series/alone-in-orbit/story.md
// Opens on Part 6's last lines (a light in Module 3); Mara at the window; ends on her Morse.
import {
  makePart, shot, room, maraRoom, splitShot, faceShot, hatchNight, bagShot, paperShot, morseMarks, clockPin,
  stick, clamp, easeInOutCubic, roundRect, FONTS, INK,
} from '/engine/lib/orbit.js';
import { hullWindow } from '/engine/lib/props2d.js';
import { narration, loadFonts, space, earth } from '/engine/lib/toon.js';

const voice = await (await fetch(new URL('./voice.json', import.meta.url))).json();
const N = narration(voice);
const { at, end, word } = N;
const END = end('final') + 0.4;
const KN = [at('knocks') - 1.25, at('knocks') - 0.85, at('knocks') - 0.45]; // her three knocks
const BACK = [word('back', 'three') + 0.05, word('back', 'three') + 0.35, word('back', 'three') + 0.65]; // his
// her Morse, slow: a soft knock rhythm under "Then Morse..." and the letters
const MORSE_T = Array.from({ length: 26 }, (_, i) => at('morse') + 0.3 + i * 0.33 + (i % 4 === 3 ? 0.25 : 0)).filter((x) => x < at('w1') - 0.1);
const SHAKE = Array.from({ length: 40 }, (_, i) => ({ at: at('inside') + i * 0.12, amp: 1.4, decay: 20 }));

export const config = { canvas: '2d', fps: 30, duration: END };
export const subtitles = { top: 516, maxWords: 1, maxChars: 30, className: 'one' };

export const audio = [
  { type: 'pad', from: 0, to: END, level: 1 },
  { type: 'breath', from: 0, to: end('sunset'), rate: 0.3 },
  { type: 'heartbeat', from: 0, to: end('sunset'), bpm: 104, bpmEnd: 88 },
  { type: 'ambience', from: at('inside'), to: END, level: 0.35 },
  { type: 'knock', at: KN },
  { type: 'knock', at: BACK, gain: 0.8 },
  { type: 'knock', at: MORSE_T, gain: 0.45 },
  { type: 'scribble', from: at('wrote'), to: END - 0.5, gain: 0.6 },
  { type: 'heartbeat', from: at('d152'), to: END, bpm: 62, bpmEnd: 100 },
  { type: 'riser', from: at('w1'), to: END },
  { type: 'boom', at: END - 0.05, gain: 0.6 },
];

export async function setup({ g, overlay, W, H, dpr }) {
  await loadFonts();
  // Mara inside Module 3, seen through the window (window units: the room is drawn at 0.62)
  const maraInside = (t, { face = 'calm', look = 0, pose = 'hold', note = 0, hand = false } = {}) => (gg) => {
    const f = stick(gg, { t, x: 270, y: 290, s: 1.9, who: 'mara', pose: hand ? 'reach' : pose, face, look, floaty: 0.5, dir: 1 });
    if (!hand) {
      // her notebook (or the page she holds up)
      gg.save(); gg.translate(f.handF[0] - 10, f.handF[1] - 30); gg.rotate(-0.08);
      const w = note ? 190 : 70, h = note ? 120 : 52;
      gg.fillStyle = '#fbf6e9'; gg.fillRect(-w / 2, -h / 2, w, h); gg.strokeStyle = INK; gg.lineWidth = 2; gg.strokeRect(-w / 2, -h / 2, w, h);
      if (note) { gg.fillStyle = '#1d1d1d'; gg.font = `700 34px ${FONTS.hand}`; gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.fillText('WHO ARE', 0, -20); gg.fillText('YOU?', 0, 22); }
      else { gg.strokeStyle = '#283063'; gg.lineWidth = 1.5; for (let k = 0; k < 4; k++) { gg.beginPath(); gg.moveTo(-28, -14 + k * 9); gg.lineTo(20, -14 + k * 9); gg.stroke(); } }
      gg.restore();
    }
  };
  const win = (from, cam, opts = {}, extra) => shot(from, cam, (g, t, lt) => {
    hullWindow(g, t, { light: opts.light ? opts.light(t) : 1, inside: opts.inside ? opts.inside(t) : undefined });
    extra?.(g, t, lt);
  });
  const shots = [
    // (Part 6's last seconds)
    win(0, [{ t: 0, x: 270, y: 210, z: 1.05 }, { t: 4, x: 270, y: 208, z: 1.3 }], {
      light: (t) => clamp((t - 0.42) / 0.5),
      inside: (t) => (gg) => {
        if (t < at('shadow')) return;
        const u = clamp((t - at('shadow') - 0.1) / 1.3);
        gg.save(); gg.filter = 'brightness(0) opacity(0.75)';
        stick(gg, { t, x: 130 + u * 260, y: 290, s: 1.8, who: 'mara', pose: 'float', floaty: 0.4, dir: 1 });
        gg.restore();
      },
    }),
    // a woman, writing numbers
    win(at('closer') - 0.1, [{ t: 0, x: 270, y: 208, z: 1.3 }, { t: 3, x: 270, y: 205, z: 1.7 }], { inside: (t) => maraInside(t, { face: 'sleep' }) }),
    win(at('woman') - 0.1, [{ t: 0, x: 270, y: 205, z: 1.8 }, { t: 9, x: 270, y: 200, z: 2.0 }], { inside: (t) => maraInside(t, { face: 'calm', look: 0.5 }) }),
    win(at('looked') - 0.1, [{ t: 0, x: 270, y: 195, z: 2.2 }, { t: 2, x: 270, y: 190, z: 2.5 }], { inside: (t) => maraInside(t, { face: t < at('looked') + 0.6 ? 'calm' : 'shock' }) }),
    // she sees a spacesuit at her window
    shot(at('saw') - 0.1, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 270, y: 205, z: 1.15 }], (g, t) => {
      maraRoom(0, { back: 'window' }).draw(g, t, 0);
      g.save(); g.beginPath(); g.arc(270, 203, 70, 0, 7); g.clip();
      space(g, t); earth(g, 300, 533, 300, t);
      stick(g, { t, x: 270, y: 300, s: 1.6, who: 'sam', pose: 'reach', floaty: 0.3, suit: { visor: 'down', name: 'COLE' } });
      g.restore();
      stick(g, { t, x: 130, y: 330, s: 1.55, who: 'mara', pose: 'shock', face: 'shock', dir: 1, look: 1, floaty: 0.3 });
    }),
    // both frozen, three feet apart
    win(at('froze') - 0.1, [{ t: 0, x: 240, y: 215, z: 1.0 }, { t: 8, x: 240, y: 210, z: 1.08 }], { inside: (t) => maraInside(t, { face: 'shock' }) }, (g, t) => {
      stick(g, { t, x: 70, y: 330, s: 2.2, who: 'sam', pose: 'reach', floaty: 0.2, suit: { visor: 'down', name: 'COLE' } });
    }),
    win(at('hand') - 0.1, [{ t: 0, x: 270, y: 200, z: 1.9 }, { t: 2.5, x: 270, y: 200, z: 2.1 }], { inside: (t) => maraInside(t, { face: 'worried', hand: true }) }),
    // WHO ARE YOU?
    win(at('page') - 0.1, [{ t: 0, x: 270, y: 200, z: 1.7 }, { t: 3, x: 262, y: 168, z: 2.4 }], { inside: (t) => maraInside(t, { face: 'worried', note: t > at('page') + 1.2 ? 1 : 0 }) }),
    // he points at his name
    shot(at('patch') - 0.1, null, (g, t) => {
      space(g, t); earth(g, 270, 1200, 1000, t, { rot: t * 0.01 });
      stick(g, { t, x: 270, y: 330, s: 2.6, who: 'sam', pose: 'hold', floaty: 0.2, suit: { visor: 'down', name: 'COLE' } });
    }, { cam: (lt, t) => ({ x: 270, y: t < at('cole') - 0.4 ? 250 : 238, z: t < at('cole') - 0.4 ? 1.3 : 2.6 }), smooth: 0.6 }),
    win(at('read') - 0.1, [{ t: 0, x: 270, y: 205, z: 2.0 }, { t: 2.5, x: 270, y: 200, z: 2.2 }], { inside: (t) => maraInside(t, { face: 'calm', note: 1 }) }),
    win(at('sunset') - 0.1, [{ t: 0, x: 270, y: 208, z: 1.3 }, { t: 3, x: 270, y: 208, z: 1.2 }], { light: (t) => 1 - clamp((t - word('sunset', 'black') + 0.4) / 0.6), inside: (t) => maraInside(t, { face: 'worried', note: 1 }) }),
    // back inside, shaking
    room(at('inside') - 0.1, { back: 'wall', night: 0.3, kicks: SHAKE, people: [{ x: 250, y: 300, s: 1.5, face: 'scared', look: 1, floaty: 1.4 }], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 260, y: 210, z: 1.12 }] }),
    faceShot(at('real') - 0.1, { who: 'sam', face: 'sad', look: 1, night: 0.3 }),
    hatchNight(at('her') - 0.1, { light: 0.5, cam: { x: 270, y: 215, z: 1.25 }, pin: (p, t) => morseMarks(p, t, ['.', '.', '.', '-', '-', '-', '.', '.', '.'].map((sym, i) => ({ at: at('her') + 0.3 + i * 0.12, sym, group: i === 3 || i === 6 })), { x: 270, y: 92 }) }),
    // day 152, 3 a.m.: she knocks, he knocks back
    bagShot(at('d152') - 0.1, { face: 'worried', look: 1, pin: clockPin('03:00') }),
    hatchNight(KN[0] - 0.25, { light: 0, pin: clockPin('03:00'), kicks: KN.map((a) => ({ at: a, amp: 7, decay: 10 })), cam: { x: 270, y: 206, z: 1.6 } }),
    hatchNight(at('back') - 0.1, { sam: { x: 205, y: 300, s: 1.5, pose: 'push', face: 'worried', floaty: 0.2 }, light: 0.4, pin: clockPin('03:00'), kicks: BACK.map((a) => ({ at: a, amp: 4, decay: 12 })), cam: [{ t: 0, x: 250, y: 215, z: 1.05 }, { t: 3, x: 250, y: 212, z: 1.2 }] }),
    faceShot(at('shook') - 0.1, { who: 'sam', face: 'scared', look: 1, night: 1 }),
    hatchNight(at('silence') - 0.1, { light: 0.35, pin: clockPin('03:01'), cam: [{ t: 0, x: 270, y: 206, z: 1.3 }, { t: 4, x: 270, y: 206, z: 1.5 }] }),
    // Morse through the wall
    splitShot(at('morse') - 0.1, { mara: { pose: 'push' }, sam: { pose: 'float', face: 'shock' }, kicks: MORSE_T.map((a) => ({ at: a, amp: 2, decay: 14 })), cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 270, y: 215, z: 1.06 }] }),
    // the letters, written down
    paperShot(at('wrote') - 0.1, { font: 'hand', size: 56, sheet: { x: 40, y: 20, w: 460, h: 395 }, lh: 64, top: 70, cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 8, x: 270, y: 217, z: 1.05 }], lines: [
      { text: 'T  H  E  Y', at: at('w1') - 0.6, dur: 0.6, y: 110, x: 270, align: 'center', bold: true },
      { text: 'T  O  L  D', at: at('w2') - 0.6, dur: 0.6, y: 174, x: 270, align: 'center', bold: true },
      { text: 'M  E', at: at('w3') - 0.5, dur: 0.4, y: 228, x: 270, align: 'center', bold: true },
      { text: 'YOU WERE DEAD', at: word('final', 'you'), dur: 0.9, y: 350, x: 270, align: 'center', bold: true, size: 50, color: '#b3261e', underline: 2 },
    ] }),
  ];
  return makePart({
    g, overlay, W, H, dpr, part: 7, end: END, shots,
    days: [{ at: at('closer'), text: 'DAY 151' }, { at: at('d152'), text: 'DAY 152' }],
  });
}

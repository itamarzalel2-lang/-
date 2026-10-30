// Alone in Orbit Ep 01, Part 2 (Days 40-61). Plot: series/alone-in-orbit/story.md
// Opens on Part 1's last lines; ends on the knocks spelling three short, three long, three short.
import {
  makePart, room, outside, hatchNight, gaugeShot, bagShot, faceShot, radioShot, paperShot,
  envelopesShot, noteShot, readoutsShot, calendarShot, morseMarks, clockPin, tankKg, waterPct, clamp,
} from '/engine/lib/orbit.js';
import { narration, loadFonts } from '/engine/lib/toon.js';

const voice = await (await fetch(new URL('./voice.json', import.meta.url))).json();
const N = narration(voice);
const { at, end, word } = N;
const END = end('knew') + 0.35;
const knocks = (id) => [0, 1, 2].map((i) => word(id, i) - 0.04);
// the new knocks: Morse, before "Three short. Three long. Three short."
const S0 = end('diff') + 0.3;
const MORSE = [
  ...[0, 0.22, 0.44].map((d) => ({ at: S0 + d, sym: '.' })),
  ...[1.15, 1.75, 2.35].map((d, i) => ({ at: S0 + d, sym: '-', group: i === 0 })),
  ...[3.05, 3.27, 3.49].map((d, i) => ({ at: S0 + d, sym: '.', group: i === 0 })),
];
const morseKicks = MORSE.map((m) => ({ at: m.at, amp: m.sym === '.' ? 3 : 6, decay: 12 }));
const fmt = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(Math.floor(min % 60)).padStart(2, '0')}`;

export const config = { canvas: '2d', fps: 30, duration: END };
export const subtitles = { top: 516, maxWords: 1, maxChars: 30, className: 'one' };

export const audio = [
  { type: 'pad', from: 0, to: END, level: 1 },
  { type: 'ambience', from: 0, to: END, level: 0.35 },
  { type: 'heartbeat', from: 0, to: end('nosleep'), bpm: 92, bpmEnd: 64 },
  { type: 'radio', at: [at('report') - 0.25, word('thermal', 0) - 0.25, at('ground') - 0.25] },
  { type: 'clank', at: word('true2', 'creaks') + 0.1, gain: 0.35 },
  { type: 'knock', at: [...knocks('kk1'), ...knocks('kk2')] },
  { type: 'scribble', from: at('math') + 0.3, to: end('ship') },
  { type: 'rustle', at: at('d60') + 1.0 },
  { type: 'beep', at: [at('nums'), at('nums') + 0.2, at('nums') + 0.4] },
  { type: 'heartbeat', from: at('d61'), to: END, bpm: 58, bpmEnd: 104 },
  ...MORSE.map((m) => ({ type: 'knock', at: m.at, gain: m.sym === '.' ? 0.7 : 1.25 })),
  { type: 'riser', from: at('diff'), to: END },
  { type: 'boom', at: END - 0.05, gain: 0.6 },
];

export async function setup({ g, overlay, W, H, dpr }) {
  await loadFonts();
  const samLight = { x: 130, y: 315, s: 1.35, who: 'sam', pose: 'reach', face: 'scared' };
  const shots = [
    // (Part 1's last seconds)
    hatchNight(0, { sam: samLight, cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 2.2, x: 270, y: 210, z: 1.12 }] }),
    gaugeShot(at('noair') - 0.1),
    // he doesn't move
    hatchNight(at('still') - 0.1, { sam: { ...samLight, pose: 'float', floaty: 0.15 }, cam: [{ t: 0, x: 250, y: 220, z: 1.0 }, { t: 7, x: 260, y: 214, z: 1.15 }] }),
    gaugeShot(at('zero') - 0.1),
    bagShot(at('nosleep') - 0.1, { face: 'worried', look: 1, pin: clockPin((t) => fmt(3 * 60 + 14 + clamp((t - at('nosleep')) / 2.4) * 158)) }),
    // morning: Ground, for once, says more
    radioShot(at('morning') - 0.1, { lit: [[at('report') - 0.25, at('report') + 0.1]], lines: [
      { text: 'D40 ME: KNOCKING FROM MODULE 3', at: at('report'), color: '#ffd166', dur: 1.6 },
    ] }),
    faceShot(at('first') - 0.1, { who: 'sam', face: 'worried', look: 1 }),
    radioShot(at('thermal') - 0.15, { lit: [[at('thermal') - 0.25, end('thermal')]], cam: [{ t: 0, x: 290, y: 200, z: 1.15 }, { t: 3, x: 300, y: 190, z: 1.25 }], lines: [
      { text: 'D40 GROUND: THERMAL EXPANSION.', at: at('thermal'), dur: 1.2 },
      { text: '           IGNORE IT. CONTINUE.', at: word('thermal', 'ignore'), dur: 1.2 },
    ], sam: { x: 105, y: 310, s: 1.35, face: 'serious', look: 1 } }),
    // sun and shadow, every 45 minutes
    outside(at('true1') - 0.1, { sun: 0.7, cam: [{ t: 0, x: 270, y: 200, z: 1.0 }, { t: 4, x: 270, y: 205, z: 1.1 }] }),
    outside(at('true2') - 0.05, {
      sun: (t) => 1 - clamp((t - word('true2', 'shadow') + 0.3) / 0.6),
      shadow: (t) => clamp((t - word('true2', 'shadow') + 0.3) / 0.6),
      cam: [{ t: 0, x: 270, y: 200, z: 1.1 }, { t: 4, x: 270, y: 200, z: 1.2 }],
    }),
    room(word('true2', 'metal') - 0.2, { back: 'hatch', kicks: [{ at: word('true2', 'creaks') + 0.1, amp: 2.5, decay: 6 }], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 270, y: 217, z: 1.06 }] }),
    room(at('but') - 0.1, { back: 'hatch', people: [{ x: 115, y: 322, s: 1.5, face: 'serious', look: 1 }], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 2.6, x: 250, y: 220, z: 1.12 }] }),
    // every night at three
    bagShot(at('d41') - 0.1, { face: 'sleep', pin: clockPin('03:00') }),
    hatchNight(at('kk1') - 0.1, { light: 0, pin: clockPin('03:00'), kicks: knocks('kk1').map((a) => ({ at: a, amp: 7, decay: 10 })), cam: { x: 270, y: 206, z: 1.6 } }),
    bagShot(at('d42') - 0.1, { face: 'worried', look: 1, pin: clockPin('03:00') }),
    hatchNight(at('kk2') - 0.1, { light: 0, pin: clockPin('03:00'), kicks: knocks('kk2').map((a) => ({ at: a, amp: 7, decay: 10 })), cam: { x: 270, y: 206, z: 1.75 } }),
    calendarShot(at('every') - 0.1, { first: 36, upTo: (t) => 40 + clamp((t - at('every')) / 2.4) * 14 }),
    // the oxygen math
    paperShot(at('math') - 0.1, { font: 'hand', size: 26, sheet: { x: 40, y: 20, w: 460, h: 395 }, lh: 40, top: 60, lines: [
      { text: '312 kg  ÷  1.7 kg  =  183 days', at: at('math') + 0.4, dur: 1.6, y: 104 },
      { text: 'Day 3 + 183  =  Day 186', at: word('empty', 'tank'), dur: 1.0, y: 168 },
      { text: 'EMPTY', at: word('empty', 'empty') - 0.1, dur: 0.4, y: 168, x: 380, color: '#b3261e', bold: true, underline: true },
      { text: 'Next ship:  Day 365', at: at('ship') + 0.1, dur: 1.0, y: 336, color: '#b3261e', bold: true, underline: 2 },
    ] }),
    // envelope two
    envelopesShot(at('d60') - 0.1, { n: 2 }),
    noteShot(at('env2') - 0.1, { sign: end('env2') - 0.2, lines: [
      { text: 'If the numbers and Ground', at: at('env2') + 0.05, dur: 1.3 },
      { text: 'ever disagree,', at: word('env2', 'ever'), dur: 0.8 },
      { text: 'trust the numbers.', at: word('env2', 'trust'), dur: 1.0, underline: true },
    ] }),
    readoutsShot(at('nums') - 0.1, { items: [
      { label: 'OXYGEN', value: `${Math.round(tankKg(60))} kg`, at: at('nums') },
      { label: 'WATER', value: `${Math.round(waterPct(60))}%`, at: at('nums') + 0.2 },
      { label: 'POWER', value: '100%', at: at('nums') + 0.4 },
    ] }),
    radioShot(at('ground') - 0.1, { lit: [[at('ground') - 0.25, end('ground')]], lines: [
      { text: 'D60 ME: O2 STILL 2X NORMAL', at: at('ground') - 0.6, color: '#ffd166', dur: 0.5 },
      { text: 'D60 GROUND: COPIES. CONTINUE.', at: at('ground'), dur: 1.2 },
    ], sam: { x: 105, y: 310, s: 1.35, face: 'sad', look: 1 } }),
    // day 61: waiting at the hatch
    hatchNight(at('d61') - 0.1, { sam: { x: 130, y: 318, s: 1.35, pose: 'float', face: 'worried', floaty: 0.4 }, light: 0.55, pin: clockPin((t) => (t < at('three') ? '02:59' : '03:00')), cam: [{ t: 0, x: 260, y: 220, z: 1.0 }, { t: 6, x: 240, y: 230, z: 1.12 }] }),
    faceShot(at('three') + 0.9, { who: 'sam', face: 'worried', look: 1, night: 1 }),
    hatchNight(at('seven') - 0.1, { light: 0.6, pin: clockPin('03:07'), cam: [{ t: 0, x: 270, y: 210, z: 1.3 }, { t: 3, x: 270, y: 208, z: 1.5 }] }),
    faceShot(at('diff') - 0.1, { who: 'sam', face: 'scared', look: 1, night: 1, cam: [{ t: 0, x: 270, y: 210, z: 1.1 }, { t: 2, x: 270, y: 205, z: 1.2 }] }),
    // the Morse knocks
    hatchNight(S0 - 0.25, { light: 0.6, kicks: morseKicks, cam: [{ t: 0, x: 270, y: 215, z: 1.2 }, { t: 6, x: 270, y: 215, z: 1.3 }], pin: (p, t, lt) => { clockPin('03:07')(p, t, lt); morseMarks(p, t, MORSE, { x: 270, y: 92 }); } }),
    faceShot(at('knew') - 0.1, { who: 'sam', face: 'shock', look: 1, night: 1, cam: [{ t: 0, x: 270, y: 210, z: 1.15 }, { t: 2.4, x: 270, y: 205, z: 1.45 }] }),
  ];
  return makePart({
    g, overlay, W, H, dpr, part: 2, end: END, shots,
    days: [{ at: at('still'), text: 'DAY 40' }, { at: at('d41'), text: 'DAY 41' }, { at: at('d42'), text: 'DAY 42' }, { at: at('d60'), text: 'DAY 60' }, { at: at('d61'), text: 'DAY 61' }],
  });
}

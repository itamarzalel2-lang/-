// Alone in Orbit Ep 01, Part 5 (Days 104-151). Plot: series/alone-in-orbit/story.md
// Opens on Part 4's last line (the channel 9 call); ends when the power fails and the lights go out.
import {
  makePart, shot, room, faceShot, radioShot, paperShot, envelopesShot, noteShot, readoutsShot,
  calendarShot, outside, bagShot, stick, clamp, easeInOutCubic, tankKg, waterPct, clockPin, roundRect, FONTS, INK,
} from '/engine/lib/orbit.js';
import { oxygenGen } from '/engine/lib/props2d.js';
import { narration, loadFonts, interior } from '/engine/lib/toon.js';

const voice = await (await fetch(new URL('./voice.json', import.meta.url))).json();
const N = narration(voice);
const { at, end, word } = N;
const END = end('out') + 0.4;
const OUT = word('out', 'out') - 0.05; // the lights go out

export const config = { canvas: '2d', fps: 30, duration: END };
export const subtitles = { top: 516, maxWords: 1, maxChars: 30, className: 'one' };

export const audio = [
  { type: 'pad', from: 0, to: END, level: 1 },
  { type: 'ambience', from: 0, to: OUT, level: 0.35 },
  { type: 'drone', from: 0, to: end('noans') },
  { type: 'radio', at: [0.3, at('cole') - 0.2, at('copy') - 0.25] },
  { type: 'rustle', at: [at('d120') + 1.0, at('d150') + 1.0] },
  { type: 'clank', at: word('panel', 'machine'), gain: 0.3 },
  { type: 'powerup', at: word('on', 'on') },
  { type: 'beep', at: [word('nums', 'oxygen'), word('nums', 'water'), word('nums', 'power')] },
  { type: 'powerdown', at: at('nogen') },
  { type: 'heartbeat', from: at('last'), to: END, bpm: 66, bpmEnd: 104 },
  { type: 'riser', from: at('last'), to: END },
  { type: 'powerdown', at: OUT, d: 0.8 },
  { type: 'boom', at: END - 0.05, gain: 0.6 },
];

export async function setup({ g, overlay, W, H, dpr }) {
  await loadFonts();
  const ch9 = { lamp9: 1, night: 0.35 };
  const genShot = (from, on, cam) => shot(from, cam ?? [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 270, y: 217, z: 1.08 }], (g, t, lt) => {
    g.fillStyle = '#d8d1c3'; g.fillRect(-60, -60, 660, 560);
    g.fillStyle = '#c9c2b2'; g.fillRect(-60, 380, 660, 120);
    oxygenGen(g, 145, 90, t, { on: on(t) });
  });
  const shots = [
    // (Part 4's last seconds)
    radioShot(0, { ...ch9, lit: [[0, end('voice')]], lines: [
      { text: 'CH9: INCOMING', at: -1, color: '#ff7a5c' },
      { text: 'CH9: THIS IS GROUND. OPEN HATCH 3.', at: 0.3, color: '#ff7a5c', dur: 2.3 },
    ], sam: { x: 105, y: 310, s: 1.35, face: 'scared', look: 1 }, cam: [{ t: 0, x: 325, y: 192, z: 1.42 }, { t: 3, x: 335, y: 188, z: 1.5 }] }),
    faceShot(at('noans') - 0.1, { who: 'sam', face: 'serious', look: 1, night: 0.35 }),
    radioShot(at('name') - 0.1, { ...ch9, lit: [[at('cole') - 0.2, end('cole')]], lines: [
      { text: 'CH9: COLE. OPEN HATCH 3.', at: at('cole'), color: '#ff7a5c', dur: 1.8 },
    ], sam: { x: 105, y: 310, s: 1.35, face: 'scared', look: 1 }, cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 4, x: 300, y: 200, z: 1.2 }] }),
    // every day at seven
    calendarShot(at('everyday') - 0.1, { first: 104, upTo: (t) => 104 + clamp((t - at('everyday')) / (end('same') - at('everyday'))) * 14,
      circle: Array.from({ length: 15 }, (_, i) => ({ day: 104 + i, at: at('everyday') + 0.2 + i * ((end('same') - at('everyday')) / 15), label: '19:00' })) }),
    radioShot(at('asked') - 0.1, { lit: [[at('copy') - 0.25, end('copy')]], lines: [
      { text: 'D110 ME: DID YOU CALL ON CH9?', at: word('asked', 'did'), color: '#ffd166', dur: 1.4 },
      { text: 'D110 GROUND: COPIES. CONTINUE.', at: at('copy'), dur: 1.2 },
    ], sam: { x: 105, y: 310, s: 1.35, face: 'serious', look: 1 } }),
    // the manual
    paperShot(at('manual') - 0.1, { sheet: { x: 40, y: 20, w: 460, h: 395 }, ruled: false, cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 6, x: 270, y: 210, z: 1.06 }], lines: [
      { text: 'LARKSPUR STATION MANUAL', at: -1, y: 70, font: `900 20px ${FONTS.display}`, color: '#222' },
      { text: '4.2  COMMUNICATIONS', at: -1, y: 110, font: `700 17px ${FONTS.mono}`, color: '#333' },
      { text: 'CH 4  GROUND LINK', at: -1, y: 150, font: `700 17px ${FONTS.mono}`, color: '#333' },
      { text: 'CH 9  INTERCOM, MODULE TO MODULE', at: word('intercom', 'intercom') - 0.3, dur: 0.01, y: 190, font: `700 17px ${FONTS.mono}`, color: '#b3261e' },
      { text: '      RANGE: INSIDE STATION ONLY', at: word('intercom', 'reach') - 0.2, dur: 0.01, y: 224, font: `700 17px ${FONTS.mono}`, color: '#b3261e', underline: true, ulAt: word('intercom', 'earth') },
    ] }),
    faceShot(at('wired') - 0.1, { who: 'sam', face: 'scared', look: 1 }),
    room(at('knew') - 0.1, { back: 'hatch', people: [{ x: 120, y: 322, s: 1.5, face: 'serious', look: 1 }], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3.5, x: 290, y: 205, z: 1.18 }] }),
    // envelope four: panel 12
    envelopesShot(at('d120') - 0.1, { n: 4 }),
    noteShot(at('env4') - 0.1, { size: 28, lh: 38, top: 54, y0: 118, sign: end('env4') - 0.2, lines: [
      { text: 'Panel 12.', at: at('env4') + 0.05, dur: 0.6 },
      { text: 'The oxygen generator.', at: word('env4', 'the'), dur: 1.0 },
      { text: "You'll need it sooner", at: word('env4', 'youll'), dur: 0.9 },
      { text: 'than they told you.', at: word('env4', 'than'), dur: 0.8, underline: true },
    ] }),
    shot(at('panel') - 0.1, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 270, y: 217, z: 1.06 }], (g, t, lt) => {
      g.fillStyle = '#d8d1c3'; g.fillRect(-60, -60, 660, 560);
      g.fillStyle = '#c9c2b2'; g.fillRect(-60, 380, 660, 120);
      oxygenGen(g, 145, 90, t, { on: 0 });
      // panel 12's cover slides away
      const u = easeInOutCubic(clamp((lt - 0.3) / 1.0));
      g.save(); g.translate(u * 340, 0);
      roundRect(g, 135, 80, 270, 240, 12); g.fillStyle = '#ddd6c8'; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#283063'; g.font = `900 64px ${FONTS.display}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('12', 270, 190);
      g.restore();
    }),
    genShot(at('on') - 0.1, (t) => clamp((t - word('on', 'on')) / 0.4)),
    readoutsShot(at('stop') - 0.1, { items: [
      { label: 'OXYGEN', value: `${Math.round(tankKg(120))} kg`, at: at('stop') },
      { label: 'WATER', value: (t) => `${Math.round(waterPct(120 + Math.floor(clamp((t - word('stop', 'water')) / 2.5) * 8)))}%`, at: word('stop', 'water'), color: '#ffd166' },
      { label: 'POWER', value: '100%', at: word('stop', 'water') + 0.2 },
    ] }),
    faceShot(at('air') - 0.1, { who: 'sam', face: 'worried', look: 1 }),
    // envelope five: suit 2
    envelopesShot(at('d150') - 0.1, { n: 5 }),
    noteShot(at('env5') - 0.1, { sign: end('env5') - 0.2, lines: [
      { text: 'If the power ever fails:', at: at('env5') + 0.05, dur: 1.0 },
      { text: 'suit 2.', at: word('env5', 'suit'), dur: 0.5, underline: true },
      { text: "It's the good one.", at: word('env5', 'its'), dur: 0.8 },
    ] }),
    shot(at('suit') - 0.1, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 300, y: 200, z: 1.15 }], (g, t, lt) => {
      interior(g, t, { back: 'wall' });
      stick(g, { t, x: 330, y: 280, s: 1.6, who: 'sam', pose: 'stand', floaty: 0.05, suit: { visor: 'down', name: '2' } });
      stick(g, { t, x: 120, y: 322, s: 1.5, who: 'sam', face: 'serious', look: 1 });
    }),
    // day 151: power 31%
    bagShot(at('d151') - 0.1, { face: (t) => (t < at('d151') + 1.2 ? 'sleep' : 'calm'), look: 1, pin: clockPin('06:00') }),
    readoutsShot(at('nums') - 0.1, { items: [
      { label: 'OXYGEN', value: '113 kg', at: word('nums', 'oxygen') },
      { label: 'WATER', value: `${Math.round(waterPct(151))}%`, at: word('nums', 'water') },
      { label: 'POWER', value: '31%', at: word('nums', '31') - 0.1, color: '#ff6b5a' },
    ] }),
    outside(at('array') - 0.1, { sun: 0.4, st: { s: 0.95, x: 250, y: 200, arrayJam: 1 }, cam: [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 3, x: 360, y: 190, z: 1.4 }], props: (g, t, lt) => {
      const u = clamp((lt - 0.8) / 0.8);
      if (u <= 0) return;
      g.strokeStyle = '#ff4d3d'; g.lineWidth = 4; g.beginPath(); g.ellipse(415, 200, 58, 112, 0, -1.4, -1.4 + u * Math.PI * 2.05); g.stroke();
    } }),
    genShot(at('nogen') - 0.1, (t) => 1 - clamp((t - at('nogen') - 0.3) / 1.0)),
    paperShot(at('last') - 0.1, { font: 'hand', size: 27, sheet: { x: 40, y: 20, w: 460, h: 395 }, lh: 40, top: 60, lines: [
      { text: 'Day 151.  Generator OFF.', at: -1, y: 100 },
      { text: '113 kg  ÷  1.7 kg  =  66 days', at: at('last') + 0.3, dur: 1.4, y: 160 },
      { text: 'Ship:  214 days away', at: word('last', 'ship') - 0.1, dur: 1.2, y: 330, color: '#b3261e', bold: true, underline: 2 },
    ] }),
    room(at('out') - 0.1, { back: 'wall', night: (t) => (t < OUT ? 0.15 : 1), people: [(t) => ({ x: 230, y: 300, s: 1.45, face: t < OUT ? 'worried' : 'shock', look: 1 })], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 2.5, x: 260, y: 215, z: 1.15 }] }),
  ];
  return makePart({
    g, overlay, W, H, dpr, part: 5, end: END, shots,
    days: [{ at: at('noans'), text: 'DAY 104' }, { at: at('asked'), text: 'DAY 110' }, { at: at('d120'), text: 'DAY 120' }, { at: at('d150'), text: 'DAY 150' }, { at: at('d151'), text: 'DAY 151' }],
  });
}

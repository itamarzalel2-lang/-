// Alone in Orbit Ep 01, Part 4 (Days 88-104). Plot: series/alone-in-orbit/story.md
// Opens on Part 3's last lines (the cut wire); ends on the first call on channel 9.
import {
  makePart, room, hatchNight, gaugeShot, faceShot, radioShot, paperShot, envelopesShot, noteShot,
  calendarShot, clockPin, planShot, cavityShot, clamp, HATCH,
} from '/engine/lib/orbit.js';
import { narration, loadFonts } from '/engine/lib/toon.js';

const voice = await (await fetch(new URL('./voice.json', import.meta.url))).json();
const N = narration(voice);
const { at, end, word } = N;
const END = end('voice') + 0.4;
const LAMP = word('lamp', 'light'); // the channel 9 lamp comes on

export const config = { canvas: '2d', fps: 30, duration: END };
export const subtitles = { top: 516, maxWords: 1, maxChars: 30, className: 'one' };

export const audio = [
  { type: 'pad', from: 0, to: END, level: 1 },
  { type: 'ambience', from: 0, to: END, level: 0.35 },
  { type: 'heartbeat', from: 0, to: end('never') + 1, bpm: 100, bpmEnd: 76 },
  { type: 'radio', at: [at('copy') - 0.25] },
  { type: 'rustle', at: at('d90') + 1.0 },
  { type: 'scribble', from: word('twice', 'underlined'), to: word('twice', 'underlined') + 0.8, gain: 0.6 },
  { type: 'beep', at: [LAMP - 0.05] },
  { type: 'drone', from: LAMP, to: END },
  { type: 'heartbeat', from: LAMP, to: END, bpm: 66, bpmEnd: 108 },
  { type: 'radio', at: [word('click', 'clicked') - 0.1] },
  { type: 'riser', from: at('click'), to: END },
  { type: 'boom', at: END - 0.05, gain: 0.6 },
];

export async function setup({ g, overlay, W, H, dpr }) {
  await loadFonts();
  const letterTop = [
    { text: 'Three rules.', at: -1, y: 84 },
    { text: '1. Never open Hatch 3.', at: -1, y: 130 },
    { text: 'Not for anyone.', at: -1, y: 176, x: 84 },
    { text: 'Not even for me.', at: -1, y: 222, x: 84, underline: true },
    { text: '2. Every morning, check', at: -1, y: 268 },
    { text: 'three numbers:', at: -1, y: 314, x: 84 },
  ];
  const ring = (cx, cy, rx, ry, t0) => (g, t) => {
    const u = clamp((t - t0) / 0.8);
    if (u <= 0) return;
    g.strokeStyle = '#c0261c'; g.lineWidth = 3.5; g.beginPath(); g.ellipse(cx, cy, rx, ry, -0.02, -0.5, -0.5 + u * Math.PI * 2.05); g.stroke();
  };
  const shots = [
    // (Part 3's last seconds)
    cavityShot(0, { reveal: 1, cam: [{ t: 0, x: 330, y: 215, z: 1.5 }, { t: 2.6, x: 355, y: 220, z: 2.0 }, { t: 6.4, x: 365, y: 220, z: 2.6 }] }),
    // so there might be air
    gaugeShot(at('made') - 0.1, { dark: false, cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 230, y: 250, z: 1.7 }] }),
    planShot(at('maybe') - 0.1, { leftKpa: false, rightText: '? kPa' }),
    room(at('alive') - 0.1, { back: 'hatch', night: 0.6, people: [{ x: 200, y: 300, s: 1.5, pose: 'push', face: 'worried', floaty: 0.3 }], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 5, x: 250, y: 215, z: 1.18 }] }),
    // Ground doesn't care
    radioShot(at('report') - 0.1, { lit: [[at('copy') - 0.25, end('copy')]], lines: [
      { text: 'D88 ME: HATCH 3 GAUGE IS FAKE', at: word('report', 'ground') + 0.1, color: '#ffd166', dur: 1.4 },
      { text: 'D88 GROUND: COPIES. CONTINUE.', at: at('copy'), dur: 1.2 },
    ], sam: { x: 105, y: 310, s: 1.35, face: 'serious', look: 1 } }),
    // envelope three, underlined twice
    envelopesShot(at('d90') - 0.1, { n: 3 }),
    noteShot(at('env3') - 0.1, { size: 34, lines: [
      { text: 'Channel 9.', at: at('env3') + 0.05, dur: 0.7 },
      { text: "Don't answer.", at: word('env3', 'dont'), dur: 0.7, underline: 2, ulAt: word('twice', 'underlined') },
      { text: 'Whatever it says.', at: word('env3', 'whatever'), dur: 0.9 },
    ], sign: end('env3') }),
    faceShot(at('why') - 0.1, { who: 'sam', face: 'serious', look: 1 }),
    // what Hale wrote
    paperShot(at('h1') - 0.1, { sheet: { x: 30, y: 22, w: 480, h: 390 }, lines: letterTop, cam: [{ t: 0, x: 270, y: 200, z: 1.0 }, { t: 3, x: 270, y: 195, z: 1.06 }],
      props: ring(250, 123, 215, 34, at('h1') + 0.6) }),
    noteShot(at('h2') - 0.1, { lines: [
      { text: 'If the numbers and Ground', at: -1 },
      { text: 'ever disagree,', at: -1 },
      { text: 'trust the numbers.', at: -1, underline: true },
    ], sign: -1 }),
    faceShot(at('hknew') - 0.1, { who: 'hale', face: 'serious', look: 0.2, cam: [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 5, x: 270, y: 205, z: 1.15 }] }),
    // listening at night
    hatchNight(at('nights') - 0.1, { sam: { x: 190, y: 300, s: 1.5, pose: 'push', face: 'sleep', floaty: 0.2, blink: false }, light: 0.35, pin: clockPin('03:00'), cam: [{ t: 0, x: 255, y: 215, z: 1.05 }, { t: 6, x: 245, y: 210, z: 1.25 }] }),
    // the calendar
    calendarShot(at('d100') - 0.1, { first: 176, upTo: 0, circle: [{ day: 186, at: word('circle', '186'), label: 'O2 = 0' }] }),
    paperShot(at('away') - 0.1, { font: 'hand', size: 28, sheet: { x: 40, y: 20, w: 460, h: 395 }, lh: 40, top: 60, lines: [
      { text: 'Today:  Day 100', at: -1, y: 100 },
      { text: 'O2 runs out:  Day 186   (86 days)', at: at('away') + 0.1, dur: 1.4, y: 160 },
      { text: 'Next ship:  Day 365   (265 days)', at: word('away', 'ship') - 0.2, dur: 1.4, y: 320, color: '#b3261e', bold: true, underline: true },
    ] }),
    // day 104, 19:00: channel 9
    room(at('d104') - 0.1, { back: 'window', night: 0.35, people: [{ x: 240, y: 300, s: 1.45, face: 'calm', look: 1 }], pin: clockPin('19:00'), cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 270, y: 222, z: 1.1 }] }),
    radioShot(at('lamp') - 0.1, { night: 0.35, lamp9: (t) => (t > LAMP ? 0.75 + 0.25 * Math.sin((t - LAMP) * 6) : 0), sam: (t) => ({ x: 105, y: 310, s: 1.35, face: t > LAMP + 0.2 ? 'shock' : 'calm', look: 1 }), pin: clockPin('19:00'),
      cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3.2, x: 330, y: 200, z: 1.25 }] }),
    radioShot(at('ch9') - 0.1, { night: 0.35, lamp9: (t) => 0.75 + 0.25 * Math.sin((t - LAMP) * 6), sam: null, cam: [{ t: 0, x: 300, y: 262, z: 2.2 }, { t: 2, x: 298, y: 258, z: 2.6 }] }),
    faceShot(at('neverused') - 0.1, { who: 'sam', face: 'scared', look: 1, night: 0.35 }),
    radioShot(at('click') - 0.1, { night: 0.35, lamp9: 1, lit: [[word('click', 'clicked'), END]], lines: [
      { text: 'CH9: INCOMING', at: word('click', 'clicked'), color: '#ff7a5c', dur: 0.6 },
      { text: 'CH9: THIS IS GROUND. OPEN HATCH 3.', at: at('voice'), color: '#ff7a5c', dur: 2.3 },
    ], sam: { x: 105, y: 310, s: 1.35, face: 'scared', look: 1 }, cam: [{ t: 0, x: 300, y: 210, z: 1.1 }, { t: 5.5, x: 330, y: 190, z: 1.45 }] }),
  ];
  return makePart({
    g, overlay, W, H, dpr, part: 4, end: END, shots,
    days: [{ at: at('report'), text: 'DAY 88' }, { at: at('d90'), text: 'DAY 90' }, { at: at('d100'), text: 'DAY 100' }, { at: at('d104'), text: 'DAY 104' }],
  });
}

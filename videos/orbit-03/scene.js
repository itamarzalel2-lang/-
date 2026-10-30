// Alone in Orbit Ep 01, Part 3 (Days 61-88). Plot: series/alone-in-orbit/story.md
// Opens on Part 2's last lines (the Morse knocks); ends on the gauge wire going nowhere.
import {
  makePart, room, hatchNight, bagShot, faceShot, paperShot, readoutsShot, calendarShot, morseMarks,
  clockPin, planShot, plateShot, sensorShot, cavityShot, tankKg, waterPct, pose, clamp, HATCH,
} from '/engine/lib/orbit.js';
import { narration, loadFonts } from '/engine/lib/toon.js';

const voice = await (await fetch(new URL('./voice.json', import.meta.url))).json();
const N = narration(voice);
const { at, end, word } = N;
const END = end('never') + 0.35;
// the Morse from Part 2, already all knocked
const MORSE = ['.', '.', '.', '-', '-', '-', '.', '.', '.'].map((sym, i) => ({ at: -1, sym, group: i === 3 || i === 6 }));
const day = (id) => at(id);

export const config = { canvas: '2d', fps: 30, duration: END };
export const subtitles = { top: 516, maxWords: 1, maxChars: 30, className: 'one' };

export const audio = [
  { type: 'pad', from: 0, to: END, level: 1 },
  { type: 'ambience', from: 0, to: END, level: 0.35 },
  { type: 'heartbeat', from: 0, to: end('andme'), bpm: 100, bpmEnd: 70 },
  { type: 'scribble', from: at('wrote') + 0.2, to: end('s2') },
  { type: 'hiss', at: word('vacuum', 'station') - 0.2, d: 2.6 },
  { type: 'clank', at: word('hand', 'wheel'), gain: 0.4 },
  { type: 'knock', at: [at('nine') + 0.1, at('nine') + 0.32, at('nine') + 0.54], gain: 0.5 },
  { type: 'beep', at: [at('tank'), at('tank') + 0.2, at('tank') + 0.4] },
  { type: 'clank', at: [word('screws', 'four'), word('screws', 'screws'), word('screws', 'took'), word('screws', 'off')], gain: 0.22 },
  { type: 'scribble', from: at('follow'), to: end('past'), gain: 0.5 },
  { type: 'heartbeat', from: at('follow'), to: END, bpm: 64, bpmEnd: 104 },
  { type: 'riser', from: at('wall'), to: END },
  { type: 'boom', at: END - 0.05, gain: 0.6 },
];

export async function setup({ g, overlay, W, H, dpr }) {
  await loadFonts();
  const screwT = [word('screws', 'four'), word('screws', 'screws'), word('screws', 'took'), word('screws', 'off')];
  const shots = [
    // (Part 2's last seconds)
    hatchNight(0, { light: 0.6, cam: [{ t: 0, x: 270, y: 215, z: 1.2 }, { t: 6, x: 270, y: 215, z: 1.3 }], pin: (p, t, lt) => { clockPin('03:07')(p, t, lt); morseMarks(p, t, MORSE, { x: 270, y: 92 }); } }),
    faceShot(at('knew') - 0.1, { who: 'sam', face: 'shock', look: 1, night: 1, cam: [{ t: 0, x: 270, y: 210, z: 1.15 }, { t: 2.4, x: 270, y: 205, z: 1.45 }] }),
    // writing it down
    paperShot(at('wrote') - 0.1, { font: 'hand', size: 40, sheet: { x: 40, y: 20, w: 460, h: 395 }, lh: 52, top: 70, ruled: true, cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 9, x: 270, y: 217, z: 1.05 }], lines: [
      { text: '•  •  •', at: at('s1'), dur: 1.0, font: `900 46px Nunito`, y: 112, x: 110 },
      { text: '=  S', at: word('s1', 's'), dur: 0.3, y: 112, x: 350 },
      { text: '—  —  —', at: at('o'), dur: 1.0, font: `900 46px Nunito`, y: 176, x: 110 },
      { text: '=  O', at: word('o', 'o'), dur: 0.3, y: 176, x: 350 },
      { text: '•  •  •', at: at('s2'), dur: 1.0, font: `900 46px Nunito`, y: 228, x: 110 },
      { text: '=  S', at: word('s2', 's'), dur: 0.3, y: 228, x: 350 },
      { text: 'S  O  S', at: at('sosw'), dur: 0.9, y: 360, x: 270, align: 'center', size: 62, bold: true, color: '#b3261e', underline: 2 },
    ] }),
    room(at('help') - 0.1, { back: 'hatch', night: 1, people: [{ x: 160, y: 318, s: 1.45, pose: 'reach', face: 'sad', look: 1, floaty: 0.3 }], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3.8, x: 255, y: 220, z: 1.15 }] }),
    // rule one
    paperShot(at('rule') - 0.1, { sheet: { x: 30, y: 22, w: 480, h: 390 }, cam: [{ t: 0, x: 270, y: 200, z: 1.0 }, { t: 4.6, x: 270, y: 200, z: 1.08 }], lines: [
      { text: 'Three rules.', at: -1, y: 84 },
      { text: '1. Never open Hatch 3.', at: -1, y: 130 },
      { text: 'Not for anyone.', at: -1, y: 176, x: 84 },
      { text: 'Not even for me.', at: -1, y: 222, x: 84, underline: true },
      { text: '2. Every morning, check', at: -1, y: 268 },
      { text: 'three numbers:', at: -1, y: 314, x: 84 },
    ], props: (g, t) => {
      // red ring around rule one while it's read
      const u = clamp((t - at('rule') - 0.4) / 0.8);
      if (u <= 0) return;
      g.strokeStyle = '#c0261c'; g.lineWidth = 3.5; g.beginPath(); g.ellipse(250, 168, 215, 76, -0.02, -0.5, -0.5 + u * Math.PI * 2.05); g.stroke();
    } }),
    // if there's no air behind it
    planShot(at('vacuum') - 0.1, { open: (t) => clamp((t - word('vacuum', 'station') + 0.3) / 2.2) }),
    faceShot(at('andme') - 0.1, { who: 'sam', face: 'scared', look: 1, night: 1 }),
    // hand on the wheel ... let go
    hatchNight(at('hand') - 0.1, {
      sam: (t) => ({ x: 175, y: 300, s: 1.55, face: t < at('letgo') ? 'worried' : 'sad', look: 1, floaty: 0.25,
        pose: pose('reach', 'float', clamp((t - at('letgo') + 0.3) / 0.6)) }),
      light: 0.5, cam: [{ t: 0, x: 240, y: 215, z: 1.15 }, { t: 4, x: 245, y: 212, z: 1.3 }],
    }),
    // nine nights
    calendarShot(at('nine') - 0.1, { first: 57, upTo: (t) => 60 + clamp((t - at('nine') - 0.3) / 2.6) * 9,
      circle: [61, 62, 63, 64, 65, 66, 67, 68, 69].map((d, i) => ({ day: d, at: at('nine') + 0.4 + i * 0.28, label: 'SOS' })) }),
    bagShot(at('trick') - 0.1, { face: 'worried', look: 1, pin: clockPin('03:00') }),
    // the knocks stop
    hatchNight(at('d70') - 0.1, { light: 0, pin: clockPin('03:00'), cam: { x: 270, y: 210, z: 1.35 } }),
    hatchNight(at('d71') - 0.1, { light: 0, pin: clockPin('03:00'), cam: { x: 270, y: 210, z: 1.5 } }),
    hatchNight(at('d72') - 0.1, { light: 0, pin: clockPin('03:00'), cam: { x: 270, y: 210, z: 1.65 } }),
    faceShot(at('stopped') - 0.1, { who: 'sam', face: 'sad', look: 1, night: 1, cam: [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 5, x: 270, y: 205, z: 1.15 }] }),
    // ...but the oxygen keeps falling
    readoutsShot(at('tank') - 0.1, { items: [
      { label: 'OXYGEN', value: (t) => `${Math.round(tankKg(72 + Math.floor(clamp((t - at('tank')) / 3.6) * 6)))} kg`, at: at('tank') },
      { label: 'WATER', value: `${Math.round(waterPct(72))}%`, at: at('tank') + 0.2 },
      { label: 'POWER', value: '100%', at: at('tank') + 0.4 },
    ] }),
    room(at('breathing') - 0.1, { back: 'hatch', hatch: { ...HATCH, gauge: true }, people: [{ x: 120, y: 320, s: 1.5, face: 'serious', look: 1 }], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 280, y: 205, z: 1.15 }] }),
    // day 88: the gauge
    room(at('d88') - 0.1, { back: 'hatch', hatch: { ...HATCH, gauge: true }, people: [{ x: 300, y: 320, s: 1.45, face: 'serious', look: 1, pose: 'reach' }], cam: [{ t: 0, x: 300, y: 200, z: 1.1 }, { t: 5, x: 360, y: 160, z: 1.6 }] }),
    plateShot(at('gauge') - 0.1, { screwsAt: screwT, liftAt: word('screws', 'off') + 0.3 }),
    sensorShot(at('how') - 0.1),
    // following the wire
    cavityShot(at('follow') - 0.1, { reveal: (t) => clamp((t - at('follow') - 0.3) / (end('past') - at('follow') - 0.3)) * 0.92,
      cam: (lt, t) => ({ x: 170 + 200 * clamp((t - at('follow')) / (end('past') - at('follow'))), y: 230, z: 1.35 }), smooth: 0.6 }),
    cavityShot(at('wall') - 0.1, { reveal: 1, cam: [{ t: 0, x: 330, y: 215, z: 1.5 }, { t: 2.2, x: 355, y: 220, z: 2.0 }, { t: 6, x: 365, y: 220, z: 2.6 }] }),
  ];
  return makePart({
    g, overlay, W, H, dpr, part: 3, end: END, shots,
    days: [{ at: at('wrote'), text: 'DAY 61' }, { at: day('d70'), text: 'DAY 70' }, { at: day('d71'), text: 'DAY 71' }, { at: day('d72'), text: 'DAY 72' }, { at: day('d88'), text: 'DAY 88' }],
  });
}

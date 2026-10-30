// Alone in Orbit Ep 01, Part 8 (Days 152-180). Plot: series/alone-in-orbit/story.md
// Opens on Part 7's last line ("They told me you were dead"); Mara's story; ends on the camera's red light.
import {
  makePart, shot, room, maraRoom, splitShot, faceShot, paperShot, envelopesShot, noteShot, calendarShot, planShot,
  morseMarks, clockPin, stick, clamp, easeInOutCubic, FONTS, INK,
} from '/engine/lib/orbit.js';
import { smokeDetector } from '/engine/lib/props2d.js';
import { narration, loadFonts, interior, gauge, capsuleInside, sleepBag, paper, writeText } from '/engine/lib/toon.js';

const voice = await (await fetch(new URL('./voice.json', import.meta.url))).json();
const N = narration(voice);
const { at, end, word } = N;
const END = end('red') + 0.4;
const fmt = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(Math.floor(min % 60)).padStart(2, '0')}`;
const tap = (from, to, step = 0.3) => Array.from({ length: Math.max(0, Math.floor((to - from) / step)) }, (_, i) => from + i * step + (i % 4 === 3 ? 0.12 : 0));
const MORSE1 = tap(at('every') + 0.2, end('hour'), 0.34);
const MORSE2 = tap(at('night') + 0.4, at('camera') + 0.2, 0.22);

export const config = { canvas: '2d', fps: 30, duration: END };
export const subtitles = { top: 516, maxWords: 1, maxChars: 30, className: 'one' };

export const audio = [
  { type: 'pad', from: 0, to: END, level: 1 },
  { type: 'ambience', from: 0, to: END, level: 0.3 },
  { type: 'knock', at: MORSE1, gain: 0.4 },
  { type: 'klaxon', from: word('day1', 'same'), to: end('day1') + 0.3, level: 0.5 },
  { type: 'clank', at: word('gone', 'everyone'), gain: 0.4 },
  { type: 'rustle', at: [at('letter') + 0.2, word('same', 'same') + 0.1, at('d180') + 1.0] },
  { type: 'knock', at: MORSE2, gain: 0.55 },
  { type: 'heartbeat', from: at('look'), to: END, bpm: 70, bpmEnd: 110 },
  { type: 'riser', from: at('look'), to: END },
  { type: 'boom', at: END - 0.05, gain: 0.6 },
];

export async function setup({ g, overlay, W, H, dpr }) {
  await loadFonts();
  const letterLines = [
    { text: 'Three rules.', at: -1, y: 84 },
    { text: '1. Never open Hatch 3.', at: -1, y: 130 },
    { text: 'Not for anyone.', at: -1, y: 176, x: 84 },
    { text: 'Not even for me.', at: -1, y: 222, x: 84, underline: true },
    { text: '2. Every morning, check', at: -1, y: 268 },
    { text: 'three numbers:', at: -1, y: 314, x: 84 },
  ];
  // two copies of the letter, his and hers (hers slides in), with the signature circled
  const twoLetters = (g, t) => {
    g.fillStyle = '#4d4a44'; g.fillRect(-60, -60, 660, 560);
    const slide = easeInOutCubic(clamp((t - word('same', 'same') + 0.1) / 0.8));
    for (const [i, x] of [[0, 30], [1, 290]]) {
      g.save(); g.translate(i ? (1 - slide) * 320 : 0, 0);
      paper(g, x, 30, 230, 370, { rot: i ? 0.02 : -0.02, lh: 34, top: 50 });
      const f = `500 italic 19px ${FONTS.letter}`;
      ['Three rules.', '1. Never open Hatch 3.', '   Not for anyone.', '   Not even for me.', '2. Every morning,', '   check three numbers:', '3. Talk to Ground only', '   on channel 4.', '', '— Hale']
        .forEach((txt, k) => writeText(g, txt, x + 16 + (txt === '— Hale' ? 120 : 0), 76 + k * 32, 1, { font: f, color: '#222a5c' }));
      if (t > at('signed') + 0.2) {
        const u = clamp((t - at('signed') - 0.2) / 0.6);
        g.strokeStyle = '#c0261c'; g.lineWidth = 3; g.beginPath(); g.ellipse(x + 160, 362, 52, 18, 0, -1, -1 + u * Math.PI * 2.05); g.stroke();
      }
      g.restore();
    }
  };
  const shots = [
    // (Part 7's last seconds)
    paperShot(0, { font: 'hand', size: 56, sheet: { x: 40, y: 20, w: 460, h: 395 }, lh: 64, top: 70, cam: { x: 270, y: 217, z: 1.04 }, lines: [
      { text: 'T  H  E  Y', at: -1, y: 110, x: 270, align: 'center', bold: true },
      { text: 'T  O  L  D', at: -1, y: 174, x: 270, align: 'center', bold: true },
      { text: 'M  E', at: -1, y: 228, x: 270, align: 'center', bold: true },
      { text: 'YOU WERE DEAD', at: word('final', 'you'), dur: 0.9, y: 350, x: 270, align: 'center', bold: true, size: 50, color: '#b3261e', underline: 2 },
    ] }),
    // every night, Morse through the hatch
    splitShot(at('every') - 0.1, { kicks: MORSE1.map((a) => ({ at: a, amp: 1.5, decay: 14 })), sam: { face: 'calm' }, mara: { face: 'calm' },
      pin: clockPin((t) => fmt(60 + clamp((t - at('every')) / (end('hour') - at('every'))) * 240)),
      props: (g, t) => morseMarks(g, t, Array.from({ length: 7 }, (_, i) => ({ at: at('every') + 0.4 + i * 0.6, sym: i % 3 === 1 ? '-' : '.' })), { x: 270, y: 70 }) }),
    // Mara Lind, biologist
    maraRoom(at('name') - 0.1, { people: [{ x: 380, y: 300, s: 1.5, who: 'mara', face: 'calm', dir: -1, look: -1 }], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 300, y: 215, z: 1.1 }] }),
    maraRoom(at('plants') - 0.1, { people: [{ x: 420, y: 300, s: 1.5, who: 'mara', pose: 'reach', face: 'calm', dir: -1 }], cam: [{ t: 0, x: 270, y: 250, z: 1.3 }, { t: 4, x: 290, y: 250, z: 1.4 }] }),
    // her day one: the same alarm, the same capsule
    maraRoom(at('day1') - 0.1, { alarm: (t) => (t > word('day1', 'same') ? 1 : 0), people: [(t) => ({ x: 300, y: 300, s: 1.5, who: 'mara', pose: t > word('day1', 'same') ? 'shock' : 'float', face: t > word('day1', 'same') ? 'shock' : 'calm', dir: -1 })], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 4, x: 270, y: 217, z: 1.08 }] }),
    shot(at('capsule') - 0.1, [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 2, x: 270, y: 210, z: 1.0 }, { t: 3.4, x: 380, y: 250, z: 1.55 }], (g, t) => {
      capsuleInside(g, t, { tagPulse: clamp((t - word('capsule', 'red') + 0.2) / 0.3) });
    }),
    maraRoom(at('gone') - 0.1, { back: 'hatch', alarm: 0.6, plantsAt: [700, 700], hatch: (t) => ({ num: '3', open: 1 - easeInOutCubic(clamp((t - at('gone') - 0.2) / 0.8)), wheel: easeInOutCubic(clamp((t - at('gone') - 1.0) / 1.2)) * 1.25 }),
      people: [{ x: 200, y: 272, s: 1.3, who: 'okafor', face: 'serious', pose: 'push', floaty: 0.3 }, { x: 445, y: 310, s: 1.4, who: 'mara', face: 'scared', dir: -1, phase: 2 }],
      cam: [{ t: 0, x: 270, y: 215, z: 1.0 }, { t: 4.2, x: 270, y: 210, z: 1.15 }] }),
    planShot(at('ours') - 0.1, { labels: ['MY SIDE', 'HER SIDE'], redLeft: true, leftKpa: false, rightText: '' }),
    faceShot(at('about') - 0.1, { who: 'sam', face: 'sad', look: 1 }),
    // two gauges, both lying
    shot(at('gauge') - 0.1, [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 5, x: 270, y: 210, z: 1.06 }], (g, t, lt) => {
      g.fillStyle = '#d8d1c3'; g.fillRect(-60, -60, 660, 560);
      gauge(g, 140, 185, 100, 0, { label: 'MY SIDE' }); gauge(g, 400, 185, 100, 0, { label: 'HER SIDE' });
      if (t > word('lying', 'both') + 0.4) {
        const u = clamp((t - word('lying', 'lying') + 0.2) / 0.4);
        g.fillStyle = `rgba(192,38,28,${u})`; g.font = `900 34px ${FONTS.display}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('FAKE', 140, 320); g.fillText('FAKE', 400, 320);
      }
    }),
    // her letter: same words, same hand, signed Hale
    paperShot(at('letter') - 0.1, { sheet: { x: 30, y: 22, w: 480, h: 390 }, lines: letterLines, cam: [{ t: 0, x: 270, y: 200, z: 1.0 }, { t: 5, x: 270, y: 195, z: 1.06 }] }),
    shot(word('same', 'same') - 0.3, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 2.4, x: 270, y: 217, z: 1.0 }, { t: 3.4, x: 300, y: 300, z: 1.35 }], twoLetters),
    faceShot(at('man') - 0.1, { who: 'hale', face: 'serious', look: 0.2 }),
    // thirty nights of knocking
    calendarShot(at('thirty') - 0.1, { first: 40, upTo: 74, circle: Array.from({ length: 30 }, (_, i) => ({ day: 40 + i, at: at('thirty') + 0.1 + i * 0.08 })) }),
    maraRoom(at('crazy') - 0.1, { night: 1, people: [{ x: 300, y: 290, s: 1.5, who: 'mara', pose: 'tuck', face: 'sad', dir: -1 }], pin: clockPin('03:00'), cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 5, x: 290, y: 225, z: 1.15 }] }),
    paperShot(at('numbers') - 0.1, { font: 'hand', size: 28, sheet: { x: 40, y: 20, w: 460, h: 395 }, lh: 40, top: 60, lines: [
      { text: 'MY tank:     −1.7 kg / day', at: at('numbers') + 0.3, dur: 1.0, y: 100 },
      { text: 'HER tank:    −1.7 kg / day', at: word('numbers', 'same') + 0.1, dur: 1.0, y: 160 },
      { text: 'ONE TANK.  TWO PEOPLE.', at: word('numbers', 'tank') + 0.2, dur: 0.9, y: 330, x: 270, align: 'center', color: '#b3261e', bold: true, underline: 2 },
    ] }),
    splitShot(at('ghost') - 0.1, { night: 0.2, sam: { face: 'sad', pose: 'float' }, mara: { face: 'sad', pose: 'float' } }),
    // envelope six
    envelopesShot(at('d180') - 0.1, { n: 6 }),
    noteShot(at('env6') - 0.1, { size: 28, sign: end('env6') - 0.2, lines: [
      { text: "If you've found each other,", at: at('env6') + 0.05, dur: 1.2 },
      { text: "don't say it out loud.", at: word('env6', 'dont'), dur: 1.0 },
      { text: "They're watching.", at: word('env6', 'theyre'), dur: 0.8, underline: 2, color: '#b3261e' },
    ] }),
    faceShot(at('they') - 0.1, { who: 'sam', face: 'scared', look: 1 }),
    // that night: her message
    splitShot(at('night') - 0.1, { kicks: MORSE2.map((a) => ({ at: a, amp: 2, decay: 14 })), sam: { face: 'worried' }, mara: { face: 'scared' }, pin: clockPin('03:00') }),
    paperShot(at('camera') - 0.1, { font: 'hand', size: 50, sheet: { x: 40, y: 20, w: 460, h: 395 }, lh: 64, top: 70, lines: [
      { text: 'THERE IS A', at: at('camera'), dur: 0.5, y: 110, x: 270, align: 'center', bold: true },
      { text: 'CAMERA', at: word('camera', 'camera') - 0.05, dur: 0.4, y: 178, x: 270, align: 'center', bold: true, color: '#b3261e' },
      { text: 'IN MY ROOM', at: word('camera', 'in'), dur: 0.5, y: 236, x: 270, align: 'center', bold: true },
    ] }),
    // the smoke detector over his bunk
    shot(at('look') - 0.1, [{ t: 0, x: 170, y: 180, z: 1.2 }, { t: 1.4, x: 170, y: 180, z: 1.2 }, { t: 2.9, x: 205, y: 50, z: 2.0 }], (g, t) => {
      interior(g, t, { back: 'wall', night: 0.7 });
      smokeDetector(g, 205, 40, 18, t, { led: 1, lens: 0 });
      sleepBag(g, 120, 140, 1.15, t, { face: 'worried', look: 0.6 });
    }),
    shot(at('red') - 0.15, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 2.2, x: 300, y: 250, z: 1.5 }], (g, t) => {
      g.fillStyle = '#c4bdad'; g.fillRect(-60, -60, 660, 560);
      g.fillStyle = 'rgba(8,12,34,0.45)'; g.fillRect(-60, -60, 660, 560);
      smokeDetector(g, 270, 200, 150, t, { led: 1, lens: clamp((t - at('red') - 0.3) / 0.6) });
    }),
  ];
  return makePart({
    g, overlay, W, H, dpr, part: 8, end: END, shots,
    days: [{ at: at('every'), text: 'DAY 153' }, { at: at('d180'), text: 'DAY 180' }],
  });
}

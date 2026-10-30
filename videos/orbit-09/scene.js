// Alone in Orbit Ep 01, Part 9 (Days 180-240). Plot: series/alone-in-orbit/story.md
// Opens on Part 8's last lines (the red light); they're watched; ends on Mara's "C. O. 2."
import {
  makePart, shot, room, maraRoom, splitShot, faceShot, hatchNight, radioShot, paperShot, envelopesShot, noteShot,
  morseMarks, clockPin, stick, clamp, roundRect, FONTS, INK,
} from '/engine/lib/orbit.js';
import { smokeDetector, locker } from '/engine/lib/props2d.js';
import { narration, loadFonts, interior, sleepBag } from '/engine/lib/toon.js';
import { hash01 } from '/engine/lib/util.js';

const voice = await (await fetch(new URL('./voice.json', import.meta.url))).json();
const N = narration(voice);
const { at, end, word } = N;
const END = end('failed') + 0.4;
const MORSE = { c: '-.-.', o: '---', two2: '..---' };
// her last letters: slow, weak knocks in the pause before each letter is said
const SLOW = Object.entries(MORSE).flatMap(([id, code]) => [...code].map((sym, i) => ({ at: at(id) - 1.0 + i * (0.95 / code.length), sym })));
const TAPS = Array.from({ length: 18 }, (_, i) => at('night') + 0.3 + i * 0.27);

export const config = { canvas: '2d', fps: 30, duration: END };
export const subtitles = { top: 516, maxWords: 1, maxChars: 30, className: 'one' };

export const audio = [
  { type: 'pad', from: 0, to: END, level: 1 },
  { type: 'ambience', from: 0, to: END, level: 0.3 },
  { type: 'heartbeat', from: 0, to: end('red') + 1, bpm: 104, bpmEnd: 80 },
  { type: 'knock', at: TAPS.filter((x) => x < end('creak')), gain: 0.35 },
  { type: 'radio', at: [at('voice') - 0.2] },
  { type: 'rustle', at: [at('d210') + 1.0, at('d240') + 1.0] },
  { type: 'clank', at: word('two', 'two') - 0.2, gain: 0.3 },
  { type: 'knock', at: SLOW.map((s) => s.at), gain: 0.3 },
  { type: 'heartbeat', from: at('night2'), to: END, bpm: 60, bpmEnd: 104 },
  { type: 'riser', from: at('night2'), to: END },
  { type: 'boom', at: END - 0.05, gain: 0.6 },
];

export async function setup({ g, overlay, W, H, dpr }) {
  await loadFonts();
  // a blinking REC tag, as if we were seeing the company's feed
  const rec = (label) => (p, t) => {
    roundRect(p, 372, 12, 156, 30, 6); p.fillStyle = 'rgba(0,0,0,0.65)'; p.fill();
    if (Math.sin(t * 5) > -0.3) { p.fillStyle = '#ff3b30'; p.beginPath(); p.arc(388, 27, 6, 0, 7); p.fill(); }
    p.fillStyle = '#fff'; p.font = `700 14px ${FONTS.mono}`; p.textAlign = 'left'; p.textBaseline = 'middle'; p.fillText(label, 402, 28);
  };
  const feed = (g) => {
    // night-vision camera look: green, grainy, scanlines
    g.save(); g.globalCompositeOperation = 'color'; g.fillStyle = 'rgba(60,255,120,0.75)'; g.fillRect(-60, -60, 660, 560); g.restore();
    g.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = -60; y < 500; y += 4) g.fillRect(-60, y, 660, 2);
  };
  const shots = [
    // (Part 8's last seconds)
    shot(0, [{ t: 0, x: 170, y: 180, z: 1.2 }, { t: 0.9, x: 170, y: 180, z: 1.2 }, { t: 2.4, x: 205, y: 50, z: 2.0 }], (g, t) => {
      interior(g, t, { back: 'wall', night: 0.7 });
      smokeDetector(g, 205, 40, 18, t, { led: 1, lens: 0 });
      sleepBag(g, 120, 140, 1.15, t, { face: 'worried', look: 0.6 });
    }),
    shot(at('red') - 0.15, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 2.2, x: 300, y: 250, z: 1.5 }], (g, t) => {
      g.fillStyle = '#c4bdad'; g.fillRect(-60, -60, 660, 560);
      g.fillStyle = 'rgba(8,12,34,0.45)'; g.fillRect(-60, -60, 660, 560);
      smokeDetector(g, 270, 200, 150, t, { led: 1, lens: clamp((t - at('red') - 0.3) / 0.6) });
    }),
    // watched: the company's view of Sam
    shot(at('watched') - 0.1, [{ t: 0, x: 270, y: 217, z: 1.25 }, { t: 5, x: 270, y: 217, z: 1.0 }], (g, t) => {
      interior(g, t, { back: 'wall' });
      stick(g, { t, x: 260, y: 300, s: 1.4, who: 'sam', face: 'worried', look: -1 });
    }, { pin: rec('CAM A  DAY 180') }),
    shot(at('act') - 0.1, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 6, x: 270, y: 217, z: 1.05 }], (g, t) => {
      interior(g, t, { back: 'window' });
      stick(g, { t, x: 230, y: 300, s: 1.45, who: 'sam', face: 'calm', pose: 'hold', look: 1 });
    }, { pin: rec('CAM A  DAY 190') }),
    maraRoom(at('ate') - 0.1, { people: [{ x: 360, y: 300, s: 1.45, who: 'mara', face: 'calm', dir: -1, pose: 'hold' }], pin: rec('CAM B  DAY 195'), cam: { x: 270, y: 217, z: 1.0 } }),
    // at night, in Morse
    splitShot(at('night') - 0.1, { kicks: TAPS.map((a) => ({ at: a, amp: 1.5, decay: 14 })), sam: { face: 'calm' }, mara: { face: 'calm' }, pin: clockPin('03:00'),
      props: (g, t) => morseMarks(g, t, Array.from({ length: 7 }, (_, i) => ({ at: at('night') + 0.4 + i * 0.4, sym: i % 3 === 1 ? '-' : '.' })), { x: 270, y: 70 }) }),
    shot(at('creak') - 0.1, [{ t: 0, x: 270, y: 210, z: 1.15 }, { t: 3, x: 270, y: 210, z: 1.25 }], (g, t) => {
      interior(g, t, { back: 'hatch', night: 0.8 });
      feed(g);
    }, { pin: rec('CAM A  03:12:44'), kicks: TAPS.filter((x) => x > at('creak')).map((a) => ({ at: a, amp: 1, decay: 14 })) }),
    // channel 9 again: a test
    radioShot(at('ch9') - 0.1, { lamp9: 1, night: 0.35, lit: [[at('voice') - 0.2, end('voice')]], lines: [
      { text: 'CH9: INCOMING', at: at('ch9') + 0.2, color: '#ff7a5c', dur: 0.6 },
      { text: 'CH9: THIS IS GROUND. OPEN HATCH 3.', at: at('voice'), color: '#ff7a5c', dur: 2.2 },
    ], sam: { x: 105, y: 310, s: 1.35, face: 'serious', look: 1 }, pin: clockPin('19:00') }),
    faceShot(at('test') - 0.1, { who: 'sam', face: 'serious', look: 1 }),
    splitShot(at('nothing') - 0.1, { night: 0, sam: { pose: 'stand', face: 'serious', floaty: 0.2 }, mara: { pose: 'stand', face: 'serious', floaty: 0.2 }, cam: { x: 270, y: 217, z: 1.0 } }),
    // envelope seven: two cartridges
    envelopesShot(at('d210') - 0.1, { n: 7 }),
    noteShot(at('env7') - 0.1, { size: 28, sign: end('env7') - 0.2, lines: [
      { text: 'Locker 7.', at: at('env7') + 0.05, dur: 0.6 },
      { text: 'Two spare scrubber cartridges.', at: word('env7', 'two'), dur: 1.4 },
      { text: "You'll know who needs them.", at: word('env7', 'youll'), dur: 1.2, underline: true },
    ] }),
    shot(at('two') - 0.1, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 300, y: 220, z: 1.12 }], (g, t, lt) => {
      interior(g, t, { back: 'wall' });
      locker(g, 260, 110, { n: '7', open: clamp((lt - 0.3) / 0.8) });
      stick(g, { t, x: 140, y: 320, s: 1.45, who: 'sam', face: 'serious', look: 1, pose: 'reach' });
    }),
    faceShot(at('knewtwo') - 0.1, { who: 'hale', face: 'serious', look: 0.2 }),
    // her knocks get slower
    splitShot(at('slow') - 0.1, { sam: { face: 'worried' }, mara: { face: 'sad', pose: 'tuck', floaty: 0.15 }, pin: clockPin('03:00'),
      props: (g, t) => morseMarks(g, t, Array.from({ length: 4 }, (_, i) => ({ at: at('slow') + 0.8 + i * 1.1, sym: '.' })), { x: 270, y: 70 }) }),
    paperShot(at('mistakes') - 0.1, { font: 'hand', size: 50, sheet: { x: 40, y: 20, w: 460, h: 395 }, lh: 64, top: 70, lines: [
      { text: 'H L E L O', at: at('mistakes') + 0.2, dur: 0.8, y: 120, x: 270, align: 'center', bold: true },
      { text: 'S M A R', at: word('mistakes', 'letters') - 0.2, dur: 0.6, y: 200, x: 270, align: 'center', bold: true },
    ], props: (g, t) => {
      for (const [y, t0] of [[106, at('mistakes') + 1.2], [186, word('mistakes', 'letters') + 0.6]]) {
        const u = clamp((t - t0) / 0.3); if (u <= 0) continue;
        g.strokeStyle = '#b3261e'; g.lineWidth = 4; g.beginPath(); g.moveTo(150, y); g.lineTo(150 + 240 * u, y - 8); g.stroke();
      }
    } }),
    // what a scrubber does
    shot(at('scrubber') - 0.1, null, (g, t, lt) => {
      g.fillStyle = '#0e2a4a'; g.fillRect(-60, -60, 660, 560);
      g.strokeStyle = 'rgba(140,190,255,0.18)'; g.lineWidth = 1;
      for (let x = 0; x < 540; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 434); g.stroke(); }
      roundRect(g, 200, 120, 140, 110, 12); g.fillStyle = '#16365c'; g.fill(); g.strokeStyle = '#d6e8ff'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#e8f2ff'; g.font = `900 18px ${FONTS.display}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SCRUBBER', 270, 175);
      const fail = clamp((t - word('scrubber', 'fails') + 0.2) / 0.6);
      for (let i = 0; i < 40; i++) {
        const ph = (t * 0.35 + hash01(i, 1)) % 1, y = 140 + hash01(i, 2) * 70, x = 20 + ph * 500;
        const co2 = hash01(i, 3) < 0.35;
        if (co2 && x > 200 && x < 340 && fail < 0.5) continue; // caught by the scrubber
        if (co2 && x > 340 && fail < 0.5) continue;
        g.fillStyle = co2 ? '#ff6b5a' : 'rgba(160,215,255,0.85)'; g.beginPath(); g.arc(x, y, co2 ? 4.5 : 3, 0, 7); g.fill();
      }
      g.fillStyle = '#ff6b5a'; g.font = `800 18px ${FONTS.mono}`; g.fillText(fail > 0.5 ? 'CO2 BUILDS UP' : 'CO2 REMOVED', 270, 330);
      if (fail > 0) { g.strokeStyle = `rgba(255,80,60,${fail})`; g.lineWidth = 6; g.beginPath(); g.moveTo(210, 130); g.lineTo(330, 220); g.moveTo(330, 130); g.lineTo(210, 220); g.stroke(); }
    }),
    maraRoom(at('symptoms') - 0.1, { night: 0.6, people: [{ x: 300, y: 300, s: 1.5, who: 'mara', pose: 'tuck', face: 'sad', dir: -1, floaty: 0.3 }], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 4, x: 290, y: 225, z: 1.15 }] }),
    hatchNight(at('door') - 0.1, { sam: { x: 205, y: 300, s: 1.5, pose: 'push', face: 'sad', floaty: 0.2 }, light: 0.4, cam: [{ t: 0, x: 250, y: 215, z: 1.0 }, { t: 4, x: 250, y: 212, z: 1.15 }] }),
    // envelope eight
    envelopesShot(at('d240') - 0.1, { n: 8 }),
    noteShot(at('env8') - 0.1, { size: 28, lh: 38, top: 54, y0: 118, sign: end('env8') - 0.2, lines: [
      { text: 'By now you know', at: at('env8') + 0.05, dur: 0.8 },
      { text: "you're not alone.", at: word('env8', 'youre'), dur: 0.8, underline: true },
      { text: "I'm sorry.", at: word('env8', 'im'), dur: 0.6 },
      { text: "I couldn't stop it.", at: word('env8', 'couldnt') - 0.2, dur: 0.9 },
    ] }),
    // C. O. 2.
    splitShot(at('night2') - 0.1, { sam: { face: 'scared' }, mara: { face: 'sleep', pose: 'tuck', floaty: 0.1 }, pin: clockPin('03:00') }),
    hatchNight(at('c') - 1.15, { light: 0.5, cam: { x: 270, y: 215, z: 1.25 }, kicks: SLOW.map((s) => ({ at: s.at, amp: 2, decay: 14 })),
      pin: (p, t, lt) => { clockPin('03:04')(p, t, lt); morseMarks(p, t, SLOW.map((s, i) => ({ ...s, group: i === 4 || i === 7 })), { x: 270, y: 80, gap: 30, groupGap: 28, letters: [
        { text: 'C', group: 0, at: at('c') }, { text: 'O', group: 1, at: at('o') }, { text: '2', group: 2, at: at('two2') },
      ] }); } }),
    faceShot(at('failed') - 0.1, { who: 'sam', face: 'shock', look: 1, night: 1, cam: [{ t: 0, x: 270, y: 210, z: 1.15 }, { t: 2.2, x: 270, y: 205, z: 1.45 }] }),
  ];
  return makePart({
    g, overlay, W, H, dpr, part: 9, end: END, shots,
    days: [{ at: at('watched'), text: 'DAY 180' }, { at: at('d210'), text: 'DAY 210' }, { at: at('slow'), text: 'DAY 220' }, { at: at('d240'), text: 'DAY 240' }],
  });
}

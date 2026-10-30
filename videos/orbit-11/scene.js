// Alone in Orbit Ep 01, Part 11 (Days 240-260). Plot: series/alone-in-orbit/story.md
// Opens on Part 10's last lines (she isn't moving); she wakes; Project SOLO; ends: no one is coming.
import {
  makePart, shot, room, maraRoom, faceShot, clockPin, stick, headOnly, clamp, easeInOutCubic, roundRect, FONTS, INK,
} from '/engine/lib/orbit.js';
import { smokeDetector } from '/engine/lib/props2d.js';
import { narration, loadFonts, interior, spotlight, screen, paper, writeText } from '/engine/lib/toon.js';

const voice = await (await fetch(new URL('./voice.json', import.meta.url))).json();
const N = narration(voice);
const { at, end, word } = N;
const END = end('noone') + 0.4;
const fmt = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(Math.floor(min % 60)).padStart(2, '0')}`;
const AWAKE = word('eyes', 'opened');

export const config = { canvas: '2d', fps: 30, duration: END };
export const subtitles = { top: 516, maxWords: 1, maxChars: 30, className: 'one' };

export const audio = [
  { type: 'pad', from: 0, to: END, level: 1 },
  { type: 'ambience', from: 0, to: END, level: 0.3 },
  { type: 'heartbeat', from: 0, to: at('breath'), bpm: 112, bpmEnd: 90 },
  { type: 'clank', at: word('cartridge', 'pushed'), gain: 0.3 },
  { type: 'hiss', at: at('breath') + 0.1, d: 1.2, gain: 0.5 },
  { type: 'clank', at: at('cables') + 0.4, gain: 0.3 },
  { type: 'beep', at: [at('solo'), word('solo', 'subject'), at('calls'), at('new') + 0.6, at('then') + 0.5] },
  { type: 'heartbeat', from: at('new'), to: END, bpm: 70, bpmEnd: 104 },
  { type: 'riser', from: at('then'), to: END },
  { type: 'boom', at: END - 0.05, gain: 0.6 },
];

export async function setup({ g, overlay, W, H, dpr }) {
  await loadFonts();
  // the recorder behind the panel: lines typed onto its screen
  const recorder = (from, lines, cam) => shot(from, cam ?? [{ t: 0, x: 270, y: 200, z: 1.0 }, { t: 6, x: 270, y: 195, z: 1.06 }], (g, t) => {
    g.fillStyle = '#1a1c20'; g.fillRect(-60, -60, 660, 560);
    screen(g, 40, 34, 460, 330, lines.filter((l) => t >= l.at).map((l) => ({ text: l.text, color: l.color, u: clamp((t - l.at) / (l.dur ?? 0.8)) })), { size: 21, lh: 38, pad: 22, bezel: '#2b2e34' });
  });
  const solo = [
    { text: 'PROJECT SOLO', at: at('solo'), color: '#ffffff', dur: 0.6 },
    { text: 'SUBJECT A: COLE', at: word('solo', 'subject'), dur: 0.8 },
    { text: 'SUBJECT B: LIND', at: word('solo', 'subject') + 1.3, dur: 0.8 },
    { text: 'CH9 CALLS:  136', at: at('calls'), dur: 0.7 },
    { text: 'ANSWERED:     0', at: word('calls', 'answered'), dur: 0.6 },
  ];
  const shots = [
    // (Part 10's last seconds)
    shot(0, null, (g, t) => {
      interior(g, t, { back: 'wall', seed: 9 });
      stick(g, { t, x: 300, y: 270, s: 1.6, who: 'mara', pose: 'tuck', face: 'sleep', floaty: 0.12, dir: -1, blink: false });
      const sx = 300 + 30 * Math.sin(t * 0.6), sy = 210 + 12 * Math.cos(t * 0.5);
      spotlight(g, t < at('moving') ? 140 + (t - at('dark') + 0.3) * 60 : sx, t < at('moving') ? 180 : sy, 100, 0.93);
    }, { cam: (lt, t) => ({ x: t < at('moving') ? 220 : 300, y: 215, z: t < at('moving') ? 1.0 : 1.35 }), smooth: 0.7 }),
    // he pulls her through, into clean air
    room(at('pulled') - 0.1, { back: 'hatch', hatch: { num: '3', open: 1, wheel: 0 }, night: 0.3, people: [
      (t) => ({ x: 170 + 40 * clamp((t - at('pulled')) / 3), y: 300, s: 1.45, who: 'sam', pose: 'reach', face: 'worried', dir: -1, look: -1 }),
      (t) => ({ x: 290 - 40 * clamp((t - at('pulled')) / 3), y: 250, s: 1.4, who: 'mara', pose: 'tuck', face: 'sleep', floaty: 0.15, blink: false }),
    ], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 5, x: 240, y: 215, z: 1.12 }] }),
    faceShot(at('cartridge') - 0.1, { who: 'mara', face: 'sleep', look: 0, night: 0.3 }),
    shot(at('blue') - 0.1, [{ t: 0, x: 270, y: 210, z: 1.1 }, { t: 3, x: 270, y: 225, z: 1.3 }], (g, t) => {
      interior(g, t, { back: 'hatch', night: 0.3 });
      g.fillStyle = 'rgba(20,20,30,0.35)'; g.fillRect(-400, -400, 1400, 1300);
      headOnly(g, { x: 270, y: 215, s: 5.4, who: 'mara', face: 'sleep', t, blink: false });
      g.fillStyle = 'rgba(80,120,220,0.35)'; g.beginPath(); g.ellipse(270, 270, 26, 14, 0, 0, 7); g.fill(); // blue lips
    }),
    room(at('minutes') - 0.1, { back: 'wall', night: 0.3, pin: clockPin((t) => fmt(3 * 60 + 12 + clamp((t - at('minutes')) / 2.6) * 5)), people: [
      { x: 330, y: 260, s: 1.4, who: 'mara', pose: 'tuck', face: 'sleep', floaty: 0.15, blink: false, dir: -1 },
      { x: 180, y: 310, s: 1.45, who: 'sam', pose: 'hold', face: 'worried', look: 1 },
    ], cam: { x: 260, y: 220, z: 1.1 } }),
    faceShot(at('talking') - 0.1, { who: 'sam', face: 'worried', look: 1, night: 0.3 }),
    // she breathes, opens her eyes
    faceShot(at('breath') - 0.1, { who: 'mara', face: (t) => (t < AWAKE ? 'sleep' : 'calm'), look: -0.5, night: 0.3, cam: [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 12, x: 270, y: 205, z: 1.2 }] }),
    room(at('real') - 0.1, { back: 'wall', night: 0.2, people: [
      { x: 330, y: 270, s: 1.6, who: 'mara', pose: 'float', face: 'calm', dir: -1, look: -1 },
      (t) => ({ x: 200, y: 290, s: 1.6, who: 'sam', pose: 'float', face: t > at('laughed') ? 'calm' : 'shock', look: 1 }),
    ], kicks: Array.from({ length: 6 }, (_, i) => ({ at: at('laughed') + 0.2 + i * 0.3, amp: 1.2, decay: 12 })), cam: [{ t: 0, x: 265, y: 190, z: 1.4 }, { t: 5, x: 265, y: 195, z: 1.25 }] }),
    // her half: a mirror of his
    maraRoom(at('mirror') - 0.1, { people: [{ x: 300, y: 300, s: 1.4, who: 'mara', face: 'calm', dir: -1 }, { x: 160, y: 310, s: 1.4, who: 'sam', face: 'serious', look: 1 }], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 5, x: 270, y: 210, z: 1.08 }],
      props: (g, t) => { paper(g, 420, 80, 70, 90, { lines: true, lh: 12, top: 16 }); } }),
    shot(at('light') - 0.1, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 2.5, x: 300, y: 250, z: 1.5 }], (g, t) => {
      g.fillStyle = '#bcc5c9'; g.fillRect(-60, -60, 660, 560);
      g.fillStyle = 'rgba(8,12,34,0.3)'; g.fillRect(-60, -60, 660, 560);
      smokeDetector(g, 270, 200, 150, t, { led: 1, lens: 1 });
    }),
    // the cables lead to a box with a screen
    shot(at('cables') - 0.1, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 4, x: 330, y: 210, z: 1.3 }], (g, t, lt) => {
      interior(g, t, { back: 'wall', seed: 9 });
      roundRect(g, 250, 110, 230, 180, 10); g.fillStyle = '#2b2925'; g.fill(); g.strokeStyle = '#7a756b'; g.lineWidth = 4; g.stroke();
      g.strokeStyle = '#2a2a2a'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(170, -40); g.bezierCurveTo(200, 60, 240, 90, 300, 160); g.stroke();
      roundRect(g, 290, 140, 160, 110, 6); g.fillStyle = '#111'; g.fill();
      g.fillStyle = `rgba(125,255,154,${0.5 + 0.5 * Math.sin(t * 4)})`; g.fillRect(304, 156, 60, 6);
      g.fillStyle = '#ff3b30'; g.beginPath(); g.arc(436, 236, 5, 0, 7); g.fill();
      stick(g, { t, x: 140, y: 320, s: 1.4, who: 'sam', face: 'serious', look: 1, pose: 'reach' });
    }),
    recorder(at('solo') - 0.1, solo),
    room(at('study') - 0.1, { back: 'wall', night: 0.5, people: [
      { x: 200, y: 300, s: 1.5, who: 'sam', face: 'serious', look: 1 }, { x: 340, y: 300, s: 1.5, who: 'mara', face: 'sad', dir: -1, look: -1 },
    ], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 6, x: 270, y: 205, z: 1.15 }] }),
    faceShot(at('watching') - 0.1, { who: 'mara', face: 'sad', look: -0.5, night: 0.3 }),
    // new lines appear
    recorder(at('new') - 0.1, [
      { text: 'PROJECT SOLO', at: -1, color: '#ffffff' },
      { text: 'D240: PROTOCOL BREACH', at: at('new') + 0.6, color: '#ffd166', dur: 0.9 },
      { text: 'STUDY COMPROMISED.', at: at('cancel'), color: '#ff6b5a', dur: 0.9 },
      { text: 'CANCEL RETURN FLIGHT.', at: word('cancel', 'cancel'), color: '#ff6b5a', dur: 0.9 },
    ], { x: 270, y: 200, z: 1.0 }),
    room(at('noone') - 0.1, { back: 'window', night: 0.4, people: [
      { x: 210, y: 300, s: 1.5, who: 'sam', face: 'sad', look: 1 }, { x: 330, y: 300, s: 1.5, who: 'mara', face: 'sad', dir: -1, look: -1 },
    ], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 2.5, x: 270, y: 210, z: 1.12 }] }),
  ];
  return makePart({
    g, overlay, W, H, dpr, part: 11, end: END, shots,
    days: [{ at: at('pulled'), text: 'DAY 240' }, { at: at('mirror'), text: 'DAY 245' }],
  });
}

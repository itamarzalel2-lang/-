// Alone in Orbit Ep 01, Part 6 (Day 151). Plot: series/alone-in-orbit/story.md
// Opens on Part 5's last line (the lights go out); the spacewalk; ends on the light in Module 3.
import {
  makePart, shot, room, faceShot, readoutsShot, outside, stick, clamp, easeInOutCubic, clockPin, waterPct, HATCH,
} from '/engine/lib/orbit.js';
import { trussClose, arrayJoint, hullWindow } from '/engine/lib/props2d.js';
import { narration, loadFonts, interior, space, earth, hatchDoor, beam } from '/engine/lib/toon.js';

const voice = await (await fetch(new URL('./voice.json', import.meta.url))).json();
const N = narration(voice);
const { at, end, word } = N;
const END = end('shadow') + 0.4;
const OUT = word('out', 'out') - 0.05;
const fmt = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(Math.floor(min % 60)).padStart(2, '0')}`;
const CUT0 = at('cut'), CUT1 = end('shaking'); // the blanket comes off between these

export const config = { canvas: '2d', fps: 30, duration: END };
export const subtitles = { top: 516, maxWords: 1, maxChars: 30, className: 'one' };

export const audio = [
  { type: 'pad', from: 0, to: END, level: 1 },
  { type: 'ambience', from: 0, to: OUT, level: 0.35 },
  { type: 'powerdown', at: OUT, d: 0.8 },
  { type: 'drone', from: OUT + 0.5, to: at('airlock') },
  { type: 'heartbeat', from: at('silence'), to: end('hum') + 1, bpm: 62, bpmEnd: 70 },
  { type: 'rustle', at: [at('suit2') + 0.3, at('suit2') + 1.1] },
  { type: 'hiss', at: at('airlock') + 0.2, d: 2.4 },
  { type: 'breath', from: at('tether'), to: end('dead'), rate: 0.26 },
  { type: 'rustle', at: [CUT0 + 0.3, CUT0 + 1.2, CUT0 + 2.1, CUT0 + 3.0, CUT0 + 3.9] },
  { type: 'clank', at: at('turn'), gain: 0.4 },
  { type: 'powerup', at: at('turn') + 0.6 },
  { type: 'beep', at: word('power', '96') },
  { type: 'heartbeat', from: at('light'), to: END, bpm: 70, bpmEnd: 110 },
  { type: 'riser', from: at('dark'), to: END },
  { type: 'boom', at: END - 0.05, gain: 0.6 },
];

export async function setup({ g, overlay, W, H, dpr }) {
  await loadFonts();
  const suitSam = (extra) => ({ who: 'sam', suit: { visor: 'down', name: 'COLE' }, ...extra });
  // the EVA picture: the truss, Sam clipped on, his tether to the handrail
  const eva = (from, { night = 0, scroll = 0, cam, samX = 250, lamp = 0 } = {}) => shot(from, cam ?? [{ t: 0, x: 270, y: 168, z: 1.0 }, { t: 4, x: 270, y: 162, z: 1.06 }], (g, t, lt) => {
    const n = typeof night === 'function' ? night(t) : night;
    trussClose(g, t, { night: n, scroll: typeof scroll === 'function' ? scroll(t) : scroll });
    const f = stick(g, { t, x: samX, y: 112, s: 1.15, pose: 'reach', floaty: 0.5, ...suitSam() });
    g.strokeStyle = '#e8c450'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(f.hip[0], f.hip[1]); g.quadraticCurveTo(f.hip[0] - 30, f.hip[1] + 40, samX - 60, 138); g.stroke();
    if (lamp || n > 0.3) beam(g, f.head[0] + 10, f.head[1], f.head[0] + 120, f.head[1] + 60, 70, 0.35 * Math.max(lamp, n));
  });
  const joint = (from, { blanket, turn = () => 0, light = () => 1, cam } = {}) => shot(from, cam ?? [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 4, x: 260, y: 200, z: 1.12 }], (g, t, lt) => {
    arrayJoint(g, t, { blanket: blanket(t), turn: turn(t), light: light(t) });
    stick(g, { t, x: 95, y: 300, s: 1.25, pose: 'reach', floaty: 0.4, ...suitSam() });
    if (light(t) < 1) beam(g, 120, 210, 250, 140, 90, 0.4);
  });
  const shots = [
    // (Part 5's last seconds)
    room(0, { back: 'wall', night: (t) => (t < OUT ? 0.15 : 1), people: [(t) => ({ x: 230, y: 300, s: 1.45, face: t < OUT ? 'worried' : 'shock', look: 1 })], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 2.5, x: 260, y: 215, z: 1.15 }] }),
    room(at('emerg') - 0.1, { back: 'wall', night: 0.85, alarm: 0.3, people: [{ x: 250, y: 300, s: 1.4, face: 'worried', look: -1, floaty: 0.6 }], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 270, y: 220, z: 1.1 }] }),
    faceShot(at('silence') - 0.1, { who: 'sam', face: 'worried', look: 1, night: 0.85 }),
    // suit 2, four hours of pure oxygen
    shot(at('suit2') - 0.1, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 300, y: 200, z: 1.15 }], (g, t) => {
      interior(g, t, { back: 'wall', night: 0.6 });
      stick(g, { t, x: 330, y: 280, s: 1.6, pose: 'stand', floaty: 0.05, ...suitSam({ suit: { visor: 'down', name: '2' } }) });
      stick(g, { t, x: 120, y: 322, s: 1.5, who: 'sam', face: 'serious', look: 1 });
    }),
    shot(at('prebreathe') - 0.1, [{ t: 0, x: 270, y: 200, z: 1.15 }, { t: 6, x: 270, y: 170, z: 1.6 }], (g, t) => {
      interior(g, t, { back: 'wall', night: 0.6 });
      stick(g, { t, x: 270, y: 300, s: 1.7, pose: 'float', floaty: 0.3, face: 'calm', ...suitSam({ suit: { visor: 'up', name: 'COLE' } }) });
    }, { pin: clockPin((t) => fmt(6 * 60 + 30 + clamp((t - at('prebreathe')) / (end('hours') - at('prebreathe'))) * 240)) }),
    // never go out alone
    shot(at('rule') - 0.1, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 5, x: 270, y: 210, z: 1.1 }], (g, t) => {
      interior(g, t, { back: 'hatch', hatch: { ...HATCH, num: 'A' }, night: 0.5 });
      stick(g, { t, x: 140, y: 310, s: 1.5, pose: 'float', floaty: 0.4, face: 'worried', look: 1, ...suitSam({ suit: { visor: 'up', name: 'COLE' } }) });
    }),
    shot(at('wrong') - 0.1, [{ t: 0, x: 270, y: 150, z: 1.6 }, { t: 4, x: 270, y: 140, z: 1.9 }], (g, t) => {
      interior(g, t, { back: 'hatch', hatch: { ...HATCH, num: 'A' }, night: 0.5 });
      stick(g, { t, x: 270, y: 290, s: 2.2, pose: 'float', floaty: 0.2, face: 'scared', look: 1, ...suitSam({ suit: { visor: 'up', name: 'COLE' } }) });
    }),
    // the airlock opens on the Earth
    shot(at('airlock') - 0.1, [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 4.5, x: 270, y: 207, z: 1.9 }], (g, t, lt) => {
      interior(g, t, { back: 'hatch', hatch: { ...HATCH, num: 'A', open: 1 }, night: 0.4 });
      const u = easeInOutCubic(clamp((lt - 1.2) / 1.0));
      g.save(); g.beginPath(); g.arc(270, 207, 82 * u, 0, 7); g.clip();
      space(g, t); earth(g, 270, 207 + 520, 560, t, { rot: t * 0.02 });
      g.restore();
    }),
    eva(at('tether') - 0.1, { scroll: (t) => (t - at('tether')) * 20 }),
    // the whole station, the Earth rushing below
    outside(at('speed') - 0.1, { sun: 0.3, st: { s: 0.62, x: 270, y: 160 }, cam: [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 5, x: 270, y: 215, z: 0.92 }] }),
    eva(at('sunset') - 0.1, { night: (t) => clamp((t - at('sunset') - 0.4) / 1.6), scroll: (t) => 120 + (t - at('sunset')) * 16 }),
    eva(at('black') - 0.1, { night: 1, scroll: (t) => 160 + (t - at('black')) * 16, cam: [{ t: 0, x: 270, y: 190, z: 0.95 }, { t: 3, x: 270, y: 200, z: 0.92 }] }),
    // the jammed joint
    joint(at('joint') - 0.1, { blanket: () => 1, light: () => 0.55 }),
    joint(CUT0 - 0.1, { blanket: (t) => 1 - clamp((t - CUT0 - 0.2) / (CUT1 - CUT0 - 0.4)), light: () => 0.55, cam: [{ t: 0, x: 250, y: 190, z: 1.25 }, { t: 6, x: 260, y: 185, z: 1.35 }] }),
    joint(at('turn') - 0.1, { blanket: () => 0, turn: (t) => Math.max(0, t - at('turn') - 0.4) * 0.5, light: (t) => clamp((t - at('turn') - 0.6) / 1.2) * 0.45 + 0.55 }),
    readoutsShot(at('power') - 0.1, { items: [
      { label: 'OXYGEN', value: '113 kg', at: at('power') },
      { label: 'WATER', value: `${Math.round(waterPct(151))}%`, at: at('power') + 0.15 },
      { label: 'POWER', value: '96%', at: word('power', '96') - 0.1 },
    ] }),
    outside(at('breathed') - 0.1, { sun: 0.9, st: { s: 0.85, x: 270, y: 190 }, cam: [{ t: 0, x: 270, y: 200, z: 1.0 }, { t: 3, x: 270, y: 200, z: 0.9 }] }),
    eva(at('back') - 0.1, { scroll: (t) => 300 - (t - at('back')) * 22, samX: 300 }),
    // Module 3's window
    shot(at('dark') - 0.1, [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 6, x: 270, y: 208, z: 1.12 }], (g, t) => {
      hullWindow(g, t, { light: 0 });
    }),
    shot(at('light') - 0.1, [{ t: 0, x: 270, y: 210, z: 1.05 }, { t: 4, x: 270, y: 208, z: 1.3 }], (g, t, lt) => {
      hullWindow(g, t, { light: clamp((t - at('light') - 0.2) / 0.5), inside: (gg) => {
        if (t < at('shadow')) return;
        // a shadow crosses the room
        const u = clamp((t - at('shadow') - 0.1) / 1.3);
        gg.save(); gg.filter = 'brightness(0) opacity(0.75)';
        stick(gg, { t, x: 130 + u * 260, y: 290, s: 1.8, who: 'mara', pose: 'float', floaty: 0.4, dir: 1 });
        gg.restore();
      } });
    }),
  ];
  return makePart({
    g, overlay, W, H, dpr, part: 6, end: END, shots,
    days: [{ at: at('emerg'), text: 'DAY 151' }],
  });
}

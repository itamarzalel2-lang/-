// Alone in Orbit Ep 01, Part 12 (Days 260-300). Plot: series/alone-in-orbit/story.md
// Opens on Part 11's last lines (no one is coming); envelope 12; the ham radio; ends on Inés's voice.
import {
  makePart, shot, room, faceShot, paperShot, envelopesShot, noteShot, readoutsShot, stick, clamp, easeInOutCubic,
  waterPct, clockPin, FONTS,
} from '/engine/lib/orbit.js';
import { hamRadio, worldMap, earthRoom } from '/engine/lib/props2d.js';
import { narration, loadFonts, interior, screen } from '/engine/lib/toon.js';

const voice = await (await fetch(new URL('./voice.json', import.meta.url))).json();
const N = narration(voice);
const { at, end, word } = N;
const END = end('empty') + 0.4;

export const config = { canvas: '2d', fps: 30, duration: END };
export const subtitles = { top: 516, maxWords: 1, maxChars: 30, className: 'one' };

export const audio = [
  { type: 'pad', from: 0, to: END, level: 1 },
  { type: 'ambience', from: 0, to: END, level: 0.3 },
  { type: 'beep', at: [word('water', 'water')] },
  { type: 'rustle', at: [at('d270') + 1.0, at('open12') + 0.4, at('c1') - 0.2] },
  { type: 'scribble', from: at('rig') + 0.4, to: end('rig'), gain: 0.4 },
  { type: 'radio', at: [at('static') + 0.1, at('static2') + 0.1, at('ines') - 0.2] },
  { type: 'heartbeat', from: at('d300'), to: END, bpm: 70, bpmEnd: 100 },
  { type: 'riser', from: at('ines'), to: END },
  { type: 'boom', at: END - 0.05, gain: 0.6 },
];

export async function setup({ g, overlay, W, H, dpr }) {
  await loadFonts();
  const confession = [
    { id: 'c1', text: 'Sam, Mara.' },
    { id: 'c1', w: 'the', text: 'The leak was fake.' },
    { id: 'c1', w: 'gauges', text: 'The gauges are fake.' },
    { id: 'c2', text: 'Larkspur Orbital calls it Project SOLO:' },
    { id: 'c2', w: 'two', text: "two people, each told they're alone," },
    { id: 'c2', w: 'for', text: 'for one year.' },
    { id: 'c3', text: 'I was ordered to write your rules.' },
    { id: 'c3', w: 'wrote', text: 'I wrote rule two' },
    { id: 'c3', w: 'so', text: "so you'd find each other.", underline: true },
    { id: 'c4', text: 'If they leave you up there,' },
    { id: 'c4', w: 'call', text: 'call 145.800 at night,' },
    { id: 'c4', w: 'when', text: 'when you pass over Chile.' },
    { id: 'c4', w: 'my', text: 'My daughter listens.', underline: true },
    { id: 'c4', w: 'listens', text: '— Hale', x: 330 },
  ].map((l, k) => ({ ...l, at: l.w ? word(l.id, l.w) : at(l.id), y: 84 + 46 * k }));
  confession.forEach((l, k) => { l.dur = Math.max(0.5, Math.min(2.0, (confession[k + 1]?.at ?? end('c4')) - l.at - 0.1)); });
  // the station's ground track over the map; u runs along it
  const mapShot = (from, { u, chile = 1, footprint = () => 0, cam } = {}) => shot(from, cam ?? { x: 270, y: 210, z: 1.0 }, (g, t) => {
    g.fillStyle = '#0b1424'; g.fillRect(-60, -60, 660, 560);
    worldMap(g, t, { u: u(t), chile, footprint: footprint(t) });
    g.fillStyle = '#e8f2ff'; g.font = `900 18px ${FONTS.display}`; g.textAlign = 'center'; g.fillText('ONE PASS OVER CHILE ≈ 10 MIN', 270, 395);
  });
  const radioRoom = (from, { lit = () => 0, faces = ['serious', 'serious'], cam } = {}) => shot(from, cam ?? [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 4, x: 290, y: 225, z: 1.1 }], (g, t) => {
    interior(g, t, { back: 'wall', night: 0.45 });
    hamRadio(g, 170, 250, t, { lit: lit(t) });
    stick(g, { t, x: 110, y: 330, s: 1.35, who: 'sam', face: faces[0], look: 1, pose: 'hold' });
    stick(g, { t, x: 440, y: 320, s: 1.35, who: 'mara', face: faces[1], dir: -1, look: -1 });
  });
  const shots = [
    // (Part 11's last seconds)
    shot(0, { x: 270, y: 200, z: 1.0 }, (g, t) => {
      g.fillStyle = '#1a1c20'; g.fillRect(-60, -60, 660, 560);
      screen(g, 40, 34, 460, 330, [
        { text: 'PROJECT SOLO', color: '#ffffff' }, { text: 'D240: PROTOCOL BREACH', color: '#ffd166' },
        { text: 'STUDY COMPROMISED.', color: '#ff6b5a' }, { text: 'CANCEL RETURN FLIGHT.', color: '#ff6b5a', u: clamp((t - word('cancel', 'cancel')) / 0.9) },
      ], { size: 21, lh: 38, pad: 22, bezel: '#2b2e34' });
    }),
    room(at('noone') - 0.1, { back: 'window', night: 0.4, people: [
      { x: 210, y: 300, s: 1.5, who: 'sam', face: 'sad', look: 1 }, { x: 330, y: 300, s: 1.5, who: 'mara', face: 'sad', dir: -1, look: -1 },
    ], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 2.5, x: 270, y: 210, z: 1.12 }] }),
    // two people, one person's supplies
    readoutsShot(at('two') - 0.1, { items: [
      { label: 'OXYGEN', value: '113 kg', at: at('two') + 0.3 },
      { label: 'WATER', value: `${Math.floor(waterPct(260))}%`, at: word('water', 'water') - 0.1, color: '#ffd166' },
      { label: 'POWER', value: '96%', at: at('two') + 0.6 },
    ] }),
    paperShot(at('gone') - 0.1, { font: 'hand', size: 27, sheet: { x: 40, y: 20, w: 460, h: 395 }, lh: 40, top: 60, lines: [
      { text: 'Water:  31%,  −0.3% a day', at: at('gone') + 0.2, dur: 1.2, y: 100 },
      { text: '31 ÷ 0.3  =  ~105 days', at: word('gone', 'water') + 0.2, dur: 1.2, y: 160 },
      { text: 'Gone around Day 365', at: word('gone', 'around') - 0.1, dur: 1.2, y: 330, color: '#b3261e', bold: true, underline: 2 },
    ] }),
    // open twelve? never early.
    room(at('mara') - 0.1, { back: 'wall', people: [
      { x: 200, y: 300, s: 1.5, who: 'sam', face: 'serious', look: 1 }, { x: 340, y: 300, s: 1.5, who: 'mara', face: 'serious', dir: -1, look: -1, pose: 'reach' },
    ], cam: (lt, t) => ({ x: t < at('never') ? 320 : 220, y: 200, z: 1.45 }), smooth: 0.5 }),
    room(at('argued') - 0.1, { back: 'window', kicks: [0.6, 1.4, 2.4, 3.2].map((d) => ({ at: at('argued') + d, amp: 1.5, decay: 10 })), people: [
      (t) => ({ x: 200, y: 300, s: 1.5, who: 'sam', face: Math.sin(t * 3) > 0 ? 'serious' : 'worried', look: 1, pose: Math.sin(t * 2) > 0 ? 'reach' : 'float' }),
      (t) => ({ x: 340, y: 300, s: 1.5, who: 'mara', face: Math.sin(t * 3 + 1) > 0 ? 'serious' : 'calm', dir: -1, look: -1, pose: Math.sin(t * 2 + 1) > 0 ? 'reach' : 'float' }),
    ], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 5, x: 270, y: 210, z: 1.1 }] }),
    // envelope nine
    envelopesShot(at('d270') - 0.1, { n: 9 }),
    noteShot(at('env9') - 0.1, { size: 30, sign: end('env9') - 0.2, lines: [
      { text: 'If they cancel the flight,', at: at('env9') + 0.05, dur: 1.1 },
      { text: 'open twelve.', at: word('env9', 'open'), dur: 0.6, underline: true },
      { text: "Don't wait.", at: word('env9', 'dont'), dur: 0.5, underline: 2, color: '#b3261e' },
    ] }),
    faceShot(at('saw') - 0.1, { who: 'hale', face: 'serious', look: 0.2 }),
    // envelope twelve: the confession
    envelopesShot(at('open12') - 0.1, { n: 10, rise: 12 }),
    paperShot(at('c1') - 0.15, { sheet: { x: 30, y: 22, w: 480, h: 1070 - 300 }, lines: confession, follow: true }),
    // a ham radio and an antenna
    radioRoom(at('rig') - 0.1, { faces: ['serious', 'calm'] }),
    shot(at('pass') - 0.1, { x: 270, y: 210, z: 1.0 }, (g, t) => {
      g.fillStyle = '#0b1424'; g.fillRect(-60, -60, 660, 560);
      // the dot sweeps across the map and over Chile, then away
      const u = 0.24 + clamp((t - at('pass')) / (end('curve') - at('pass'))) * 0.2;
      const m = worldMap(g, t, { u, chile: 1, footprint: 1 });
      g.fillStyle = '#e8f2ff'; g.font = `900 18px ${FONTS.display}`; g.textAlign = 'center'; g.fillText('ONE PASS OVER CHILE: ~10 MINUTES', 270, 395);
    }),
    radioRoom(at('static') - 0.1, { lit: () => 0, faces: ['sad', 'sad'] }),
    paperShot(at('thirty') - 0.1, { font: 'hand', size: 30, sheet: { x: 40, y: 20, w: 460, h: 395 }, lh: 40, top: 60, lines: [
      { text: 'PASSES:', at: -1, y: 90 },
    ], props: (g, t) => {
      // tally marks, six groups of five
      const n = Math.floor(clamp((t - at('thirty') - 0.2) / 1.6) * 30);
      g.strokeStyle = '#283063'; g.lineWidth = 3.5; g.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const grp = Math.floor(i / 5), k = i % 5, gx = 90 + (grp % 3) * 130, gy = 130 + Math.floor(grp / 3) * 70;
        g.beginPath();
        if (k < 4) { g.moveTo(gx + k * 18, gy); g.lineTo(gx + k * 18 + 2, gy + 50); } else { g.moveTo(gx - 8, gy + 40); g.lineTo(gx + 64, gy + 8); }
        g.stroke();
      }
    } }),
    // day 300: the night pass
    shot(at('d300') - 0.1, { x: 270, y: 210, z: 1.0 }, (g, t) => {
      g.fillStyle = '#0b1424'; g.fillRect(-60, -60, 660, 560);
      const u = 0.29 + clamp((t - at('d300')) / 3.5) * 0.06;
      worldMap(g, t, { u, chile: 1, footprint: clamp((t - at('d300') - 0.8) / 0.5) });
      g.fillStyle = 'rgba(2,6,20,0.35)'; g.fillRect(20, 60, 500, 300);
    }),
    radioRoom(at('static2') - 0.1, { lit: (t) => (t > word('static2', 'voice') ? 1 : 0), faces: ['shock', 'shock'], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 270, y: 255, z: 1.3 }] }),
    // Inés, in Chile, at her radio
    shot(at('ines') - 0.1, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 6, x: 250, y: 220, z: 1.1 }], (g, t) => {
      earthRoom(g, t, { stationU: clamp((t - at('ines')) / 6) });
      hamRadio(g, 150, 225, t, { lit: 1, antenna: false, freq: '145.800' });
      stick(g, { t, x: 110, y: 300, s: 1.4, who: 'ines', pose: 'hold', face: 'calm', look: 1, floaty: 0 });
    }, { pin: clockPin('23:41') }),
  ];
  return makePart({
    g, overlay, W, H, dpr, part: 12, end: END, shots,
    days: [{ at: at('two'), text: 'DAY 260' }, { at: at('d270'), text: 'DAY 270' }, { at: at('d300'), text: 'DAY 300' }],
  });
}

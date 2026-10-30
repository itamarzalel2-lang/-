// Alone in Orbit Ep 01, Part 13 (Days 300-360). Plot: series/alone-in-orbit/story.md
// Opens on Part 12's last lines (Inés on the radio); the world finds out; ends on the deorbit burn.
import {
  makePart, shot, room, faceShot, envelopesShot, noteShot, readoutsShot, outside, stick, headOnly, clamp,
  easeInOutCubic, waterPct, clockPin, roundRect, FONTS, INK,
} from '/engine/lib/orbit.js';
import { hamRadio, earthRoom, phone } from '/engine/lib/props2d.js';
import { narration, loadFonts, interior, capsuleInside, space, earth, station } from '/engine/lib/toon.js';

const voice = await (await fetch(new URL('./voice.json', import.meta.url))).json();
const N = narration(voice);
const { at, end, word } = N;
const END = end('down') + 0.4;
const BURN = at('fired') - 0.1;
const QUAKE = Array.from({ length: 30 }, (_, i) => ({ at: at('shook') + i * 0.18, amp: 3.5, decay: 9 }));

export const config = { canvas: '2d', fps: 30, duration: END };
export const subtitles = { top: 516, maxWords: 1, maxChars: 30, className: 'one' };

export const audio = [
  { type: 'pad', from: 0, to: at('shook'), level: 1 },
  { type: 'ambience', from: 0, to: END, level: 0.3 },
  { type: 'radio', at: [0.3, at('every') - 0.2] },
  { type: 'rustle', at: [at('env10') + 1.0, at('d330') + 1.0] },
  { type: 'beep', at: [word('water', 'water')] },
  { type: 'radio', at: [at('d359') + 1.0] },
  { type: 'boom', at: at('shook') - 0.05, gain: 0.5 },
  { type: 'grind', from: BURN, to: END },
  { type: 'thumps', from: at('shook'), to: END, rate: 5, decay: 0.5 },
  { type: 'klaxon', from: at('deorbit'), to: END, level: 0.6 },
  { type: 'riser', from: at('fired'), to: END },
  { type: 'boom', at: END - 0.05, gain: 0.7 },
];

export async function setup({ g, overlay, W, H, dpr }) {
  await loadFonts();
  const inesRoom = (from, { cam, u = () => -1, ines = {} } = {}) => shot(from, cam ?? [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 6, x: 250, y: 220, z: 1.1 }], (g, t) => {
    earthRoom(g, t, { stationU: u(t) });
    hamRadio(g, 150, 225, t, { lit: 1, antenna: false, freq: '145.800' });
    stick(g, { t, x: 110, y: 300, s: 1.4, who: 'ines', pose: 'hold', face: 'calm', look: 1, floaty: 0, ...ines });
  });
  const news = (g, t) => {
    g.fillStyle = '#15171c'; g.fillRect(-60, -60, 660, 560);
    roundRect(g, 30, 30, 480, 300, 10); g.fillStyle = '#26324a'; g.fill(); g.strokeStyle = '#000'; g.lineWidth = 8; g.stroke();
    g.save(); roundRect(g, 30, 30, 480, 300, 10); g.clip();
    g.fillStyle = '#3b4a68'; g.fillRect(30, 30, 480, 300);
    headOnly(g, { x: 270, y: 150, s: 4.2, who: 'hale', face: 'serious', t });
    g.fillStyle = '#c0261c'; g.fillRect(30, 250, 480, 30); g.fillStyle = '#fff'; g.fillRect(30, 280, 480, 50);
    g.fillStyle = '#fff'; g.font = `900 16px ${FONTS.display}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('LIVE', 44, 265);
    g.fillStyle = '#111'; g.font = `900 19px ${FONTS.display}`; g.fillText('HALE: "TWO PEOPLE ARE UP THERE"', 44, 305);
    g.restore();
  };
  const shots = [
    // (Part 12's last seconds)
    inesRoom(0, { u: (t) => clamp((t + 2.5) / 6) }),
    shot(at('her') - 0.1, [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 4, x: 270, y: 205, z: 1.12 }], (g, t) => {
      earthRoom(g, t, {});
      g.fillStyle = 'rgba(20,20,30,0.3)'; g.fillRect(-60, -60, 660, 560);
      headOnly(g, { x: 270, y: 215, s: 5.2, who: 'ines', face: 'calm', look: 0.4, t });
    }),
    // the plan: bring it down into the ocean, with them on it
    shot(at('told') - 0.1, [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 7, x: 270, y: 230, z: 0.95 }], (g, t, lt) => {
      space(g, t); earth(g, 270, 1240, 1000, t, { rot: t * 0.004 });
      station(g, 160, 120, 0.5, t, { rot: -0.05 });
      const u = clamp((lt - 1.5) / 3);
      g.strokeStyle = 'rgba(255,120,90,0.9)'; g.lineWidth = 3; g.setLineDash([10, 8]);
      g.beginPath(); g.moveTo(200, 130); g.quadraticCurveTo(330, 150, 200 + 230 * u, 130 + 150 * u * u); g.stroke(); g.setLineDash([]);
      if (u >= 1) { g.fillStyle = '#ff7a5c'; g.font = `900 28px ${FONTS.display}`; g.textAlign = 'center'; g.fillText('DAY 360', 430, 310); }
    }),
    room(at('us') - 0.1, { back: 'window', night: 0.3, people: [
      { x: 210, y: 300, s: 1.5, who: 'sam', face: 'scared', look: 1 }, { x: 330, y: 300, s: 1.5, who: 'mara', face: 'scared', dir: -1, look: -1 },
    ], cam: [{ t: 0, x: 270, y: 200, z: 1.25 }, { t: 6, x: 270, y: 205, z: 1.1 }] }),
    // envelope ten: keep talking to her
    envelopesShot(at('env10') - 0.1, { n: 10 }),
    noteShot(word('env10', 'keep') - 0.1, { size: 30, sign: end('env10') - 0.2, lines: [
      { text: 'Keep talking to her.', at: word('env10', 'keep'), dur: 1.0 },
      { text: 'Every pass.', at: word('env10', 'every'), dur: 0.6, underline: true },
    ] }),
    shot(at('every') - 0.1, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 4, x: 290, y: 225, z: 1.1 }], (g, t) => {
      interior(g, t, { back: 'wall', night: 0.45 });
      hamRadio(g, 170, 250, t, { lit: 1 });
      stick(g, { t, x: 110, y: 330, s: 1.35, who: 'sam', face: 'calm', look: 1, pose: 'hold' });
      stick(g, { t, x: 440, y: 320, s: 1.35, who: 'mara', face: 'calm', dir: -1, look: -1 });
    }),
    inesRoom(at('eighteen') - 0.1, { u: (t) => clamp((t - at('eighteen')) / 5), ines: { face: 'serious' } }),
    // the posts: fake, then the photo
    shot(at('posted') - 0.1, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 5, x: 270, y: 225, z: 1.05 }], (g, t) => {
      g.fillStyle = '#2a2d33'; g.fillRect(-60, -60, 660, 560);
      phone(g, 160, 18, t, { comments: [
        { text: 'fake', at: word('fake', 'fake') - 0.2 },
        { text: 'lol nice CGI', at: word('fake', 'fake') + 0.3 },
        { text: "that station's empty", at: word('fake', 'fake') + 0.8 },
      ] });
    }),
    shot(at('photo') - 0.1, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 270, y: 140, z: 1.6 }], (g, t) => {
      g.fillStyle = '#2a2d33'; g.fillRect(-60, -60, 660, 560);
      phone(g, 160, 18, t, { title: 'AMATEUR TELESCOPE', photo: clamp((t - word('photo', 'lights') + 0.2) / 0.4), comments: [
        { text: 'wait...', at: at('empty2') - 0.2 },
        { text: 'the lights are ON', at: at('empty2') + 0.6, color: '#ffe3a0' },
      ] });
    }),
    shot(at('halepub') - 0.1, [{ t: 0, x: 270, y: 200, z: 1.0 }, { t: 7, x: 270, y: 190, z: 1.08 }], news),
    // envelope eleven: two seats
    envelopesShot(at('d330') - 0.1, { n: 11 }),
    noteShot(at('env11') - 0.1, { size: 30, sign: end('env11') - 0.2, lines: [
      { text: 'Two seats on the next ship.', at: at('env11') + 0.05, dur: 1.2, underline: true },
      { text: 'I made sure.', at: word('env11', 'i'), dur: 0.6 },
    ] }),
    shot(at('seat') - 0.1, [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 3, x: 270, y: 220, z: 1.08 }], (g, t) => capsuleInside(g, t, { tag: 0 })),
    faceShot(at('dayone') - 0.1, { who: 'hale', face: 'calm', look: 0.2 }),
    readoutsShot(at('water') - 0.1, { items: [
      { label: 'OXYGEN', value: '113 kg', at: at('water') },
      { label: 'WATER', value: `${Math.floor(waterPct(330))}%`, at: word('water', 'water'), color: '#ff6b5a' },
      { label: 'POWER', value: '96%', at: at('water') + 0.3 },
    ] }),
    // day 359: a rescue is launching
    shot(at('d359') - 0.1, [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 5, x: 290, y: 225, z: 1.1 }], (g, t) => {
      interior(g, t, { back: 'wall', night: 0.45 });
      hamRadio(g, 170, 250, t, { lit: 1 });
      stick(g, { t, x: 110, y: 330, s: 1.35, who: 'sam', face: t > word('d359', 'rescue') ? 'calm' : 'serious', look: 1, pose: 'hold' });
      stick(g, { t, x: 440, y: 320, s: 1.35, who: 'mara', face: t > word('d359', 'rescue') ? 'shock' : 'serious', dir: -1, look: -1 });
    }),
    room(at('home') - 0.1, { back: 'window', people: [{ x: 230, y: 300, s: 1.5, who: 'sam', face: 'calm', look: 1 }], cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 4, x: 270, y: 205, z: 1.2 }] }),
    room(at('rain') - 0.1, { back: 'window', people: [{ x: 300, y: 300, s: 1.5, who: 'mara', face: 'calm', dir: -1, look: -1 }], cam: [{ t: 0, x: 270, y: 205, z: 1.2 }, { t: 3, x: 280, y: 205, z: 1.3 }] }),
    // day 360: the burn
    room(at('d360') - 0.1, { back: 'window', kicks: QUAKE.filter((k) => k.at < at('fired')), alarm: (t) => (t > at('shook') ? 0.6 : 0), people: [
      (t) => ({ x: 210, y: 300, s: 1.5, who: 'sam', face: t > at('shook') ? 'shock' : 'calm', look: 1, pose: t > at('shook') ? 'shock' : 'float' }),
      (t) => ({ x: 330, y: 300, s: 1.5, who: 'mara', face: t > at('shook') ? 'shock' : 'calm', dir: -1, look: -1, pose: t > at('shook') ? 'shock' : 'float' }),
    ], cam: { x: 270, y: 217, z: 1.05 } }),
    outside(BURN, { st: { s: 0.85, x: 330, y: 170, thrust: 1 }, sun: 0.3, cam: [{ t: 0, x: 240, y: 195, z: 1.0 }, { t: 6, x: 225, y: 215, z: 1.05 }] }),
    shot(at('down') - 0.1, [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 2.2, x: 270, y: 250, z: 1.15 }], (g, t, lt) => {
      space(g, t); earth(g, 270, 1100 - lt * 40, 1000, t, { rot: t * 0.006 });
      station(g, 280, 160 + lt * 25, 0.85, t, { rot: -0.05 - lt * 0.06, thrust: 1 });
    }, { kicks: QUAKE.map((k) => ({ ...k, at: k.at + (at('down') - at('shook')) })) }),
  ];
  return makePart({
    g, overlay, W, H, dpr, part: 13, end: END, shots,
    days: [{ at: at('env10'), text: 'DAY 300' }, { at: at('d330'), text: 'DAY 330' }, { at: at('d359'), text: 'DAY 359' }, { at: at('d360'), text: 'DAY 360' }],
  });
}

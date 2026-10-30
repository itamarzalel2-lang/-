// Alone in Orbit Ep 01, Part 1 (Day 1-40). Story bible: series/alone-in-orbit/story.md
// Shots follow the narration lines in ./script.json (times come from ./voice.json).
// Ends on the cliffhanger: three knocks on Hatch 3, "from a room with no air".
import {
  PANEL, narration, seriesText, grunge, panel, onPanel, camAt, cut, shakeAt, dayTag, loadFonts,
  stick, headOnly, interior, hatchDoor, gauge, space, earth, station, capsule, capsuleInside,
  paper, writeText, screen, readouts, envelope, radio, sleepBag, roundRect, poly, FONTS, INK,
} from '/engine/lib/toon.js';
import { clamp, lerp, smoothstep, easeInOutCubic, easeOutCubic } from '/engine/lib/util.js';

const voice = await (await fetch(new URL('./voice.json', import.meta.url))).json();
const N = narration(voice);
const END = N.end('noair') + 0.35; // hard cut on the last word
const KNOCKS = ['k1', 'k2', 'k3'].map((id) => N.at(id) - 0.06);

export const config = { canvas: '2d', fps: 30, duration: END };
export const subtitles = { top: 516, maxWords: 1, maxChars: 30, className: 'one' };

export const audio = [
  { type: 'pad', from: 0, to: END, level: 1 },
  { type: 'ambience', from: 0, to: END, level: 0.35 },
  { type: 'klaxon', from: N.word('d1', 'alarm'), to: N.end('leak') + 0.4 },
  { type: 'clank', at: N.word('seal', 'sealed') + 0.1 },
  { type: 'hiss', at: N.word('gauge', 'dropped'), d: 2.2 },
  { type: 'clank', at: N.at('undock') + 0.9, gain: 0.7 },
  { type: 'whoosh', at: N.at('undock') + 1.0 },
  { type: 'radio', at: N.at('copy') - 0.25 },
  { type: 'radio', at: N.word('told', 'ground') + 0.6 },
  { type: 'beep', at: [N.word('nums', 'oxygen'), N.word('nums', 'water'), N.word('nums', 'power')] },
  { type: 'rustle', at: N.at('d30') + 1.2 },
  { type: 'scribble', from: N.at('saw') + 0.2, to: N.end('saw') + 1.5 },
  { type: 'heartbeat', from: N.at('sleep'), to: END, bpm: 58, bpmEnd: 96 },
  { type: 'knock', at: KNOCKS },
  { type: 'riser', from: N.at('from'), to: END },
  { type: 'boom', at: END - 0.05, gain: 0.6 },
];

export async function setup({ g, overlay, W, H, dpr }) {
  await loadFonts();
  const bg = grunge(W, H, dpr);
  seriesText(overlay, { title: ['Alone in Orbit Ep 01:', 'Day 1 to Day 365'], part: 1, to: END + 1 });

  const at = N.at, end = N.end, word = N.word;
  const dayOf = (t) => (t < at('d2') ? 'DAY 1' : t < at('d30') ? `DAY ${t < at('copy') + 1.4 ? 2 : Math.min(29, 2 + Math.floor((t - at('copy') - 1.4) * 5))}` : t < at('d40') ? 'DAY 30' : 'DAY 40');
  const dayStart = (t) => (t < at('d2') ? at('d1') : t < at('d30') ? at('d2') : t < at('d40') ? at('d30') : at('d40'));

  const letter = [
    { id: 'r0', text: 'Three rules.' },
    { id: 'r1', text: '1. Never open Hatch 3.' },
    { id: 'r1', text: 'Not for anyone.', x: 84, w: 'not' },
    { id: 'r1b', text: 'Not even for me.', x: 84, underline: true },
    { id: 'r2', text: '2. Every morning, check' },
    { id: 'r2', text: 'three numbers:', x: 84, w: 'three' },
    { id: 'r2', text: 'Oxygen.   Water.   Power.', x: 84, w: 'oxygen' },
    { id: 'r3', text: '3. Talk to Ground only' },
    { id: 'r3', text: 'on channel 4.', x: 84, w: 'channel' },
    { id: 'r3', text: 'If anything calls on channel 9,', x: 84, w: 'if' },
    { id: 'r3', text: "don't answer.", x: 84, w: 'dont' },
    { id: 'r4', text: 'Twelve envelopes. One a month.' },
    { id: 'r4', text: 'Never early.', w: 'never', underline: true },
    { id: 'r4', text: '— Hale', x: 330, w: 'early' },
  ].map((l, k) => ({ ...l, y: 84 + 46 * k }));
  const lineStart = (l) => (l.w ? word(l.id, l.w) : at(l.id));

  const log = (t, from) => {
    // Ground's daily answer, one line a day, faster and faster
    const lines = [];
    for (let d = 2; d <= 29; d++) {
      const t0 = from + (d === 2 ? 0 : 1.4 + (d - 3) * 0.2);
      if (t < t0) break;
      lines.push({ text: `D${String(d).padStart(2, '0')} GROUND: COPIES. CONTINUE.`, u: clamp((t - t0) / (d === 2 ? 1.0 : 0.15)) });
    }
    return lines.slice(-7);
  };

  const shots = [
    // hook: the station alone above the Earth
    { from: 0, cam: [{ t: 0, x: 270, y: 200, z: 1.0 }, { t: 3.6, x: 270, y: 190, z: 1.25 }], draw: (t) => {
      space(g, t); earth(g, 270, 1240, 1000, t, { rot: t * 0.004 });
      station(g, 270, 170, 0.62, t, { rot: -0.08 + t * 0.004, capsuleDocked: true });
    } },
    { from: at('hook2') - 0.1, cam: [{ t: 0, x: 270, y: 217, z: 1 }, { t: 3, x: 270, y: 230, z: 1.12 }], draw: (t, lt) => {
      interior(g, t, { back: 'window', earthRot: t * 0.01 });
      stick(g, { x: 222, y: 290, s: 1.45, t, who: 'sam', face: lt > 1.2 ? 'worried' : 'calm', look: 1 });
    } },
    // day 1: the alarm
    { from: at('d1') - 0.05, cam: [{ t: 0, x: 270, y: 210, z: 1.15 }, { t: 2.2, x: 270, y: 205, z: 1.0 }], draw: (t) => {
      space(g, t); earth(g, 270, 1300, 1060, t, { rot: t * 0.004 });
      station(g, 270, 200, 1.0, t, { rot: -0.05, capsuleDocked: true });
    } },
    { from: word('d1', 'alarm') - 0.1, cam: [{ t: 0, x: 270, y: 225, z: 1.05 }, { t: 3, x: 270, y: 220, z: 1.0 }], draw: (t, lt) => {
      interior(g, t, { back: 'wall', alarm: 1 });
      stick(g, { x: 120, y: 300, s: 1.3, t, who: 'ortiz', face: 'shock', pose: 'shock', phase: 1 });
      stick(g, { x: 275, y: 285, s: 1.3, t, who: 'hale', face: 'serious', pose: 'float', phase: 2, dir: -1 });
      stick(g, { x: 430, y: 300, s: 1.3, t, who: 'sam', face: 'shock', pose: 'shock', dir: -1, phase: 3 });
    } },
    // the station plan: Module 3 is the other half
    { from: at('leak') - 0.05, cam: { x: 270, y: 217, z: 1 }, draw: (t, lt) => {
      g.fillStyle = '#0e2a4a'; g.fillRect(-40, -40, 620, 520);
      g.strokeStyle = 'rgba(140,190,255,0.18)'; g.lineWidth = 1;
      for (let x = 0; x < 540; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 434); g.stroke(); }
      for (let y = 0; y < 434; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(540, y); g.stroke(); }
      const blink = 0.5 + 0.5 * Math.sin(t * 9);
      const half = (x, label, red) => {
        roundRect(g, x, 160, 200, 90, 40);
        g.fillStyle = red ? `rgba(230,40,40,${0.35 + 0.45 * blink})` : 'rgba(140,190,255,0.12)'; g.fill();
        g.strokeStyle = '#d6e8ff'; g.lineWidth = 3; g.stroke();
        g.fillStyle = '#e8f2ff'; g.font = `900 22px ${FONTS.display}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(label, x + 100, 205);
      };
      half(40, 'OUR SIDE', false);
      half(300, 'MODULE 3', lt > 0.5);
      roundRect(g, 244, 182, 52, 46, 6); g.fillStyle = '#16365c'; g.fill(); g.strokeStyle = '#ffd34d'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#ffd34d'; g.font = `900 13px ${FONTS.display}`; g.fillText('HATCH', 270, 199); g.fillText('3', 270, 215);
      if (lt > 0.5) {
        g.fillStyle = `rgba(255,90,80,${0.6 + 0.4 * blink})`; g.font = `900 20px ${FONTS.display}`;
        g.fillText('⚠ AMMONIA LEAK', 400, 290);
      }
    } },
    // Hale seals Hatch 3
    { from: at('seal') - 0.05, cam: [{ t: 0, x: 270, y: 215, z: 1.0 }, { t: 4.2, x: 270, y: 210, z: 1.18 }], draw: (t, lt) => {
      const tw = word('seal', 'sealed') - at('seal') + 0.05;
      const open = 1 - easeInOutCubic(clamp((lt - tw + 0.6) / 0.8));
      const wheel = easeInOutCubic(clamp((lt - tw - 0.3) / 1.2)) * 1.25;
      interior(g, t, { back: 'hatch', alarm: 0.6, hatch: { open, wheel } });
      stick(g, { x: 196, y: 272, s: 1.3, t, who: 'hale', face: 'serious', pose: 'push', floaty: 0.3 });
      stick(g, { x: 445, y: 310, s: 1.4, t, who: 'sam', face: lt > tw + 1.6 ? 'scared' : 'worried', dir: -1, phase: 2 });
    } },
    // the gauge drops to zero
    { from: at('gauge') - 0.05, cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3.5, x: 270, y: 222, z: 1.2 }], draw: (t, lt) => {
      g.fillStyle = '#d8d1c3'; g.fillRect(-40, -40, 620, 520);
      g.fillStyle = '#c9c2b2'; g.fillRect(-40, 360, 620, 120);
      const td = word('gauge', 'dropped') - at('gauge');
      const v = 101 * (1 - easeOutCubic(clamp((lt - td) / 1.6)));
      gauge(g, 270, 205, 132, v + 0.4 * Math.sin(t * 40) * (v > 1 ? 1 : 0));
    } },
    // the capsule: three seats, one NO GO
    { from: at('seats') - 0.05, cam: [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 2.2, x: 270, y: 210, z: 1.0 }, { t: 3.6, x: 380, y: 250, z: 1.55 }], draw: (t, lt) => {
      capsuleInside(g, t, { tagPulse: smoothstep(word('seats', 'red') - at('seats') - 0.2, word('seats', 'red') - at('seats'), lt) });
    } },
    { from: at('stay') - 0.05, cam: [{ t: 0, x: 270, y: 225, z: 1.0 }, { t: 2.6, x: 300, y: 225, z: 1.08 }], draw: (t, lt) => {
      const seats = capsuleInside(g, t, { tagPulse: 0 });
      stick(g, { x: seats[0][0], y: seats[0][1] - 4, t, who: 'hale', pose: 'sit', floaty: 0.15, face: 'serious' });
      stick(g, { x: seats[1][0], y: seats[1][1] - 6, t, who: 'ortiz', pose: 'sit', floaty: 0.15, face: 'worried', phase: 2 });
      stick(g, { x: 470, y: 150, t, who: 'sam', face: 'sad', dir: -1, phase: 1, s: 0.95 });
    } },
    // Hale: the next ship comes in 365 days
    { from: at('hale') - 0.05, cam: [{ t: 0, x: 250, y: 200, z: 1.0 }, { t: 4, x: 250, y: 195, z: 1.1 }], draw: (t, lt) => {
      interior(g, t, { back: 'wall' });
      g.fillStyle = 'rgba(30,30,40,0.35)'; g.fillRect(-40, -40, 620, 520);
      headOnly(g, { x: 200, y: 205, s: 5.2, who: 'hale', face: 'serious', t, look: 0.4 });
      const tn = word('hale', 'next') - at('hale');
      if (lt > tn) {
        const u = clamp((lt - tn) / 0.35);
        g.save(); g.translate(420, 200); g.rotate(-0.12); g.scale(0.6 + 0.4 * u, 0.6 + 0.4 * u); g.globalAlpha = u;
        roundRect(g, -78, -58, 156, 116, 10); g.fillStyle = '#fbf6e9'; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
        g.fillStyle = '#c0392b'; g.fillRect(-78, -58, 156, 26);
        g.fillStyle = INK; g.font = `900 46px ${FONTS.display}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('365', 0, 10);
        g.font = `900 15px ${FONTS.display}`; g.fillText('DAYS', 0, 42); g.fillStyle = '#fff'; g.fillText('NEXT SHIP', 0, -45);
        g.restore();
      }
    } },
    // the letter changes hands
    { from: at('letter') - 0.05, cam: [{ t: 0, x: 270, y: 230, z: 1.1 }, { t: 2.4, x: 270, y: 235, z: 1.2 }], draw: (t, lt) => {
      interior(g, t, { back: 'hatch', hatch: { open: 0, wheel: 1.25 } });
      const u = easeInOutCubic(clamp((lt - 0.5) / 1.2));
      const hh = stick(g, { x: 165, y: 300, s: 1.4, t, who: 'hale', face: 'sad', pose: 'reach', floaty: 0.4 });
      const sh = stick(g, { x: 385, y: 305, s: 1.4, t, who: 'sam', face: 'worried', dir: -1, pose: u > 0.6 ? 'reach' : 'float', phase: 2 });
      const ex = lerp(hh.handF[0] + 6, sh.handF[0] - 6, u), ey = lerp(hh.handF[1], sh.handF[1], u);
      envelope(g, ex, ey, 46, 30, { n: '', rot: -0.15 + 0.3 * u });
    } },
    // the rules, written line by line
    { from: at('r0') - 0.15, cam: (lt, t) => {
      const cur = letter.filter((l) => t >= lineStart(l) - 0.1).at(-1) ?? letter[0];
      return { x: 270, y: clamp(cur.y + 10, 205, 555), z: 1.0 };
    }, smooth: 0.5, draw: (t) => {
      g.fillStyle = '#4d4a44'; g.fillRect(-40, -40, 620, 1000);
      paper(g, 30, 22, 480, 740, { rot: -0.004, lh: 46, top: 68 });
      for (const l of letter) {
        const t0 = lineStart(l);
        const nextIdx = letter.indexOf(l) + 1;
        const dur = Math.max(0.6, Math.min(2.2, (letter[nextIdx] ? lineStart(letter[nextIdx]) : end('r4')) - t0 - 0.1));
        const u = clamp((t - t0) / dur);
        const font = `500 italic 31px ${FONTS.letter}`;
        const w = writeText(g, l.text, l.x ?? 56, l.y, u, { font, color: '#222a5c' });
        if (l.underline && u >= 1) {
          const v = clamp((t - t0 - dur) / 0.4);
          g.strokeStyle = '#222a5c'; g.lineWidth = 2; g.beginPath(); g.moveTo((l.x ?? 56), l.y + 7); g.lineTo((l.x ?? 56) + w * v, l.y + 6); g.stroke();
        }
      }
    } },
    // the capsule leaves
    { from: at('undock') - 0.1, cam: [{ t: 0, x: 250, y: 190, z: 1.1 }, { t: 1.2, x: 230, y: 200, z: 1.25 }, { t: 4.2, x: 175, y: 270, z: 1.6 }], draw: (t, lt) => {
      space(g, t); earth(g, 270, 1220, 980, t, { rot: t * 0.004 });
      station(g, 300, 150, 0.85, t, { rot: -0.04 });
      const u = easeInOutCubic(clamp((lt - 0.9) / 3.4));
      capsule(g, lerp(300 - 0.85 * 146, 150, u), lerp(150 - 6, 300, u), lerp(0.85 * 0.6, 0.9, Math.sin(u * Math.PI) * 0.6) * (1 - 0.45 * u) + 0.25, Math.PI + u * 0.9, { burn: lt > 1.1 && lt < 2.2 ? 1 - Math.abs(lt - 1.6) * 1.6 : 0 });
    } },
    // day 2+: Ground's three words
    { from: at('d2') - 0.1, cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 5, x: 290, y: 205, z: 1.15 }], draw: (t, lt) => {
      interior(g, t, { back: 'wall' });
      radio(g, 330, 210, { ch: '4', lit: t > at('copy') - 0.25 && t < end('copy') ? 1 : 0 });
      screen(g, 160, 118, 330, 82, log(t, at('copy')).slice(-2), { size: 13, lh: 20, pad: 10 });
      stick(g, { x: 105, y: 310, s: 1.35, t, who: 'sam', face: 'calm', look: 1 });
    } },
    // every morning: wake up, the numbers
    { from: at('routine') - 0.1, cam: [{ t: 0, x: 270, y: 200, z: 1.0 }, { t: 2.5, x: 270, y: 205, z: 1.1 }], draw: (t, lt) => {
      interior(g, t, { back: 'wall' });
      sleepBag(g, 120, 140, 1.1, t, { face: lt < 0.9 ? 'sleep' : 'calm' });
      screen(g, 250, 150, 200, 92, [{ text: 'GOOD MORNING', u: clamp((lt - 1) / 0.6) }, { text: 'DAY 3  06:00', u: clamp((lt - 1.4) / 0.6) }], { size: 15, lh: 24 });
    } },
    { from: at('nums') - 0.05, cam: { x: 270, y: 217, z: 1.0 }, draw: (t) => {
      g.fillStyle = '#2b2e34'; g.fillRect(-40, -40, 620, 520);
      readouts(g, 30, 96, [
        { label: 'OXYGEN', value: '312 kg', u: (t - word('nums', 'oxygen') + 0.1) / 0.3 },
        { label: 'WATER', value: '97%', u: (t - word('nums', 'water') + 0.1) / 0.3 },
        { label: 'POWER', value: '100%', u: (t - word('nums', 'power') + 0.1) / 0.3 },
      ], { w: 150, h: 130, gap: 15 });
    } },
    // day 30: envelope one
    { from: at('d30') - 0.1, cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 2.5, x: 270, y: 200, z: 1.1 }], draw: (t, lt) => {
      g.fillStyle = '#5a4a3a'; g.fillRect(-40, -40, 620, 520);
      roundRect(g, 70, 165, 420, 215, 10); g.fillStyle = '#8a6a4a'; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
      for (let i = 12; i >= 1; i--) {
        const up = i === 1 ? easeInOutCubic(clamp((lt - 1.0) / 1.0)) * 70 : 0;
        envelope(g, 112 + (i - 1) * 30, 165 - up, 58, 92, { n: String(i), rot: i === 1 ? -0.1 * clamp(up / 70) : 0 });
      }
      g.fillStyle = '#6e5238'; g.fillRect(70, 215, 420, 165);
      g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(70, 215, 420, 165);
    } },
    { from: at('env1') - 0.1, cam: [{ t: 0, x: 270, y: 217, z: 1.05 }, { t: 2.6, x: 270, y: 217, z: 1.15 }], draw: (t, lt) => {
      g.fillStyle = '#4d4a44'; g.fillRect(-40, -40, 620, 520);
      paper(g, 70, 90, 400, 250, { rot: 0.02, lh: 40, top: 70 });
      writeText(g, 'Write the numbers down.', 104, 168, clamp(lt / 1.2), { font: `500 italic 31px ${FONTS.letter}` });
      writeText(g, 'By hand.', 104, 220, clamp((lt - 1.3) / 0.6), { font: `500 italic 31px ${FONTS.letter}` });
      g.strokeStyle = '#283063'; g.lineWidth = 2; if (lt > 2) { g.beginPath(); g.moveTo(104, 228); g.lineTo(104 + 98 * clamp((lt - 2) / 0.3), 227); g.stroke(); }
      writeText(g, '— H.', 330, 300, clamp((lt - 1.9) / 0.4), { font: `500 italic 26px ${FONTS.letter}` });
    } },
    // the notebook: the tank loses 1.7 kg a day
    { from: at('saw') - 0.1, cam: (lt, t) => ({ x: 270, y: t < at('lose') ? 210 : 260, z: t < at('lose') ? 1.0 : 1.12 }), smooth: 0.6, draw: (t, lt) => {
      g.fillStyle = '#4d4a44'; g.fillRect(-40, -40, 620, 620);
      paper(g, 50, 16, 440, 420, { rot: -0.01, lh: 32, top: 70 });
      const font = `400 21px ${FONTS.hand}`;
      writeText(g, 'DAY        O2 tank (kg)', 80, 56, 1, { font, color: '#1d1d1d' });
      const rows = [[1, 312.0], [2, 310.3], [3, 308.6], [10, 296.7], [20, 279.7], [30, 262.7]];
      rows.forEach(([d, v], i) => {
        const t0 = at('saw') + 0.3 + i * 0.35;
        writeText(g, String(d).padStart(2, ' '), 92, 92 + i * 27, clamp((t - t0) / 0.25), { font, color: '#283063' });
        writeText(g, v.toFixed(1), 210, 92 + i * 27, clamp((t - t0 - 0.12) / 0.3), { font, color: '#283063' });
      });
      const tm = at('math'), tl = word('lose', '1.7');
      writeText(g, '1 person: < 1 kg / day', 80, 304, clamp((t - tm - 0.4) / 1.0), { font, color: '#283063' });
      writeText(g, 'tank: −1.7 kg / day', 80, 352, clamp((t - tl + 0.1) / 0.8), { font: `700 23px ${FONTS.hand}`, color: '#b3261e' });
      if (t > tl + 0.8) {
        const u = clamp((t - tl - 0.8) / 0.6);
        g.strokeStyle = '#b3261e'; g.lineWidth = 3; g.beginPath(); g.ellipse(196, 344, 128, 26, -0.03, -0.4, -0.4 + u * Math.PI * 2.05); g.stroke();
      }
    } },
    // as if someone else was breathing my air
    { from: at('breath') - 0.1, cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 2.8, x: 300, y: 205, z: 1.25 }], draw: (t, lt) => {
      interior(g, t, { back: 'hatch', hatch: { open: 0, wheel: 1.25 }, night: 0.25 });
      stick(g, { x: 120, y: 320, t, who: 'sam', face: 'worried', dir: 1, look: 1, s: 1.55 });
    } },
    { from: at('told') - 0.1, cam: { x: 300, y: 205, z: 1.12 }, draw: (t) => {
      interior(g, t, { back: 'wall', night: 0.15 });
      radio(g, 330, 210, { ch: '4', lit: t > word('told', 'ground') + 0.5 ? 1 : 0 });
      screen(g, 160, 118, 330, 82, [{ text: 'D30 ME: O2 USE IS 2X NORMAL', u: clamp((t - at('told') - 0.1) / 0.6), color: '#ffd166' }, { text: 'D30 GROUND: COPIES. CONTINUE.', u: clamp((t - word('told', 'ground') - 0.5) / 0.7) }], { size: 13, lh: 20, pad: 10 });
      stick(g, { x: 105, y: 310, s: 1.35, t, who: 'sam', face: 'serious', look: 1 });
    } },
    // day 40, 3 a.m.
    { from: at('d40') - 0.1, cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 5, x: 200, y: 190, z: 1.25 }], draw: (t, lt) => {
      interior(g, t, { back: 'hatch', hatch: { open: 0, wheel: 1.25 }, night: 1 });
      sleepBag(g, 110, 140, 1.15, t, { face: 'sleep' });
    }, pin: (p) => {
      roundRect(p, 430, 12, 96, 36, 6); p.fillStyle = '#0b0b0b'; p.fill();
      p.fillStyle = '#ff4d3d'; p.font = `700 24px ${FONTS.mono}`; p.textAlign = 'center'; p.textBaseline = 'middle'; p.fillText('03:00', 478, 31);
    } },
    // knock 1: the hatch; knock 2: eyes open; knock 3: the hatch
    { from: KNOCKS[0] - 0.05, cam: [{ t: 0, x: 270, y: 206, z: 1.55 }, { t: 1.5, x: 270, y: 206, z: 1.65 }], kicks: [{ at: KNOCKS[0], amp: 7, decay: 10 }], draw: (t) => {
      interior(g, t, { back: 'hatch', hatch: { open: 0, wheel: 1.25 }, night: 1 });
    } },
    { from: KNOCKS[1] - 0.05, cam: { x: 110, y: 130, z: 2.2 }, kicks: [{ at: KNOCKS[1], amp: 5, decay: 10 }], draw: (t) => {
      interior(g, t, { back: 'hatch', hatch: { open: 0, wheel: 1.25 }, night: 1 });
      sleepBag(g, 110, 140, 1.15, t, { face: 'shock', look: 1 });
    } },
    { from: KNOCKS[2] - 0.05, cam: [{ t: 0, x: 270, y: 206, z: 1.75 }, { t: 1.5, x: 270, y: 206, z: 1.9 }], kicks: [{ at: KNOCKS[2], amp: 10, decay: 8 }], draw: (t) => {
      interior(g, t, { back: 'hatch', hatch: { open: 0, wheel: 1.25 }, night: 1 });
    } },
    // it came from Hatch 3 ... from a room with no air
    { from: at('from') - 0.15, cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 2.2, x: 270, y: 210, z: 1.12 }], draw: (t, lt) => {
      interior(g, t, { back: 'hatch', hatch: { open: 0, wheel: 1.25 }, night: 1 });
      const sh = stick(g, { x: 130, y: 315, t, who: 'sam', face: 'scared', pose: 'reach', s: 1.35 });
      // flashlight beam onto the hatch
      g.save(); g.globalCompositeOperation = 'lighter';
      const gr = g.createRadialGradient(270, 207, 10, 270, 207, 120);
      gr.addColorStop(0, 'rgba(255,240,200,0.42)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(sh.handF[0], sh.handF[1]); g.lineTo(380, 110); g.lineTo(380, 310); g.closePath(); g.fill();
      g.beginPath(); g.arc(270, 207, 120, 0, 7); g.fill();
      g.restore();
    } },
    { from: at('noair') - 0.1, cam: [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 2.4, x: 270, y: 217, z: 1.3 }], draw: (t) => {
      g.fillStyle = '#5c5850'; g.fillRect(-40, -40, 620, 520);
      gauge(g, 270, 210, 132, 0, { glow: 1 });
      g.fillStyle = 'rgba(8,12,34,0.55)'; g.fillRect(-40, -40, 620, 520);
      g.save(); g.globalCompositeOperation = 'lighter';
      const gr = g.createRadialGradient(250, 195, 10, 260, 205, 170);
      gr.addColorStop(0, 'rgba(255,240,200,0.5)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = gr; g.fillRect(-40, -40, 620, 520);
      g.restore();
    } },
  ];

  // smooth cameras that follow a function (letter, notebook): ease toward the target over `smooth` s
  const camFor = (shot, lt, t) => {
    if (typeof shot.cam !== 'function') return camAt(shot.cam, lt);
    const steps = 12, dt = (shot.smooth ?? 0.5) / steps;
    let c = shot.cam(Math.max(0, lt - shot.smooth), Math.max(shot.from, t - shot.smooth));
    for (let i = 1; i <= steps; i++) {
      const tt = Math.max(shot.from, t - shot.smooth + i * dt), target = shot.cam(tt - shot.from, tt), k = 0.28;
      c = { x: lerp(c.x, target.x, k), y: lerp(c.y, target.y, k), z: lerp(c.z, target.z, k) };
    }
    return c;
  };

  return function update(t) {
    g.drawImage(bg, 0, 0, W, H);
    const { shot, lt } = cut(shots, t);
    const cam = camFor(shot, lt, t);
    const kicks = shots.flatMap((s) => s.kicks ?? []);
    panel(g, cam, () => shot.draw(t, lt), { shake: shakeAt(t, kicks) });
    onPanel(g, (p) => {
      shot.pin?.(p, t, lt);
      const ds = dayStart(t);
      if (t >= ds && t < ds + 2.6) dayTag(p, dayOf(t), (t - ds) / 0.3);
      if (t > END - 0.06) { p.fillStyle = '#000'; p.fillRect(0, 0, PANEL.w, PANEL.h); }
    });
  };
}

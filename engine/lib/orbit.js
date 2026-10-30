// Alone in Orbit: the series' recurring shots and the part runner, so all 14 parts look the same.
// A shot is { from, cam, draw(g, t, lt), kicks?, pin? }: from = start time (s), cam = camera
// keys [{ t, x, y, z }] in local time (or a function (lt, t) => cam, eased by `smooth`), draw =
// the picture in panel units, kicks = shakes, pin(p, t, lt) = drawn on the panel itself.
// makePart() turns a shot list into update(t). Story: series/alone-in-orbit/story.md
import {
  PANEL, FONTS, INK, grunge, seriesText, panel, onPanel, camAt, cut, shakeAt, dayTag, roundRect,
  stick, headOnly, interior, gauge, space, earth, station, paper, writeText, screen, readouts,
  envelope, radio, sleepBag, beam, gaugeCavity, spotlight, pose,
} from './toon.js';
import { clamp, lerp, hash01, easeInOutCubic, easeOutCubic } from './util.js';
import { plants as plantsRack } from './props2d.js';

export const TITLE = ['Alone in Orbit Ep 01:', 'Day 1 to Day 365'];
export const HATCH = { open: 0, wheel: 1.25 }; // Hatch 3 as Hale left it: closed, wheel locked

/** days = [{ at, text }]: a day tag shows for 2.6 s from each `at`. */
export function makePart({ g, overlay, W, H, dpr, part, end, shots, days = [] }) {
  const bg = grunge(W, H, dpr);
  seriesText(overlay, { title: TITLE, part, to: end + 1 });
  const kicks = shots.flatMap((s) => s.kicks ?? []);
  return function update(t) {
    g.drawImage(bg, 0, 0, W, H);
    const { shot, lt } = cut(shots, t);
    panel(g, camFor(shot, lt, t), () => shot.draw(g, t, lt), { shake: shakeAt(t, kicks) });
    onPanel(g, (p) => {
      shot.pin?.(p, t, lt);
      const d = days.filter((x) => t >= x.at).at(-1);
      if (d && t < d.at + (d.hold ?? 2.6)) dayTag(p, typeof d.text === 'function' ? d.text(t) : d.text, (t - d.at) / 0.3);
      if (t > end - 0.06) { p.fillStyle = '#000'; p.fillRect(0, 0, PANEL.w, PANEL.h); }
    });
  };
}

const CENTER = { x: 270, y: 217, z: 1 };
function camFor(shot, lt, t) {
  if (!shot.cam) return CENTER;
  if (typeof shot.cam !== 'function') return camAt(shot.cam, lt);
  // follow a target smoothly: ease toward it over `smooth` seconds (pure function of t)
  const sm = shot.smooth ?? 0.5, steps = 12;
  let c = shot.cam(Math.max(0, lt - sm), Math.max(shot.from, t - sm));
  for (let i = 1; i <= steps; i++) {
    const tt = Math.max(shot.from, t - sm + (i * sm) / steps), target = shot.cam(tt - shot.from, tt);
    c = { x: lerp(c.x, target.x, 0.28), y: lerp(c.y, target.y, 0.28), z: lerp(c.z, target.z, 0.28) };
  }
  return c;
}
const val = (v, t, lt) => (typeof v === 'function' ? v(t, lt) : v);
const people = (g, list, t, lt) => (list ?? []).map((p) => stick(g, { t, ...val(p, t, lt) }));

// ---------------------------------------------------------------- places
/** Inside a module. people = [stick options or (t, lt) => options]; props(g, t, lt, figs) on top. */
export const room = (from, { back = 'wall', night = 0, alarm = 0, hatch = HATCH, people: ps, props, cam, kicks, pin } = {}) => ({
  from, cam, kicks, pin,
  draw: (g, t, lt) => {
    interior(g, t, { back, night: val(night, t, lt), alarm: val(alarm, t, lt), hatch: val(hatch, t, lt), earthRot: t * 0.01 });
    const figs = people(g, ps, t, lt);
    props?.(g, t, lt, figs);
  },
});

/** Outside: stars, the Earth below, the station. shadow 0..1 darkens everything (orbital night). */
export const outside = (from, { cam, st = {}, shadow = 0, sun = 0, props } = {}) => ({
  from, cam,
  draw: (g, t, lt) => {
    space(g, t);
    earth(g, 270, 1240, 1000, t, { rot: t * 0.004, night: 0.8 * val(shadow, t, lt) });
    station(g, st.x ?? 270, st.y ?? 175, st.s ?? 0.8, t, { rot: st.rot ?? -0.05, capsuleDocked: false, ...st });
    const sn = val(sun, t, lt);
    if (sn > 0) {
      const gr = g.createRadialGradient(470, 40, 4, 470, 40, 220);
      gr.addColorStop(0, `rgba(255,250,225,${0.95 * sn})`); gr.addColorStop(0.15, `rgba(255,236,170,${0.5 * sn})`); gr.addColorStop(1, 'rgba(255,220,150,0)');
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(-40, -40, 620, 520); g.restore();
    }
    const sh = val(shadow, t, lt);
    if (sh > 0) { g.fillStyle = `rgba(2,4,14,${0.72 * sh})`; g.fillRect(-40, -40, 620, 520); }
    props?.(g, t, lt);
  },
});

/** Hatch 3 at night with Sam's flashlight on it (beam from the left). */
export const hatchNight = (from, { cam, kicks, pin, sam = null, light = 1, props, hatch = HATCH } = {}) => ({
  from, cam, kicks, pin,
  draw: (g, t, lt) => {
    interior(g, t, { back: 'hatch', hatch: val(hatch, t, lt), night: 1 });
    const figs = sam ? people(g, [sam], t, lt) : [];
    const l = val(light, t, lt);
    if (l > 0) beam(g, figs[0]?.handF[0] ?? -40, figs[0]?.handF[1] ?? 330, 270, 207, 120, 0.42 * l);
    props?.(g, t, lt);
  },
});

/** The Hatch 3 gauge, reading v (kPa); dark = at night under a flashlight. */
export const gaugeShot = (from, { v = 0, dark = true, cam } = {}) => ({
  from, cam: cam ?? [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 2.4, x: 270, y: 217, z: 1.3 }],
  draw: (g, t, lt) => {
    g.fillStyle = dark ? '#5c5850' : '#d8d1c3'; g.fillRect(-40, -40, 620, 520);
    gauge(g, 270, 210, 132, val(v, t, lt), { glow: dark ? 1 : 0 });
    if (dark) {
      g.fillStyle = 'rgba(8,12,34,0.55)'; g.fillRect(-40, -40, 620, 520);
      g.save(); g.globalCompositeOperation = 'lighter';
      const gr = g.createRadialGradient(250, 195, 10, 260, 205, 170);
      gr.addColorStop(0, 'rgba(255,240,200,0.5)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = gr; g.fillRect(-40, -40, 620, 520);
      g.restore();
    }
  },
});

/** Sam in his sleeping bag, at night (face: 'sleep' | 'calm' | 'shock' | 'worried'). */
export const bagShot = (from, { face = 'sleep', cam, kicks, pin, look = 0 } = {}) => ({
  from, cam: cam ?? [{ t: 0, x: 200, y: 190, z: 1.25 }, { t: 3, x: 180, y: 175, z: 1.4 }], kicks, pin,
  draw: (g, t, lt) => {
    interior(g, t, { back: 'hatch', hatch: HATCH, night: 1 });
    sleepBag(g, 110, 140, 1.15, t, { face: val(face, t, lt), look });
  },
});

/** A big face (close-up). */
export const faceShot = (from, { who = 'sam', face = 'worried', look = 0.4, night = 0, cam } = {}) => ({
  from, cam: cam ?? [{ t: 0, x: 270, y: 210, z: 1.0 }, { t: 3, x: 270, y: 205, z: 1.1 }],
  draw: (g, t, lt) => {
    interior(g, t, { back: 'hatch', hatch: HATCH, night: val(night, t, lt) });
    g.fillStyle = 'rgba(20,20,30,0.35)'; g.fillRect(-400, -400, 1400, 1300);
    headOnly(g, { x: 270, y: 215, s: 5.4, who, face: val(face, t, lt), t, look });
  },
});

/** Ground on the radio: screen lines [{ text, at, color, dur }] typed in at their times. */
export const radioShot = (from, { ch = '4', lines = [], lit = [], lamp9 = 0, sam = { x: 105, y: 310, s: 1.35, face: 'calm', look: 1 }, night = 0, cam, pin } = {}) => ({
  from, pin, cam: cam ?? [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 5, x: 290, y: 205, z: 1.12 }],
  draw: (g, t, lt) => {
    interior(g, t, { back: 'wall', night: val(night, t, lt) });
    const on = lit.some(([a, b]) => t >= a && t < b);
    const shown = lines.filter((l) => t >= l.at).slice(-2);
    screen(g, 150, 112, 350, 86, shown.map((l) => ({ text: l.text, color: l.color, u: clamp((t - l.at) / (l.dur ?? 0.8)) })), { size: 12.5, lh: 22, pad: 10 });
    radio(g, 330, 210, { ch: val(ch, t, lt), lit: on ? 1 : 0, lamp9: val(lamp9, t, lt) });
    if (sam) people(g, [sam], t, lt);
  },
});

// ---------------------------------------------------------------- paper
/**
 * Handwriting on paper: lines [{ text, at, dur, x, y, size, color, underline, font }].
 * follow = the camera follows the line being written.
 */
export const paperShot = (from, { lines = [], sheet = { x: 30, y: 22, w: 480, h: 390 }, bgColor = '#4d4a44', size = 31, font = 'letter', follow = false, cam, rot = -0.006, ruled = true, lh = 46, top = 68, props } = {}) => ({
  from,
  cam: follow ? (lt, t) => {
    const cur = lines.filter((l) => t >= l.at - 0.1).at(-1) ?? lines[0];
    return { x: 270, y: clamp(cur.y + 10, 205, sheet.y + sheet.h - 207), z: 1.0 };
  } : cam,
  smooth: 0.5,
  draw: (g, t, lt) => {
    g.fillStyle = bgColor; g.fillRect(-40, -40, 620, sheet.y + sheet.h + 200);
    paper(g, sheet.x, sheet.y, sheet.w, sheet.h, { rot, lh, top, lines: ruled });
    for (const l of lines) {
      const u = clamp((t - l.at) / (l.dur ?? Math.max(0.5, l.text.length * 0.05)));
      const f = l.font ?? (font === 'letter' ? `500 italic ${l.size ?? size}px ${FONTS.letter}` : `${l.bold ? 700 : 400} ${l.size ?? size}px ${FONTS.hand}`);
      const w = writeText(g, l.text, l.x ?? sheet.x + 26, l.y, u, { font: f, color: l.color ?? '#222a5c', align: l.align ?? 'left' });
      if (l.underline && u >= 1) {
        for (let k = 0; k < (l.underline === 2 ? 2 : 1); k++) {
          const v = clamp((t - (l.ulAt ?? l.at + (l.dur ?? 0.8)) - k * 0.35) / 0.35);
          const x0 = l.x ?? sheet.x + 26;
          g.strokeStyle = l.color ?? '#222a5c'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, l.y + 7 + k * 6); g.lineTo(x0 + w * v, l.y + 6 + k * 6); g.stroke();
        }
      }
    }
    props?.(g, t, lt);
  },
});

/** Hale's envelopes in their box: envelopes n..12 left, envelope n rising out of it. */
export const envelopesShot = (from, { n, rise = n, cam } = {}) => ({
  from, cam: cam ?? [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 2.5, x: 270, y: 200, z: 1.1 }],
  draw: (g, t, lt) => {
    g.fillStyle = '#5a4a3a'; g.fillRect(-40, -40, 620, 520);
    roundRect(g, 70, 165, 420, 215, 10); g.fillStyle = '#8a6a4a'; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
    for (let i = 12; i >= n; i--) {
      const up = i === rise ? easeInOutCubic(clamp((lt - 0.8) / 1.0)) * 70 : 0;
      envelope(g, 112 + (i - 1) * 30, 165 - up, 58, 92, { n: String(i), rot: i === rise ? -0.1 * clamp(up / 70) : 0 });
    }
    g.fillStyle = '#6e5238'; g.fillRect(70, 215, 420, 165);
    g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(70, 215, 420, 165);
  },
});

/** An envelope's note: big handwriting, signed "— H.". lines = [{ text, at, underline }]. */
export const noteShot = (from, { lines, sign, size = 30, lh = 44, top = 66, y0 = 128 } = {}) => paperShot(from, {
  sheet: { x: 60, y: 70, w: 420, h: 290 }, rot: 0.02, lh, top, size,
  cam: [{ t: 0, x: 270, y: 217, z: 1.05 }, { t: 4, x: 270, y: 210, z: 1.15 }],
  lines: [
    ...lines.map((l, i) => ({ x: 92, y: y0 + i * lh, ...l })), // above the caption band
    ...(sign ? [{ text: '— H.', at: sign, x: 360, y: 330, size: 26 }] : []),
  ],
});

/** The three morning numbers. items = [{ label, value, at }]. */
export const readoutsShot = (from, { items }) => ({
  from, cam: CENTER,
  draw: (g, t) => {
    g.fillStyle = '#2b2e34'; g.fillRect(-40, -40, 620, 520);
    readouts(g, 30, 96, items.map((it) => ({ ...it, value: val(it.value, t), u: (t - it.at + 0.1) / 0.3 })), { w: 150, h: 130, gap: 15 });
  },
});

/** A wall calendar: days 1..maxDay of a 7-column grid crossed off up to `upTo`, with red circles. */
export const calendarShot = (from, { first, upTo, circle = [], cam } = {}) => ({
  from, cam: cam ?? [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 270, y: 217, z: 1.08 }],
  draw: (g, t, lt) => {
    g.fillStyle = '#4d4a44'; g.fillRect(-40, -40, 620, 520);
    paper(g, 40, 18, 460, 398, { lines: false });
    g.fillStyle = '#b3261e'; g.fillRect(40, 18, 460, 44);
    g.fillStyle = '#fff'; g.font = `900 22px ${FONTS.display}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(`DAY ${first} – ${first + 34}`, 270, 41);
    const cross = val(upTo, t, lt);
    for (let i = 0; i < 35; i++) {
      const d = first + i, cx = 74 + (i % 7) * 65, cy = 96 + Math.floor(i / 7) * 64;
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; g.strokeRect(cx - 30, cy - 30, 62, 62);
      g.fillStyle = '#333'; g.font = `400 19px ${FONTS.hand}`; g.fillText(String(d), cx, cy);
      if (d <= cross) {
        const u = clamp(cross - d + 1);
        g.strokeStyle = '#283063'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(cx - 18, cy - 18); g.lineTo(cx - 18 + 36 * u, cy - 18 + 36 * u); g.stroke();
        if (u > 0.5) { g.beginPath(); g.moveTo(cx + 18, cy - 18); g.lineTo(cx + 18 - 36 * (u - 0.5) * 2, cy - 18 + 36 * (u - 0.5) * 2); g.stroke(); }
      }
      for (const c of circle) if (c.day === d && t >= c.at) {
        const v = clamp((t - c.at) / 0.6);
        g.strokeStyle = '#c0261c'; g.lineWidth = 3.5; g.beginPath(); g.ellipse(cx, cy, 26, 24, 0, -1.2, -1.2 + v * Math.PI * 2.1); g.stroke();
        if (c.label && v >= 1) { g.fillStyle = '#c0261c'; g.font = `700 14px ${FONTS.hand}`; g.fillText(c.label, cx, cy + 22); }
      }
    }
  },
});

/**
 * The station plan: our side | Hatch 3 | Module 3. open(t) 0..1 opens the hatch in the plan; with
 * vacuum on the far side the air streams out of our side (dots) and the pressure falls.
 */
export const planShot = (from, { open = 0, red = false, redLeft = false, airRight = 0, labels = ['OUR SIDE', 'MODULE 3'], leftKpa = true, rightText = '0 kPa ?', cam } = {}) => ({
  from, cam: cam ?? CENTER,
  draw: (g, t, lt) => {
    g.fillStyle = '#0e2a4a'; g.fillRect(-40, -40, 620, 520);
    g.strokeStyle = 'rgba(140,190,255,0.18)'; g.lineWidth = 1;
    for (let x = 0; x < 540; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 434); g.stroke(); }
    for (let y = 0; y < 434; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(540, y); g.stroke(); }
    const u = clamp(val(open, t, lt));
    const half = (x, label, fill) => {
      roundRect(g, x, 110, 200, 110, 46); g.fillStyle = fill; g.fill(); g.strokeStyle = '#d6e8ff'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#e8f2ff'; g.font = `900 21px ${FONTS.display}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, x + 100, 90);
    };
    const blink = 0.5 + 0.5 * Math.sin(t * 9);
    half(40, labels[0], redLeft ? `rgba(230,40,40,${0.35 + 0.4 * blink})` : 'rgba(140,190,255,0.12)');
    half(300, labels[1], red ? 'rgba(230,40,40,0.35)' : 'rgba(0,0,0,0.45)');
    // Hatch 3 between them: a door that swings open
    g.fillStyle = '#16365c'; g.fillRect(240, 140, 60, 50); g.strokeStyle = '#ffd34d'; g.lineWidth = 3; g.strokeRect(240, 140, 60, 50);
    g.save(); g.translate(270, 140); g.rotate(-u * 1.3); g.fillStyle = '#ffd34d'; g.fillRect(-3, 0, 6, 50); g.restore();
    g.fillStyle = '#ffd34d'; g.font = `900 13px ${FONTS.display}`; g.textAlign = 'center'; g.fillText('HATCH 3', 270, 210);
    // air: dots on our side; with the hatch open they stream right and out
    let left = 0;
    for (let i = 0; i < 70; i++) {
      const hx = hash01(i, 3), hy = hash01(i, 4), delay = hash01(i, 5) * 0.7;
      const x0 = 62 + hx * 156, y0 = 126 + hy * 78;
      const m = Math.max(0, u - delay) * 4;
      const x = x0 + m * m * 260, y = lerp(y0, 165, clamp(m * 0.8));
      if (x > 520) continue;
      if (x < 236) left++;
      g.fillStyle = 'rgba(160,215,255,0.85)'; g.beginPath(); g.arc(x + 2 * Math.sin(t * 2 + i), y + 2 * Math.cos(t * 1.7 + i), 3.2, 0, 7); g.fill();
    }
    // air on the far side too (it was never vacuum)
    const ar = val(airRight, t, lt);
    for (let i = 0; i < 70 * ar; i++) {
      const x = 322 + hash01(i, 13) * 156, y = 126 + hash01(i, 14) * 78;
      g.fillStyle = 'rgba(160,215,255,0.85)'; g.beginPath(); g.arc(x + 2 * Math.sin(t * 2 + i), y + 2 * Math.cos(t * 1.7 + i), 3.2, 0, 7); g.fill();
    }
    g.font = `800 19px ${FONTS.mono}`; g.textAlign = 'center';
    g.fillStyle = '#9fd0ff'; if (leftKpa) g.fillText(`${Math.round(101 * left / 70)} kPa`, 140, 335);
    g.fillStyle = '#ff8a7a'; g.fillText(rightText, 400, 335);
  },
});

/** The gauge plate on the wall: screws come out one by one (screwsAt), then it lifts away (liftAt). */
export const plateShot = (from, { screwsAt = [], liftAt = Infinity, cam } = {}) => ({
  from, cam: cam ?? [{ t: 0, x: 270, y: 217, z: 1.0 }, { t: 3, x: 270, y: 217, z: 1.1 }],
  draw: (g, t, lt) => {
    g.fillStyle = '#d8d1c3'; g.fillRect(-40, -40, 620, 520);
    g.fillStyle = '#c9c2b2'; g.fillRect(-40, 380, 620, 120);
    const lift = easeInOutCubic(clamp((t - liftAt) / 0.8));
    // the hole behind (seen as the plate comes off)
    roundRect(g, 120, 60, 300, 300, 18); g.fillStyle = '#2b2925'; g.fill();
    g.save(); g.translate(lift * 330, -lift * 40); g.rotate(lift * 0.35);
    roundRect(g, 115, 55, 310, 310, 20); g.fillStyle = '#a49e91'; g.fill(); g.strokeStyle = '#6a655c'; g.lineWidth = 4; g.stroke();
    gauge(g, 270, 205, 118, 0);
    for (const [i, [sx, sy]] of [[145, 85], [395, 85], [395, 335], [145, 335]].entries()) {
      const u = clamp((t - (screwsAt[i] ?? Infinity)) / 0.6);
      g.save(); g.translate(sx + u * 26 * (sx < 270 ? -1 : 1), sy + u * 30); g.rotate(u * 8); g.globalAlpha = 1 - clamp((u - 0.7) / 0.3);
      g.fillStyle = '#d9d6cc'; g.beginPath(); g.arc(0, 0, 11, 0, 7); g.fill(); g.strokeStyle = '#555'; g.lineWidth = 2; g.stroke();
      g.beginPath(); g.moveTo(-6, 0); g.lineTo(6, 0); g.moveTo(0, -6); g.lineTo(0, 6); g.stroke();
      g.restore();
    }
    g.restore();
  },
});

/** How a gauge works: the wall in section, a sensor in Module 3, a wire, the dial on our side. */
export const sensorShot = (from, { cut = Infinity, cam } = {}) => ({
  from, cam: cam ?? CENTER,
  draw: (g, t, lt) => {
    g.fillStyle = '#0e2a4a'; g.fillRect(-40, -40, 620, 520);
    g.fillStyle = 'rgba(140,190,255,0.1)'; g.fillRect(0, 60, 230, 300);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(310, 60, 230, 300);
    g.fillStyle = '#5d6a7a'; g.fillRect(230, 40, 80, 340); g.strokeStyle = '#d6e8ff'; g.lineWidth = 2; g.strokeRect(230, 40, 80, 340);
    g.fillStyle = '#e8f2ff'; g.font = `900 19px ${FONTS.display}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('OUR SIDE', 115, 40); g.fillText('WALL', 270, 24); g.fillText('MODULE 3', 425, 40);
    // dial on our side, sensor on theirs, wire through the wall
    g.fillStyle = '#f4f1e8'; g.beginPath(); g.arc(120, 130, 38, 0, 7); g.fill(); g.strokeStyle = '#d6e8ff'; g.lineWidth = 3; g.stroke();
    g.strokeStyle = '#c42b22'; g.lineWidth = 3; g.beginPath(); g.moveTo(120, 130); g.lineTo(98, 152); g.stroke();
    g.fillStyle = '#e8f2ff'; g.font = `800 15px ${FONTS.display}`; g.fillText('GAUGE', 120, 190);
    roundRect(g, 390, 110, 64, 40, 8); g.fillStyle = '#ffd34d'; g.fill(); g.fillStyle = '#0e2a4a'; g.font = `900 13px ${FONTS.display}`; g.fillText('SENSOR', 422, 131);
    g.strokeStyle = '#ffd34d'; g.lineWidth = 4; g.setLineDash(t > cut ? [10, 8] : []);
    g.beginPath(); g.moveTo(158, 130); g.lineTo(390, 130); g.stroke(); g.setLineDash([]);
    // the reading travelling along the wire, sensor -> dial
    if (t < cut) {
      const u = ((t - from) * 0.8) % 1;
      g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(lerp(390, 160, u), 130, 6, 0, 7); g.fill();
    }
  },
});

/** Behind the gauge: the cable, followed by the flashlight; reveal(t) 0..1 along the cable. */
export const cavityShot = (from, { reveal = 1, cam } = {}) => ({
  from, cam,
  draw: (g, t, lt) => {
    const [bx, by] = gaugeCavity(g, 270, 210, t, { reveal: val(reveal, t, lt), light: 1 });
    spotlight(g, bx, by, 78, 0.86);
  },
});

/** Any custom picture: draw(g, t, lt). */
export const shot = (from, cam, draw, extra = {}) => ({ from, cam, draw, ...extra });

/** Both sides of Hatch 3 in section: Sam on the left, Mara on the right, the bulkhead between. */
export const splitShot = (from, { sam = {}, mara = {}, night = 1, cam, pin, kicks, props } = {}) => ({
  from, cam: cam ?? CENTER, pin, kicks,
  draw: (g, t, lt) => {
    g.fillStyle = '#d9d2c4'; g.fillRect(-60, -60, 330, 560);
    g.fillStyle = '#cfd6d9'; g.fillRect(270, -60, 330, 560);
    g.fillStyle = '#b7af9e'; g.fillRect(-60, 360, 660, 140);
    for (const [x0, col] of [[20, '#c9c2b2'], [330, '#bcc5c9']]) for (let k = 0; k < 3; k++) { roundRect(g, x0 + k * 62, 60, 52, 90, 5); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1.2; g.stroke(); }
    // the bulkhead and Hatch 3 seen edge-on
    g.fillStyle = '#8e897e'; g.fillRect(256, -60, 28, 560); g.strokeStyle = INK; g.lineWidth = 2.5; g.strokeRect(256, -60, 28, 560);
    g.fillStyle = '#c9c3b6'; g.fillRect(252, 120, 36, 170); g.strokeRect(252, 120, 36, 170);
    g.fillStyle = '#b8352c'; g.font = `900 22px ${FONTS.display}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('3', 270, 205);
    const n = val(night, t, lt);
    if (n > 0) { g.fillStyle = `rgba(8,12,34,${0.6 * n})`; g.fillRect(-60, -60, 660, 560); }
    stick(g, { t, x: 170, y: 300, s: 1.35, who: 'sam', pose: 'push', face: 'worried', floaty: 0.3, ...val(sam, t, lt) });
    stick(g, { t, x: 370, y: 300, s: 1.35, who: 'mara', pose: 'push', face: 'worried', floaty: 0.3, dir: -1, phase: 2, ...val(mara, t, lt) });
    props?.(g, t, lt);
  },
});

/** Mara's half: the same module, cooler light, her plants. people = stick options. */
export const maraRoom = (from, { back = 'wall', night = 0, alarm = 0, hatch = HATCH, people: ps, props, cam, pin, kicks, plantsAt } = {}) => ({
  from, cam, pin, kicks,
  draw: (g, t, lt) => {
    interior(g, t, { back, night: 0, alarm: val(alarm, t, lt), seed: 9, hatch: val(hatch, t, lt) });
    const [px, py] = plantsAt ?? (back === 'wall' ? [150, 220] : [330, 300]);
    plantsRack(g, px, py, t, { w: back === 'wall' ? 240 : 160 });
    g.fillStyle = 'rgba(120,170,220,0.12)'; g.fillRect(-400, -400, 1400, 1300);
    const n = val(night, t, lt);
    if (n > 0) { g.fillStyle = `rgba(8,12,34,${0.72 * n})`; g.fillRect(-400, -400, 1400, 1300); }
    const figs = people(g, ps, t, lt);
    props?.(g, t, lt, figs);
  },
});

/** Morse marks appearing as the knocks land: marks = [{ at, sym: '.' | '-' }]; letters under groups. */
export const morseMarks = (g, t, marks, { x = 270, y = 80, letters = [], gap = 44, groupGap = 34 } = {}) => {
  if (!marks.some((m) => t >= m.at)) return;
  // positions: marks flow left to right, an extra gap before each new group
  const xs = [], groups = [];
  let cx = 0;
  marks.forEach((m, i) => {
    cx += (i ? gap : 0) + (m.group && i ? groupGap : 0);
    xs.push(cx);
    if (!i || m.group) groups.push([]);
    groups.at(-1).push(cx);
  });
  const shift = x - cx / 2;
  g.save();
  marks.forEach((m, i) => {
    if (t < m.at) return;
    const px = xs[i] + shift, pop = easeOutCubic(clamp((t - m.at) / 0.15));
    g.lineCap = 'round';
    for (const [col, w] of [['rgba(0,0,0,0.75)', 17], [`rgba(255,236,170,${pop})`, 11]]) {
      g.fillStyle = col; g.strokeStyle = col; g.lineWidth = w;
      if (m.sym === '.') { g.beginPath(); g.arc(px, y, (w / 2 + 1) * pop, 0, 7); g.fill(); } else { const hl = Math.min(11, gap * 0.25); g.beginPath(); g.moveTo(px - hl * pop, y); g.lineTo(px + hl * pop, y); g.stroke(); }
    }
  });
  // letters: under a group (group: k) or at an explicit x
  for (const l of letters) if (t >= l.at) {
    const gx = l.group !== undefined ? (groups[l.group][0] + groups[l.group].at(-1)) / 2 + shift : l.x;
    g.fillStyle = '#ffec9a'; g.font = `900 38px ${FONTS.display}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.globalAlpha = clamp((t - l.at) / 0.2); g.fillText(l.text, gx, y + 50); g.globalAlpha = 1;
  }
  g.restore();
};

/** A small digital clock pinned to the panel's top-right corner. */
export const clockPin = (text) => (p, t, lt) => {
  const s = val(text, t, lt);
  roundRect(p, 430, 12, 96, 36, 6); p.fillStyle = '#0b0b0b'; p.fill();
  p.fillStyle = '#ff4d3d'; p.font = `700 24px ${FONTS.mono}`; p.textAlign = 'center'; p.textBaseline = 'middle'; p.fillText(s, 478, 31);
};

/** Oxygen in the tank on a given day (story.md: 312.0 kg on Day 3, −1.7 kg/day until Day 120). */
export const tankKg = (day) => Math.max(0, 312 - 1.7 * (Math.min(day, 120) - 3));
/** Water % (−0.2%/day; −0.3%/day once the oxygen generator runs from Day 120). */
export const waterPct = (day) => (day <= 120 ? 97 - 0.2 * (day - 3) : 73.6 - 0.3 * (day - 120));

export { stick, headOnly, interior, roundRect, FONTS, INK, beam, pose, lerp, clamp, easeInOutCubic, easeOutCubic };

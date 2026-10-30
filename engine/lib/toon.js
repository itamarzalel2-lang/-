// Flat 2D cartoon kit for the cliffhanger series ("<Series> Ep 01: Day 1 to Day 365", Part.N).
// The look follows the reference series: a green grunge frame, a black title band, a centred
// panel with a dark vignette, stick figures, handwritten letters, single-word captions.
// Everything is a pure function of t (no Math.random: rng/hash01 from util.js).
//
// Units: the stage is 540x960 (rendered at 2x). Scenes draw inside the panel in its own units,
// 540 x 434, origin at the panel's top-left; panel(g, cam, fn) clips, applies the camera and
// adds the vignette.
import { hash01, rng, clamp, lerp, smoothstep, easeInOutCubic, easeOutBack } from './util.js';

export const PANEL = { x: 0, y: 272, w: 540, h: 434 };
export const INK = '#151515';
const DEG = Math.PI / 180;
const MONO = '"DejaVu Sans Mono", monospace';
export const FONTS = { display: '"Nunito", sans-serif', hand: '"Kalam", cursive', letter: '"Cormorant Garamond", serif', mono: MONO };

export async function loadFonts() {
  await Promise.all(['900 20px Nunito', '800 20px Nunito', '400 20px Kalam', '700 20px Kalam', 'italic 500 20px "Cormorant Garamond"'].map((f) => document.fonts.load(f)));
}

// ---------------------------------------------------------------- narration timing
/** Times from voice.json: at(id) / end(id) of a line, word(id, n | 'prefix') of a word. */
export function narration(voice) {
  const by = Object.fromEntries(voice.lines.map((l) => [l.id, l]));
  const need = (id) => by[id] ?? (() => { throw new Error(`no narration line '${id}'`); })();
  return {
    by,
    at: (id) => need(id).at,
    end: (id) => need(id).at + need(id).duration,
    word: (id, w) => {
      const l = need(id);
      const i = typeof w === 'number' ? w : l.words.findIndex((x) => x.text.toLowerCase().replace(/[^a-z0-9.]/g, '').startsWith(w));
      if (i < 0 || !l.words[i]) throw new Error(`no word '${w}' in line '${id}'`);
      return l.at + l.words[i].start;
    },
    last: voice.lines.at(-1),
  };
}

// ---------------------------------------------------------------- frame, title band, panel
/** The DOM title band and "Part.N" tag (drawn in the fast text pass). */
export function seriesText(overlay, { title, part, to = 9999 }) {
  const band = document.createElement('div');
  band.className = 'ser-title';
  band.innerHTML = title.map((l) => `<span>${l}</span>`).join('');
  overlay.add(band, { from: 0, to, fadeIn: 0, fadeOut: 0, enter: 'none' });
  const tag = document.createElement('div');
  tag.className = 'ser-part';
  tag.textContent = `Part.${part}`;
  overlay.add(tag, { from: 0, to, fadeIn: 0, fadeOut: 0, enter: 'none' });
}

/** Green grunge background, rendered once. */
export function grunge(W, H, dpr, seed = 7) {
  const c = Object.assign(document.createElement('canvas'), { width: W * dpr, height: H * dpr });
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  let gr = g.createRadialGradient(W * 0.5, 120, 10, W * 0.5, 200, 520);
  gr.addColorStop(0, '#9fd640'); gr.addColorStop(0.35, '#5aa72a'); gr.addColorStop(1, '#1f6416');
  g.fillStyle = gr; g.fillRect(0, 0, W, H / 2);
  gr = g.createRadialGradient(W * 0.5, 800, 10, W * 0.5, 820, 560);
  gr.addColorStop(0, '#3c9a2c'); gr.addColorStop(0.5, '#2b7d20'); gr.addColorStop(1, '#174f11');
  g.fillStyle = gr; g.fillRect(0, H / 2, W, H / 2);
  const r = rng(seed);
  // mottled grunge: soft blobs, flecks and scratches
  for (let i = 0; i < 2600; i++) {
    const x = r() * W, y = r() * H, s = 2 + r() ** 3 * 40, light = r() < 0.45;
    g.fillStyle = light ? `rgba(220,255,150,${0.02 + r() * 0.04})` : `rgba(0,30,0,${0.025 + r() * 0.05})`;
    g.beginPath(); g.ellipse(x, y, s, s * (0.5 + r()), r() * 3, 0, 7); g.fill();
  }
  for (let i = 0; i < 260; i++) {
    const x = r() * W, y = r() * H;
    g.strokeStyle = `rgba(${r() < 0.5 ? '230,255,170' : '0,25,0'},${0.05 + r() * 0.07})`;
    g.lineWidth = 0.6 + r();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 40, y + (r() - 0.5) * 12); g.stroke();
  }
  gr = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,20,0,0.45)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return c;
}

/**
 * Draw inside the panel. cam = { x, y, z } is the panel point shown at the centre and the zoom;
 * shake = [dx, dy]. fn(g) draws in panel units. The vignette goes on top.
 */
export function panel(g, cam, fn, { shake = [0, 0], vignette = 0.62 } = {}) {
  const { x, y, w, h } = PANEL;
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = '#000'; g.fillRect(x, y, w, h);
  g.save();
  g.translate(x + w / 2 + shake[0], y + h / 2 + shake[1]);
  g.scale(cam.z ?? 1, cam.z ?? 1);
  g.translate(-(cam.x ?? w / 2), -(cam.y ?? h / 2));
  fn(g);
  g.restore();
  if (vignette) {
    const gr = g.createRadialGradient(x + w / 2, y + h / 2, h * 0.32, x + w / 2, y + h / 2, w * 0.72);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${vignette})`);
    g.fillStyle = gr; g.fillRect(x, y, w, h);
  }
  g.restore();
}

/** Things pinned to the panel, not the camera (a day tag, a black fade). fn gets panel units. */
export function onPanel(g, fn) {
  g.save();
  g.beginPath(); g.rect(PANEL.x, PANEL.y, PANEL.w, PANEL.h); g.clip();
  g.translate(PANEL.x, PANEL.y);
  fn(g);
  g.restore();
}

/** Camera keyframes [{ t, x, y, z }] -> cam at local time lt (eased between keys). */
export function camAt(keys, lt) {
  if (!Array.isArray(keys)) return keys;
  if (lt <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (lt <= b.t) {
      const u = easeInOutCubic((lt - a.t) / (b.t - a.t || 1));
      return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u) };
    }
  }
  return keys.at(-1);
}

/** Hard cuts: shots = [{ from, ... }] sorted by from. Returns the active shot and its local time. */
export function cut(shots, t) {
  let s = shots[0];
  for (const x of shots) if (t >= x.from) s = x;
  return { shot: s, lt: t - s.from };
}

/** Decaying shake from impacts: kicks = [{ at, amp, decay }]. */
export function shakeAt(t, kicks) {
  let dx = 0, dy = 0;
  for (const k of kicks) {
    const u = t - k.at;
    if (u < 0 || u > 1.5) continue;
    const e = k.amp * Math.exp(-(k.decay ?? 9) * u);
    dx += e * Math.sin(u * 83 + k.at); dy += e * Math.cos(u * 71 + k.at * 2);
  }
  return [dx, dy];
}

export function dayTag(g, text, u = 1) {
  if (u <= 0) return;
  const s = 0.6 + 0.4 * easeOutBack(clamp(u));
  g.save();
  g.font = `900 17px ${FONTS.display}`;
  const w = g.measureText(text).width + 18;
  g.translate(14 + w / 2, 24); g.scale(s, s);
  g.globalAlpha = clamp(u * 3);
  roundRect(g, -w / 2, -14, w, 28, 7); g.fillStyle = '#000'; g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 0, 1);
  g.restore();
}

// ---------------------------------------------------------------- drawing helpers
export function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
export function poly(g, pts, fill, stroke, lw = 2) {
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
function line(g, a, b) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
const qmap = (q, u, v) => {
  // bilinear point in quad q = [topA, topB, bottomB, bottomA]
  const top = [lerp(q[0][0], q[1][0], u), lerp(q[0][1], q[1][1], u)];
  const bot = [lerp(q[3][0], q[2][0], u), lerp(q[3][1], q[2][1], u)];
  return [lerp(top[0], bot[0], v), lerp(top[1], bot[1], v)];
};
const subquad = (q, u0, u1, v0, v1) => [qmap(q, u0, v0), qmap(q, u1, v0), qmap(q, u1, v1), qmap(q, u0, v1)];

/** Text revealed left to right (u = 0..1), like being written. */
export function writeText(g, text, x, y, u, { font, color = '#2b2f55', align = 'left' } = {}) {
  if (u <= 0) return 0;
  g.save();
  g.font = font; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'alphabetic';
  const w = g.measureText(text).width;
  const x0 = align === 'center' ? x - w / 2 : x;
  if (u < 1) { g.beginPath(); g.rect(x0 - 4, y - 60, (w + 8) * u, 90); g.clip(); }
  g.fillText(text, x, y);
  g.restore();
  return w;
}

// ---------------------------------------------------------------- stick figures
export const CAST = {
  sam: { hair: '#3b2a1f', style: 'messy' },
  hale: { hair: '#a7a7a7', style: 'flat', mustache: '#6d6d6d' },
  ortiz: { hair: '#1f1a17', style: 'curly' },
  mara: { hair: '#b8642c', style: 'pony' },
};

// absolute segment angles in degrees: 0 = straight down, +90 = forward (the way the figure faces)
// a = [back upper arm, back forearm, front upper arm, front forearm], l = same for the legs
export const POSES = {
  stand: { a: [-8, -4, 8, 4], l: [-6, -2, 6, 2], lean: 0 },
  float: { a: [-50, -95, 42, 92], l: [-12, 10, 16, 42], lean: 6 },
  reach: { a: [-35, -70, 105, 96], l: [-12, 12, 16, 40], lean: 12 },
  hold: { a: [42, 98, 58, 104], l: [-10, 8, 14, 34], lean: 4 },
  push: { a: [78, 88, 70, 84], l: [-40, -20, -24, -6], lean: 24 },
  sit: { a: [18, 64, 30, 74], l: [84, 8, 92, 14], lean: -6 },
  shock: { a: [-70, -150, 70, 150], l: [-16, 4, 18, 8], lean: -4 },
  tuck: { a: [30, 120, 40, 130], l: [60, -20, 70, -10], lean: 8 },
};
export const pose = (a, b, u) => {
  const A = POSES[a] ?? a, B = POSES[b] ?? b;
  return { a: A.a.map((x, i) => lerp(x, B.a[i], u)), l: A.l.map((x, i) => lerp(x, B.l[i], u)), lean: lerp(A.lean, B.lean, u) };
};

/**
 * A stick figure. x, y = hips. s = scale. face: calm | worried | shock | sleep | serious | sad | scared.
 * floaty = zero-g sway amount (0 for standing/sitting). Returns joint positions (hands, head).
 */
export function stick(g, { x, y, s = 1, who = 'sam', pose: p = 'float', face = 'calm', look = 0, t = 0, floaty = 1, dir = 1, phase = 0, blink = true }) {
  const P = POSES[p] ?? p;
  const sw = (k, a) => floaty * a * Math.sin(t * (0.9 + 0.13 * k) + phase + k * 1.7);
  const a = P.a.map((v, i) => v + sw(i, 7));
  const l = P.l.map((v, i) => v + sw(i + 4, 5));
  const lean = (P.lean + sw(9, 3)) * DEG;
  const bob = floaty * 4 * Math.sin(t * 0.8 + phase);
  const R = 17, B = 44, UA = 22, FA = 21, UL = 27, LL = 27;
  const d = (deg) => [Math.sin(deg * DEG) * dir, Math.cos(deg * DEG)];
  const add = (p0, v, k) => [p0[0] + v[0] * k, p0[1] + v[1] * k];
  g.save();
  g.translate(x, y + bob); g.scale(s, s);
  const hip = [0, 0];
  const up = [Math.sin(lean) * dir, -Math.cos(lean)];
  const neck = add(hip, up, B);
  const sh = add(hip, up, B * 0.86);
  const head = add(neck, up, R + 1);
  const limbs = (o, ang, L1, L2) => { const m = add(o, d(ang[0]), L1); return [o, m, add(m, d(ang[1]), L2)]; };
  const armB = limbs(sh, a.slice(0, 2), UA, FA), armF = limbs(sh, a.slice(2), UA, FA);
  const legB = limbs(hip, l.slice(0, 2), UL, LL), legF = limbs(hip, l.slice(2), UL, LL);
  g.strokeStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 3.4;
  const seg = (pts) => { g.beginPath(); g.moveTo(...pts[0]); g.lineTo(...pts[1]); g.lineTo(...pts[2]); g.stroke(); };
  seg(armB); seg(legB);
  line(g, hip, neck);
  seg(legF); seg(armF);
  drawHead(g, head[0], head[1], R, CAST[who] ?? CAST.sam, face, look, dir, t, blink, phase);
  g.restore();
  const world = (pt) => [x + pt[0] * s, y + bob + pt[1] * s];
  return { handF: world(armF[2]), handB: world(armB[2]), head: world(head), hip: [x, y + bob] };
}

/** Just a head (close-ups, a face poking out of a sleeping bag). */
export function headOnly(g, { x, y, s = 1, who = 'sam', face = 'calm', look = 0, dir = 1, t = 0, blink = true, phase = 0 }) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.lineCap = 'round'; g.lineJoin = 'round';
  drawHead(g, 0, 0, 17, CAST[who] ?? CAST.sam, face, look, dir, t, blink, phase);
  g.restore();
}

function drawHead(g, hx, hy, R, c, face, look, dir, t, blink, phase) {
  // back hair (ponytail floats up in zero-g)
  if (c.style === 'pony') {
    const sway = Math.sin(t * 1.1 + phase) * 6;
    g.fillStyle = c.hair; g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(hx - dir * 10, hy - R + 2);
    g.bezierCurveTo(hx - dir * 26, hy - R - 18 + sway, hx - dir * 34 + sway, hy - R - 30, hx - dir * 22 + sway, hy - R - 40);
    g.bezierCurveTo(hx - dir * 24 + sway, hy - R - 24, hx - dir * 14, hy - R - 12, hx - dir * 2, hy - R - 2);
    g.closePath(); g.fill(); g.stroke();
  }
  g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 2.6;
  g.beginPath(); g.arc(hx, hy, R, 0, Math.PI * 2); g.fill(); g.stroke();
  // hair
  g.fillStyle = c.hair; g.lineWidth = 2;
  if (c.style === 'messy') {
    g.beginPath();
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const ang = Math.PI * (1.02 + 0.96 * (i / n));
      const rr = i % 2 ? R + 8 + 2 * Math.sin(i * 2.3) : R - 1;
      const px = hx + Math.cos(ang) * rr, py = hy + Math.sin(ang) * rr - 2;
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.quadraticCurveTo(hx, hy - R * 0.45, hx + Math.cos(Math.PI * 1.02) * (R - 1), hy + Math.sin(Math.PI * 1.02) * (R - 1) - 2);
    g.fill(); g.stroke();
  } else if (c.style === 'flat') {
    // a gray flat-top: short bristles on a squared crown
    g.beginPath(); g.moveTo(hx - R + 1, hy - R * 0.25);
    for (let i = 0; i <= 10; i++) g.lineTo(hx - R + 2 + (2 * R - 4) * i / 10, hy - R - 5 - (i % 2) * 2.5);
    g.lineTo(hx + R - 1, hy - R * 0.25); g.quadraticCurveTo(hx, hy - R * 0.62, hx - R + 1, hy - R * 0.25);
    g.fill(); g.stroke();
  } else if (c.style === 'curly') {
    for (let i = 0; i < 8; i++) {
      const ang = Math.PI * (1.05 + 0.9 * (i / 7));
      g.beginPath(); g.arc(hx + Math.cos(ang) * (R - 1), hy + Math.sin(ang) * (R - 1), 6.5, 0, 7); g.fill(); g.stroke();
    }
  } else if (c.style === 'pony') {
    g.beginPath(); g.arc(hx, hy - 2, R + 1, Math.PI * 1.02, Math.PI * 1.98); g.quadraticCurveTo(hx, hy - R * 0.55, hx - R - 1, hy - 2); g.fill(); g.stroke();
  }
  // face
  const ex = hx + dir * 2 + look * 3, ey = hy + 1;
  const closed = face === 'sleep' || (blink && hash01(Math.floor((t + phase) * 3.1), 77) < 0.035);
  g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 2;
  if (closed) {
    for (const k of [-1, 1]) { g.beginPath(); g.arc(ex + k * 6, ey, 2.6, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
  } else if (face === 'shock' || face === 'scared') {
    for (const k of [-1, 1]) {
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + k * 6, ey - 1, 4.2, 0, 7); g.fill(); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(ex + k * 6 + look, ey - 1, 1.6, 0, 7); g.fill();
    }
  } else {
    for (const k of [-1, 1]) { g.beginPath(); g.ellipse(ex + k * 6, ey, 2, 2.6, 0, 0, 7); g.fill(); }
  }
  // brows
  g.lineWidth = 1.8;
  // [outer end y, inner end y]: inner raised = worried, inner lowered = serious
  const brow = { worried: [-7, -10], scared: [-8, -12], sad: [-7, -10], serious: [-10, -7], shock: [-11, -12] }[face];
  if (brow) for (const k of [-1, 1]) line(g, [ex + k * 9, ey + brow[0]], [ex + k * 3, ey + brow[1]]);
  // mustache
  if (c.mustache) {
    g.fillStyle = c.mustache;
    g.beginPath(); g.ellipse(ex - 3, ey + 7, 5, 2.2, 0.2, 0, 7); g.ellipse(ex + 3, ey + 7, 5, 2.2, -0.2, 0, 7); g.fill();
  }
  // mouth
  g.lineWidth = 2; g.strokeStyle = INK;
  const mx = ex, my = ey + 10;
  g.beginPath();
  if (face === 'calm' || face === 'sleep') g.arc(mx, my - 4, 4, 0.2 * Math.PI, 0.8 * Math.PI);
  else if (face === 'shock' || face === 'scared') { g.ellipse(mx, my, 2.6, 3.4, 0, 0, 7); g.fillStyle = INK; g.fill(); }
  else if (face === 'sad') g.arc(mx, my + 3, 4, 1.2 * Math.PI, 1.8 * Math.PI);
  else if (face === 'worried') { g.moveTo(mx - 4, my); g.quadraticCurveTo(mx - 1, my - 2, mx + 1, my); g.quadraticCurveTo(mx + 3, my + 2, mx + 4, my - 0.5); }
  else { g.moveTo(mx - 4, my); g.lineTo(mx + 4, my); }
  g.stroke();
  if (face === 'scared') {
    g.fillStyle = '#7fc8ff'; g.beginPath(); g.ellipse(hx + dir * 15, hy - 6, 2.5, 4, 0, 0, 7); g.fill();
  }
}

// ---------------------------------------------------------------- station interior
/**
 * A module seen down its length. back: 'window' | 'hatch' | 'wall'. night 0..1 dims it (panel
 * LEDs stay lit), alarm 0..1 flashes red. Returns the back-wall rectangle for props.
 */
export function interior(g, t, { back = 'wall', night = 0, alarm = 0, seed = 3, hatch = {}, earthRot = 0 } = {}) {
  const W = 540, H = 434;
  const bx0 = 130, bx1 = 410, by0 = 96, by1 = 318;
  const left = [[0, 0], [bx0, by0], [bx0, by1], [0, H]];
  const right = [[W, 0], [bx1, by0], [bx1, by1], [W, H]];
  const ceil = [[0, 0], [W, 0], [bx1, by0], [bx0, by0]];
  const floor = [[0, H], [W, H], [bx1, by1], [bx0, by1]];
  // the module continues past the panel edges (cameras that pan or pull back see more of it)
  g.fillStyle = '#c4bdad'; g.fillRect(-400, -400, W + 800, H + 800);
  poly(g, [[-400, -400], [0, 0], [0, H], [-400, H + 400]], '#d9d2c4'); poly(g, [[W + 400, -400], [W, 0], [W, H], [W + 400, H + 400]], '#cfc8b9');
  poly(g, [[-400, H + 400], [0, H], [W, H], [W + 400, H + 400]], '#a39c8a');
  poly(g, ceil, '#c9c2b2'); poly(g, floor, '#aea795');
  poly(g, left, '#e2dccf'); poly(g, right, '#d8d1c3');
  g.fillStyle = '#ebe6db'; g.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
  const r = rng(seed);
  // racks on the side walls: lockers, labels, knobs
  const walls = [[left, 1], [right, -1]];
  for (const [q] of walls) {
    for (const [u0, u1] of [[0.04, 0.3], [0.36, 0.62], [0.68, 0.94]]) {
      for (const [v0, v1] of [[0.1, 0.46], [0.54, 0.9]]) {
        poly(g, subquad(q, u0, u1, v0, v1), '#d3ccbd', '#a59e8e', 1.4);
        const kind = r();
        if (kind < 0.4) {
          for (let k = 0; k < 3; k++) poly(g, subquad(q, u0 + 0.03, u1 - 0.03, v0 + 0.05 + k * 0.11, v0 + 0.12 + k * 0.11), '#c4bcab', '#9c9585', 1);
        } else if (kind < 0.7) {
          poly(g, subquad(q, u0 + 0.05, u1 - 0.05, v0 + 0.06, v0 + 0.16), ['#e9e3a8', '#cfe0f5', '#f2d1c7'][Math.floor(r() * 3)], '#9c9585', 1);
          for (let k = 0; k < 3; k++) {
            const [px, py] = qmap(q, u0 + 0.06 + k * 0.08, v0 + 0.26);
            g.fillStyle = ['#d24b3f', '#e3b33b', '#4a8bd1', '#5aa35a'][Math.floor(r() * 4)];
            g.beginPath(); g.arc(px, py, 2.4 + 2 * (1 - Math.abs(qmap(q, u0, 0)[0] - W / 2) / W), 0, 7); g.fill();
          }
        } else {
          poly(g, subquad(q, u0 + 0.04, u1 - 0.04, v0 + 0.06, v1 - 0.06), '#5d6a7a', '#3f4a57', 1.2);
          poly(g, subquad(q, u0 + 0.07, u1 - 0.07, v0 + 0.1, v1 - 0.1), '#2c3a48');
        }
      }
    }
    // handrails
    for (const u of [0.18, 0.5, 0.82]) {
      g.strokeStyle = '#c8a541'; g.lineWidth = 4;
      const a = qmap(q, u - 0.07, 0.5), b = qmap(q, u + 0.07, 0.5);
      line(g, a, b);
    }
  }
  // ceiling light strips and floor grilles
  for (const [u0, u1] of [[0.1, 0.4], [0.6, 0.9]]) {
    const lq = subquad([[0, 0], [W, 0], [bx1, by0], [bx0, by0]], 0.32, 0.68, u0, u1);
    poly(g, lq, night > 0.5 ? '#6f7686' : '#fffbe9', '#b8b09c', 1);
    const fq = subquad([[0, H], [W, H], [bx1, by1], [bx0, by1]], 0.3, 0.7, u0, u1);
    poly(g, fq, '#9d9684', '#8a8473', 1);
  }
  // cables drooping (no gravity, but they still hang in loops)
  g.strokeStyle = '#3b3b3b'; g.lineWidth = 2.2;
  for (let k = 0; k < 3; k++) {
    const x0 = 20 + k * 30, y0 = 40 + k * 12;
    g.beginPath(); g.moveTo(x0, y0);
    g.bezierCurveTo(x0 + 40, y0 + 60 + 6 * Math.sin(t * 0.7 + k), x0 + 80, y0 + 40, x0 + 100 + k * 6, y0 + 10 + k * 8);
    g.stroke();
  }
  // back wall
  const bw = { x: bx0, y: by0, w: bx1 - bx0, h: by1 - by0 };
  if (back === 'window') {
    const cx = bx0 + bw.w / 2, cy = by0 + bw.h * 0.48, rr = 70;
    g.fillStyle = '#9c968a'; g.beginPath(); g.arc(cx, cy, rr + 12, 0, 7); g.fill();
    g.strokeStyle = '#6f6a60'; g.lineWidth = 2; g.stroke();
    g.save(); g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.clip();
    space(g, t, { w: 540, h: 434, starsSeed: 5, cx, cy });
    earth(g, cx + 30, cy + 330, 300, t, { rot: earthRot });
    g.restore();
    g.strokeStyle = '#4a4740'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.stroke();
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.fillStyle = '#5b574f'; g.beginPath(); g.arc(cx + Math.cos(a) * (rr + 6), cy + Math.sin(a) * (rr + 6), 2, 0, 7); g.fill(); }
  } else if (back === 'hatch') {
    hatchDoor(g, bx0 + bw.w / 2, by0 + bw.h * 0.5, 82, t, hatch);
    if (hatch.gauge) miniGauge(g, 390, 132, hatch.gauge === 'off');
  } else {
    for (let k = 0; k < 2; k++) poly(g, [[bx0 + 16 + k * 134, by0 + 18], [bx0 + 130 + k * 134, by0 + 18], [bx0 + 130 + k * 134, by1 - 18], [bx0 + 16 + k * 134, by1 - 18]], '#ddd6c8', '#a59e8e', 1.4);
  }
  // lighting: alarm red flash, night blue-dark
  if (alarm > 0) {
    const f = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 1.4);
    g.fillStyle = `rgba(255,20,20,${alarm * (0.12 + 0.28 * f)})`; g.fillRect(-50, -50, W + 100, H + 100);
  }
  if (night > 0) {
    g.fillStyle = `rgba(8,12,34,${0.72 * night})`; g.fillRect(-50, -50, W + 100, H + 100);
    // status LEDs keep glowing in the dark
    const lr = rng(seed + 11);
    for (let k = 0; k < 16; k++) {
      const q = lr() < 0.5 ? left : right;
      const [px, py] = qmap(q, 0.05 + lr() * 0.9, 0.12 + lr() * 0.76);
      const col = lr() < 0.7 ? '120,255,140' : '255,90,80';
      const on = hash01(k, Math.floor(t * 0.7 + k)) < 0.9;
      if (!on) continue;
      g.fillStyle = `rgba(${col},${0.9 * night})`; g.beginPath(); g.arc(px, py, 1.8, 0, 7); g.fill();
      g.fillStyle = `rgba(${col},${0.18 * night})`; g.beginPath(); g.arc(px, py, 6, 0, 7); g.fill();
    }
  }
  return bw;
}

/** Round hatch with a hand wheel and a big number. open 0..1 swings it, wheel = turns. */
export function hatchDoor(g, cx, cy, r, t, { num = '3', open = 0, wheel = 0, label = true } = {}) {
  g.fillStyle = '#8e897e'; g.beginPath(); g.arc(cx, cy, r + 14, 0, 7); g.fill();
  g.strokeStyle = '#5f5b53'; g.lineWidth = 2.5; g.stroke();
  g.fillStyle = '#2a2a2e'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); // the opening (dark tunnel)
  const k = Math.cos(open * Math.PI * 0.5); // door narrows as it swings on its left hinge
  if (k > 0.02) {
    g.save();
    g.translate(cx - r, cy); g.scale(k, 1); g.translate(r, 0);
    g.fillStyle = '#c9c3b6'; g.beginPath(); g.arc(0, 0, r - 3, 0, 7); g.fill();
    g.strokeStyle = '#7a756b'; g.lineWidth = 3; g.stroke();
    g.strokeStyle = '#a49e91'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, r * 0.78, 0, 7); g.stroke();
    if (label) {
      g.fillStyle = '#b8352c'; g.font = `900 ${r * 0.62}px ${FONTS.display}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(num, 0, -r * 0.42);
    }
    // wheel
    g.save(); g.translate(0, r * 0.12); g.rotate(wheel * Math.PI * 2);
    g.strokeStyle = '#3d3a35'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, r * 0.34, 0, 7); g.stroke();
    g.lineWidth = 4;
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; line(g, [0, 0], [Math.cos(a) * r * 0.34, Math.sin(a) * r * 0.34]); }
    g.fillStyle = '#3d3a35'; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill();
    g.restore();
    g.restore();
  }
}

/** The small Hatch 3 gauge on the wall beside the hatch (off = taken off: a hole and a cable end). */
function miniGauge(g, x, y, off) {
  if (off) {
    roundRect(g, x - 16, y - 16, 32, 32, 4); g.fillStyle = '#2b2925'; g.fill(); g.strokeStyle = '#7a756b'; g.lineWidth = 2; g.stroke();
    g.strokeStyle = '#1b1b1b'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 4, y + 2); g.quadraticCurveTo(x + 2, y - 8, x + 8, y + 6); g.stroke();
    return;
  }
  roundRect(g, x - 17, y - 17, 34, 34, 4); g.fillStyle = '#9d978a'; g.fill(); g.strokeStyle = '#6a655c'; g.lineWidth = 1.5; g.stroke();
  g.fillStyle = '#f4f1e8'; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); g.strokeStyle = '#333'; g.lineWidth = 1.5; g.stroke();
  g.strokeStyle = '#c42b22'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 7, y + 7); g.stroke();
}

/** Pressure gauge (kPa). v = needle value 0..120. */
export function gauge(g, cx, cy, r, v, { label = 'MODULE 3', unit = 'kPa', glow = 0 } = {}) {
  g.fillStyle = '#3a3a3e'; g.beginPath(); g.arc(cx, cy, r + 10, 0, 7); g.fill();
  g.fillStyle = '#f4f1e8'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
  const ang = (x) => (-225 + 270 * (x / 120)) * DEG;
  g.strokeStyle = 'rgba(210,40,40,0.85)'; g.lineWidth = r * 0.09;
  g.beginPath(); g.arc(cx, cy, r * 0.84, ang(0), ang(15)); g.stroke();
  g.strokeStyle = INK; g.fillStyle = INK;
  g.font = `800 ${r * 0.17}px ${FONTS.display}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let x = 0; x <= 120; x += 10) {
    const a = ang(x), big = x % 40 === 0;
    g.lineWidth = big ? 2.5 : 1.3;
    line(g, [cx + Math.cos(a) * r * (big ? 0.72 : 0.78), cy + Math.sin(a) * r * (big ? 0.72 : 0.78)], [cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9]);
    if (big) g.fillText(String(x), cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55);
  }
  g.font = `900 ${r * 0.14}px ${FONTS.display}`; g.fillText(unit, cx, cy + r * 0.32);
  g.font = `800 ${r * 0.12}px ${FONTS.display}`; g.fillStyle = '#555'; g.fillText(label, cx, cy + r * 0.52);
  const a = ang(v);
  g.strokeStyle = '#c42b22'; g.lineWidth = r * 0.05; g.lineCap = 'round';
  line(g, [cx - Math.cos(a) * r * 0.12, cy - Math.sin(a) * r * 0.12], [cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8]);
  g.fillStyle = '#222'; g.beginPath(); g.arc(cx, cy, r * 0.07, 0, 7); g.fill();
  if (glow) { g.fillStyle = `rgba(255,255,255,${0.15 * glow})`; g.beginPath(); g.arc(cx - r * 0.3, cy - r * 0.35, r * 0.4, 0, 7); g.fill(); }
}

// ---------------------------------------------------------------- outside
/** Black sky with stars over the panel (or any w x h box). */
export function space(g, t, { w = 540, h = 434, starsSeed = 1, x0 = -40, y0 = -40 } = {}) {
  const gr = g.createLinearGradient(0, y0, 0, h);
  gr.addColorStop(0, '#02030a'); gr.addColorStop(1, '#0a1230');
  g.fillStyle = gr; g.fillRect(x0, y0, w - 2 * x0, h - 2 * y0);
  const r = rng(starsSeed);
  for (let i = 0; i < 160; i++) {
    const sx = x0 + r() * (w - 2 * x0), sy = y0 + r() * (h - 2 * y0), s = 0.5 + r() * 1.3;
    const tw = 0.6 + 0.4 * Math.sin(t * (1 + r() * 2) + i);
    g.fillStyle = `rgba(255,255,255,${0.35 + 0.5 * tw * r()})`;
    g.fillRect(sx, sy, s, s);
  }
}

const EARTH_BLOBS = (() => {
  const r = rng(91), out = [];
  for (let i = 0; i < 14; i++) {
    const cx = r() * 1.6 - 0.3, cy = 0.02 + r() * 0.2, rx = 0.05 + r() * 0.12, ry = 0.015 + r() * 0.04;
    out.push({ cx, cy, rx, ry, rot: (r() - 0.5) * 0.6, land: i < 6, k: Math.floor(r() * 3) });
  }
  return out;
})();
/** Earth as a big disc; rot slides the surface sideways. Best with the centre far below. */
export function earth(g, cx, cy, R, t, { rot = 0, night = 0 } = {}) {
  // atmosphere glow
  let gr = g.createRadialGradient(cx, cy, R * 0.98, cx, cy, R * 1.06);
  gr.addColorStop(0, 'rgba(120,200,255,0.75)'); gr.addColorStop(1, 'rgba(120,200,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R * 1.06, 0, 7); g.fill();
  gr = g.createRadialGradient(cx, cy - R * 0.9, R * 0.1, cx, cy - R * 0.5, R * 1.1);
  gr.addColorStop(0, '#5db8ff'); gr.addColorStop(0.5, '#2a78c9'); gr.addColorStop(1, '#0f3b78');
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip();
  g.fillStyle = gr; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  const span = 2 * R, top = cy - R;
  for (const b of EARTH_BLOBS) {
    const u = ((b.cx + rot) % 1.6 + 1.6) % 1.6 - 0.3;
    const x = cx - R + u * span, y = top + b.cy * span * 0.5 + 6;
    g.fillStyle = b.land ? ['#5f9a48', '#8a8a4a', '#4f8a3e'][b.k] : 'rgba(255,255,255,0.72)';
    g.beginPath(); g.ellipse(x, y, b.rx * span * 0.4, b.ry * span * 0.4, b.rot, 0, 7); g.fill();
    if (!b.land) { g.beginPath(); g.ellipse(x + b.rx * span * 0.2, y + 3, b.rx * span * 0.25, b.ry * span * 0.3, b.rot, 0, 7); g.fill(); }
  }
  if (night) { g.fillStyle = `rgba(0,5,20,${0.75 * night})`; g.fillRect(cx - R, cy - R, 2 * R, 2 * R); }
  g.restore();
}

/** A capsule (cone + heat shield), pointing along +x before rotation. */
export function capsule(g, x, y, s = 1, rot = 0, { burn = 0 } = {}) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  if (burn > 0) {
    const gr = g.createRadialGradient(-30, 0, 2, -30, 0, 40 * burn);
    gr.addColorStop(0, 'rgba(255,240,200,0.9)'); gr.addColorStop(1, 'rgba(255,160,60,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(-30, 0, 40 * burn, 0, 7); g.fill();
  }
  poly(g, [[-22, -24], [18, -12], [26, -8], [26, 8], [18, 12], [-22, 24]], '#f2f2f0', INK, 2.2);
  poly(g, [[-26, -25], [-22, -24], [-22, 24], [-26, 25]], '#3a3530', INK, 2);
  g.fillStyle = '#26324a'; g.beginPath(); g.arc(-4, -6, 3.2, 0, 7); g.arc(6, -4, 2.6, 0, 7); g.fill();
  g.strokeStyle = '#b8b8b8'; g.lineWidth = 1; line(g, [-10, -20], [-10, 20]);
  g.restore();
}

/** The station from outside: truss, solar arrays, modules. x, y = centre. */
export function station(g, x, y, s = 1, t = 0, { rot = 0, arrays = 1, module3Light = 0, capsuleDocked = false, arrayJam = 0 } = {}) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.lineJoin = 'round';
  // truss
  poly(g, [[-230, -6], [230, -6], [230, 6], [-230, 6]], '#9a9a9a', INK, 1.8);
  g.strokeStyle = '#6d6d6d'; g.lineWidth = 1;
  for (let i = -230; i < 230; i += 14) line(g, [i, -6], [i + 14, 6]);
  // solar arrays
  for (const sx of [-200, -150, 150, 200]) {
    for (const sy of [-1, 1]) {
      const tilt = sx > 0 && arrayJam ? 0 : 0.06 * Math.sin(t * 0.2 + sx);
      g.save(); g.translate(sx, sy * 10); g.scale(1, 1 - Math.abs(tilt));
      const hgt = 120 * arrays;
      poly(g, [[-18, 0], [18, 0], [18, sy * hgt], [-18, sy * hgt]], '#1d2d63', '#c79a3c', 1.6);
      g.strokeStyle = 'rgba(199,154,60,0.7)'; g.lineWidth = 0.8;
      for (let k = 1; k < 8; k++) line(g, [-18, sy * hgt * k / 8], [18, sy * hgt * k / 8]);
      line(g, [0, 0], [0, sy * hgt]);
      g.fillStyle = 'rgba(160,200,255,0.12)'; g.fillRect(-18, sy > 0 ? 0 : -hgt, 18, hgt);
      g.restore();
    }
  }
  // radiators
  poly(g, [[-90, 6], [-70, 6], [-60, 60], [-80, 60]], '#f0f0ee', INK, 1.4);
  poly(g, [[70, 6], [90, 6], [80, 60], [60, 60]], '#f0f0ee', INK, 1.4);
  // modules: side A (left), node with Hatch 3, side B = Module 3 (right)
  const mod = (x0, x1, y0, h, col = '#f3f1ea') => {
    roundRect(g, x0, y0, x1 - x0, h, h / 2); g.fillStyle = col; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.8; g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1;
    for (let k = x0 + 12; k < x1 - 6; k += 16) line(g, [k, y0 + 2], [k, y0 + h - 2]);
    g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(x0 + h / 2, y0 + h * 0.62, x1 - x0 - h, h * 0.3);
  };
  mod(-120, -14, -22, 30);
  mod(-60, -36, -50, 30);
  mod(14, 120, -22, 30, '#eeece4');
  roundRect(g, -16, -26, 32, 38, 8); g.fillStyle = '#e3e0d6'; g.fill(); g.strokeStyle = INK; g.stroke();
  // Module 3 window (lit from inside in later parts)
  g.fillStyle = module3Light ? `rgba(255,226,140,${0.4 + 0.6 * module3Light})` : '#2a3448';
  g.beginPath(); g.arc(80, -7, 4, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke();
  if (capsuleDocked) capsule(g, -146, -7, 0.6, Math.PI);
  g.restore();
}

// ---------------------------------------------------------------- capsule inside
/** Inside the escape capsule: three seats in a row; seat 3 carries a red NO GO tag. */
export function capsuleInside(g, t, { tag = 1, tagPulse = 0 } = {}) {
  const W = 540, H = 434;
  let gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#5b5f66'); gr.addColorStop(1, '#3a3d42');
  g.fillStyle = gr; g.fillRect(-40, -40, W + 80, H + 80);
  // conical walls
  poly(g, [[-40, -40], [160, -40], [100, 160], [-40, 230]], '#6a6e75');
  poly(g, [[W + 40, -40], [380, -40], [440, 160], [W + 40, 230]], '#646870');
  // panels and screens
  for (let i = 0; i < 4; i++) {
    roundRect(g, 150 + i * 62, 34, 50, 34, 4); g.fillStyle = '#20262e'; g.fill(); g.strokeStyle = '#111'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = ['#6fe08a', '#e8c450', '#6fb8e8', '#6fe08a'][i];
    for (let k = 0; k < 3; k++) g.fillRect(156 + i * 62, 42 + k * 8, 10 + 26 * hash01(i, k), 3);
  }
  g.fillStyle = '#2c3746'; g.beginPath(); g.ellipse(270, 108, 34, 20, 0, 0, 7); g.fill();
  g.strokeStyle = '#1b1f25'; g.lineWidth = 4; g.stroke();
  // seats
  const seats = [[150, 270], [270, 262], [390, 270]];
  for (const [i, [sx, sy]] of seats.entries()) {
    roundRect(g, sx - 24, sy - 104, 44, 30, 9); g.fillStyle = '#34405a'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
    poly(g, [[sx - 46, sy - 70], [sx + 40, sy - 78], [sx + 46, sy + 10], [sx - 50, sy + 18]], '#3e4c6a', INK, 2);
    poly(g, [[sx - 52, sy + 18], [sx + 48, sy + 10], [sx + 58, sy + 64], [sx - 60, sy + 74]], '#33405a', INK, 2);
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2; line(g, [sx - 40, sy - 20], [sx + 40, sy - 26]);
    g.strokeStyle = '#2b2b2b'; g.lineWidth = 3;
    line(g, [sx - 30, sy - 60], [sx - 6, sy + 30]); line(g, [sx + 26, sy - 64], [sx + 6, sy + 30]);
    if (i === 2 && tag > 0) {
      const sw = Math.sin(t * 1.6) * 0.12;
      const pulse = 1 + 0.12 * tagPulse * Math.max(0, Math.sin(t * 8));
      g.save(); g.translate(sx + 20, sy - 50); g.rotate(sw); g.scale(pulse, pulse);
      g.strokeStyle = '#ddd'; g.lineWidth = 1.5; line(g, [0, -16], [0, 0]);
      roundRect(g, -30, 0, 60, 34, 4); g.fillStyle = '#d42a21'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#fff'; g.font = `900 15px ${FONTS.display}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('NO GO', 0, 17);
      g.restore();
    }
  }
  return seats;
}

// ---------------------------------------------------------------- paper, screens, props
/** Cream paper with ruled lines. */
export function paper(g, x, y, w, h, { rot = 0, lines = true, lh = 36, top = 70, shadow = true } = {}) {
  g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot); g.translate(-w / 2, -h / 2);
  if (shadow) { g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(6, 8, w, h); }
  const gr = g.createLinearGradient(0, 0, w, h);
  gr.addColorStop(0, '#fbf6e9'); gr.addColorStop(1, '#efe6d2');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  if (lines) {
    g.strokeStyle = 'rgba(80,90,120,0.22)'; g.lineWidth = 1;
    for (let yy = top; yy < h - 10; yy += lh) line(g, [10, yy], [w - 10, yy]);
  }
  g.restore();
}

/** Monitor with monospace text lines; lines = [{ text, u, color }] (u = typed fraction). */
export function screen(g, x, y, w, h, lines, { size = 15, lh = 22, pad = 14, color = '#7dff9a', bezel = '#2a2d33' } = {}) {
  roundRect(g, x - 8, y - 8, w + 16, h + 16, 8); g.fillStyle = bezel; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#071410'; g.fillRect(x, y, w, h);
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.font = `700 ${size}px ${MONO}`; g.textBaseline = 'top'; g.textAlign = 'left';
  lines.forEach((l, i) => {
    const u = l.u ?? 1;
    if (u <= 0) return;
    const txt = l.text.slice(0, Math.ceil(l.text.length * clamp(u)));
    g.fillStyle = l.color ?? color;
    g.fillText(txt, x + pad, y + pad + i * lh);
  });
  g.fillStyle = 'rgba(255,255,255,0.03)';
  for (let yy = y; yy < y + h; yy += 3) g.fillRect(x, yy, w, 1);
  const gr = g.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, w * 0.7);
  gr.addColorStop(0, 'rgba(120,255,160,0.06)'); gr.addColorStop(1, 'rgba(0,0,0,0.35)');
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  g.restore();
}

/** Three big readouts: [{ label, value, u }] (u = pop-in 0..1). */
export function readouts(g, x, y, items, { w = 150, h = 120, gap = 14 } = {}) {
  items.forEach((it, i) => {
    const u = clamp(it.u ?? 1);
    if (u <= 0) return;
    const s = 0.7 + 0.3 * easeOutBack(u);
    const cx = x + i * (w + gap) + w / 2, cy = y + h / 2;
    g.save(); g.translate(cx, cy); g.scale(s, s); g.globalAlpha = clamp(u * 2);
    roundRect(g, -w / 2, -h / 2, w, h, 12); g.fillStyle = '#16191f'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
    roundRect(g, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 8); g.fillStyle = '#0a1a12'; g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#9fb4a8'; g.font = `800 15px ${FONTS.display}`; g.fillText(it.label, 0, -h / 2 + 28);
    g.fillStyle = it.color ?? '#7dff9a'; g.font = `700 34px ${MONO}`; g.fillText(it.value, 0, 14);
    g.restore();
  });
}

/** A paper envelope, flap open 0..1, number written on it. */
export function envelope(g, x, y, w, h, { n = '1', open = 0, rot = 0 } = {}) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-w / 2 + 4, -h / 2 + 5, w, h);
  g.fillStyle = '#efe2c4'; g.fillRect(-w / 2, -h / 2, w, h);
  g.strokeStyle = '#b9a67d'; g.lineWidth = 1.6; g.strokeRect(-w / 2, -h / 2, w, h);
  line(g, [-w / 2, h / 2], [0, h * 0.05]); line(g, [w / 2, h / 2], [0, h * 0.05]);
  const fy = -h / 2 + (1 - 2 * open) * h * 0.55;
  poly(g, [[-w / 2, -h / 2], [w / 2, -h / 2], [0, fy]], open > 0.5 ? '#e6d6b2' : '#f3e8cf', '#b9a67d', 1.6);
  g.fillStyle = '#2b2f55'; g.font = `700 ${h * 0.34}px ${FONTS.hand}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(n, 0, h * 0.24);
  g.restore();
}

/** Radio panel with a channel display and a speaker; lit = speaker light 0..1, lamp9 = the channel 9 lamp 0..1. */
export function radio(g, x, y, { ch = '4', lit = 0, lamp9 = 0 } = {}) {
  g.textAlign = 'center';
  roundRect(g, x, y, 170, 120, 10); g.fillStyle = '#3a3f47'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
  roundRect(g, x + 14, y + 14, 70, 44, 6); g.fillStyle = '#0d1a10'; g.fill();
  g.fillStyle = '#ffb648'; g.font = `700 26px ${MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(`CH${ch}`, x + 49, y + 37);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { g.fillStyle = '#23272d'; g.beginPath(); g.arc(x + 106 + i * 12, y + 22 + j * 12, 3.6, 0, 7); g.fill(); }
  g.fillStyle = lit > 0 ? `rgba(80,255,120,${0.4 + 0.6 * lit})` : '#2a3a2c';
  g.beginPath(); g.arc(x + 30, y + 88, 7, 0, 7); g.fill();
  for (let i = 0; i < 3; i++) { g.fillStyle = '#8a8f98'; g.beginPath(); g.arc(x + 70 + i * 30, y + 88, 9, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 1.5; g.stroke(); }
  // channel 9 lamp, left of the panel (centre x - 33, y + 25)
  const lx = x - 33, ly = y + 25;
  roundRect(g, lx - 23, ly - 15, 46, 30, 6); g.fillStyle = '#23262b'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
  if (lamp9 > 0) {
    const gr = g.createRadialGradient(lx, ly, 2, lx, ly, 50);
    gr.addColorStop(0, `rgba(255,70,50,${0.6 * lamp9})`); gr.addColorStop(1, 'rgba(255,70,50,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(lx, ly, 50, 0, 7); g.fill();
  }
  g.fillStyle = lamp9 > 0 ? `rgb(255,${Math.round(90 - 40 * lamp9)},60)` : '#4a2a26';
  g.font = `900 17px ${FONTS.display}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CH9', lx, ly + 1);
}

/** Light beam from a flashlight at (x0, y0) onto a spot (x1, y1) of radius r. */
export function beam(g, x0, y0, x1, y1, r = 120, a = 0.42) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(x1, y1, 10, x1, y1, r);
  gr.addColorStop(0, `rgba(255,240,200,${a})`); gr.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = gr;
  const ang = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(ang), ny = Math.cos(ang);
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 + nx * r * 0.9, y1 + ny * r * 0.9); g.lineTo(x1 - nx * r * 0.9, y1 - ny * r * 0.9); g.closePath(); g.fill();
  g.beginPath(); g.arc(x1, y1, r, 0, 7); g.fill();
  g.restore();
}

/** Darkness everywhere except a soft round spot (a flashlight on a dark wall; keeps true colors). */
export function spotlight(g, x, y, r, dark = 0.85) {
  g.save();
  g.beginPath(); g.rect(-400, -400, 1400, 1300); g.arc(x, y, r, 0, Math.PI * 2, true);
  g.fillStyle = `rgba(8,12,30,${dark})`; g.fill('evenodd');
  const gr = g.createRadialGradient(x, y, r * 0.55, x, y, r);
  gr.addColorStop(0, 'rgba(8,12,30,0)'); gr.addColorStop(1, `rgba(8,12,30,${dark})`);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,230,170,0.08)'; g.beginPath(); g.arc(x, y, r * 0.8, 0, Math.PI * 2); g.fill();
  g.restore();
}

/** The wall behind a removed gauge: an open cavity, the cable going in, and its cut end. reveal 0..1 follows the cable. */
export function gaugeCavity(g, cx, cy, t, { reveal = 1, light = 1 } = {}) {
  g.fillStyle = '#d8d1c3'; g.fillRect(-40, -40, 620, 520);
  roundRect(g, cx - 170, cy - 120, 340, 240, 14); g.fillStyle = '#2b2925'; g.fill(); g.strokeStyle = '#7a756b'; g.lineWidth = 5; g.stroke();
  // insulation and brackets inside
  g.fillStyle = '#c9a85a';
  for (let i = 0; i < 6; i++) { g.globalAlpha = 0.35; g.beginPath(); g.ellipse(cx - 120 + i * 48, cy + 80 + 8 * Math.sin(i * 2.1), 30, 16, 0, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  g.strokeStyle = '#55524b'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx - 160, cy - 40); g.lineTo(cx + 160, cy - 40); g.stroke();
  // the gauge's back plate (left) and its cable
  g.fillStyle = '#6d6a63'; g.beginPath(); g.arc(cx - 110, cy - 10, 34, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
  const P = (u) => { // cubic along the cable
    const p0 = [cx - 110, cy + 20], p1 = [cx - 60, cy + 90], p2 = [cx + 30, cy - 70], p3 = [cx + 95, cy + 10];
    const k = 1 - u;
    return [k ** 3 * p0[0] + 3 * k * k * u * p1[0] + 3 * k * u * u * p2[0] + u ** 3 * p3[0], k ** 3 * p0[1] + 3 * k * k * u * p1[1] + 3 * k * u * u * p2[1] + u ** 3 * p3[1]];
  };
  for (const [col, w, dy] of [['#2a2a2a', 8, 0], ['#6b6b6b', 2.5, -2]]) {
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath();
    for (let i = 0; i <= 40; i++) { const [px, py] = P(i / 40); i ? g.lineTo(px, py + dy) : g.moveTo(px, py + dy); }
    g.stroke();
  }
  // the end: cut, copper strands, a strip of tape. Nothing on the other side.
  const [ex, ey] = P(1);
  g.strokeStyle = '#e09040'; g.lineWidth = 2;
  for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(ex, ey); g.quadraticCurveTo(ex + 10, ey + k * 2, ex + 20, ey + k * 5 + 2 * Math.sin(k * 1.7)); g.stroke(); }
  g.fillStyle = '#efe7c8'; g.save(); g.translate(ex - 10, ey); g.rotate(0.4); g.fillRect(-9, -8, 16, 16); g.strokeStyle = '#a89f80'; g.lineWidth = 1; g.strokeRect(-9, -8, 16, 16); g.restore();
  // darkness except where the flashlight follows the cable
  if (light < 1) { g.fillStyle = `rgba(8,12,34,${0.7 * (1 - light)})`; g.fillRect(-40, -40, 620, 520); }
  const [bx, by] = P(clamp(reveal));
  return [bx, by];
}


/** A sleeping bag strapped to a wall, with a head poking out. */
export function sleepBag(g, x, y, s, t, { who = 'sam', face = 'sleep', look = 0 } = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  roundRect(g, -34, -10, 68, 150, 26); g.fillStyle = '#3f6fa8'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
  g.strokeStyle = '#2d527f'; g.lineWidth = 2;
  for (let k = 0; k < 4; k++) line(g, [-30, 20 + k * 30], [30, 20 + k * 30]);
  g.strokeStyle = '#d8b04a'; g.lineWidth = 4; line(g, [-40, 60], [40, 60]); line(g, [-40, 110], [40, 110]);
  g.restore();
  headOnly(g, { x, y: y - 8 * s, s: s * 1.05, who, face, look, t, blink: face !== 'sleep' });
}

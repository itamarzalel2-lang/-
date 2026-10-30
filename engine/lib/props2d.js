// More flat 2D props for the series (Alone in Orbit, Parts 5-14): the spacewalk, Module 3 from
// outside, life-support hardware, the hidden camera, the ham radio, a world map with the
// station's ground track, a room on Earth, a phone, the breaker panel and the trip home.
// Pure functions of t, drawn in panel units (540 x 434), like toon.js.
import { FONTS, INK, roundRect, poly, interior, stick, earth, space, screen } from './toon.js';
import { clamp, lerp, hash01, rng, easeInOutCubic } from './util.js';

const line = (g, a, b) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
const label = (g, text, x, y, size = 14, color = '#111', weight = 900, align = 'center') => {
  g.font = `${weight} ${size}px ${FONTS.display}`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y);
};

// ---------------------------------------------------------------- outside
/** A close look along the truss: the beam across the frame, handrails, the Earth below. night 0..1. */
export function trussClose(g, t, { night = 0, scroll = 0, earthY = 760 } = {}) {
  space(g, t);
  earth(g, 270, earthY + 600, 1000, t, { rot: t * 0.01, night: 0.85 * night });
  if (night > 0) {
    // city lights on the night side
    g.save(); g.beginPath(); g.arc(270, earthY + 600, 1000, 0, 7); g.clip();
    for (let i = 0; i < 90; i++) {
      const x = ((hash01(i, 1) * 900 + t * 18) % 900) - 180, y = earthY - 390 + 18 + hash01(i, 2) * 200;
      g.fillStyle = `rgba(255,214,130,${0.85 * night * (0.4 + 0.6 * hash01(i, 3))})`; g.fillRect(x, y, 2, 2);
    }
    g.restore();
  }
  const y0 = 150, h = 70, off = -((scroll % 60) + 60) % 60;
  g.fillStyle = '#9a9a9a'; g.fillRect(-60, y0, 660, h);
  g.strokeStyle = '#6a6a6a'; g.lineWidth = 3;
  for (let x = off - 60; x < 640; x += 60) { line(g, [x, y0], [x + 60, y0 + h]); line(g, [x + 60, y0], [x, y0 + h]); line(g, [x, y0], [x, y0 + h]); }
  g.strokeStyle = INK; g.lineWidth = 2.5; g.strokeRect(-60, y0, 660, h);
  g.strokeStyle = '#d4ad3a'; g.lineWidth = 6;
  for (let x = off; x < 640; x += 120) { line(g, [x, y0 - 12], [x + 50, y0 - 12]); line(g, [x, y0 - 12], [x, y0]); line(g, [x + 50, y0 - 12], [x + 50, y0]); }
  if (night) { g.fillStyle = `rgba(2,4,14,${0.65 * night})`; g.fillRect(-60, -60, 660, 560); }
}

/** The array's rotary joint: a big gear; blanket 0..1 = how much torn blanket still jams it; turn = gear angle. */
export function arrayJoint(g, t, { blanket = 1, turn = 0, light = 1 } = {}) {
  space(g, t);
  // array panels behind
  g.fillStyle = '#1d2d63'; g.fillRect(330, -40, 260, 520); g.strokeStyle = '#c79a3c'; g.lineWidth = 2;
  for (let y = -40; y < 480; y += 40) line(g, [330, y], [590, y]);
  g.fillStyle = '#9a9a9a'; g.fillRect(-60, 180, 400, 70); g.strokeStyle = INK; g.lineWidth = 2.5; g.strokeRect(-60, 180, 400, 70);
  // gear
  const cx = 250, cy = 215, R = 110, teeth = 24;
  g.save(); g.translate(cx, cy); g.rotate(turn);
  g.beginPath();
  for (let i = 0; i < teeth * 2; i++) { const a = (i / (teeth * 2)) * Math.PI * 2, r = i % 2 ? R : R + 14; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  g.closePath(); g.fillStyle = '#b9b9b4'; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#8f8f8a'; g.beginPath(); g.arc(0, 0, R * 0.62, 0, 7); g.fill(); g.stroke();
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.fillStyle = '#5c5c58'; g.beginPath(); g.arc(Math.cos(a) * R * 0.42, Math.sin(a) * R * 0.42, 9, 0, 7); g.fill(); }
  g.restore();
  // the torn insulation blanket caught in the teeth (shrinks as it's cut; cut pieces drift off)
  const r = rng(77);
  for (let i = 0; i < 9; i++) {
    const px = cx - 40 + r() * 140, py = cy - 120 + r() * 70, w = 40 + r() * 50, hgt = 26 + r() * 30, rot = (r() - 0.5) * 1.2;
    const gone = clamp((1 - blanket) * 9 - i);
    g.save(); g.translate(px + gone * (60 + i * 25), py - gone * (40 + i * 12)); g.rotate(rot + gone * 2); g.globalAlpha = 1 - clamp((gone - 0.6) / 0.4);
    poly(g, [[-w / 2, -hgt / 2], [w / 2 - 6, -hgt / 2 + 4], [w / 2, hgt / 2 - 6], [-w / 2 + 8, hgt / 2]], i % 2 ? '#e3c76a' : '#f1efe6', INK, 1.6);
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; line(g, [-w / 3, -hgt / 4], [w / 3, hgt / 5]);
    g.restore();
  }
  if (light < 1) { g.fillStyle = `rgba(2,4,14,${0.7 * (1 - light)})`; g.fillRect(-60, -60, 660, 560); }
}

/** Module 3's round window seen from outside, with someone inside. inside(g) draws the room's contents. */
export function hullWindow(g, t, { light = 1, cx = 270, cy = 205, r = 120, inside, glare = 0.25 } = {}) {
  g.fillStyle = '#e9e7df'; g.fillRect(-60, -60, 660, 560);
  g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = 1.5;
  for (let x = -60; x < 600; x += 90) line(g, [x, -60], [x, 500]);
  for (let y = -60; y < 500; y += 90) line(g, [-60, y], [600, y]);
  g.fillStyle = 'rgba(0,0,0,0.3)';
  for (let x = -60; x < 600; x += 90) for (let y = -60; y < 500; y += 90) { g.beginPath(); g.arc(x + 6, y + 6, 2, 0, 7); g.fill(); }
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.clip();
  g.fillStyle = '#05070f'; g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  if (light > 0) {
    g.save(); g.translate(cx, cy); g.scale(0.62, 0.62); g.translate(-270, -217);
    interior(g, t, { back: 'wall', seed: 9 });
    inside?.(g);
    g.restore();
    g.fillStyle = `rgba(255,220,150,${0.18 * light})`; g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    if (light < 1) { g.fillStyle = `rgba(5,7,15,${1 - light})`; g.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
  }
  // reflections on the glass
  g.fillStyle = `rgba(255,255,255,${glare * 0.5})`; g.beginPath(); g.ellipse(cx - r * 0.35, cy - r * 0.45, r * 0.5, r * 0.16, -0.6, 0, 7); g.fill();
  g.restore();
  g.strokeStyle = '#8f8a80'; g.lineWidth = 16; g.beginPath(); g.arc(cx, cy, r + 8, 0, 7); g.stroke();
  g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy, r + 16, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.fillStyle = '#5b574f'; g.beginPath(); g.arc(cx + Math.cos(a) * (r + 8), cy + Math.sin(a) * (r + 8), 2.6, 0, 7); g.fill(); }
}

// ---------------------------------------------------------------- inside: life support, camera, lockers
/** The oxygen generator behind panel 12: a water tank, a cell, bubbles of oxygen rising when on. */
export function oxygenGen(g, x, y, t, { on = 0 } = {}) {
  roundRect(g, x, y, 250, 220, 12); g.fillStyle = '#5d6a7a'; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
  // water tank
  roundRect(g, x + 20, y + 30, 70, 160, 30); g.fillStyle = '#dfe8f2'; g.fill(); g.stroke();
  g.save(); roundRect(g, x + 20, y + 30, 70, 160, 30); g.clip(); g.fillStyle = '#3f8fe0'; g.fillRect(x + 20, y + 70, 70, 130); g.restore();
  label(g, 'H2O', x + 55, y + 130, 16, '#fff');
  // electrolysis cell
  roundRect(g, x + 120, y + 60, 70, 120, 8); g.fillStyle = '#cfe0f0'; g.fill(); g.strokeStyle = INK; g.stroke();
  g.fillStyle = '#555'; g.fillRect(x + 135, y + 75, 8, 90); g.fillRect(x + 167, y + 75, 8, 90);
  if (on > 0) {
    for (let i = 0; i < 26; i++) {
      const ph = ((t * (0.6 + hash01(i, 1)) + hash01(i, 2)) % 1);
      const bx = x + (i % 2 ? 139 : 171) + 4 * Math.sin(t * 3 + i), by = y + 165 - ph * 100;
      g.fillStyle = `rgba(255,255,255,${0.9 * on})`; g.beginPath(); g.arc(bx, by, 2 + hash01(i, 3) * 2.5, 0, 7); g.fill();
    }
  }
  // pipe up to the air, label, lights
  g.strokeStyle = '#9aa4ae'; g.lineWidth = 8; line(g, [x + 155, y + 60], [x + 155, y + 20]); line(g, [x + 155, y + 22], [x + 236, y + 22]);
  label(g, 'O2 GEN', x + 155, y + 200, 15, '#fff');
  for (let i = 0; i < 3; i++) { g.fillStyle = on > 0 ? ['#6fe08a', '#6fe08a', '#e8c450'][i] : '#2a2e33'; g.beginPath(); g.arc(x + 214, y + 70 + i * 26, 7, 0, 7); g.fill(); }
}

/** Smoke detector on the ceiling: slots, a lens (the camera) and a tiny red LED. */
export function smokeDetector(g, x, y, r, t, { led = 1, lens = 1 } = {}) {
  g.fillStyle = '#f4f3ee'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = '#8f8a80'; g.lineWidth = r * 0.06; g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = r * 0.05;
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; line(g, [x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55], [x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85]); }
  if (lens > 0) {
    const gr = g.createRadialGradient(x - r * 0.08, y - r * 0.08, 1, x, y, r * 0.22);
    gr.addColorStop(0, '#4d6a8c'); gr.addColorStop(0.5, '#10161f'); gr.addColorStop(1, '#000');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 0.2 * lens, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(x - r * 0.06, y - r * 0.07, r * 0.04, 0, 7); g.fill();
  }
  const blink = 0.55 + 0.45 * Math.sin(t * 3);
  const lx = x + r * 0.5, ly = y + r * 0.42;
  const gr = g.createRadialGradient(lx, ly, 0, lx, ly, r * 0.35);
  gr.addColorStop(0, `rgba(255,40,30,${0.8 * led * blink})`); gr.addColorStop(1, 'rgba(255,40,30,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(lx, ly, r * 0.35, 0, 7); g.fill();
  g.fillStyle = `rgba(255,${Math.round(60 + 60 * blink)},50,${led})`; g.beginPath(); g.arc(lx, ly, r * 0.055, 0, 7); g.fill();
}

/** A locker door with a number; open 0..1 swings it and shows two scrubber cartridges. */
export function locker(g, x, y, { n = '7', open = 0, items = 2 } = {}) {
  roundRect(g, x, y, 170, 200, 8); g.fillStyle = '#2b2f36'; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
  for (let i = 0; i < items; i++) {
    const cx = x + 55 + i * 60;
    roundRect(g, cx - 22, y + 30, 44, 140, 16); g.fillStyle = '#f0efe8'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#c0261c'; g.fillRect(cx - 22, y + 85, 44, 18); label(g, 'CO2', cx, y + 95, 12, '#fff');
  }
  const k = Math.cos(open * Math.PI * 0.5);
  if (k > 0.02) {
    g.save(); g.translate(x, y); g.scale(k, 1);
    roundRect(g, 0, 0, 170, 200, 8); g.fillStyle = '#d3ccbd'; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
    label(g, n, 85, 80, 70, '#283063');
    g.fillStyle = '#8a8475'; g.fillRect(140, 90, 12, 40);
    g.restore();
  }
}

/** The hatch's equalization valve, close up: a knob turned by `turn`; hiss 0..1 draws air rushing in. */
export function valve(g, cx, cy, r, t, { turn = 0, hiss = 0 } = {}) {
  g.fillStyle = '#c9c3b6'; g.fillRect(-60, -60, 660, 560);
  g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 2; g.beginPath(); g.arc(cx + 200, cy + 260, 420, 0, 7); g.stroke();
  g.fillStyle = '#8e897e'; g.beginPath(); g.arc(cx, cy, r * 1.35, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
  g.save(); g.translate(cx, cy); g.rotate(turn * Math.PI);
  g.fillStyle = '#3d3a35'; roundRect(g, -r, -r * 0.22, 2 * r, r * 0.44, r * 0.2); g.fill();
  g.fillStyle = '#d9d6cc'; g.beginPath(); g.arc(0, 0, r * 0.32, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
  g.restore();
  label(g, 'EQUALIZE', cx, cy + r * 1.75, 18, '#3d3a35');
  g.strokeStyle = '#3d3a35'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, r * 1.6, -2.4, -0.8); g.stroke();
  poly(g, [[cx + Math.cos(-0.8) * r * 1.6, cy + Math.sin(-0.8) * r * 1.6], [cx + Math.cos(-0.8) * r * 1.6 - 14, cy + Math.sin(-0.8) * r * 1.6 - 2], [cx + Math.cos(-0.8) * r * 1.6 - 2, cy + Math.sin(-0.8) * r * 1.6 + 13]], '#3d3a35');
  if (hiss > 0) {
    for (let i = 0; i < 40; i++) {
      const ph = (t * 2.5 + hash01(i, 5)) % 1, a = hash01(i, 6) * Math.PI * 2, d = r * (2.6 - 2.2 * ph);
      g.strokeStyle = `rgba(255,255,255,${0.7 * hiss * (1 - ph)})`; g.lineWidth = 2;
      line(g, [cx + Math.cos(a) * d, cy + Math.sin(a) * d], [cx + Math.cos(a) * (d - 18), cy + Math.sin(a) * (d - 18)]);
    }
  }
}

/** A row of potted plants under pink grow lights (Mara's biology rack). */
export function plants(g, x, y, t, { w = 240 } = {}) {
  roundRect(g, x, y, w, 90, 6); g.fillStyle = '#3a3f47'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
  const gr = g.createLinearGradient(0, y, 0, y + 90); gr.addColorStop(0, 'rgba(255,90,200,0.45)'); gr.addColorStop(1, 'rgba(255,90,200,0.08)');
  g.fillStyle = gr; g.fillRect(x + 4, y + 4, w - 8, 82);
  for (let i = 0; i < Math.floor(w / 40); i++) {
    const px = x + 22 + i * 40, py = y + 72;
    g.fillStyle = '#7a5a3a'; g.fillRect(px - 10, py, 20, 14);
    for (let k = 0; k < 4; k++) {
      const a = -Math.PI / 2 + (k - 1.5) * 0.45 + 0.08 * Math.sin(t * 1.2 + i + k);
      g.fillStyle = k % 2 ? '#5aa35a' : '#3f8a44';
      g.beginPath(); g.ellipse(px + Math.cos(a) * 14, py + Math.sin(a) * 18, 5, 12, a + Math.PI / 2, 0, 7); g.fill();
    }
  }
}

// ---------------------------------------------------------------- radio, map, Earth
/** The station's old ham radio with a frequency display; antenna = draw the taped cable up to a handrail. */
export function hamRadio(g, x, y, t, { freq = '145.800', lit = 0, antenna = true } = {}) {
  if (antenna) {
    g.strokeStyle = '#2a2a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 180, y + 20); g.bezierCurveTo(x + 260, y - 30, x + 250, y - 120, x + 300, y - 150); g.stroke();
    g.strokeStyle = '#c8a541'; g.lineWidth = 8; line(g, [x + 240, y - 170], [x + 360, y - 130]);
    g.fillStyle = '#d0d0c8'; for (const [tx, ty] of [[x + 270, y - 158], [x + 320, y - 142]]) { g.save(); g.translate(tx, ty); g.rotate(0.3); g.fillRect(-9, -7, 18, 14); g.restore(); }
  }
  roundRect(g, x, y, 200, 110, 10); g.fillStyle = '#4a4036'; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
  roundRect(g, x + 14, y + 14, 110, 40, 6); g.fillStyle = '#10180e'; g.fill();
  g.fillStyle = '#ffb648'; g.font = `700 24px ${FONTS.mono}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(freq, x + 69, y + 35);
  g.fillStyle = '#8a8f98'; g.beginPath(); g.arc(x + 160, y + 40, 22, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
  g.strokeStyle = INK; line(g, [x + 160, y + 40], [x + 160 + 16 * Math.cos(t * 0.3), y + 40 + 16 * Math.sin(t * 0.3)]);
  for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++) { g.fillStyle = '#2a2420'; g.beginPath(); g.arc(x + 24 + i * 11, y + 74 + j * 12, 3.5, 0, 7); g.fill(); }
  g.fillStyle = lit > 0 ? `rgba(80,255,120,${0.4 + 0.6 * lit})` : '#2a3a2c'; g.beginPath(); g.arc(x + 160, y + 88, 6, 0, 7); g.fill();
}

const LAND = {
  na: [[-165, 65], [-140, 70], [-95, 72], [-75, 60], [-55, 50], [-80, 30], [-97, 20], [-85, 10], [-105, 20], [-118, 33], [-125, 45], [-140, 58]],
  gl: [[-50, 60], [-30, 70], [-35, 82], [-60, 80], [-55, 70]],
  sa: [[-80, 9], [-60, 11], [-50, 0], [-35, -7], [-40, -22], [-48, -28], [-58, -38], [-65, -55], [-72, -50], [-71, -30], [-75, -15], [-81, -5]],
  eu: [[-10, 36], [0, 44], [-5, 50], [5, 58], [25, 70], [40, 68], [40, 45], [25, 36], [10, 40]],
  af: [[-17, 15], [-5, 35], [10, 37], [32, 31], [43, 12], [51, 12], [40, -5], [40, -15], [32, -28], [20, -35], [12, -20], [9, 4], [-8, 5]],
  as: [[40, 45], [40, 68], [70, 75], [110, 77], [140, 72], [170, 66], [140, 45], [122, 30], [110, 20], [105, 10], [100, 0], [95, 15], [80, 8], [72, 20], [60, 25], [50, 30], [45, 40]],
  au: [[115, -20], [130, -12], [142, -11], [153, -28], [147, -38], [135, -34], [117, -35]],
};
const CHILE = [[-70, -18], [-68, -22], [-69, -40], [-72, -52], [-75, -50], [-73, -30], [-71, -18]];
/** World map with the station's ground track (51.6° inclination). u = position along the track 0..1; chile 0..1 highlights Chile. */
export function worldMap(g, t, { u = 0, chile = 0, footprint = 0, x0 = 20, y0 = 60, w = 500, h = 300 } = {}) {
  const X = (lon) => x0 + ((lon + 180) / 360) * w, Y = (lat) => y0 + ((90 - lat) / 180) * h;
  g.fillStyle = '#1d5f9e'; g.fillRect(x0, y0, w, h);
  g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 30) line(g, [X(lon), y0], [X(lon), y0 + h]);
  for (let lat = -60; lat <= 60; lat += 30) line(g, [x0, Y(lat)], [x0 + w, Y(lat)]);
  for (const k in LAND) poly(g, LAND[k].map(([a, b]) => [X(a), Y(b)]), '#6aa252', 'rgba(0,0,0,0.35)', 1.2);
  if (chile > 0) poly(g, CHILE.map(([a, b]) => [X(a), Y(b)]), `rgba(230,50,40,${chile})`, `rgba(255,255,255,${chile})`, 1.5);
  // ground track: lat = 51.6 sin(phase), drifting west each lap
  const lonAt = (p) => -180 + ((p * 360 * 1.0) % 360), latAt = (p) => 51.6 * Math.sin(p * Math.PI * 2 + 0.6);
  g.strokeStyle = 'rgba(255,230,120,0.75)'; g.lineWidth = 2; g.setLineDash([6, 5]);
  g.beginPath(); for (let i = 0; i <= 120; i++) { const p = i / 120; const px = X(lonAt(p)), py = Y(latAt(p)); i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); g.setLineDash([]);
  const sx = X(lonAt(u)), sy = Y(latAt(u));
  if (footprint > 0) { g.fillStyle = `rgba(255,230,120,${0.25 * footprint})`; g.beginPath(); g.arc(sx, sy, 34, 0, 7); g.fill(); g.strokeStyle = `rgba(255,230,120,${0.8 * footprint})`; g.lineWidth = 2; g.stroke(); }
  g.fillStyle = '#fff'; g.beginPath(); g.arc(sx, sy, 5, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
  g.strokeStyle = INK; g.lineWidth = 2.5; g.strokeRect(x0, y0, w, h);
  return { X, Y, lonAt, latAt };
}

/** A room on Earth at night: wallpaper, a desk, a window with the stars (and the station crossing). */
export function earthRoom(g, t, { stationU = -1, lamp = 1 } = {}) {
  g.fillStyle = '#6b4f45'; g.fillRect(-60, -60, 660, 560);
  g.fillStyle = 'rgba(255,255,255,0.05)';
  for (let x = -60; x < 600; x += 30) g.fillRect(x, -60, 12, 560);
  // window
  roundRect(g, 300, 40, 200, 170, 6); g.fillStyle = '#0a1230'; g.fill();
  g.save(); roundRect(g, 300, 40, 200, 170, 6); g.clip();
  const r = rng(12);
  for (let i = 0; i < 50; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + 0.6 * r()})`; g.fillRect(300 + r() * 200, 40 + r() * 170, 1.5, 1.5); }
  if (stationU >= 0 && stationU <= 1) {
    const sx = 300 + stationU * 200, sy = 170 - Math.sin(stationU * Math.PI) * 110;
    const gr = g.createRadialGradient(sx, sy, 0, sx, sy, 10); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(sx, sy, 10, 0, 7); g.fill();
  }
  g.restore();
  g.strokeStyle = '#3b2a22'; g.lineWidth = 8; g.strokeRect(300, 40, 200, 170); line(g, [400, 40], [400, 210]); line(g, [300, 125], [500, 125]);
  // desk
  g.fillStyle = '#8a6040'; g.fillRect(-60, 300, 660, 26); g.fillStyle = '#6e4a30'; g.fillRect(-60, 326, 660, 200);
  // lamp glow
  if (lamp > 0) {
    const gr = g.createRadialGradient(80, 250, 10, 80, 250, 220); gr.addColorStop(0, `rgba(255,210,140,${0.35 * lamp})`); gr.addColorStop(1, 'rgba(255,210,140,0)');
    g.fillStyle = gr; g.fillRect(-60, -60, 660, 560);
    g.fillStyle = '#c9a26a'; poly(g, [[55, 210], [105, 210], [95, 180], [65, 180]], '#e8c27a', INK, 2); g.fillStyle = INK; g.fillRect(78, 210, 4, 90);
  }
}

/** A phone showing a post: lines [{ text, at }] appear as comments under an audio clip. */
export function phone(g, x, y, t, { title = 'LARKSPUR — PASS 12', comments = [], photo = 0 } = {}) {
  roundRect(g, x, y, 220, 400, 26); g.fillStyle = '#111'; g.fill();
  roundRect(g, x + 10, y + 16, 200, 368, 16); g.fillStyle = '#f4f4f6'; g.fill();
  label(g, title, x + 110, y + 44, 13, '#222');
  if (photo > 0) {
    roundRect(g, x + 20, y + 62, 180, 110, 8); g.fillStyle = '#05070f'; g.fill();
    g.save(); roundRect(g, x + 20, y + 62, 180, 110, 8); g.clip();
    g.fillStyle = '#c8c8c0'; g.fillRect(x + 60, y + 113, 100, 6); g.fillRect(x + 95, y + 100, 30, 30);
    for (const dx of [-30, 0, 30, 60]) { g.fillStyle = '#1d2d63'; g.fillRect(x + 80 + dx, y + 80, 12, 70); }
    for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(255,220,120,${photo})`; g.beginPath(); g.arc(x + 75 + i * 14, y + 116, 2.5, 0, 7); g.fill(); }
    g.restore();
  } else {
    roundRect(g, x + 20, y + 62, 180, 60, 10); g.fillStyle = '#e1e4ea'; g.fill();
    g.fillStyle = '#e0473c'; g.beginPath(); g.moveTo(x + 36, y + 78); g.lineTo(x + 56, y + 92); g.lineTo(x + 36, y + 106); g.fill();
    for (let i = 0; i < 22; i++) { const hh = 6 + 22 * Math.abs(Math.sin(i * 1.7 + t * 2)); g.fillStyle = '#7a8090'; g.fillRect(x + 68 + i * 5.6, y + 92 - hh / 2, 3, hh); }
  }
  comments.forEach((c, i) => {
    if (t < c.at) return;
    const cy = y + 196 + i * 44, a = clamp((t - c.at) / 0.25);
    g.globalAlpha = a;
    roundRect(g, x + 20, cy - 16, 180, 34, 10); g.fillStyle = c.color ?? '#e9ebf0'; g.fill();
    g.font = `800 13px ${FONTS.display}`; g.fillStyle = '#222'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(c.text, x + 32, cy + 1);
    g.globalAlpha = 1;
  });
}

// ---------------------------------------------------------------- the end
/** Thruster breakers: four big toggles; states[i] 0 = on (up), 1 = pulled (down). warn = the DEORBIT BURN light. */
export function breakers(g, x, y, t, { states = [0, 0, 0, 0], warn = 1 } = {}) {
  roundRect(g, x, y, 380, 260, 12); g.fillStyle = '#3a3f47'; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
  roundRect(g, x + 90, y + 14, 200, 40, 8); g.fillStyle = warn > 0 && Math.sin(t * 9) > -0.2 ? `rgba(230,40,30,${0.6 + 0.4 * warn})` : '#3b1c19'; g.fill();
  label(g, 'DEORBIT BURN', x + 190, y + 35, 18, warn > 0 ? '#fff' : '#7a4a44');
  states.forEach((st, i) => {
    const bx = x + 60 + i * 87, by = y + 150;
    roundRect(g, bx - 26, by - 60, 52, 120, 8); g.fillStyle = '#23262b'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
    const k = clamp(st);
    roundRect(g, bx - 18, by - 48 + k * 54, 36, 42, 6); g.fillStyle = k > 0.5 ? '#8a8f98' : '#e8c450'; g.fill(); g.stroke();
    label(g, `THR ${i + 1}`, bx, by + 76, 15, '#d6dde6');
  });
}

/** The Earth with the old and the new (lower) orbit. lower 0..1 moves the dot down to the inner orbit. */
export function orbitDiagram(g, t, { lower = 0 } = {}) {
  space(g, t);
  const cx = 270, cy = 230;
  earth(g, cx, cy, 120, t, { rot: t * 0.02 });
  g.setLineDash([8, 6]); g.lineWidth = 2;
  g.strokeStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(cx, cy, 175, 0, 7); g.stroke();
  g.strokeStyle = 'rgba(255,190,90,0.8)'; g.beginPath(); g.arc(cx, cy, 145, 0, 7); g.stroke(); g.setLineDash([]);
  const r = lerp(175, 145, easeInOutCubic(clamp(lower))), a = -Math.PI / 2 + t * 0.6;
  g.fillStyle = '#fff'; g.beginPath(); g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 6, 0, 7); g.fill();
}

/** The capsule coming home under three parachutes over the ocean. */
export function parachutes(g, t, { y = 140 } = {}) {
  const gr = g.createLinearGradient(0, -40, 0, 480); gr.addColorStop(0, '#8fc4ee'); gr.addColorStop(1, '#e8f3fb');
  g.fillStyle = gr; g.fillRect(-60, -60, 660, 560);
  g.fillStyle = '#2f73b5'; g.fillRect(-60, 380, 660, 120);
  for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse((i * 140 + t * 10) % 700 - 80, 70 + i * 50, 60, 18, 0, 0, 7); g.fill(); }
  const sway = Math.sin(t * 0.9) * 0.05;
  g.save(); g.translate(270, y); g.rotate(sway);
  for (const [dx, col] of [[-80, '#e2483d'], [0, '#f4f4f0'], [80, '#e2483d']]) {
    g.fillStyle = col; g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.arc(dx, -10, 46, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1; line(g, [dx - 44, -10], [0, 130]); line(g, [dx + 44, -10], [0, 130]);
  }
  g.restore();
  g.save(); g.translate(270 + sway * 130, y + 150); g.rotate(-Math.PI / 2);
  poly(g, [[-22, -24], [18, -12], [26, -8], [26, 8], [18, 12], [-22, 24]], '#f2f2f0', INK, 2.2);
  poly(g, [[-26, -25], [-22, -24], [-22, 24], [-26, 25]], '#3a3530', INK, 2);
  g.restore();
}

export { screen };

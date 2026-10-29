// Procedural canvas textures: facades, billboards, tickers, phone screens.
import * as THREE from 'three';
import { rng, pick } from './util.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function tex(c, { repeat = false, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

// One facade tile = 16 x 16 windows. Building UVs are scaled so that a tile covers
// FACADE_TILE.w x FACADE_TILE.h metres. `map` is the wall, `emissive` the lit windows.
export const FACADE_TILE = { w: 48, h: 56 };

export function facadeTextures(seed = 1, { lit = 0.42 } = {}) {
  const r = rng(seed);
  const N = 16, S = 1024, cell = S / N;
  const [c, g] = canvas(S, S);
  const [e, ge] = canvas(S, S);
  g.fillStyle = '#d4d2dc';
  g.fillRect(0, 0, S, S);
  ge.fillStyle = '#000';
  ge.fillRect(0, 0, S, S);
  const warm = ['#ffd27a', '#ffe3a8', '#fff1cf', '#ffc46b'];
  const cool = ['#bfe3ff', '#d9f0ff', '#a6c8ff'];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const px = x * cell + cell * 0.18, py = y * cell + cell * 0.2;
      const w = cell * 0.64, h = cell * 0.6;
      g.fillStyle = '#1d2236';
      g.fillRect(px, py, w, h);
      if (r() < lit) {
        const col = r() < 0.75 ? pick(r, warm) : pick(r, cool);
        ge.fillStyle = col;
        ge.globalAlpha = 0.55 + r() * 0.45;
        ge.fillRect(px, py, w, h);
        // blinds / silhouettes so lit windows are not flat squares
        if (r() < 0.35) {
          ge.globalAlpha = 1;
          ge.fillStyle = '#000';
          ge.fillRect(px, py + h * (0.2 + r() * 0.5), w, h * 0.12);
        }
        ge.globalAlpha = 1;
        g.fillStyle = '#3a3a48';
        g.fillRect(px, py, w, h);
      }
    }
  }
  const map = tex(c, { repeat: true });
  const emissive = tex(e, { repeat: true });
  return { map, emissive };
}

const WORDS = [
  ['WHAT IF?', 'NEW EPISODES'], ['TONIGHT', 'LIVE ON STAGE'], ['50% OFF', 'EVERYTHING'],
  ['OPEN 24/7', 'COFFEE · BAGELS'], ['SUMMER TOUR', 'SOLD OUT'], ['FLY NOW', 'NYC → TOKYO'],
  ['GAME DAY', 'SUNDAY 8PM'], ['THE MUSICAL', 'NOW PLAYING'], ['NEW DROP', 'SNEAKERS'],
  ['BURGERS', 'SINCE 1987'], ['STREAM IT', 'ALL SEASON'], ['HELLO NYC', 'WELCOME'],
  ['BIG SALE', 'TODAY ONLY'], ['ENERGY', 'DRINK MORE'], ['PREMIERE', 'FRIDAY'], ['ROBOTS', 'IN THEATERS'],
];
const PALETTES = [
  ['#ff2d6f', '#ffb800', '#fff'], ['#00d1ff', '#2b2bff', '#fff'], ['#ffe600', '#111', '#111'],
  ['#9b3cff', '#ff4fd8', '#fff'], ['#00e08a', '#004d40', '#fff'], ['#ff5a1f', '#2a0a00', '#fff'],
  ['#ffffff', '#ff1f3d', '#ff1f3d'], ['#14f1ff', '#0a0a1a', '#14f1ff'], ['#ff9cd0', '#5b1aff', '#fff'],
];

// A made-up billboard (no real brands). aspect = width / height.
export function billboardTexture(seed, aspect = 1.6) {
  const r = rng(seed * 7919 + 13);
  const H = 256, W = Math.round(Math.min(1024, H * aspect));
  const [c, g] = canvas(W, H);
  const [a, b, ink] = pick(r, PALETTES);
  const [big, small] = pick(r, WORDS);
  const style = Math.floor(r() * 4);
  const grad = g.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, a);
  grad.addColorStop(1, b);
  g.fillStyle = style === 2 ? '#07070f' : grad;
  g.fillRect(0, 0, W, H);
  // shapes
  for (let i = 0; i < 6; i++) {
    g.globalAlpha = 0.15 + r() * 0.25;
    g.fillStyle = r() < 0.5 ? '#fff' : b;
    const R = H * (0.2 + r() * 0.8);
    g.beginPath();
    g.arc(r() * W, r() * H, R, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  const fit = (text, maxW, size, weight = 900) => {
    let s = size;
    do {
      g.font = `${weight} ${s}px "Inter Display", Inter, "DejaVu Sans", sans-serif`;
      s -= 4;
    } while (g.measureText(text).width > maxW && s > 10);
  };
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (style === 2) {
    fit(big, W * 0.86, H * 0.42);
    g.lineWidth = 6;
    g.strokeStyle = a;
    g.shadowColor = a;
    g.shadowBlur = 18;
    g.strokeText(big, W / 2, H * 0.45);
    g.shadowBlur = 0;
  } else {
    fit(big, W * 0.86, H * 0.42);
    g.fillStyle = ink;
    g.fillText(big, W / 2, H * 0.44);
  }
  fit(small, W * 0.7, H * 0.13, 700);
  g.fillStyle = style === 2 ? '#fff' : ink;
  g.globalAlpha = 0.9;
  g.fillText(small, W / 2, H * 0.76);
  g.globalAlpha = 1;
  if (style === 3) {
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(0, H * 0.88, W, H * 0.12);
  }
  return tex(c);
}

// Scrolling LED "zipper" band; animate with texture.offset.x.
export function tickerTexture(text, color = '#ffcc33') {
  const [c, g] = canvas(2048, 64);
  g.fillStyle = '#05050a';
  g.fillRect(0, 0, 2048, 64);
  g.font = '800 44px "JetBrains Mono", "DejaVu Sans Mono", monospace';
  g.fillStyle = color;
  g.textBaseline = 'middle';
  let x = 10;
  while (x < 2048) {
    g.fillText(text, x, 34);
    x += g.measureText(text).width + 60;
  }
  return tex(c, { repeat: true });
}

// Phone home screen: colourful app grid on a gradient (like the reference POV shot).
export function phoneScreenTexture(seed = 3) {
  const r = rng(seed);
  const [c, g] = canvas(256, 512);
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#ff3d7f');
  grad.addColorStop(1, '#6a1bff');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 512);
  const cols = ['#ffd23f', '#3fd2ff', '#7dff6a', '#ff6a3d', '#ffffff', '#b07cff', '#ff9ce0'];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 4; x++) {
      g.fillStyle = pick(r, cols);
      const s = 42;
      const px = 22 + x * 56, py = 70 + y * 70;
      g.beginPath();
      g.roundRect(px, py, s, s, 10);
      g.fill();
    }
  }
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.font = '700 22px Inter, sans-serif';
  g.fillText('18:42', 20, 36);
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.beginPath();
  g.roundRect(20, 440, 216, 52, 16);
  g.fill();
  return tex(c);
}

// Vertical gradient for the sky dome (top -> horizon).
export function gradientTexture(stops) {
  const [c, g] = canvas(4, 512);
  const grad = g.createLinearGradient(0, 0, 0, 512);
  for (const [o, col] of stops) grad.addColorStop(o, col);
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 512);
  return tex(c);
}

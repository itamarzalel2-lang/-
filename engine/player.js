// Loads /videos/<name>/scene.js and renders it at any time t.
//   capture mode (?capture): exposes window.__player for engine/render.mjs to step frame by frame
//   preview mode (default):  plays in real time with a scrubber
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { Subtitles } from './lib/subtitles.js';
import { Overlay } from './lib/overlay.js';

const params = new URLSearchParams(location.search);
const name = params.get('video');
const capture = params.has('capture');
// render passes: 'nooverlay' = the 3D scene only; 'overlayonly' = text only, transparent
const noOverlay = params.has('nooverlay'), overlayOnly = params.has('overlayonly');
if (noOverlay) document.getElementById('overlay').style.display = 'none';
if (overlayOnly) {
  document.getElementById('gl').style.display = 'none';
  for (const el of [document.documentElement, document.body, document.getElementById('stage')]) el.style.background = 'transparent';
}
const dpr = Number(params.get('dpr') || (capture ? 2 : Math.min(devicePixelRatio, 2)));
const W = 540, H = 960;

const mod = await import(`/videos/${name}/scene.js`);
// Defaults tuned for CPU-only WebGL: FXAA instead of MSAA and Lambert instead of PBR is
// ~35% faster per frame with very little visible difference at 1080x1920.
const config = { fps: 30, duration: 10, fov: 60, bloom: { strength: 0.7, radius: 0.55, threshold: 0.82 }, exposure: 1, msaa: 0, fxaa: true, lambert: true, ...mod.config };

// narration: videos/<name>/voice.json (made by engine/voice.mjs) drives the subtitles, and
// scenes get it too, so shots can follow the lines (ctx.voice)
let voice = null;
try {
  const r = await fetch(`/videos/${name}/voice.json`);
  if (r.ok) voice = await r.json();
} catch { /* no narration yet */ }
const overlay = new Overlay(document.getElementById('overlay'));
let draw;

if (config.canvas === '2d') {
  // flat 2D scenes (engine/lib/toon.js): setup draws on a plain canvas in 540x960 units
  const c2d = Object.assign(document.createElement('canvas'), { id: 'c2d', width: W * dpr, height: H * dpr });
  c2d.style.cssText = 'position:absolute;inset:0;width:540px;height:960px';
  document.getElementById('gl').replaceWith(c2d);
  if (overlayOnly) c2d.style.display = 'none';
  const g = c2d.getContext('2d');
  const update = await mod.setup({ g, overlay, config, W, H, dpr, voice });
  draw = (t) => {
    if (overlayOnly) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    update(t);
  };
} else {
  const canvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = config.exposure;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(config.fov, W / H, 0.05, 4000);
  scene.add(camera);

  // scenes may push extra post-processing passes (applied to the final image) into ctx.post
  const ctx = { THREE, renderer, scene, camera, overlay, config, W, H, dpr, voice, post: [] };
  const update = await mod.setup(ctx);

  // Optional: swap PBR materials for Lambert (much cheaper on CPU-only WebGL, similar look here)
  if ((params.get('lambert') ?? (config.lambert ? '1' : '0')) === '1') {
    // (runs after setup, so every material the scene built is covered)
    const keep = ['map', 'emissiveMap', 'emissive', 'emissiveIntensity', 'vertexColors', 'transparent', 'opacity', 'side', 'depthWrite', 'normalMap', 'normalScale', 'flatShading'];
    const swapped = new Map();
    scene.traverse((o) => {
      if (!o.material || !o.material.isMeshStandardMaterial) return;
      const m = o.material;
      if (!swapped.has(m)) {
        // colours are shared by reference and numbers forwarded, so scene code that keeps
        // the original material (e.g. city.setArtificial) still drives what is rendered
        const l = new THREE.MeshLambertMaterial();
        for (const k of keep) if (m[k] !== undefined && l[k] !== undefined) l[k] = m[k];
        l.color = m.color;
        for (const k of ['emissiveIntensity', 'opacity']) {
          Object.defineProperty(m, k, { get: () => l[k], set: (v) => { l[k] = v; }, configurable: true });
        }
        swapped.set(m, l);
      }
      o.material = swapped.get(m);
    });
  }

  const target = new THREE.WebGLRenderTarget(W * dpr, H * dpr, { type: THREE.HalfFloatType, samples: Number(params.get('msaa') ?? config.msaa ?? 4) });
  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(dpr);
  composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  const b = config.bloom;
  if (b && params.get('bloom') !== '0') composer.addPass(new UnrealBloomPass(new THREE.Vector2(W * dpr, H * dpr), b.strength, b.radius, b.threshold));
  composer.addPass(new OutputPass());
  for (const p of ctx.post) composer.addPass(p);
  if (config.fxaa && !Number(params.get('msaa') ?? config.msaa)) {
    const fxaa = new ShaderPass(FXAAShader);
    fxaa.material.uniforms.resolution.value.set(1 / (W * dpr), 1 / (H * dpr));
    composer.addPass(fxaa);
  }
  draw = (t) => {
    update(t); // also in the text pass: tags follow objects in the scene
    if (!overlayOnly) composer.render();
  };
}

const subtitles = voice && !noOverlay ? new Subtitles(document.getElementById('overlay'), voice, mod.subtitles ?? {}) : null;

function renderAt(t) {
  draw(t);
  if (!noOverlay) {
    overlay.update(t);
    subtitles?.update(t);
  }
}

await document.fonts.ready;
window.__player = { config, audio: mod.audio ?? [], renderAt, size: [W * dpr, H * dpr] };
window.__ready = true;

if (!capture) {
  document.body.classList.add('preview');
  const scrub = document.getElementById('scrub');
  const slider = document.getElementById('time'), clock = document.getElementById('clock'), btn = document.getElementById('play');
  scrub.hidden = false;
  slider.max = config.duration;
  let playing = true, t = Number(params.get('t') || 0), last = performance.now();
  btn.onclick = () => { playing = !playing; btn.textContent = playing ? 'pause' : 'play'; };
  slider.oninput = () => { t = Number(slider.value); };
  const fit = () => {
    const s = Math.min(1, (innerHeight - 60) / H);
    document.getElementById('stage').style.transform = `scale(${s})`;
    document.getElementById('stage').style.marginBottom = `${(s - 1) * H}px`;
  };
  addEventListener('resize', fit);
  fit();
  const loop = (now) => {
    if (playing) t = (t + (now - last) / 1000) % config.duration;
    last = now;
    slider.value = t;
    clock.textContent = `${t.toFixed(2)} s`;
    renderAt(t);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

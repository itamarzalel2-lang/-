// Loads /videos/<name>/scene.js and renders it at any time t.
//   capture mode (?capture): exposes window.__player for engine/render.mjs to step frame by frame
//   preview mode (default):  plays in real time with a scrubber
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Overlay } from './lib/overlay.js';

const params = new URLSearchParams(location.search);
const name = params.get('video');
const capture = params.has('capture');
const dpr = Number(params.get('dpr') || (capture ? 2 : Math.min(devicePixelRatio, 2)));
const W = 540, H = 960;

const mod = await import(`/videos/${name}/scene.js`);
const config = { fps: 30, duration: 10, fov: 60, bloom: { strength: 0.7, radius: 0.55, threshold: 0.82 }, exposure: 1, ...mod.config };

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(dpr);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = config.exposure;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(config.fov, W / H, 0.05, 4000);
scene.add(camera);
const overlay = new Overlay(document.getElementById('overlay'));

const ctx = { THREE, renderer, scene, camera, overlay, config, W, H, dpr };
const update = await mod.setup(ctx);

const target = new THREE.WebGLRenderTarget(W * dpr, H * dpr, { type: THREE.HalfFloatType, samples: config.msaa ?? 4 });
const composer = new EffectComposer(renderer, target);
composer.setPixelRatio(dpr);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const b = config.bloom;
if (b) composer.addPass(new UnrealBloomPass(new THREE.Vector2(W * dpr, H * dpr), b.strength, b.radius, b.threshold));
composer.addPass(new OutputPass());

function renderAt(t) {
  update(t);
  overlay.update(t);
  composer.render();
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

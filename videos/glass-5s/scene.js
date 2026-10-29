// What if all glass turned liquid for 5 seconds?
// Every window runs down the towers and freezes mid-flow when it turns solid again.
// Twist: the "old church windows flow" story is a myth (Zanotto 1998).
// Narration: ./script.json. Sources: ./sources.md
import * as THREE from 'three';
import { timesSquare } from '/engine/lib/city.js';
import { buildTraffic } from '/engine/lib/traffic.js';
import { buildCrowd } from '/engine/lib/crowd.js';
import { cameraPath, handheld, shots, applyCamera } from '/engine/lib/camera.js';
import { clamp, smoothstep, hash01 } from '/engine/lib/util.js';

const MELT = 13.4;
const SOLID = MELT + 5;
const D = 39.5;

export const config = {
  fps: 30,
  duration: D,
  fov: 60,
  bloom: { strength: 0.5, radius: 0.5, threshold: 0.88 },
};

export const audio = [
  { type: 'ambience', from: 0, to: D, level: 0.85 },
  { type: 'crowd', from: 0, to: D, level: 0.9 },
  { type: 'whoosh', at: 4.0 },
  { type: 'tick', at: [10.9, 11.9, 12.9] },
  { type: 'riser', from: 11.2, to: MELT },
  { type: 'crack', at: MELT },
  { type: 'rain', from: MELT + 0.1, to: SOLID, level: 0.7 },
  { type: 'drip', from: MELT + 0.2, to: SOLID, count: 30 },
  { type: 'crowd', from: MELT + 0.6, to: SOLID + 1, level: 1.6 },
  { type: 'crack', at: SOLID },
  { type: 'crack', at: SOLID + 0.12, gain: 0.6 },
  { type: 'drone', from: SOLID + 0.5, to: 35 },
];

// liquid glass running down a facade: streaks under every window column, flowing
// downward, frozen when `flow` stops growing
const FLOW_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FLOW_FRAG = /* glsl */ `
  uniform float tau;    // seconds of flow (stops at 5)
  uniform float len;    // facade length (m)
  uniform float height; // facade height (m)
  uniform float alpha;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    float x = vUv.x * len, y = vUv.y * height;
    float col = fract(x / 3.0);
    float colMask = smoothstep(0.12, 0.2, col) * smoothstep(0.88, 0.8, col);
    // distance from this point up to the bottom of the window above it
    float d = mod(1.2 - y, 3.5);
    float flow = 1.6 * tau + 1.4 * tau * tau;
    float wet = step(d, flow) * step(y, height - 1.0);
    // ripples and highlights travelling down
    float k = floor(x * 7.0);
    float n = hash(vec2(k, floor((y + tau * 5.0) * 1.6)));
    float streak = 0.55 + 0.45 * sin(x * 21.0 + n * 6.0);
    float a = wet * colMask * alpha * (0.55 + 0.35 * streak);
    if (a < 0.01) discard;
    vec3 c = mix(vec3(0.55, 0.78, 0.9), vec3(0.95, 1.0, 1.0), pow(streak, 6.0) * 0.8);
    gl_FragColor = vec4(c, a);
  }`;

export async function setup({ scene, camera, overlay }) {
  const city = timesSquare({ time: 'day', clear: [[4, 26, 16], [-23, -10, 12], [-21, 5, 10]] });
  scene.add(city.group);
  scene.fog = city.fog;
  scene.fog.density = 0.0016;

  const traffic = buildTraffic({ lanes: city.lanes, queues: city.queues, count: city.carCount });
  scene.add(traffic.group);
  traffic.brake(MELT + 0.6);
  const crowd = buildCrowd({ zones: city.crowdZones, standZones: city.standZones, count: 430, standing: 46, stepHeight: city.stepHeight, avoid: [[4, 26, 3], [-23, -10, 2.6], [-22, 5, 2.4]] });
  scene.add(crowd.group);

  // a curtain of liquid glass and a growing pool in front of every facade on the square
  const curtains = [], pools = [];
  const poolMat = new THREE.MeshStandardMaterial({ color: '#4f7f99', roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.6 });
  for (const f of city.facades) {
    if (f.z1 < -250 || f.z0 > 110) continue;
    const len = f.z1 - f.z0;
    const mat = new THREE.ShaderMaterial({
      vertexShader: FLOW_VERT, fragmentShader: FLOW_FRAG, transparent: true, depthWrite: false,
      uniforms: { tau: { value: 0 }, len: { value: len }, height: { value: f.h }, alpha: { value: 0.85 } },
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(len, f.h), mat);
    plane.position.set(f.x - f.side * 0.25, f.h / 2, (f.z0 + f.z1) / 2);
    plane.rotation.y = f.side < 0 ? Math.PI / 2 : -Math.PI / 2;
    plane.visible = false;
    scene.add(plane);
    curtains.push(mat);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, len - 1).rotateX(-Math.PI / 2), poolMat);
    pool.position.set(f.x, 0.17, (f.z0 + f.z1) / 2);
    pool.userData = { x: f.x, side: f.side, seed: hash01(curtains.length) };
    pool.visible = false;
    scene.add(pool);
    pools.push(pool);
    curtains[curtains.length - 1].userData = { plane };
  }

  const cam = shots([
    { id: 'aerial', to: 4.5, cam: cameraPath([
      { t: 0, pos: [8, 120, 150], look: [-8, 20, -40], fov: 52 },
      { t: 4.5, pos: [4, 10, 34], look: [-20, 20, -20], fov: 58 },
    ]) },
    { id: 'street', to: SOLID + 0.4, cam: cameraPath([
      { t: 4.5, pos: [4, 1.7, 30], look: [-26, 22, -2], fov: 60 },
      { t: MELT, pos: [4, 1.7, 26], look: [-26, 30, -6], fov: 62 },
      { t: SOLID + 0.4, pos: [4, 1.7, 25], look: [-26, 14, -8], fov: 62 },
    ]) },
    { id: 'close', to: 27.2, cam: cameraPath([
      { t: SOLID + 0.4, pos: [-21.5, 1.4, 6], look: [-26, 9, -14], fov: 56 },
      { t: 27.2, pos: [-21.8, 1.4, 4], look: [-26, 6, -14], fov: 50 },
    ]) },
    { id: 'up', to: 35.8, cam: cameraPath([
      { t: 27.2, pos: [-23, 1.5, -10], look: [-25, 40, -30], fov: 64 },
      { t: 35.8, pos: [-23, 1.5, -11], look: [-25, 55, -40], fov: 66 },
    ]) },
    { id: 'rise', to: Infinity, cam: cameraPath([
      { t: 35.8, pos: [4, 4, 26], look: [-12, 8, -20], fov: 58 },
      { t: D, pos: [10, 50, 70], look: [-8, 0, -40], fov: 54 },
    ]) },
  ]);

  overlay.title('What if all <span class="hl">glass</span> turned liquid for 5 seconds?', { from: 0, fadeIn: 0, to: D + 1 });
  overlay.fact({
    kicker: 'Fact',
    text: 'The Empire State Building has <span class="hl">6,514</span> windows.',
    source: 'CNN “Empire State Building Fast Facts” · Kawneer project page',
    from: 5.6, to: 10.4,
  });
  overlay.timer({
    from: 10.4, to: 21.4,
    label: (t) => (t < MELT ? 'Glass melts in' : t < SOLID ? 'Liquid for' : 'Solid again'),
    value: (t) => (t < MELT ? `${(MELT - t).toFixed(1)}<small>s</small>` : t < SOLID ? `${(t - MELT).toFixed(1)}<small>/ 5.0s</small>` : '5.0<small>s ✓</small>'),
    mode: (t) => (t < MELT ? '' : t < SOLID ? 'gone' : 'back'),
  });
  overlay.fact({
    kicker: 'Myth',
    text: 'Old church windows are thicker at the bottom because glass <span class="hl">flows</span>?',
    source: 'A popular claim (see below)',
    badge: 'claim ?',
    from: 22.0, to: 27.2,
  });
  overlay.fact({
    kicker: 'Busted',
    text: 'At room temperature, glass would need <span class="hl">longer than the age of the universe</span> to visibly sag.',
    source: 'E. D. Zanotto, American Journal of Physics 66, 392 (1998) · confirmed by Gulbiten, Mauro et al. (2017)',
    from: 27.6, to: 35.6,
  });
  overlay.end('Comment what should <span class="hl">melt</span> next', { from: 36.4, to: D + 1 });

  return function update(t) {
    city.update(t);
    const tau = clamp(t - MELT, 0, 5); // stops growing when the glass is solid again
    for (const m of curtains) {
      m.uniforms.tau.value = tau;
      m.userData.plane.visible = t >= MELT;
    }
    for (const p of pools) {
      p.visible = t >= MELT + 0.4;
      const w = Math.min(5.5, 0.35 * tau * tau + 0.5 * tau) * (0.7 + 0.6 * p.userData.seed);
      p.scale.set(Math.max(0.01, w), 1, 1);
      p.position.x = p.userData.x - p.userData.side * w / 2;
    }

    const c = cam(t);
    applyCamera(camera, c, handheld(t, { amp: c.id === 'street' ? 0.004 : 0.0015, kicks: [{ at: MELT, amp: 0.008, decay: 4 }, { at: SOLID, amp: 0.008, decay: 5 }] }));

    traffic.update(t, { ride: 0.33, tyreScale: 1 });
    crowd.update(t, { stopAt: MELT + 0.4, lookYaw: -Math.PI / 2 });
  };
}

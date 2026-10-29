// What if everyone lost their colour vision (cones) for 5 seconds?
// Twist: rod-only vision isn't just grey. Rods saturate in daylight (blinding glare), they
// barely see red (red signs go dark), and the centre of the fovea has no rods (a blank spot
// where you look). Narration: ./script.json. Sources: ./sources.md
import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { timesSquare } from '/engine/lib/city.js';
import { buildTraffic } from '/engine/lib/traffic.js';
import { buildCrowd } from '/engine/lib/crowd.js';
import { cameraPath, handheld, shots, applyCamera } from '/engine/lib/camera.js';
import { smoothstep, remap } from '/engine/lib/util.js';

// simulation time
const OFF = 14.0;
const ON = OFF + 5;
// story time
const REPLAY = [18.2, 34.0]; // sim 14.3 .. 18.7, slowed, one effect at a time
const D = 41.5;
const simAt = remap([[0, 0], [REPLAY[0], REPLAY[0]], [REPLAY[0], 14.3], [REPLAY[1], 18.7], [REPLAY[1], 18.7], [D, 18.7 + D - REPLAY[1]]]);

export const config = {
  fps: 30,
  duration: D,
  fov: 60,
  bloom: { strength: 0.45, radius: 0.5, threshold: 0.9 },
};

export const audio = [
  { type: 'ambience', from: 0, to: D, level: 0.9 },
  { type: 'crowd', from: 0, to: D, level: 1.0 },
  { type: 'whoosh', at: 4.1 },
  { type: 'tick', at: [11.0, 12.0, 13.0] },
  { type: 'riser', from: 11.3, to: OFF },
  { type: 'hit', at: OFF },
  { type: 'tinnitus', from: OFF, to: REPLAY[0] },
  { type: 'whoosh', at: REPLAY[0] - 0.35 },
  { type: 'drone', from: REPLAY[0], to: REPLAY[1] },
  { type: 'whoosh', at: REPLAY[1] + (ON - 18.7) - 0.3 },
];

// rod-only vision as a post effect on the final image
const ROD_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0 }, // 0 normal .. 1 rods only
    glare: { value: 0 }, // rods saturating in daylight
    redDark: { value: 0 }, // how strongly red is lost
    scotoma: { value: 0 }, // blank spot in the centre of view
    aspect: { value: 540 / 960 },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float amount, glare, redDark, scotoma, aspect;
    varying vec2 vUv;
    void main() {
      vec4 src = texture2D(tDiffuse, vUv);
      // rods have poor acuity: a soft blur
      vec3 blur = vec3(0.0);
      for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++)
        blur += texture2D(tDiffuse, vUv + vec2(float(i), float(j)) * 0.0022).rgb;
      blur /= 25.0;
      vec3 c = mix(src.rgb, blur, amount * 0.85);
      // scotopic (rod) luminance: blue-green bright, red almost black
      float rod = dot(c, vec3(mix(0.3, 0.02, redDark), 0.55, 0.43));
      // saturated rods: everything bright washes out to a glare
      float lum = 1.0 - exp(-rod * (1.0 + 4.0 * glare));
      vec3 grey = vec3(lum) * vec3(0.93, 0.97, 1.0);
      // rod-free foveola: a blank, smeared spot exactly where you look
      vec2 d = (vUv - vec2(0.5, 0.52)) * vec2(1.0, 1.0 / aspect);
      float spot = smoothstep(0.075, 0.035, length(d)) * scotoma;
      grey = mix(grey, vec3(0.55), spot);
      gl_FragColor = vec4(mix(src.rgb, grey, amount), src.a);
    }`,
};

export async function setup({ scene, camera, overlay, post }) {
  const city = timesSquare({ time: 'day', clear: [[6, 20, 16], [3, 10, 10]] });
  scene.add(city.group);
  scene.fog = city.fog;
  scene.fog.density = 0.0015;

  const traffic = buildTraffic({ lanes: city.lanes, queues: city.queues, count: city.carCount });
  scene.add(traffic.group);
  traffic.brake(OFF + 0.7);
  const crowd = buildCrowd({ zones: city.crowdZones, standZones: city.standZones, count: 430, standing: 46, stepHeight: city.stepHeight, avoid: [[6, 20, 3], [4, 14, 3], [3, 8, 3]] });
  scene.add(crowd.group);

  const rods = new ShaderPass(ROD_SHADER);
  post.push(rods);

  const cam = shots([
    { id: 'aerial', to: 4.5, cam: cameraPath([
      { t: 0, pos: [8, 110, 150], look: [-6, 0, -40], fov: 52 },
      { t: 4.5, pos: [6, 8, 34], look: [-10, 10, -30], fov: 58 },
    ]) },
    { id: 'street', to: REPLAY[0], cam: cameraPath([
      { t: 4.5, pos: [6, 1.7, 28], look: [-12, 12, -30], fov: 60 },
      { t: OFF, pos: [6, 1.7, 21], look: [-14, 13, -30], fov: 60 },
      { t: REPLAY[0], pos: [6, 1.7, 20.5], look: [-14, 12, -30], fov: 60 },
    ]) },
    // the replay: the same view, one rod effect explained at a time
    { id: 'signs', to: REPLAY[1], cam: cameraPath([
      { t: REPLAY[0], pos: [4, 1.7, 14], look: [-16, 13, -34], fov: 58 },
      { t: REPLAY[1], pos: [3, 1.7, 8], look: [-17, 14, -38], fov: 50 },
    ]) },
    { id: 'rise', to: Infinity, cam: cameraPath([
      { t: REPLAY[1], pos: [6, 1.7, 20], look: [-14, 12, -30], fov: 60 },
      { t: D, pos: [10, 50, 70], look: [-8, 0, -40], fov: 54 },
    ]) },
  ]);

  overlay.title('What if everyone lost their <span class="hl">color vision</span> for 5 seconds?', { from: 0, fadeIn: 0, to: D + 1 });
  overlay.timer({
    from: 10.8, to: D - 3,
    label: (t) => { const s = simAt(t); return s < OFF ? 'Color vision off in' : s < ON ? 'Rods only for' : 'Color is back'; },
    value: (t) => { const s = simAt(t); return s < OFF ? `${(OFF - s).toFixed(1)}<small>s</small>` : s < ON ? `${(s - OFF).toFixed(1)}<small>/ 5.0s</small>` : '5.0<small>s ✓</small>'; },
    mode: (t) => { const s = simAt(t); return s < OFF ? '' : s < ON ? 'gone' : 'back'; },
  });
  overlay.add(Object.assign(document.createElement('div'), { className: 'ov-chip', innerHTML: '◀◀ REPLAY · <b>0.3×</b>' }), { from: REPLAY[0], to: REPLAY[1], fadeIn: 0.15, fadeOut: 0.15, enter: 'pop' });

  return function update(t) {
    const s = simAt(t);
    city.update(s);
    const off = smoothstep(OFF, OFF + 0.15, s) * (1 - smoothstep(ON, ON + 0.3, s));
    const u = rods.material.uniforms;
    u.amount.value = off;
    // first pass: everything at once; in the replay the effects are added one by one with the narration
    const inReplay = t >= REPLAY[0] && t < REPLAY[1];
    // (the glare eases off while the red signs are explained, so the dark reds read)
    u.glare.value = inReplay ? smoothstep(20.2, 21.5, t) * (1 - 0.65 * smoothstep(25.3, 26.2, t) * (1 - smoothstep(28.6, 29.6, t))) : off;
    u.redDark.value = inReplay ? smoothstep(25.5, 26.7, t) : off;
    u.scotoma.value = inReplay ? smoothstep(29.7, 30.7, t) : off;

    const c = cam(t);
    applyCamera(camera, c, handheld(t, { amp: c.id === 'street' ? 0.004 : 0.0015, kicks: [{ at: OFF, amp: 0.01, decay: 4 }] }));
    traffic.update(s, { ride: 0.33, tyreScale: 1 });
    crowd.update(s, { stopAt: OFF + 0.4, lookYaw: Math.PI });
  };
}

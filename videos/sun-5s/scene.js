// What if the Sun disappeared for 5 seconds?
// Twist: nothing happens. Its light is still 8 min 20 s away, so the dark arrives
// late and lasts exactly 5 seconds. Narration: ./script.json. Sources: ./sources.md
import { timesSquare } from '/engine/lib/city.js';
import { buildTraffic } from '/engine/lib/traffic.js';
import { buildCrowd } from '/engine/lib/crowd.js';
import { cameraPath, handheld, shots, applyCamera } from '/engine/lib/camera.js';
import { clamp, smoothstep, easeOutCubic } from '/engine/lib/util.js';

const GONE = 14.5; // the Sun vanishes (we can't tell)
const BACK = GONE + 5; // ...and returns, unseen
const CARD = [25.4, 27.6]; // "8 minutes 20 seconds later"
const DARK = 27.6; // its missing light arrives
const LIGHT = DARK + 5;
const D = 43;

export const config = {
  fps: 30,
  duration: D,
  fov: 60,
  bloom: { strength: 0.45, radius: 0.5, threshold: 0.9 },
};

export const subtitles = { hide: [CARD] };

export const audio = [
  { type: 'ambience', from: 0, to: D, level: 0.8 },
  { type: 'crowd', from: 0, to: DARK + 0.2, level: 0.9 },
  { type: 'whoosh', at: 3.9 },
  { type: 'tick', at: [11.6, 12.6, 13.6] },
  { type: 'riser', from: 12.0, to: GONE },
  { type: 'hit', at: GONE },
  { type: 'whoosh', at: CARD[0] - 0.3 },
  { type: 'tick', at: [25.9, 26.2, 26.5, 26.8, 27.1, 27.4] },
  { type: 'boom', at: DARK, gain: 0.8 },
  { type: 'drone', from: DARK, to: LIGHT + 0.3 },
  { type: 'crowd', from: DARK + 0.6, to: LIGHT, level: 1.5 },
  { type: 'horns', from: DARK + 0.8, to: LIGHT, count: 5 },
  { type: 'powerup', at: LIGHT - 0.6 },
  { type: 'crowd', from: LIGHT, to: D, level: 0.9 },
];

export async function setup({ scene, camera, overlay, renderer }) {
  const city = timesSquare({ time: 'day', clear: [[6, -30, 22], [-1, -6, 14]] });
  scene.add(city.group);
  scene.fog = city.fog;
  scene.fog.density = 0.0015;
  // the Sun due south (+z) at ~38 degrees, straight down the corridor
  city.sky.sunDir.value.set(0, 0.62, 0.78).normalize();
  city.sun.position.set(0, 0.62 * 400, 0.78 * 400);
  city.skyTo([[0, '#000003'], [0.4, '#03040c'], [0.5, '#151022'], [0.53, '#100c1a'], [1, '#05040a']]);

  const traffic = buildTraffic({ lanes: city.lanes, queues: city.queues, count: city.carCount });
  scene.add(traffic.group);
  traffic.brake(DARK + 0.35);
  const crowd = buildCrowd({ zones: city.crowdZones, standZones: city.standZones, count: 430, standing: 46, stepHeight: city.stepHeight, avoid: [[6, -30, 3], [-1, -6, 2.5], [12, -40, 3.5], [10, -36, 3], [8, -32, 3]] });
  scene.add(crowd.group);

  const POV = [6, 1.7, -30];
  const cam = shots([
    { id: 'aerial', to: 4.3, cam: cameraPath([
      { t: 0, pos: [4, 150, -150], look: [3, 50, 160], fov: 52 },
      { t: 4.3, pos: [6, 14, -60], look: [4, 30, 90], fov: 58 },
    ]) },
    { id: 'plaza', to: 11.0, cam: cameraPath([
      { t: 4.3, pos: [12, 1.7, -40], look: [2, 6, 40], fov: 60 },
      { t: 11, pos: [8, 1.7, -32], look: [3, 14, 60], fov: 60 },
    ]) },
    { id: 'up', to: 25.4, cam: cameraPath([
      { t: 11, pos: POV, look: [4, 38, 90], fov: 60 },
      { t: GONE, pos: [6, 1.7, -30.4], look: [4, 40, 90], fov: 58 },
      { t: 19, pos: [6.2, 1.7, -30.8], look: [5, 24, 90], fov: 62 },
      { t: 25.4, pos: [6.6, 1.7, -31.4], look: [4, 36, 90], fov: 60 },
    ]) },
    { id: 'dark', to: LIGHT + 0.6, cam: cameraPath([
      { t: DARK, pos: [-1, 1.6, -6], look: [2, 26, 90], fov: 62 },
      { t: LIGHT + 0.6, pos: [-1.2, 1.6, -5], look: [2, 30, 90], fov: 60 },
    ]) },
    { id: 'rise', to: Infinity, cam: cameraPath([
      { t: LIGHT + 0.6, pos: [-1, 2, -5], look: [3, 30, 90], fov: 60 },
      { t: D, pos: [6, 70, -90], look: [3, 20, 120], fov: 54 },
    ]) },
  ]);

  // ---------------------------------------------------------------- overlay
  overlay.title('What if the <span class="hl">Sun</span> disappeared for 5 seconds?', { from: 0, fadeIn: 0, to: D + 1 });
  overlay.fact({
    kicker: 'Fact · Times Square',
    text: '<span class="hl">~220,000</span> people walk through here on an average day.',
    source: 'Times Square Alliance pedestrian counts · 2024 average',
    from: 5.4, to: 10.8,
  });
  overlay.timer({
    from: 11.0, to: CARD[0],
    label: (t) => (t < GONE ? 'Sun disappears in' : t < BACK ? 'Sun gone for' : 'Sun is back'),
    value: (t) => (t < GONE ? `${(GONE - t).toFixed(1)}<small>s</small>` : t < BACK ? `${(t - GONE).toFixed(1)}<small>/ 5.0s</small>` : '5.0<small>s ✓</small>'),
    mode: (t) => (t < GONE ? '' : t < BACK ? 'gone' : 'back'),
  });
  overlay.fact({
    kicker: 'Physics',
    text: 'Sunlight takes <span class="hl">~8 min 20 s</span> to reach us. You’re seeing the Sun as it <i>was</i>.',
    source: 'Smithsonian National Air and Space Museum',
    from: 19.6, to: 25.3,
  });
  overlay.card('8 minutes 20 seconds later…', {
    from: CARD[0], to: CARD[1], fadeIn: 0.25, fadeOut: 0.12,
    sub: (t) => {
      const s = Math.round(5 + 495 * easeOutCubic(clamp((t - CARD[0] - 0.2) / 1.6)));
      return `+${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    },
  });
  overlay.timer({
    from: DARK, to: D + 1, fadeIn: 0.01,
    label: (t) => (t < LIGHT ? 'The light runs out' : 'The light is back'),
    value: (t) => (t < LIGHT ? `${(t - DARK).toFixed(1)}<small>/ 5.0s</small>` : '5.0<small>s ✓</small>'),
    mode: (t) => (t < LIGHT ? 'gone' : 'back'),
  });
  overlay.fact({
    kicker: 'Physics',
    text: 'Gravity moves at the speed of light too. For 8 min 20 s, Earth kept orbiting <span class="hl">an empty spot</span>.',
    source: 'LIGO/Virgo + Fermi, GW170817: gravity and light arrived 1.7 s apart after ~130 million years',
    from: 33.4, to: 38.8,
  });
  overlay.end('Comment what should <span class="hl">vanish</span> next', { from: 39.2, to: D + 1 });

  const base = { sun: city.sun.intensity, hemi: city.hemi.intensity };

  return function update(t) {
    city.update(t);

    // light: dark from DARK to LIGHT (the photons that were never emitted)
    const dark = smoothstep(DARK, DARK + 0.04, t) * (1 - smoothstep(LIGHT, LIGHT + 0.04, t)); // light simply stops arriving
    city.sky.blend.value = dark;
    city.sky.sunDisk.value = 1 - dark;
    city.sky.stars.value = 0.35 * dark;
    city.sun.intensity = base.sun * (1 - dark);
    city.hemi.intensity = base.hemi * (1 - dark * 0.95);
    city.setArtificial(1 + dark * 0.8);
    // pupils open within a second or two (the rods would need 20+ minutes)
    const pupil = smoothstep(DARK + 0.2, DARK + 2.0, t) * (1 - smoothstep(LIGHT, LIGHT + 0.6, t));
    renderer.toneMappingExposure = 1.0 + 0.9 * pupil;
    traffic.setLights(0.35 + dark * 0.65);
    scene.fog.color.setRGB(0.74 - 0.72 * dark, 0.82 - 0.8 * dark, 0.9 - 0.86 * dark);

    const c = cam(t);
    applyCamera(camera, c, handheld(t, { amp: c.id === 'aerial' || c.id === 'rise' ? 0.0015 : 0.004, kicks: [{ at: DARK, amp: 0.012, decay: 3 }] }));

    traffic.update(t, { ride: 0.33, tyreScale: 1 });
    crowd.update(t, { stopAt: DARK + 0.3, lookYaw: Math.PI });
  };
}

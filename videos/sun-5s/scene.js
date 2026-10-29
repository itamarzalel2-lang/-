// What if the Sun disappeared for 5 seconds?
// Twist: nothing happens. Its light is still 8 min 20 s away, so the dark arrives
// late and lasts exactly 5 seconds. Sources: ./sources.md
import { timesSquare } from '/engine/lib/city.js';
import { buildTraffic } from '/engine/lib/traffic.js';
import { buildCrowd } from '/engine/lib/crowd.js';
import { cameraPath, handheld, shots } from '/engine/lib/camera.js';
import { clamp, smoothstep, easeOutCubic } from '/engine/lib/util.js';

const GONE = 3.5; // the Sun vanishes (we can't tell)
const BACK = GONE + 5; // ...and returns
const DARK = 10.0; // its missing light arrives (after the "8 min 20 s later" card)
const LIGHT = DARK + 5;
const D = 17.5;

export const config = {
  fps: 30,
  duration: D,
  fov: 60,
  bloom: { strength: 0.45, radius: 0.5, threshold: 0.9 },
  exposure: 1.0,
};

export const audio = [
  { type: 'ambience', from: 0, to: D, level: 0.9 },
  { type: 'crowd', from: 0, to: DARK + 0.2, level: 1 },
  { type: 'tick', at: [0.5, 1.5, 2.5] },
  { type: 'riser', from: 1.6, to: GONE },
  { type: 'hit', at: 4.4 },
  { type: 'whoosh', at: 8.3 },
  { type: 'tick', at: [8.9, 9.1, 9.3, 9.5, 9.7] },
  { type: 'boom', at: DARK, gain: 0.8 },
  { type: 'drone', from: DARK, to: LIGHT + 0.3 },
  { type: 'crowd', from: DARK + 0.6, to: LIGHT, level: 1.6 },
  { type: 'horns', from: DARK + 0.8, to: LIGHT, count: 6 },
  { type: 'powerup', at: LIGHT - 0.6 },
];

export async function setup({ scene, camera, overlay, renderer }) {
  const city = timesSquare({ time: 'day', clear: [[6, -30, 22]] });
  scene.add(city.group);
  scene.fog = city.fog;
  scene.fog.density = 0.0015;
  // put the Sun due south (+z) at ~38 degrees, straight down the corridor
  const sunDir = [0, 0.62, 0.78];
  city.sky.sunDir.value.set(...sunDir).normalize();
  city.sun.position.set(0, 0.62 * 400, 0.78 * 400);
  city.skyTo([[0, '#000003'], [0.4, '#03040c'], [0.5, '#151022'], [0.53, '#100c1a'], [1, '#05040a']]);

  const traffic = buildTraffic({ lanes: city.lanes, queues: city.queues, count: city.carCount });
  scene.add(traffic.group);
  traffic.brake(DARK + 0.35);
  const crowd = buildCrowd({ zones: city.crowdZones, standZones: city.standZones, count: 430, standing: 46, stepHeight: city.stepHeight, avoid: [[6, -30, 3]] });
  scene.add(crowd.group);

  // south of the red steps (z -62..-46), looking south (+z) at the Sun
  const POV = [6, 1.7, -30];
  const cam = shots([
    { id: 'main', to: Infinity, cam: cameraPath([
      { t: 0, pos: [4, 150, -150], look: [3, 50, 160], fov: 52 },
      { t: 3.2, pos: POV, look: [4, 38, 90], fov: 60 },
      { t: 8.4, pos: [6.2, 1.7, -30.4], look: [4, 40, 90], fov: 60 },
      { t: DARK + 0.5, pos: [6.2, 1.7, -30.4], look: [3, 30, 90], fov: 60 },
      { t: LIGHT, pos: [6.4, 1.7, -31], look: [2, 34, 90], fov: 58 },
      { t: D, pos: [6.6, 2.4, -33], look: [2, 36, 90], fov: 56 },
    ]) },
  ]);

  // ---------------------------------------------------------------- overlay
  overlay.title('What if the <span class="hl">Sun</span> disappeared for 5 seconds?', { from: 0, fadeIn: 0, to: D + 1 });
  overlay.timer({
    from: 0.5, to: 8.75,
    label: (t) => (t < GONE ? 'Sun disappears in' : t < BACK ? 'Sun gone for' : 'Sun is back'),
    value: (t) => (t < GONE ? `${(GONE - t).toFixed(1)}<small>s</small>` : t < BACK ? `${(t - GONE).toFixed(1)}<small>/ 5.0s</small>` : '5.0<small>s ✓</small>'),
    mode: (t) => (t < GONE ? '' : t < BACK ? 'gone' : 'back'),
  });
  overlay.caption('The Sun is gone.', { from: 4.2, to: 6.1, top: 560 });
  overlay.caption('You <span class="hl">can’t tell.</span>', { from: 4.9, to: 6.1, top: 612 });
  overlay.fact({
    kicker: 'Physics',
    text: 'Sunlight takes <span class="hl">~8 min 20 s</span> to reach us. You’re seeing the Sun as it <i>was</i>.',
    source: 'Smithsonian National Air and Space Museum',
    from: 6.2, to: 8.6,
  });
  overlay.card('8 minutes 20 seconds later…', {
    from: 8.6, to: DARK, fadeIn: 0.25, fadeOut: 0.12,
    sub: (t) => {
      const s = Math.round(5 + 495 * easeOutCubic(clamp((t - 8.75) / 1.0)));
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
    from: DARK + 0.9, to: LIGHT - 0.2,
  });
  overlay.caption('It comes back <span class="hl">8 min 20 s late</span>, too.', { from: LIGHT + 0.3, to: D + 1, top: 560 });
  overlay.end('Comment what should <span class="hl">vanish</span> next', { from: LIGHT + 1.0, to: D + 1 });

  const base = { sun: city.sun.intensity, hemi: city.hemi.intensity };

  return function update(t) {
    city.update(t);

    // light: dark from DARK to LIGHT (the photons that never left the Sun)
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

    // camera
    const c = cam(t);
    const shake = handheld(t, { amp: t > 3 ? 0.004 : 0.0015, kicks: [{ at: DARK, amp: 0.012, decay: 3 }] });
    camera.position.copy(c.pos);
    camera.lookAt(c.look);
    camera.rotateX(shake.sy);
    camera.rotateY(shake.sx);
    camera.rotateZ(shake.roll);
    camera.fov = c.fov;
    camera.updateProjectionMatrix();

    traffic.update(t, { ride: 0.33, tyreScale: 1 });
    crowd.update(t, { stopAt: DARK + 0.3, lookYaw: Math.PI });
  };
}

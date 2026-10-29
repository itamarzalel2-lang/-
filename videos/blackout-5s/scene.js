// What if every light in New York went out for 5 seconds?
// Twist: the sky above Manhattan would be full of stars, and you still wouldn't see
// them: dark adaptation takes 20-30 minutes. Narration: ./script.json. Sources: ./sources.md
import { timesSquare } from '/engine/lib/city.js';
import { buildTraffic } from '/engine/lib/traffic.js';
import { buildCrowd } from '/engine/lib/crowd.js';
import { cameraPath, handheld, shots, applyCamera } from '/engine/lib/camera.js';
import { smoothstep, remap } from '/engine/lib/util.js';

// simulation time
const OFF = 14.4;
const ON = OFF + 5;
// story time
const STARS = [20.6, 35.6]; // back inside the dark moment, almost frozen (sim 16.0 .. 17.2)
const SEE = 26.6; // "what you'd actually see"
const D = 39;
const simAt = remap([[0, 0], [STARS[0], STARS[0]], [STARS[0], 16.0], [STARS[1], 17.2], [STARS[1], 19.9], [D, 19.9 + D - STARS[1]]]);

export const config = {
  fps: 30,
  duration: D,
  fov: 60,
  bloom: { strength: 0.6, radius: 0.55, threshold: 0.84 },
};

export const audio = [
  { type: 'ambience', from: 0, to: D, level: 0.85 },
  { type: 'hum', from: 0, to: OFF, level: 1 },
  { type: 'crowd', from: 0, to: OFF + 0.3, level: 1 },
  { type: 'whoosh', at: 4.0 },
  { type: 'tick', at: [12.0, 13.0, 14.0] },
  { type: 'riser', from: 12.2, to: OFF },
  { type: 'powerdown', at: OFF },
  { type: 'crowd', from: OFF + 0.6, to: ON, level: 1.9 },
  { type: 'horns', from: OFF + 0.8, to: ON, count: 6 },
  { type: 'screech', from: OFF + 0.7, to: OFF + 2.2 },
  { type: 'powerup', at: ON - 0.7 },
  { type: 'hum', from: ON, to: STARS[0], level: 1 },
  { type: 'whoosh', at: STARS[0] - 0.3 },
  { type: 'drone', from: STARS[0], to: STARS[1] },
  { type: 'powerup', at: STARS[1] - 0.7 },
  { type: 'hum', from: STARS[1], to: D, level: 1 },
  { type: 'crowd', from: STARS[1], to: D, level: 1.1 },
];

export async function setup({ scene, camera, overlay, renderer }) {
  const city = timesSquare({ time: 'night', clear: [[2, 14, 16], [6, -10, 12]] });
  scene.add(city.group);
  scene.fog = city.fog;
  const base = { hemi: city.hemi.intensity, sun: city.sun.intensity, fog: scene.fog.color.clone() };
  // the sky without light pollution: no orange glow, just black
  city.skyTo([[0, '#000000'], [0.45, '#010104'], [0.5, '#04040a'], [0.53, '#030308'], [1, '#020204']]);

  const traffic = buildTraffic({ lanes: city.lanes, queues: city.queues, count: city.carCount });
  scene.add(traffic.group);
  traffic.brake(OFF + 0.45); // no headlights, no street lights: everyone stops
  const crowd = buildCrowd({ zones: city.crowdZones, standZones: city.standZones, count: 430, standing: 46, stepHeight: city.stepHeight, avoid: [[2, 14, 3], [6, -10, 3]] });
  scene.add(crowd.group);

  const cam = shots([
    { id: 'aerial', to: 4.4, cam: cameraPath([
      { t: 0, pos: [10, 120, 140], look: [-6, 0, -50], fov: 52 },
      { t: 4.4, pos: [4, 12, 30], look: [-8, 6, -40], fov: 58 },
    ]) },
    { id: 'street', to: STARS[0], cam: cameraPath([
      { t: 4.4, pos: [2, 1.7, 22], look: [-8, 12, -40], fov: 60 },
      { t: OFF, pos: [2, 1.7, 14], look: [-6, 8, -40], fov: 60 },
      { t: ON, pos: [2, 1.7, 13.5], look: [-6, 6, -40], fov: 60 },
      { t: STARS[0], pos: [2, 1.7, 13.4], look: [-6, 7, -40], fov: 60 },
    ]) },
    { id: 'sky', to: STARS[1], cam: cameraPath([
      { t: STARS[0], pos: [6, 1.6, -10], look: [4, 40, -60], fov: 64 },
      { t: SEE, pos: [6, 1.6, -10.5], look: [3, 60, -55], fov: 68 },
      { t: STARS[1], pos: [6, 1.6, -11], look: [3, 52, -55], fov: 66 },
    ]) },
    { id: 'rise', to: Infinity, cam: cameraPath([
      { t: STARS[1], pos: [3, 3, 18], look: [-8, 8, -40], fov: 58 },
      { t: D, pos: [10, 60, 90], look: [-6, 0, -40], fov: 54 },
    ]) },
  ]);

  overlay.title('What if every <span class="hl">light</span> in NYC went out for 5 seconds?', { from: 0, fadeIn: 0, to: D + 1 });
  overlay.fact({
    kicker: 'Fact',
    text: 'In 2003 a blackout cut power to <span class="hl">~50 million</span> people across the US and Canada.',
    source: 'U.S.–Canada Power System Outage Task Force, Final Report (2004)',
    from: 6.2, to: 11.4,
  });
  overlay.timer({
    from: 11.4, to: STARS[0],
    label: (t) => { const s = simAt(t); return s < OFF ? 'Lights out in' : s < ON ? 'Dark for' : 'Lights are back'; },
    value: (t) => { const s = simAt(t); return s < OFF ? `${(OFF - s).toFixed(1)}<small>s</small>` : s < ON ? `${(s - OFF).toFixed(1)}<small>/ 5.0s</small>` : '5.0<small>s ✓</small>'; },
    mode: (t) => { const s = simAt(t); return s < OFF ? '' : s < ON ? 'gone' : 'back'; },
  });
  const chip = (html, from, to) => overlay.add(Object.assign(document.createElement('div'), { className: 'ov-chip', innerHTML: html }), { from, to, fadeIn: 0.15, fadeOut: 0.15, enter: 'pop' });
  chip('WHAT’S ACTUALLY UP THERE', 22.0, SEE);
  chip('WHAT YOU’D SEE', SEE, STARS[1]);
  overlay.fact({
    kicker: 'Body',
    text: 'Your eyes need <span class="hl">20–30 minutes</span> in the dark to reach full sensitivity.',
    source: 'American Meteorological Society Glossary, “dark adaptation” · Scientific American',
    from: 29.2, to: STARS[1],
  });
  overlay.end('Comment what should <span class="hl">vanish</span> next', { from: 36.1, to: D + 1 });

  return function update(t) {
    const s = simAt(t);
    city.update(s);
    const dark = smoothstep(OFF, OFF + 0.06, s) * (1 - smoothstep(ON, ON + 0.25, s));
    city.setArtificial(1 - dark);
    traffic.setLights(1 - dark);
    city.sky.blend.value = dark;
    city.hemi.intensity = base.hemi * (1 - 0.85 * dark);
    city.sun.intensity = base.sun * (1 - 0.6 * dark);
    scene.fog.color.copy(base.fog).multiplyScalar(1 - 0.85 * dark);
    // the "what's up there" shot: the true sky over a dark Manhattan, then what eyes manage in 5 s
    const real = t > 22.0 && t < SEE ? smoothstep(22.0, 23.2, t) : 0;
    city.sky.stars.value = 0.25 * (1 - dark) + 1.6 * real;
    city.sky.milky.value = real;
    renderer.toneMappingExposure = 1 + 0.5 * real; // like a long-exposure photo of the true sky

    const c = cam(t);
    applyCamera(camera, c, handheld(t, { amp: c.id === 'street' ? 0.004 : 0.0015, kicks: [{ at: OFF, amp: 0.012, decay: 4 }] }));

    traffic.update(s, { ride: 0.33, tyreScale: 1 });
    crowd.update(s, { stopAt: OFF + 0.35, lookYaw: Math.PI });
  };
}

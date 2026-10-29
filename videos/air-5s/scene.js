// What if all air disappeared for 5 seconds?
// Silence, a black sky at noon, pigeons drop, and the spit on your tongue starts to boil.
// Sources: ./sources.md
import { timesSquare } from '/engine/lib/city.js';
import { buildTraffic } from '/engine/lib/traffic.js';
import { buildCrowd } from '/engine/lib/crowd.js';
import { pigeons } from '/engine/lib/props.js';
import { cameraPath, handheld, shots } from '/engine/lib/camera.js';
import { clamp, smoothstep, hash01 } from '/engine/lib/util.js';

const GONE = 3.5;
const BACK = GONE + 5;
const D = 14.5;

export const config = {
  fps: 30,
  duration: D,
  fov: 60,
  bloom: { strength: 0.45, radius: 0.5, threshold: 0.9 },
  exposure: 1.0,
};

export const audio = [
  // the city, then nothing at all: sound is air moving
  { type: 'ambience', from: 0, to: GONE, level: 1.1, fadeOut: 0.02 },
  { type: 'crowd', from: 0, to: GONE, level: 1.2, fadeOut: 0.02 },
  { type: 'horns', from: 0.3, to: GONE - 0.3, count: 4 },
  { type: 'tick', at: [0.5, 1.5, 2.5] },
  { type: 'riser', from: 1.6, to: GONE },
  // what you still hear: your own body, through your bones
  { type: 'heartbeat', from: GONE + 0.4, to: BACK, bpm: 80, bpmEnd: 125 },
  { type: 'tinnitus', from: GONE + 0.2, to: BACK },
  // air back: ears pop, the noise floods in
  { type: 'whoosh', at: BACK - 0.4 },
  { type: 'thump', at: BACK },
  { type: 'ambience', from: BACK, to: D, level: 1.1, fadeIn: 0.05 },
  { type: 'crowd', from: BACK, to: D, level: 1.8, fadeIn: 0.1 },
  { type: 'horns', from: BACK + 0.3, to: D, count: 6 },
];

export async function setup({ scene, camera, overlay }) {
  const city = timesSquare({ time: 'day', clear: [[8, -20, 24]] });
  scene.add(city.group);
  scene.fog = city.fog;
  const fog0 = 0.0015;
  scene.fog.density = fog0;
  city.sky.sunDir.value.set(0, 0.66, 0.75).normalize();
  city.sun.position.set(0, 0.66 * 400, 0.75 * 400);
  // the sky with nothing to scatter sunlight: black, a few of the brightest stars
  city.skyTo([[0, '#000000'], [0.45, '#010103'], [0.5, '#06060c'], [0.52, '#0a0a10'], [1, '#050507']]);

  const traffic = buildTraffic({ lanes: city.lanes, queues: city.queues, count: city.carCount });
  scene.add(traffic.group);
  traffic.brake(GONE + 0.5); // engines die without oxygen; drivers stand on the brakes
  const crowd = buildCrowd({ zones: city.crowdZones, standZones: city.standZones, count: 430, standing: 46, stepHeight: city.stepHeight, avoid: [[8, -20, 3]] });
  scene.add(crowd.group);
  const birds = pigeons({ count: 46, center: [8, 30, 25], radius: 16 });
  scene.add(birds.group);

  const cam = shots([
    { id: 'street', to: Infinity, cam: cameraPath([
      { t: 0, pos: [8, 1.7, -32], look: [6, 14, 60], fov: 58 },
      { t: GONE, pos: [8, 1.7, -22], look: [7, 20, 60], fov: 60 },
      { t: GONE + 2.6, pos: [8, 1.65, -20], look: [6, 48, 60], fov: 62 },
      { t: BACK, pos: [8, 1.65, -19.5], look: [6, 44, 60], fov: 62 },
      { t: BACK + 1.5, pos: [8, 1.7, -19.4], look: [6, 18, 60], fov: 60 },
      { t: D, pos: [9, 6, -24], look: [5, 16, 60], fov: 58 },
    ]) },
  ]);

  overlay.title('What if all <span class="hl">air</span> disappeared for 5 seconds?', { from: 0, fadeIn: 0, to: D + 1 });
  overlay.timer({
    from: 0.4, to: 11.2,
    label: (t) => (t < GONE ? 'Air disappears in' : t < BACK ? 'No air for' : 'Air is back'),
    value: (t) => (t < GONE ? `${(GONE - t).toFixed(1)}<small>s</small>` : t < BACK ? `${(t - GONE).toFixed(1)}<small>/ 5.0s</small>` : '5.0<small>s ✓</small>'),
    mode: (t) => (t < GONE ? '' : t < BACK ? 'gone' : 'back'),
  });
  overlay.fact({
    kicker: 'Fact',
    text: 'You carry <span class="hl">~10 tonnes</span> of air above every square meter.',
    source: 'Standard sea-level pressure 101,325 Pa ÷ 9.81 m/s² ≈ 10,300 kg per m²',
    from: 0.7, to: 3.3,
  });
  overlay.caption('Total <span class="hl">silence.</span>', { from: GONE + 0.15, to: GONE + 1.9, top: 470 });
  overlay.fact({
    kicker: 'Physics',
    text: 'Nothing left to scatter sunlight: the sky turns <span class="hl">black at noon</span>.',
    source: 'Rayleigh scattering · Royal Museums Greenwich, “Why is the sky blue?”',
    from: GONE + 1.2, to: GONE + 3.0,
  });
  overlay.fact({
    kicker: 'Body',
    text: 'You’d stay conscious ~10 s. But the spit on your tongue starts to <span class="hl">boil</span>.',
    source: 'NASA test subject Jim LeBlanc, 1966 vacuum-chamber accident (Guinness World Records) · Bioastronautics Data Book',
    from: GONE + 3.1, to: BACK + 0.2,
  });
  overlay.caption('The air comes back.', { from: BACK + 0.3, to: D + 1, top: 560 });
  overlay.caption('Your ears <span class="hl">pop.</span>', { from: BACK + 1.0, to: D + 1, top: 612 });
  overlay.end('Comment what should <span class="hl">vanish</span> next', { from: BACK + 2.4, to: D + 1 });

  const base = { sun: city.sun.intensity, hemi: city.hemi.intensity };

  return function update(t) {
    city.update(t);
    const v = smoothstep(GONE, GONE + 0.05, t) * (1 - smoothstep(BACK, BACK + 0.05, t)); // vacuum
    city.sky.blend.value = v;
    city.sky.stars.value = 0.18 * v;
    city.sky.sunDisk.value = 1 - 0.3 * v; // a bare white disk, no halo
    city.sky.sunGlow.value = 1 - v;
    city.sun.intensity = base.sun * (1 + 0.25 * v);
    city.hemi.intensity = base.hemi * (1 - 0.9 * v); // no skylight: shadows go nearly black
    scene.fog.density = fog0 * (1 - v); // no haze either: crisp to the horizon

    const c = cam(t);
    const shake = handheld(t, { amp: 0.004, kicks: [{ at: BACK, amp: 0.01, decay: 4 }] });
    camera.position.copy(c.pos);
    camera.lookAt(c.look);
    camera.rotateX(shake.sy);
    camera.rotateY(shake.sx);
    camera.rotateZ(shake.roll);
    camera.fov = c.fov;
    camera.updateProjectionMatrix();

    traffic.update(t, { ride: 0.33, tyreScale: 1 });
    crowd.update(t, {
      stopAt: GONE + 0.3,
      lookYaw: Math.PI,
      // hands to the throat and ears while there is nothing to breathe
      pose: (i) => {
        const k = smoothstep(GONE + 0.4 + hash01(i) * 0.8, GONE + 1.2 + hash01(i) * 0.8, t) * (1 - smoothstep(BACK + 0.2, BACK + 1.2, t));
        return { armsX: 2.3 * k, armsZ: -0.25 * k, pitch: 0.12 * k * hash01(i, 2) };
      },
    });
    birds.update(t, { dropAt: GONE, recoverAt: BACK });
  };
}

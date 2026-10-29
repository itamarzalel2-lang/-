// What if all air disappeared for 5 seconds?
// Silence, a black sky at noon, pigeons drop, and the spit on your tongue starts to boil.
// Story: the 5 seconds play once (cut just before the air returns), replay at 0.26x with
// the explanation, then the air comes back. Narration: ./script.json. Sources: ./sources.md
import { timesSquare } from '/engine/lib/city.js';
import { buildTraffic } from '/engine/lib/traffic.js';
import { buildCrowd } from '/engine/lib/crowd.js';
import { pigeons } from '/engine/lib/props.js';
import { cameraPath, handheld, shots, applyCamera } from '/engine/lib/camera.js';
import { smoothstep, hash01, remap } from '/engine/lib/util.js';

// simulation time
const GONE = 14.2;
const BACK = GONE + 5;
// story time
const REPLAY = [18.9, 36.2]; // slow replay of sim 14.3 .. 18.86
const RETURN = 36.2 + (BACK - 18.6); // when the air comes back on screen
const D = 43;
const simAt = remap([[0, 0], [REPLAY[0], REPLAY[0]], [REPLAY[0], 14.3], [REPLAY[1], 18.86], [REPLAY[1], 18.6], [D, 18.6 + D - REPLAY[1]]]);

export const config = {
  fps: 30,
  duration: D,
  fov: 60,
  bloom: { strength: 0.45, radius: 0.5, threshold: 0.9 },
};

export const audio = [
  // the city, then nothing at all: sound is air moving
  { type: 'ambience', from: 0, to: GONE, level: 1.1, fadeOut: 0.02 },
  { type: 'crowd', from: 0, to: GONE, level: 1.2, fadeOut: 0.02 },
  { type: 'horns', from: 0.5, to: GONE - 0.5, count: 5 },
  { type: 'tick', at: [11.3, 12.3, 13.3] },
  { type: 'riser', from: 11.8, to: GONE },
  // what you still hear: your own body, through your bones
  { type: 'heartbeat', from: GONE + 0.4, to: REPLAY[0], bpm: 80, bpmEnd: 115 },
  { type: 'tinnitus', from: GONE + 0.2, to: REPLAY[1] },
  // the replay: slowed heartbeat under a low drone
  { type: 'whoosh', at: REPLAY[0] - 0.35 },
  { type: 'drone', from: REPLAY[0], to: REPLAY[1] },
  { type: 'heartbeat', from: REPLAY[0] + 0.2, to: REPLAY[1], bpm: 42, bpmEnd: 48 },
  // air back: ears pop, the noise floods in
  { type: 'whoosh', at: RETURN - 0.4 },
  { type: 'thump', at: RETURN },
  { type: 'ambience', from: RETURN, to: D, level: 1.1, fadeIn: 0.05 },
  { type: 'crowd', from: RETURN, to: D, level: 1.7, fadeIn: 0.1 },
  { type: 'horns', from: RETURN + 0.3, to: D, count: 6 },
];

export async function setup({ scene, camera, overlay }) {
  const city = timesSquare({ time: 'day', clear: [[8, -20, 24], [12, 34, 10], [25, 16, 8]] });
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
  const crowd = buildCrowd({ zones: city.crowdZones, standZones: city.standZones, count: 430, standing: 46, stepHeight: city.stepHeight, avoid: [[8, -20, 3], [8, -32, 3], [12, 34, 3], [25, 16, 2.5]] });
  scene.add(crowd.group);
  const birds = pigeons({ count: 64, center: [10, 22, 6], radius: 11 });
  scene.add(birds.group);

  const cam = shots([
    { id: 'aerial', to: 4.5, cam: cameraPath([
      { t: 0, pos: [10, 120, -120], look: [4, 30, 120], fov: 52 },
      { t: 4.5, pos: [8, 3, -34], look: [6, 16, 60], fov: 58 },
    ]) },
    { id: 'street', to: REPLAY[0], cam: cameraPath([
      { t: 4.5, pos: [8, 1.7, -32], look: [6, 14, 60], fov: 58 },
      { t: GONE, pos: [8, 1.7, -22], look: [7, 20, 60], fov: 60 },
      { t: REPLAY[0], pos: [8, 1.65, -20.5], look: [6, 42, 60], fov: 62 },
    ]) },
    { id: 'birds', to: 24.4, cam: cameraPath([
      // from the south, with the Sun behind us so the falling birds are lit against the black sky
      { t: REPLAY[0], pos: [12, 2.0, 34], look: [10, 20, 6], fov: 60 },
      { t: 24.4, pos: [12, 2.0, 33], look: [10, 11, 6], fov: 60 },
    ]) },
    { id: 'sky', to: 29.4, cam: cameraPath([
      { t: 24.4, pos: [8, 1.6, -21], look: [6, 50, 60], fov: 64 },
      { t: 29.4, pos: [8, 1.6, -21.5], look: [5, 40, 60], fov: 60 },
    ]) },
    { id: 'people', to: REPLAY[1], cam: cameraPath([
      { t: 29.4, pos: [25, 1.7, 16], look: [12, 2.2, -8], fov: 52 },
      { t: REPLAY[1], pos: [24.5, 1.7, 14.5], look: [12, 2.4, -8], fov: 48 },
    ]) },
    { id: 'back', to: Infinity, cam: cameraPath([
      { t: REPLAY[1], pos: [8, 1.65, -20], look: [6, 44, 60], fov: 62 },
      { t: RETURN + 1.4, pos: [8, 1.7, -19.6], look: [6, 18, 60], fov: 60 },
      { t: D, pos: [9, 8, -26], look: [5, 16, 60], fov: 58 },
    ]) },
  ]);

  overlay.title('What if all <span class="hl">air</span> disappeared for 5 seconds?', { from: 0, fadeIn: 0, to: D + 1 });
  overlay.fact({
    kicker: 'Fact',
    text: 'You carry <span class="hl">~10 tonnes</span> of air above every square meter.',
    source: 'Standard sea-level pressure 101,325 Pa ÷ 9.81 m/s² ≈ 10,300 kg per m²',
    from: 5.2, to: 10.9,
  });
  overlay.timer({
    from: 11.0, to: D - 2.5,
    label: (t) => { const s = simAt(t); return s < GONE ? 'Air disappears in' : s < BACK ? 'No air for' : 'Air is back'; },
    value: (t) => { const s = simAt(t); return s < GONE ? `${(GONE - s).toFixed(1)}<small>s</small>` : s < BACK ? `${(s - GONE).toFixed(1)}<small>/ 5.0s</small>` : '5.0<small>s ✓</small>'; },
    mode: (t) => { const s = simAt(t); return s < GONE ? '' : s < BACK ? 'gone' : 'back'; },
  });
  overlay.add(Object.assign(document.createElement('div'), { className: 'ov-chip', innerHTML: '◀◀ REPLAY · <b>0.26×</b>' }), { from: REPLAY[0], to: REPLAY[1], fadeIn: 0.15, fadeOut: 0.15, enter: 'pop' });
  overlay.fact({
    kicker: 'Physics',
    text: 'Nothing left to scatter sunlight: the sky turns <span class="hl">black at noon</span>.',
    source: 'Rayleigh scattering · Royal Museums Greenwich, “Why is the sky blue?”',
    from: 24.8, to: 29.3,
  });
  overlay.fact({
    kicker: 'Body',
    text: 'You’d stay conscious ~10 s. But the spit on your tongue starts to <span class="hl">boil</span>.',
    source: 'NASA test subject Jim LeBlanc, 1966 vacuum-chamber accident (Guinness World Records) · Bioastronautics Data Book',
    from: 30.6, to: REPLAY[1],
  });
  overlay.end('Comment what should <span class="hl">vanish</span> next', { from: 40.2, to: D + 1 });

  const base = { sun: city.sun.intensity, hemi: city.hemi.intensity };

  return function update(t) {
    const s = simAt(t);
    city.update(s);
    const v = smoothstep(GONE, GONE + 0.05, s) * (1 - smoothstep(BACK, BACK + 0.05, s)); // vacuum
    city.sky.blend.value = v;
    city.sky.stars.value = 0.18 * v;
    city.sky.sunDisk.value = 1 - 0.3 * v; // a bare white disk, no halo
    city.sky.sunGlow.value = 1 - v;
    city.sun.intensity = base.sun * (1 + 0.25 * v);
    city.hemi.intensity = base.hemi * (1 - 0.9 * v); // no skylight: shadows go nearly black
    scene.fog.density = fog0 * (1 - v); // no haze either: crisp to the horizon

    const c = cam(t);
    applyCamera(camera, c, handheld(t, { amp: c.id === 'aerial' ? 0.0015 : 0.004, kicks: [{ at: RETURN, amp: 0.01, decay: 4 }] }));

    traffic.update(s, { ride: 0.33, tyreScale: 1 });
    crowd.update(s, {
      stopAt: GONE + 0.3,
      lookYaw: Math.PI,
      // hands to the throat and ears while there is nothing to breathe
      pose: (i) => {
        const k = smoothstep(GONE + 0.4 + hash01(i) * 0.8, GONE + 1.2 + hash01(i) * 0.8, s) * (1 - smoothstep(BACK + 0.2, BACK + 1.2, s));
        return { armsX: 2.3 * k, armsZ: -0.25 * k, pitch: 0.12 * k * hash01(i, 2) };
      },
    });
    birds.update(s, { dropAt: GONE, recoverAt: BACK });
  };
}

// What if the Moon came 10 times closer for 5 seconds?
// 10x wider, 100x the area (and moonlight); tidal pull goes with 1/r^3 so tides would be
// 1000x stronger, yet nothing happens in 5 s. At 38,440 km it would sit inside the ring of
// geostationary satellites (42,164 km from Earth's centre). Narration: ./script.json. Sources: ./sources.md
import * as THREE from 'three';
import { timesSquare } from '/engine/lib/city.js';
import { buildTraffic } from '/engine/lib/traffic.js';
import { buildCrowd } from '/engine/lib/crowd.js';
import { moon } from '/engine/lib/props.js';
import { cameraPath, handheld, shots, applyCamera } from '/engine/lib/camera.js';
import { smoothstep, easeInOutCubic, remap } from '/engine/lib/util.js';

// simulation time
const NEAR = 13.6;
const FAR = NEAR + 5;
// story time
const REPLAY = [18.4, 32.4]; // the close Moon again, slowly (sim 13.9 .. 18.3)
const D = 39.5;
const simAt = remap([[0, 0], [REPLAY[0], REPLAY[0]], [REPLAY[0], 13.9], [REPLAY[1], 18.3], [REPLAY[1], 19.2], [D, 19.2 + D - REPLAY[1]]]);
const DIR = [0, 0.4, -1]; // due north, ~22 degrees up

export const config = {
  fps: 30,
  duration: D,
  fov: 60,
  bloom: { strength: 0.6, radius: 0.6, threshold: 0.84 },
};

export const audio = [
  { type: 'ambience', from: 0, to: D, level: 0.8 },
  { type: 'crowd', from: 0, to: NEAR + 0.3, level: 0.9 },
  { type: 'whoosh', at: 4.0 },
  { type: 'tick', at: [11.4, 12.4, 13.4] },
  { type: 'riser', from: 11.0, to: NEAR },
  { type: 'boom', at: NEAR, gain: 0.7 },
  { type: 'drone', from: NEAR, to: REPLAY[1] },
  { type: 'crowd', from: NEAR + 0.5, to: REPLAY[0], level: 1.6 },
  { type: 'whoosh', at: REPLAY[0] - 0.35 },
  { type: 'whoosh', at: REPLAY[1] - 0.3 },
  { type: 'crowd', from: REPLAY[1], to: D, level: 1 },
];

export async function setup({ scene, camera, overlay }) {
  const city = timesSquare({ time: 'night', clear: [[-21, 25, 14], [-21, -40, 42]] });
  scene.add(city.group);
  scene.fog = city.fog;
  const base = { hemi: city.hemi.intensity, sun: city.sun.intensity };
  // moonlight comes from the Moon
  city.sun.position.copy(new THREE.Vector3(...DIR).normalize().multiplyScalar(400));
  city.sun.color.set('#c8d6ff');

  const traffic = buildTraffic({ lanes: city.lanes, queues: city.queues, count: city.carCount });
  scene.add(traffic.group);
  traffic.brake(NEAR + 0.8); // drivers stop to stare
  const crowd = buildCrowd({ zones: city.crowdZones, standZones: city.standZones, count: 430, standing: 46, stepHeight: city.stepHeight, avoid: [[-23, 20, 2.6], [-23, 30, 2.6], [-23, 25, 2.6], [-23, -20, 2.6]] });
  scene.add(crowd.group);

  const theMoon = moon({ direction: DIR, distance: 1500 });
  scene.add(theMoon.mesh);

  const cam = shots([
    { id: 'aerial', to: 4.4, cam: cameraPath([
      { t: 0, pos: [-6, 110, 160], look: [-8, 40, -400], fov: 52 },
      { t: 4.4, pos: [-22, 6, 40], look: [-22, 40, -400], fov: 56 },
    ]) },
    { id: 'avenue', to: REPLAY[0], cam: cameraPath([
      { t: 4.4, pos: [-21, 1.8, 30], look: [-15, 60, -400], fov: 56 },
      { t: NEAR, pos: [-21, 1.8, 20], look: [-17, 130, -400], fov: 60 },
      { t: REPLAY[0], pos: [-21, 1.8, 19], look: [-18, 150, -400], fov: 60 },
    ]) },
    { id: 'replay', to: REPLAY[1], cam: cameraPath([
      // a slow telephoto push: the Moon fills the canyon
      { t: REPLAY[0], pos: [-20.5, 1.6, -20], look: [-19, 170, -400], fov: 52 },
      { t: 25.6, pos: [-20.5, 1.6, -21], look: [-20, 165, -400], fov: 30 },
      { t: REPLAY[1], pos: [-20.5, 1.6, -22], look: [-20.5, 162, -400], fov: 22 },
    ]) },
    { id: 'rise', to: Infinity, cam: cameraPath([
      { t: REPLAY[1], pos: [-23, 2, 20], look: [-22, 40, -400], fov: 58 },
      { t: D, pos: [-4, 80, 120], look: [-8, 40, -400], fov: 54 },
    ]) },
  ]);

  overlay.title('What if the <span class="hl">Moon</span> came 10× closer for 5 seconds?', { from: 0, fadeIn: 0, to: D + 1 });
  overlay.fact({
    kicker: 'Fact',
    text: 'The Moon is on average <span class="hl">384,400 km</span> away.',
    source: 'NASA, Moon fact sheet',
    from: 5.4, to: 10.0,
  });
  overlay.timer({
    from: 10.0, to: REPLAY[1],
    label: (t) => { const s = simAt(t); return s < NEAR ? 'Moon 10× closer in' : s < FAR ? 'Moon close for' : 'Moon is back'; },
    value: (t) => { const s = simAt(t); return s < NEAR ? `${(NEAR - s).toFixed(1)}<small>s</small>` : s < FAR ? `${(s - NEAR).toFixed(1)}<small>/ 5.0s</small>` : '5.0<small>s ✓</small>'; },
    mode: (t) => { const s = simAt(t); return s < NEAR ? '' : s < FAR ? 'gone' : 'back'; },
  });
  overlay.add(Object.assign(document.createElement('div'), { className: 'ov-chip', innerHTML: '◀◀ REPLAY · <b>0.3×</b>' }), { from: REPLAY[0], to: REPLAY[1], fadeIn: 0.15, fadeOut: 0.15, enter: 'pop' });
  overlay.fact({
    kicker: 'Physics',
    text: 'Tidal pull grows with 1/distance³: 10× closer = <span class="hl">1,000×</span> the tides.',
    source: 'NOAA National Ocean Service, “Tides and Water Levels”',
    from: 20.0, to: 26.4, top: 690,
  });
  overlay.fact({
    kicker: 'Physics',
    text: 'But a tide needs <span class="hl">~6 hours</span> to rise. In 5 seconds the oceans barely notice.',
    source: 'NOAA: most coasts get two highs and two lows every 24 h 50 min',
    from: 26.8, to: REPLAY[1], top: 690,
  });
  overlay.fact({
    kicker: 'Fact',
    text: 'At 38,440 km it would be <span class="hl">closer than TV satellites</span> (42,164 km from Earth’s center).',
    source: 'Geostationary orbit radius 42,164 km · 384,400 ÷ 10 = 38,440 km',
    from: 33.0, to: D + 1, top: 330,
  });
  overlay.end('Comment what should <span class="hl">come closer</span> next', { from: 36.6, to: D + 1 });

  return function update(t) {
    const s = simAt(t);
    city.update(s);
    // swell to 10x in ~0.4 s, shrink back at the end
    const k = easeInOutCubic(smoothstep(NEAR, NEAR + 0.4, s)) * (1 - easeInOutCubic(smoothstep(FAR, FAR + 0.4, s)));
    theMoon.setSize(0.52 * (1 + 9 * k));
    // 100x the area = 100x the moonlight: the street goes silver-blue
    city.hemi.intensity = base.hemi * (1 + 0.9 * k);
    city.sun.intensity = base.sun * (1 + 5 * k);

    const c = cam(t);
    applyCamera(camera, c, handheld(t, { amp: c.id === 'avenue' ? 0.004 : 0.0015, kicks: [{ at: NEAR, amp: 0.01, decay: 3 }] }));

    traffic.update(s, { ride: 0.33, tyreScale: 1 });
    crowd.update(s, { stopAt: NEAR + 0.5, lookYaw: Math.PI });
  };
}

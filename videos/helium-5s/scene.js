// What if all the air turned into helium for 5 seconds?
// Sound travels ~2.9x faster in helium: every voice (and horn) rings higher. Helium is ~7x
// lighter than air, so pigeons lose their lift; engines stall with no oxygen.
// Narration: ./script.json (lines during the event use the helium voice). Sources: ./sources.md
import * as THREE from 'three';
import { timesSquare } from '/engine/lib/city.js';
import { buildTraffic } from '/engine/lib/traffic.js';
import { buildCrowd } from '/engine/lib/crowd.js';
import { pigeons } from '/engine/lib/props.js';
import { cameraPath, handheld, shots, applyCamera } from '/engine/lib/camera.js';
import { smoothstep, hash01, remap } from '/engine/lib/util.js';

// simulation time
const HE = 13.6;
const AIR = HE + 5;
// story time
const BIRDS = [29.2, 36.4]; // the pigeons again, slowly (sim 13.7 .. 15.6)
const D = 40;
const simAt = remap([[0, 0], [BIRDS[0], BIRDS[0]], [BIRDS[0], 13.7], [BIRDS[1], 15.6], [BIRDS[1], 29.0], [D, 29.0 + D - BIRDS[1]]]);

export const config = {
  fps: 30,
  duration: D,
  fov: 60,
  bloom: { strength: 0.45, radius: 0.5, threshold: 0.9 },
};

export const audio = [
  { type: 'ambience', from: 0, to: D, level: 0.8 },
  { type: 'crowd', from: 0, to: HE, level: 1.3, fadeOut: 0.05 },
  { type: 'horns', from: 7.6, to: HE - 0.4, count: 5 },
  { type: 'tick', at: [10.6, 11.6, 12.6] },
  { type: 'riser', from: 11.0, to: HE },
  // the same crowd and horns, ringing ~2.9x higher
  { type: 'crowd', from: HE, to: AIR, level: 1.6, fadeIn: 0.05, fadeOut: 0.05, pitch: 2.6 },
  { type: 'horns', from: HE + 0.3, to: AIR - 0.2, count: 6, seed: 22, pitch: 2.6 },
  { type: 'crowd', from: AIR, to: D, level: 1.1, fadeIn: 0.05 },
  { type: 'whoosh', at: BIRDS[0] - 0.35 },
  { type: 'drone', from: BIRDS[0], to: BIRDS[1] },
];

export async function setup({ scene, camera, overlay }) {
  const city = timesSquare({ time: 'day', clear: [[2, 22, 16], [14, 22, 10]] });
  scene.add(city.group);
  scene.fog = city.fog;
  scene.fog.density = 0.0015;
  city.sky.sunDir.value.set(0, 0.66, 0.75).normalize();
  city.sun.position.set(0, 0.66 * 400, 0.75 * 400);

  const traffic = buildTraffic({ lanes: city.lanes, queues: city.queues, count: city.carCount });
  scene.add(traffic.group);
  traffic.brake(HE + 0.6); // no oxygen: every engine stalls
  const crowd = buildCrowd({ zones: city.crowdZones, standZones: city.standZones, count: 430, standing: 46, stepHeight: city.stepHeight, avoid: [[2, 22, 3], [14, 22, 3]] });
  scene.add(crowd.group);
  const birds = pigeons({ count: 64, center: [14, 24, -8], radius: 9, seed: 7 });
  scene.add(birds.group);

  const cam = shots([
    { id: 'aerial', to: 4.6, cam: cameraPath([
      { t: 0, pos: [8, 110, 150], look: [-6, 0, -40], fov: 52 },
      { t: 4.6, pos: [4, 8, 32], look: [2, 10, -10], fov: 58 },
    ]) },
    { id: 'street', to: BIRDS[0], cam: cameraPath([
      { t: 4.6, pos: [2, 1.7, 30], look: [4, 6, -20], fov: 58 },
      { t: HE, pos: [2, 1.7, 22], look: [6, 4, -20], fov: 58 },
      { t: 20, pos: [2, 1.7, 21], look: [10, 2.5, -10], fov: 56 },
      { t: BIRDS[0], pos: [3, 1.7, 19], look: [12, 2.2, -10], fov: 52 },
    ]) },
    // from the south, Sun behind us, the pigeons dropping
    { id: 'birds', to: BIRDS[1], cam: cameraPath([
      { t: BIRDS[0], pos: [14, 2.0, 22], look: [14, 21, -8], fov: 60 },
      { t: BIRDS[1], pos: [14, 2.0, 21], look: [14, 10, -8], fov: 60 },
    ]) },
    { id: 'rise', to: Infinity, cam: cameraPath([
      { t: BIRDS[1], pos: [2, 3, 22], look: [4, 6, -20], fov: 58 },
      { t: D, pos: [10, 50, 70], look: [-8, 0, -40], fov: 54 },
    ]) },
  ]);

  overlay.title('What if all the air turned into <span class="hl">helium</span> for 5 seconds?', { from: 0, fadeIn: 0, to: D + 1 });
  overlay.timer({
    from: 10.4, to: 29.0,
    label: (t) => { const s = simAt(t); return s < HE ? 'Helium in' : s < AIR ? 'Helium for' : 'Air is back'; },
    value: (t) => { const s = simAt(t); return s < HE ? `${(HE - s).toFixed(1)}<small>s</small>` : s < AIR ? `${(s - HE).toFixed(1)}<small>/ 5.0s</small>` : '5.0<small>s ✓</small>'; },
    mode: (t) => { const s = simAt(t); return s < HE ? '' : s < AIR ? 'gone' : 'back'; },
  });
  overlay.counter({ label: 'Speed of sound (m/s)', countTo: 1007, countDur: 1.2, from: 21.6, to: 28.8 });
  overlay.add(Object.assign(document.createElement('div'), { className: 'ov-chip', innerHTML: '◀◀ REPLAY · <b>0.25×</b>' }), { from: BIRDS[0], to: BIRDS[1], fadeIn: 0.15, fadeOut: 0.15, enter: 'pop' });

  return function update(t) {
    const s = simAt(t);
    city.update(s);
    const c = cam(t);
    applyCamera(camera, c, handheld(t, { amp: c.id === 'street' ? 0.004 : 0.0015, kicks: [{ at: HE, amp: 0.006, decay: 4 }] }));
    traffic.update(s, { ride: 0.33, tyreScale: 1 });
    crowd.update(s, {
      stopAt: HE + 0.4,
      lookYaw: Math.PI / 2,
      // hands to the throat: "what happened to my voice?"
      pose: (i) => {
        const k = smoothstep(HE + 0.4 + hash01(i) * 0.8, HE + 1.1 + hash01(i) * 0.8, s) * (1 - smoothstep(AIR, AIR + 1, s));
        return k > 0 ? { armsX: 2.2 * k * hash01(i, 3), armsZ: -0.2 * k } : null;
      },
    });
    // 1/7 the air density, 1/7 the lift: they drop, then recover when the air is back
    birds.update(s, { dropAt: HE, recoverAt: AIR });
  };
}

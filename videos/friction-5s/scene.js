// What if friction disappeared for 5 seconds?
// Walkers' feet slide apart and they go down, still gliding; people standing still are
// fine; cars can't brake until the grip comes back. Narration: ./script.json. Sources: ./sources.md
import * as THREE from 'three';
import { timesSquare } from '/engine/lib/city.js';
import { buildTraffic } from '/engine/lib/traffic.js';
import { buildCrowd } from '/engine/lib/crowd.js';
import { ParticleLayer, emitSkidSmoke } from '/engine/lib/fx.js';
import { cameraPath, handheld, shots, applyCamera } from '/engine/lib/camera.js';
import { clamp, smoothstep, hash01, remap } from '/engine/lib/util.js';

// simulation time
const OFF = 13.4;
const ON = OFF + 5;
// story time
const REPLAY = [18.2, 35.4]; // sim 13.5 .. 17.4 at ~0.23x
const RETURN = REPLAY[1] + (ON - 17.9);
const D = 41;
const simAt = remap([[0, 0], [REPLAY[0], REPLAY[0]], [REPLAY[0], 13.5], [REPLAY[1], 17.4], [REPLAY[1], 17.9], [D, 17.9 + D - REPLAY[1]]]);

export const config = {
  fps: 30,
  duration: D,
  fov: 60,
  bloom: { strength: 0.45, radius: 0.5, threshold: 0.9 },
};

export const audio = [
  { type: 'ambience', from: 0, to: D, level: 0.9 },
  { type: 'crowd', from: 0, to: OFF + 0.3, level: 1 },
  { type: 'whoosh', at: 4.0 },
  { type: 'tick', at: [10.9, 11.9, 12.9] },
  { type: 'riser', from: 11.2, to: OFF },
  { type: 'whoosh', at: OFF + 0.05 },
  { type: 'thumps', from: OFF + 0.5, to: OFF + 2.2, rate: 9, decay: 0.7 },
  { type: 'crowd', from: OFF + 0.4, to: REPLAY[0], level: 1.9 },
  { type: 'horns', from: OFF + 1.0, to: REPLAY[0], count: 5 },
  { type: 'whoosh', at: REPLAY[0] - 0.35 },
  { type: 'drone', from: REPLAY[0], to: REPLAY[1] },
  { type: 'crowd', from: REPLAY[1], to: D, level: 1.5 },
  { type: 'screech', from: RETURN, to: RETURN + 1.4 },
  { type: 'grind', from: RETURN, to: RETURN + 1.2, gain: 0.5 },
  { type: 'horns', from: RETURN + 0.6, to: D, count: 5 },
];

export async function setup({ scene, camera, overlay }) {
  const city = timesSquare({ time: 'day', clear: [[2, 22, 16], [10, -20, 10]] });
  scene.add(city.group);
  scene.fog = city.fog;
  scene.fog.density = 0.0016;

  const traffic = buildTraffic({ lanes: city.lanes, queues: city.queues, count: city.carCount });
  scene.add(traffic.group);
  // the pedals were pressed all along: when grip returns, every wheel locks and skids
  traffic.brake(ON, { grip: 2.2 });
  const crowd = buildCrowd({ zones: city.crowdZones, standZones: city.standZones, count: 440, standing: 60, stepHeight: city.stepHeight, avoid: [[2, 22, 3]] });
  scene.add(crowd.group);
  const smoke = new ParticleLayer(6000, { hardness: 1.1 });
  scene.add(smoke.points);

  // how each walker goes down: feet slide apart, they drop into the splits and topple
  const fall = (i, s) => {
    const tau = s - OFF - 0.1 * hash01(i, 1);
    if (tau <= 0) return null;
    const split = smoothstep(0, 0.35, tau);
    const topple = smoothstep(0.3 + 0.3 * hash01(i, 2), 0.9 + 0.3 * hash01(i, 2), tau);
    const side = hash01(i, 3) < 0.5 ? -1 : 1;
    const back = hash01(i, 4) < 0.6;
    return {
      // down into the splits, then lying on the floor (the body pivots on the feet)
      y: -0.5 * split * (1 - topple) + 0.05 * topple,
      legsX: 1.0 * split * (1 - 0.4 * topple),
      pitch: back ? -1.35 * topple : 0.3 * topple,
      roll: back ? 0.2 * side * topple : 1.3 * side * topple,
      armsZ: 1.6 * split * (1 - 0.5 * topple),
    };
  };

  // hero walker for the slow-motion close-up: someone on the plaza moving along z
  const heroIdx = crowd.people.map((p, i) => [p, i]).filter(([p]) => !p.stand && p.x > 6 && p.x < 18)
    .sort((a, b) => {
      const pa = crowd.where(a[1], OFF), pb = crowd.where(b[1], OFF);
      return Math.hypot(pa.x - 10, pa.z + 10) - Math.hypot(pb.x - 10, pb.z + 10);
    })[0][1];
  const heroCam = (t) => {
    const w = crowd.where(heroIdx, simAt(t), ON + 0.3);
    return { pos: new THREE.Vector3(w.x + 4.2, 1.0, w.z + 1.8 * w.dir), look: new THREE.Vector3(w.x, 0.7, w.z), fov: 46 };
  };

  const cam = shots([
    { id: 'aerial', to: 4.4, cam: cameraPath([
      { t: 0, pos: [8, 110, 150], look: [-6, 0, -40], fov: 52 },
      { t: 4.4, pos: [6, 8, 34], look: [2, 0, -10], fov: 58 },
    ]) },
    { id: 'street', to: REPLAY[0], cam: cameraPath([
      { t: 4.4, pos: [2, 1.7, 30], look: [4, 0.5, -10], fov: 58 },
      { t: OFF, pos: [2, 1.8, 22], look: [3, 0.4, -10], fov: 58 },
      { t: REPLAY[0], pos: [2, 1.9, 21.5], look: [0, 0.3, -10], fov: 58 },
    ]) },
    { id: 'hero', to: 26.0, cam: heroCam },
    { id: 'steps', to: 30.4, cam: cameraPath([
      { t: 26.0, pos: [12, 2.2, -32], look: [12, 2.4, -55], fov: 50 },
      { t: 30.4, pos: [12, 2.0, -34], look: [12, 2.4, -55], fov: 46 },
    ]) },
    { id: 'wide', to: REPLAY[1], cam: cameraPath([
      { t: 30.4, pos: [10, 14, 20], look: [0, 0, -20], fov: 56 },
      { t: REPLAY[1], pos: [10, 12, 14], look: [0, 0, -24], fov: 54 },
    ]) },
    { id: 'skid', to: Infinity, cam: cameraPath([
      { t: REPLAY[1], pos: [2, 1.6, 21], look: [-10, 0.8, -6], fov: 56 },
      { t: RETURN + 2, pos: [2, 1.6, 20.5], look: [-10, 0.8, -6], fov: 56 },
      { t: D, pos: [8, 30, 50], look: [-6, 0, -20], fov: 54 },
    ]) },
  ]);

  overlay.title('What if <span class="hl">friction</span> disappeared for 5 seconds?', { from: 0, fadeIn: 0, to: D + 1 });
  overlay.timer({
    from: 10.5, to: D - 3,
    label: (t) => { const s = simAt(t); return s < OFF ? 'Friction off in' : s < ON ? 'No friction for' : 'Grip is back'; },
    value: (t) => { const s = simAt(t); return s < OFF ? `${(OFF - s).toFixed(1)}<small>s</small>` : s < ON ? `${(s - OFF).toFixed(1)}<small>/ 5.0s</small>` : '5.0<small>s ✓</small>'; },
    mode: (t) => { const s = simAt(t); return s < OFF ? '' : s < ON ? 'gone' : 'back'; },
  });
  overlay.add(Object.assign(document.createElement('div'), { className: 'ov-chip', innerHTML: '◀◀ REPLAY · <b>0.25×</b>' }), { from: REPLAY[0], to: REPLAY[1], fadeIn: 0.15, fadeOut: 0.15, enter: 'pop' });

  return function update(t) {
    const s = simAt(t);
    city.update(s);
    const c = cam(t);
    applyCamera(camera, c, handheld(t, { amp: c.id === 'street' || c.id === 'skid' ? 0.004 : 0.0015, kicks: [{ at: RETURN, amp: 0.012, decay: 4 }] }));

    traffic.update(s, { ride: 0.33, tyreScale: 1 });
    // walkers keep gliding at walking speed (nothing to stop them) until the grip is back
    crowd.update(s, {
      stopAt: ON + 0.3,
      lookYaw: undefined,
      pose: (i, _s, p) => (p.stand ? null : fall(i, s)),
    });
    smoke.setView(1920, camera.fov);
    smoke.begin();
    emitSkidSmoke(smoke, traffic, s, { cam: camera.position, radius: 70, rate: 8, life: 2 });
    smoke.end();
  };
}

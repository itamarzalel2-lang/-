// What if all paint disappeared for 5 seconds?
// Every car turns bare metal, cabs are no longer yellow, lane lines and crosswalks vanish.
// A car's paint is about as thick as a sheet of paper. Narration: ./script.json. Sources: ./sources.md
import * as THREE from 'three';
import { timesSquare } from '/engine/lib/city.js';
import { buildTraffic } from '/engine/lib/traffic.js';
import { buildCrowd } from '/engine/lib/crowd.js';
import { cameraPath, handheld, shots, applyCamera } from '/engine/lib/camera.js';
import { hash01, remap } from '/engine/lib/util.js';

// simulation time
const GONE = 13.6;
const BACK = GONE + 5;
// story time
const CLOSE = [19.8, 32.4]; // slowed look at one cab (sim 15.0 .. 18.3)
const D = 40;
const simAt = remap([[0, 0], [CLOSE[0], CLOSE[0]], [CLOSE[0], 15.0], [CLOSE[1], 18.3], [CLOSE[1], 18.3], [D, 18.3 + D - CLOSE[1]]]);

export const config = {
  fps: 30,
  duration: D,
  fov: 60,
  bloom: { strength: 0.45, radius: 0.5, threshold: 0.9 },
};

export const audio = [
  { type: 'ambience', from: 0, to: D, level: 0.9 },
  { type: 'crowd', from: 0, to: D, level: 1.0 },
  { type: 'whoosh', at: 4.0 },
  { type: 'tick', at: [10.6, 11.6, 12.6] },
  { type: 'riser', from: 11.0, to: GONE },
  { type: 'whoosh', at: GONE - 0.15 },
  { type: 'hit', at: GONE },
  { type: 'horns', from: GONE + 0.8, to: CLOSE[0], count: 6 },
  { type: 'screech', from: GONE + 1.5, to: GONE + 2.6 },
  { type: 'whoosh', at: CLOSE[0] - 0.35 },
  { type: 'drone', from: CLOSE[0], to: CLOSE[1] },
  { type: 'whoosh', at: CLOSE[1] + 0.05 },
  { type: 'hit', at: CLOSE[1] + 0.3 },
];

export async function setup({ scene, camera, overlay }) {
  const city = timesSquare({ time: 'day', clear: [[2, 22, 16]] });
  scene.add(city.group);
  scene.fog = city.fog;
  scene.fog.density = 0.0016;

  const traffic = buildTraffic({ lanes: city.lanes, queues: city.queues, count: city.carCount, cabShare: 0.5 });
  scene.add(traffic.group);
  traffic.brake(GONE + 1.2); // a moment of confusion, then everyone stops
  const crowd = buildCrowd({ zones: city.crowdZones, standZones: city.standZones, count: 430, standing: 46, stepHeight: city.stepHeight, avoid: [[2, 22, 3], [1.5, 9, 3]] });
  scene.add(crowd.group);

  // bare steel, each panel a slightly different grey
  const steel = traffic.cars.map((_, i) => new THREE.Color().setHSL(0.6, 0.05, 0.3 + 0.1 * hash01(i, 7)));
  const bodies = traffic.meshes.bodies;
  let bare = null;

  // hero cab for the close-up
  const lane = city.lanes.find((l) => l.corridor && l.c === -3.8);
  const inLane = traffic.cars.map((c, i) => [c, i]).filter(([c]) => c.lane === lane);
  const score = ([c]) => Math.abs(traffic.pose(c, 17).z - 4) + (c.cab ? 0 : 50);
  const hero = inLane.sort((a, b) => score(a) - score(b))[0][1];
  const cabCam = (t) => {
    const p = traffic.pose(traffic.cars[hero], simAt(t));
    return { pos: new THREE.Vector3(p.x + 4.6, 1.6, p.z + 7.2 - 0.18 * (t - CLOSE[0])), look: new THREE.Vector3(p.x, 0.7, p.z + 0.4), fov: 44 };
  };

  const cam = shots([
    { id: 'aerial', to: 4.5, cam: cameraPath([
      { t: 0, pos: [8, 110, 150], look: [-6, 0, -40], fov: 52 },
      { t: 4.5, pos: [6, 12, 34], look: [-10, 0, -10], fov: 58 },
    ]) },
    { id: 'street', to: 16.4, cam: cameraPath([
      { t: 4.5, pos: [2, 1.8, 30], look: [-10, 0.5, -4], fov: 58 },
      { t: GONE, pos: [2, 1.8, 22], look: [-10, 0.5, -8], fov: 58 },
      { t: 16.4, pos: [2, 1.8, 21.5], look: [-10, 0.5, -8], fov: 58 },
    ]) },
    { id: 'lanes', to: CLOSE[0], cam: cameraPath([
      { t: 16.4, pos: [0, 16, 26], look: [-12, 0, -16], fov: 56 },
      { t: CLOSE[0], pos: [0, 18, 22], look: [-12, 0, -20], fov: 56 },
    ]) },
    { id: 'cab', to: CLOSE[1], cam: cabCam },
    { id: 'rise', to: Infinity, cam: cameraPath([
      { t: CLOSE[1], pos: [0, 16, 26], look: [-12, 0, -16], fov: 56 },
      { t: D, pos: [10, 50, 70], look: [-8, 0, -40], fov: 54 },
    ]) },
  ]);

  overlay.title('What if all <span class="hl">paint</span> disappeared for 5 seconds?', { from: 0, fadeIn: 0, to: D + 1 });
  overlay.timer({
    from: 10.4, to: D - 3,
    label: (t) => { const s = simAt(t); return s < GONE ? 'Paint vanishes in' : s < BACK ? 'No paint for' : 'Paint is back'; },
    value: (t) => { const s = simAt(t); return s < GONE ? `${(GONE - s).toFixed(1)}<small>s</small>` : s < BACK ? `${(s - GONE).toFixed(1)}<small>/ 5.0s</small>` : '5.0<small>s ✓</small>'; },
    mode: (t) => { const s = simAt(t); return s < GONE ? '' : s < BACK ? 'gone' : 'back'; },
  });
  overlay.add(Object.assign(document.createElement('div'), { className: 'ov-chip', innerHTML: '◀◀ REPLAY · <b>0.25×</b>' }), { from: CLOSE[0], to: CLOSE[1], fadeIn: 0.15, fadeOut: 0.15, enter: 'pop' });
  const paintTag = overlay.tag('~0.1 mm of paint', { from: 22.4, to: 25.6 });

  return function update(t) {
    const s = simAt(t);
    city.update(s);
    const gone = s >= GONE && s < BACK;
    for (const m of city.markings) m.visible = !gone;
    if (bare !== gone) {
      traffic.cars.forEach((c, i) => bodies.setColorAt(i, gone ? steel[i] : c.color));
      bodies.instanceColor.needsUpdate = true;
      bare = gone;
    }

    const c = cam(t);
    applyCamera(camera, c, handheld(t, { amp: c.id === 'street' ? 0.004 : 0.0015, kicks: [{ at: GONE, amp: 0.008, decay: 4 }] }));
    // drivers lose their lanes: a little drift while the lines are gone
    traffic.update(s, {
      ride: 0.33,
      tyreScale: 1,
      offset: (i) => (gone ? { x: Math.sin((s - GONE) * 0.9 + i) * 0.35 * Math.min(1, s - GONE), yaw: Math.cos((s - GONE) * 0.9 + i) * 0.05 * Math.min(1, s - GONE) } : null),
    });
    crowd.update(s, { stopAt: GONE + 0.5, lookYaw: -Math.PI / 2 });

    if (c.id === 'cab') {
      const p = traffic.pose(traffic.cars[hero], s);
      const v = new THREE.Vector3(p.x, 1.0, p.z + 0.6);
      const dist = v.distanceTo(camera.position);
      v.project(camera);
      overlay.place(paintTag, (v.x + 1) * 270 - 60, (1 - v.y) * 480, (0.9 / (dist * Math.tan((camera.fov * Math.PI) / 360))) * 480);
    }
  };
}

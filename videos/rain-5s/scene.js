// What if a whole year of rain fell in 5 seconds?
// 49.5 inches (1.26 m) of water at once: past the ~2 ft that floats a car, and ~20,000x
// what NYC's sewers are built for. Narration: ./script.json. Sources: ./sources.md
import * as THREE from 'three';
import { timesSquare } from '/engine/lib/city.js';
import { buildTraffic } from '/engine/lib/traffic.js';
import { buildCrowd } from '/engine/lib/crowd.js';
import { Rain, water } from '/engine/lib/fx.js';
import { cameraPath, handheld, shots, applyCamera } from '/engine/lib/camera.js';
import { clamp, smoothstep, hash01 } from '/engine/lib/util.js';

const START = 13.6; // the year of rain begins
const END = START + 5;
const DEPTH = 1.26; // 49.5 inches
const FLOAT = 0.6; // ~2 ft: most cars lift off
const D = 38;

export const config = {
  fps: 30,
  duration: D,
  fov: 60,
  bloom: { strength: 0.5, radius: 0.55, threshold: 0.88 },
};

export const audio = [
  { type: 'ambience', from: 0, to: D, level: 0.8 },
  { type: 'crowd', from: 0, to: START + 0.3, level: 1 },
  { type: 'whoosh', at: 4.0 },
  { type: 'tick', at: [11.1, 12.1, 13.1] },
  { type: 'riser', from: 11.4, to: START },
  { type: 'boom', at: START - 0.1 },
  { type: 'rain', from: START, to: END + 0.4, level: 1.8 },
  { type: 'splash', at: START + 0.1 },
  { type: 'crowd', from: START + 0.5, to: END + 2, level: 1.8 },
  { type: 'drip', from: END + 0.3, to: D, count: 40 },
  { type: 'alarms', from: END - 1.0, to: D, count: 4 },
  { type: 'horns', from: END, to: D, count: 4 },
];

export async function setup({ scene, camera, overlay }) {
  const city = timesSquare({ time: 'day', clear: [[2, 22, 16], [8, 4, 10]] });
  scene.add(city.group);
  scene.fog = city.fog;
  const fog0 = 0.0016;
  scene.fog.density = fog0;
  // the storm sky
  city.skyTo([[0, '#3d4552'], [0.4, '#596270'], [0.5, '#7a828c'], [0.53, '#6a717a'], [1, '#4a5058']]);
  const base = { sun: city.sun.intensity, hemi: city.hemi.intensity, fog: scene.fog.color.clone() };
  const stormFog = new THREE.Color('#7b8390');

  const traffic = buildTraffic({ lanes: city.lanes, queues: city.queues, count: city.carCount });
  scene.add(traffic.group);
  traffic.brake(START + 0.6);
  const crowd = buildCrowd({ zones: city.crowdZones, standZones: city.standZones, count: 430, standing: 46, stepHeight: city.stepHeight, avoid: [[2, 22, 3], [8, 4, 3]] });
  scene.add(crowd.group);

  const flood = water({ size: [900, 900], center: [0, -40], color: '#3b5a6b', opacity: 0.86 });
  scene.add(flood.mesh);
  const rain = new Rain(9000, { box: [60, 40, 80], opacity: 0.5, length: 1.4 });
  scene.add(rain.lines);

  const level = (t) => DEPTH * clamp((t - START) / 5);
  // once afloat, each car drifts, turns and bobs on its own
  const tFloat = START + (FLOAT / DEPTH) * 5;
  const carFloat = (i, t) => {
    const lift = Math.max(0, level(t) - FLOAT);
    if (lift <= 0) return null;
    const u = t - tFloat, a = hash01(i, 1) * Math.PI * 2, v = 0.15 + 0.3 * hash01(i, 2);
    return {
      x: Math.cos(a) * v * u * 0.6, z: Math.sin(a) * v * u,
      y: lift + 0.05 * Math.sin(t * 1.7 + i) * smoothstep(0, 1, u),
      yaw: (hash01(i, 3) - 0.5) * 0.25 * u,
      roll: 0.05 * Math.sin(t * 1.3 + i * 2) * smoothstep(0, 1, u),
      pitch: 0.04 * Math.sin(t * 1.1 + i) * smoothstep(0, 1, u),
    };
  };

  // hero cab for the "now it's a boat" shot
  const lane = city.lanes.find((l) => l.corridor && l.c === -3.8);
  const inLane = traffic.cars.map((c, i) => [c, i]).filter(([c]) => c.lane === lane);
  const score = ([c]) => Math.abs(traffic.pose(c, END).z - 2) + (c.cab ? 0 : 50);
  const hero = inLane.sort((a, b) => score(a) - score(b))[0][1];
  const boatCam = (t) => {
    const p = traffic.pose(traffic.cars[hero], t), f = carFloat(hero, t) ?? { x: 0, z: 0, y: 0 };
    const x = p.x + f.x, z = p.z + f.z;
    return { pos: new THREE.Vector3(x + 4.2, 1.75, z + 6.5 - 0.2 * (t - 19)), look: new THREE.Vector3(x, 0.9 + f.y * 0.6, z), fov: 50 };
  };

  const cam = shots([
    { id: 'aerial', to: 4.5, cam: cameraPath([
      { t: 0, pos: [8, 110, 150], look: [-6, 0, -40], fov: 52 },
      { t: 4.5, pos: [4, 9, 32], look: [-8, 4, -30], fov: 58 },
    ]) },
    { id: 'street', to: 19.0, cam: cameraPath([
      { t: 4.5, pos: [2, 1.7, 30], look: [-8, 5, -40], fov: 60 },
      { t: START, pos: [2, 1.7, 22], look: [-6, 6, -40], fov: 60 },
      { t: 19, pos: [2, 1.75, 21.5], look: [-6, 3, -40], fov: 60 },
    ]) },
    { id: 'boat', to: 27.2, cam: boatCam },
    { id: 'rise', to: Infinity, cam: cameraPath([
      { t: 27.2, pos: [6, 4, 26], look: [-6, 1, -20], fov: 58 },
      { t: D, pos: [12, 55, 80], look: [-6, 0, -40], fov: 54 },
    ]) },
  ]);

  overlay.title('What if a whole year of <span class="hl">rain</span> fell in 5 seconds?', { from: 0, fadeIn: 0, to: D + 1 });
  overlay.timer({
    from: 10.8, to: 27.0,
    label: (t) => (t < START ? 'A year of rain in' : t < END ? 'Raining for' : 'Water level'),
    value: (t) => (t < START ? `${(START - t).toFixed(1)}<small>s</small>` : t < END ? `${(t - START).toFixed(1)}<small>/ 5.0s</small>` : `1.26<small> m</small>`),
    mode: (t) => (t < START ? '' : 'gone'),
  });
  overlay.counter({ label: 'Water level (cm)', countTo: 126, countDur: 5, from: START, to: END + 0.4 });

  return function update(t) {
    city.update(t);
    const storm = smoothstep(START - 0.6, START + 0.4, t) * (1 - 0.5 * smoothstep(END, END + 3, t));
    city.sky.blend.value = storm;
    city.sky.sunDisk.value = 1 - storm;
    city.sun.intensity = base.sun * (1 - 0.75 * storm);
    city.hemi.intensity = base.hemi * (1 - 0.35 * storm);
    scene.fog.color.copy(base.fog).lerp(stormFog, storm);
    scene.fog.density = fog0 * (1 + 3 * smoothstep(START, START + 0.5, t) * (1 - smoothstep(END, END + 1.5, t)));

    const lv = level(t);
    flood.mesh.position.y = lv > 0.005 ? lv : -1;
    flood.update(t);

    const c = cam(t);
    applyCamera(camera, c, handheld(t, { amp: c.id === 'street' ? 0.004 : 0.002, kicks: [{ at: START, amp: 0.012, decay: 3 }] }));
    const pouring = t >= START && t < END ? 1 : 0;
    rain.update(t, { center: camera.position, speed: 24, amount: pouring, floor: Math.max(0, lv), wind: 2 });

    traffic.update(t, { ride: 0.33, tyreScale: 1, offset: (i) => carFloat(i, t) });
    crowd.update(t, {
      stopAt: START + 0.3,
      lookYaw: Math.PI,
      // wading: arms up out of the water
      pose: (i) => {
        const k = smoothstep(START + 0.6 + hash01(i) * 1.5, START + 1.6 + hash01(i) * 1.5, t);
        return k > 0 ? { armsX: 2.6 * k, armsZ: -0.3 * k } : null;
      },
    });
  };
}

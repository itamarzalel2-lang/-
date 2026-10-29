// What if a whole year of snow fell in 5 seconds?
// 29.8 inches (76 cm) of snow at once buries cars to their doors, yet it melts to only
// ~7.6 cm of water (snow-to-liquid ~10:1). Narration: ./script.json. Sources: ./sources.md
import * as THREE from 'three';
import { timesSquare } from '/engine/lib/city.js';
import { buildTraffic } from '/engine/lib/traffic.js';
import { buildCrowd } from '/engine/lib/crowd.js';
import { ParticleLayer } from '/engine/lib/fx.js';
import { cameraPath, handheld, shots, applyCamera } from '/engine/lib/camera.js';
import { clamp, smoothstep, hash01 } from '/engine/lib/util.js';

const START = 13.6;
const END = START + 5;
const DEPTH = 0.76; // 29.8 inches
const D = 38;

export const config = {
  fps: 30,
  duration: D,
  fov: 60,
  bloom: { strength: 0.45, radius: 0.5, threshold: 0.9 },
};

export const audio = [
  { type: 'ambience', from: 0, to: START + 0.3, level: 0.9 },
  { type: 'crowd', from: 0, to: START + 0.3, level: 1 },
  { type: 'whoosh', at: 4.0 },
  { type: 'tick', at: [10.6, 11.6, 12.6] },
  { type: 'riser', from: 11.0, to: START },
  { type: 'wind', from: START - 0.2, to: END + 0.5, level: 1.6 },
  { type: 'whoosh', at: START },
  { type: 'crowd', from: START + 0.6, to: END + 1.5, level: 1.4 },
  // snow muffles a city: a much quieter bed afterwards
  { type: 'ambience', from: END, to: D, level: 0.35 },
  { type: 'wind', from: END + 0.5, to: D, level: 0.4 },
  { type: 'horns', from: END + 1.0, to: D, count: 3 },
];

export async function setup({ scene, camera, overlay }) {
  const city = timesSquare({ time: 'day', clear: [[2, 22, 16], [-1.2, 8, 10]] });
  scene.add(city.group);
  scene.fog = city.fog;
  const fog0 = 0.0016;
  scene.fog.density = fog0;
  city.skyTo([[0, '#8d97a6'], [0.4, '#b4bcc7'], [0.5, '#d9dee5'], [0.53, '#cfd4db'], [1, '#aab0b8']]);
  const base = { sun: city.sun.intensity, hemi: city.hemi.intensity, fog: scene.fog.color.clone() };
  const white = new THREE.Color('#e3e8ef');

  const traffic = buildTraffic({ lanes: city.lanes, queues: city.queues, count: city.carCount });
  scene.add(traffic.group);
  traffic.brake(START + 0.6);
  const crowd = buildCrowd({ zones: city.crowdZones, standZones: city.standZones, count: 430, standing: 46, stepHeight: city.stepHeight, avoid: [[2, 22, 3], [1.8, 10, 3]] });
  scene.add(crowd.group);

  // the snow layer: one bright, slightly rough sheet that rises over everything
  const snow = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: '#f5f7fb', roughness: 0.95, emissive: '#cfd6e2', emissiveIntensity: 0.18 }),
  );
  snow.position.set(0, -1, -40);
  scene.add(snow);
  const flakes = new ParticleLayer(14000, { hardness: 1.3, minSize: 2.5 });
  scene.add(flakes.points);

  const level = (t) => DEPTH * clamp((t - START) / 5);

  // a buried cab for the close-up
  const lane = city.lanes.find((l) => l.corridor && l.c === -3.8);
  const inLane = traffic.cars.map((c, i) => [c, i]).filter(([c]) => c.lane === lane);
  const score = ([c]) => Math.abs(traffic.pose(c, END).z - 4) + (c.cab ? 0 : 50);
  const hero = inLane.sort((a, b) => score(a) - score(b))[0][1];
  const buriedCam = (t) => {
    const p = traffic.pose(traffic.cars[hero], t);
    return { pos: new THREE.Vector3(p.x + 5.6, 1.7, p.z + 8.5 - 0.15 * (t - 19)), look: new THREE.Vector3(p.x, 0.8, p.z), fov: 46 };
  };

  const cam = shots([
    { id: 'aerial', to: 4.5, cam: cameraPath([
      { t: 0, pos: [8, 110, 150], look: [-6, 0, -40], fov: 52 },
      { t: 4.5, pos: [4, 9, 32], look: [-8, 4, -30], fov: 58 },
    ]) },
    { id: 'street', to: 19.4, cam: cameraPath([
      { t: 4.5, pos: [2, 1.7, 30], look: [-8, 5, -40], fov: 60 },
      { t: START, pos: [2, 1.7, 22], look: [-6, 6, -40], fov: 60 },
      { t: 19.4, pos: [2, 1.8, 21.5], look: [-6, 3, -40], fov: 60 },
    ]) },
    { id: 'buried', to: 29.8, cam: buriedCam },
    { id: 'rise', to: Infinity, cam: cameraPath([
      { t: 29.8, pos: [6, 4, 26], look: [-6, 1, -20], fov: 58 },
      { t: D, pos: [12, 55, 80], look: [-6, 0, -40], fov: 54 },
    ]) },
  ]);

  overlay.title('What if a whole year of <span class="hl">snow</span> fell in 5 seconds?', { from: 0, fadeIn: 0, to: D + 1 });
  overlay.timer({
    from: 10.4, to: 29.6,
    label: (t) => (t < START ? 'A year of snow in' : t < END ? 'Snowing for' : 'Snow depth'),
    value: (t) => (t < START ? `${(START - t).toFixed(1)}<small>s</small>` : t < END ? `${(t - START).toFixed(1)}<small>/ 5.0s</small>` : '76<small> cm</small>'),
    mode: (t) => (t < START ? '' : 'gone'),
  });
  overlay.counter({ label: 'Snow depth (cm)', countTo: 76, countDur: 5, from: START, to: END + 0.4 });
  overlay.counter({ label: 'Melted: water (cm)', countTo: 7.6, decimals: 1, countDur: 1.6, from: 21.6, to: 29.6 });

  return function update(t) {
    city.update(t);
    const storm = smoothstep(START - 0.8, START + 0.3, t);
    const falling = smoothstep(START - 0.2, START + 0.2, t) * (1 - smoothstep(END - 0.2, END + 0.6, t));
    city.sky.blend.value = storm;
    city.sky.sunDisk.value = 1 - storm;
    city.sun.intensity = base.sun * (1 - 0.6 * storm);
    city.hemi.intensity = base.hemi * (1 + 0.2 * storm);
    scene.fog.color.copy(base.fog).lerp(white, storm);
    scene.fog.density = fog0 * (1 + 7 * falling + 1.0 * storm);

    const lv = level(t);
    snow.position.y = lv > 0.002 ? lv : -1;

    const c = cam(t);
    applyCamera(camera, c, handheld(t, { amp: c.id === 'street' ? 0.004 : 0.0015 }));

    // flakes: a dense column around the camera, each one a function of time
    flakes.setView(1920, camera.fov);
    flakes.begin();
    if (falling > 0.001) {
      const H = 24, cx = camera.position.x, cz = camera.position.z;
      for (let i = 0; i < 14000; i++) {
        if (hash01(i, 9) > falling) continue;
        const v = 1.6 + hash01(i, 3) * 1.4;
        const y = lv + H - ((hash01(i, 4) * H + v * t) % H);
        const x = cx + (hash01(i, 1) - 0.5) * 40 + Math.sin(t * 1.3 + i) * 0.4;
        const z = cz + (hash01(i, 2) - 0.6) * 60 + Math.cos(t * 1.1 + i * 0.7) * 0.4;
        flakes.push(x, y, z, 0.97, 0.98, 1.0, 0.05 + hash01(i, 5) * 0.06, 0.9);
      }
    }
    flakes.end();

    traffic.update(t, { ride: 0.33, tyreScale: 1 });
    crowd.update(t, {
      stopAt: START + 0.3,
      lookYaw: Math.PI,
      // arms up out of the drift
      pose: (i) => {
        const k = smoothstep(START + 1.2 + hash01(i) * 1.5, START + 2.2 + hash01(i) * 1.5, t);
        return k > 0 ? { armsX: 1.4 * k, armsZ: -0.6 * k } : null;
      },
    });
  };
}

// What if every wheel turned square for 5 seconds?
// Every quarter turn lifts the axle ~14 cm and drops it again (7-8 slams a second at
// 18 km/h). Twist: on a road of inverted catenaries a square wheel rolls perfectly
// smoothly (Stan Wagon's square-wheeled trike). Narration: ./script.json. Sources: ./sources.md
import * as THREE from 'three';
import { timesSquare } from '/engine/lib/city.js';
import { buildTraffic, CAR, WHEELS } from '/engine/lib/traffic.js';
import { buildCrowd } from '/engine/lib/crowd.js';
import { cameraPath, handheld, shots, follow, applyCamera } from '/engine/lib/camera.js';
import { smoothstep, remap } from '/engine/lib/util.js';

// simulation time
const SQ = 14.0; // wheels turn square
const RND = SQ + 5; // and round again
// story time
const REPLAY = [18.8, 27.4]; // sim 14.2 .. 17.2 at 0.35x
const CAT = [27.4, 37.6]; // the catenary road
const D = 41;
const simAt = remap([[0, 0], [REPLAY[0], REPLAY[0]], [REPLAY[0], 14.2], [REPLAY[1], 17.2], [REPLAY[1], 19.4], [D, 19.4 + D - REPLAY[1]]]);

const A = CAR.tyreR; // half the side of the square wheel (same 0.66 m footprint)
const BUMP = 2 * A * Math.asinh(1); // inverted-catenary bump length for that square
// axle height of a square wheel rolled a distance d on flat ground
const axle = (d) => {
  const q = (((d / (2 * A)) % 1) + 1) % 1; // fraction of a quarter turn
  return A * Math.SQRT2 * Math.sin(Math.PI / 4 + (q * Math.PI) / 2);
};

export const config = {
  fps: 30,
  duration: D,
  fov: 60,
  bloom: { strength: 0.5, radius: 0.55, threshold: 0.86 },
};

export const audio = [
  { type: 'ambience', from: 0, to: D, level: 0.9 },
  { type: 'crowd', from: 0, to: D, level: 0.8 },
  { type: 'whoosh', at: 3.9 },
  { type: 'tick', at: [11.4, 12.4, 13.4] },
  { type: 'riser', from: 11.8, to: SQ },
  { type: 'hit', at: SQ },
  { type: 'thumps', from: SQ + 0.05, to: REPLAY[0], rate: 7.5, decay: 0.9 },
  { type: 'screech', from: SQ + 0.3, to: SQ + 2.2 },
  { type: 'horns', from: SQ + 0.6, to: REPLAY[0], count: 4 },
  { type: 'whoosh', at: REPLAY[0] - 0.35 },
  { type: 'thumps', from: REPLAY[0] + 0.2, to: REPLAY[1] - 0.4, rate: 2.6, decay: 0.6 },
  { type: 'drone', from: REPLAY[0], to: REPLAY[1] },
  { type: 'whoosh', at: CAT[0] - 0.3 },
  { type: 'horns', from: CAT[1], to: D, count: 3 },
];

// a showcase strip of inverted catenaries on the plaza, along z
function catenaryRoad(x, z0, z1, width = 2.6) {
  const pos = [], idx = [];
  const n = Math.round((z1 - z0) / 0.02);
  const y = (z) => {
    const u = ((((z - z0) / BUMP) % 1) + 1) % 1 - 0.5; // -0.5..0.5 within a bump
    return 0.15 + A * Math.SQRT2 - A * Math.cosh((u * BUMP) / A);
  };
  for (let i = 0; i <= n; i++) {
    const z = z0 + ((z1 - z0) * i) / n, h = y(z);
    pos.push(x - width / 2, h, z, x + width / 2, h, z, x - width / 2, 0.15, z, x + width / 2, 0.15, z);
    if (i) {
      const a = (i - 1) * 4, b = i * 4;
      idx.push(a, b, a + 1, a + 1, b, b + 1); // top
      idx.push(a + 2, a, b + 2, a, b, b + 2); // left side
      idx.push(a + 1, a + 3, b + 1, a + 3, b + 3, b + 1); // right side
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return { mesh: new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#8f8aa3', roughness: 0.7 })), y };
}

// a stand-alone cab with square wheels for the catenary demo
function squareCab() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.62, 4.5).translate(0, 0.24, 0), new THREE.MeshStandardMaterial({ color: '#f7c600', roughness: 0.4 }));
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.5, 2.35).translate(0, 0.8, -0.25), new THREE.MeshStandardMaterial({ color: '#15171f', roughness: 0.2 }));
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.24, 0.22).translate(0, 1.24, -0.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.35, 0.8), toneMapped: false }));
  g.add(body, cabin, sign);
  const wheels = WHEELS.map(([wx, wz]) => {
    const w = new THREE.Group();
    w.add(new THREE.Mesh(new THREE.BoxGeometry(CAR.tyreW, 2 * A, 2 * A), new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.95 })));
    w.add(new THREE.Mesh(new THREE.BoxGeometry(CAR.tyreW + 0.03, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: '#c9ccd6', metalness: 0.7, roughness: 0.3 })));
    w.position.set(wx, 0, wz);
    g.add(w);
    return w;
  });
  return { group: g, wheels };
}

export async function setup({ scene, camera, overlay }) {
  const city = timesSquare({ time: 'day', clear: [[2, 14, 20], [8, 6, 12]] });
  scene.add(city.group);
  scene.fog = city.fog;
  scene.fog.density = 0.0016;

  const traffic = buildTraffic({ lanes: city.lanes, queues: city.queues, count: city.carCount, squareWheels: true });
  scene.add(traffic.group);
  traffic.brake(SQ + 0.35); // every driver brakes hard
  const crowd = buildCrowd({ zones: city.crowdZones, standZones: city.standZones, count: 430, standing: 46, stepHeight: city.stepHeight, avoid: [[2, 14, 3], [8, 6, 3], [12, 0, 3.2]] });
  scene.add(crowd.group);

  const Z0 = 100; // an empty stretch of plaza south of the crowd
  const road = catenaryRoad(12, Z0, Z0 + 28);
  scene.add(road.mesh);
  const cab = squareCab();
  scene.add(cab.group);

  // hero: a cab next to the plaza for the slow-motion close-up
  const lane = city.lanes.find((l) => l.corridor && l.c === -3.8);
  const inLane = traffic.cars.map((c, i) => [c, i]).filter(([c]) => c.lane === lane);
  const score = ([c]) => Math.abs(traffic.pose(c, SQ).z - 6) + (c.cab ? 0 : 50);
  const hero = inLane.sort((a, b) => score(a) - score(b))[0][1];
  const heroCam = follow(traffic, hero, { offset: [3.0, 0.6, 4.6], target: [0.7, 0.35, 1.2], fov: 44 });

  const cabZ = (t) => 102 + 2.2 * (t - CAT[0]); // the demo cab rolls south along the strip
  const cam = shots([
    { id: 'aerial', to: 4.4, cam: cameraPath([
      { t: 0, pos: [8, 110, 150], look: [-6, 0, -40], fov: 52 },
      { t: 4.4, pos: [6, 9, 34], look: [-10, 1.5, -10], fov: 58 },
    ]) },
    { id: 'street', to: REPLAY[0], cam: cameraPath([
      { t: 4.4, pos: [2, 1.7, 24], look: [-14, 1.6, -4], fov: 58 },
      { t: SQ, pos: [2, 1.7, 15], look: [-14, 1.4, -8], fov: 58 },
      { t: REPLAY[0], pos: [2, 1.7, 14], look: [-14, 1.2, -8], fov: 56 },
    ]) },
    { id: 'wheel', to: REPLAY[1], cam: (t) => heroCam(simAt(t)) },
    { id: 'catenary', to: CAT[1], cam: (t) => {
      const z = cabZ(t);
      // side-on and far enough to see the whole cab gliding level over the bumps
      return { pos: new THREE.Vector3(23.5, 0.75, z + 1.5), look: new THREE.Vector3(12, 0.6, z + 0.6), fov: 34 };
    } },
    { id: 'rise', to: Infinity, cam: cameraPath([
      { t: CAT[1], pos: [16, 3, 18], look: [6, 1, -6], fov: 56 },
      { t: D, pos: [12, 40, 60], look: [-8, 0, -20], fov: 54 },
    ]) },
  ]);

  overlay.title('What if every wheel turned <span class="hl">square</span> for 5 seconds?', { from: 0, fadeIn: 0, to: D + 1 });
  overlay.timer({
    from: 10.8, to: CAT[0],
    label: (t) => { const s = simAt(t); return s < SQ ? 'Wheels go square in' : s < RND ? 'Square for' : 'Round again'; },
    value: (t) => { const s = simAt(t); return s < SQ ? `${(SQ - s).toFixed(1)}<small>s</small>` : s < RND ? `${(s - SQ).toFixed(1)}<small>/ 5.0s</small>` : '5.0<small>s ✓</small>'; },
    mode: (t) => { const s = simAt(t); return s < SQ ? '' : s < RND ? 'gone' : 'back'; },
  });
  overlay.add(Object.assign(document.createElement('div'), { className: 'ov-chip', innerHTML: '◀◀ REPLAY · <b>0.35×</b>' }), { from: REPLAY[0], to: REPLAY[1], fadeIn: 0.15, fadeOut: 0.15, enter: 'pop' });
  const liftTag = overlay.tag('+14 cm', { from: 20.4, to: REPLAY[1] - 0.2 });
  overlay.fact({
    kicker: 'Geometry',
    text: 'A square wheel lifts its axle <span class="hl">~14 cm</span> every quarter turn: <span class="hl">7.6 slams</span> a second at 18 km/h.',
    source: 'Corner vs side of a 66 cm square: (√2 − 1) × 33 cm ≈ 13.7 cm · 5 m/s ÷ 0.66 m per quarter turn',
    from: 21.4, to: REPLAY[1], top: 690,
  });
  overlay.fact({
    kicker: 'Math',
    text: 'On a road of upside-down <span class="hl">catenaries</span>, a square wheel rolls perfectly smoothly.',
    source: 'Stan Wagon, Macalester College: square-wheeled trike on an inverted-catenary road (1997)',
    from: 31.0, to: CAT[1], top: 690,
  });
  overlay.end('Comment what should <span class="hl">change</span> next', { from: 38.1, to: D + 1 });

  return function update(t) {
    const s = simAt(t);
    city.update(s);

    const c = cam(t);
    applyCamera(camera, c, handheld(t, { amp: c.id === 'street' ? 0.004 : 0.0015, kicks: [{ at: SQ, amp: 0.02, decay: 4 }] }));

    // wheels: square from SQ to RND, bouncing on their corners
    const sq = smoothstep(SQ, SQ + 0.06, s) * (1 - smoothstep(RND, RND + 0.06, s));
    traffic.update(s, {
      ride: 0.33,
      tyreScale: 1,
      square: sq,
      spinRadius: sq > 0.5 ? (2 * A) / (Math.PI / 2) : CAR.tyreR,
      offset: (i, _t, p) => {
        if (sq < 0.5) return null;
        const hf = axle(p.dist + 0.3), hr = axle(p.dist + 0.3 - 2 * CAR.axle);
        return { y: (hf + hr) / 2 - A, pitch: Math.atan2(hf - hr, 2 * CAR.axle) * -1 };
      },
    });
    crowd.update(s, { stopAt: SQ + 0.6, lookYaw: -Math.PI / 2 });

    // the red ring on the hero's front wheel in the replay
    if (c.id === 'wheel') {
      const wc = traffic.contact(hero, 1, s);
      const p = new THREE.Vector3(wc.x, 0.4, wc.z);
      const dist = p.distanceTo(camera.position);
      p.project(camera);
      const r = (0.42 / (dist * Math.tan((camera.fov * Math.PI) / 360))) * 480;
      overlay.place(liftTag, (p.x + 1) * 270, (1 - p.y) * 480, r);
    }

    // catenary demo: body stays perfectly level, each wheel turns with its own position
    const z = t > CAT[0] ? cabZ(Math.min(t, CAT[1])) : 102;
    cab.group.position.set(12, 0.15 + A * Math.SQRT2, z);
    cab.wheels.forEach((w, k) => {
      const wz = z + WHEELS[k][1];
      w.rotation.x = (((wz - Z0) / BUMP) * Math.PI) / 2 + Math.PI / 4;
    });
  };
}

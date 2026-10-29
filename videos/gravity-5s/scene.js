// What if gravity switched off for 5 seconds?
// Twist: every car's own suspension springs throw it into the air (~4 m in 5 s),
// and then gravity comes back. Narration: ./script.json. Sources: ./sources.md
import { timesSquare } from '/engine/lib/city.js';
import { buildTraffic } from '/engine/lib/traffic.js';
import { buildCrowd } from '/engine/lib/crowd.js';
import { cameraPath, handheld, shots, applyCamera } from '/engine/lib/camera.js';
import { clamp, smoothstep, hash01, remap } from '/engine/lib/util.js';
import * as THREE from 'three';

// simulation time
const OFF = 14.0;
const ON = OFF + 5;
const G = 9.81;
const V_UP = 0.8; // m/s launch speed from the springs (see sources.md)
const tLand = (V_UP + Math.sqrt(V_UP * V_UP + 2 * G * V_UP * 5)) / G; // fall time after ON
// story time
const REPLAY = [18.7, 29.0]; // sim 14.0 .. 18.9 at ~0.48x
const RETURN = REPLAY[1] + (ON - 18.6);
const D = 41.5;
const simAt = remap([[0, 0], [REPLAY[0], REPLAY[0]], [REPLAY[0], OFF], [REPLAY[1], 18.9], [REPLAY[1], 18.6], [D, 18.6 + D - REPLAY[1]]]);

export const config = {
  fps: 30,
  duration: D,
  fov: 60,
  bloom: { strength: 0.55, radius: 0.55, threshold: 0.85 },
};

export const audio = [
  { type: 'ambience', from: 0, to: D, level: 0.85 },
  { type: 'crowd', from: 0, to: OFF + 0.3, level: 1 },
  { type: 'whoosh', at: 3.9 },
  { type: 'tick', at: [11.4, 12.4, 13.4] },
  { type: 'riser', from: 11.6, to: OFF },
  { type: 'whoosh', at: OFF - 0.3 },
  { type: 'drone', from: OFF, to: REPLAY[1] + 0.3 },
  { type: 'crowd', from: OFF + 0.8, to: REPLAY[0], level: 1.8 },
  { type: 'whoosh', at: REPLAY[0] - 0.35 },
  { type: 'heartbeat', from: REPLAY[0] + 0.3, to: REPLAY[1], bpm: 50 },
  { type: 'crowd', from: REPLAY[1], to: RETURN + 0.4, level: 1.8 },
  { type: 'boom', at: RETURN + tLand },
  { type: 'burst', at: RETURN + tLand + 0.02, gain: 0.7 },
  { type: 'alarms', from: RETURN + tLand + 0.2, to: D, count: 4 },
  { type: 'horns', from: RETURN + tLand + 0.5, to: D, count: 5 },
];

export async function setup({ scene, camera, overlay }) {
  const city = timesSquare({ time: 'night', clear: [[2, 14, 20], [2, 6, 12]] });
  scene.add(city.group);
  scene.fog = city.fog;

  const traffic = buildTraffic({ lanes: city.lanes, queues: city.queues, count: city.carCount });
  scene.add(traffic.group);
  traffic.brake(ON + tLand + 0.3); // no grip until the tyres are back on the road
  const crowd = buildCrowd({ zones: city.crowdZones, standZones: city.standZones, count: 430, standing: 46, stepHeight: city.stepHeight, avoid: [[2, 14, 3], [1.6, 7.5, 4], [3.2, 6, 3]] });
  scene.add(crowd.group);

  // height of a body launched at v (m/s) when gravity goes off, then falling when it comes back
  const flight = (v, s) => {
    if (s < OFF) return { y: 0, landed: false };
    const tau = Math.min(s, ON) - OFF;
    if (s <= ON) return { y: v * tau, landed: false };
    const u = s - ON;
    const y = v * 5 + v * u - 0.5 * G * u * u;
    if (y > 0) return { y, landed: false };
    const tl = (v + Math.sqrt(v * v + 2 * G * v * 5)) / G, after = u - tl;
    const impact = G * tl - v;
    return { y: Math.max(0, impact * 0.04 * Math.exp(-5 * after) * Math.sin(Math.min(Math.PI, after * 9))), landed: true, after };
  };
  const carV = (i) => V_UP * (0.85 + 0.3 * hash01(i, 1));

  // hero: a cab in the lane by the plaza that will be right next to us at OFF
  const lane = city.lanes.find((l) => l.corridor && l.c === -3.8);
  const inLane = traffic.cars.map((c, i) => [c, i]).filter(([c]) => c.lane === lane);
  const hero = inLane.sort((a, b) => (Math.abs(traffic.pose(a[0], OFF).z - 2) + (a[0].cab ? 0 : 50)) - (Math.abs(traffic.pose(b[0], OFF).z - 2) + (b[0].cab ? 0 : 50)))[0][1];
  const under = (t) => {
    // camera on the kerb, looking up at the hero cab as it drifts overhead and onward
    const s = simAt(t), p = traffic.pose(traffic.cars[hero], s), y = flight(carV(hero), s).y + 0.17;
    return { pos: new THREE.Vector3(3.2, 0.45, p.z + 7.5), look: new THREE.Vector3(p.x, 0.9 + 0.6 * y, p.z), fov: 50 };
  };

  const key = new THREE.PointLight('#ffd9b0', 0, 18, 1.4);
  scene.add(key);

  const cam = shots([
    { id: 'aerial', to: 4.3, cam: cameraPath([
      { t: 0, pos: [10, 90, 120], look: [-8, 0, -20], fov: 54 },
      { t: 4.3, pos: [4, 8, 30], look: [-12, 2, -10], fov: 58 },
    ]) },
    { id: 'street', to: OFF, cam: cameraPath([
      { t: 4.3, pos: [2, 1.75, 22], look: [-16, 2.2, -2], fov: 60 },
      { t: OFF, pos: [2, 1.75, 14], look: [-16, 2.5, -8], fov: 60 },
    ]) },
    { id: 'float', to: REPLAY[0], cam: cameraPath([
      { t: OFF, pos: [2, 1.8, 14], look: [-16, 3, -8], fov: 60 },
      { t: REPLAY[0], pos: [2, 2.6, 13.6], look: [-15, 6, -9], fov: 60 },
    ]) },
    { id: 'under', to: 24.0, cam: under },
    { id: 'people', to: REPLAY[1], cam: cameraPath([
      { t: 24.0, pos: [1.5, 1.2, 8], look: [14, 3.0, -8], fov: 54 },
      { t: REPLAY[1], pos: [1.8, 1.4, 7], look: [14, 3.4, -8], fov: 52 },
    ]) },
    { id: 'fall', to: 34.0, cam: cameraPath([
      { t: REPLAY[1], pos: [2, 2.9, 13.6], look: [-15, 6.5, -9], fov: 60 },
      { t: RETURN + 1.2, pos: [2, 1.75, 13.5], look: [-15, 1.5, -8], fov: 60 },
      { t: 34, pos: [2, 1.75, 13.5], look: [-15, 1.8, -8], fov: 60 },
    ]) },
    { id: 'rise', to: Infinity, cam: cameraPath([
      { t: 34, pos: [3, 3, 16], look: [-12, 1, -10], fov: 58 },
      { t: D, pos: [12, 40, 60], look: [-9, 0, -20], fov: 56 },
    ]) },
  ]);

  overlay.title('What if <span class="hl">gravity</span> switched off for 5 seconds?', { from: 0, fadeIn: 0, to: D + 1 });
  overlay.fact({
    kicker: 'Fact',
    text: 'Every car’s springs are squeezed <span class="hl">~17 cm</span> by its own weight.',
    source: 'Ride frequency of passenger cars ≈ 1–1.5 Hz → static deflection g/(2πf)² ≈ 17 cm at 1.2 Hz',
    from: 5.4, to: 10.6,
  });
  overlay.timer({
    from: 10.7, to: D - 3,
    label: (t) => { const s = simAt(t); return s < OFF ? 'Gravity off in' : s < ON ? 'No gravity for' : 'Gravity is back'; },
    value: (t) => { const s = simAt(t); return s < OFF ? `${(OFF - s).toFixed(1)}<small>s</small>` : s < ON ? `${(s - OFF).toFixed(1)}<small>/ 5.0s</small>` : '5.0<small>s ✓</small>'; },
    mode: (t) => { const s = simAt(t); return s < OFF ? '' : s < ON ? 'gone' : 'back'; },
  });
  overlay.add(Object.assign(document.createElement('div'), { className: 'ov-chip', innerHTML: '◀◀ REPLAY · <b>0.5×</b>' }), { from: REPLAY[0], to: REPLAY[1], fadeIn: 0.15, fadeOut: 0.15, enter: 'pop' });
  overlay.fact({
    kicker: 'Physics',
    text: 'Nothing pulls them back down. After 5 seconds every car is <span class="hl">~4 m</span> up.',
    source: 'Released spring ≈ √(g·δ) ≈ 1.3 m/s, minus dampers and wheel mass ≈ 0.8 m/s × 5 s',
    from: 21.6, to: 28.8,
  });
  overlay.fact({
    kicker: 'Physics',
    text: 'A 4 m drop hits like a <span class="hl">~32 km/h</span> crash. 352 of them at once.',
    source: 'Free fall: v = √(2·g·h) = √(2 × 9.81 × 4) ≈ 8.9 m/s ≈ 32 km/h',
    from: 32.4, to: D + 1, top: 330,
  });
  overlay.counter({ label: 'Cars dropped from ~4 m', countTo: 352, countDur: 1.2, from: 34.5, to: D + 1 });
  overlay.end('Comment what should <span class="hl">vanish</span> next', { from: 38.8, to: D + 1 });

  return function update(t) {
    const s = simAt(t);
    city.update(s);

    const c = cam(t);
    key.intensity = c.id === 'under' ? 30 : 0;
    key.position.set(1.5, 0.3, c.look.z + 3);
    // on foot we float too (we pushed off the ground a little), then drop
    const me = c.id === 'float' || c.id === 'fall' ? flight(0.12, s).y : 0;
    c.pos.y += me;
    const tilt = c.id === 'float' || c.id === 'fall' ? (s > OFF && s < ON + tLand ? 0.035 * (Math.min(s, ON) - OFF) : 0) : 0;
    applyCamera(camera, c, handheld(t, { amp: c.id === 'aerial' || c.id === 'rise' ? 0.0015 : 0.004, kicks: [{ at: RETURN + tLand, amp: 0.035, decay: 3.5 }] }), tilt);

    traffic.update(s, {
      ride: 0.33,
      tyreScale: 1,
      offset: (i) => {
        const f = flight(carV(i), s);
        // uneven front/rear springs: a slow tumble while airborne, flattened by the landing
        const air = clamp(Math.min(s, ON + tLand) - OFF, 0, 6.5);
        const settle = f.landed ? Math.exp(-6 * f.after) : 1;
        // the springs extend first (the body jumps ~17 cm before the wheels leave)
        const jump = 0.17 * smoothstep(OFF, OFF + 0.25, s) * (f.landed ? 0 : 1);
        return { y: f.y + jump, pitch: (hash01(i, 2) - 0.5) * 0.08 * air * settle, roll: (hash01(i, 3) - 0.5) * 0.06 * air * settle };
      },
    });
    crowd.update(s, {
      stopAt: ON + 0.9,
      lookYaw: -Math.PI / 2,
      pose: (i) => {
        if (s < OFF) return null;
        const f = flight(0.08 + 0.22 * hash01(i, 4), s); // the last push of a step or a startled hop
        const air = clamp(Math.min(s, ON + 1) - OFF, 0, 6);
        const flail = f.landed ? 0 : 1;
        const stumble = f.landed ? 0.5 * Math.exp(-3 * f.after) * hash01(i, 6) : 0;
        return {
          y: f.y,
          pitch: (hash01(i, 5) - 0.5) * 0.25 * air * flail + stumble,
          roll: (hash01(i, 7) - 0.5) * 0.15 * air * flail,
          armsZ: (1.3 + 0.3 * Math.sin(s * 6 + i)) * flail,
          legsZ: 0.25 * flail,
        };
      },
    });
  };
}

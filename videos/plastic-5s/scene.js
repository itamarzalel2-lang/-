// What if all plastic disappeared for 5 seconds?
// Bumpers, cab signs and vinyl billboards vanish, and since ~57% of all fibre made is
// polyester, about half the crowd loses its jacket. Narration: ./script.json. Sources: ./sources.md
import * as THREE from 'three';
import { timesSquare } from '/engine/lib/city.js';
import { buildTraffic } from '/engine/lib/traffic.js';
import { buildCrowd } from '/engine/lib/crowd.js';
import { povPhone } from '/engine/lib/props.js';
import { cameraPath, handheld, shots, applyCamera } from '/engine/lib/camera.js';
import { smoothstep, hash01, remap, easeOutCubic } from '/engine/lib/util.js';

// simulation time
const GONE = 13.8;
const BACK = GONE + 5;
// story time
const PEOPLE = [18.5, 34.6]; // sim 14.0 .. 18.2, slowed down, looking at people and cars
const D = 41;
const simAt = remap([[0, 0], [PEOPLE[0], PEOPLE[0]], [PEOPLE[0], 14.0], [PEOPLE[1], 18.2], [PEOPLE[1], 18.2], [D, 18.2 + D - PEOPLE[1]]]);
const RETURN = PEOPLE[1] + (BACK - 18.2);

export const config = {
  fps: 30,
  duration: D,
  fov: 60,
  bloom: { strength: 0.45, radius: 0.5, threshold: 0.9 },
};

export const audio = [
  { type: 'ambience', from: 0, to: D, level: 0.9 },
  { type: 'crowd', from: 0, to: D, level: 1.0 },
  { type: 'whoosh', at: 3.9 },
  { type: 'tick', at: [11.2, 12.2, 13.2] },
  { type: 'riser', from: 11.5, to: GONE },
  { type: 'burst', at: GONE, gain: 0.6 },
  { type: 'whoosh', at: GONE - 0.1 },
  { type: 'crowd', from: GONE + 0.5, to: PEOPLE[0], level: 1.7 },
  { type: 'horns', from: GONE + 0.8, to: PEOPLE[0], count: 4 },
  { type: 'whoosh', at: PEOPLE[0] - 0.35 },
  { type: 'drone', from: PEOPLE[0], to: PEOPLE[1] },
  { type: 'whoosh', at: RETURN - 0.4 },
  { type: 'thump', at: RETURN },
];

export async function setup({ scene, camera, overlay }) {
  const city = timesSquare({ time: 'day', clear: [[2, 22, 18], [22, 1, 10]] });
  scene.add(city.group);
  scene.fog = city.fog;
  scene.fog.density = 0.0016;
  // vinyl ads are plastic; the LED screens stay (their housings are mostly metal and glass)
  const vinyl = city.billboards.filter((_, i) => hash01(i, 33) < 0.6);

  const traffic = buildTraffic({ lanes: city.lanes, queues: city.queues, count: city.carCount });
  scene.add(traffic.group);
  traffic.brake(GONE + 0.5);
  const crowd = buildCrowd({ zones: city.crowdZones, standZones: city.standZones, count: 440, standing: 46, stepHeight: city.stepHeight, avoid: [[2, 22, 3], [22, 2, 3.5], [21, 0.5, 3]] });
  scene.add(crowd.group);
  const poly = crowd.people.map((_, i) => hash01(i, 21) < 0.57); // whose jacket is polyester
  const tee = new THREE.Color('#f1f1ee');
  let undressed = null;

  // hero: a cab by the plaza, stopped near us, for the bumper close-up
  const lane = city.lanes.find((l) => l.corridor && l.c === -3.8);
  const inLane = traffic.cars.map((c, i) => [c, i]).filter(([c]) => c.lane === lane);
  const score = ([c]) => Math.abs(traffic.pose(c, 18).z - 4) + (c.cab ? 0 : 50);
  const hero = inLane.sort((a, b) => score(a) - score(b))[0][1];

  const phone = povPhone();
  camera.add(phone.group);

  const cam = shots([
    { id: 'aerial', to: 4.4, cam: cameraPath([
      { t: 0, pos: [8, 110, 150], look: [-6, 0, -40], fov: 52 },
      { t: 4.4, pos: [4, 8, 34], look: [-6, 8, -30], fov: 58 },
    ]) },
    { id: 'street', to: PEOPLE[0], cam: cameraPath([
      { t: 4.4, pos: [2, 1.7, 30], look: [-8, 7, -40], fov: 60 },
      { t: GONE, pos: [2, 1.7, 22], look: [-8, 9, -40], fov: 60 },
      { t: PEOPLE[0], pos: [2, 1.7, 21.5], look: [-6, 8, -40], fov: 60 },
    ]) },
    { id: 'people', to: 29.6, cam: cameraPath([
      { t: PEOPLE[0], pos: [22, 1.5, 2], look: [8, 2.0, -12], fov: 46 },
      { t: 29.6, pos: [21, 1.5, 0.5], look: [8, 2.0, -12], fov: 42 },
    ]) },
    { id: 'cars', to: PEOPLE[1], cam: (t) => {
      const p = traffic.pose(traffic.cars[hero], simAt(t));
      return { pos: new THREE.Vector3(p.x + 3.4, 1.25, p.z + 8.0 - 0.15 * (t - 29.6)), look: new THREE.Vector3(p.x - 0.2, 0.0, p.z + 1.4), fov: 40 };
    } },
    { id: 'rise', to: Infinity, cam: cameraPath([
      { t: PEOPLE[1], pos: [2, 1.7, 21.5], look: [-6, 8, -40], fov: 60 },
      { t: D, pos: [8, 50, 70], look: [-6, 0, -40], fov: 54 },
    ]) },
  ]);

  overlay.title('What if all <span class="hl">plastic</span> disappeared for 5 seconds?', { from: 0, fadeIn: 0, to: D + 1 });
  overlay.timer({
    from: 10.8, to: D - 3,
    label: (t) => { const s = simAt(t); return s < GONE ? 'Plastic vanishes in' : s < BACK ? 'No plastic for' : 'Plastic is back'; },
    value: (t) => { const s = simAt(t); return s < GONE ? `${(GONE - s).toFixed(1)}<small>s</small>` : s < BACK ? `${(s - GONE).toFixed(1)}<small>/ 5.0s</small>` : '5.0<small>s ✓</small>'; },
    mode: (t) => { const s = simAt(t); return s < GONE ? '' : s < BACK ? 'gone' : 'back'; },
  });
  overlay.add(Object.assign(document.createElement('div'), { className: 'ov-chip', innerHTML: '◀◀ REPLAY · <b>0.25×</b>' }), { from: PEOPLE[0], to: PEOPLE[1], fadeIn: 0.15, fadeOut: 0.15, enter: 'pop' });
  overlay.fact({
    kicker: 'Fact',
    text: '<span class="hl">57%</span> of all fiber made in 2023 was polyester. Polyester is plastic.',
    source: 'Textile Exchange, Materials Market Report 2024',
    from: 21.2, to: 29.4,
  });
  overlay.fact({
    kicker: 'Fact',
    text: 'Plastics are <span class="hl">~50%</span> of a new car’s volume, but under 10% of its weight.',
    source: 'American Chemistry Council, Chemistry and Automobiles (2023/2024)',
    from: 30.2, to: PEOPLE[1], top: 690,
  });
  const bumperTag = overlay.tag('Bumper: plastic', { from: 30.4, to: PEOPLE[1] - 0.1 });
  overlay.end('Comment what should <span class="hl">vanish</span> next', { from: 38.1, to: D + 1 });

  return function update(t) {
    const s = simAt(t);
    city.update(s);
    const gone = s >= GONE && s < BACK;
    for (const b of vinyl) b.visible = !gone;

    const c = cam(t);
    applyCamera(camera, c, handheld(t, { amp: c.id === 'street' ? 0.004 : 0.0015, kicks: [{ at: GONE, amp: 0.012, decay: 4 }] }));
    const up = c.id === 'street' ? smoothstep(4.6, 5.3, t) : 0;
    phone.group.visible = up > 0.001;
    phone.group.position.set(0.068, -0.168 - 0.2 * (1 - easeOutCubic(up)), -0.36);
    phone.group.rotation.set(-0.22, -0.18, -0.1);
    phone.setCase(gone ? 0 : 1);

    traffic.update(s, { ride: 0.33, tyreScale: 1, bumpers: !gone, signs: !gone });
    if (c.id === 'cars') {
      // ring where the front bumper was
      const p = traffic.pose(traffic.cars[hero], s);
      const v = new THREE.Vector3(p.x + Math.sin(p.yaw) * 2.3, 0.35, p.z + Math.cos(p.yaw) * 2.3);
      const dist = v.distanceTo(camera.position);
      v.project(camera);
      overlay.place(bumperTag, (v.x + 1) * 270, (1 - v.y) * 480, (0.55 / (dist * Math.tan((camera.fov * Math.PI) / 360))) * 480);
    }
    if (undressed !== gone) {
      crowd.people.forEach((p, i) => { if (poly[i]) crowd.outfit(i, gone ? { torso: tee, arms: p.skin } : {}); });
      undressed = gone;
    }
    crowd.update(s, {
      stopAt: GONE + 0.4,
      lookYaw: Math.PI / 2,
      // the ones who lost their jacket hug themselves
      pose: (i) => (poly[i] && gone ? { armsX: 1.1, armsZ: -0.5 * smoothstep(GONE + 0.3, GONE + 0.9, s) } : null),
    });
  };
}

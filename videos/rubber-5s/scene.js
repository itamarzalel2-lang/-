// What if all rubber disappeared for 5 seconds?
// Times Square, rush hour. At 5.0 s every gram of rubber vanishes for 5 seconds.
// Facts used on screen are listed with sources in ./sources.md.
import { timesSquare } from '/engine/lib/city.js';
import { buildTraffic } from '/engine/lib/traffic.js';
import { buildCrowd } from '/engine/lib/crowd.js';
import { ParticleLayer, emitRimSparks, emitSkidSmoke, emitAirBurst } from '/engine/lib/fx.js';
import { cameraPath, handheld, shots, follow } from '/engine/lib/camera.js';
import { povPhone } from '/engine/lib/props.js';
import { clamp, smoothstep, easeOutCubic, easeOutBack, hash01 } from '/engine/lib/util.js';

const GONE = 5.0; // rubber vanishes
const BACK = 10.0; // rubber returns (the air does not)
const D = 16.5;

export const config = {
  fps: 30,
  duration: D,
  fov: 60,
  bloom: { strength: 0.48, radius: 0.5, threshold: 0.88 },
  exposure: 0.95,
};

// Sound design, synthesised by engine/audio.mjs (no samples needed).
export const audio = [
  { type: 'ambience', from: 0, to: GONE + 0.05, level: 1 },
  { type: 'ambience', from: GONE, to: D, level: 0.45 },
  { type: 'tick', at: [1, 2, 3, 4] },
  { type: 'riser', from: 2.9, to: GONE },
  { type: 'burst', at: GONE },
  { type: 'grind', from: GONE + 0.05, to: GONE + 2.9 },
  { type: 'screech', from: GONE + 0.1, to: GONE + 1.8 },
  { type: 'whoosh', at: BACK - 0.35 },
  { type: 'thump', at: BACK },
  { type: 'hit', at: 10.95 },
  { type: 'horns', from: 11.2, to: D, count: 7 },
];

export async function setup({ THREE, scene, camera, overlay, renderer, H, dpr }) {
  // ---------------------------------------------------------------- world
  const city = timesSquare({ blocks: 36, billboards: 'lit', cars: 352, cabs: 'yellow', crowd: true, time: 'rush hour', clear: [[0.5, 30, 26]] });
  scene.add(city.group);
  scene.fog = city.fog;

  const traffic = buildTraffic({ lanes: city.lanes, queues: city.queues, count: city.carCount, cabShare: 0.42 });
  scene.add(traffic.group);
  traffic.brake(GONE); // no tyres -> every driver slams the brakes on bare rims

  const crowd = buildCrowd({ zones: city.crowdZones, standZones: city.standZones, count: 430, standing: 46, stepHeight: city.stepHeight });
  scene.add(crowd.group);

  const sparks = new ParticleLayer(30000, { additive: true, hardness: 2.4, minSize: 3 * dpr });
  const smoke = new ParticleLayer(9000, { additive: false, hardness: 1.1 });
  scene.add(sparks.points, smoke.points);

  const phone = povPhone();
  camera.add(phone.group);

  // soft key light for the wheel close-ups (storefront spill)
  const key = new THREE.PointLight('#ffe6c8', 0, 16, 1.4);
  const rim = new THREE.PointLight('#ff4fb0', 0, 16, 1.4);
  scene.add(key, rim);

  // ---------------------------------------------------------------- camera
  // Hero: a yellow cab in the lane nearest the plaza that will be right in front of
  // us when the rubber goes, with room ahead to skid to a natural stop.
  const POV = [0.5, 1.65, 30];
  const lane = city.lanes.find((l) => l.corridor && l.c === -3.8);
  const inLane = traffic.cars.map((c, i) => [c, i]).filter(([c]) => c.lane === lane);
  const score = ([c]) => Math.abs(traffic.pose(c, GONE).z - 6) + (c.cab ? 0 : 50) + (c.dStop < (c.v * c.v) / (2 * c.decel) - 0.01 ? 100 : 0);
  const hero = inLane.sort((x, y) => score(x) - score(y))[0][1];

  // The camera stays inside the open corridor (x -26..28), so it never clips a building.
  const cam = shots([
    { id: 'aerial', to: 4.6, cam: cameraPath([
      { t: 0, pos: [8, 118, 178], look: [-5, 0, -60], fov: 50 },
      { t: 1.9, pos: [7, 24, 78], look: [-7, 2, -52], fov: 55 },
      { t: 3.4, pos: POV, look: [-6, 1.5, -6], fov: 60 },
      { t: 4.6, pos: POV, look: [-6, 1.45, -3], fov: 60 },
    ]) },
    { id: 'wheel', to: 7.0, cam: follow(traffic, hero, { offset: (t) => [2.8, 0.62, 5.6 - 0.3 * (t - 4.6)], target: [0.7, 0.12, 1.0], fov: 40 }) },
    { id: 'street', to: 9.5, cam: cameraPath([
      { t: 7.0, pos: POV, look: [-6, 1.45, -3], fov: 60 },
      { t: 9.5, pos: [0.4, 1.65, 29.8], look: [-8, 1.3, 0], fov: 60 },
    ]) },
    { id: 'flat', to: 11.6, cam: (t) => follow(traffic, hero, {
      offset: [2.7 - 0.12 * (t - 9.5), 0.5, 4.4 - 0.35 * (t - 9.5)], target: [0.84, 0.08, 1.3], fov: 38,
    })(t) },
    { id: 'rise', to: Infinity, cam: cameraPath([
      { t: 11.6, pos: POV, look: [-6, 1.6, -20], fov: 60 },
      { t: 14.6, pos: [12, 44, 82], look: [-9, 0, -42], fov: 56 },
      { t: D, pos: [16, 56, 94], look: [-9, 0, -46], fov: 55 },
    ]) },
  ]);

  // ---------------------------------------------------------------- overlay
  overlay.title('What if all <span class="hl">rubber</span> disappeared for 5 seconds?', { from: 0, fadeIn: 0, to: D + 1 });
  overlay.fact({
    kicker: 'Rush hour · Times Square',
    text: '<span class="hl">~220,000</span> people walk through here on an average day.',
    source: 'Times Square Alliance pedestrian counts · 2024 average',
    from: 0.8, to: 3.3,
  });
  overlay.timer({
    from: 2.2, to: 12.5,
    label: (t) => (t < GONE ? 'Rubber disappears in' : t < BACK ? 'Rubber gone for' : 'Rubber is back'),
    value: (t) => (t < GONE ? `${(GONE - t).toFixed(1)}<small>s</small>` : t < BACK ? `${(t - GONE).toFixed(1)}<small>/ 5.0s</small>` : '5.0<small>s ✓</small>'),
    mode: (t) => (t < GONE ? '' : t < BACK ? 'gone' : 'back'),
  });
  overlay.flash(GONE, 0.22, 0.55);
  overlay.fact({
    kicker: 'Physics',
    text: 'Every car drops <span class="hl">~13 cm</span> onto bare steel rims.',
    source: 'Typical 215/60R16 tire: sidewall = 60% × 215 mm ≈ 129 mm',
    from: 5.35, to: 7.0, top: 690,
  });
  overlay.fact({
    kicker: 'Fact',
    text: 'A car tire is only <span class="hl">~41%</span> rubber. The rest: steel, fabric, fillers.',
    source: 'Continental Tires · tire compound breakdown',
    from: 7.25, to: 9.45,
  });
  overlay.caption('The rubber comes back.', { from: 10.15, to: 12.9, top: 600 });
  overlay.caption('The air <span class="hl">doesn’t.</span>', { from: 10.95, to: 12.9, top: 652 });
  overlay.counter({ label: 'Cars on flat tires', countTo: 352, countDur: 1.4, from: 12.6, to: D + 1 });
  overlay.fact({
    kicker: 'Fact',
    text: 'NYC has <span class="hl">13,587</span> yellow cabs. Every single one just got a flat.',
    source: 'NYC Taxi & Limousine Commission',
    from: 13.2, to: D + 1, top: 330,
  });
  const dropTag = overlay.tag('−13 cm', { from: 5.25, to: 6.95 });
  const flatTag = overlay.tag('0 PSI', { from: 10.35, to: 11.55 });
  overlay.end('Comment what should <span class="hl">vanish</span> next', { from: 14.8, to: D + 1 });

  // ---------------------------------------------------------------- per-frame
  const fall = (tau) => 0.5 * 9.81 * tau * tau; // 13 cm takes ~0.16 s
  const tLand = Math.sqrt((2 * 0.13) / 9.81);

  function wheelState(t) {
    if (t < GONE) return { ride: 0.33, tyreScale: 1, squashY: 1, squashZ: 1 };
    if (t < BACK) {
      const tau = t - GONE;
      const ride = tau < tLand ? 0.33 - fall(tau) : 0.2 + 0.03 * Math.exp(-7 * (tau - tLand)) * Math.abs(Math.sin(19 * (tau - tLand)));
      return { ride, tyreScale: 1 - smoothstep(GONE, GONE + 0.07, t), squashY: 1, squashZ: 1 };
    }
    // rubber is back, but the air escaped: every tyre is flat
    const u = clamp((t - BACK) / 0.14);
    // flat: the rim sits ~4 cm off the road on a squashed, bulging sidewall
    return { ride: 0.2 + 0.04 * easeOutCubic(u), tyreScale: easeOutBack(u), squashX: 1.04, squashY: 0.82, squashZ: 1.1, tyreDY: 0.03 };
  }
  // a little per-car body rock after the drop
  const bounce = (i, t) => {
    const tau = t - GONE;
    if (tau < tLand || t > BACK + 1) return 0;
    return 0.018 * Math.exp(-3.5 * (tau - tLand)) * Math.sin(11 * (tau - tLand) + hash01(i) * 6);
  };

  return function update(t) {
    city.update(t);

    // camera
    const c = cam(t);
    const onFoot = c.id === 'aerial' || c.id === 'street';
    const shake = handheld(t, { amp: onFoot ? 0.005 : 0.0025, kicks: [{ at: GONE, amp: 0.03, decay: 3.5 }, { at: BACK, amp: 0.01, decay: 5 }] });
    camera.position.copy(c.pos);
    camera.lookAt(c.look);
    camera.rotateX(shake.sy);
    camera.rotateY(shake.sx);
    camera.rotateZ(shake.roll);
    camera.fov = c.fov;
    camera.updateProjectionMatrix();
    const close = c.id === 'wheel' || c.id === 'flat';
    key.intensity = close ? 22 : 0;
    rim.intensity = close ? 18 : 0;
    key.position.set(c.pos.x + 1.0, 4.0, c.pos.z + 1.0);
    rim.position.set(c.look.x - 3, 1.5, c.look.z - 4);

    // hand + phone while we stand on the street; its case is rubber too
    const up = c.id === 'street' ? 1 : c.id === 'aerial' ? smoothstep(3.0, 3.6, t) : 0;
    phone.group.visible = up > 0.001;
    phone.group.position.set(0.068, -0.168 - 0.2 * (1 - easeOutCubic(up)), -0.36);
    phone.group.rotation.set(-0.22, -0.18, -0.1);
    phone.setCase(t < GONE ? 1 : t < BACK ? 1 - smoothstep(GONE, GONE + 0.07, t) : easeOutBack(clamp((t - BACK) / 0.14)));

    // traffic, people
    const w = wheelState(t);
    traffic.update(t, { ...w, bounce });
    const soles = t < GONE || t >= BACK ? 1 : 1 - smoothstep(GONE, GONE + 0.07, t);
    crowd.update(t, { stopAt: GONE + 0.12, lookYaw: -Math.PI / 2, soles, soleDrop: 0.025 });

    // pin the red ring on the hero's front-left wheel
    if (close) {
      const wc = traffic.contact(hero, 1, t);
      const p = new THREE.Vector3(wc.x, w.ride, wc.z);
      const dist = p.distanceTo(camera.position);
      p.project(camera);
      const r = (0.3 / (dist * Math.tan((camera.fov * Math.PI) / 360))) * 480;
      for (const el of [dropTag, flatTag]) overlay.place(el, (p.x + 1) * 270, (1 - p.y) * 480, r);
    }

    // particles
    const camPos = camera.position;
    sparks.setView(H * dpr, camera.fov);
    smoke.setView(H * dpr, camera.fov);
    sparks.begin();
    smoke.begin();
    emitRimSparks(sparks, traffic, t, { cam: camPos, radius: 120 });
    emitSkidSmoke(smoke, traffic, t, { cam: camPos, radius: 100 });
    emitAirBurst(smoke, traffic, t, GONE, { cam: camPos, radius: 90 });
    sparks.end();
    smoke.end();
  };
}

// Instanced traffic. Every car's position is an analytic function of time, so any
// frame can be rendered on its own (and in parallel).
//
// Car local frame: +z forward, y = 0 at the wheel centre. The instance y is the
// "ride height" (wheel-centre height above the road): 0.33 m on tyres, 0.20 m on
// bare rims.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, clamp, smoothstep, pick } from './util.js';

export const CAR = { length: 4.5, width: 1.85, tyreR: 0.33, rimR: 0.2, tyreW: 0.22, track: 0.84, axle: 1.38 };
export const WHEELS = [[-CAR.track, CAR.axle], [CAR.track, CAR.axle], [-CAR.track, -CAR.axle], [CAR.track, -CAR.axle]];

function part(w, h, d, x, y, z, shade) {
  const g = new THREE.BoxGeometry(w, h, d).translate(x, y, z).toNonIndexed();
  const n = g.attributes.position.count;
  g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(n * 3).fill(shade), 3));
  g.deleteAttribute('uv');
  return g;
}

function carGeometry() {
  // shade 1 = takes the instance (paint) colour; low shades = glass / trim
  return mergeGeometries([
    part(1.85, 0.62, 4.5, 0, 0.24, 0, 1), // body
    part(1.62, 0.5, 2.35, 0, 0.8, -0.25, 0.07), // glass cabin
    part(1.56, 0.07, 2.15, 0, 1.08, -0.3, 1), // roof
    part(1.9, 0.22, 0.18, 0, 0.02, 2.3, 0.18), // front bumper
    part(1.9, 0.22, 0.18, 0, 0.02, -2.3, 0.18), // rear bumper
    part(1.87, 0.12, 1.0, 0, -0.04, 1.38, 0.1), // wheel-arch shadow band
    part(1.87, 0.12, 1.0, 0, -0.04, -1.38, 0.1),
  ]);
}

const PAINT = ['#f2f2f4', '#15161c', '#9aa0aa', '#5a6070', '#1f3a7a', '#a8202a', '#5b1c2c', '#cfd3da', '#2e4d3b', '#c46d1d'];
const CAB = '#f7c600';

export function buildTraffic({ lanes, queues, count = 352, cabShare = 0.4, seed = 11 }) {
  const r = rng(seed);
  const cars = [];
  // distribute: queues first (4 per queue), then the square's lanes, then the rest
  const perQueue = Math.min(4, Math.floor(count / Math.max(1, queues.length) / 3));
  for (const q of queues) {
    for (let k = 0; k < perQueue; k++) {
      cars.push({ lane: q, moving: false, s0: q.front - q.dir * (k * 6.6 + r() * 0.8), v: 0 });
    }
  }
  const remaining = count - cars.length;
  const corridor = lanes.filter((l) => l.corridor), others = lanes.filter((l) => !l.corridor);
  const nCorr = Math.round(remaining * 0.72);
  const spread = (ls, n) => ls.map((l, i) => Math.floor(n / ls.length) + (i < n % ls.length ? 1 : 0));
  const place = (ls, n) => {
    spread(ls, n).forEach((m, i) => {
      const l = ls[i], L = l.range[1] - l.range[0], gap = L / Math.max(1, m);
      const phase = r() * gap;
      for (let k = 0; k < m; k++) {
        cars.push({ lane: l, moving: true, s0: l.range[0] + phase + k * gap + (r() - 0.5) * Math.min(3.4, gap - 7), v: l.speed });
      }
    });
  };
  place(corridor, nCorr);
  place(others, remaining - nCorr);
  for (const c of cars) {
    c.cab = r() < cabShare;
    c.color = new THREE.Color(c.cab ? CAB : pick(r, PAINT));
    c.yawJ = (r() - 0.5) * 0.22;
    c.latJ = (r() - 0.5) * 0.5;
    c.decel = 2.6 + r() * 1.0;
    c.spin0 = r() * 6;
  }

  // ---------- meshes ----------
  const N = cars.length;
  const bodies = new THREE.InstancedMesh(carGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.25 }), N);
  const tyres = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(CAR.tyreR, CAR.tyreR, CAR.tyreW, 18).rotateZ(Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.95 }), N * 4,
  );
  const rims = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(CAR.rimR, CAR.rimR, CAR.tyreW + 0.03, 10).rotateZ(Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: '#c9ccd6', roughness: 0.3, metalness: 0.8 }), N * 4,
  );
  const cabCount = cars.filter((c) => c.cab).length;
  const signs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 0.24, 0.22), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.35, 0.8), toneMapped: false }), cabCount);
  const lightGeo = new THREE.BoxGeometry(0.34, 0.13, 0.05);
  const heads = new THREE.InstancedMesh(lightGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.1, 1.7), toneMapped: false }), N * 2);
  const tails = new THREE.InstancedMesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), N * 2);
  cars.forEach((c, i) => bodies.setColorAt(i, c.color));
  for (const m of [bodies, tyres, rims, signs, heads, tails]) m.frustumCulled = false;
  const group = new THREE.Group();
  group.add(bodies, tyres, rims, signs, heads, tails);

  // ---------- motion ----------
  let brakeAt = Infinity;
  const wrap = (l, s) => {
    const L = l.range[1] - l.range[0];
    return l.range[0] + ((((s - l.range[0]) % L) + L) % L);
  };
  const along = (c, t) => wrap(c.lane, c.s0 + c.lane.dir * c.v * t);

  // Everyone brakes at `at`. Stopping distances are capped per lane so nobody
  // rear-ends the car in front (identical spacing logic to a real queue).
  function brake(at) {
    brakeAt = at;
    const byLane = new Map();
    for (const c of cars) {
      if (!c.moving) continue;
      c.sB = along(c, at);
      if (!byLane.has(c.lane)) byLane.set(c.lane, []);
      byLane.get(c.lane).push(c);
    }
    for (const [lane, list] of byLane) {
      list.sort((a, b) => lane.dir * (b.sB - a.sB)); // front-most first
      let frontStop = Infinity;
      for (const c of list) {
        let d = (c.v * c.v) / (2 * c.decel);
        const room = lane.dir * (frontStop - c.sB) - (CAR.length + 0.9);
        if (room < d) d = Math.max(0.3, room);
        c.dStop = d;
        c.a = (c.v * c.v) / (2 * d);
        c.T = (2 * d) / c.v;
        frontStop = c.sB + lane.dir * d;
      }
    }
  }

  // Position along the lane, speed, and how far into the skid (0..1).
  function stateAt(c, t) {
    if (!c.moving) return { s: c.s0, speed: 0, skid: 0, dist: 0 };
    if (t <= brakeAt) return { s: along(c, t), speed: c.v, skid: 0, dist: c.v * t };
    const tau = Math.min(t - brakeAt, c.T);
    const d = c.v * tau - 0.5 * c.a * tau * tau;
    return { s: c.sB + c.lane.dir * d, speed: c.v - c.a * tau, skid: tau / c.T, dist: c.v * brakeAt + d };
  }

  const _m = new THREE.Matrix4(), _base = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
  const _v = new THREE.Vector3(), _s = new THREE.Vector3(), _o = new THREE.Matrix4(), _r = new THREE.Matrix4(), _sq = new THREE.Matrix4();
  const brakeRed = new THREE.Color(2.6, 0.12, 0.12), idleRed = new THREE.Color(1.2, 0.05, 0.06);

  // World transform of car i at time t (without ride height).
  function pose(c, t) {
    const st = stateAt(c, t);
    const l = c.lane;
    const k = smoothstep(0, 1, st.skid);
    const lat = c.latJ * k;
    let yaw = l.axis === 'z' ? (l.dir > 0 ? 0 : Math.PI) : (l.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    yaw += c.yawJ * k;
    const x = l.axis === 'z' ? l.c + lat : st.s;
    const z = l.axis === 'z' ? st.s : l.c + lat;
    return { x, z, yaw, ...st };
  }

  /**
   * wheel: { ride, tyreScale, squashX?, squashY, squashZ, tyreDY?, bounce?(i, t) }
   *   ride = wheel-centre height; squash/tyreDY deform the tyre (e.g. a flat one)
   */
  function update(t, wheel) {
    let si = 0;
    for (let i = 0; i < N; i++) {
      const c = cars[i];
      const p = pose(c, t);
      const y = wheel.ride + (wheel.bounce ? wheel.bounce(i, t) : 0);
      _e.set(0, p.yaw, 0);
      _q.setFromEuler(_e);
      _base.compose(_v.set(p.x, y, p.z), _q, _s.set(1, 1, 1));
      bodies.setMatrixAt(i, _base);
      if (c.cab) signs.setMatrixAt(si++, _m.makeTranslation(0, 1.24, -0.3).premultiply(_base));
      for (let k = 0; k < 2; k++) {
        const x = k ? 0.6 : -0.6;
        heads.setMatrixAt(i * 2 + k, _m.makeTranslation(x, 0.36, 2.26).premultiply(_base));
        tails.setMatrixAt(i * 2 + k, _m.makeTranslation(x, 0.4, -2.26).premultiply(_base));
        tails.setColorAt(i * 2 + k, t > brakeAt ? brakeRed : idleRed); // everyone stands on the brake
      }
      // wheels: roll with distance travelled on whatever is touching the road
      const spin = c.spin0 + p.dist / (wheel.tyreScale > 0.5 ? CAR.tyreR : CAR.rimR);
      for (let w = 0; w < 4; w++) {
        const [wx, wz] = WHEELS[w];
        _r.makeRotationX(spin);
        _o.makeTranslation(wx, 0, wz).premultiply(_base);
        rims.setMatrixAt(i * 4 + w, _m.copy(_o).multiply(_r));
        const ts = wheel.tyreScale;
        _sq.makeScale(ts * (wheel.squashX ?? 1), ts * wheel.squashY, ts * wheel.squashZ).setPosition(0, wheel.tyreDY ?? 0, 0);
        tyres.setMatrixAt(i * 4 + w, _m.copy(_o).multiply(_sq).multiply(_r));
      }
    }
    for (const m of [bodies, tyres, rims, signs, heads]) m.instanceMatrix.needsUpdate = true;
    tails.instanceMatrix.needsUpdate = true;
    tails.instanceColor.needsUpdate = true;
    tyres.visible = wheel.tyreScale > 0.001;
  }

  // World position of wheel w's contact patch at time t.
  function contact(i, w, t) {
    const c = cars[i];
    const p = pose(c, t);
    const [wx, wz] = WHEELS[w];
    const cs = Math.cos(p.yaw), sn = Math.sin(p.yaw);
    return { x: p.x + wx * cs + wz * sn, y: 0.02, z: p.z - wx * sn + wz * cs, speed: p.speed, yaw: p.yaw };
  }

  return { group, cars, count: N, brake, update, pose, contact, get brakeAt() { return brakeAt; } };
}

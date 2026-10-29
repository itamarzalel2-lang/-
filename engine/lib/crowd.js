// Blocky pedestrians (instanced). Walkers pace back and forth inside zones; the
// scene can make everyone stop and turn to look at something.
import * as THREE from 'three';
import { rng, pick, clamp, smoothstep, lerpAngle } from './util.js';

const JACKETS = ['#f2c230', '#e0483e', '#2f6fdf', '#3cc77a', '#f4f4f6', '#1c1d24', '#8a4fd8', '#ff8a3d', '#5bc0eb', '#c2185b', '#6d7a8c'];
const PANTS = ['#1d2433', '#22252e', '#3b4a6b', '#6b5b45', '#2d2d2d', '#4a5568'];
const SKIN = ['#f1c7a3', '#d9a07a', '#b97b52', '#8d5a3b', '#5f3b26', '#e8b48e'];
const HAIR = ['#1b1410', '#3a2618', '#6b4423', '#c9a15a', '#0e0e10', '#7d7d85'];

function box(w, h, d, y) {
  return new THREE.BoxGeometry(w, h, d).translate(0, y, 0);
}

export function buildCrowd({ zones, standZones = [], count = 420, standing = 40, seed = 5, stepHeight = () => 0 }) {
  const r = rng(seed);
  const total = zones.reduce((a, z) => a + z.weight, 0);
  const people = [];
  for (let i = 0; i < count; i++) {
    let u = r() * total, zone = zones[0];
    for (const z of zones) { if ((u -= z.weight) <= 0) { zone = z; break; } }
    people.push({
      x: zone.x[0] + r() * (zone.x[1] - zone.x[0]),
      range: zone.z, v: 1.0 + r() * 0.6, off: r() * 400, stand: false,
    });
  }
  for (let i = 0; i < standing; i++) {
    const z = pick(r, standZones);
    if (!z) break;
    people.push({ x: z.x[0] + r() * (z.x[1] - z.x[0]), z: z.z[0] + r() * (z.z[1] - z.z[0]), stand: true, v: 0, yaw0: (r() - 0.5) * 0.8 });
  }
  for (const p of people) {
    p.scale = 0.9 + r() * 0.18;
    p.jacket = new THREE.Color(pick(r, JACKETS));
    p.pants = new THREE.Color(pick(r, PANTS));
    p.skin = new THREE.Color(pick(r, SKIN));
    p.hair = new THREE.Color(pick(r, HAIR));
    p.react = 0.1 + r() * 0.8; // reaction delay
    p.jump = r() < 0.45;
    p.sway = r() * 6;
  }

  const N = people.length;
  const std = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 });
  const mk = (geo, n, mat = std('#ffffff')) => {
    const m = new THREE.InstancedMesh(geo, mat, n);
    m.frustumCulled = false;
    return m;
  };
  const torso = mk(box(0.46, 0.6, 0.26, 0), N);
  const head = mk(box(0.26, 0.26, 0.26, 0), N);
  const hair = mk(box(0.28, 0.08, 0.28, 0), N);
  const legs = mk(box(0.17, 0.8, 0.2, -0.4), N * 2);
  const arms = mk(box(0.12, 0.56, 0.14, -0.28), N * 2);
  const shoes = mk(box(0.19, 0.06, 0.29, 0.03), N * 2, std('#f4f4f6'));
  people.forEach((p, i) => {
    torso.setColorAt(i, p.jacket);
    head.setColorAt(i, p.skin);
    hair.setColorAt(i, p.hair);
    for (let k = 0; k < 2; k++) {
      legs.setColorAt(i * 2 + k, p.pants);
      arms.setColorAt(i * 2 + k, p.jacket);
    }
  });
  const group = new THREE.Group();
  group.add(torso, head, hair, legs, arms, shoes);

  const _b = new THREE.Matrix4(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
  const _v = new THREE.Vector3(), _s = new THREE.Vector3(), _r = new THREE.Matrix4();

  /**
   * opts: { stopAt, lookYaw, soles (0..1 visible), soleDrop (m) }
   * After stopAt everyone slows to a halt, some flinch, and all turn to lookYaw.
   */
  function update(t, opts = {}) {
    const stopAt = opts.stopAt ?? Infinity;
    const soles = opts.soles ?? 1;
    const drop = (1 - soles) * (opts.soleDrop ?? 0.03);
    for (let i = 0; i < N; i++) {
      const p = people[i];
      let x = p.x, z, yaw, walk;
      if (p.stand) {
        z = p.z;
        yaw = p.yaw0;
        walk = 0;
      } else {
        const L = p.range[1] - p.range[0];
        const tt = Math.min(t, stopAt);
        let d = p.off + p.v * tt;
        if (t > stopAt) { const tau = Math.min(t - stopAt, 0.7); d += p.v * tau - (p.v * tau * tau) / 1.4; }
        const u = ((d % (2 * L)) + 2 * L) % (2 * L);
        const fwd = u < L;
        z = p.range[0] + (fwd ? u : 2 * L - u);
        yaw = fwd ? 0 : Math.PI;
        walk = t > stopAt ? clamp(1 - (t - stopAt) / 0.7) : 1;
        x += Math.sin(d * 0.35 + p.sway) * 0.12;
        p.d = d;
      }
      let hop = 0;
      if (t > stopAt) {
        const k = smoothstep(stopAt + p.react, stopAt + p.react + 0.7, t);
        yaw = lerpAngle(yaw, opts.lookYaw ?? yaw, k);
        if (p.jump) hop = 0.14 * Math.sin(Math.PI * clamp((t - stopAt - p.react * 0.3) / 0.35));
      }
      const phase = p.stand ? 0 : (p.d / 0.72) * Math.PI;
      const swing = Math.sin(phase) * 0.55 * walk;
      const bob = Math.abs(Math.sin(phase)) * 0.035 * walk;
      const y0 = (p.stand ? stepHeight(z) : 0.15) + bob + hop - drop;
      _e.set(0, yaw, 0);
      _q.setFromEuler(_e);
      _b.compose(_v.set(x, y0, z), _q, _s.setScalar(p.scale));
      const at = (mesh, idx, tx, ty, tz, rx = 0) => {
        _m.makeTranslation(tx, ty, tz).premultiply(_b);
        if (rx) _m.multiply(_r.makeRotationX(rx));
        mesh.setMatrixAt(idx, _m);
      };
      at(torso, i, 0, 1.16, 0);
      at(head, i, 0, 1.61, 0);
      at(hair, i, 0, 1.76, -0.01);
      for (let k = 0; k < 2; k++) {
        const sgn = k ? 1 : -1;
        at(legs, i * 2 + k, sgn * 0.11, 0.86, 0, sgn * swing);
        at(arms, i * 2 + k, sgn * 0.3, 1.42, 0, -sgn * swing * 0.8);
        // shoe follows the foot of the swinging leg
        const fy = 0.86 - 0.8 * Math.cos(swing), fz = -0.8 * Math.sin(sgn * swing);
        _m.makeTranslation(sgn * 0.11, fy - 0.06, fz + 0.04).premultiply(_b);
        _m.multiply(_r.makeScale(soles, soles, soles));
        shoes.setMatrixAt(i * 2 + k, _m);
      }
    }
    for (const m of [torso, head, hair, legs, arms, shoes]) m.instanceMatrix.needsUpdate = true;
    shoes.visible = soles > 0.001;
  }

  return { group, people, update };
}

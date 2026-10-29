// Keyframed camera moves. Each coordinate (position, look-at target, fov) is
// interpolated with a monotone cubic (PCHIP) over time: smooth, starts and ends at
// rest, and never overshoots a keyframe, so the camera can't dip through the ground
// between two street-level keys. To hold still, repeat a key at a later time.
import * as THREE from 'three';
import { wobble } from './util.js';

function pchip(ts, ys) {
  const n = ts.length;
  const h = [], d = [];
  for (let i = 0; i < n - 1; i++) { h.push(ts[i + 1] - ts[i]); d.push((ys[i + 1] - ys[i]) / h[i]); }
  const m = new Array(n).fill(0); // slopes in units per second; 0 at both ends
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] > 0) {
      const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  }
  return (t) => {
    if (t <= ts[0]) return ys[0];
    if (t >= ts[n - 1]) return ys[n - 1];
    let i = 0;
    while (t > ts[i + 1]) i++;
    const u = (t - ts[i]) / h[i], u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h[i] * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h[i] * m[i + 1];
  };
}

/**
 * keys: [{ t, pos: [x,y,z], look: [x,y,z], fov? }]
 * returns (t) => { pos: Vector3, look: Vector3, fov }
 */
export function cameraPath(keys) {
  const ts = keys.map((k) => k.t);
  const f = (get) => pchip(ts, keys.map(get));
  const px = f((k) => k.pos[0]), py = f((k) => k.pos[1]), pz = f((k) => k.pos[2]);
  const lx = f((k) => k.look[0]), ly = f((k) => k.look[1]), lz = f((k) => k.look[2]);
  let last = 60;
  const fov = f((k) => (last = k.fov ?? last));
  return (t) => ({ pos: new THREE.Vector3(px(t), py(t), pz(t)), look: new THREE.Vector3(lx(t), ly(t), lz(t)), fov: fov(t) });
}

/** Handheld drift plus a decaying shake kick at `kicks` times: [{ at, amp, decay }]. */
export function handheld(t, { amp = 0.012, kicks = [] } = {}) {
  let sx = wobble(t * 0.9, 1) * amp, sy = wobble(t * 0.8, 2) * amp, roll = wobble(t * 0.6, 3) * amp * 0.6;
  for (const k of kicks) {
    const age = t - k.at;
    if (age < 0) continue;
    const e = k.amp * Math.exp(-age * (k.decay ?? 5));
    sx += Math.sin(age * 61) * e;
    sy += Math.sin(age * 47 + 1) * e * 1.3;
    roll += Math.sin(age * 37 + 2) * e * 0.5;
  }
  return { sx, sy, roll };
}

/**
 * Hard cuts between shots: [{ id, to, cam: (t) => { pos, look, fov } }], in order.
 * The last shot runs until the end.
 */
export function shots(list) {
  return (t) => {
    const s = list.find((x) => t < x.to) ?? list[list.length - 1];
    return { ...s.cam(t), id: s.id };
  };
}

/**
 * Camera riding alongside traffic car i (wheel-level chase cam). offset/target are in
 * the car's local frame (+z forward, +x = the car's left); y values are world heights,
 * so when the car drops on its rims the camera does not drop with it.
 */
export function follow(traffic, i, { offset = [2.4, 0.5, 2.6], target = [0.84, 0.22, 1.38], fov = 50, at } = {}) {
  const c = traffic.cars[i];
  const world = (p, [ox, oy, oz]) => {
    const cs = Math.cos(p.yaw), sn = Math.sin(p.yaw);
    return new THREE.Vector3(p.x + ox * cs + oz * sn, oy, p.z - ox * sn + oz * cs);
  };
  return (t) => {
    const p = traffic.pose(c, at ?? t);
    const off = typeof offset === 'function' ? offset(t) : offset;
    return { pos: world(p, off), look: world(p, target), fov };
  };
}

/** Put the camera at a cameraPath/shots sample, plus an optional handheld() shake and roll. */
export function applyCamera(camera, c, shake = null, roll = 0) {
  camera.position.copy(c.pos);
  camera.lookAt(c.look);
  if (shake) {
    camera.rotateX(shake.sy);
    camera.rotateY(shake.sx);
    camera.rotateZ(shake.roll);
  }
  if (roll) camera.rotateZ(roll);
  camera.fov = c.fov;
  camera.updateProjectionMatrix();
}

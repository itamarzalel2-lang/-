// Particle effects. Particles are not simulated step by step: each one is a closed-form
// function of (birth time, age, seed), so frames stay independent of each other.
import * as THREE from 'three';
import { hash01, clamp } from './util.js';

const VERT = /* glsl */ `
  attribute float size;
  attribute float alpha;
  attribute vec3 tint;
  uniform float scale;
  uniform float minSize;
  varying float vAlpha;
  varying vec3 vTint;
  void main() {
    vAlpha = alpha;
    vTint = tint;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = max(minSize, size * scale / max(0.1, -mv.z));
    gl_Position = projectionMatrix * mv;
  }`;
const FRAG = /* glsl */ `
  uniform float hardness;
  varying float vAlpha;
  varying vec3 vTint;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = pow(clamp(1.0 - d, 0.0, 1.0), hardness) * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vTint, a);
  }`;

export class ParticleLayer {
  constructor(max, { additive = false, hardness = 1.5, minSize = 0 } = {}) {
    this.max = max;
    this.n = 0;
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.size = new Float32Array(max);
    this.alpha = new Float32Array(max);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('tint', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      uniforms: { scale: { value: 800 }, hardness: { value: hardness }, minSize: { value: minSize } },
      transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, this.material);
    this.points.frustumCulled = false;
  }
  // call once per frame with renderer height in px and camera fov
  setView(heightPx, fovDeg) {
    this.material.uniforms.scale.value = heightPx / (2 * Math.tan((fovDeg * Math.PI) / 360));
  }
  begin() { this.n = 0; }
  push(x, y, z, r, g, b, size, alpha) {
    if (this.n >= this.max) return;
    const i = this.n++;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.col[i * 3] = r; this.col[i * 3 + 1] = g; this.col[i * 3 + 2] = b;
    this.size[i] = size;
    this.alpha[i] = alpha;
  }
  end() {
    const g = this.points.geometry;
    for (const k of ['position', 'tint', 'size', 'alpha']) g.attributes[k].needsUpdate = true;
    g.setDrawRange(0, this.n);
  }
}

const near = (traffic, i, cam, radius) => {
  const p = traffic.pose(traffic.cars[i], traffic.brakeAt);
  return (p.x - cam.x) ** 2 + (p.z - cam.z) ** 2 < radius * radius;
};

/**
 * Sparks from bare rims grinding on asphalt while each car skids to a stop.
 * Emission rate scales with the car's speed at the moment of birth.
 */
export function emitRimSparks(layer, traffic, t, { cam, radius = 110, rate = 120, nearRate = 320, life = 0.4 } = {}) {
  const t0 = traffic.brakeAt;
  if (!(t > t0)) return;
  for (let i = 0; i < traffic.count; i++) {
    const c = traffic.cars[i];
    if (!c.moving || t > t0 + c.T + life || !near(traffic, i, cam, radius)) continue;
    const r = near(traffic, i, cam, 15) ? nearRate : rate; // dense spray for close-ups
    const kMax = Math.floor((Math.min(t, t0 + c.T) - t0) * r);
    const kMin = Math.max(0, Math.ceil((t - life - t0) * r));
    for (let w = 0; w < 4; w++) {
      for (let k = kMin; k <= kMax; k++) {
        const tb = t0 + k / r;
        const age = t - tb;
        if (age < 0 || age > life) continue;
        const h1 = hash01(i, w, k, 1), h2 = hash01(i, w, k, 2), h3 = hash01(i, w, k, 3);
        const ct = traffic.contact(i, w, tb);
        if (h1 > ct.speed / Math.max(0.01, c.v) + 0.05) continue;
        const fx = Math.sin(ct.yaw), fz = Math.cos(ct.yaw);
        const back = -(1.5 + h2 * 4.5), side = (h3 - 0.5) * 5, up = 0.8 + hash01(i, w, k, 4) * 3.2;
        const vx = fx * back + fz * side, vz = fz * back - fx * side;
        const x = ct.x + vx * age, z = ct.z + vz * age;
        const y = Math.max(0.03, ct.y + up * age - 4.9 * age * age);
        const u = age / life;
        layer.push(x, y, z, 4.2, 2.8 - u * 1.8, 1.1 - u * 1.0, 0.035 + 0.03 * (1 - u), 1 - u * u);
      }
    }
  }
}

/** Grey grit/smoke behind the rear wheels while skidding, lingering afterwards. */
export function emitSkidSmoke(layer, traffic, t, { cam, radius = 90, rate = 6, life = 2.6 } = {}) {
  const t0 = traffic.brakeAt;
  if (!(t > t0)) return;
  for (let i = 0; i < traffic.count; i++) {
    const c = traffic.cars[i];
    if (!c.moving || t > t0 + c.T + life || !near(traffic, i, cam, radius)) continue;
    const kMax = Math.floor((Math.min(t, t0 + c.T) - t0) * rate);
    const kMin = Math.max(0, Math.ceil((t - life - t0) * rate));
    for (const w of [2, 3]) {
      for (let k = kMin; k <= kMax; k++) {
        const tb = t0 + k / rate, age = t - tb;
        if (age < 0 || age > life) continue;
        const ct = traffic.contact(i, w, tb);
        const h = hash01(i, w, k, 9), h2 = hash01(i, w, k, 10);
        const u = age / life;
        const x = ct.x + (h - 0.5) * 0.8 * age, z = ct.z + (h2 - 0.5) * 0.8 * age;
        const y = 0.25 + age * (0.35 + h * 0.3);
        const a = 0.55 * Math.sin(Math.PI * Math.min(1, u * 1.6 + 0.08)) * (1 - u);
        const g = 0.62 + h * 0.15;
        layer.push(x, y, z, g, g * 0.97, g * 1.05, 0.7 + age * 1.1, a);
      }
    }
  }
}

/** The instant the tyres vanish: the trapped air bursts out of every wheel. */
export function emitAirBurst(layer, traffic, t, at, { cam, radius = 100, life = 0.75, per = 9 } = {}) {
  const age = t - at;
  if (age < 0 || age > life) return;
  const u = age / life;
  for (let i = 0; i < traffic.count; i++) {
    if (!near(traffic, i, cam, radius)) continue;
    for (let w = 0; w < 4; w++) {
      const ct = traffic.contact(i, w, at);
      for (let k = 0; k < per; k++) {
        const ang = (k / per) * Math.PI * 2 + hash01(i, w, k) * 0.6;
        const sp = 2.2 + hash01(i, w, k, 5) * 2.5;
        const dist = sp * (1 - Math.exp(-age * 4)) / 4 * 3;
        const fx = Math.cos(ct.yaw), fz = -Math.sin(ct.yaw); // car's lateral axis
        const lat = Math.cos(ang) * 0.3;
        const x = ct.x + Math.sin(ang) * dist * Math.sin(ct.yaw) + lat * fx;
        const z = ct.z + Math.sin(ang) * dist * Math.cos(ct.yaw) + lat * fz;
        const y = 0.3 + Math.max(-0.25, Math.cos(ang)) * dist * 0.6;
        layer.push(x, y, z, 0.85, 0.88, 0.95, 0.25 + u * 0.6, 0.28 * (1 - u) * (1 - u));
      }
    }
  }
}

/** Short white pulse across the whole frame (used for the 'vanish' beat). */
export function flashAmount(t, at, dur = 0.18) {
  const u = (t - at) / dur;
  return u < 0 || u > 1 ? 0 : Math.pow(1 - u, 2);
}

export { clamp };

/** Rain streaks (line segments) in a box around `center`; drop positions are a function of t. */
export class Rain {
  constructor(count = 6000, { box = [70, 45, 90], color = '#cfe0ff', opacity = 0.45, length = 1.1 } = {}) {
    this.count = count;
    this.box = box;
    this.length = length;
    this.pos = new Float32Array(count * 6);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
    this.lines.frustumCulled = false;
  }
  /** amount 0..1 = share of drops falling; floor = water/ground height where drops end */
  update(t, { center, speed = 11, amount = 1, wind = 1.2, floor = 0 }) {
    const [bx, by, bz] = this.box;
    let n = 0;
    for (let i = 0; i < this.count; i++) {
      if (hash01(i, 77) > amount) continue;
      const x = center.x + (hash01(i, 1) - 0.5) * bx, z = center.z + (hash01(i, 2) - 0.5) * bz;
      const y = floor + by - ((hash01(i, 3) * by + speed * t) % by);
      const o = n++ * 6;
      this.pos[o] = x; this.pos[o + 1] = y; this.pos[o + 2] = z;
      this.pos[o + 3] = x - wind * 0.1; this.pos[o + 4] = y + this.length; this.pos[o + 5] = z;
    }
    const g = this.lines.geometry;
    g.attributes.position.needsUpdate = true;
    g.setDrawRange(0, n * 2);
    this.lines.visible = n > 0;
  }
}

function rippleNormalMap(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const h = (x, y) => {
    const u = (x / size) * Math.PI * 2, v = (y / size) * Math.PI * 2;
    return Math.sin(u * 3 + v * 2) * 0.5 + Math.sin(u * 7 - v * 5 + 1.3) * 0.25 + Math.sin(u * 13 + v * 11 + 0.7) * 0.12 + Math.sin(-u * 5 + v * 17) * 0.1;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = h(x + 1, y) - h(x - 1, y), dy = h(x, y + 1) - h(x, y - 1);
      const nx = -dx * 2.2, ny = -dy * 2.2, nz = 1, l = Math.hypot(nx, ny, nz);
      const k = (y * size + x) * 4;
      img.data[k] = ((nx / l) * 0.5 + 0.5) * 255;
      img.data[k + 1] = ((ny / l) * 0.5 + 0.5) * 255;
      img.data[k + 2] = ((nz / l) * 0.5 + 0.5) * 255;
      img.data[k + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** A flood surface: set .mesh.position.y for the level and call update(t) to move the ripples. */
export function water({ size = [700, 900], center = [0, -40], color = '#2b5d7e', opacity = 0.82 } = {}) {
  const normalMap = rippleNormalMap();
  normalMap.repeat.set(size[0] / 9, size[1] / 9);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size[0], size[1]).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color, roughness: 0.12, metalness: 0.15, transparent: true, opacity, normalMap, normalScale: new THREE.Vector2(0.45, 0.45), depthWrite: false }),
  );
  mesh.position.set(center[0], -1, center[1]);
  mesh.renderOrder = 2;
  return {
    mesh,
    update(t) { normalMap.offset.set(t * 0.035, t * 0.05); },
  };
}

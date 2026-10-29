// Deterministic helpers. Every frame must be a pure function of time, so nothing here
// uses Math.random(): the same t always renders the same image, in any order.

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Stateless hash of integers -> [0, 1). Used for per-particle randomness.
export function hash01(...ints) {
  let h = 2166136261;
  for (const i of ints) {
    h ^= i | 0;
    h = Math.imul(h, 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return (h >>> 0) / 4294967296;
}

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const smoothstep = (a, b, x) => {
  const u = clamp((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
export const easeInOutCubic = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOutCubic = (u) => 1 - Math.pow(1 - u, 3);
export const easeInCubic = (u) => u * u * u;
export const easeOutBack = (u) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};
export const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];

// Smooth pseudo-noise from a few incommensurate sines (deterministic "handheld" motion).
export function wobble(t, seed = 0) {
  return (
    Math.sin(t * 1.13 + seed * 1.7) * 0.5 +
    Math.sin(t * 2.31 + seed * 3.1) * 0.3 +
    Math.sin(t * 4.07 + seed * 5.3) * 0.2
  );
}

// Angle interpolation along the shortest arc.
export function lerpAngle(a, b, u) {
  let d = ((b - a + Math.PI) % (2 * Math.PI)) - Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  return a + d * u;
}

/**
 * Story time -> simulation time, for replays and slow motion.
 * keys: [[t, s], ...] sorted by t; linear between keys, and a key with the same t as the
 * previous one makes a hard jump (a cut back in time). Outside the keys time runs at 1x.
 *   remap([[0, 0], [16, 16], [16, 4.6], [22, 6.4]]) -> plays 0..16, then replays 4.6..6.4 at 0.3x
 */
export function remap(keys) {
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1] + (t - keys[0][0]);
    for (let i = keys.length - 1; i > 0; i--) {
      const [ta, sa] = keys[i - 1], [tb, sb] = keys[i];
      if (t >= ta && t < tb && tb > ta) return sa + ((t - ta) / (tb - ta)) * (sb - sa);
      if (t >= tb && i === keys.length - 1) return sb + (t - tb);
    }
    const [tl, sl] = keys[keys.length - 1];
    return sl + (t - tl);
  };
}

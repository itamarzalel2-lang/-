// timesSquare(): a stylised Midtown grid with a lit Times Square corridor.
//
// World axes: metres, y up, north = -z. The square is a corridor between the
// west building line (x = -26) and the east building line (x = 28):
//   x -26..-20  west sidewalk
//   x -20..-2   7th Avenue, 5 southbound (+z) lanes
//   x  -2..28   pedestrian plaza
// Cross streets run along x and are centred on z = -240, -160, ..., 240.
import * as THREE from 'three';
import { rng, pick } from './util.js';
import { facadeTextures, billboardTexture, tickerTexture, gradientTexture, FACADE_TILE } from './textures.js';

export const CORRIDOR = { west: -26, east: 28, road: [-20, -2], plaza: [-2, 28] };
export const STREETS_Z = [-240, -160, -80, 0, 80, 160, 240];
export const STREET_W = 12;
export const AVENUE_W = 20;
const BLOCK_COLS = [[-366, -266], [-246, -146], [-126, -26], [28, 128], [148, 248], [268, 368]];
const AVENUES_X = [-256, -136, 138, 258]; // centres of the other avenues
const ROWS = STREETS_Z.slice(0, -1).map((z, i) => [z + STREET_W / 2, STREETS_Z[i + 1] - STREET_W / 2]);

// Accumulates axis-aligned boxes into one BufferGeometry with vertex colours.
class BoxBuilder {
  constructor({ uv = false } = {}) {
    this.uv = uv;
    this.pos = []; this.nrm = []; this.col = []; this.uvs = []; this.idx = [];
  }
  quad(a, b, c, d, n, color, uvq) {
    const base = this.pos.length / 3;
    for (const p of [a, b, c, d]) { this.pos.push(...p); this.nrm.push(...n); this.col.push(color.r, color.g, color.b); }
    if (this.uv) this.uvs.push(...uvq);
    this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  // faces: subset of 'px nx pz nz py ny'
  box(x0, x1, y0, y1, z0, z1, color, { faces = 'px nx pz nz py', uOff = 0 } = {}) {
    const TW = FACADE_TILE.w, TH = FACADE_TILE.h;
    const v0 = y0 / TH, v1 = y1 / TH;
    const span = (len) => [uOff, uOff + len / TW];
    if (faces.includes('px')) { const [u0, u1] = span(z1 - z0); this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], color, [u0, v0, u1, v0, u1, v1, u0, v1]); }
    if (faces.includes('nx')) { const [u0, u1] = span(z1 - z0); this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], color, [u0, v0, u1, v0, u1, v1, u0, v1]); }
    if (faces.includes('pz')) { const [u0, u1] = span(x1 - x0); this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], color, [u0, v0, u1, v0, u1, v1, u0, v1]); }
    if (faces.includes('nz')) { const [u0, u1] = span(x1 - x0); this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], color, [u0, v0, u1, v0, u1, v1, u0, v1]); }
    if (faces.includes('py')) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], color, [0, 0, 0, 0, 0, 0, 0, 0]);
    if (faces.includes('ny')) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], color, [0, 0, 0, 0, 0, 0, 0, 0]);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    if (this.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
    g.setIndex(this.idx);
    return g;
  }
}

const col = (hex) => new THREE.Color(hex);

export function timesSquare(opts = {}) {
  const o = {
    blocks: 36, billboards: 'lit', cars: 352, cabs: 'yellow', crowd: true, time: 'rush hour', seed: 7, clear: [],
    ...opts,
  };
  const r = rng(o.seed);
  const group = new THREE.Group();
  group.name = 'timesSquare';
  const animated = [];

  // ---------- sky, fog, light ----------
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1800, 32, 16),
    new THREE.MeshBasicMaterial({
      map: gradientTexture([[0, '#0b0f3a'], [0.42, '#3b2a78'], [0.5, '#c45a8c'], [0.53, '#f29a6b'], [1, '#2a1a40']]),
      side: THREE.BackSide, fog: false, depthWrite: false,
    }),
  );
  group.add(sky);
  const fog = new THREE.FogExp2(col('#4a3270'), 0.0036);
  group.add(new THREE.HemisphereLight(col('#8fa0ff'), col('#2a1830'), 1.1));
  const sun = new THREE.DirectionalLight(col('#ffb08a'), 1.3);
  sun.position.set(-300, 120, -60);
  group.add(sun);
  for (const [c, x, z] of [['#ff3d9a', -14, -30], ['#36c8ff', 12, -90], ['#ff8a3d', -16, 10], ['#9b5bff', 14, -150]]) {
    const pl = new THREE.PointLight(col(c), 320, 80, 1.6);
    pl.position.set(x, 14, z);
    group.add(pl);
  }

  // ---------- ground, slabs, steps ----------
  const asphalt = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: col('#23222e'), roughness: 0.92 }),
  );
  group.add(asphalt);

  const solid = new BoxBuilder();
  const sidewalk = col('#6f6c7c'), plaza = col('#4e4a5c'), curbTop = 0.15;
  // block slabs (sidewalk around each block)
  for (const [x0, x1] of BLOCK_COLS) for (const [z0, z1] of ROWS) solid.box(x0, x1, 0, curbTop, z0, z1, sidewalk);
  // corridor: west sidewalk + plaza, cut by cross streets
  for (const [z0, z1] of ROWS) {
    solid.box(CORRIDOR.west, CORRIDOR.road[0], 0, curbTop, z0, z1, sidewalk);
    solid.box(CORRIDOR.plaza[0], CORRIDOR.plaza[1], 0, curbTop, z0, z1, plaza);
  }
  // red glowing steps on the plaza (north end of the bowtie)
  const steps = new BoxBuilder();
  for (let k = 0; k < 10; k++) steps.box(6, 18, 0, 0.45 * (k + 1), -47.5 - k * 1.5, -46 - k * 1.5, col('#ff2a3a'));
  const stepsMesh = new THREE.Mesh(steps.geometry(), new THREE.MeshStandardMaterial({
    vertexColors: true, emissive: col('#ff1030'), emissiveIntensity: 0.7, roughness: 0.3,
  }));
  group.add(stepsMesh);

  // ---------- road markings ----------
  const markGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const marks = [];
  const lanesX = [-18.2, -14.6, -11.0, -7.4, -3.8];
  for (const x of [-16.4, -12.8, -9.2, -5.6]) for (let z = -300; z < 300; z += 9) marks.push([x, z, 0.15, 3]);
  const crosswalk = (x0, x1, zc) => {
    for (let x = x0 + 0.6; x < x1 - 0.3; x += 1.2) marks.push([x, zc, 0.6, 3]);
  };
  for (const zc of STREETS_Z) {
    crosswalk(CORRIDOR.road[0], CORRIDOR.road[1], zc - STREET_W / 2 - 2);
    crosswalk(CORRIDOR.road[0], CORRIDOR.road[1], zc + STREET_W / 2 + 2);
    for (const ax of AVENUES_X) {
      crosswalk(ax - AVENUE_W / 2, ax + AVENUE_W / 2, zc - STREET_W / 2 - 2);
      crosswalk(ax - AVENUE_W / 2, ax + AVENUE_W / 2, zc + STREET_W / 2 + 2);
    }
  }
  const markMesh = new THREE.InstancedMesh(markGeo, new THREE.MeshStandardMaterial({ color: col('#e8e6f0'), roughness: 0.8 }), marks.length);
  const m4 = new THREE.Matrix4();
  marks.forEach(([x, z, w, l], i) => markMesh.setMatrixAt(i, m4.makeScale(w, 1, l).setPosition(x, 0.012, z)));
  group.add(markMesh);
  for (const ax of AVENUES_X) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 600).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: col('#e8c23a') }));
    line.position.set(ax, 0.012, 0);
    group.add(line);
  }

  // ---------- buildings ----------
  const facade = facadeTextures(o.seed + 3);
  const walls = new BoxBuilder({ uv: true });
  const roofs = new BoxBuilder();
  const tints = ['#b9b4c8', '#c9b7a6', '#9fa8bf', '#c7c2bc', '#a9a0b8', '#d2c8b8', '#8e98ad', '#b6a6a0'].map(col);
  const corridorFacades = []; // {side: -1 west | +1 east, x, z0, z1, h}
  for (const [bx0, bx1] of BLOCK_COLS) {
    for (const [bz0, bz1] of ROWS) {
      const westOfSquare = bx1 === CORRIDOR.west, eastOfSquare = bx0 === CORRIDOR.east;
      const nearSquare = westOfSquare || eastOfSquare;
      const inset = 4;
      const x0 = eastOfSquare ? bx0 : bx0 + inset, x1 = westOfSquare ? bx1 : bx1 - inset;
      const z0 = bz0 + inset, z1 = bz1 - inset;
      // split into lots
      const xs = [x0], zs = [z0];
      const nx = 2 + Math.floor(r() * 2), nz = nearSquare ? 3 + Math.floor(r() * 2) : 2 + Math.floor(r() * 2);
      for (let i = 1; i < nx; i++) xs.push(x0 + ((x1 - x0) * (i + (r() - 0.5) * 0.4)) / nx);
      for (let i = 1; i < nz; i++) zs.push(z0 + ((z1 - z0) * (i + (r() - 0.5) * 0.4)) / nz);
      xs.push(x1); zs.push(z1);
      const dist = Math.min(Math.abs((bx0 + bx1) / 2), 400) / 400;
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < nz; j++) {
          const lx0 = xs[i], lx1 = xs[i + 1], lz0 = zs[j], lz1 = zs[j + 1];
          const facesSquare = (westOfSquare && i === nx - 1) || (eastOfSquare && i === 0);
          let h = facesSquare ? 55 + r() * 110 : 22 + r() * (90 - 50 * dist);
          if (r() < 0.12) h *= 1.6;
          const tint = pick(r, tints);
          const uOff = Math.floor(r() * 16) / 16;
          walls.box(lx0, lx1, 0, h, lz0, lz1, tint, { faces: 'px nx pz nz', uOff });
          roofs.box(lx0, lx1, h - 0.01, h + 0.6, lz0, lz1, col('#2b2a36'));
          // setback tower on top
          if (h > 60 && r() < 0.55) {
            const s = 3 + r() * 5, h2 = h + 15 + r() * 45;
            walls.box(lx0 + s, lx1 - s, h, h2, lz0 + s, lz1 - s, tint, { faces: 'px nx pz nz', uOff });
            roofs.box(lx0 + s, lx1 - s, h2 - 0.01, h2 + 0.6, lz0 + s, lz1 - s, col('#2b2a36'));
          }
          // roof clutter for the aerial shots
          for (let k = 0; k < 3; k++) {
            const cx = lx0 + 3 + r() * Math.max(1, lx1 - lx0 - 6), cz = lz0 + 3 + r() * Math.max(1, lz1 - lz0 - 6);
            const s = 1 + r() * 2.5;
            roofs.box(cx - s, cx + s, h, h + 1 + r() * 3, cz - s, cz + s, col('#3c3a48'));
          }
          if (facesSquare) corridorFacades.push({ side: westOfSquare ? -1 : 1, x: westOfSquare ? lx1 : lx0, z0: lz0, z1: lz1, h });
        }
      }
    }
  }
  const wallMat = new THREE.MeshStandardMaterial({
    map: facade.map, emissiveMap: facade.emissive, emissive: col('#ffffff'), emissiveIntensity: 1.15,
    vertexColors: true, roughness: 0.75, metalness: 0.05,
  });
  group.add(new THREE.Mesh(walls.geometry(), wallMat));
  group.add(new THREE.Mesh(roofs.geometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 })));

  // ---------- the tower at the far end of the bowtie ----------
  const tower = new BoxBuilder({ uv: true });
  tower.box(3, 23, 0, 78, -196, -176, col('#a6a2b8'), { faces: 'px nx pz nz' });
  tower.box(6, 20, 78, 112, -193, -179, col('#a6a2b8'), { faces: 'px nx pz nz' });
  group.add(new THREE.Mesh(tower.geometry(), wallMat));
  const towerTop = new BoxBuilder();
  towerTop.box(6, 20, 112, 113, -193, -179, col('#2b2a36'));
  towerTop.box(12.6, 13.4, 113, 135, -186.4, -185.6, col('#c8c8d8'));
  group.add(new THREE.Mesh(towerTop.geometry(), new THREE.MeshStandardMaterial({ vertexColors: true })));
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.5, 1.3), toneMapped: false }));
  ball.position.set(13, 136.5, -186);
  group.add(ball);

  // ---------- billboards ----------
  let boardSeed = o.seed * 100;
  const boards = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: col('#121219'), roughness: 0.6 });
  const addBoard = (cx, cy, cz, w, h, yaw, k = 1.15) => {
    const map = billboardTexture(boardSeed++, w / h);
    const mat = new THREE.MeshBasicMaterial({ map, color: new THREE.Color(k, k, k), toneMapped: false });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, h + 0.6, 0.5), frameMat);
    const g = new THREE.Group();
    frame.position.z = -0.2;
    plane.position.z = 0.08;
    g.add(frame, plane);
    g.position.set(cx, cy, cz);
    g.rotation.y = yaw;
    boards.add(g);
  };
  if (o.billboards) {
    for (const f of corridorFacades) {
      if (f.z1 < -250 || f.z0 > 110) continue;
      const len = f.z1 - f.z0;
      let y = 6.5 + r() * 2;
      const n = 2 + Math.floor(r() * 3);
      for (let k = 0; k < n && y < Math.min(f.h - 6, 60); k++) {
        const h = 6 + r() * 9, w = Math.min(len * (0.62 + r() * 0.33), h * (0.9 + r() * 2.2));
        const cz = f.z0 + w / 2 + 0.5 + r() * Math.max(0, len - w - 1);
        addBoard(f.x + f.side * -0.45, y + h / 2, cz, w, h, f.side < 0 ? Math.PI / 2 : -Math.PI / 2, 1.0 + r() * 0.35);
        y += h + 1.2 + r() * 2.5;
      }
    }
    // tower faces: south (+z, toward the camera) and west
    for (let k = 0; k < 4; k++) addBoard(13, 12 + k * 15, -175.5, 18, 12.5, 0, 1.1 + 0.08 * k);
    for (let k = 0; k < 3; k++) addBoard(2.5, 14 + k * 17, -186, 18, 13, -Math.PI / 2, 1.05);
  }
  group.add(boards);

  // zipper tickers
  const tick = tickerTexture('  RUSH HOUR · 18:42 · TIMES SQUARE · NYC  ', '#ffd23f');
  const tickMat = new THREE.MeshBasicMaterial({ map: tick, color: new THREE.Color(1.3, 1.3, 1.3), toneMapped: false });
  tick.repeat.set(2, 1);
  const tickBand = new THREE.Mesh(new THREE.PlaneGeometry(20, 1.6), tickMat);
  tickBand.position.set(13, 7.2, -175.4);
  group.add(tickBand);
  animated.push((t) => { tick.offset.x = t * 0.09; });

  // storefront glow along the square
  const shop = new BoxBuilder();
  for (const f of corridorFacades) {
    if (f.z1 < -250 || f.z0 > 110) continue;
    shop.box(f.x + (f.side < 0 ? 0 : -0.3), f.x + (f.side < 0 ? 0.3 : 0), 0.6, 4.2, f.z0 + 1, f.z1 - 1, pick(r, [col('#ffe0a0'), col('#fff4dd'), col('#ffd0e8'), col('#c8ecff')]));
  }
  group.add(new THREE.Mesh(shop.geometry(), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })));

  // street lamps along both curbs
  const poles = new BoxBuilder(), heads = new BoxBuilder();
  for (let z = -230; z < 120; z += 24) {
    for (const [x, dir] of [[-0.9, -1], [-20.9, 1]]) {
      if (STREETS_Z.some((s) => Math.abs(z - s) < STREET_W / 2 + 1)) continue;
      if (o.clear.some(([cx, cz, cr]) => (x - cx) ** 2 + (z - cz) ** 2 < cr * cr)) continue; // keep the shot clean
      poles.box(x - 0.12, x + 0.12, 0, 8, z - 0.12, z + 0.12, col('#2a2a33'));
      poles.box(Math.min(x, x + dir * 3), Math.max(x, x + dir * 3), 7.8, 8.05, z - 0.08, z + 0.08, col('#2a2a33'));
      heads.box(x + dir * 3 - 0.5, x + dir * 3 + 0.5, 7.6, 7.8, z - 0.25, z + 0.25, col('#fff0d0'));
    }
  }
  group.add(new THREE.Mesh(solid.geometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 })));
  group.add(new THREE.Mesh(poles.geometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 })));
  group.add(new THREE.Mesh(heads.geometry(), new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 1.8, 1.4), toneMapped: false })));

  // ---------- traffic lanes for traffic.js ----------
  const lanes = [];
  lanesX.forEach((x, i) => lanes.push({ axis: 'z', c: x, dir: 1, range: [-300, 140], speed: 3.6 + ((i * 0.83) % 1) * 2.6, corridor: true }));
  for (const ax of AVENUES_X) {
    for (const [off, dir] of [[-7, 1], [-3, 1], [3, -1], [7, -1]]) lanes.push({ axis: 'z', c: ax + off, dir, range: [-300, 300], speed: 6 + r() * 3 });
  }
  // stopped queues on the cross streets either side of the square (red light)
  const queues = [];
  for (const zc of STREETS_Z) {
    queues.push({ axis: 'x', c: zc + 3, dir: 1, front: CORRIDOR.west - 2.5 });
    queues.push({ axis: 'x', c: zc - 3, dir: -1, front: CORRIDOR.east + 2.5 });
  }

  // ---------- where people can walk ----------
  const crowdZones = [
    { x: [-25.2, -20.8], z: [-165, 75], weight: 0.22 },
    { x: [-1.0, 3.2], z: [-165, 6], weight: 0.12 },
    { x: [4.2, 5.2], z: [-165, 75], weight: 0.08 },
    { x: [19, 27], z: [-165, 75], weight: 0.3 },
    { x: [5.5, 18.5], z: [-44, 75], weight: 0.28 },
  ];
  const standZones = [{ x: [6.5, 17.5], steps: true, z: [-61, -46.5] }];

  return {
    group, fog, lanes, queues, crowdZones, standZones, carCount: o.cars, cabs: o.cabs, options: o,
    stepHeight: (z) => (z > -46 || z < -61 ? 0 : 0.45 * (Math.floor((-46 - z) / 1.5) + 1)),
    update(t) { for (const f of animated) f(t); },
  };
}

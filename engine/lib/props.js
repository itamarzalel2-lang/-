// First-person hand holding a phone in a (rubber) case. Attach to the camera.
import * as THREE from 'three';
import { phoneScreenTexture } from './textures.js';

export function povPhone({ skin = '#d9a07a', caseColor = '#e8333f' } = {}) {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.7, emissive: skin, emissiveIntensity: 0.35 });
  const phone = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.074, 0.152, 0.008), new THREE.MeshStandardMaterial({ color: '#1a1a22', roughness: 0.3, metalness: 0.6 }));
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.066, 0.142),
    new THREE.MeshBasicMaterial({ map: phoneScreenTexture(), color: new THREE.Color(1.05, 1.05, 1.05), toneMapped: false }),
  );
  screen.position.z = 0.0042;
  const rubberCase = new THREE.Mesh(
    new THREE.BoxGeometry(0.088, 0.166, 0.012),
    new THREE.MeshStandardMaterial({ color: caseColor, roughness: 0.85, emissive: caseColor, emissiveIntensity: 0.3 }),
  );
  rubberCase.position.z = -0.0022;
  phone.add(rubberCase, body, screen);
  group.add(phone);

  // blocky hand: palm behind the phone, thumb on the left edge, fingers wrapping the right edge
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.085, 0.03), skinMat);
  palm.position.set(0.012, -0.05, -0.024);
  const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.02), skinMat);
  thumb.position.set(-0.043, -0.035, 0.0);
  thumb.rotation.z = -0.35;
  group.add(palm, thumb);
  for (let k = 0; k < 4; k++) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.017, 0.022), skinMat);
    f.position.set(0.045, 0.02 - k * 0.022, -0.006);
    group.add(f);
  }
  const wrist = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.045), skinMat);
  wrist.position.set(0.02, -0.14, -0.035);
  wrist.rotation.x = 0.25;
  group.add(wrist);

  return {
    group,
    rubberCase,
    setCase(scale) {
      rubberCase.visible = scale > 0.001;
      rubberCase.scale.setScalar(Math.max(0.001, scale));
    },
  };
}

/** A flock of blocky pigeons circling `center`. After `dropAt` they stop flapping and fall; at `recoverAt` they fly again. */
export function pigeons({ count = 40, center = [0, 60, -40], radius = 30, seed = 4 } = {}) {
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.2, 0.42), new THREE.MeshStandardMaterial({ color: '#7d8494', roughness: 0.8 }), count);
  const wings = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.03, 0.22).translate(0.21, 0, 0), new THREE.MeshStandardMaterial({ color: '#a7aebd', roughness: 0.8 }), count * 2);
  body.frustumCulled = wings.frustumCulled = false;
  const group = new THREE.Group();
  group.add(body, wings);
  const birds = Array.from({ length: count }, (_, i) => {
    const h = (k) => { const x = Math.sin((i + 1) * 12.9898 * (k + 1) + seed * 78.233) * 43758.5453; return x - Math.floor(x); };
    return { r: radius * (0.4 + 0.6 * h(1)), a0: h(2) * Math.PI * 2, y: (h(3) - 0.5) * 12, w: (0.35 + 0.25 * h(4)) * (h(5) < 0.5 ? 1 : -1), flap: 9 + h(6) * 4, ph: h(7) * 6 };
  });
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1), w = new THREE.Matrix4(), ry = new THREE.Matrix4();
  function update(t, { dropAt = Infinity, recoverAt = Infinity } = {}) {
    birds.forEach((b, i) => {
      const fallT = Math.max(0, Math.min(t, recoverAt) - dropAt);
      const tt = t > dropAt ? dropAt : t;
      const a = b.a0 + b.w * tt;
      let x = center[0] + Math.cos(a) * b.r, z = center[2] + Math.sin(a) * b.r, y = center[1] + b.y;
      const vx = -Math.sin(a) * b.w * b.r, vz = Math.cos(a) * b.w * b.r;
      // ballistic drop while there is nothing to push against, then glide out of it
      x += vx * fallT; z += vz * fallT; y -= 4.9 * fallT * fallT;
      if (t > recoverAt) { const k = t - recoverAt; x += vx * k; z += vz * k; y += -9.8 * fallT * k * Math.exp(-k * 2) * 0.5; }
      y = Math.max(y, 1);
      const tumbling = t > dropAt && t < recoverAt;
      e.set(tumbling ? fallT * 5 + b.ph : 0, Math.atan2(vx, vz), tumbling ? fallT * 3 : 0);
      q.setFromEuler(e);
      m.compose(v.set(x, y, z), q, s);
      body.setMatrixAt(i, m);
      const flap = tumbling ? 0.1 : Math.sin(t * b.flap + b.ph) * 0.7;
      for (let k = 0; k < 2; k++) {
        // right wing as modelled (+x); left wing = the same wing turned half a turn about y
        w.makeRotationZ(flap).premultiply(ry.makeRotationY(k ? 0 : Math.PI));
        wings.setMatrixAt(i * 2 + k, w.premultiply(m));
      }
    });
    body.instanceMatrix.needsUpdate = wings.instanceMatrix.needsUpdate = true;
  }
  return { group, update };
}

/** A big full moon on the sky dome. angularDiameter in degrees (the real Moon: ~0.52). */
export function moon({ angularDiameter = 0.52, direction = [0, 0.35, -1], distance = 1500 } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#d9d6cc';
  g.fillRect(0, 0, 512, 512);
  let seed = 9;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  // maria (dark seas) and craters
  for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(110,108,104,${0.35 + rnd() * 0.3})`; g.beginPath(); g.ellipse(80 + rnd() * 350, 80 + rnd() * 300, 30 + rnd() * 70, 20 + rnd() * 60, rnd() * 3, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 140; i++) {
    const x = rnd() * 512, y = rnd() * 512, r = 2 + Math.pow(rnd(), 3) * 26;
    g.strokeStyle = 'rgba(255,255,250,0.35)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(90,88,84,0.25)'; g.beginPath(); g.arc(x + r * 0.15, y + r * 0.15, r * 0.8, 0, Math.PI * 2); g.fill();
  }
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshBasicMaterial({ map, color: new THREE.Color(1.25, 1.25, 1.2), toneMapped: false, fog: false }));
  const dir = new THREE.Vector3(...direction).normalize();
  const set = (deg) => {
    mesh.scale.setScalar(distance * Math.tan(((deg / 2) * Math.PI) / 180));
    mesh.position.copy(dir).multiplyScalar(distance);
  };
  set(angularDiameter);
  mesh.lookAt(0, 0, 0);
  return { mesh, setSize: set };
}

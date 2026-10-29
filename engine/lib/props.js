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

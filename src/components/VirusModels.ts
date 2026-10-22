import * as THREE from 'three';
import { VirusEntity } from '../types/game';

/**
 * Creates a procedural 3D virus entity based on malware type
 */
export function createVirusMesh(entity: VirusEntity): THREE.Group {
  const group = new THREE.Group();
  group.name = `Virus_${entity.id}`;
  group.userData = { virusId: entity.id, entity };

  switch (entity.type) {
    case 'trojan': {
      // 1. Spiked Polyhedron Core
      const coreGeo = new THREE.DodecahedronGeometry(0.38, 1);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.2,
        metalness: 0.8,
        wireframe: false,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      group.add(core);

      // 2. Glowing Menacing Eye
      const eyeGeo = new THREE.SphereGeometry(0.16, 16, 16);
      const eyeMat = new THREE.MeshStandardMaterial({
        color: 0xff0055,
        emissive: 0xff0044,
        emissiveIntensity: 1.5,
      });
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.name = 'CoreEye';
      group.add(eye);

      // 3. Orbiting Barbed Ring
      const ringGeo = new THREE.TorusGeometry(0.55, 0.03, 8, 24);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xf87171,
        emissive: 0xdc2626,
        emissiveIntensity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.name = 'RingX';
      ring.rotation.x = Math.PI / 3;
      group.add(ring);

      // Spikes
      const spikeGeo = new THREE.ConeGeometry(0.06, 0.35, 6);
      const spikeMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.9 });
      for (let i = 0; i < 6; i++) {
        const spike = new THREE.Mesh(spikeGeo, spikeMat);
        const theta = (i / 6) * Math.PI * 2;
        spike.position.set(Math.cos(theta) * 0.42, Math.sin(theta) * 0.42, 0);
        spike.rotation.z = theta - Math.PI / 2;
        group.add(spike);
      }
      break;
    }

    case 'ransomware': {
      // 1. Digital Padlock Cube Core
      const boxGeo = new THREE.BoxGeometry(0.5, 0.45, 0.35);
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        roughness: 0.25,
        metalness: 0.8,
      });
      const lockBox = new THREE.Mesh(boxGeo, boxMat);
      group.add(lockBox);

      // 2. Heavy Steel Shackle Ring
      const shackleGeo = new THREE.TorusGeometry(0.24, 0.05, 12, 24, Math.PI);
      const shackleMat = new THREE.MeshStandardMaterial({
        color: 0xd8b4fe,
        metalness: 0.95,
        roughness: 0.1,
      });
      const shackle = new THREE.Mesh(shackleGeo, shackleMat);
      shackle.position.set(0, 0.26, 0);
      group.add(shackle);

      // 3. Glowing Encryption Keyhole / Rune
      const runeGeo = new THREE.CircleGeometry(0.1, 8);
      const runeMat = new THREE.MeshStandardMaterial({
        color: 0xc084fc,
        emissive: 0xa855f7,
        emissiveIntensity: 1.2,
      });
      const rune = new THREE.Mesh(runeGeo, runeMat);
      rune.position.z = 0.185;
      group.add(rune);

      // Outer floating lock fragments
      for (let f = 0; f < 4; f++) {
        const fragGeo = new THREE.OctahedronGeometry(0.08);
        const fragMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, wireframe: true });
        const frag = new THREE.Mesh(fragGeo, fragMat);
        const angle = (f / 4) * Math.PI * 2;
        frag.position.set(Math.cos(angle) * 0.5, Math.sin(angle) * 0.5, (Math.random() - 0.5) * 0.2);
        frag.name = `Frag_${f}`;
        group.add(frag);
      }
      break;
    }

    case 'phishing': {
      // 1. Deceptive Golden Bait Orb
      const baitGeo = new THREE.SphereGeometry(0.25, 16, 16);
      const baitMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xeab308,
        emissiveIntensity: 1.0,
      });
      const bait = new THREE.Mesh(baitGeo, baitMat);
      group.add(bait);

      // 2. Barbed Hook Spine
      const hookCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.35, 0),
        new THREE.Vector3(0.2, 0.2, 0),
        new THREE.Vector3(0.35, -0.1, 0),
        new THREE.Vector3(0.2, -0.35, 0),
        new THREE.Vector3(-0.1, -0.25, 0),
      ]);
      const hookGeo = new THREE.TubeGeometry(hookCurve, 20, 0.04, 8, false);
      const hookMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, metalness: 0.9, roughness: 0.2 });
      const hook = new THREE.Mesh(hookGeo, hookMat);
      group.add(hook);

      // 3. Warning Triangular Halo
      const triGeo = new THREE.RingGeometry(0.45, 0.48, 3);
      const triMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.8 });
      const tri = new THREE.Mesh(triGeo, triMat);
      tri.name = 'RingX';
      group.add(tri);
      break;
    }

    case 'worm': {
      // Segmented Replicating Worm with 5 segments
      const segmentCount = 5;
      for (let s = 0; s < segmentCount; s++) {
        const segGeo = new THREE.SphereGeometry(0.18 - s * 0.02, 12, 12);
        const segMat = new THREE.MeshStandardMaterial({
          color: 0x22c55e,
          emissive: 0x16a34a,
          emissiveIntensity: 0.6 - s * 0.08,
          wireframe: s % 2 === 1,
        });
        const seg = new THREE.Mesh(segGeo, segMat);
        seg.position.set(Math.sin(s * 0.7) * 0.2, (s - 2) * 0.18, 0);
        seg.name = `WormSeg_${s}`;
        group.add(seg);
      }
      break;
    }

    case 'spyware': {
      // 1. Surveillance Camera Sphere Eye
      const spyEyeGeo = new THREE.SphereGeometry(0.3, 16, 16);
      const spyEyeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.6, roughness: 0.3 });
      const spyEye = new THREE.Mesh(spyEyeGeo, spyEyeMat);
      group.add(spyEye);

      // 2. Center Scanning Pupil
      const pupilGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16);
      const pupilMat = new THREE.MeshStandardMaterial({
        color: 0xff4500,
        emissive: 0xff3300,
        emissiveIntensity: 1.4,
      });
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.rotation.x = Math.PI / 2;
      pupil.position.z = 0.26;
      group.add(pupil);

      // 3. Tri-Satellite Dishes
      for (let a = 0; a < 3; a++) {
        const dishGeo = new THREE.CylinderGeometry(0.1, 0.02, 0.04, 12);
        const dishMat = new THREE.MeshStandardMaterial({ color: 0xfb923c, metalness: 0.8 });
        const dish = new THREE.Mesh(dishGeo, dishMat);
        const angle = (a / 3) * Math.PI * 2;
        dish.position.set(Math.cos(angle) * 0.48, Math.sin(angle) * 0.48, 0);
        dish.rotation.z = angle;
        group.add(dish);
      }
      break;
    }
  }

  // Floating HP / Shield Ring around entity
  const shieldGeo = new THREE.TorusGeometry(0.65, 0.02, 8, 32);
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.75,
  });
  const shieldRing = new THREE.Mesh(shieldGeo, shieldMat);
  shieldRing.name = 'ShieldRing';
  group.add(shieldRing);

  // Position from entity data
  group.position.set(entity.x, entity.y, entity.z);

  return group;
}

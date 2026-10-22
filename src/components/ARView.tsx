import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GameLevel, HardwarePart, VirusEntity } from '../types/game';
import {
  createMotherboardGroup,
  createCPUModel,
  createRAMModel,
  createGPUModel,
  createSSDModel,
  createCoolerModel,
  createPSUModel,
} from './HardwareModels';
import { createVirusMesh } from './VirusModels';
import { sound } from '../audio/soundEffects';

interface ARViewProps {
  currentLevel: GameLevel;
  parts: HardwarePart[];
  viruses: VirusEntity[];
  onVirusDestroyed: (virus: VirusEntity) => void;
  onAllVirusesCleared: () => void;
  isVirtualLabMode: boolean;
  onToggleVirtualLab: () => void;
  crosshairLockedVirus: VirusEntity | null;
  setCrosshairLockedVirus: (v: VirusEntity | null) => void;
  laserTriggerCounter: number;
}

// Module-scope re-usable math helpers for zero GC in render loop
const _vec3 = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _raycaster = new THREE.Raycaster();
const _centerScreen = new THREE.Vector2(0, 0);

export const ARView: React.FC<ARViewProps> = ({
  currentLevel,
  parts,
  viruses,
  onVirusDestroyed,
  onAllVirusesCleared,
  isVirtualLabMode,
  onToggleVirtualLab,
  crosshairLockedVirus,
  setCrosshairLockedVirus,
  laserTriggerCounter,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [gyroActive, setGyroActive] = useState<boolean>(false);

  // References to 3D scene elements
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const motherboardGroupRef = useRef<THREE.Group | null>(null);
  const installedMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const virusMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const laserBeamsRef = useRef<{ line: THREE.Line; life: number }[]>([]);
  const particlesRef = useRef<{ mesh: THREE.Points; life: number }[]>([]);
  const virtualLabGridRef = useRef<THREE.Group | null>(null);

  // Interaction refs
  const isDraggingRef = useRef(false);
  const previousPointerPosRef = useRef({ x: 0, y: 0 });
  const cameraYawPitchRef = useRef({ yaw: 0, pitch: 0 });
  const gyroOrientationRef = useRef({ alpha: 0, beta: 0, gamma: 0 });

  // 1. Initialize Camera (WebRTC)
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        setCameraError(null);
      }
    } catch (err) {
      console.warn('Camera access unavailable or declined:', err);
      setCameraActive(false);
      setCameraError('Akses kamera tidak tersedia. Menggunakan Mode Lab 3D Virtual.');
      // Auto enable Virtual Lab Mode fallback
      if (!isVirtualLabMode) {
        onToggleVirtualLab();
      }
    }
  }, [isVirtualLabMode, onToggleVirtualLab]);

  // Toggle Front/Back Camera
  const toggleCameraFacing = useCallback(() => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  }, [cameraFacing, startCamera]);

  // 2. Request Device Orientation (Gyroscope) for Mobile AR Aiming
  const requestGyroscope = useCallback(() => {
    const DeviceOrientationEvt = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof DeviceOrientationEvt?.requestPermission === 'function') {
      DeviceOrientationEvt.requestPermission()
        .then((response) => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
            setGyroActive(true);
          }
        })
        .catch(console.error);
    } else if ('ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', handleDeviceOrientation);
      setGyroActive(true);
    }
  }, []);

  const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
    if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
      gyroOrientationRef.current = {
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
      };
    }
  };

  // Center / Calibrate Gyro
  const calibrateGyro = () => {
    cameraYawPitchRef.current = { yaw: 0, pitch: 0 };
    sound.playClick();
  };

  // Start initial camera if not virtual lab
  useEffect(() => {
    if (!isVirtualLabMode) {
      startCamera(cameraFacing);
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
    }
  }, [isVirtualLabMode, cameraFacing, startCamera]);

  // 3. Three.js Scene Setup
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current = renderer;

    // Studio Environment Reflection via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-Point Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x00ffcc, 1.2);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    fillLight.position.set(-3, -2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xa855f7, 1.5, 30);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // Build Virtual Lab Holographic Environment (for desktop / when camera is off)
    const labGroup = new THREE.Group();
    labGroup.name = 'VirtualLabEnvironment';

    // Grid Floor
    const gridHelper = new THREE.GridHelper(30, 30, 0x00ffcc, 0x003344);
    gridHelper.position.y = -2.5;
    labGroup.add(gridHelper);

    // Cyber Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.1, 0.1, 6, 8);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      emissive: 0x00ffcc,
      emissiveIntensity: 0.8,
      wireframe: true,
    });
    for (let p = 0; p < 8; p++) {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      const angle = (p / 8) * Math.PI * 2;
      pillar.position.set(Math.cos(angle) * 8, 0, Math.sin(angle) * 8);
      labGroup.add(pillar);
    }
    virtualLabGridRef.current = labGroup;
    scene.add(labGroup);

    // Window Resize Handler
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Setup Motherboard for Level 1
    const mbGroup = createMotherboardGroup();
    mbGroup.position.set(0, 0, 0);
    motherboardGroupRef.current = mbGroup;
    scene.add(mbGroup);

    // Touch & Pointer Handlers for Aiming / Rotating
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      previousPointerPosRef.current = { x: clientX, y: clientY };
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - previousPointerPosRef.current.x;
      const deltaY = clientY - previousPointerPosRef.current.y;
      previousPointerPosRef.current = { x: clientX, y: clientY };

      cameraYawPitchRef.current.yaw -= deltaX * 0.005;
      cameraYawPitchRef.current.pitch -= deltaY * 0.005;
      // Clamp pitch
      cameraYawPitchRef.current.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, cameraYawPitchRef.current.pitch));
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const containerEl = containerRef.current;
    containerEl.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    containerEl.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Animation & Render Loop
    let frameId = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Camera orientation from Gyro or Drag
      if (cameraRef.current) {
        if (gyroActive) {
          const { alpha, beta, gamma } = gyroOrientationRef.current;
          const radAlpha = THREE.MathUtils.degToRad(alpha || 0);
          const radBeta = THREE.MathUtils.degToRad((beta || 0) - 90);
          const radGamma = THREE.MathUtils.degToRad(gamma || 0);

          _euler.set(radBeta, radAlpha, -radGamma, 'YXZ');
          cameraRef.current.quaternion.setFromEuler(_euler);
        } else {
          _euler.set(cameraYawPitchRef.current.pitch, cameraYawPitchRef.current.yaw, 0, 'YXZ');
          cameraRef.current.quaternion.setFromEuler(_euler);
        }
      }

      // Level 1 Animation: Motherboard subtle levitation and rotation
      if (motherboardGroupRef.current && motherboardGroupRef.current.visible) {
        motherboardGroupRef.current.rotation.y = Math.sin(time * 0.4) * 0.2;
        motherboardGroupRef.current.position.y = Math.sin(time * 1.2) * 0.08;

        // Animate installed Cooler Fan
        const coolerGroup = installedMeshesRef.current.get('cooler');
        if (coolerGroup) {
          const fanHub = coolerGroup.getObjectByName('CoolerFanHub');
          if (fanHub) fanHub.rotation.z += delta * 12;
        }

        // Animate installed GPU Fans
        const gpuGroup = installedMeshesRef.current.get('gpu');
        if (gpuGroup) {
          const fan0 = gpuGroup.getObjectByName('GPUFanBlade_0');
          const fan1 = gpuGroup.getObjectByName('GPUFanBlade_1');
          if (fan0) fan0.rotation.z += delta * 14;
          if (fan1) fan1.rotation.z += delta * 14;
        }
      }

      // Level 2 Animation: Floating malware entities
      if (virusMeshesRef.current.size > 0) {
        virusMeshesRef.current.forEach((mesh, id) => {
          const entity = mesh.userData.entity as VirusEntity;
          if (!entity) return;

          // Bobbing & floating movement
          mesh.position.y = entity.y + Math.sin(time * 2 + entity.phase) * 0.25;
          mesh.position.x = entity.x + Math.cos(time * 1.5 + entity.phase) * 0.15;
          mesh.rotation.y += entity.speed;
          mesh.rotation.x += entity.speed * 0.5;

          // Sub-elements animation
          const eye = mesh.getObjectByName('CoreEye');
          if (eye) {
            const scale = 1 + Math.sin(time * 6 + entity.phase) * 0.2;
            eye.scale.set(scale, scale, scale);
          }

          const ringX = mesh.getObjectByName('RingX');
          if (ringX) {
            ringX.rotation.z += 0.03;
          }

          const shield = mesh.getObjectByName('ShieldRing');
          if (shield) {
            shield.rotation.z -= 0.02;
          }
        });

        // Crosshair Lock-On Raycasting from Center (0, 0)
        if (cameraRef.current && sceneRef.current) {
          _raycaster.setFromCamera(_centerScreen, cameraRef.current);
          const virusMeshesArray = Array.from(virusMeshesRef.current.values());
          const intersects = _raycaster.intersectObjects(virusMeshesArray, true);

          if (intersects.length > 0) {
            let hitGroup: THREE.Object3D | null = intersects[0].object;
            while (hitGroup && !hitGroup.name.startsWith('Virus_') && hitGroup.parent) {
              hitGroup = hitGroup.parent;
            }
            if (hitGroup && hitGroup.userData?.entity) {
              setCrosshairLockedVirus(hitGroup.userData.entity as VirusEntity);
            }
          } else {
            setCrosshairLockedVirus(null);
          }
        }
      }

      // Update Laser Beams
      for (let i = laserBeamsRef.current.length - 1; i >= 0; i--) {
        const laser = laserBeamsRef.current[i];
        laser.life -= delta;
        if (laser.life <= 0) {
          scene.remove(laser.line);
          laser.line.geometry.dispose();
          (laser.line.material as THREE.Material).dispose();
          laserBeamsRef.current.splice(i, 1);
        } else {
          (laser.line.material as THREE.LineBasicMaterial).opacity = laser.life / 0.2;
        }
      }

      // Update Particle Explosions
      for (let p = particlesRef.current.length - 1; p >= 0; p--) {
        const part = particlesRef.current[p];
        part.life -= delta;
        if (part.life <= 0) {
          scene.remove(part.mesh);
          part.mesh.geometry.dispose();
          (part.mesh.material as THREE.Material).dispose();
          particlesRef.current.splice(p, 1);
        } else {
          const positions = part.mesh.geometry.attributes.position.array as Float32Array;
          for (let k = 0; k < positions.length; k += 3) {
            positions[k] += (Math.random() - 0.5) * 0.08;
            positions[k + 1] += (Math.random() - 0.5) * 0.08;
            positions[k + 2] += (Math.random() - 0.5) * 0.08;
          }
          part.mesh.geometry.attributes.position.needsUpdate = true;
          (part.mesh.material as THREE.PointsMaterial).opacity = part.life / 0.4;
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      containerEl.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      containerEl.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);

      renderer.dispose();
    };
  }, [gyroActive, setCrosshairLockedVirus]);

  // Handle Virtual Lab mode toggle
  useEffect(() => {
    if (virtualLabGridRef.current) {
      virtualLabGridRef.current.visible = isVirtualLabMode;
    }
  }, [isVirtualLabMode]);

  // Update Level Visibility
  useEffect(() => {
    if (!sceneRef.current) return;

    if (currentLevel === 'level1' || currentLevel === 'intro') {
      if (motherboardGroupRef.current) motherboardGroupRef.current.visible = true;
      // Remove all viruses
      virusMeshesRef.current.forEach((mesh) => sceneRef.current?.remove(mesh));
      virusMeshesRef.current.clear();
    } else if (currentLevel === 'level2') {
      if (motherboardGroupRef.current) motherboardGroupRef.current.visible = false;
      // Spawn Level 2 viruses
      if (virusMeshesRef.current.size === 0 && viruses.length > 0) {
        viruses.forEach((v) => {
          const vMesh = createVirusMesh(v);
          sceneRef.current?.add(vMesh);
          virusMeshesRef.current.set(v.id, vMesh);
        });
      }
    } else {
      if (motherboardGroupRef.current) motherboardGroupRef.current.visible = false;
      virusMeshesRef.current.forEach((mesh) => sceneRef.current?.remove(mesh));
      virusMeshesRef.current.clear();
    }
  }, [currentLevel, viruses]);

  // Sync Hardware Parts Installation in Level 1
  useEffect(() => {
    const mb = motherboardGroupRef.current;
    if (!mb || !sceneRef.current) return;

    parts.forEach((part) => {
      const alreadyInstalled = installedMeshesRef.current.has(part.id);

      if (part.installed && !alreadyInstalled) {
        let componentMesh: THREE.Group | null = null;

        if (part.id === 'cpu') {
          componentMesh = createCPUModel();
          componentMesh.position.set(-0.6, 0.8, 0.22);
        } else if (part.id === 'ram') {
          componentMesh = createRAMModel();
          componentMesh.position.set(0.6, 0.5, 0.22);
        } else if (part.id === 'gpu') {
          componentMesh = createGPUModel();
          componentMesh.position.set(-0.1, -0.9, 0.45);
        } else if (part.id === 'ssd') {
          componentMesh = createSSDModel();
          componentMesh.position.set(-0.2, -0.2, 0.16);
        } else if (part.id === 'cooler') {
          componentMesh = createCoolerModel();
          componentMesh.position.set(-0.6, 0.8, 0.55);
        } else if (part.id === 'psu') {
          componentMesh = createPSUModel();
          componentMesh.position.set(-1.8, -1.5, 0.45);
        }

        if (componentMesh) {
          mb.add(componentMesh);
          installedMeshesRef.current.set(part.id, componentMesh);

          // Animate drop-in snap
          const finalZ = componentMesh.position.z;
          componentMesh.position.z += 1.5;
          let snapTime = 0;
          const animateSnap = () => {
            if (!componentMesh) return;
            snapTime += 0.08;
            componentMesh.position.z = THREE.MathUtils.lerp(componentMesh.position.z, finalZ, 0.2);
            if (snapTime < 1) {
              requestAnimationFrame(animateSnap);
            } else {
              componentMesh.position.z = finalZ;
            }
          };
          animateSnap();
        }
      } else if (!part.installed && alreadyInstalled) {
        const mesh = installedMeshesRef.current.get(part.id);
        if (mesh) {
          mb.remove(mesh);
          installedMeshesRef.current.delete(part.id);
        }
      }
    });
  }, [parts]);

  // Trigger Laser Shot and Virus Hit Detection
  const shootLaser = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current) return;

    sound.playLaser();

    // Spawn 3D Laser Beam from bottom-center towards center crosshair
    const origin = cameraRef.current.position.clone();
    origin.y -= 0.3;
    origin.z -= 0.2;

    _raycaster.setFromCamera(_centerScreen, cameraRef.current);
    const targetPoint = _raycaster.ray.origin.clone().add(_raycaster.ray.direction.clone().multiplyScalar(10));

    // Check hit on virus meshes
    const virusMeshesArray = Array.from(virusMeshesRef.current.values());
    const intersects = _raycaster.intersectObjects(virusMeshesArray, true);

    let hitPoint = targetPoint;
    let hitEntity: VirusEntity | null = null;

    if (intersects.length > 0) {
      hitPoint = intersects[0].point;
      let hitObj: THREE.Object3D | null = intersects[0].object;
      while (hitObj && !hitObj.name.startsWith('Virus_') && hitObj.parent) {
        hitObj = hitObj.parent;
      }
      if (hitObj && hitObj.userData?.entity) {
        hitEntity = hitObj.userData.entity as VirusEntity;
      }
    } else if (virusMeshesArray.length > 0) {
      // For friendly classroom play: auto-target nearest virus if roughly aiming towards it!
      let nearestDist = 999;
      let nearestEntity: VirusEntity | null = null;
      virusMeshesRef.current.forEach((mesh) => {
        const dirToMesh = mesh.position.clone().sub(cameraRef.current!.position).normalize();
        const angle = _raycaster.ray.direction.angleTo(dirToMesh);
        if (angle < 0.35 && angle < nearestDist) {
          nearestDist = angle;
          nearestEntity = mesh.userData.entity as VirusEntity;
          hitPoint = mesh.position;
        }
      });
      if (nearestEntity) hitEntity = nearestEntity;
    }

    // Create Laser Beam Mesh
    const points = [origin, hitPoint];
    const laserGeo = new THREE.BufferGeometry().setFromPoints(points);
    const laserMat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      linewidth: 4,
      transparent: true,
      opacity: 1,
    });
    const laserLine = new THREE.Line(laserGeo, laserMat);
    sceneRef.current.add(laserLine);
    laserBeamsRef.current.push({ line: laserLine, life: 0.18 });

    // Handle Virus Destroyed
    if (hitEntity) {
      const targetEntity = hitEntity;
      const mesh = virusMeshesRef.current.get(targetEntity.id);
      if (mesh) {
        sceneRef.current.remove(mesh);
        virusMeshesRef.current.delete(targetEntity.id);
      }

      // Spawn procedural explosion particles
      const particleCount = 40;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(particleCount * 3);
      for (let k = 0; k < particleCount * 3; k += 3) {
        pPos[k] = hitPoint.x + (Math.random() - 0.5) * 0.2;
        pPos[k + 1] = hitPoint.y + (Math.random() - 0.5) * 0.2;
        pPos[k + 2] = hitPoint.z + (Math.random() - 0.5) * 0.2;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({
        color: targetEntity.color,
        size: 0.08,
        transparent: true,
        opacity: 1,
      });
      const pMesh = new THREE.Points(pGeo, pMat);
      sceneRef.current.add(pMesh);
      particlesRef.current.push({ mesh: pMesh, life: 0.35 });

      sound.playExplosion();
      onVirusDestroyed(targetEntity);

      if (virusMeshesRef.current.size === 0) {
        onAllVirusesCleared();
      }
    }
  }, [onVirusDestroyed, onAllVirusesCleared]);

  // Listen to laser counter triggers from HUD button
  useEffect(() => {
    if (laserTriggerCounter > 0) {
      shootLaser();
    }
  }, [laserTriggerCounter, shootLaser]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none bg-black">
      {/* 1. Real Phone Camera Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500 ${
          cameraActive && !isVirtualLabMode ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 2. Virtual Lab Background Fallback (High-tech Dark Grid Space) */}
      {isVirtualLabMode && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#030d17] via-[#051329] to-[#020712] z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,204,0.12)_0%,transparent_70%)]" />
        </div>
      )}

      {/* 3. Three.js WebGL Canvas (Transparent AR overlay) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 cursor-crosshair touch-none"
      />

      {/* Camera & Gyro Status Bar (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
        {/* Switch Virtual / AR mode */}
        <button
          onClick={onToggleVirtualLab}
          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-cyan-500/40 bg-slate-900/80 text-cyan-300 hover:bg-cyan-950/70 transition-colors flex items-center gap-1.5 shadow-lg"
          title="Ganti Mode Kamera AR / Simulasi 3D Virtual"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          {isVirtualLabMode ? 'Mode: Lab 3D' : 'Mode: AR Nyata'}
        </button>

        {/* Camera flip (if AR active) */}
        {!isVirtualLabMode && (
          <button
            onClick={toggleCameraFacing}
            className="p-1.5 text-xs font-semibold rounded-lg border border-cyan-500/40 bg-slate-900/80 text-cyan-300 hover:bg-cyan-950/70 transition-colors shadow-lg"
            title="Balik Kamera (Depan/Belakang)"
          >
            🔄 Kamera
          </button>
        )}

        {/* Gyro Sensor Calibration (for phones) */}
        <button
          onClick={gyroActive ? calibrateGyro : requestGyroscope}
          className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors shadow-lg flex items-center gap-1 ${
            gyroActive
              ? 'border-emerald-500/60 bg-emerald-950/80 text-emerald-300'
              : 'border-yellow-500/60 bg-yellow-950/80 text-yellow-300 hover:bg-yellow-900/70'
          }`}
          title="Aktifkan / Kalibrasi Sensor Gerak HP (Giroskop)"
        >
          <span>🎯</span>
          {gyroActive ? 'Kalibrasi Sensor' : 'Aktifkan Sensor HP'}
        </button>
      </div>

      {/* Camera error badge if any */}
      {cameraError && !isVirtualLabMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-amber-950/90 border border-amber-500/60 text-amber-200 text-xs rounded-lg text-center shadow-lg">
          {cameraError}
        </div>
      )}
    </div>
  );
};

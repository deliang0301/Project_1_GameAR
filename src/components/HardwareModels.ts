import * as THREE from 'three';

/**
 * Creates a procedural high-resolution PCB circuit texture on an HTML5 canvas.
 * Zero external image dependencies.
 */
function createPCBTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark cyber-green / teal substrate
  ctx.fillStyle = '#062620';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle grid mesh
  ctx.strokeStyle = '#0a3d34';
  ctx.lineWidth = 1;
  const step = 32;
  for (let x = 0; x <= 1024; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Golden / copper circuit traces
  ctx.strokeStyle = '#2fe6a4';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#00ffcc';
  ctx.shadowBlur = 4;

  const traceCount = 45;
  for (let i = 0; i < traceCount; i++) {
    ctx.beginPath();
    let cx = 100 + Math.random() * 824;
    let cy = 100 + Math.random() * 824;
    ctx.moveTo(cx, cy);

    for (let s = 0; s < 3; s++) {
      if (Math.random() > 0.5) {
        cx += (Math.random() - 0.5) * 120;
      } else {
        cy += (Math.random() - 0.5) * 120;
      }
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Solder joint / via dot
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Silk screen texts
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('CYBERQUEST B760-PRO // SMP KELAS 7', 80, 80);
  ctx.fillText('LGA-700 SOCKET // PCIE 5.0 // DUAL CHANNEL RAM', 80, 110);
  ctx.fillText('DESIGNED FOR INFORMATIKA AR', 80, 960);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates Motherboard Base 3D Group
 */
export function createMotherboardGroup(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'MotherboardBase';

  const pcbTex = createPCBTexture();

  // 1. Main PCB Board
  const pcbGeo = new THREE.BoxGeometry(3.6, 4.2, 0.12);
  const pcbMat = new THREE.MeshStandardMaterial({
    map: pcbTex,
    roughness: 0.35,
    metalness: 0.25,
  });
  const pcb = new THREE.Mesh(pcbGeo, pcbMat);
  group.add(pcb);

  // 2. CPU Socket (LGA Socket Housing + Lever)
  const socketBaseGeo = new THREE.BoxGeometry(1.1, 1.1, 0.14);
  const socketMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.5,
    metalness: 0.4,
  });
  const socketBase = new THREE.Mesh(socketBaseGeo, socketMat);
  socketBase.position.set(-0.6, 0.8, 0.08);
  group.add(socketBase);

  // Socket Gold Pin Grid Interior
  const pinGridGeo = new THREE.PlaneGeometry(0.85, 0.85);
  const pinMat = new THREE.MeshStandardMaterial({
    color: 0xdeb887,
    roughness: 0.2,
    metalness: 0.9,
  });
  const pinGrid = new THREE.Mesh(pinGridGeo, pinMat);
  pinGrid.position.set(-0.6, 0.8, 0.16);
  group.add(pinGrid);

  // Retention lever (metal rod)
  const leverGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8);
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
  const lever = new THREE.Mesh(leverGeo, metalMat);
  lever.rotation.z = Math.PI / 2;
  lever.position.set(-0.6, 0.18, 0.16);
  group.add(lever);

  // 3. RAM DIMM Slots (Slot 1 & Slot 2)
  for (let i = 0; i < 2; i++) {
    const slotX = 0.6 + i * 0.35;
    const ramSlotGeo = new THREE.BoxGeometry(0.18, 2.2, 0.18);
    const ramSlotMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 });
    const ramSlot = new THREE.Mesh(ramSlotGeo, ramSlotMat);
    ramSlot.position.set(slotX, 0.5, 0.08);
    group.add(ramSlot);

    // RAM retention clips (white/grey clips at ends)
    const clipGeo = new THREE.BoxGeometry(0.2, 0.1, 0.22);
    const clipMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af });
    const clipTop = new THREE.Mesh(clipGeo, clipMat);
    clipTop.position.set(slotX, 1.55, 0.12);
    const clipBtm = new THREE.Mesh(clipGeo, clipMat);
    clipBtm.position.set(slotX, -0.55, 0.12);
    group.add(clipTop, clipBtm);
  }

  // 4. PCIe x16 Slot (for GPU) with metallic reinforcement
  const pcieSlotGeo = new THREE.BoxGeometry(2.6, 0.22, 0.16);
  const pcieMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
  const pcieSlot = new THREE.Mesh(pcieSlotGeo, pcieMat);
  pcieSlot.position.set(-0.1, -0.9, 0.08);
  group.add(pcieSlot);

  // Silver metal shield over PCIe
  const pcieShieldGeo = new THREE.BoxGeometry(2.64, 0.24, 0.08);
  const pcieShieldMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.85, roughness: 0.2 });
  const pcieShield = new THREE.Mesh(pcieShieldGeo, pcieShieldMat);
  pcieShield.position.set(-0.1, -0.9, 0.14);
  group.add(pcieShield);

  // 5. M.2 NVMe SSD Slot
  const m2SlotGeo = new THREE.BoxGeometry(1.4, 0.28, 0.12);
  const m2Mat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const m2Slot = new THREE.Mesh(m2SlotGeo, m2Mat);
  m2Slot.position.set(-0.2, -0.2, 0.08);
  group.add(m2Slot);

  // M.2 Standoff screw (tiny gold cylinder)
  const standoffGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.14, 8);
  const standoffMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
  const standoff = new THREE.Mesh(standoffGeo, standoffMat);
  standoff.position.set(0.45, -0.2, 0.12);
  group.add(standoff);

  // 6. Chipset Heatsink (Metallic fin block)
  const heatsinkGeo = new THREE.BoxGeometry(0.8, 0.8, 0.25);
  const heatsinkMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    metalness: 0.8,
    roughness: 0.2,
  });
  const heatsink = new THREE.Mesh(heatsinkGeo, heatsinkMat);
  heatsink.position.set(0.9, -1.2, 0.18);
  group.add(heatsink);

  // 7. Motherboard Capacitors (Solid state cylinders)
  const capGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.25, 12);
  const capMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.7, roughness: 0.3 });
  for (let c = 0; c < 5; c++) {
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.rotation.x = Math.PI / 2;
    cap.position.set(-1.3, 0.4 + c * 0.25, 0.18);
    group.add(cap);
  }

  // 8. Rear I/O Shield block (USB, HDMI, LAN ports)
  const ioGeo = new THREE.BoxGeometry(0.35, 1.6, 0.4);
  const ioMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
  const ioBlock = new THREE.Mesh(ioGeo, ioMat);
  ioBlock.position.set(-1.6, 0.9, 0.22);
  group.add(ioBlock);

  // 9. RGB Glow Edge Line
  const rgbGeo = new THREE.BoxGeometry(0.06, 4.1, 0.04);
  const rgbMat = new THREE.MeshStandardMaterial({
    color: 0x00ffcc,
    emissive: 0x00ffcc,
    emissiveIntensity: 0.8,
  });
  const rgbLine = new THREE.Mesh(rgbGeo, rgbMat);
  rgbLine.position.set(1.75, 0, 0.07);
  group.add(rgbLine);

  return group;
}

/**
 * Creates CPU Model
 */
export function createCPUModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'CPU_Component';

  // 1. PCB Substrate (Greenish edge)
  const subGeo = new THREE.BoxGeometry(0.95, 0.95, 0.05);
  const subMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.4 });
  const substrate = new THREE.Mesh(subGeo, subMat);
  group.add(substrate);

  // 2. Nickel-plated Copper Heat Spreader (IHS)
  const ihsGeo = new THREE.BoxGeometry(0.82, 0.82, 0.1);
  const ihsMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.9,
    roughness: 0.15,
  });
  const ihs = new THREE.Mesh(ihsGeo, ihsMat);
  ihs.position.z = 0.06;
  group.add(ihs);

  // 3. Gold Triangle Indicator (corner pin 1)
  const goldIndGeo = new THREE.ConeGeometry(0.04, 0.02, 3);
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1 });
  const goldInd = new THREE.Mesh(goldIndGeo, goldMat);
  goldInd.position.set(-0.35, -0.35, 0.11);
  group.add(goldInd);

  return group;
}

/**
 * Creates RAM Model (DDR5 Module)
 */
export function createRAMModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'RAM_Component';

  // 1. Black/Cyan PCB stick
  const stickGeo = new THREE.BoxGeometry(0.1, 2.1, 0.35);
  const stickMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.3, roughness: 0.4 });
  const stick = new THREE.Mesh(stickGeo, stickMat);
  group.add(stick);

  // 2. Gold Contact Finger strip
  const goldFingerGeo = new THREE.BoxGeometry(0.11, 2.0, 0.08);
  const goldFingerMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.15 });
  const goldFinger = new THREE.Mesh(goldFingerGeo, goldFingerMat);
  goldFinger.position.z = -0.16;
  group.add(goldFinger);

  // 3. Black DRAM IC Chips (4 chips on front)
  const chipGeo = new THREE.BoxGeometry(0.04, 0.3, 0.18);
  const chipMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 });
  for (let i = 0; i < 4; i++) {
    const chip = new THREE.Mesh(chipGeo, chipMat);
    chip.position.set(0.06, -0.6 + i * 0.42, 0.02);
    group.add(chip);
  }

  // 4. Aluminum Heat Spreader Crest / RGB Bar on top
  const rgbBarGeo = new THREE.BoxGeometry(0.12, 2.12, 0.06);
  const rgbBarMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    emissive: 0xa855f7,
    emissiveIntensity: 0.7,
  });
  const rgbBar = new THREE.Mesh(rgbBarGeo, rgbBarMat);
  rgbBar.position.z = 0.18;
  group.add(rgbBar);

  return group;
}

/**
 * Creates GPU Model (Dedicated Graphics Card)
 */
export function createGPUModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'GPU_Component';

  // 1. GPU Main Shroud (Black cyberpunk cooler)
  const shroudGeo = new THREE.BoxGeometry(2.4, 0.5, 0.7);
  const shroudMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.6,
    roughness: 0.3,
  });
  const shroud = new THREE.Mesh(shroudGeo, shroudMat);
  group.add(shroud);

  // 2. Twin Cooling Fans
  for (let f = 0; f < 2; f++) {
    const fanRingGeo = new THREE.TorusGeometry(0.2, 0.025, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8, emissiveIntensity: 0.6 });
    const fanRing = new THREE.Mesh(fanRingGeo, ringMat);
    fanRing.position.set(-0.55 + f * 1.1, 0.25, 0);
    fanRing.rotation.x = Math.PI / 2;
    group.add(fanRing);

    // Fan blades
    const fanBladeGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.03, 7);
    const fanBladeMat = new THREE.MeshStandardMaterial({ color: 0x374151 });
    const fanBlade = new THREE.Mesh(fanBladeGeo, fanBladeMat);
    fanBlade.name = `GPUFanBlade_${f}`;
    fanBlade.position.set(-0.55 + f * 1.1, 0.25, 0);
    fanBlade.rotation.x = Math.PI / 2;
    group.add(fanBlade);
  }

  // 3. PCIe Gold Connector Tab (connects into motherboard)
  const pcieGoldGeo = new THREE.BoxGeometry(1.6, 0.08, 0.12);
  const pcieGoldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.15 });
  const pcieGold = new THREE.Mesh(pcieGoldGeo, pcieGoldMat);
  pcieGold.position.set(-0.1, -0.28, -0.3);
  group.add(pcieGold);

  // 4. Rear Metal Bracket (DisplayPort & HDMI ports)
  const bracketGeo = new THREE.BoxGeometry(0.08, 0.8, 0.75);
  const bracketMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
  const bracket = new THREE.Mesh(bracketGeo, bracketMat);
  bracket.position.set(-1.24, 0.1, 0);
  group.add(bracket);

  return group;
}

/**
 * Creates NVMe SSD M.2 Storage
 */
export function createSSDModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'SSD_Component';

  // 1. Black PCB
  const pcbGeo = new THREE.BoxGeometry(1.2, 0.24, 0.06);
  const pcbMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4 });
  const pcb = new THREE.Mesh(pcbGeo, pcbMat);
  group.add(pcb);

  // 2. Controller Chip & NAND Flash
  const nandGeo = new THREE.BoxGeometry(0.35, 0.18, 0.04);
  const nandMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.3 });
  const nand1 = new THREE.Mesh(nandGeo, nandMat);
  nand1.position.set(-0.2, 0, 0.04);
  const nand2 = new THREE.Mesh(nandGeo, nandMat);
  nand2.position.set(0.25, 0, 0.04);
  group.add(nand1, nand2);

  // 3. Gold Pins at insertion edge
  const pinsGeo = new THREE.BoxGeometry(0.12, 0.2, 0.02);
  const pinsMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
  const pins = new THREE.Mesh(pinsGeo, pinsMat);
  pins.position.set(-0.55, 0, 0);
  group.add(pins);

  // 4. Label Sticker
  const labelGeo = new THREE.PlaneGeometry(0.7, 0.14);
  const labelMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.4 });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.set(0.05, 0, 0.065);
  group.add(label);

  return group;
}

/**
 * Creates CPU RGB Cooler Fan Model
 */
export function createCoolerModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Cooler_Component';

  // 1. Aluminum Fin Stack (Square Radiator Block)
  const radiatorGeo = new THREE.BoxGeometry(1.05, 1.05, 0.5);
  const radiatorMat = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    metalness: 0.85,
    roughness: 0.25,
  });
  const radiator = new THREE.Mesh(radiatorGeo, radiatorMat);
  group.add(radiator);

  // 2. Glowing RGB Halo Ring
  const haloGeo = new THREE.TorusGeometry(0.42, 0.04, 12, 32);
  const haloMat = new THREE.MeshStandardMaterial({
    color: 0x00ffcc,
    emissive: 0x00ffcc,
    emissiveIntensity: 0.9,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.position.z = 0.28;
  group.add(halo);

  // 3. Fan Blade Assembly
  const fanHubGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.06, 16);
  const fanHubMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
  const fanHub = new THREE.Mesh(fanHubGeo, fanHubMat);
  fanHub.name = 'CoolerFanHub';
  fanHub.rotation.x = Math.PI / 2;
  fanHub.position.z = 0.27;

  // 7 Blades
  const bladeGeo = new THREE.BoxGeometry(0.08, 0.32, 0.02);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.4 });
  for (let b = 0; b < 7; b++) {
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    const angle = (b / 7) * Math.PI * 2;
    blade.position.set(Math.cos(angle) * 0.24, Math.sin(angle) * 0.24, 0);
    blade.rotation.z = angle + 0.3;
    fanHub.add(blade);
  }
  group.add(fanHub);

  return group;
}

/**
 * Creates PSU (Power Supply Unit)
 */
export function createPSUModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PSU_Component';

  // 1. Metal Box
  const boxGeo = new THREE.BoxGeometry(1.3, 0.9, 0.7);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
  const box = new THREE.Mesh(boxGeo, boxMat);
  group.add(box);

  // 2. Honeycomb Grill
  const grillGeo = new THREE.CircleGeometry(0.28, 16);
  const grillMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
  const grill = new THREE.Mesh(grillGeo, grillMat);
  grill.position.z = 0.36;
  group.add(grill);

  // 3. Power Spec Badge
  const badgeGeo = new THREE.PlaneGeometry(0.6, 0.3);
  const badgeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.3 });
  const badge = new THREE.Mesh(badgeGeo, badgeMat);
  badge.position.set(0, 0.46, 0);
  badge.rotation.x = -Math.PI / 2;
  group.add(badge);

  return group;
}

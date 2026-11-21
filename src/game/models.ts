import * as THREE from 'three';
import { ClassId, MonsterSpeciesId, RaceId, WorldMapId } from './types';
import { ProceduralTextureSet } from './textures';

/**
 * Todos los modelos procedurales usan jerarquías THREE.Group de 3-12+ piezas,
 * pivote en la base (y = 0) y variación de roughness/metalness.
 */

export function createMonsterModel(speciesId: MonsterSpeciesId): THREE.Group {
  const group = new THREE.Group();
  group.userData.parts = {};

  if (speciesId === 'goblin_merodeador') {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x5c8a38, roughness: 0.72, metalness: 0.05 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x4f3522, roughness: 0.85, metalness: 0.08 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xb7c2cc, roughness: 0.25, metalness: 0.88 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 1.5, roughness: 0.2 });

    // Legs
    const legGeo = new THREE.CapsuleGeometry(0.11, 0.35, 6, 8);
    const leftLeg = new THREE.Mesh(legGeo, skinMat);
    leftLeg.position.set(-0.18, 0.28, 0);
    const rightLeg = new THREE.Mesh(legGeo, skinMat);
    rightLeg.position.set(0.18, 0.28, 0);

    // Torso (leather jerkin)
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.62, 8), leatherMat);
    torso.position.y = 0.76;

    // Pauldrons
    const pauldronGeo = new THREE.SphereGeometry(0.16, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const lPauldron = new THREE.Mesh(pauldronGeo, leatherMat);
    lPauldron.position.set(-0.3, 1.0, 0);
    lPauldron.rotation.z = 0.4;
    const rPauldron = new THREE.Mesh(pauldronGeo, leatherMat);
    rPauldron.position.set(0.3, 1.0, 0);
    rPauldron.rotation.z = -0.4;

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), skinMat);
    head.position.y = 1.24;

    // Pointed Ears
    const earGeo = new THREE.ConeGeometry(0.07, 0.28, 6);
    const lEar = new THREE.Mesh(earGeo, skinMat);
    lEar.position.set(-0.26, 1.26, 0);
    lEar.rotation.z = 1.15;
    const rEar = new THREE.Mesh(earGeo, skinMat);
    rEar.position.set(0.26, 1.26, 0);
    rEar.rotation.z = -1.15;

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.position.set(-0.09, 1.27, 0.2);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.position.set(0.09, 1.27, 0.2);

    // Weapon Arm + Jagged Dagger
    const armGroup = new THREE.Group();
    armGroup.position.set(0.34, 0.92, 0.06);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.34, 6, 8), skinMat);
    arm.position.set(0, -0.15, 0.12);
    arm.rotation.x = Math.PI / 3;
    const dagger = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.48, 4), bladeMat);
    dagger.position.set(0, -0.18, 0.44);
    dagger.rotation.x = Math.PI / 2;
    armGroup.add(arm, dagger);

    group.add(leftLeg, rightLeg, torso, lPauldron, rPauldron, head, lEar, rEar, lEye, rEye, armGroup);
    group.userData.parts.weaponArm = armGroup;
  } else if (speciesId === 'esqueleto_centinela') {
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xd8d0be, roughness: 0.65, metalness: 0.08 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.32, metalness: 0.85 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 1.8 });

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.72, 8);
    const lLeg = new THREE.Mesh(legGeo, boneMat);
    lLeg.position.set(-0.16, 0.36, 0);
    const rLeg = new THREE.Mesh(legGeo, boneMat);
    rLeg.position.set(0.16, 0.36, 0);

    // Spine + Ribcage
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.75, 8), boneMat);
    spine.position.y = 1.05;
    for (let i = 0; i < 3; i++) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(0.2 - i * 0.02, 0.032, 6, 12), boneMat);
      rib.position.y = 1.24 - i * 0.13;
      rib.rotation.x = Math.PI / 2;
      group.add(rib);
    }

    // Skull + Iron Helm
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 10), boneMat);
    skull.position.y = 1.6;
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.235, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), ironMat);
    helm.position.y = 1.64;

    const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.038, 6, 6), eyeMat);
    lEye.position.set(-0.08, 1.59, 0.18);
    const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.038, 6, 6), eyeMat);
    rEye.position.set(0.08, 1.59, 0.18);

    // Shield on Left Arm
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.07, 8), ironMat);
    shield.rotation.x = Math.PI / 2;
    shield.rotation.z = 0.2;
    shield.position.set(-0.38, 1.15, 0.22);

    // Sword Arm
    const armGroup = new THREE.Group();
    armGroup.position.set(0.34, 1.32, 0.05);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.52, 6), boneMat);
    arm.position.set(0, -0.18, 0.16);
    arm.rotation.x = Math.PI / 3;
    const sword = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.85), ironMat);
    sword.position.set(0, -0.26, 0.58);
    armGroup.add(arm, sword);

    group.add(lLeg, rLeg, spine, skull, helm, lEye, rEye, shield, armGroup);
    group.userData.parts.weaponArm = armGroup;
  } else if (speciesId === 'espectro_velo') {
    const cloakMat = new THREE.MeshStandardMaterial({
      color: 0x2a1c42,
      roughness: 0.78,
      metalness: 0.15,
      emissive: 0x1e1136,
      emissiveIntensity: 0.6,
    });
    const maskMat = new THREE.MeshStandardMaterial({ color: 0xe2dcf5, roughness: 0.3, metalness: 0.55 });
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 2.2,
      roughness: 0.15,
    });

    const body = new THREE.Group();
    body.position.y = 0.4;

    // Tapered spectral robe
    const robe = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.55, 10, 1, true), cloakMat);
    robe.material.side = THREE.DoubleSide;
    robe.position.y = 0.85;

    // Hood & Mask
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), cloakMat);
    hood.position.y = 1.62;
    const mask = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.1, 0.28, 6), maskMat);
    mask.position.set(0, 1.6, 0.16);

    // Horns
    const hornGeo = new THREE.ConeGeometry(0.05, 0.32, 6);
    const lHorn = new THREE.Mesh(hornGeo, maskMat);
    lHorn.position.set(-0.15, 1.82, 0.08);
    lHorn.rotation.z = 0.35;
    const rHorn = new THREE.Mesh(hornGeo, maskMat);
    rHorn.position.set(0.15, 1.82, 0.08);
    rHorn.rotation.z = -0.35;

    // Glowing Eye Slits + Orbiting Wisps
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), glowMat);
    core.position.set(0, 1.15, 0.18);

    const wispRing = new THREE.Group();
    wispRing.position.y = 1.25;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const wisp = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), glowMat);
      wisp.position.set(Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55);
      wispRing.add(wisp);
    }

    body.add(robe, hood, mask, lHorn, rHorn, core, wispRing);
    group.add(body);
    group.userData.parts.floatBody = body;
    group.userData.parts.wispRing = wispRing;
  } else if (speciesId === 'golem_obsidiana') {
    const obsidianMat = new THREE.MeshStandardMaterial({ color: 0x1c1d24, roughness: 0.42, metalness: 0.48, flatShading: true });
    const magmaMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 2.3,
      roughness: 0.2,
    });

    // Heavy Legs
    const legGeo = new THREE.BoxGeometry(0.36, 0.78, 0.38);
    const lLeg = new THREE.Mesh(legGeo, obsidianMat);
    lLeg.position.set(-0.34, 0.39, 0);
    const rLeg = new THREE.Mesh(legGeo, obsidianMat);
    rLeg.position.set(0.34, 0.39, 0);

    // Massive Faceted Torso
    const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(0.68, 0), obsidianMat);
    torso.scale.set(1.15, 1.1, 0.85);
    torso.position.y = 1.32;

    // Glowing Molten Core
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), magmaMat);
    core.position.set(0, 1.32, 0.48);

    // Floating Rune Shoulders
    const shGeo = new THREE.OctahedronGeometry(0.32, 0);
    const lShoulder = new THREE.Mesh(shGeo, obsidianMat);
    lShoulder.position.set(-0.88, 1.72, 0);
    const rShoulder = new THREE.Mesh(shGeo, obsidianMat);
    rShoulder.position.set(0.88, 1.72, 0);

    // Head Monolith
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.46, 0.4), obsidianMat);
    head.position.y = 2.08;
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.06), magmaMat);
    visor.position.set(0, 2.1, 0.21);

    // Crushing Arm
    const armGroup = new THREE.Group();
    armGroup.position.set(0.85, 1.48, 0);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.95, 0.34), obsidianMat);
    arm.position.set(0, -0.42, 0.14);
    arm.rotation.x = -0.35;
    armGroup.add(arm);

    const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.95, 0.34), obsidianMat);
    lArm.position.set(-0.85, 1.06, 0.1);

    group.add(lLeg, rLeg, torso, core, lShoulder, rShoulder, head, visor, lArm, armGroup);
    group.userData.parts.weaponArm = armGroup;
  } else {
    // Wyvern de Ceniza & 5 Elemental Dragons (Bosses)
    const dragonPalettes: Record<
      string,
      { scale: number; wing: number; ember: number; emissive: number; size: number; ridge: number }
    > = {
      wyvern_ceniza: {
        scale: 0x3b1818,
        wing: 0x5c1d1d,
        ember: 0xfb923c,
        emissive: 0xef4444,
        size: 1.0,
        ridge: 0xf97316,
      },
      dragon_rojo_ardiente: {
        scale: 0x7f1d1d,
        wing: 0xb91c1c,
        ember: 0xfb923c,
        emissive: 0xef4444,
        size: 1.38,
        ridge: 0xf97316,
      },
      dragon_negro_oscuro: {
        scale: 0x18181b,
        wing: 0x3b0764,
        ember: 0xc084fc,
        emissive: 0x7e22ce,
        size: 1.42,
        ridge: 0xa855f7,
      },
      dragon_verde_espiritual: {
        scale: 0x064e3b,
        wing: 0x059669,
        ember: 0x6ee7b7,
        emissive: 0x10b981,
        size: 1.38,
        ridge: 0x34d399,
      },
      dragon_celeste_hielo: {
        scale: 0x0c4a6e,
        wing: 0x0284c7,
        ember: 0xbae6fd,
        emissive: 0x38bdf8,
        size: 1.42,
        ridge: 0x7dd3fc,
      },
      dragon_amarillo_divino: {
        scale: 0x713f12,
        wing: 0xca8a04,
        ember: 0xfef08a,
        emissive: 0xfacc15,
        size: 1.5,
        ridge: 0xfde047,
      },
    };
    const pal = dragonPalettes[speciesId] ?? dragonPalettes.wyvern_ceniza;

    const scaleMat = new THREE.MeshStandardMaterial({
      color: pal.scale,
      roughness: 0.42,
      metalness: 0.36,
      flatShading: true,
    });
    const wingMat = new THREE.MeshStandardMaterial({
      color: pal.wing,
      roughness: 0.65,
      metalness: 0.14,
      side: THREE.DoubleSide,
    });
    const emberMat = new THREE.MeshStandardMaterial({
      color: pal.ember,
      emissive: pal.emissive,
      emissiveIntensity: 2.3,
      roughness: 0.18,
    });

    const body = new THREE.Group();
    body.position.y = 0.2;
    body.scale.setScalar(pal.size);

    // Hind Legs
    const legGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.95, 7);
    const lLeg = new THREE.Mesh(legGeo, scaleMat);
    lLeg.position.set(-0.42, 0.48, -0.1);
    const rLeg = new THREE.Mesh(legGeo, scaleMat);
    rLeg.position.set(0.42, 0.48, -0.1);

    // Chest & Elemental Core Heart
    const chest = new THREE.Mesh(new THREE.DodecahedronGeometry(0.72, 0), scaleMat);
    chest.scale.set(0.95, 1.05, 1.45);
    chest.position.set(0, 1.38, 0);
    const emberChest = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), emberMat);
    emberChest.position.set(0, 1.36, 0.78);

    // Neck & Horned Dragon Head
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.9, 8), scaleMat);
    neck.position.set(0, 2.02, 0.62);
    neck.rotation.x = 0.48;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.4, 0.78), scaleMat);
    head.position.set(0, 2.42, 0.95);
    const lHorn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.58, 6), emberMat);
    lHorn.position.set(-0.2, 2.72, 0.7);
    lHorn.rotation.x = -0.6;
    const rHorn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.58, 6), emberMat);
    rHorn.position.set(0.2, 2.72, 0.7);
    rHorn.rotation.x = -0.6;

    // Dorsal Elemental Spikes for Elemental Dragons
    if (speciesId !== 'wyvern_ceniza') {
      for (let sIdx = 0; sIdx < 3; sIdx++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.36, 5), emberMat);
        spike.position.set(0, 1.98 - sIdx * 0.16, 0.15 - sIdx * 0.48);
        spike.rotation.x = -0.45;
        body.add(spike);
      }
      const auraLight = new THREE.PointLight(pal.ridge, 2.6, 12);
      auraLight.position.set(0, 1.8, 0.9);
      body.add(auraLight);
    }

    // Articulated Wings
    const wingGeo = new THREE.ConeGeometry(1.1, 2.1, 3);
    const lWing = new THREE.Mesh(wingGeo, wingMat);
    lWing.position.set(-1.35, 1.85, -0.15);
    lWing.rotation.z = 1.25;
    lWing.rotation.y = 0.25;
    const rWing = new THREE.Mesh(wingGeo, wingMat);
    rWing.position.set(1.35, 1.85, -0.15);
    rWing.rotation.z = -1.25;
    rWing.rotation.y = -0.25;

    // Spiked Tail
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.26, 1.9, 7), scaleMat);
    tail.position.set(0, 1.15, -1.45);
    tail.rotation.x = -Math.PI / 2.2;

    body.add(lLeg, rLeg, chest, emberChest, neck, head, lHorn, rHorn, lWing, rWing, tail);
    group.add(body);
    group.userData.parts.lWing = lWing;
    group.userData.parts.rWing = rWing;
    group.userData.parts.floatBody = body;
  }

  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return group;
}

export function createFirstPersonWeapon(): THREE.Group {
  const rig = new THREE.Group();

  // Right Hand Sword
  const swordGroup = new THREE.Group();
  swordGroup.position.set(0.42, -0.34, -0.62);
  swordGroup.rotation.set(0.18, -0.24, 0.14);

  const gripMat = new THREE.MeshStandardMaterial({ color: 0x452b1a, roughness: 0.85, metalness: 0.05 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4a44a, roughness: 0.28, metalness: 0.92 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xd9e1eb, roughness: 0.18, metalness: 0.94 });

  const pommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.032, 0), goldMat);
  pommel.position.y = -0.16;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.22, 8), gripMat);
  grip.position.y = -0.04;
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.032, 0.045), goldMat);
  guard.position.y = 0.08;
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.68, 0.014), steelMat);
  blade.position.y = 0.43;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.037, 0.13, 4), steelMat);
  tip.rotation.y = Math.PI / 4;
  tip.position.y = 0.83;

  swordGroup.add(pommel, grip, guard, blade, tip);

  // Left Hand Arcane Focus / Shield Rim
  const offhandGroup = new THREE.Group();
  offhandGroup.position.set(-0.46, -0.38, -0.58);
  offhandGroup.rotation.set(0.25, 0.45, -0.2);

  const shieldRim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.04, 8), goldMat);
  shieldRim.rotation.x = Math.PI / 2;
  const shieldCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.12, 0.045, 8),
    new THREE.MeshStandardMaterial({ color: 0x2c3545, roughness: 0.55, metalness: 0.45 })
  );
  shieldCore.rotation.x = Math.PI / 2;
  const arcaneGem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.045, 0),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.6, roughness: 0.15 })
  );
  arcaneGem.position.z = 0.03;

  offhandGroup.add(shieldRim, shieldCore, arcaneGem);

  rig.add(swordGroup, offhandGroup);
  rig.userData.swordGroup = swordGroup;
  rig.userData.offhandGroup = offhandGroup;
  return rig;
}

export function setMountRigVisual(
  group: THREE.Group,
  bodyHex: number,
  accentHex: number,
  crestHex: number
): void {
  const bodyMat = group.userData.bodyMat as THREE.MeshStandardMaterial | undefined;
  const accentMat = group.userData.accentMat as THREE.MeshStandardMaterial | undefined;
  const crestMat = group.userData.crestMat as THREE.MeshStandardMaterial | undefined;

  if (bodyMat) {
    bodyMat.color.setHex(bodyHex);
  }
  if (accentMat) {
    accentMat.color.setHex(accentHex);
    accentMat.emissive.setHex(accentHex);
    accentMat.emissiveIntensity = 0.28;
  }
  if (crestMat) {
    crestMat.color.setHex(crestHex);
  }
}

export function createFirstPersonMountRig(): THREE.Group {
  const rig = new THREE.Group();
  rig.position.set(0, -0.78, -0.92);

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.72, metalness: 0.08 });
  const crestMat = new THREE.MeshStandardMaterial({ color: 0x261a12, roughness: 0.88, metalness: 0.05 });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xd4a44a,
    emissive: 0xd4a44a,
    emissiveIntensity: 0.25,
    roughness: 0.3,
    metalness: 0.75,
  });
  const leatherMat = new THREE.MeshStandardMaterial({ color: 0x3b2618, roughness: 0.85, metalness: 0.06 });

  const headPivot = new THREE.Group();

  // Saddle pommel & neck base
  const pommel = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.18), leatherMat);
  pommel.position.set(0, 0.02, 0.34);
  const pommelCrest = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), accentMat);
  pommelCrest.position.set(0, 0.1, 0.34);

  // Muscular neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.56, 8), bodyMat);
  neck.position.set(0, 0.16, 0.06);
  neck.rotation.x = 0.52;

  // Mane ridge / dorsal crest
  const mane = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.44, 0.12), crestMat);
  mane.position.set(0, 0.22, 0.14);
  mane.rotation.x = 0.52;

  // Head & muzzle
  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.19, 0.34), bodyMat);
  skull.position.set(0, 0.36, -0.18);
  skull.rotation.x = 0.32;
  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.13, 0.22), bodyMat);
  muzzle.position.set(0, 0.3, -0.38);
  muzzle.rotation.x = 0.44;

  // Bridle strap & metallic bit
  const bridle = new THREE.Mesh(new THREE.BoxGeometry(0.235, 0.05, 0.18), accentMat);
  bridle.position.set(0, 0.35, -0.22);
  bridle.rotation.x = 0.32;

  // Ears / Horns
  const earGeo = new THREE.ConeGeometry(0.042, 0.15, 5);
  const lEar = new THREE.Mesh(earGeo, crestMat);
  lEar.position.set(-0.08, 0.49, -0.1);
  lEar.rotation.z = 0.22;
  lEar.rotation.x = -0.15;
  const rEar = new THREE.Mesh(earGeo, crestMat);
  rEar.position.set(0.08, 0.49, -0.1);
  rEar.rotation.z = -0.22;
  rEar.rotation.x = -0.15;

  // Reins stretching back toward rider hands
  const reinGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.62, 6);
  const lRein = new THREE.Mesh(reinGeo, leatherMat);
  lRein.position.set(-0.14, 0.2, 0.08);
  lRein.rotation.set(1.22, 0, -0.15);
  const rRein = new THREE.Mesh(reinGeo, leatherMat);
  rRein.position.set(0.14, 0.2, 0.08);
  rRein.rotation.set(1.22, 0, 0.15);

  headPivot.add(pommel, pommelCrest, neck, mane, skull, muzzle, bridle, lEar, rEar, lRein, rRein);
  rig.add(headPivot);

  rig.userData.headPivot = headPivot;
  rig.userData.bodyMat = bodyMat;
  rig.userData.accentMat = accentMat;
  rig.userData.crestMat = crestMat;
  rig.visible = false;
  return rig;
}

export function createChestModel(textures: ProceduralTextureSet): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ map: textures.woodColor, roughness: 0.78, metalness: 0.05 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xc59338, roughness: 0.3, metalness: 0.88 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.52, 0.72), woodMat);
  base.position.y = 0.26;
  const bandL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.54, 0.75), brassMat);
  bandL.position.set(-0.38, 0.27, 0);
  const bandR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.54, 0.75), brassMat);
  bandR.position.set(0.38, 0.27, 0);
  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.06), brassMat);
  lock.position.set(0, 0.42, 0.38);

  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.52, -0.35);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.1, 10, 1, false, 0, Math.PI), woodMat);
  lid.rotation.z = Math.PI / 2;
  lid.position.set(0, 0, 0.35);
  lidPivot.add(lid);

  group.add(base, bandL, bandR, lock, lidPivot);
  group.userData.lidPivot = lidPivot;
  group.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
}

export function setShrineVisualState(group: THREE.Group, discovered: boolean): void {
  const crystalMat = group.userData.crystalMat as THREE.MeshStandardMaterial | undefined;
  const runeRingMat = group.userData.runeRingMat as THREE.MeshBasicMaterial | undefined;
  const haloMat = group.userData.haloMat as THREE.MeshStandardMaterial | undefined;
  const light = group.userData.light as THREE.PointLight | undefined;

  group.userData.discovered = discovered;
  if (crystalMat) {
    crystalMat.color.setHex(discovered ? 0x38bdf8 : 0x64748b);
    crystalMat.emissive.setHex(discovered ? 0x0ea5e9 : 0x334155);
    crystalMat.emissiveIntensity = discovered ? 2.1 : 0.35;
  }
  if (runeRingMat) {
    runeRingMat.color.setHex(discovered ? 0x7dd3fc : 0x64748b);
    runeRingMat.opacity = discovered ? 0.82 : 0.22;
  }
  if (haloMat) {
    haloMat.color.setHex(discovered ? 0x7dd3fc : 0x475569);
    haloMat.emissive.setHex(discovered ? 0x0284c7 : 0x1e293b);
    haloMat.emissiveIntensity = discovered ? 1.4 : 0.2;
  }
  if (light) {
    light.intensity = discovered ? 4.6 : 0.85;
    light.distance = discovered ? 15 : 7;
  }
}

export function createShrineModel(
  textures: ProceduralTextureSet,
  discovered = true
): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.stoneColor,
    bumpMap: textures.stoneBump,
    bumpScale: 0.04,
    roughness: 0.84,
    metalness: 0.06,
  });
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0xc59338,
    roughness: 0.28,
    metalness: 0.86,
  });
  const crystalMat = new THREE.MeshStandardMaterial({
    color: discovered ? 0x38bdf8 : 0x64748b,
    emissive: discovered ? 0x0ea5e9 : 0x334155,
    emissiveIntensity: discovered ? 2.1 : 0.35,
    roughness: 0.14,
    metalness: 0.22,
  });
  const haloMat = new THREE.MeshStandardMaterial({
    color: discovered ? 0x7dd3fc : 0x475569,
    emissive: discovered ? 0x0284c7 : 0x1e293b,
    emissiveIntensity: discovered ? 1.4 : 0.2,
    roughness: 0.22,
    metalness: 0.72,
  });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.48, 0.36, 8), stoneMat);
  plinth.position.y = 0.18;
  const plinthTrim = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.18, 0.08, 8), bronzeMat);
  plinthTrim.position.y = 0.38;

  const altar = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.72, 1.12, 8), stoneMat);
  altar.position.y = 0.94;
  const capRing = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.56, 0.1, 8), bronzeMat);
  capRing.position.y = 1.52;

  // Flanking bronze obelisk fins
  for (const side of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.25, 0.22), stoneMat);
    fin.position.set(side * 0.85, 0.95, 0);
    fin.rotation.z = side * -0.14;
    const finCap = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), bronzeMat);
    finCap.position.set(side * 0.93, 1.62, 0);
    group.add(fin, finCap);
  }

  const runeRingMat = new THREE.MeshBasicMaterial({
    map: textures.runeEmissive,
    color: discovered ? 0x7dd3fc : 0x64748b,
    transparent: true,
    opacity: discovered ? 0.82 : 0.22,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const runeRing = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 3.3), runeRingMat);
  runeRing.rotation.x = -Math.PI / 2;
  runeRing.position.y = 0.03;

  const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.038, 8, 24), haloMat);
  haloRing.rotation.x = Math.PI / 2.2;
  haloRing.position.y = 2.18;

  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), crystalMat);
  crystal.position.y = 2.2;

  const light = new THREE.PointLight(0x38bdf8, discovered ? 4.6 : 0.85, discovered ? 15 : 7);
  light.position.y = 2.3;

  group.add(plinth, plinthTrim, altar, capRing, runeRing, haloRing, crystal, light);
  group.userData.crystal = crystal;
  group.userData.runeRing = runeRing;
  group.userData.haloRing = haloRing;
  group.userData.crystalMat = crystalMat;
  group.userData.runeRingMat = runeRingMat;
  group.userData.haloMat = haloMat;
  group.userData.light = light;
  group.userData.discovered = discovered;
  return group;
}

export function createArchivistNpcModel(): THREE.Group {
  const group = new THREE.Group();
  const robeMat = new THREE.MeshStandardMaterial({ color: 0x24344d, roughness: 0.82, metalness: 0.08 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xd4a44a, roughness: 0.35, metalness: 0.78 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd6b497, roughness: 0.68, metalness: 0.04 });
  const lanternMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 2.2 });

  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.44, 1.38, 10), robeMat);
  robe.position.y = 0.69;
  const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.29, 0.16, 10), trimMat);
  sash.position.y = 0.98;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 10), skinMat);
  head.position.y = 1.56;
  const hood = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.42, 10), robeMat);
  hood.position.set(0, 1.72, -0.02);

  // Staff + Lantern
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 1.85, 8), trimMat);
  staff.position.set(0.42, 0.93, 0.14);
  const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), lanternMat);
  lantern.position.set(0.42, 1.92, 0.14);
  const tome = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.32), trimMat);
  tome.position.set(-0.32, 1.05, 0.25);
  tome.rotation.x = 0.4;

  const npcLight = new THREE.PointLight(0xfbbf24, 3.2, 10);
  npcLight.position.set(0.42, 1.95, 0.2);

  group.add(robe, sash, head, hood, staff, lantern, tome, npcLight);
  group.userData.lanternLight = npcLight;
  group.userData.lanternMat = lanternMat;
  group.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
}

export function createRuinPillar(textures: ProceduralTextureSet, height: number, withBrazier = false): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.stoneColor,
    bumpMap: textures.stoneBump,
    bumpScale: 0.05,
    roughness: 0.86,
    metalness: 0.05,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.45, 1.75), stoneMat);
  base.position.y = 0.225;
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.32, height, 1.32), stoneMat);
  shaft.position.y = 0.45 + height / 2;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.35, 1.68), stoneMat);
  cap.position.y = 0.45 + height + 0.175;

  group.add(base, shaft, cap);

  if (withBrazier) {
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.26, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0x3b3d42, roughness: 0.4, metalness: 0.8 })
    );
    bowl.position.y = 0.45 + height + 0.52;
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.58, 6),
      new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 2.5 })
    );
    flame.position.y = 0.45 + height + 0.86;
    const torchLight = new THREE.PointLight(0xf97316, 6.5, 18);
    torchLight.position.y = 0.45 + height + 1.1;
    group.add(bowl, flame, torchLight);
    group.userData.flame = flame;
    group.userData.torchLight = torchLight;
  }

  group.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
}

export function createGateModel(textures: ProceduralTextureSet): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.stoneColor,
    bumpMap: textures.stoneBump,
    bumpScale: 0.05,
    roughness: 0.86,
    metalness: 0.05,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.woodColor,
    roughness: 0.78,
    metalness: 0.08,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x3b424d,
    roughness: 0.32,
    metalness: 0.85,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc59338,
    roughness: 0.28,
    metalness: 0.9,
  });

  // Stone Archway Frame
  const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.95, 4.2, 1.1), stoneMat);
  leftPost.position.set(-2.35, 2.1, 0);
  const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.95, 4.2, 1.1), stoneMat);
  rightPost.position.set(2.35, 2.1, 0);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.85, 1.25), stoneMat);
  lintel.position.set(0, 4.4, 0);

  // Left Door Leaf (pivots at x = -1.85)
  const leftPivot = new THREE.Group();
  leftPivot.position.set(-1.85, 0, 0);
  const leftLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.82, 3.85, 0.22), woodMat);
  leftLeaf.position.set(0.91, 1.925, 0);
  const leftBrace = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.22, 0.26), ironMat);
  leftBrace.position.set(0.91, 1.1, 0);
  const leftRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 12), brassMat);
  leftRing.position.set(1.55, 1.8, 0.14);
  leftPivot.add(leftLeaf, leftBrace, leftRing);

  // Right Door Leaf (pivots at x = +1.85)
  const rightPivot = new THREE.Group();
  rightPivot.position.set(1.85, 0, 0);
  const rightLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.82, 3.85, 0.22), woodMat);
  rightLeaf.position.set(-0.91, 1.925, 0);
  const rightBrace = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.22, 0.26), ironMat);
  rightBrace.position.set(-0.91, 1.1, 0);
  const rightRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 12), brassMat);
  rightRing.position.set(-1.55, 1.8, 0.14);
  rightPivot.add(rightLeaf, rightBrace, rightRing);

  group.add(leftPost, rightPost, lintel, leftPivot, rightPivot);
  group.userData.leftPivot = leftPivot;
  group.userData.rightPivot = rightPivot;

  group.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
}

export function createMerchantNpcModel(textures: ProceduralTextureSet): THREE.Group {
  const group = new THREE.Group();
  const coatMat = new THREE.MeshStandardMaterial({ color: 0x5c2d1f, roughness: 0.82, metalness: 0.06 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xd4a44a, roughness: 0.35, metalness: 0.78 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9b391, roughness: 0.68, metalness: 0.04 });
  const woodMat = new THREE.MeshStandardMaterial({ map: textures.woodColor, roughness: 0.82, metalness: 0.06 });
  const lanternMat = new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 1.9 });

  // Merchant body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.42, 1.32, 10), coatMat);
  body.position.y = 0.66;
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.14, 10), trimMat);
  belt.position.y = 0.94;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 10), skinMat);
  head.position.y = 1.5;
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.05, 10), coatMat);
  hatBrim.position.y = 1.66;
  const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.22, 10), coatMat);
  hatCrown.position.y = 1.78;

  // Wooden trade crate beside merchant
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.68, 0.55), woodMat);
  crate.position.set(0.68, 0.34, 0.18);
  const potionBottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, 0.24, 8),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.9, roughness: 0.2 })
  );
  potionBottle.position.set(0.56, 0.8, 0.18);
  const coinBag = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), trimMat);
  coinBag.position.set(0.82, 0.78, 0.22);

  // Emerald merchant lantern
  const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), lanternMat);
  lantern.position.set(-0.4, 1.48, 0.25);
  const light = new THREE.PointLight(0x34d399, 2.8, 9);
  light.position.set(-0.4, 1.52, 0.25);

  group.add(body, belt, head, hatBrim, hatCrown, crate, potionBottle, coinBag, lantern, light);
  group.userData.lanternLight = light;
  group.userData.lanternMat = lanternMat;
  group.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
}

export function setLoreRelicVisualState(group: THREE.Group, discovered: boolean): void {
  const gemMat = group.userData.gemMat as THREE.MeshStandardMaterial | undefined;
  const light = group.userData.light as THREE.PointLight | undefined;
  group.userData.discovered = discovered;
  if (gemMat) {
    gemMat.color.setHex(discovered ? 0x34d399 : 0xfbbf24);
    gemMat.emissive.setHex(discovered ? 0x059669 : 0xd97706);
    gemMat.emissiveIntensity = discovered ? 0.65 : 1.75;
  }
  if (light) {
    light.color.setHex(discovered ? 0x34d399 : 0xfbbf24);
    light.intensity = discovered ? 1.1 : 2.6;
  }
}

export function createLoreRelicModel(
  textures: ProceduralTextureSet,
  discovered = false
): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.stoneColor,
    bumpMap: textures.stoneBump,
    bumpScale: 0.04,
    roughness: 0.85,
    metalness: 0.05,
  });
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0xc59338,
    roughness: 0.28,
    metalness: 0.86,
  });
  const parchmentMat = new THREE.MeshStandardMaterial({
    color: 0xe7d8b9,
    roughness: 0.9,
    metalness: 0.02,
  });
  const gemMat = new THREE.MeshStandardMaterial({
    color: discovered ? 0x34d399 : 0xfbbf24,
    emissive: discovered ? 0x059669 : 0xd97706,
    emissiveIntensity: discovered ? 0.65 : 1.75,
    roughness: 0.16,
    metalness: 0.2,
  });

  // 5-part composite lectern + open tome/tablet + floating lore sigil
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.68, 0.22, 6), stoneMat);
  base.position.y = 0.11;
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.88, 6), stoneMat);
  column.position.y = 0.66;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.25, 0.1, 6), bronzeMat);
  collar.position.y = 1.12;

  const lecternPlate = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.06, 0.48), bronzeMat);
  lecternPlate.position.set(0, 1.2, 0);
  lecternPlate.rotation.x = 0.34;

  const tome = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.07, 0.36), parchmentMat);
  tome.position.set(0, 1.25, 0.01);
  tome.rotation.x = 0.34;

  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), gemMat);
  gem.position.set(0, 1.62, 0);

  const light = new THREE.PointLight(discovered ? 0x34d399 : 0xfbbf24, discovered ? 1.1 : 2.6, 8);
  light.position.set(0, 1.7, 0);

  group.add(base, column, collar, lecternPlate, tome, gem, light);
  group.userData.gem = gem;
  group.userData.gemMat = gemMat;
  group.userData.light = light;
  group.userData.discovered = discovered;

  group.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
}

export function setClanNpcVisualState(
  group: THREE.Group,
  rescued: boolean,
  invited: boolean,
  role: 'ninguno' | 'guardia' | 'alquimista' | 'historiador'
): void {
  const beaconMat = group.userData.beaconMat as THREE.MeshBasicMaterial | undefined;
  const lanternMat = group.userData.lanternMat as THREE.MeshStandardMaterial | undefined;
  const light = group.userData.lanternLight as THREE.PointLight | undefined;

  const roleColor =
    role === 'guardia'
      ? 0xf59e0b
      : role === 'alquimista'
      ? 0x34d399
      : role === 'historiador'
      ? 0x38bdf8
      : invited
      ? 0xfde68a
      : rescued
      ? 0x34d399
      : 0x38bdf8;

  if (beaconMat) {
    beaconMat.color.setHex(roleColor);
    beaconMat.opacity = invited ? 0.35 : rescued ? 0.25 : 0.72;
  }
  if (lanternMat) {
    lanternMat.color.setHex(roleColor);
    lanternMat.emissive.setHex(roleColor);
    lanternMat.emissiveIntensity = invited ? 1.8 : rescued ? 1.4 : 2.3;
  }
  if (light) {
    light.color.setHex(roleColor);
    light.intensity = invited ? 2.6 : 3.2;
  }
}

export function createClanNpcModel(cloakHex: number, accentHex: number): THREE.Group {
  const group = new THREE.Group();
  const cloakMat = new THREE.MeshStandardMaterial({ color: cloakHex, roughness: 0.78, metalness: 0.08 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe2bfa0, roughness: 0.65, metalness: 0.03 });
  const accentMat = new THREE.MeshStandardMaterial({ color: accentHex, roughness: 0.35, metalness: 0.6 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.8, metalness: 0.05 });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 2.2,
    roughness: 0.15,
  });

  // Ground Rescue / Role Beacon Ring
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });
  const beaconRing = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.84, 24), beaconMat);
  beaconRing.rotation.x = -Math.PI / 2;
  beaconRing.position.y = 0.04;

  // Body & Cloak
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.39, 1.32, 10), cloakMat);
  body.position.y = 0.66;
  const shoulderWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.24, 10), accentMat);
  shoulderWrap.position.y = 1.24;

  // Head & Traveler Hood
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.185, 10, 10), skinMat);
  head.position.y = 1.5;
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.56), cloakMat);
  hood.position.set(0, 1.54, -0.02);
  hood.rotation.x = -0.18;

  // Staff + Beacon Lantern
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 1.75, 8), woodMat);
  staff.position.set(0.38, 0.88, 0.16);
  const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), lanternMat);
  lantern.position.set(0.38, 1.82, 0.16);

  const lanternLight = new THREE.PointLight(0x38bdf8, 3.0, 10);
  lanternLight.position.set(0.38, 1.86, 0.2);

  group.add(beaconRing, body, shoulderWrap, head, hood, staff, lantern, lanternLight);
  group.userData.beaconRing = beaconRing;
  group.userData.beaconMat = beaconMat;
  group.userData.lanternMat = lanternMat;
  group.userData.lanternLight = lanternLight;

  group.traverse((c) => {
    if ((c as THREE.Mesh).isMesh && c !== beaconRing) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
}

export function createHerbNodeModel(colorHex: number): THREE.Group {
  const group = new THREE.Group();
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x1e5b34,
    roughness: 0.72,
    metalness: 0.04,
  });
  const blossomMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 1.45,
    roughness: 0.22,
    metalness: 0.15,
  });

  // Mound of botanical stems & glowing alchemical blossom/extract crystal
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.35;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.45, 5), leafMat);
    leaf.position.set(Math.cos(a) * 0.18, 0.2, Math.sin(a) * 0.18);
    leaf.rotation.z = -Math.cos(a) * 0.45;
    leaf.rotation.x = Math.sin(a) * 0.45;
    group.add(leaf);
  }

  const blossom = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), blossomMat);
  blossom.position.y = 0.44;
  const light = new THREE.PointLight(colorHex, 1.45, 5.5);
  light.position.y = 0.55;

  group.add(blossom, light);
  group.userData.blossom = blossom;
  group.userData.light = light;
  return group;
}

export function createDimensionalPortalModel(
  destination: WorldMapId,
  textures: ProceduralTextureSet
): THREE.Group {
  const group = new THREE.Group();
  const isToTemple = destination === 'templo';
  const primaryHex = isToTemple ? 0x38bdf8 : 0xfbbf24;
  const secondaryHex = isToTemple ? 0x818cf8 : 0xf97316;

  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.stoneColor,
    bumpMap: textures.stoneBump,
    bumpScale: 0.04,
    roughness: 0.82,
    metalness: 0.1,
  });
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0xc59338,
    roughness: 0.28,
    metalness: 0.86,
  });
  const runeMat = new THREE.MeshStandardMaterial({
    color: primaryHex,
    emissive: primaryHex,
    emissiveIntensity: 2.2,
    roughness: 0.16,
    metalness: 0.3,
  });
  const vortexMat = new THREE.MeshBasicMaterial({
    color: secondaryHex,
    transparent: true,
    opacity: 0.68,
    side: THREE.DoubleSide,
  });

  // Stepped portal dais
  const daisLower = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 3.0, 0.24, 16), stoneMat);
  daisLower.position.y = 0.12;
  const daisUpper = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.18, 16), stoneMat);
  daisUpper.position.y = 0.32;

  // Twin side rune pillars + arched lintel
  const lPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 4.2, 8), stoneMat);
  lPillar.position.set(-1.65, 2.35, 0);
  const rPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 4.2, 8), stoneMat);
  rPillar.position.set(1.65, 2.35, 0);

  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(1.65, 0.22, 10, 24, Math.PI),
    bronzeMat
  );
  arch.position.set(0, 3.85, 0);

  // Swirling inner dimensional ring & portal surface
  const runeRing = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.08, 8, 32), runeMat);
  runeRing.position.set(0, 2.45, 0);

  const vortexDisc = new THREE.Mesh(new THREE.CircleGeometry(1.36, 28), vortexMat);
  vortexDisc.position.set(0, 2.45, 0);

  const crestOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), runeMat);
  crestOrb.position.set(0, 5.65, 0);

  const light = new THREE.PointLight(primaryHex, 4.2, 16);
  light.position.set(0, 2.6, 0.6);

  group.add(
    daisLower,
    daisUpper,
    lPillar,
    rPillar,
    arch,
    runeRing,
    vortexDisc,
    crestOrb,
    light
  );
  group.userData.runeRing = runeRing;
  group.userData.vortexDisc = vortexDisc;
  group.userData.crestOrb = crestOrb;
  group.userData.portalLight = light;

  group.traverse((c) => {
    if ((c as THREE.Mesh).isMesh && c !== vortexDisc) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
}

export function createPlazaFountainModel(textures: ProceduralTextureSet): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.stoneColor,
    bumpMap: textures.stoneBump,
    bumpScale: 0.03,
    roughness: 0.78,
    metalness: 0.08,
  });
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0xd4af5f,
    roughness: 0.28,
    metalness: 0.85,
  });
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.85,
    roughness: 0.14,
    metalness: 0.25,
    transparent: true,
    opacity: 0.88,
  });
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.8,
    roughness: 0.15,
  });

  const rim = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.7, 0.65, 24), stoneMat);
  rim.position.y = 0.32;
  const water = new THREE.Mesh(new THREE.CylinderGeometry(3.05, 3.05, 0.12, 24), waterMat);
  water.position.y = 0.62;
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.95, 1.75, 10), stoneMat);
  pedestal.position.y = 1.25;
  const upperBowl = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 0.65, 0.36, 16), bronzeMat);
  upperBowl.position.y = 2.15;
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.36, 1.3, 8), stoneMat);
  spire.position.y = 2.9;
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), crystalMat);
  crystal.position.y = 3.85;
  const light = new THREE.PointLight(0x7dd3fc, 3.0, 18);
  light.position.y = 3.6;

  group.add(rim, water, pedestal, upperBowl, spire, crystal, light);
  group.userData.crystal = crystal;
  group.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
}

export function createPlazaBannerModel(colorHex: number): THREE.Group {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x3b281c, roughness: 0.72, metalness: 0.2 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af5f, roughness: 0.25, metalness: 0.88 });
  const clothMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.18,
    roughness: 0.82,
    side: THREE.DoubleSide,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 0.3, 8), goldMat);
  base.position.y = 0.15;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.4, 8), poleMat);
  pole.position.y = 2.2;
  const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.15, 6), goldMat);
  crossbar.rotation.z = Math.PI / 2;
  crossbar.position.set(0, 4.05, 0.15);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 2.2), clothMat);
  cloth.position.set(0, 2.9, 0.18);
  const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), goldMat);
  finial.position.y = 4.52;

  group.add(base, pole, crossbar, cloth, finial);
  group.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
}

export function createPlazaLampPostModel(textures: ProceduralTextureSet): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.stoneColor,
    roughness: 0.85,
  });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x262932, roughness: 0.35, metalness: 0.82 });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xfde68a,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.1,
    roughness: 0.15,
  });

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), stoneMat);
  plinth.position.y = 0.27;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.0, 8), ironMat);
  post.position.y = 2.0;
  const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), glowMat);
  lantern.position.y = 3.62;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.25, 6), ironMat);
  cap.position.y = 3.88;
  const light = new THREE.PointLight(0xfbbf24, 2.4, 13);
  light.position.y = 3.62;

  group.add(plinth, post, lantern, cap, light);
  group.userData.lampLight = light;
  return group;
}

export function createTempleWardObeliskModel(textures: ProceduralTextureSet): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.stoneColor,
    bumpMap: textures.stoneBump,
    bumpScale: 0.03,
    roughness: 0.84,
  });
  const wardMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 1.9,
    roughness: 0.2,
  });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.54, 0.3, 6), stoneMat);
  plinth.position.y = 0.15;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.9, 6), stoneMat);
  shaft.position.y = 1.25;
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), wardMat);
  crystal.position.y = 2.45;
  const light = new THREE.PointLight(0x34d399, 1.8, 8);
  light.position.y = 2.45;

  group.add(plinth, shaft, crystal, light);
  group.userData.crystal = crystal;
  return group;
}

function drawRemoteNameplateCanvas(
  canvas: HTMLCanvasElement,
  playerName: string,
  clanTag: string,
  clanColor: string,
  level: number,
  rebirths: number
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Clean high-contrast pill-free nameplate banner
  ctx.fillStyle = 'rgba(11, 14, 22, 0.86)';
  ctx.strokeStyle = clanColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(10, 12, w - 20, h - 24, 14);
  ctx.fill();
  ctx.stroke();

  // Top line: [CLAN] PlayerName
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tagText = `[${clanTag}] `;
  const nameText = playerName;
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  const tagWidth = ctx.measureText(tagText).width;
  const nameWidth = ctx.measureText(nameText).width;
  const totalW = tagWidth + nameWidth;
  const startX = w / 2 - totalW / 2;

  ctx.textAlign = 'left';
  ctx.fillStyle = clanColor;
  ctx.fillText(tagText, startX, 46);
  ctx.fillStyle = '#f3e6c8';
  ctx.fillText(nameText, startX + tagWidth, 46);

  // Subline: Level & Rebirths
  ctx.textAlign = 'center';
  ctx.font = '600 20px monospace';
  ctx.fillStyle = '#cbd5e1';
  const sub = rebirths > 0 ? `Nv. ${level} · R${rebirths}` : `Nv. ${level}`;
  ctx.fillText(sub, w / 2, 82);
}

export function updateRemoteHeroNameplate(
  group: THREE.Group,
  playerName: string,
  clanTag: string,
  clanColor: string,
  level: number,
  rebirths: number
): void {
  const key = `${playerName}|${clanTag}|${clanColor}|${level}|${rebirths}`;
  if (group.userData.plateKey === key) return;
  group.userData.plateKey = key;

  const canvas = group.userData.plateCanvas as HTMLCanvasElement | undefined;
  const tex = group.userData.plateTexture as THREE.CanvasTexture | undefined;
  const capeMat = group.userData.capeMat as THREE.MeshStandardMaterial | undefined;
  const crestMat = group.userData.crestMat as THREE.MeshStandardMaterial | undefined;

  if (canvas && tex) {
    drawRemoteNameplateCanvas(canvas, playerName, clanTag, clanColor, level, rebirths);
    tex.needsUpdate = true;
  }
  const parsedHex = parseInt(clanColor.replace('#', ''), 16);
  if (!Number.isNaN(parsedHex)) {
    if (capeMat) {
      capeMat.color.setHex(parsedHex);
      capeMat.emissive.setHex(parsedHex);
    }
    if (crestMat) {
      crestMat.color.setHex(parsedHex);
      crestMat.emissive.setHex(parsedHex);
    }
  }
}

export function createRemoteHeroModel(
  raceId: RaceId,
  classId: ClassId,
  clanColor: string,
  playerName: string,
  clanTag: string,
  level: number,
  rebirths: number
): THREE.Group {
  const group = new THREE.Group();
  const clanHex = parseInt(clanColor.replace('#', ''), 16) || 0xd4af5f;

  const raceSkinMap: Record<RaceId, number> = {
    humano: 0xe2bfa0,
    elfo: 0xdbeafe,
    enano: 0xd9a982,
    draconido: 0x991b1b,
    espectro_raza: 0x6d28d9,
  };
  const classArmorMap: Record<ClassId, number> = {
    caballero_runico: 0x475569,
    piromago: 0x7c2d12,
    asesino_sombras: 0x1e293b,
    paladin_solar: 0x92400e,
    cazador_dragones: 0x7f1d1d,
  };

  const skinMat = new THREE.MeshStandardMaterial({
    color: raceSkinMap[raceId] ?? 0xe2bfa0,
    roughness: 0.65,
  });
  const armorMat = new THREE.MeshStandardMaterial({
    color: classArmorMap[classId] ?? 0x334155,
    roughness: 0.42,
    metalness: 0.45,
  });
  const capeMat = new THREE.MeshStandardMaterial({
    color: clanHex,
    emissive: clanHex,
    emissiveIntensity: 0.25,
    roughness: 0.72,
    side: THREE.DoubleSide,
  });
  const crestMat = new THREE.MeshStandardMaterial({
    color: clanHex,
    emissive: clanHex,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.2,
    metalness: 0.88,
  });

  const bodyScale = raceId === 'enano' ? 0.88 : raceId === 'draconido' ? 1.08 : 1.0;
  const bodyPivot = new THREE.Group();
  bodyPivot.scale.setScalar(bodyScale);

  const legGeo = new THREE.CapsuleGeometry(0.11, 0.46, 6, 8);
  const leftLeg = new THREE.Mesh(legGeo, armorMat);
  leftLeg.position.set(-0.15, 0.34, 0);
  const rightLeg = new THREE.Mesh(legGeo, armorMat);
  rightLeg.position.set(0.15, 0.34, 0);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.74, 10), armorMat);
  torso.position.y = 1.02;

  const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.95), capeMat);
  cape.position.set(0, 0.92, -0.25);
  cape.rotation.x = 0.14;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 10), skinMat);
  head.position.y = 1.62;

  const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), crestMat);
  crest.position.set(0, 1.12, 0.25);

  const sword = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.78, 0.04), bladeMat);
  sword.position.set(0.38, 1.05, 0.24);
  sword.rotation.x = -0.65;

  bodyPivot.add(leftLeg, rightLeg, torso, cape, head, crest, sword);
  group.add(bodyPivot);

  // Floating Overhead Nameplate Sprite
  const plateCanvas = document.createElement('canvas');
  plateCanvas.width = 512;
  plateCanvas.height = 112;
  drawRemoteNameplateCanvas(plateCanvas, playerName, clanTag, clanColor, level, rebirths);
  const plateTex = new THREE.CanvasTexture(plateCanvas);
  plateTex.colorSpace = THREE.SRGBColorSpace;
  const plateMat = new THREE.SpriteMaterial({
    map: plateTex,
    transparent: true,
    depthTest: true,
  });
  const plateSprite = new THREE.Sprite(plateMat);
  plateSprite.position.set(0, 2.38, 0);
  plateSprite.scale.set(2.55, 0.56, 1);
  group.add(plateSprite);

  group.userData.leftLeg = leftLeg;
  group.userData.rightLeg = rightLeg;
  group.userData.capeMat = capeMat;
  group.userData.crestMat = crestMat;
  group.userData.plateCanvas = plateCanvas;
  group.userData.plateTexture = plateTex;
  group.userData.plateKey = `${playerName}|${clanTag}|${clanColor}|${level}|${rebirths}`;

  group.traverse((c) => {
    if ((c as THREE.Mesh).isMesh && c !== cape) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
}

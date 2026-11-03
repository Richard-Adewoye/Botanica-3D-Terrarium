import * as THREE from 'three';
import { CreatureSpecimen } from '../types/terrarium';

/**
 * Procedural 3D Micro-Fauna for the Terrarium
 * Multi-part composite assemblies with realistic PBR materials and kinematics.
 */

export interface CreatureUserData {
  creatureId: string;
  creatureType: 'beetle' | 'snail';
  legs?: THREE.Object3D[];
  antennae?: THREE.Object3D[];
  eyeStalks?: THREE.Object3D[];
  pathPoints: THREE.Vector3[];
  pathProgress: number;
  originalScale: THREE.Vector3;
}

/**
 * 1. Emerald Jewel Beetle (10-12 parts)
 * - Iridescent emerald/gold metallic elytra shell
 * - Chitin head & pronotum
 * - 6 articulated legs with walking animation
 * - 2 delicate antennae
 */
export function createJewelBeetle(creature: CreatureSpecimen): THREE.Group {
  const group = new THREE.Group();
  group.name = `creature-${creature.id}`;

  // Metallic iridescent shell
  const elytraMat = new THREE.MeshPhysicalMaterial({
    color: 0x1f9d55, // Vivid iridescent emerald green
    metalness: 0.95,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    ior: 1.6,
  });

  // Dark chitin thorax/head
  const chitinMat = new THREE.MeshStandardMaterial({
    color: 0x181412,
    roughness: 0.6,
    metalness: 0.25,
  });

  // Legs & antennae material
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x120e0a,
    roughness: 0.5,
    metalness: 0.35,
  });

  // 1. Abdomen & Elytra (Shell)
  const shellGeo = new THREE.SphereGeometry(0.08, 12, 10);
  shellGeo.scale(0.85, 0.5, 1.4);
  const shellMesh = new THREE.Mesh(shellGeo, elytraMat);
  shellMesh.position.set(0, 0.05, -0.02);
  shellMesh.castShadow = true;
  group.add(shellMesh);

  // Elytra split suture line (accent)
  const sutureGeo = new THREE.BoxGeometry(0.003, 0.005, 0.18);
  const sutureMesh = new THREE.Mesh(sutureGeo, chitinMat);
  sutureMesh.position.set(0, 0.08, -0.02);
  group.add(sutureMesh);

  // 2. Thorax (Pronotum)
  const thoraxGeo = new THREE.CylinderGeometry(0.055, 0.07, 0.04, 10);
  thoraxGeo.scale(1.0, 0.8, 0.9);
  const thoraxMesh = new THREE.Mesh(thoraxGeo, chitinMat);
  thoraxMesh.position.set(0, 0.05, 0.08);
  thoraxMesh.castShadow = true;
  group.add(thoraxMesh);

  // 3. Head & Compound Eyes
  const headGeo = new THREE.SphereGeometry(0.035, 8, 8);
  headGeo.scale(0.9, 0.7, 0.9);
  const headMesh = new THREE.Mesh(headGeo, chitinMat);
  headMesh.position.set(0, 0.045, 0.13);
  group.add(headMesh);

  // Eyes
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.9 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), eyeMat);
  eyeL.position.set(0.028, 0.055, 0.145);
  group.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), eyeMat);
  eyeR.position.set(-0.028, 0.055, 0.145);
  group.add(eyeR);

  // 4. Antennae
  const antennae: THREE.Object3D[] = [];
  [-1, 1].forEach((side) => {
    const antCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.015, 0.055, 0.15),
      new THREE.Vector3(side * 0.035, 0.075, 0.19),
      new THREE.Vector3(side * 0.055, 0.09, 0.23),
    ]);
    const antGeo = new THREE.TubeGeometry(antCurve, 6, 0.003, 4, false);
    const antMesh = new THREE.Mesh(antGeo, legMat);
    group.add(antMesh);
    antennae.push(antMesh);
  });

  // 5. Six Articulated Legs (jointed coxa & tibia)
  const legs: THREE.Object3D[] = [];
  const legOffsets = [
    { x: 0.05, z: 0.1, rotZ: 0.4 },
    { x: 0.06, z: 0.02, rotZ: 0.2 },
    { x: 0.055, z: -0.06, rotZ: -0.3 },
  ];

  legOffsets.forEach((off, idx) => {
    [-1, 1].forEach((side) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(side * off.x, 0.035, off.z);

      const femurCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(side * 0.045, 0.03, off.rotZ * 0.03),
        new THREE.Vector3(side * 0.08, -0.035, off.rotZ * 0.05),
      ]);
      const legGeo = new THREE.TubeGeometry(femurCurve, 6, 0.004, 4, false);
      const legMesh = new THREE.Mesh(legGeo, legMat);
      legGroup.add(legMesh);

      group.add(legGroup);
      legs.push(legGroup);
    });
  });

  group.position.set(...creature.position);
  group.scale.setScalar(creature.scale);
  group.rotation.y = creature.rotationY;

  // Patrol path across the bonsai branch & soil
  const pathPoints = [
    new THREE.Vector3(0.05, 0.02, -0.2),
    new THREE.Vector3(0.25, 0.02, -0.1),
    new THREE.Vector3(0.2, 0.02, 0.15),
    new THREE.Vector3(-0.1, 0.02, 0.25),
    new THREE.Vector3(-0.25, 0.02, -0.05),
  ];

  group.userData = {
    creatureId: creature.id,
    creatureType: 'beetle',
    legs,
    antennae,
    pathPoints,
    pathProgress: Math.random(),
    originalScale: group.scale.clone(),
  } as CreatureUserData;

  return group;
}

/**
 * 2. Translucent Glass Snail (7-9 parts)
 * - Amber spiral whorl shell
 * - Soft translucent pearlescent foot
 * - 2 flexible eye tentacles
 */
export function createTerrariumSnail(creature: CreatureSpecimen): THREE.Group {
  const group = new THREE.Group();
  group.name = `creature-${creature.id}`;

  const shellMat = new THREE.MeshPhysicalMaterial({
    color: 0xcca066, // Golden amber horn
    roughness: 0.22,
    metalness: 0.08,
    transmission: 0.7,
    ior: 1.5,
    thickness: 0.6,
    clearcoat: 0.9,
  });

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xeee7db, // Pearlescent soft cream slug foot
    roughness: 0.45,
    metalness: 0.05,
    transparent: true,
    opacity: 0.88,
  });

  // 1. Foot Body (tapered gliding cushion)
  const footCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.02, -0.1),
    new THREE.Vector3(0, 0.025, 0),
    new THREE.Vector3(0, 0.035, 0.08),
  ]);
  const footGeo = new THREE.TubeGeometry(footCurve, 10, 0.035, 8, false);
  footGeo.scale(1.2, 0.6, 1.0);
  const footMesh = new THREE.Mesh(footGeo, bodyMat);
  footMesh.position.y = 0.01;
  footMesh.castShadow = true;
  group.add(footMesh);

  // 2. Coiled Spiral Shell
  const shellGroup = new THREE.Group();
  shellGroup.position.set(0.015, 0.07, -0.02);
  shellGroup.rotation.set(0.2, 0.4, 0.1);

  // Tiered spiral coils
  const coil1Geo = new THREE.TorusGeometry(0.05, 0.035, 8, 16);
  const coil1 = new THREE.Mesh(coil1Geo, shellMat);
  shellGroup.add(coil1);

  const coil2Geo = new THREE.TorusGeometry(0.032, 0.025, 8, 16);
  const coil2 = new THREE.Mesh(coil2Geo, shellMat);
  coil2.position.set(0, 0, 0.025);
  shellGroup.add(coil2);

  const apexGeo = new THREE.SphereGeometry(0.022, 8, 8);
  const apex = new THREE.Mesh(apexGeo, shellMat);
  apex.position.set(0, 0, 0.045);
  shellGroup.add(apex);

  shellGroup.castShadow = true;
  group.add(shellGroup);

  // 3. Eye Tentacles (upper feelers)
  const eyeStalks: THREE.Object3D[] = [];
  [-1, 1].forEach((side) => {
    const stalkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.012, 0.045, 0.075),
      new THREE.Vector3(side * 0.02, 0.08, 0.095),
      new THREE.Vector3(side * 0.025, 0.105, 0.105),
    ]);
    const stalkGeo = new THREE.TubeGeometry(stalkCurve, 6, 0.004, 5, false);
    const stalkMesh = new THREE.Mesh(stalkGeo, bodyMat);

    // Tip eye spot
    const eyeTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.006, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    eyeTip.position.set(side * 0.025, 0.105, 0.105);
    stalkMesh.add(eyeTip);

    group.add(stalkMesh);
    eyeStalks.push(stalkMesh);
  });

  group.position.set(...creature.position);
  group.scale.setScalar(creature.scale);
  group.rotation.y = creature.rotationY;

  // Gentle gliding path across moss mounds
  const pathPoints = [
    new THREE.Vector3(-0.4, 0.02, 0.3),
    new THREE.Vector3(-0.25, 0.02, 0.45),
    new THREE.Vector3(0.0, 0.02, 0.48),
    new THREE.Vector3(0.25, 0.02, 0.38),
    new THREE.Vector3(0.4, 0.02, 0.1),
    new THREE.Vector3(0.1, 0.02, 0.0),
  ];

  group.userData = {
    creatureId: creature.id,
    creatureType: 'snail',
    eyeStalks,
    pathPoints,
    pathProgress: Math.random(),
    originalScale: group.scale.clone(),
  } as CreatureUserData;

  return group;
}

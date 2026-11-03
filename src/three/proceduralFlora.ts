import * as THREE from 'three';
import { PlantSpecimen } from '../types/terrarium';
import { getProceduralLeafTexture } from './proceduralTextures';

/**
 * Procedural Flora & Minerals for 3D Terrarium
 * All subjects are composite THREE.Group assemblies of 3 to 12 distinct parts,
 * with bottom-center pivot grounding, varied roughness/metalness, and accent details.
 */

export interface FloraMeshUserData {
  plantId: string;
  plantType: string;
  originalScale: THREE.Vector3;
  baseEmissive?: THREE.Color;
  emissiveMesh?: THREE.Mesh;
  animOffset: number;
}

/**
 * 1. Mini Twisted Bonsai Tree (8-12 parts)
 * - Gnarled multi-segment trunk
 * - 4 articulated primary & secondary branches
 * - 5 cloud foliage pads
 * - Exposed nebari roots grounded at bottom-center
 * - Deadwood jin accent
 */
export function createBonsaiTree(specimen: PlantSpecimen): THREE.Group {
  const group = new THREE.Group();
  group.name = `plant-${specimen.id}`;

  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x3d2719,
    roughness: 0.92,
    metalness: 0.05,
    bumpScale: 0.04,
  });

  const deadwoodMat = new THREE.MeshStandardMaterial({
    color: 0x8a7f72,
    roughness: 0.75,
    metalness: 0.08,
  });

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x22491a,
    roughness: 0.55,
    metalness: 0.04,
  });

  // Nebari roots (grounded)
  const rootCount = 4;
  for (let i = 0; i < rootCount; i++) {
    const angle = (i / rootCount) * Math.PI * 2 + 0.3;
    const rootCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.12, 0),
      new THREE.Vector3(Math.cos(angle) * 0.15, 0.04, Math.sin(angle) * 0.15),
      new THREE.Vector3(Math.cos(angle) * 0.28, 0.0, Math.sin(angle) * 0.28),
    ]);
    const rootGeo = new THREE.TubeGeometry(rootCurve, 10, 0.045, 6, false);
    const rootMesh = new THREE.Mesh(rootGeo, barkMat);
    rootMesh.castShadow = true;
    rootMesh.receiveShadow = true;
    group.add(rootMesh);
  }

  // Sinuous Main Trunk
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.04, 0.25, 0.02),
    new THREE.Vector3(-0.06, 0.55, -0.04),
    new THREE.Vector3(0.08, 0.85, 0.05),
    new THREE.Vector3(0.02, 1.15, 0.01),
  ]);
  const trunkGeo = new THREE.TubeGeometry(trunkCurve, 24, 0.085, 8, false);
  const trunkMesh = new THREE.Mesh(trunkGeo, barkMat);
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  group.add(trunkMesh);

  // Deadwood Jin accent (ancient exposed peak)
  const jinCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.02, 1.15, 0.01),
    new THREE.Vector3(0.04, 1.32, -0.02),
  ]);
  const jinGeo = new THREE.TubeGeometry(jinCurve, 8, 0.03, 6, false);
  const jinMesh = new THREE.Mesh(jinGeo, deadwoodMat);
  jinMesh.castShadow = true;
  group.add(jinMesh);

  // Branches & Foliage Clouds
  const branchDefs = [
    { start: new THREE.Vector3(-0.04, 0.52, -0.03), end: new THREE.Vector3(-0.35, 0.65, -0.15), cloudScale: [0.32, 0.14, 0.28] },
    { start: new THREE.Vector3(0.06, 0.75, 0.04), end: new THREE.Vector3(0.38, 0.88, 0.18), cloudScale: [0.36, 0.16, 0.32] },
    { start: new THREE.Vector3(-0.02, 0.95, -0.02), end: new THREE.Vector3(-0.25, 1.08, 0.22), cloudScale: [0.3, 0.13, 0.26] },
    { start: new THREE.Vector3(0.03, 1.05, 0.02), end: new THREE.Vector3(0.08, 1.22, 0.05), cloudScale: [0.42, 0.18, 0.38] },
  ];

  branchDefs.forEach((b) => {
    const bCurve = new THREE.CatmullRomCurve3([
      b.start,
      new THREE.Vector3((b.start.x + b.end.x) * 0.5 + 0.04, (b.start.y + b.end.y) * 0.5 - 0.02, (b.start.z + b.end.z) * 0.5),
      b.end,
    ]);
    const bGeo = new THREE.TubeGeometry(bCurve, 10, 0.04, 6, false);
    const bMesh = new THREE.Mesh(bGeo, barkMat);
    bMesh.castShadow = true;
    group.add(bMesh);

    // Multi-layered foliage cloud pad
    const cloudGeo = new THREE.DodecahedronGeometry(1, 2);
    // Slight flattening into traditional bonsai cloud shape
    cloudGeo.scale(b.cloudScale[0], b.cloudScale[1], b.cloudScale[2]);
    const cloudMesh = new THREE.Mesh(cloudGeo, leafMat);
    cloudMesh.position.copy(b.end);
    cloudMesh.castShadow = true;
    cloudMesh.receiveShadow = true;
    group.add(cloudMesh);
  });

  group.position.set(...specimen.position);
  group.scale.setScalar(specimen.scale);
  group.rotation.y = specimen.rotationY;

  group.userData = {
    plantId: specimen.id,
    plantType: specimen.type,
    originalScale: group.scale.clone(),
    animOffset: Math.random() * 10,
  } as FloraMeshUserData;

  return group;
}

/**
 * 2. Boston Fern Cluster (9-12 parts)
 * - Central rhizome crown
 * - Arching Catmull-Rom fronds
 * - Alternating pinnate leaflets
 * - Young spiral fiddleheads
 */
export function createFernCluster(specimen: PlantSpecimen): THREE.Group {
  const group = new THREE.Group();
  group.name = `plant-${specimen.id}`;

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x3d7026,
    roughness: 0.65,
    metalness: 0.02,
  });

  const frondMat = new THREE.MeshStandardMaterial({
    color: 0x4aa62b,
    roughness: 0.48,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });

  // Central rhizome crown base
  const rhizomeGeo = new THREE.SphereGeometry(0.08, 8, 6);
  rhizomeGeo.scale(1.2, 0.6, 1.2);
  const rhizomeMesh = new THREE.Mesh(rhizomeGeo, new THREE.MeshStandardMaterial({ color: 0x2b1d12, roughness: 0.95 }));
  rhizomeMesh.position.y = 0.04;
  group.add(rhizomeMesh);

  // 8 arching main fronds
  const numFronds = 9;
  for (let i = 0; i < numFronds; i++) {
    const angle = (i / numFronds) * Math.PI * 2 + (i % 2) * 0.2;
    const length = 0.5 + (i % 3) * 0.12;
    const archHeight = 0.35 + (i % 2) * 0.1;

    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.04, 0),
      new THREE.Vector3(Math.cos(angle) * 0.15, archHeight * 0.8, Math.sin(angle) * 0.15),
      new THREE.Vector3(Math.cos(angle) * length, archHeight * 0.4, Math.sin(angle) * length),
      new THREE.Vector3(Math.cos(angle) * (length + 0.1), 0.08, Math.sin(angle) * (length + 0.1)),
    ]);

    const stemGeo = new THREE.TubeGeometry(stemCurve, 12, 0.015, 5, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.castShadow = true;
    group.add(stemMesh);

    // Leaflets along the frond
    const leafletCount = 8;
    for (let j = 2; j < leafletCount; j++) {
      const t = j / leafletCount;
      const point = stemCurve.getPoint(t);
      const tangent = stemCurve.getTangent(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const leafScale = (1 - t * 0.6) * 0.09;
      const leafGeo = new THREE.ConeGeometry(leafScale, leafScale * 2.5, 4);
      leafGeo.rotateZ(Math.PI / 2);

      // Left and right leaflet pair
      const leftLeaf = new THREE.Mesh(leafGeo, frondMat);
      leftLeaf.position.copy(point).addScaledVector(normal, leafScale * 0.8);
      leftLeaf.castShadow = true;
      group.add(leftLeaf);

      const rightLeaf = new THREE.Mesh(leafGeo, frondMat);
      rightLeaf.position.copy(point).addScaledVector(normal, -leafScale * 0.8);
      rightLeaf.rotateY(Math.PI);
      rightLeaf.castShadow = true;
      group.add(rightLeaf);
    }
  }

  // Fiddleheads (baby spiral fronds in center)
  for (let k = 0; k < 3; k++) {
    const fAngle = (k / 3) * Math.PI * 2 + 0.5;
    const torusGeo = new THREE.TorusGeometry(0.035, 0.012, 6, 12, Math.PI * 1.5);
    const torusMesh = new THREE.Mesh(torusGeo, stemMat);
    torusMesh.position.set(Math.cos(fAngle) * 0.04, 0.12, Math.sin(fAngle) * 0.04);
    torusMesh.rotation.set(0.3, fAngle, 0.2);
    group.add(torusMesh);
  }

  group.position.set(...specimen.position);
  group.scale.setScalar(specimen.scale);
  group.rotation.y = specimen.rotationY;

  group.userData = {
    plantId: specimen.id,
    plantType: specimen.type,
    originalScale: group.scale.clone(),
    animOffset: Math.random() * 10,
  } as FloraMeshUserData;

  return group;
}

/**
 * 3. Echeveria Succulent Rosette (10-12 parts)
 * - Fleshy paddle leaves arranged along Fibonacci spiral
 * - Rosette petal geometry with soft velvet sheen
 * - Blushed pink/coral tips
 * - Grounded bottom core
 */
export function createSucculent(specimen: PlantSpecimen): THREE.Group {
  const group = new THREE.Group();
  group.name = `plant-${specimen.id}`;

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x3d7e5d, // Seafoam jade green
    roughness: 0.38,
    metalness: 0.04,
  });

  const tipMat = new THREE.MeshStandardMaterial({
    color: 0x9e4b6c, // Blushed ruby/coral tip
    roughness: 0.42,
    metalness: 0.05,
  });

  // Short grounded stem core
  const stemCoreGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.1, 8);
  const stemCore = new THREE.Mesh(stemCoreGeo, baseMat);
  stemCore.position.y = 0.05;
  group.add(stemCore);

  // 16 fleshy leaves layered in spiral tiers
  const goldenAngle = 2.39996; // 137.5 degrees in radians
  const totalLeaves = 18;

  for (let i = 0; i < totalLeaves; i++) {
    const fraction = i / totalLeaves;
    const angle = i * goldenAngle;
    const radius = 0.05 + fraction * 0.22;
    const height = 0.04 + (1 - fraction) * 0.16;
    const leafScale = 0.08 + fraction * 0.08;

    // Fleshy paddle leaf using squashed sphere/capsule
    const leafGeo = new THREE.SphereGeometry(leafScale, 8, 8);
    leafGeo.scale(0.65, 0.35, 1.4);

    // Alternate materials between lower body and inner blush
    const leafMesh = new THREE.Mesh(leafGeo, i > 11 ? tipMat : baseMat);
    leafMesh.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    leafMesh.rotation.y = angle;
    // Upward curl for outer leaves, tighter cup for inner leaves
    leafMesh.rotation.x = -0.35 - (1 - fraction) * 0.45;
    leafMesh.castShadow = true;
    leafMesh.receiveShadow = true;
    group.add(leafMesh);
  }

  // Offshoot baby rosette
  const babyRosette = new THREE.Group();
  for (let b = 0; b < 6; b++) {
    const bAngle = b * 1.05;
    const bGeo = new THREE.SphereGeometry(0.04, 6, 6);
    bGeo.scale(0.6, 0.3, 1.2);
    const bMesh = new THREE.Mesh(bGeo, tipMat);
    bMesh.position.set(Math.cos(bAngle) * 0.05, 0.03, Math.sin(bAngle) * 0.05);
    bMesh.rotation.y = bAngle;
    babyRosette.add(bMesh);
  }
  babyRosette.position.set(0.24, 0.03, -0.1);
  group.add(babyRosette);

  group.position.set(...specimen.position);
  group.scale.setScalar(specimen.scale);
  group.rotation.y = specimen.rotationY;

  group.userData = {
    plantId: specimen.id,
    plantType: specimen.type,
    originalScale: group.scale.clone(),
    animOffset: Math.random() * 10,
  } as FloraMeshUserData;

  return group;
}

/**
 * 4. Bioluminescent Mushrooms / Fungi Cluster (7-10 parts)
 * - 3 graceful stipes of varying heights
 * - Bell caps with translucent glowing under-gills
 * - Emissive night illumination & floating spore particles
 */
export function createMushroomCluster(specimen: PlantSpecimen): THREE.Group {
  const group = new THREE.Group();
  group.name = `plant-${specimen.id}`;

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0xded2c1,
    roughness: 0.75,
    metalness: 0.02,
  });

  const glowColor = new THREE.Color(specimen.glowColor || '#42e8b4'); // Bioluminescent aqua/emerald
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x1f3d32,
    emissive: glowColor,
    emissiveIntensity: 0.45,
    roughness: 0.35,
    metalness: 0.05,
  });

  const gillMat = new THREE.MeshStandardMaterial({
    color: 0x3bf5c0,
    emissive: glowColor,
    emissiveIntensity: 0.8,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });

  const shrooms = [
    { height: 0.48, capRadius: 0.16, x: 0, z: 0, rotZ: 0.08 },
    { height: 0.32, capRadius: 0.11, x: 0.16, z: 0.1, rotZ: -0.15 },
    { height: 0.22, capRadius: 0.08, x: -0.14, z: 0.08, rotZ: 0.22 },
  ];

  shrooms.forEach((s) => {
    // Curved Stipe (stem)
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s.x, 0, s.z),
      new THREE.Vector3(s.x + s.rotZ * 0.4, s.height * 0.5, s.z + s.rotZ * 0.3),
      new THREE.Vector3(s.x + s.rotZ * 0.8, s.height, s.z + s.rotZ * 0.5),
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 12, 0.028, 6, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.castShadow = true;
    group.add(stemMesh);

    // Annulus ring (veil collar)
    const ringGeo = new THREE.TorusGeometry(0.038, 0.009, 6, 12);
    const ringMesh = new THREE.Mesh(ringGeo, stemMat);
    ringMesh.position.set(s.x + s.rotZ * 0.5, s.height * 0.65, s.z + s.rotZ * 0.4);
    ringMesh.rotation.x = Math.PI / 2;
    group.add(ringMesh);

    // Cap (umbrella dome)
    const capGeo = new THREE.SphereGeometry(s.capRadius, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.set(s.x + s.rotZ * 0.8, s.height, s.z + s.rotZ * 0.5);
    capMesh.castShadow = true;
    capMesh.receiveShadow = true;
    group.add(capMesh);

    // Glowing under-gills
    const gillGeo = new THREE.RingGeometry(0.02, s.capRadius * 0.95, 12, 2);
    const gillMesh = new THREE.Mesh(gillGeo, gillMat);
    gillMesh.position.set(s.x + s.rotZ * 0.8, s.height - 0.005, s.z + s.rotZ * 0.5);
    gillMesh.rotation.x = Math.PI / 2;
    group.add(gillMesh);
  });

  // Dedicated soft point light for bioluminescence
  const bioLight = new THREE.PointLight(glowColor, 0.7, 1.2);
  bioLight.position.set(0, 0.35, 0);
  bioLight.name = 'shroom-glow-light';
  group.add(bioLight);

  group.position.set(...specimen.position);
  group.scale.setScalar(specimen.scale);
  group.rotation.y = specimen.rotationY;

  group.userData = {
    plantId: specimen.id,
    plantType: specimen.type,
    originalScale: group.scale.clone(),
    baseEmissive: glowColor,
    bioLight: bioLight,
    animOffset: Math.random() * 10,
  };

  return group;
}

/**
 * 5. Amethyst / Smoky Quartz Crystal Geode (6-8 parts)
 * - Hexagonal crystal obelisks
 * - Faceted terminations with sharp specular highlights
 * - Matrix rock base
 */
export function createCrystalCluster(specimen: PlantSpecimen): THREE.Group {
  const group = new THREE.Group();
  group.name = `plant-${specimen.id}`;

  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0x9366cc, // Royal Amethyst
    roughness: 0.12,
    metalness: 0.1,
    transmission: 0.85,
    ior: 1.54,
    thickness: 0.8,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });

  const matrixMat = new THREE.MeshStandardMaterial({
    color: 0x2e2933,
    roughness: 0.94,
    metalness: 0.08,
  });

  // Dark basalt host rock base
  const baseGeo = new THREE.DodecahedronGeometry(0.25, 1);
  baseGeo.scale(1.4, 0.4, 1.1);
  const baseMesh = new THREE.Mesh(baseGeo, matrixMat);
  baseMesh.position.y = 0.06;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 6 hexagonal faceted crystal prisms
  const crystals = [
    { height: 0.52, radius: 0.075, pos: [0, 0.28, 0], rot: [0.1, 0.2, -0.05] },
    { height: 0.38, radius: 0.06, pos: [0.11, 0.2, 0.06], rot: [0.25, -0.4, 0.2] },
    { height: 0.32, radius: 0.055, pos: [-0.09, 0.18, 0.08], rot: [-0.2, 0.8, -0.25] },
    { height: 0.26, radius: 0.045, pos: [0.08, 0.14, -0.1], rot: [-0.15, 0.3, 0.35] },
    { height: 0.22, radius: 0.04, pos: [-0.12, 0.12, -0.07], rot: [0.3, -0.2, -0.1] },
  ];

  crystals.forEach((c) => {
    // 6-sided cylinder prism + 6-sided cone termination
    const prismGeo = new THREE.CylinderGeometry(c.radius, c.radius, c.height * 0.75, 6);
    const coneGeo = new THREE.ConeGeometry(c.radius, c.height * 0.25, 6);
    coneGeo.translate(0, c.height * 0.5, 0);

    const prismMesh = new THREE.Mesh(prismGeo, crystalMat);
    const coneMesh = new THREE.Mesh(coneGeo, crystalMat);
    prismMesh.add(coneMesh);

    prismMesh.position.set(c.pos[0], c.pos[1], c.pos[2]);
    prismMesh.rotation.set(c.rot[0], c.rot[1], c.rot[2]);
    prismMesh.castShadow = true;
    group.add(prismMesh);
  });

  group.position.set(...specimen.position);
  group.scale.setScalar(specimen.scale);
  group.rotation.y = specimen.rotationY;

  group.userData = {
    plantId: specimen.id,
    plantType: specimen.type,
    originalScale: group.scale.clone(),
    animOffset: Math.random() * 10,
  } as FloraMeshUserData;

  return group;
}

/**
 * 6. Carnivorous Pitcher Plant (Nepenthes) (6-9 parts)
 * - Hanging urn cups with curved peristome rim
 * - Protective vaulted lid
 * - Sinuous climbing tendril
 */
export function createPitcherPlant(specimen: PlantSpecimen): THREE.Group {
  const group = new THREE.Group();
  group.name = `plant-${specimen.id}`;

  const vineMat = new THREE.MeshStandardMaterial({
    color: 0x477831,
    roughness: 0.7,
    metalness: 0.04,
  });

  const urnMat = new THREE.MeshStandardMaterial({
    color: 0x8b323c, // Mottled burgundy/chartreuse
    roughness: 0.35,
    metalness: 0.05,
  });

  const peristomeMat = new THREE.MeshStandardMaterial({
    color: 0xc43b4d,
    roughness: 0.2,
    metalness: 0.08,
  });

  // Climbing central stalk
  const stalkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.04, 0.25, -0.02),
    new THREE.Vector3(-0.02, 0.5, 0.03),
    new THREE.Vector3(0.03, 0.72, 0.01),
  ]);
  const stalkGeo = new THREE.TubeGeometry(stalkCurve, 14, 0.024, 6, false);
  const stalkMesh = new THREE.Mesh(stalkGeo, vineMat);
  stalkMesh.castShadow = true;
  group.add(stalkMesh);

  // 2 Hanging Pitchers
  const pitchers = [
    { start: new THREE.Vector3(0.04, 0.42, 0), drop: new THREE.Vector3(0.18, 0.28, 0.12), scale: 0.18 },
    { start: new THREE.Vector3(-0.02, 0.58, 0), drop: new THREE.Vector3(-0.16, 0.42, -0.08), scale: 0.15 },
  ];

  pitchers.forEach((p) => {
    // Looping tendril
    const tendrilCurve = new THREE.CatmullRomCurve3([
      p.start,
      new THREE.Vector3((p.start.x + p.drop.x) * 0.5 + 0.05, p.drop.y + 0.12, (p.start.z + p.drop.z) * 0.5),
      p.drop,
    ]);
    const tendrilGeo = new THREE.TubeGeometry(tendrilCurve, 8, 0.012, 5, false);
    group.add(new THREE.Mesh(tendrilGeo, vineMat));

    // Urn Cup (lathe vase geometry)
    const points: THREE.Vector2[] = [];
    points.push(new THREE.Vector2(0, 0));
    points.push(new THREE.Vector2(0.35, 0.1));
    points.push(new THREE.Vector2(0.5, 0.4));
    points.push(new THREE.Vector2(0.48, 0.75));
    points.push(new THREE.Vector2(0.38, 0.95));
    points.push(new THREE.Vector2(0.42, 1.0)); // Peristome lip
    const urnGeo = new THREE.LatheGeometry(points, 12);
    urnGeo.scale(p.scale, p.scale * 1.4, p.scale);

    const urnMesh = new THREE.Mesh(urnGeo, urnMat);
    urnMesh.position.copy(p.drop);
    urnMesh.castShadow = true;
    group.add(urnMesh);

    // Rim collar
    const rimGeo = new THREE.TorusGeometry(p.scale * 0.42, 0.016, 6, 12);
    const rimMesh = new THREE.Mesh(rimGeo, peristomeMat);
    rimMesh.position.set(p.drop.x, p.drop.y + p.scale * 1.4, p.drop.z);
    rimMesh.rotation.x = Math.PI / 2;
    group.add(rimMesh);

    // Protective vaulted hood/lid
    const lidGeo = new THREE.SphereGeometry(p.scale * 0.35, 8, 6, 0, Math.PI, 0, Math.PI * 0.5);
    const lidMesh = new THREE.Mesh(lidGeo, urnMat);
    lidMesh.position.set(p.drop.x, p.drop.y + p.scale * 1.48, p.drop.z);
    lidMesh.rotation.x = -0.4;
    group.add(lidMesh);
  });

  group.position.set(...specimen.position);
  group.scale.setScalar(specimen.scale);
  group.rotation.y = specimen.rotationY;

  group.userData = {
    plantId: specimen.id,
    plantType: specimen.type,
    originalScale: group.scale.clone(),
    animOffset: Math.random() * 10,
  } as FloraMeshUserData;

  return group;
}

/**
 * Cushion Moss Mound Clusters (4-6 velvety mounds)
 */
export function createMossMounds(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'moss-mounds';

  const mossMat = new THREE.MeshStandardMaterial({
    color: 0x3d7026,
    roughness: 0.9,
    metalness: 0.02,
    bumpScale: 0.02,
  });

  const mounds = [
    { x: -0.45, z: 0.35, r: 0.28, h: 0.12 },
    { x: 0.5, z: -0.25, r: 0.32, h: 0.14 },
    { x: -0.25, z: -0.48, r: 0.24, h: 0.1 },
    { x: 0.35, z: 0.42, r: 0.26, h: 0.11 },
    { x: 0.05, z: 0.55, r: 0.2, h: 0.08 },
  ];

  mounds.forEach((m) => {
    const geo = new THREE.SphereGeometry(m.r, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    geo.scale(1, m.h / m.r, 1);
    const mesh = new THREE.Mesh(geo, mossMat);
    mesh.position.set(m.x, 0.01, m.z);
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  return group;
}

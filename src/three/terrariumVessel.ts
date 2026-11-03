import * as THREE from 'three';
import { VesselStyle } from '../types/terrarium';
import {
  getProceduralWoodTexture,
  getProceduralSoilTexture,
  getProceduralPebbleTexture,
  getContactShadowTexture,
  getGlassCondensationTexture,
} from './proceduralTextures';

export interface TerrariumVesselResult {
  rootGroup: THREE.Group;
  lidGroup: THREE.Group;
  glassMaterial: THREE.MeshPhysicalMaterial;
  condensationMaterial: THREE.MeshStandardMaterial;
  soilMesh: THREE.Mesh;
}

export function createTerrariumVessel(
  style: VesselStyle = 'hexagonal',
  isSoftwareGl = false
): TerrariumVesselResult {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'terrarium-vessel-root';

  // 1. Soft radial contact shadow plane
  const shadowGeo = new THREE.PlaneGeometry(3.6, 3.6);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getContactShadowTexture(),
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.002;
  rootGroup.add(shadowMesh);

  // 2. Walnut Wood Pedestal Base with brass rim
  const baseGroup = new THREE.Group();
  baseGroup.name = 'pedestal-base';

  const woodTex = getProceduralWoodTexture();
  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0x5a3d28,
    roughness: 0.35,
    metalness: 0.08,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Vintage polished brass
    roughness: 0.22,
    metalness: 0.88,
  });

  // Base wooden plinth (multi-tier chamfered profile)
  const baseRadius = 1.35;
  const basePoints: THREE.Vector2[] = [];
  basePoints.push(new THREE.Vector2(0, 0));
  basePoints.push(new THREE.Vector2(baseRadius + 0.1, 0.01));
  basePoints.push(new THREE.Vector2(baseRadius + 0.1, 0.05));
  basePoints.push(new THREE.Vector2(baseRadius, 0.12));
  basePoints.push(new THREE.Vector2(baseRadius - 0.05, 0.18));
  basePoints.push(new THREE.Vector2(0, 0.18));

  const plinthGeo = new THREE.LatheGeometry(basePoints, 32);
  const plinthMesh = new THREE.Mesh(plinthGeo, woodMat);
  plinthMesh.receiveShadow = true;
  plinthMesh.castShadow = true;
  baseGroup.add(plinthMesh);

  // Brass feet (4 decorative spherical turned feet)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const footGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const footMesh = new THREE.Mesh(footGeo, brassMat);
    footMesh.position.set(Math.cos(angle) * (baseRadius + 0.02), 0.06, Math.sin(angle) * (baseRadius + 0.02));
    footMesh.castShadow = true;
    baseGroup.add(footMesh);
  }

  // Brass retainer ring around glass base
  const retainerRingGeo = new THREE.TorusGeometry(baseRadius - 0.08, 0.03, 8, 32);
  const retainerRing = new THREE.Mesh(retainerRingGeo, brassMat);
  retainerRing.position.y = 0.18;
  retainerRing.rotation.x = Math.PI / 2;
  retainerRing.castShadow = true;
  baseGroup.add(retainerRing);

  rootGroup.add(baseGroup);

  // 3. Stratified Substrate (visible soil profile: pebbles -> charcoal -> moss -> soil)
  const strataGroup = new THREE.Group();
  strataGroup.name = 'soil-strata';
  strataGroup.position.y = 0.18;

  const stratumRadius = baseRadius - 0.12;

  // Layer 1: Drainage pebbles
  const pebbleMat = new THREE.MeshStandardMaterial({
    map: getProceduralPebbleTexture(),
    roughness: 0.7,
    metalness: 0.1,
  });
  const pebbleLayerGeo = new THREE.CylinderGeometry(stratumRadius, stratumRadius, 0.12, 24);
  const pebbleLayer = new THREE.Mesh(pebbleLayerGeo, pebbleMat);
  pebbleLayer.position.y = 0.06;
  pebbleLayer.receiveShadow = true;
  strataGroup.add(pebbleLayer);

  // Layer 2: Activated Charcoal (fine black carbon porous band)
  const charcoalMat = new THREE.MeshStandardMaterial({
    color: 0x141416,
    roughness: 0.95,
    metalness: 0.15,
  });
  const charcoalGeo = new THREE.CylinderGeometry(stratumRadius, stratumRadius, 0.06, 24);
  const charcoalLayer = new THREE.Mesh(charcoalGeo, charcoalMat);
  charcoalLayer.position.y = 0.15;
  charcoalLayer.receiveShadow = true;
  strataGroup.add(charcoalLayer);

  // Layer 3: Sphagnum moss barrier
  const sphagnumMat = new THREE.MeshStandardMaterial({
    color: 0x544c29,
    roughness: 0.88,
    metalness: 0.02,
  });
  const sphagnumGeo = new THREE.CylinderGeometry(stratumRadius, stratumRadius, 0.05, 24);
  const sphagnumLayer = new THREE.Mesh(sphagnumGeo, sphagnumMat);
  sphagnumLayer.position.y = 0.205;
  sphagnumLayer.receiveShadow = true;
  strataGroup.add(sphagnumLayer);

  // Layer 4: Topsoil / substrate with organic undulating surface
  const soilTex = getProceduralSoilTexture();
  const soilMat = new THREE.MeshStandardMaterial({
    map: soilTex,
    roughness: 0.85,
    metalness: 0.04,
  });

  const soilGeo = new THREE.CylinderGeometry(stratumRadius, stratumRadius, 0.18, 32, 4);
  // Organic terrain perturbation on top face
  const posAttr = soilGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i);
    if (y > 0.08) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      // Gentle rolling hill contours
      const hill = Math.sin(x * 3.5) * 0.04 + Math.cos(z * 3.2) * 0.035 - (x * x + z * z) * 0.02;
      posAttr.setY(i, y + hill);
    }
  }
  soilGeo.computeVertexNormals();

  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.position.y = 0.32;
  soilMesh.receiveShadow = true;
  strataGroup.add(soilMesh);

  rootGroup.add(strataGroup);

  // 4. Glass Enclosure & Liftable Lid
  const lidGroup = new THREE.Group();
  lidGroup.name = 'terrarium-lid-assembly';

  // Glass PBR material with optical realism
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: isSoftwareGl ? 0 : 0.94,
    opacity: isSoftwareGl ? 0.35 : 1.0,
    transparent: true,
    ior: 1.52,
    thickness: 1.4,
    roughness: 0.04,
    metalness: 0.02,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    depthWrite: false, // Ensures interior plants don't flicker
  });

  // Condensation water droplet overlay layer
  const condensationMaterial = new THREE.MeshStandardMaterial({
    map: getGlassCondensationTexture(),
    transparent: true,
    opacity: 0.0, // Dynamically adjusted based on humidity/weather
    roughness: 0.2,
    metalness: 0.1,
    depthWrite: false,
  });

  const vesselHeight = 2.4;

  if (style === 'bell_jar') {
    // Elegant Victorian Bell Jar
    const bellPoints: THREE.Vector2[] = [];
    const bellRadius = stratumRadius + 0.06;
    for (let y = 0; y <= vesselHeight; y += 0.1) {
      if (y < vesselHeight * 0.7) {
        bellPoints.push(new THREE.Vector2(bellRadius, y));
      } else {
        // Dome curvature
        const t = (y - vesselHeight * 0.7) / (vesselHeight * 0.3);
        const r = bellRadius * Math.sqrt(Math.max(0, 1 - t * t));
        bellPoints.push(new THREE.Vector2(r, y));
      }
    }
    const bellGeo = new THREE.LatheGeometry(bellPoints, 32);
    const bellMesh = new THREE.Mesh(bellGeo, glassMaterial);
    bellMesh.renderOrder = 10;
    lidGroup.add(bellMesh);

    // Condensation sleeve
    const condGeo = new THREE.LatheGeometry(bellPoints, 32);
    condGeo.scale(0.995, 0.995, 0.995);
    const condMesh = new THREE.Mesh(condGeo, condensationMaterial);
    condMesh.renderOrder = 9;
    lidGroup.add(condMesh);

    // Ornate brass finial knob at apex
    const finialGroup = new THREE.Group();
    finialGroup.position.y = vesselHeight + 0.02;

    const knobGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const knobMesh = new THREE.Mesh(knobGeo, brassMat);
    finialGroup.add(knobMesh);

    const neckGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.1, 16);
    const neckMesh = new THREE.Mesh(neckGeo, brassMat);
    neckMesh.position.y = -0.08;
    finialGroup.add(neckMesh);

    const finialRingGeo = new THREE.TorusGeometry(0.09, 0.02, 8, 20);
    const finialRing = new THREE.Mesh(finialRingGeo, brassMat);
    finialRing.position.y = 0.14;
    finialGroup.add(finialRing);

    lidGroup.add(finialGroup);
  } else {
    // Hexagonal Wardian Case with brass struts & bevels
    const hexRadius = stratumRadius + 0.06;
    const sides = 6;

    // Glass cylinder/prism
    const hexGeo = new THREE.CylinderGeometry(hexRadius, hexRadius, vesselHeight * 0.75, sides, 1, true);
    const hexMesh = new THREE.Mesh(hexGeo, glassMaterial);
    hexMesh.position.y = (vesselHeight * 0.75) / 2;
    hexMesh.renderOrder = 10;
    lidGroup.add(hexMesh);

    // Condensation inner layer
    const condHexGeo = new THREE.CylinderGeometry(hexRadius * 0.995, hexRadius * 0.995, vesselHeight * 0.75, sides, 1, true);
    const condMesh = new THREE.Mesh(condHexGeo, condensationMaterial);
    condMesh.position.y = (vesselHeight * 0.75) / 2;
    condMesh.renderOrder = 9;
    lidGroup.add(condMesh);

    // Hexagonal faceted roof pyramid
    const roofHeight = 0.7;
    const roofGeo = new THREE.ConeGeometry(hexRadius, roofHeight, sides, 1, true);
    const roofMesh = new THREE.Mesh(roofGeo, glassMaterial);
    roofMesh.position.y = vesselHeight * 0.75 + roofHeight / 2;
    roofMesh.renderOrder = 10;
    lidGroup.add(roofMesh);

    // Brass framework struts along vertical edges
    for (let s = 0; s < sides; s++) {
      const angle = (s / sides) * Math.PI * 2;
      const x = Math.cos(angle) * hexRadius;
      const z = Math.sin(angle) * hexRadius;

      // Vertical strut
      const strutGeo = new THREE.CylinderGeometry(0.022, 0.022, vesselHeight * 0.75, 6);
      const strutMesh = new THREE.Mesh(strutGeo, brassMat);
      strutMesh.position.set(x, (vesselHeight * 0.75) / 2, z);
      strutMesh.castShadow = true;
      lidGroup.add(strutMesh);

      // Roof angled strut connecting to peak
      const peakX = 0;
      const peakY = vesselHeight * 0.75 + roofHeight;
      const peakZ = 0;

      const roofStrutCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, vesselHeight * 0.75, z),
        new THREE.Vector3(peakX, peakY, peakZ),
      ]);
      const roofStrutGeo = new THREE.TubeGeometry(roofStrutCurve, 4, 0.02, 6, false);
      const roofStrutMesh = new THREE.Mesh(roofStrutGeo, brassMat);
      roofStrutMesh.castShadow = true;
      lidGroup.add(roofStrutMesh);
    }

    // Brass horizontal cornice band
    const corniceGeo = new THREE.CylinderGeometry(hexRadius + 0.02, hexRadius + 0.02, 0.04, sides, 1, true);
    const corniceMesh = new THREE.Mesh(corniceGeo, brassMat);
    corniceMesh.position.y = vesselHeight * 0.75;
    corniceMesh.castShadow = true;
    lidGroup.add(corniceMesh);

    // Crown brass finial
    const finialGeo = new THREE.SphereGeometry(0.1, 12, 12);
    const finialMesh = new THREE.Mesh(finialGeo, brassMat);
    finialMesh.position.y = vesselHeight * 0.75 + roofHeight + 0.06;
    finialMesh.castShadow = true;
    lidGroup.add(finialMesh);
  }

  // Position lid so it rests snugly on the plinth
  lidGroup.position.y = 0.18;
  rootGroup.add(lidGroup);

  return {
    rootGroup,
    lidGroup,
    glassMaterial,
    condensationMaterial,
    soilMesh,
  };
}

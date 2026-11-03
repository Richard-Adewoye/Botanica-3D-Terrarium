import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  PlantSpecimen,
  CreatureSpecimen,
  TerrariumConfig,
  CameraPreset,
} from '../types/terrarium';
import { LightingRig } from './lightingRig';
import { WeatherSystem } from './weatherSystem';
import {
  createTerrariumVessel,
  TerrariumVesselResult,
} from './terrariumVessel';
import {
  createBonsaiTree,
  createFernCluster,
  createSucculent,
  createMushroomCluster,
  createCrystalCluster,
  createPitcherPlant,
  createMossMounds,
} from './proceduralFlora';
import {
  createJewelBeetle,
  createTerrariumSnail,
  CreatureUserData,
} from './proceduralCreatures';
import { terrariumAudio } from '../audio/proceduralAudio';

export class TerrariumScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private clock: THREE.Clock;

  // Subsystems
  private lighting: LightingRig;
  private weather: WeatherSystem;
  private vessel: TerrariumVesselResult;
  private floraGroup: THREE.Group;
  private mossGroup: THREE.Group;
  private creaturesGroup: THREE.Group;

  // Interactive Selection
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private onSelectPlantCallback?: (specimen: PlantSpecimen | null) => void;
  private onSelectCreatureCallback?: (creature: CreatureSpecimen | null) => void;

  // Camera animation target
  private cameraTargetPos: THREE.Vector3;
  private controlsTargetLook: THREE.Vector3;
  private isCameraTransitioning: boolean = false;

  // Lid animation state
  private currentLidY: number = 0.18;
  private targetLidY: number = 0.18;

  // Loop & Software WebGL management
  private isSoftwareGl: boolean;
  private frameId: number = 0;
  private isDisposed: boolean = false;

  // Active specimens & creatures
  private specimens: PlantSpecimen[] = [];
  private creatures: CreatureSpecimen[] = [];
  private currentConfig: TerrariumConfig;

  // Movement timer for creature step sounds
  private creatureSoundTimer: number = 0;

  constructor(
    container: HTMLElement,
    config: TerrariumConfig,
    initialSpecimens: PlantSpecimen[],
    initialCreatures: CreatureSpecimen[],
    onSelectPlant?: (specimen: PlantSpecimen | null) => void,
    onSelectCreature?: (creature: CreatureSpecimen | null) => void
  ) {
    this.container = container;
    this.currentConfig = { ...config };
    this.specimens = [...initialSpecimens];
    this.creatures = [...initialCreatures];
    this.onSelectPlantCallback = onSelectPlant;
    this.onSelectCreatureCallback = onSelectCreature;

    // Detect software WebGL safely
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Initialize Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    container.appendChild(this.renderer.domElement);

    // 2. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      50
    );
    this.camera.position.set(0, 2.2, 4.4);

    this.cameraTargetPos = this.camera.position.clone();
    this.controlsTargetLook = new THREE.Vector3(0, 1.0, 0);

    // 3. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.target.copy(this.controlsTargetLook);
    this.controls.minDistance = 1.1;
    this.controls.maxDistance = 8.5;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05;

    this.controls.addEventListener('start', () => {
      this.isCameraTransitioning = false;
    });

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-100, -100);

    // 4. Lighting Rig
    this.lighting = new LightingRig(this.scene, this.renderer, this.isSoftwareGl);
    this.lighting.updateTime(this.currentConfig.timeHours, this.currentConfig.weather);

    // 5. Terrarium Vessel & Soil Strata
    this.vessel = createTerrariumVessel(this.currentConfig.vesselStyle, this.isSoftwareGl);
    this.scene.add(this.vessel.rootGroup);

    // 6. Moss Mounds
    this.mossGroup = createMossMounds();
    this.mossGroup.position.y = 0.5;
    this.scene.add(this.mossGroup);

    // 7. Flora Assembly
    this.floraGroup = new THREE.Group();
    this.floraGroup.name = 'all-flora';
    this.floraGroup.position.y = 0.5;
    this.scene.add(this.floraGroup);
    this.rebuildFlora();

    // 8. Micro-Fauna Assembly
    this.creaturesGroup = new THREE.Group();
    this.creaturesGroup.name = 'all-creatures';
    this.creaturesGroup.position.y = 0.5;
    this.scene.add(this.creaturesGroup);
    this.rebuildCreatures();

    // 9. Weather Particle System with procedural sound linkage
    this.weather = new WeatherSystem();
    this.weather.setWeather(this.currentConfig.weather);
    this.weather.onLightningFlash = () => {
      terrariumAudio.playThunderRumble();
    };
    this.scene.add(this.weather.group);

    // Sync initial audio
    terrariumAudio.updateAmbience(
      this.currentConfig.weather,
      this.currentConfig.timeHours,
      this.currentConfig.humidity
    );

    // Listeners
    window.addEventListener('resize', this.onResize);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);

    // Start render loop
    this.tick();
  }

  public rebuildFlora() {
    while (this.floraGroup.children.length > 0) {
      const child = this.floraGroup.children[0];
      this.floraGroup.remove(child);
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
    }

    this.specimens.forEach((specimen) => {
      let plantMesh: THREE.Group;
      switch (specimen.type) {
        case 'bonsai':
          plantMesh = createBonsaiTree(specimen);
          break;
        case 'fern':
          plantMesh = createFernCluster(specimen);
          break;
        case 'succulent':
          plantMesh = createSucculent(specimen);
          break;
        case 'mushroom':
          plantMesh = createMushroomCluster(specimen);
          break;
        case 'crystal':
          plantMesh = createCrystalCluster(specimen);
          break;
        case 'pitcher':
          plantMesh = createPitcherPlant(specimen);
          break;
        default:
          plantMesh = createSucculent(specimen);
      }
      this.floraGroup.add(plantMesh);
    });
  }

  public rebuildCreatures() {
    while (this.creaturesGroup.children.length > 0) {
      const child = this.creaturesGroup.children[0];
      this.creaturesGroup.remove(child);
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
    }

    if (!this.currentConfig.showCreatures) return;

    this.creatures.forEach((creature) => {
      let creatureMesh: THREE.Group;
      if (creature.type === 'beetle') {
        creatureMesh = createJewelBeetle(creature);
      } else {
        creatureMesh = createTerrariumSnail(creature);
      }
      this.creaturesGroup.add(creatureMesh);
    });
  }

  public updateConfig(newConfig: Partial<TerrariumConfig>) {
    const prev = { ...this.currentConfig };
    this.currentConfig = { ...this.currentConfig, ...newConfig };

    // Weather change
    if (newConfig.weather && newConfig.weather !== prev.weather) {
      this.weather.setWeather(newConfig.weather);
      terrariumAudio.updateAmbience(newConfig.weather, this.currentConfig.timeHours, this.currentConfig.humidity);
    }

    // Time change
    if (newConfig.timeHours !== undefined && newConfig.timeHours !== prev.timeHours) {
      this.lighting.updateTime(this.currentConfig.timeHours, this.currentConfig.weather);
      terrariumAudio.updateAmbience(this.currentConfig.weather, this.currentConfig.timeHours, this.currentConfig.humidity);
    }

    // Humidity change
    if (newConfig.humidity !== undefined) {
      const condOpacity = Math.max(0, (newConfig.humidity - 40) / 60) * 0.75;
      this.vessel.condensationMaterial.opacity = condOpacity;
      terrariumAudio.updateAmbience(this.currentConfig.weather, this.currentConfig.timeHours, this.currentConfig.humidity);
    }

    // Lid open slider
    if (newConfig.lidOpenAmount !== undefined) {
      this.targetLidY = 0.18 + newConfig.lidOpenAmount * 2.0;
      // Opening the lid triggers a gentle air rush rustle
      if (Math.abs(newConfig.lidOpenAmount - prev.lidOpenAmount) > 0.05) {
        terrariumAudio.playFloraRustle(0.5);
      }
    }

    // Auto rotate
    if (newConfig.autoRotate !== undefined) {
      this.controls.autoRotate = newConfig.autoRotate;
      this.controls.autoRotateSpeed = 1.0;
    }

    // Camera preset
    if (newConfig.cameraPreset && newConfig.cameraPreset !== prev.cameraPreset) {
      this.applyCameraPreset(newConfig.cameraPreset);
    }

    // Show/hide creatures
    if (newConfig.showCreatures !== undefined && newConfig.showCreatures !== prev.showCreatures) {
      this.rebuildCreatures();
    }

    // Vessel Style change
    if (newConfig.vesselStyle && newConfig.vesselStyle !== prev.vesselStyle) {
      this.scene.remove(this.vessel.rootGroup);
      this.vessel = createTerrariumVessel(newConfig.vesselStyle, this.isSoftwareGl);
      this.scene.add(this.vessel.rootGroup);
      this.vessel.lidGroup.position.y = this.currentLidY;
    }

    // Audio controls
    if (newConfig.soundEnabled !== undefined) {
      terrariumAudio.setSoundEnabled(newConfig.soundEnabled);
    }
    if (newConfig.soundVolume !== undefined) {
      terrariumAudio.setVolume(newConfig.soundVolume);
    }

    // Plant selection highlight
    if (newConfig.selectedPlantId !== undefined) {
      this.highlightPlant(newConfig.selectedPlantId);
    }
  }

  public setSpecimens(specimens: PlantSpecimen[]) {
    this.specimens = specimens;
    this.rebuildFlora();
  }

  public setCreatures(creatures: CreatureSpecimen[]) {
    this.creatures = creatures;
    this.rebuildCreatures();
  }

  public applyCameraPreset(preset: CameraPreset) {
    this.isCameraTransitioning = true;
    switch (preset) {
      case 'closeup':
        this.cameraTargetPos.set(0.6, 0.9, 1.5);
        this.controlsTargetLook.set(0.1, 0.7, 0);
        break;
      case 'interior':
        this.cameraTargetPos.set(0.2, 0.75, 0.85);
        this.controlsTargetLook.set(-0.1, 0.65, -0.2);
        break;
      case 'top':
        this.cameraTargetPos.set(0.01, 4.8, 0.1);
        this.controlsTargetLook.set(0, 0.6, 0);
        break;
      case 'isometric':
        this.cameraTargetPos.set(3.2, 2.8, 3.2);
        this.controlsTargetLook.set(0, 0.8, 0);
        break;
      case 'default':
      default:
        this.cameraTargetPos.set(0, 2.2, 4.4);
        this.controlsTargetLook.set(0, 1.0, 0);
        break;
    }
  }

  public focusOnPlant(specimen: PlantSpecimen) {
    this.isCameraTransitioning = true;
    const px = specimen.position[0];
    const py = specimen.position[1] + 0.5;
    const pz = specimen.position[2];

    this.controlsTargetLook.set(px, py + 0.1, pz);
    this.cameraTargetPos.set(px + 0.8, py + 0.4, pz + 1.2);
  }

  public focusOnCreature(creature: CreatureSpecimen) {
    this.isCameraTransitioning = true;
    const cx = creature.position[0];
    const cy = creature.position[1] + 0.5;
    const cz = creature.position[2];

    this.controlsTargetLook.set(cx, cy + 0.05, cz);
    this.cameraTargetPos.set(cx + 0.6, cy + 0.35, cz + 0.8);
  }

  public hydratePlant(plantId: string) {
    const specimen = this.specimens.find((s) => s.id === plantId);
    if (!specimen) return;

    specimen.moisture = Math.min(100, specimen.moisture + 25);
    specimen.health = Math.min(100, specimen.health + 5);

    // Spring bounce animation on the targeted plant group
    const plantMesh = this.floraGroup.getObjectByName(`plant-${plantId}`);
    if (plantMesh) {
      const origScale = plantMesh.scale.clone();
      let step = 0;
      const interval = setInterval(() => {
        step++;
        const s = 1 + Math.sin(step * 0.5) * 0.18 * Math.exp(-step * 0.15);
        plantMesh.scale.set(origScale.x * s, origScale.y * s, origScale.z * s);
        if (step > 25) {
          clearInterval(interval);
          plantMesh.scale.copy(origScale);
        }
      }, 20);
    }

    terrariumAudio.playInteractionTone(680);
    this.onSelectPlantCallback?.(specimen);
  }

  public petCreature(creatureId: string) {
    const creature = this.creatures.find((c) => c.id === creatureId);
    if (!creature) return;

    const mesh = this.creaturesGroup.getObjectByName(`creature-${creatureId}`);
    if (mesh) {
      const origScale = mesh.scale.clone();
      let step = 0;
      const interval = setInterval(() => {
        step++;
        const s = 1 + Math.sin(step * 0.7) * 0.15 * Math.exp(-step * 0.18);
        mesh.scale.set(origScale.x * s, origScale.y * s, origScale.z * s);
        if (step > 20) {
          clearInterval(interval);
          mesh.scale.copy(origScale);
        }
      }, 20);
    }

    terrariumAudio.playCreatureMovement(creature.type);
    terrariumAudio.playInteractionTone(580);
    this.onSelectCreatureCallback?.(creature);
  }

  private highlightPlant(plantId: string | null) {
    this.floraGroup.children.forEach((child) => {
      const isSelected = child.name === `plant-${plantId}`;
      child.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const mat = (node as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat && mat.emissive) {
            if (isSelected) {
              mat.emissive.setHex(0x334411);
            } else {
              const baseEmissive = (child.userData?.baseEmissive as THREE.Color) || null;
              if (baseEmissive) {
                mat.emissive.copy(baseEmissive);
              } else {
                mat.emissive.setHex(0x000000);
              }
            }
          }
        }
      });
    });
  }

  private onPointerDown = (event: MouseEvent) => {
    if (event.button !== 0) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. Raycast Creatures
    const creatureIntersects = this.raycaster.intersectObjects(this.creaturesGroup.children, true);
    if (creatureIntersects.length > 0) {
      let hitObj: THREE.Object3D | null = creatureIntersects[0].object;
      let creatureId: string | null = null;
      while (hitObj && hitObj !== this.creaturesGroup) {
        if (hitObj.name.startsWith('creature-')) {
          creatureId = hitObj.name.replace('creature-', '');
          break;
        }
        hitObj = hitObj.parent;
      }

      if (creatureId) {
        const found = this.creatures.find((c) => c.id === creatureId);
        if (found) {
          this.petCreature(creatureId);
          this.focusOnCreature(found);
          this.onSelectCreatureCallback?.(found);
          this.onSelectPlantCallback?.(null);
          return;
        }
      }
    }

    // 2. Raycast Flora
    const intersects = this.raycaster.intersectObjects(this.floraGroup.children, true);
    if (intersects.length > 0) {
      let hitObj: THREE.Object3D | null = intersects[0].object;
      let plantId: string | null = null;

      while (hitObj && hitObj !== this.floraGroup) {
        if (hitObj.name.startsWith('plant-')) {
          plantId = hitObj.name.replace('plant-', '');
          break;
        }
        hitObj = hitObj.parent;
      }

      if (plantId) {
        const found = this.specimens.find((s) => s.id === plantId);
        if (found) {
          this.highlightPlant(plantId);
          this.focusOnPlant(found);
          this.onSelectPlantCallback?.(found);
          this.onSelectCreatureCallback?.(null);
          terrariumAudio.playInteractionTone(440);
          return;
        }
      }
    }
  };

  private onResize = () => {
    if (!this.container || this.isDisposed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };

  private tick = () => {
    if (this.isDisposed) return;

    const delta = Math.min(0.1, this.clock.getDelta());
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Time cycle auto-advance
    if (this.currentConfig.autoCycleTime) {
      const advance = delta * this.currentConfig.timeCycleSpeed * 0.2;
      this.currentConfig.timeHours = (this.currentConfig.timeHours + advance) % 24;
      this.lighting.updateTime(this.currentConfig.timeHours, this.currentConfig.weather);
      terrariumAudio.updateAmbience(
        this.currentConfig.weather,
        this.currentConfig.timeHours,
        this.currentConfig.humidity
      );
    }

    // 2. Camera smooth transition interpolation
    if (this.isCameraTransitioning) {
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.cameraTargetPos.x, 4.5, delta);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.cameraTargetPos.y, 4.5, delta);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.cameraTargetPos.z, 4.5, delta);

      this.controls.target.x = THREE.MathUtils.damp(this.controls.target.x, this.controlsTargetLook.x, 4.5, delta);
      this.controls.target.y = THREE.MathUtils.damp(this.controls.target.y, this.controlsTargetLook.y, 4.5, delta);
      this.controls.target.z = THREE.MathUtils.damp(this.controls.target.z, this.controlsTargetLook.z, 4.5, delta);

      if (this.camera.position.distanceTo(this.cameraTargetPos) < 0.05) {
        this.isCameraTransitioning = false;
      }
    }

    // 3. Lid Exploded / Open interpolation
    this.currentLidY = THREE.MathUtils.damp(this.currentLidY, this.targetLidY, 5.0, delta);
    this.vessel.lidGroup.position.y = this.currentLidY;

    // 4. Subtle procedural wind sway on flora
    const windSpeed = this.currentConfig.weather === 'storm' ? 3.5 : 1.2;
    const windStrength = this.currentConfig.weather === 'storm' ? 0.04 : 0.015;

    this.floraGroup.children.forEach((child, idx) => {
      const offset = (child.userData?.animOffset as number) || idx;
      const sway = Math.sin(elapsedTime * windSpeed + offset) * windStrength;
      child.rotation.z = sway;

      const isNight = this.currentConfig.timeHours > 19 || this.currentConfig.timeHours < 5.5;
      const bioLight = child.userData?.bioLight as THREE.PointLight | undefined;
      if (bioLight) {
        const pulse = 0.5 + Math.sin(elapsedTime * 2.5 + offset) * 0.3;
        bioLight.intensity = isNight ? pulse : pulse * 0.15;
      }
    });

    // 5. Animate Micro-Fauna (Beetle walking kinematics & Snail gliding)
    this.creatureSoundTimer += delta;
    this.creaturesGroup.children.forEach((cGroup) => {
      const uData = cGroup.userData as CreatureUserData;
      if (!uData || !uData.pathPoints || uData.pathPoints.length < 2) return;

      const pts = uData.pathPoints;
      // Advance along path
      const speed = uData.creatureType === 'beetle' ? 0.08 : 0.025;
      uData.pathProgress = (uData.pathProgress + delta * speed * 0.15) % 1.0;

      const totalSegs = pts.length;
      const pScaled = uData.pathProgress * totalSegs;
      const segIndex = Math.floor(pScaled);
      const nextIndex = (segIndex + 1) % totalSegs;
      const t = pScaled - segIndex;

      const p0 = pts[segIndex];
      const p1 = pts[nextIndex];

      cGroup.position.lerpVectors(p0, p1, t);

      // Orient toward movement heading
      const dirX = p1.x - p0.x;
      const dirZ = p1.z - p0.z;
      const targetAngle = Math.atan2(dirX, dirZ);
      cGroup.rotation.y = THREE.MathUtils.damp(cGroup.rotation.y, targetAngle, 3.0, delta);

      if (uData.creatureType === 'beetle') {
        // Articulate 6 legs
        if (uData.legs) {
          uData.legs.forEach((leg, idx) => {
            const phase = idx % 2 === 0 ? 0 : Math.PI;
            leg.rotation.x = Math.sin(elapsedTime * 14 + phase) * 0.35;
          });
        }
        // Twitch antennae
        if (uData.antennae) {
          uData.antennae.forEach((ant, idx) => {
            ant.rotation.y = Math.sin(elapsedTime * 6 + idx * 2) * 0.2;
          });
        }
      } else if (uData.creatureType === 'snail') {
        // Gentle bob on eye stalks
        if (uData.eyeStalks) {
          uData.eyeStalks.forEach((stalk, idx) => {
            stalk.rotation.z = Math.sin(elapsedTime * 2.5 + idx) * 0.12;
            stalk.rotation.x = Math.cos(elapsedTime * 1.8 + idx) * 0.08;
          });
        }
      }
    });

    // 6. Update Weather microclimate particles
    this.weather.update(delta, this.currentConfig.timeHours, this.currentConfig.humidity);

    // 7. Update Controls
    this.controls.update();

    // 8. Render frame
    this.renderer.render(this.scene, this.camera);

    // Software WebGL pacing guard
    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(callback: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();

    const poll = () => {
      if (this.isDisposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(callback, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public getTimeHours(): number {
    return this.currentConfig.timeHours;
  }

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.onResize);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);

    this.lighting.dispose();
    this.weather.dispose();
    this.controls.dispose();
    this.renderer.dispose();

    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

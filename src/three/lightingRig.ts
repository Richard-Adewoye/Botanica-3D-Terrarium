import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export class LightingRig {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;

  // Lights
  public sunLight: THREE.DirectionalLight;
  public moonLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public rimLight: THREE.DirectionalLight;

  // Starfield
  private starPoints: THREE.Points;
  private starMaterial: THREE.PointsMaterial;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, isSoftwareGl = false) {
    this.scene = scene;
    this.renderer = renderer;

    // 1. Mandatory Studio Environment Reflection (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    this.scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    pmremGenerator.dispose();

    // 2. Warm Sun Key Light (Tight orthographic shadow frustum)
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    this.sunLight.name = 'sun-key-light';
    this.sunLight.castShadow = !isSoftwareGl;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 14;
    const d = 2.2;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    // 3. Moon Light for night illumination
    this.moonLight = new THREE.DirectionalLight(0x7c98c7, 0.4);
    this.moonLight.name = 'moon-light';
    this.moonLight.position.set(-2, 4, -2);
    this.scene.add(this.moonLight);

    // 4. Cool sky / warm ground HemisphereLight Fill
    this.hemiLight = new THREE.HemisphereLight(0xcde6ff, 0x3d352b, 0.8);
    this.hemiLight.name = 'ambient-hemi-fill';
    this.scene.add(this.hemiLight);

    // 5. Rim / Backlight for translucent glass and leaf edge highlights
    this.rimLight = new THREE.DirectionalLight(0xaad5ff, 0.6);
    this.rimLight.name = 'rim-backlight';
    this.rimLight.position.set(0, 3, -4);
    this.scene.add(this.rimLight);

    // 6. Horizon Fog (matches background sky)
    this.scene.fog = new THREE.FogExp2(0x1a2129, 0.055);

    // 7. Celestial Starfield (visible at dusk/night)
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random()); // Upper hemisphere
      const dist = 14 + Math.random() * 4;
      starPos[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.max(1.5, dist * Math.cos(phi));
      starPos[i * 3 + 2] = dist * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));

    this.starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.06,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.starPoints = new THREE.Points(starGeo, this.starMaterial);
    this.scene.add(this.starPoints);
  }

  public updateTime(timeHours: number, weather: string) {
    // Solar angle: 0h = midnight, 6h = sunrise, 12h = noon, 18h = sunset, 24h = midnight
    const solarAngle = ((timeHours - 6) / 24) * Math.PI * 2;
    const sunElevation = Math.sin(solarAngle);
    const sunAzimuth = Math.cos(solarAngle);

    // Sun position on orbital dome
    this.sunLight.position.set(sunAzimuth * 4.5, Math.max(-1.5, sunElevation * 5.0), 3.0);
    this.moonLight.position.set(-sunAzimuth * 4.0, Math.max(0.5, -sunElevation * 4.5), -2.5);

    // Sky, fog, and illumination colors based on time
    const skyColor = new THREE.Color();
    const groundColor = new THREE.Color(0x181410);

    let sunIntensity = 0;
    let moonIntensity = 0;
    let starOpacity = 0;

    if (sunElevation > 0.1) {
      // Daytime (6:30 to 17:30)
      const noonFactor = Math.min(1, sunElevation * 1.4);
      // Interpolate from golden morning to high noon
      skyColor.setRGB(
        0.55 + 0.25 * noonFactor,
        0.65 + 0.2 * noonFactor,
        0.8 + 0.15 * noonFactor
      );
      this.sunLight.color.setRGB(1.0, 0.95 + 0.05 * noonFactor, 0.85 + 0.15 * noonFactor);
      sunIntensity = 1.8 + 0.8 * noonFactor;
      moonIntensity = 0.05;
      starOpacity = 0.0;
    } else if (sunElevation > -0.15) {
      // Golden Hour / Twilight transition (dawn: 5:00-6:30, dusk: 17:30-19:30)
      const t = (sunElevation + 0.15) / 0.25; // 0 (twilight) to 1 (day)
      skyColor.setRGB(
        0.45 * (1 - t) + 0.7 * t,
        0.28 * (1 - t) + 0.6 * t,
        0.4 * (1 - t) + 0.75 * t
      );
      this.sunLight.color.setRGB(1.0, 0.6 + 0.35 * t, 0.3 + 0.55 * t);
      sunIntensity = 1.5 * t;
      moonIntensity = 0.3 * (1 - t);
      starOpacity = (1 - t) * 0.4;
    } else {
      // Deep Night (19:30 to 5:00)
      skyColor.setRGB(0.04, 0.05, 0.09);
      sunIntensity = 0.0;
      moonIntensity = 0.55;
      starOpacity = 0.85;
    }

    // Weather attenuation (clouds/storm darken the sky)
    if (weather === 'storm') {
      skyColor.multiplyScalar(0.45);
      sunIntensity *= 0.25;
      moonIntensity *= 0.35;
      starOpacity = 0.0;
    } else if (weather === 'rain') {
      skyColor.multiplyScalar(0.7);
      sunIntensity *= 0.55;
      moonIntensity *= 0.6;
      starOpacity *= 0.2;
    } else if (weather === 'mist') {
      skyColor.lerp(new THREE.Color(0xdce5eb), 0.35);
      sunIntensity *= 0.8;
    }

    this.sunLight.intensity = sunIntensity;
    this.moonLight.intensity = moonIntensity;
    this.hemiLight.color.copy(skyColor);
    this.hemiLight.groundColor.copy(groundColor);
    this.hemiLight.intensity = Math.max(0.2, 0.3 + sunElevation * 0.5);

    // Synchronize scene background & fog
    this.scene.background = skyColor;
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(skyColor);
    }

    this.starMaterial.opacity = starOpacity;
  }

  public dispose() {
    this.starPoints.geometry.dispose();
    this.starMaterial.dispose();
  }
}

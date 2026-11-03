import * as THREE from 'three';
import { WeatherType } from '../types/terrarium';

/**
 * Procedural Weather & Microclimate Particle Simulator
 * Lossless 60fps performance with zero GC allocations in loop.
 */

export class WeatherSystem {
  public group: THREE.Group;

  // Particle systems
  private rainPoints: THREE.Points | null = null;
  private rainGeo: THREE.BufferGeometry | null = null;
  private rainCount = 450;
  private rainVelocities: Float32Array;

  private mistPoints: THREE.Points | null = null;
  private mistGeo: THREE.BufferGeometry | null = null;
  private mistCount = 180;
  private mistAngles: Float32Array;

  private sporePoints: THREE.Points | null = null;
  private sporeGeo: THREE.BufferGeometry | null = null;
  private sporeCount = 90;
  private sporeVelocities: Float32Array;

  // Lightning state for storms
  private lightningLight: THREE.PointLight;
  private lightningTimer = 0;
  private isFlashing = false;

  private currentWeather: WeatherType = 'clear';

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'weather-system';

    this.rainVelocities = new Float32Array(this.rainCount);
    this.mistAngles = new Float32Array(this.mistCount);
    this.sporeVelocities = new Float32Array(this.sporeCount * 3);

    this.lightningLight = new THREE.PointLight(0xa5c9eb, 0, 15);
    this.lightningLight.position.set(0, 4.5, 0);
    this.group.add(this.lightningLight);

    this.initRain();
    this.initMist();
    this.initSpores();
  }

  private initRain() {
    this.rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);

    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2.2;
      positions[i * 3 + 1] = 0.5 + Math.random() * 2.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
      this.rainVelocities[i] = 3.5 + Math.random() * 2.5;
    }

    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x9dc6e8,
      size: 0.035,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.rainPoints = new THREE.Points(this.rainGeo, rainMat);
    this.group.add(this.rainPoints);
  }

  private initMist() {
    this.mistGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.mistCount * 3);

    for (let i = 0; i < this.mistCount; i++) {
      const radius = Math.random() * 1.0;
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0.5 + Math.random() * 1.8;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      this.mistAngles[i] = angle;
    }

    this.mistGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mistMat = new THREE.PointsMaterial({
      color: 0xebf2f5,
      size: 0.18,
      transparent: true,
      opacity: 0,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    this.mistPoints = new THREE.Points(this.mistGeo, mistMat);
    this.group.add(this.mistPoints);
  }

  private initSpores() {
    this.sporeGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.sporeCount * 3);
    const colors = new Float32Array(this.sporeCount * 3);

    const cGold = new THREE.Color(0xf6d365);
    const cEmerald = new THREE.Color(0x42f5b3);

    for (let i = 0; i < this.sporeCount; i++) {
      const r = Math.random() * 0.95;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = 0.4 + Math.random() * 1.7;
      positions[i * 3 + 2] = Math.sin(theta) * r;

      this.sporeVelocities[i * 3] = (Math.random() - 0.5) * 0.15;
      this.sporeVelocities[i * 3 + 1] = 0.05 + Math.random() * 0.12;
      this.sporeVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.15;

      const c = Math.random() > 0.5 ? cGold : cEmerald;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    this.sporeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.sporeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const sporeMat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.045,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.sporePoints = new THREE.Points(this.sporeGeo, sporeMat);
    this.group.add(this.sporePoints);
  }

  public setWeather(weather: WeatherType) {
    this.currentWeather = weather;
  }

  public update(delta: number, timeHours: number, humidity: number) {
    const isNight = timeHours > 19 || timeHours < 5.5;

    // 1. Rain update
    if (this.rainPoints && this.rainGeo) {
      const targetRainOpacity = this.currentWeather === 'storm' ? 0.75 : this.currentWeather === 'rain' ? 0.45 : 0;
      const rainMat = this.rainPoints.material as THREE.PointsMaterial;
      rainMat.opacity += (targetRainOpacity - rainMat.opacity) * Math.min(1, delta * 3);

      if (rainMat.opacity > 0.01) {
        const pos = this.rainGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < this.rainCount; i++) {
          pos[i * 3 + 1] -= this.rainVelocities[i] * delta;
          if (pos[i * 3 + 1] < 0.45) {
            pos[i * 3 + 1] = 2.6 + Math.random() * 0.4;
            pos[i * 3] = (Math.random() - 0.5) * 2.0;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 2.0;
          }
        }
        this.rainGeo.attributes.position.needsUpdate = true;
      }
    }

    // 2. Mist update
    if (this.mistPoints && this.mistGeo) {
      const targetMistOpacity =
        this.currentWeather === 'mist'
          ? 0.35 + (humidity / 100) * 0.25
          : this.currentWeather === 'storm'
          ? 0.2
          : (humidity > 70 ? (humidity - 70) * 0.005 : 0);

      const mistMat = this.mistPoints.material as THREE.PointsMaterial;
      mistMat.opacity += (targetMistOpacity - mistMat.opacity) * Math.min(1, delta * 2);

      if (mistMat.opacity > 0.01) {
        const pos = this.mistGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < this.mistCount; i++) {
          this.mistAngles[i] += delta * 0.25;
          const r = Math.sqrt(pos[i * 3] * pos[i * 3] + pos[i * 3 + 2] * pos[i * 3 + 2]);
          pos[i * 3] = Math.cos(this.mistAngles[i]) * Math.min(1.05, r + delta * 0.02);
          pos[i * 3 + 2] = Math.sin(this.mistAngles[i]) * Math.min(1.05, r + delta * 0.02);
          pos[i * 3 + 1] += Math.sin(this.mistAngles[i] * 3) * 0.002;

          if (pos[i * 3 + 1] > 2.2 || r > 1.1) {
            pos[i * 3 + 1] = 0.55 + Math.random() * 0.3;
          }
        }
        this.mistGeo.attributes.position.needsUpdate = true;
      }
    }

    // 3. Spores & Fireflies update
    if (this.sporePoints && this.sporeGeo) {
      // Glow brighter at night or during 'spores' weather
      const sporeMat = this.sporePoints.material as THREE.PointsMaterial;
      const targetSporeOpacity = this.currentWeather === 'spores' ? 0.9 : isNight ? 0.8 : 0.3;
      sporeMat.opacity += (targetSporeOpacity - sporeMat.opacity) * Math.min(1, delta * 2);

      const pos = this.sporeGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < this.sporeCount; i++) {
        pos[i * 3] += this.sporeVelocities[i * 3] * delta + Math.sin(pos[i * 3 + 1] * 4) * 0.003;
        pos[i * 3 + 1] += this.sporeVelocities[i * 3 + 1] * delta;
        pos[i * 3 + 2] += this.sporeVelocities[i * 3 + 2] * delta + Math.cos(pos[i * 3 + 1] * 4) * 0.003;

        // Containment within terrarium dome radius ~1.0
        const dist = Math.sqrt(pos[i * 3] * pos[i * 3] + pos[i * 3 + 2] * pos[i * 3 + 2]);
        if (dist > 1.05) {
          pos[i * 3] *= 0.95;
          pos[i * 3 + 2] *= 0.95;
          this.sporeVelocities[i * 3] *= -0.8;
          this.sporeVelocities[i * 3 + 2] *= -0.8;
        }

        if (pos[i * 3 + 1] > 2.2) {
          pos[i * 3 + 1] = 0.5;
        }
      }
      this.sporeGeo.attributes.position.needsUpdate = true;
    }

    // 4. Storm Lightning simulation
    if (this.currentWeather === 'storm') {
      this.lightningTimer -= delta;
      if (this.lightningTimer <= 0) {
        if (!this.isFlashing) {
          // Trigger lightning flash
          this.lightningLight.intensity = 4.5 + Math.random() * 3.5;
          this.isFlashing = true;
          this.lightningTimer = 0.08 + Math.random() * 0.06;
        } else {
          // Reset flash
          this.lightningLight.intensity = 0;
          this.isFlashing = false;
          this.lightningTimer = 3.5 + Math.random() * 6.0; // Next flash delay
        }
      }
    } else {
      this.lightningLight.intensity = 0;
      this.isFlashing = false;
    }
  }

  public dispose() {
    this.rainGeo?.dispose();
    this.mistGeo?.dispose();
    this.sporeGeo?.dispose();
    if (this.rainPoints) (this.rainPoints.material as THREE.Material).dispose();
    if (this.mistPoints) (this.mistPoints.material as THREE.Material).dispose();
    if (this.sporePoints) (this.sporePoints.material as THREE.Material).dispose();
  }
}

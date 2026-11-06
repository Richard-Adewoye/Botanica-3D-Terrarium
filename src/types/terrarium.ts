export type TimeOfDayPreset = 'dawn' | 'noon' | 'golden' | 'dusk' | 'midnight';

export type WeatherType = 'clear' | 'mist' | 'rain' | 'storm' | 'spores';

export type CameraPreset = 'default' | 'closeup' | 'interior' | 'top' | 'isometric';

export type VesselStyle = 'hexagonal' | 'bell_jar' | 'geometric_dome';

export interface GrowthHistoryPoint {
  timestamp: string; // e.g. "02:00", "06:00", "12:00"
  health: number; // 0 to 100
  moisture: number; // 0 to 100
  event?: string; // e.g. "Hydrated", "Dew Absorption", "Photosynthesis", "Dry Spell"
}

export interface PlantSpecimen {
  id: string;
  name: string;
  scientificName: string;
  type: 'bonsai' | 'fern' | 'succulent' | 'mushroom' | 'crystal' | 'pitcher';
  position: [number, number, number];
  scale: number;
  rotationY: number;
  health: number; // 0 to 100
  moisture: number; // 0 to 100
  bloomProgress: number; // 0 to 1
  description: string;
  glowColor?: string;
  growthHistory: GrowthHistoryPoint[];
}

export interface CreatureSpecimen {
  id: string;
  name: string;
  scientificName: string;
  type: 'beetle' | 'snail';
  position: [number, number, number];
  rotationY: number;
  scale: number;
  activityLevel: number; // 0 to 100
  description: string;
}

export type SoundLayerId = 'wind' | 'rain' | 'dayInsects' | 'birds' | 'crickets' | 'rustle' | 'droplets';

export interface SoundLayersConfig {
  wind: boolean;
  rain: boolean;
  dayInsects: boolean;
  birds: boolean;
  crickets: boolean;
  rustle: boolean;
  droplets: boolean;
}

export interface TerrariumConfig {
  timeHours: number; // 0 to 24 (e.g. 12 = noon)
  autoCycleTime: boolean;
  timeCycleSpeed: number; // multiplier
  weather: WeatherType;
  humidity: number; // 0 to 100%
  showWeatherParticles: boolean; // toggle 3D rain/fog/spore particle system
  lidOpenAmount: number; // 0 (closed) to 1 (fully lifted/exploded)
  cameraPreset: CameraPreset;
  autoRotate: boolean;
  vesselStyle: VesselStyle;
  soundEnabled: boolean;
  soundVolume: number;
  soundLayers: SoundLayersConfig;
  bloomIntensity: number; // 0.0 to 1.5
  selectedPlantId: string | null;
  selectedCreatureId: string | null;
  showCreatures: boolean;
  seed: number;
}

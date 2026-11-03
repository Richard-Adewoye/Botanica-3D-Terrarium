export type TimeOfDayPreset = 'dawn' | 'noon' | 'golden' | 'dusk' | 'midnight';

export type WeatherType = 'clear' | 'mist' | 'rain' | 'storm' | 'spores';

export type CameraPreset = 'default' | 'closeup' | 'interior' | 'top' | 'isometric';

export type VesselStyle = 'hexagonal' | 'bell_jar' | 'geometric_dome';

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
}

export interface TerrariumConfig {
  timeHours: number; // 0 to 24 (e.g. 12 = noon)
  autoCycleTime: boolean;
  timeCycleSpeed: number; // multiplier
  weather: WeatherType;
  humidity: number; // 0 to 100%
  lidOpenAmount: number; // 0 (closed) to 1 (fully lifted/exploded)
  cameraPreset: CameraPreset;
  autoRotate: boolean;
  vesselStyle: VesselStyle;
  soundEnabled: boolean;
  soundVolume: number;
  selectedPlantId: string | null;
  seed: number;
}

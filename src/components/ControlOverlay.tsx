import React, { useState } from 'react';
import { MicroclimateForecastPanel } from './MicroclimateForecastPanel';
import {
  TerrariumConfig,
  PlantSpecimen,
  CreatureSpecimen,
  WeatherType,
  CameraPreset,
  SoundLayerId,
  SoundLayersConfig,
} from '../types/terrarium';
import {
  Sun,
  Moon,
  CloudRain,
  CloudFog,
  CloudLightning,
  Sparkles,
  Camera,
  Layers,
  Volume2,
  VolumeX,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Droplets,
  Flower2,
  Bug,
  RefreshCw,
  Play,
  Wind,
  Download,
  Music,
  SlidersHorizontal,
  Volume1,
  Video,
} from 'lucide-react';
import { DEFAULT_SOUND_LAYERS, terrariumAudio } from '../audio/proceduralAudio';

interface ControlOverlayProps {
  config: TerrariumConfig;
  onUpdateConfig: (newConfig: Partial<TerrariumConfig>) => void;
  specimens: PlantSpecimen[];
  creatures: CreatureSpecimen[];
  onSelectPlant: (specimen: PlantSpecimen | null) => void;
  onSelectCreature: (creature: CreatureSpecimen | null) => void;
  onHydratePlant: (plantId: string) => void;
  onRegenerateFlora: () => void;
  onCaptureSnapshot: () => void;
  onOpenTimeLapse?: (plantId?: string) => void;
}

type TabType = 'time' | 'weather' | 'flora' | 'camera' | 'audio';

export const ControlOverlay: React.FC<ControlOverlayProps> = ({
  config,
  onUpdateConfig,
  specimens,
  creatures,
  onSelectPlant,
  onSelectCreature,
  onHydratePlant,
  onRegenerateFlora,
  onCaptureSnapshot,
  onOpenTimeLapse,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('time');

  // Toggle collapse with 'H' key & snapshot with 'S' key
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'h' || e.key === 'H') {
        setIsCollapsed((prev) => !prev);
      } else if (e.key === 's' || e.key === 'S') {
        onCaptureSnapshot();
      } else if (e.key === 't' || e.key === 'T') {
        onOpenTimeLapse?.();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCaptureSnapshot, onOpenTimeLapse]);

  // Format hours into 12-hour/24-hour readable string
  const formatTime = (hours: number) => {
    const totalMinutes = Math.floor(hours * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${pad(m)} ${ampm} (${pad(h)}:${pad(m)})`;
  };

  // Weather descriptions & icons
  const weatherIcons: Record<WeatherType, React.ReactNode> = {
    clear: <Sun className="w-4 h-4 text-amber-400" />,
    mist: <CloudFog className="w-4 h-4 text-slate-300" />,
    rain: <CloudRain className="w-4 h-4 text-sky-400" />,
    storm: <CloudLightning className="w-4 h-4 text-indigo-400" />,
    spores: <Sparkles className="w-4 h-4 text-emerald-400" />,
  };

  // Compute active sound dynamics
  const isDay = config.timeHours >= 6.5 && config.timeHours <= 19.0;
  const isNight = config.timeHours > 19.5 || config.timeHours < 5.5;
  const isRaining = config.weather === 'rain' || config.weather === 'storm';

  const soundLayers = config.soundLayers || DEFAULT_SOUND_LAYERS;

  const handleToggleLayer = (layerId: SoundLayerId) => {
    const updated = {
      ...soundLayers,
      [layerId]: !soundLayers[layerId],
    };
    onUpdateConfig({ soundLayers: updated });
    // Also ensure master audio is enabled if turning on a layer
    if (!config.soundEnabled && !soundLayers[layerId]) {
      onUpdateConfig({ soundEnabled: true, soundLayers: updated });
    }
  };

  const handleSetAllLayers = (enabled: boolean) => {
    const updated: SoundLayersConfig = {
      wind: enabled,
      rain: enabled,
      dayInsects: enabled,
      birds: enabled,
      crickets: enabled,
      rustle: enabled,
      droplets: enabled,
    };
    onUpdateConfig({ soundLayers: updated });
    if (enabled && !config.soundEnabled) {
      onUpdateConfig({ soundEnabled: true, soundLayers: updated });
    }
  };

  const SOUND_LAYER_ITEMS: Array<{
    id: SoundLayerId;
    name: string;
    category: string;
    icon: React.ReactNode;
    desc: string;
    preview: () => void;
  }> = [
    {
      id: 'wind',
      name: 'Wind & Breeze',
      category: 'Atmosphere',
      icon: <Wind className="w-3.5 h-3.5 text-teal-400" />,
      desc: 'Resonant sweeping air filters',
      preview: () => terrariumAudio.playFloraRustle(1.2),
    },
    {
      id: 'rain',
      name: 'Rain & Storm',
      category: 'Precipitation',
      icon: <CloudRain className="w-3.5 h-3.5 text-sky-400" />,
      desc: 'Rain patter & thunder rumbles',
      preview: () => terrariumAudio.playThunderRumble(),
    },
    {
      id: 'dayInsects',
      name: 'Daytime Insects',
      category: 'Fauna • Day',
      icon: <Sun className="w-3.5 h-3.5 text-amber-400" />,
      desc: 'Cicada FM trills & grasshopper clicks',
      preview: () => terrariumAudio.playDayGrasshopperChirp(),
    },
    {
      id: 'birds',
      name: 'Canopy Songbirds',
      category: 'Fauna • Day',
      icon: <Music className="w-3.5 h-3.5 text-emerald-400" />,
      desc: 'Melodic sine bird calls & whistles',
      preview: () => terrariumAudio.playBirdSong(),
    },
    {
      id: 'crickets',
      name: 'Night Crickets',
      category: 'Fauna • Night',
      icon: <Moon className="w-3.5 h-3.5 text-indigo-400" />,
      desc: 'Staccato stridulation pulses',
      preview: () => terrariumAudio.playCricketStridulation(),
    },
    {
      id: 'rustle',
      name: 'Flora Rustle',
      category: 'Ecosystem',
      icon: <Flower2 className="w-3.5 h-3.5 text-green-400" />,
      desc: 'Foliage friction & bark crawls',
      preview: () => terrariumAudio.playFloraRustle(1.0),
    },
    {
      id: 'droplets',
      name: 'Water Droplets',
      category: 'Hydration',
      icon: <Droplets className="w-3.5 h-3.5 text-blue-400" />,
      desc: 'Glass taps & soil drop chimes',
      preview: () => terrariumAudio.playWaterDroplet(),
    },
  ];

  return (
    <>
      {/* Top-Left Minimal Title / Spec Badge & Snapshot Trigger */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-auto">
        <div className="flex items-center gap-2.5 bg-neutral-900/90 border border-neutral-700/80 px-3 py-2 rounded-xl shadow-lg text-neutral-100">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <div>
            <h1 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              Botanica 3D Terrarium
              <span className="text-[10px] font-mono text-neutral-400 font-normal px-1.5 py-0.5 bg-neutral-800 rounded">
                v1.3 Time-Lapse Studio
              </span>
            </h1>
            <p className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
              <span>{formatTime(config.timeHours)}</span>
              <span>•</span>
              <span className="capitalize">{config.weather}</span>
              <span>•</span>
              <span>{config.humidity}% Humidity</span>
              <span>•</span>
              <span className={config.soundEnabled ? 'text-emerald-400' : 'text-neutral-500'}>
                {config.soundEnabled ? 'Audio Live' : 'Muted'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            {onOpenTimeLapse && (
              <button
                onClick={() => onOpenTimeLapse()}
                className="flex items-center gap-1.5 bg-emerald-700/90 hover:bg-emerald-600 active:bg-emerald-800 text-white text-xs font-medium py-1.5 px-3 rounded-lg transition-colors cursor-pointer shadow border border-emerald-400/30"
                title="Launch simulated plant growth time-lapse studio (Key: T)"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Time-Lapse</span>
              </button>
            )}

            <button
              onClick={onCaptureSnapshot}
              className="flex items-center gap-1.5 bg-sky-600/90 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg transition-colors cursor-pointer shadow border border-sky-400/30"
              title="Capture 3D render snapshot as PNG (Key: S)"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Snapshot</span>
            </button>
          </div>
        </div>

        {/* Quick hint banner */}
        <div className="text-[11px] text-neutral-400 bg-neutral-950/80 border border-neutral-800 px-3 py-1.5 rounded-lg max-w-sm shadow">
          <span>Click flora to inspect. Press <strong>&apos;T&apos;</strong> for Time-Lapse, <strong>&apos;S&apos;</strong> for snapshot.</span>
        </div>
      </div>

      {/* Consolidated Bottom Dock */}
      <div
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-[960px] transition-transform duration-300 ease-out select-none ${
          isCollapsed ? 'translate-y-[calc(100%-38px)]' : 'translate-y-0'
        }`}
      >
        {/* Collapse / Expand Tab Bar Button */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 px-4 py-1 bg-neutral-900/95 hover:bg-neutral-800 text-neutral-300 text-xs font-medium rounded-t-lg border-t border-x border-neutral-700/80 shadow cursor-pointer transition-colors"
            title="Toggle Controls Dock (Key: H)"
          >
            {isCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Show Controls Dock</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Hide Controls</span>
              </>
            )}
          </button>
        </div>

        {/* Dock Main Window */}
        <div className="bg-neutral-900/95 text-neutral-100 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden">
          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-neutral-800/90 px-3 pt-2 bg-neutral-950/70 overflow-x-auto gap-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('time')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'time'
                    ? 'border-emerald-500 text-white bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Day & Time</span>
              </button>

              <button
                onClick={() => setActiveTab('weather')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'weather'
                    ? 'border-emerald-500 text-white bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                <span>Weather & Moisture</span>
              </button>

              <button
                onClick={() => setActiveTab('flora')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'flora'
                    ? 'border-emerald-500 text-white bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
                }`}
              >
                <Flower2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Flora & Fauna</span>
              </button>

              <button
                onClick={() => setActiveTab('camera')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'camera'
                    ? 'border-emerald-500 text-white bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span>Camera Views</span>
              </button>

              <button
                onClick={() => setActiveTab('audio')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'audio'
                    ? 'border-emerald-500 text-white bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
                }`}
              >
                {config.soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
                )}
                <span>Ambient Audio & Layers</span>
              </button>
            </div>

            {/* Quick actions: Auto-rotate & Snapshot */}
            <div className="flex items-center gap-1.5 pb-1.5">
              <button
                onClick={onCaptureSnapshot}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors cursor-pointer"
                title="Capture 3D render snapshot as PNG (Shortcut: S)"
              >
                <Camera className="w-3 h-3 text-sky-400" />
                <span>Snapshot</span>
              </button>

              <button
                onClick={() => onUpdateConfig({ autoRotate: !config.autoRotate })}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                  config.autoRotate
                    ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                    : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                }`}
                title="Toggle continuous turntable rotation"
              >
                <RotateCw className={`w-3 h-3 ${config.autoRotate ? 'text-emerald-400' : ''}`} />
                <span>Orbit</span>
              </button>
            </div>
          </div>

          {/* Tab Panel Content */}
          <div className="p-4 bg-neutral-900 min-h-[125px] flex flex-col justify-center">
            {/* 1. Time & Lighting Tab */}
            {activeTab === 'time' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-neutral-200">Solar Trajectory:</span>
                    <span className="text-xs font-mono text-amber-300 font-semibold">
                      {formatTime(config.timeHours)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.autoCycleTime}
                        onChange={(e) => onUpdateConfig({ autoCycleTime: e.target.checked })}
                        className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                      <span>Auto Time Cycle</span>
                    </label>

                    {config.autoCycleTime && (
                      <div className="flex items-center gap-1 text-[11px] text-neutral-400 ml-2">
                        <span>Speed:</span>
                        <button
                          onClick={() => onUpdateConfig({ timeCycleSpeed: 1 })}
                          className={`px-1.5 py-0.5 rounded ${config.timeCycleSpeed === 1 ? 'bg-neutral-800 text-white font-semibold' : 'hover:bg-neutral-800'}`}
                        >
                          1x
                        </button>
                        <button
                          onClick={() => onUpdateConfig({ timeCycleSpeed: 3 })}
                          className={`px-1.5 py-0.5 rounded ${config.timeCycleSpeed === 3 ? 'bg-neutral-800 text-white font-semibold' : 'hover:bg-neutral-800'}`}
                        >
                          3x
                        </button>
                        <button
                          onClick={() => onUpdateConfig({ timeCycleSpeed: 6 })}
                          className={`px-1.5 py-0.5 rounded ${config.timeCycleSpeed === 6 ? 'bg-neutral-800 text-white font-semibold' : 'hover:bg-neutral-800'}`}
                        >
                          6x
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.1"
                  value={config.timeHours}
                  onChange={(e) => onUpdateConfig({ timeHours: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {[
                    { label: 'Dawn', hour: 6.2, icon: <Sun className="w-3 h-3 text-orange-400" /> },
                    { label: 'Midday', hour: 12.0, icon: <Sun className="w-3 h-3 text-amber-300" /> },
                    { label: 'Golden Hour', hour: 17.5, icon: <Sun className="w-3 h-3 text-amber-500" /> },
                    { label: 'Twilight', hour: 20.0, icon: <Moon className="w-3 h-3 text-indigo-400" /> },
                    { label: 'Midnight', hour: 0.0, icon: <Moon className="w-3 h-3 text-sky-400" /> },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => onUpdateConfig({ timeHours: preset.hour, autoCycleTime: false })}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 rounded-md border border-neutral-700 text-neutral-200 transition-colors cursor-pointer"
                    >
                      {preset.icon}
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Weather & Microclimate Tab */}
            {activeTab === 'weather' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-neutral-300">Atmospheric Climate:</span>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-sky-400" />
                      Humidity: <strong className="text-neutral-100">{config.humidity}%</strong>
                    </span>
                  </div>
                </div>

                {/* Weather Mode Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['clear', 'mist', 'rain', 'storm', 'spores'] as WeatherType[]).map((w) => (
                    <button
                      key={w}
                      onClick={() => {
                        let targetHum = config.humidity;
                        if (w === 'clear') targetHum = 45;
                        if (w === 'mist') targetHum = 85;
                        if (w === 'rain') targetHum = 92;
                        if (w === 'storm') targetHum = 98;
                        if (w === 'spores') targetHum = 75;
                        onUpdateConfig({ weather: w, humidity: targetHum });
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        config.weather === w
                          ? 'bg-neutral-800 border-emerald-500 text-white shadow'
                          : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800/70 hover:border-neutral-700'
                      }`}
                    >
                      {weatherIcons[w]}
                      <span className="capitalize">{w}</span>
                    </button>
                  ))}
                </div>

                {/* Dynamic Weather Particle System Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border border-neutral-800 bg-neutral-950/80 my-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-sky-950/80 border border-sky-800/80 text-sky-400 shrink-0">
                      <CloudRain className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-100">Dynamic Weather Particles:</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                          (config.showWeatherParticles ?? true)
                            ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                        }`}>
                          {(config.showWeatherParticles ?? true) ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Renders 3D rain droplets, mist, fog, and floating bio-spore particle physics in the scene.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onUpdateConfig({ showWeatherParticles: !(config.showWeatherParticles ?? true) })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      (config.showWeatherParticles ?? true) ? 'bg-sky-500' : 'bg-neutral-700'
                    }`}
                    role="switch"
                    aria-checked={config.showWeatherParticles ?? true}
                    title="Toggle 3D weather particle effects (rain, fog, spores)"
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        (config.showWeatherParticles ?? true) ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Humidity Condensation Slider */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs text-neutral-400 w-28 shrink-0">Glass Condensation:</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={config.humidity}
                    onChange={(e) => onUpdateConfig({ humidity: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <span className="text-xs font-mono text-neutral-300 w-10 text-right">{config.humidity}%</span>
                </div>

                {/* Bloom Intensity Post-Processing Slider */}
                <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-xs font-medium text-neutral-200">Bloom Intensity (Glow Effect):</span>
                      <span className="text-xs font-mono text-amber-300 font-semibold">
                        {Math.round((config.bloomIntensity ?? 0.45) * 100)}%
                      </span>
                    </div>

                    {/* Bloom Presets */}
                    <div className="flex items-center gap-1.5">
                      {[
                        { label: 'Off', val: 0.0 },
                        { label: 'Subtle', val: 0.25 },
                        { label: 'Radiant', val: 0.5 },
                        { label: 'Dreamy', val: 0.85 },
                        { label: 'Supernova', val: 1.3 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => onUpdateConfig({ bloomIntensity: preset.val })}
                          className={`px-2 py-0.5 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                            Math.abs((config.bloomIntensity ?? 0.45) - preset.val) < 0.04
                              ? 'bg-amber-950/90 border-amber-500 text-amber-300 font-semibold shadow-xs'
                              : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400 w-28 shrink-0">Post-Process Glow:</span>
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.05"
                      value={config.bloomIntensity ?? 0.45}
                      onChange={(e) => onUpdateConfig({ bloomIntensity: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                    <span className="text-xs font-mono text-neutral-300 w-10 text-right">
                      {(config.bloomIntensity ?? 0.45).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* 24-Hour Microclimate Predictive Forecast Panel */}
                <MicroclimateForecastPanel config={config} onUpdateConfig={onUpdateConfig} />
              </div>
            )}

            {/* 3. Flora & Fauna Tab */}
            {activeTab === 'flora' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {/* Exploded Lid Slider */}
                  <div className="flex items-center gap-2 flex-1">
                    <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs text-neutral-300 whitespace-nowrap">Lift Lid / Exploded View:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={config.lidOpenAmount}
                      onChange={(e) => onUpdateConfig({ lidOpenAmount: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <span className="text-xs font-mono text-neutral-300 w-10 text-right">
                      {Math.round(config.lidOpenAmount * 100)}%
                    </span>
                  </div>

                  {/* Micro-Fauna Toggle */}
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.showCreatures}
                        onChange={(e) => onUpdateConfig({ showCreatures: e.target.checked })}
                        className="rounded border-neutral-700 bg-neutral-800 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <Bug className="w-3.5 h-3.5 text-amber-400" />
                      <span>Introduced Animals</span>
                    </label>
                  </div>
                </div>

                {/* Plant & Creature Selector list */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-xs text-neutral-400 shrink-0 mr-1">Flora:</span>
                  {specimens.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onSelectPlant(s)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 rounded-md text-neutral-200 transition-colors shrink-0 cursor-pointer"
                    >
                      <span className="text-emerald-400">•</span>
                      <span>{s.name.split(' ')[0]} {s.name.split(' ')[1] || ''}</span>
                    </button>
                  ))}

                  {config.showCreatures && (
                    <>
                      <span className="text-xs text-neutral-400 shrink-0 ml-2 mr-1">Fauna:</span>
                      {creatures.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => onSelectCreature(c)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/80 rounded-md text-amber-200 transition-colors shrink-0 cursor-pointer"
                        >
                          <Bug className="w-3 h-3 text-amber-400" />
                          <span>{c.name.split(' ')[0]} {c.name.split(' ')[1] || ''}</span>
                        </button>
                      ))}
                    </>
                  )}

                  <button
                    onClick={onRegenerateFlora}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 rounded-md text-emerald-300 transition-colors shrink-0 cursor-pointer ml-auto"
                    title="Regenerate random seed and flora placements"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Re-Seed</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. Camera Views Tab */}
            {activeTab === 'camera' && (
              <div className="space-y-3">
                <span className="text-xs font-medium text-neutral-300">Camera Perspectives & Angles:</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'default', label: 'Default Overview', desc: 'Front balanced viewpoint' },
                    { id: 'closeup', label: 'Macro Closeup', desc: 'Detailed foliage examination' },
                    { id: 'interior', label: 'Inside Terrarium', desc: 'Microscopic eye-level view' },
                    { id: 'top', label: 'Top-Down Plan', desc: 'Zenith bird-eye projection' },
                    { id: 'isometric', label: 'Isometric Angle', desc: '3D architectural projection' },
                  ].map((cam) => (
                    <button
                      key={cam.id}
                      onClick={() => onUpdateConfig({ cameraPreset: cam.id as CameraPreset })}
                      className={`flex flex-col items-start p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                        config.cameraPreset === cam.id
                          ? 'bg-neutral-800 border-emerald-500 text-white'
                          : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs font-medium">{cam.label}</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-0.5">{cam.desc}</span>
                    </button>
                  ))}
                </div>

                {/* High-Resolution Snapshot Export Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-neutral-800 bg-neutral-950/70 pt-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-sky-950/80 border border-sky-800/80 text-sky-400 shrink-0">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-100 flex items-center gap-2">
                        Lossless Canvas Snapshot
                        <span className="text-[10px] font-mono text-neutral-400 font-normal px-1.5 py-0.2 bg-neutral-800 rounded">
                          PNG
                        </span>
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Captures the current viewport lighting, procedural flora, and microclimate directly as a downloadable PNG image.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onCaptureSnapshot}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Snapshot</span>
                  </button>
                </div>
              </div>
            )}

            {/* 5. Procedural Audio Tab */}
            {activeTab === 'audio' && (
              <div className="space-y-3.5">
                {/* Master Volume & Audio Toggle Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    {config.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-neutral-400" />
                    )}
                    <span className="text-xs font-semibold text-neutral-200">
                      Master Web Audio Engine:
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {config.soundEnabled ? 'Synthesizing live audio' : 'Muted'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400">Volume:</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        disabled={!config.soundEnabled}
                        value={config.soundVolume}
                        onChange={(e) => onUpdateConfig({ soundVolume: parseFloat(e.target.value) })}
                        className="w-24 sm:w-32 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40"
                      />
                      <span className="text-xs font-mono text-neutral-300 w-8 text-right">
                        {Math.round(config.soundVolume * 100)}%
                      </span>
                    </div>

                    <button
                      onClick={() => onUpdateConfig({ soundEnabled: !config.soundEnabled })}
                      className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer shrink-0 ${
                        config.soundEnabled
                          ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {config.soundEnabled ? 'Mute Master' : 'Enable Master'}
                    </button>
                  </div>
                </div>

                {/* Individual Environmental Sound Layers Section */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <h4 className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Individual Environmental Sound Tracks</span>
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        Toggle specific synthesized ambient layers independently or audition live samples.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSetAllLayers(true)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-emerald-400 rounded-md border border-neutral-700 cursor-pointer transition-colors"
                      >
                        Enable All Layers
                      </button>
                      <button
                        onClick={() => handleSetAllLayers(false)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-md border border-neutral-700 cursor-pointer transition-colors"
                      >
                        Mute All Layers
                      </button>
                    </div>
                  </div>

                  {/* Individual Sound Layer Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 max-h-[190px] overflow-y-auto pr-0.5">
                    {SOUND_LAYER_ITEMS.map((item) => {
                      const isEnabled = !!soundLayers[item.id];
                      return (
                        <div
                          key={item.id}
                          className={`flex items-start justify-between p-2.5 rounded-xl border transition-all ${
                            isEnabled
                              ? 'bg-neutral-950/80 border-emerald-800/80 shadow-xs'
                              : 'bg-neutral-950/40 border-neutral-800/60 opacity-60'
                          }`}
                        >
                          <div className="space-y-1 min-w-0 pr-1.5">
                            <div className="flex items-center gap-1.5">
                              {item.icon}
                              <span className="text-xs font-semibold text-neutral-100 truncate">
                                {item.name}
                              </span>
                            </div>
                            <p className="text-[10px] text-neutral-400 line-clamp-1">
                              {item.desc}
                            </p>
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="text-[9px] font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 px-1.5 py-0.2 rounded">
                                {item.category}
                              </span>
                              <button
                                onClick={item.preview}
                                className="flex items-center gap-0.5 text-[10px] font-medium text-sky-400 hover:text-sky-300 cursor-pointer"
                                title={`Preview ${item.name} sound`}
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                <span>Preview</span>
                              </button>
                            </div>
                          </div>

                          {/* Toggle Switch */}
                          <button
                            onClick={() => handleToggleLayer(item.id)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                              isEnabled ? 'bg-emerald-500' : 'bg-neutral-700'
                            }`}
                            role="switch"
                            aria-checked={isEnabled}
                            title={`Toggle ${item.name} layer`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                isEnabled ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

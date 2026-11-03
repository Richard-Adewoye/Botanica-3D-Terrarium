import React, { useState } from 'react';
import {
  TerrariumConfig,
  PlantSpecimen,
  CreatureSpecimen,
  WeatherType,
  CameraPreset,
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
} from 'lucide-react';
import { terrariumAudio } from '../audio/proceduralAudio';

interface ControlOverlayProps {
  config: TerrariumConfig;
  onUpdateConfig: (newConfig: Partial<TerrariumConfig>) => void;
  specimens: PlantSpecimen[];
  creatures: CreatureSpecimen[];
  onSelectPlant: (specimen: PlantSpecimen | null) => void;
  onSelectCreature: (creature: CreatureSpecimen | null) => void;
  onHydratePlant: (plantId: string) => void;
  onRegenerateFlora: () => void;
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
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('time');

  // Toggle collapse with 'H' key
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'h' || e.key === 'H') {
        setIsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

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

  return (
    <>
      {/* Top-Left Minimal Title / Spec Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-auto">
        <div className="flex items-center gap-2.5 bg-neutral-900/90 border border-neutral-700/80 px-3 py-2 rounded-xl shadow-lg text-neutral-100">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <div>
            <h1 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              Botanica 3D Terrarium
              <span className="text-[10px] font-mono text-neutral-400 font-normal px-1.5 py-0.5 bg-neutral-800 rounded">
                v1.1 Dynamic Audio
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
        </div>

        {/* Quick hint banner */}
        <div className="text-[11px] text-neutral-400 bg-neutral-950/80 border border-neutral-800 px-3 py-1.5 rounded-lg max-w-xs shadow">
          <span>Click any plant or creature to inspect. Press &apos;H&apos; to toggle controls dock.</span>
        </div>
      </div>

      {/* Consolidated Bottom Dock */}
      <div
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-[940px] transition-transform duration-300 ease-out select-none ${
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
                <span>Ambient Audio</span>
              </button>
            </div>

            {/* Quick action: Auto-rotate toggle */}
            <div className="flex items-center gap-2 pb-1.5">
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
          <div className="p-4 bg-neutral-900 min-h-[115px] flex flex-col justify-center">
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
              </div>
            )}

            {/* 5. Procedural Audio Tab */}
            {activeTab === 'audio' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {config.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-neutral-400" />
                    )}
                    <span className="text-xs font-medium text-neutral-200">
                      Real-Time Dynamic Audio Engine:
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {config.soundEnabled ? 'Synthesizing live audio' : 'Muted'}
                    </span>
                  </div>

                  <button
                    onClick={() => onUpdateConfig({ soundEnabled: !config.soundEnabled })}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      config.soundEnabled
                        ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {config.soundEnabled ? 'Mute Ambience' : 'Enable Ambience'}
                  </button>
                </div>

                {/* Volume slider & Live Status badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-3 flex-1 max-w-sm">
                    <span className="text-xs text-neutral-400 w-24 shrink-0">Master Volume:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      disabled={!config.soundEnabled}
                      value={config.soundVolume}
                      onChange={(e) => onUpdateConfig({ soundVolume: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40"
                    />
                    <span className="text-xs font-mono text-neutral-300 w-10 text-right">
                      {Math.round(config.soundVolume * 100)}%
                    </span>
                  </div>

                  {/* Active sound indicators */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded border ${
                        isDay && config.weather !== 'storm'
                          ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                      }`}
                    >
                      Day Insects {isDay && config.weather !== 'storm' ? '• Active' : '• Idle'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border ${
                        isNight && config.weather !== 'storm'
                          ? 'bg-indigo-950/80 border-indigo-700 text-indigo-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                      }`}
                    >
                      Night Crickets {isNight && config.weather !== 'storm' ? '• Active' : '• Idle'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border ${
                        isRaining
                          ? 'bg-sky-950/80 border-sky-700 text-sky-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                      }`}
                    >
                      Rain Patter {isRaining ? '• Active' : '• Idle'}
                    </span>
                    <span className="px-2 py-0.5 rounded border bg-emerald-950/80 border-emerald-800 text-emerald-300">
                      Flora Rustle • Periodic
                    </span>
                  </div>
                </div>

                {/* Direct Sound Sample Triggers */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-neutral-800/80">
                  <span className="text-[11px] text-neutral-400 mr-1">Preview Synthesized Sound:</span>
                  {[
                    { label: 'Rain Patter', icon: <Droplets className="w-3 h-3 text-sky-400" />, action: () => { if (!config.soundEnabled) onUpdateConfig({ soundEnabled: true }); terrariumAudio.playWaterDroplet(); } },
                    { label: 'Day Cicada', icon: <Sun className="w-3 h-3 text-amber-400" />, action: () => { if (!config.soundEnabled) onUpdateConfig({ soundEnabled: true }); terrariumAudio.playDayGrasshopperChirp(); } },
                    { label: 'Night Cricket', icon: <Moon className="w-3 h-3 text-indigo-400" />, action: () => { if (!config.soundEnabled) onUpdateConfig({ soundEnabled: true }); terrariumAudio.playCricketStridulation(); } },
                    { label: 'Leaf Rustle', icon: <Wind className="w-3 h-3 text-emerald-400" />, action: () => { if (!config.soundEnabled) onUpdateConfig({ soundEnabled: true }); terrariumAudio.playFloraRustle(1.0); } },
                    { label: 'Creature Crawl', icon: <Bug className="w-3 h-3 text-amber-400" />, action: () => { if (!config.soundEnabled) onUpdateConfig({ soundEnabled: true }); terrariumAudio.playCreatureMovement('beetle'); } },
                    { label: 'Thunder', icon: <CloudLightning className="w-3 h-3 text-indigo-400" />, action: () => { if (!config.soundEnabled) onUpdateConfig({ soundEnabled: true }); terrariumAudio.playThunderRumble(); } },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      onClick={btn.action}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 rounded border border-neutral-700 text-neutral-200 transition-colors cursor-pointer"
                    >
                      {btn.icon}
                      <span>{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

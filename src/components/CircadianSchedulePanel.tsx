import React from 'react';
import { TerrariumConfig, CircadianNode, WeatherType } from '../types/terrarium';
import {
  Clock,
  Sun,
  Moon,
  CloudRain,
  CloudFog,
  CloudLightning,
  Sparkles,
  Droplets,
  Thermometer,
  Sliders,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';

export const DEFAULT_CIRCADIAN_NODES: CircadianNode[] = [
  {
    id: 'dawn',
    label: 'Dawn Dew',
    startHour: 6.0,
    weather: 'mist',
    targetHumidity: 85,
    bloomIntensity: 0.35,
    targetTemperature: 20.5,
    description: 'Gentle morning fog, soft golden sun rays, and dew condensation.',
  },
  {
    id: 'noon',
    label: 'High Noon',
    startHour: 12.0,
    weather: 'clear',
    targetHumidity: 52,
    bloomIntensity: 0.5,
    targetTemperature: 26.5,
    description: 'Direct solar illumination & active photosynthesis peak.',
  },
  {
    id: 'dusk',
    label: 'Twilight Dusk',
    startHour: 18.0,
    weather: 'spores',
    targetHumidity: 75,
    bloomIntensity: 0.8,
    targetTemperature: 22.0,
    description: 'Amber twilight glow & bio-luminescent spore release.',
  },
  {
    id: 'midnight',
    label: 'Midnight Solitude',
    startHour: 0.0,
    weather: 'spores',
    targetHumidity: 90,
    bloomIntensity: 0.95,
    targetTemperature: 18.5,
    description: 'Cool night atmosphere with glowing fungi & cricket chimes.',
  },
];

const WEATHER_ICONS: Record<WeatherType, React.ReactNode> = {
  clear: <Sun className="w-3.5 h-3.5 text-amber-400" />,
  mist: <CloudFog className="w-3.5 h-3.5 text-slate-300" />,
  rain: <CloudRain className="w-3.5 h-3.5 text-sky-400" />,
  storm: <CloudLightning className="w-3.5 h-3.5 text-indigo-400" />,
  spores: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
};

interface CircadianSchedulePanelProps {
  config: TerrariumConfig;
  onUpdateConfig: (newConfig: Partial<TerrariumConfig>) => void;
}

export const CircadianSchedulePanel: React.FC<CircadianSchedulePanelProps> = ({
  config,
  onUpdateConfig,
}) => {
  const isAutomated = config.autoCircadianSchedule ?? false;
  const nodes = config.circadianNodes || DEFAULT_CIRCADIAN_NODES;

  // Format hours into AM/PM
  const formatHourLabel = (hDecimal: number) => {
    const h = Math.floor(hDecimal) % 24;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:00 ${ampm}`;
  };

  const handleUpdateNode = (nodeId: string, partial: Partial<CircadianNode>) => {
    const updated = nodes.map((n) => (n.id === nodeId ? { ...n, ...partial } : n));
    onUpdateConfig({ circadianNodes: updated });
  };

  const handlePreviewNode = (node: CircadianNode) => {
    onUpdateConfig({
      timeHours: node.startHour,
      weather: node.weather,
      humidity: node.targetHumidity,
      bloomIntensity: node.bloomIntensity,
      autoCycleTime: false,
    });
  };

  const handleApplyPresetTemplate = (presetType: 'rainforest' | 'bioluminescent' | 'classic') => {
    let template: CircadianNode[];
    if (presetType === 'rainforest') {
      template = [
        { ...DEFAULT_CIRCADIAN_NODES[0], weather: 'mist', targetHumidity: 90, targetTemperature: 22 },
        { ...DEFAULT_CIRCADIAN_NODES[1], weather: 'rain', targetHumidity: 95, targetTemperature: 25 },
        { ...DEFAULT_CIRCADIAN_NODES[2], weather: 'storm', targetHumidity: 98, targetTemperature: 23 },
        { ...DEFAULT_CIRCADIAN_NODES[3], weather: 'mist', targetHumidity: 88, targetTemperature: 20 },
      ];
    } else if (presetType === 'bioluminescent') {
      template = [
        { ...DEFAULT_CIRCADIAN_NODES[0], weather: 'spores', targetHumidity: 80, bloomIntensity: 0.6 },
        { ...DEFAULT_CIRCADIAN_NODES[1], weather: 'clear', targetHumidity: 60, bloomIntensity: 0.4 },
        { ...DEFAULT_CIRCADIAN_NODES[2], weather: 'spores', targetHumidity: 85, bloomIntensity: 1.0 },
        { ...DEFAULT_CIRCADIAN_NODES[3], weather: 'spores', targetHumidity: 95, bloomIntensity: 1.3 },
      ];
    } else {
      template = DEFAULT_CIRCADIAN_NODES;
    }
    onUpdateConfig({ circadianNodes: template, autoCircadianSchedule: true });
  };

  return (
    <div className="space-y-3.5 pt-2 border-t border-neutral-800/80">
      {/* Panel Header & Master Automation Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-800/80 text-indigo-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-neutral-100">
                Automated Circadian Microclimate Schedule
              </h3>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                  isAutomated
                    ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                }`}
              >
                {isAutomated ? 'Automation Active' : 'Manual Override'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Automates solar trajectories, weather transitions, temperature curves, and bloom intensity across virtual day phases.
            </p>
          </div>
        </div>

        <button
          onClick={() => onUpdateConfig({ autoCircadianSchedule: !isAutomated, autoCycleTime: !isAutomated })}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
            isAutomated ? 'bg-indigo-600' : 'bg-neutral-700'
          }`}
          role="switch"
          aria-checked={isAutomated}
          title="Toggle automatic circadian lighting & weather transitions"
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
              isAutomated ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* 24-Hour Circadian Phase Bar */}
      <div className="space-y-1 bg-neutral-950/90 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between text-[11px] text-neutral-300 font-medium">
          <span className="flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>24-Hour Circadian Solar Bar</span>
          </span>
          <span className="font-mono text-indigo-300 text-xs font-semibold">
            Virtual Time: {formatHourLabel(config.timeHours)}
          </span>
        </div>

        {/* Bar */}
        <div className="relative w-full h-3 bg-gradient-to-r from-indigo-950 via-amber-600 to-indigo-950 rounded-full overflow-hidden border border-neutral-800 my-2">
          {/* Active indicator pin */}
          <div
            className="absolute top-0 bottom-0 w-2 bg-white shadow-lg border border-indigo-400 transition-all duration-300"
            style={{ left: `${(config.timeHours / 24) * 100}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] font-mono text-neutral-400">
          <span>00:00 Midnight</span>
          <span>06:00 Dawn</span>
          <span>12:00 Noon</span>
          <span>18:00 Dusk</span>
          <span>24:00 Midnight</span>
        </div>
      </div>

      {/* Preset Templates Quick Load */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-neutral-300 font-medium">Load Circadian Template:</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleApplyPresetTemplate('classic')}
            className="px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 rounded-md cursor-pointer transition-colors"
          >
            Classic Solar
          </button>
          <button
            onClick={() => handleApplyPresetTemplate('rainforest')}
            className="px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-sky-300 border border-neutral-700 rounded-md cursor-pointer transition-colors"
          >
            Rainforest Cycle
          </button>
          <button
            onClick={() => handleApplyPresetTemplate('bioluminescent')}
            className="px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-emerald-300 border border-neutral-700 rounded-md cursor-pointer transition-colors"
          >
            Bioluminescent Night
          </button>
        </div>
      </div>

      {/* Editable Nodes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="p-3 rounded-xl border border-neutral-800 bg-neutral-950/80 space-y-2.5 shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-1.5">
                {WEATHER_ICONS[node.weather]}
                <span className="text-xs font-bold text-neutral-100">{node.label}</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-1.5 py-0.2 rounded">
                {formatHourLabel(node.startHour)}
              </span>
            </div>

            {/* Weather Mode Selector */}
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 font-mono">Weather Mode:</label>
              <select
                value={node.weather}
                onChange={(e) => handleUpdateNode(node.id, { weather: e.target.value as WeatherType })}
                className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs rounded-lg px-2 py-1 focus:outline-hidden cursor-pointer"
              >
                <option value="clear">☀️ Clear Sun</option>
                <option value="mist">🌫️ Mist &amp; Fog</option>
                <option value="rain">🌧️ Rain Shower</option>
                <option value="storm">⛈️ Storm &amp; Flash</option>
                <option value="spores">✨ Bio-Spores</option>
              </select>
            </div>

            {/* Humidity Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>Humidity:</span>
                <span className="text-sky-300 font-bold">{node.targetHumidity}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={node.targetHumidity}
                onChange={(e) => handleUpdateNode(node.id, { targetHumidity: parseInt(e.target.value) })}
                className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            {/* Temperature Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>Temperature:</span>
                <span className="text-amber-300 font-bold">{node.targetTemperature}°C</span>
              </div>
              <input
                type="range"
                min="18"
                max="30"
                step="0.5"
                value={node.targetTemperature}
                onChange={(e) => handleUpdateNode(node.id, { targetTemperature: parseFloat(e.target.value) })}
                className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Bloom Glow Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>Bloom Glow:</span>
                <span className="text-emerald-300 font-bold">{node.bloomIntensity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={node.bloomIntensity}
                onChange={(e) => handleUpdateNode(node.id, { bloomIntensity: parseFloat(e.target.value) })}
                className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            {/* Preview Phase Button */}
            <button
              onClick={() => handlePreviewNode(node)}
              className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 rounded-lg transition-colors cursor-pointer mt-1"
            >
              <Play className="w-3 h-3 fill-current text-indigo-400" />
              <span>Preview Phase</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

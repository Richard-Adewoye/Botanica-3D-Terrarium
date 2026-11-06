import React, { useMemo } from 'react';
import { TerrariumConfig, WeatherType } from '../types/terrarium';
import { terrariumAudio } from '../audio/proceduralAudio';
import {
  Sun,
  Moon,
  CloudRain,
  CloudFog,
  CloudLightning,
  Sparkles,
  Droplets,
  Thermometer,
  Clock,
  TrendingUp,
  ArrowRight,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface MicroclimateForecastPanelProps {
  config: TerrariumConfig;
  onUpdateConfig: (newConfig: Partial<TerrariumConfig>) => void;
}

export interface ForecastPoint {
  offset: number; // 0 to 23
  hour: number; // 0.0 to 23.9
  timeLabel: string; // e.g. "14:00"
  displayTime: string; // e.g. "2:00 PM"
  temperature: number; // in °C
  humidity: number; // in %
  dewPoint: number; // in °C
  weather: WeatherType;
  event: string;
}

const WEATHER_ICONS: Record<WeatherType, React.ReactNode> = {
  clear: <Sun className="w-3.5 h-3.5 text-amber-400" />,
  mist: <CloudFog className="w-3.5 h-3.5 text-slate-300" />,
  rain: <CloudRain className="w-3.5 h-3.5 text-sky-400" />,
  storm: <CloudLightning className="w-3.5 h-3.5 text-indigo-400" />,
  spores: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
};

interface ForecastTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: ForecastPoint;
  }>;
}

const CustomForecastTooltip: React.FC<ForecastTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-neutral-900/95 border border-neutral-700/90 rounded-xl p-3 shadow-2xl text-xs backdrop-blur-md min-w-[170px] space-y-1.5 select-none">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1 font-mono text-[10px] text-neutral-400">
        <span className="flex items-center gap-1 font-semibold text-neutral-200">
          <Clock className="w-3 h-3 text-amber-400" />
          +{data.offset}h ({data.displayTime})
        </span>
        <span className="capitalize text-sky-300 font-sans flex items-center gap-1">
          {WEATHER_ICONS[data.weather]}
          {data.weather}
        </span>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between text-sky-300">
          <span className="flex items-center gap-1 text-neutral-300">
            <Droplets className="w-3 h-3 text-sky-400" /> Humidity:
          </span>
          <span className="font-mono font-bold">{data.humidity}%</span>
        </div>

        <div className="flex items-center justify-between text-amber-300">
          <span className="flex items-center gap-1 text-neutral-300">
            <Thermometer className="w-3 h-3 text-amber-400" /> Temperature:
          </span>
          <span className="font-mono font-bold">{data.temperature}°C</span>
        </div>

        <div className="flex items-center justify-between text-neutral-400 text-[10px] font-mono">
          <span>Dew Point:</span>
          <span>{data.dewPoint}°C</span>
        </div>
      </div>

      <div className="border-t border-neutral-800/80 pt-1 text-[10px] text-emerald-400 font-sans truncate">
        <span>⚡ {data.event}</span>
      </div>
    </div>
  );
};

export const MicroclimateForecastPanel: React.FC<MicroclimateForecastPanelProps> = ({
  config,
  onUpdateConfig,
}) => {
  // Generate 24 virtual hours simulated microclimate forecast
  const forecastData = useMemo<ForecastPoint[]>(() => {
    const currentHour = config.timeHours;
    const baseHumidity = config.humidity;
    const points: ForecastPoint[] = [];

    for (let offset = 0; offset < 24; offset++) {
      const simHour = (currentHour + offset) % 24;
      const hInt = Math.floor(simHour);
      const mInt = Math.floor((simHour % 1) * 60);

      const pad = (n: number) => n.toString().padStart(2, '0');
      const timeLabel = `${pad(hInt)}:${pad(mInt)}`;

      const ampm = hInt >= 12 ? 'PM' : 'AM';
      const displayH = hInt % 12 === 0 ? 12 : hInt % 12;
      const displayTime = `${displayH}:${pad(mInt)} ${ampm}`;

      // 1. Temperature curve (peak solar at 14:00, minimum pre-dawn at 05:00)
      const solarFactor = Math.sin(((simHour - 8) / 24) * Math.PI * 2);
      const tempBase = 22.5 + solarFactor * 4.5;
      const tempRandom = Math.sin(offset * 0.7) * 0.4;
      const temperature = Math.round((tempBase + tempRandom) * 10) / 10;

      // 2. Humidity curve (inverse to solar temperature + nocturnal dew surge)
      const nocturnalSurge = simHour > 21.0 || simHour < 6.0 ? 16 : -8;
      const humSine = Math.sin(((simHour + 2) / 24) * Math.PI * 2) * 10;
      const simHumidity = Math.min(
        98,
        Math.max(35, Math.round(baseHumidity * 0.6 + humSine + nocturnalSurge + (24 - offset) * 0.8))
      );

      // 3. Dew point approximation
      const dewPoint = Math.round((temperature - (100 - simHumidity) / 5) * 10) / 10;

      // 4. Predicted weather state
      let predictedWeather: WeatherType = 'clear';
      if (simHumidity >= 92) {
        predictedWeather = simHour > 18 || simHour < 6 ? 'storm' : 'rain';
      } else if (simHumidity >= 80) {
        predictedWeather = 'mist';
      } else if (simHumidity >= 70 && (simHour > 20 || simHour < 5)) {
        predictedWeather = 'spores';
      } else {
        predictedWeather = 'clear';
      }

      // 5. Environmental event callouts
      let event = 'Normal Balance';
      if (simHour >= 5.0 && simHour < 7.0) event = 'Pre-dawn Dew Condensation';
      else if (simHour >= 12.0 && simHour < 15.0) event = 'Peak Photosynthesis';
      else if (simHour >= 17.5 && simHour < 20.0) event = 'Sunset Transpiration Drop';
      else if (simHour >= 21.0 || simHour < 4.0) event = 'Nocturnal Microclimate Surge';
      else if (simHumidity > 88) event = 'High Vapor Saturation';

      points.push({
        offset,
        hour: simHour,
        timeLabel,
        displayTime,
        temperature,
        humidity: simHumidity,
        dewPoint,
        weather: predictedWeather,
        event,
      });
    }

    return points;
  }, [config.timeHours, config.humidity]);

  // Forecast Highlights
  const maxHumidityPoint = useMemo(() => {
    return [...forecastData].sort((a, b) => b.humidity - a.humidity)[0];
  }, [forecastData]);

  const maxTempPoint = useMemo(() => {
    return [...forecastData].sort((a, b) => b.temperature - a.temperature)[0];
  }, [forecastData]);

  // Fast forward terrarium to a specific forecast point
  const handleJumpToForecast = (pt: ForecastPoint) => {
    onUpdateConfig({
      timeHours: pt.hour,
      humidity: pt.humidity,
      weather: pt.weather,
      autoCycleTime: false,
    });
    terrariumAudio.playWaterDroplet();
  };

  return (
    <div className="space-y-3 pt-2 border-t border-neutral-800/80">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-950 border border-sky-700/80 text-sky-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-100 flex items-center gap-2">
              24-Virtual-Hour Microclimate Forecast
              <span className="text-[10px] font-mono text-sky-400 bg-sky-950/80 border border-sky-800 px-1.5 py-0.2 rounded font-normal">
                Predictive AI Engine
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              Simulates upcoming humidity fluctuations, temperature shifts, and precipitation trends.
            </p>
          </div>
        </div>

        {/* Quick Highlights Summary Badges */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 px-2 py-1 rounded-lg text-sky-300">
            <Droplets className="w-3 h-3 text-sky-400" />
            <span>Peak Humid: <strong>{maxHumidityPoint.humidity}%</strong> ({maxHumidityPoint.displayTime})</span>
          </div>

          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 px-2 py-1 rounded-lg text-amber-300">
            <Thermometer className="w-3 h-3 text-amber-400" />
            <span>Solar Max: <strong>{maxTempPoint.temperature}°C</strong> ({maxTempPoint.displayTime})</span>
          </div>
        </div>
      </div>

      {/* 24-Hour Forecast Recharts Area Chart */}
      <div className="bg-neutral-950/90 border border-neutral-800/90 rounded-xl p-3 space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-1">
          <span className="flex items-center gap-1.5 text-neutral-300 font-sans font-semibold text-xs">
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            <span>24-Hour Humidity &amp; Microclimate Trend Curve</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-sky-400">
              <span className="w-2.5 h-1 bg-sky-400 rounded-full" /> Humidity (%)
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2.5 h-1 bg-amber-400 rounded-full" /> Temp (°C)
            </span>
          </div>
        </div>

        <div className="w-full h-36 pt-1">
          <ResponsiveContainer width="100%" height={136}>
            <AreaChart data={forecastData} margin={{ top: 6, right: 10, left: -20, bottom: 2 }}>
              <defs>
                <linearGradient id="humidityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                stroke="#737373"
                fontSize={9}
                tickLine={false}
                axisLine={{ stroke: '#404040' }}
              />
              <YAxis
                domain={[20, 100]}
                stroke="#737373"
                fontSize={9}
                tickLine={false}
                axisLine={{ stroke: '#404040' }}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip content={<CustomForecastTooltip />} />
              <Area
                type="monotone"
                dataKey="humidity"
                name="Humidity"
                stroke="#38bdf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#humidityGrad)"
                isAnimationActive={true}
              />
              <Area
                type="monotone"
                dataKey="temperature"
                name="Temperature"
                stroke="#fbbf24"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#tempGrad)"
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming 6 Hours Interactive Cards Carousel */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
          <Clock className="w-3 h-3 text-sky-400" />
          <span>Upcoming 6 Hours Quick Preview:</span>
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {forecastData.slice(1, 7).map((pt) => (
            <div
              key={pt.offset}
              className="group flex flex-col justify-between p-2.5 rounded-xl border border-neutral-800 bg-neutral-950/80 hover:bg-neutral-800/80 hover:border-sky-600/80 transition-all text-left space-y-1.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-400">+{pt.offset}h</span>
                <span className="text-xs font-semibold text-neutral-200 font-mono">{pt.displayTime}</span>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-1 text-xs">
                  {WEATHER_ICONS[pt.weather]}
                  <span className="capitalize text-[11px] text-neutral-300 font-medium">{pt.weather}</span>
                </div>
                <span className="text-xs font-mono font-bold text-sky-400">{pt.humidity}%</span>
              </div>

              <button
                onClick={() => handleJumpToForecast(pt)}
                className="w-full flex items-center justify-center gap-1 py-1 text-[10px] font-medium bg-neutral-900 hover:bg-sky-600 hover:text-white text-neutral-300 rounded-md border border-neutral-700/80 transition-colors cursor-pointer mt-1"
                title={`Jump terrarium time and weather to +${pt.offset}h (${pt.displayTime})`}
              >
                <span>Jump To</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

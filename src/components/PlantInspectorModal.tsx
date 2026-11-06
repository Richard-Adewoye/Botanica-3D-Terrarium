import React from 'react';
import { PlantSpecimen, GrowthHistoryPoint } from '../types/terrarium';
import {
  Droplets,
  X,
  Eye,
  HeartPulse,
  TrendingUp,
  Clock,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface PlantInspectorModalProps {
  specimen: PlantSpecimen;
  onClose: () => void;
  onHydrate: (plantId: string) => void;
  onFocus: (specimen: PlantSpecimen) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: GrowthHistoryPoint;
  }>;
  label?: string;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const dataPoint = payload[0].payload;

  return (
    <div className="bg-neutral-900/95 border border-neutral-700/90 rounded-lg p-2.5 shadow-xl text-xs backdrop-blur-xs min-w-[130px]">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-1 mb-1.5 text-neutral-400 font-mono text-[10px]">
        <span className="flex items-center gap-1">
          <Clock className="w-2.5 h-2.5 text-neutral-500" />
          {label}
        </span>
        {dataPoint.event && (
          <span className="text-emerald-400 font-sans truncate max-w-[90px]">
            {dataPoint.event}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Vitality:
          </span>
          <span className="font-semibold text-emerald-400">{dataPoint.health}%</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            Hydration:
          </span>
          <span className="font-semibold text-sky-400">{dataPoint.moisture}%</span>
        </div>
      </div>
    </div>
  );
};

export const PlantInspectorModal: React.FC<PlantInspectorModalProps> = ({
  specimen,
  onClose,
  onHydrate,
  onFocus,
}) => {
  const historyData = specimen.growthHistory && specimen.growthHistory.length > 0
    ? specimen.growthHistory
    : [
        { timestamp: 'Prev', health: Math.max(0, specimen.health - 6), moisture: Math.max(0, specimen.moisture - 10), event: 'Prior Cycle' },
        { timestamp: 'Now', health: specimen.health, moisture: specimen.moisture, event: 'Current Observation' },
      ];

  const latestEvent = historyData[historyData.length - 1]?.event || 'Stable equilibrium';

  return (
    <div
      className="absolute top-4 right-4 z-20 w-88 sm:w-96 max-w-[94vw] max-h-[90vh] overflow-y-auto bg-neutral-900/95 text-neutral-100 border border-neutral-700/80 rounded-2xl shadow-2xl p-4 transition-all duration-200 select-none"
      role="dialog"
      aria-labelledby="specimen-name"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-neutral-800 pb-2.5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded">
              {specimen.type}
            </span>
            <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800/60 px-1.5 py-0.5 rounded">
              {historyData.length} records
            </span>
          </div>
          <h3 id="specimen-name" className="text-base font-semibold text-neutral-100 mt-1 leading-snug">
            {specimen.name}
          </h3>
          <p className="text-xs italic text-neutral-400 font-serif">
            {specimen.scientificName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Close details"
          aria-label="Close plant inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-neutral-300 mt-2.5 leading-relaxed">
        {specimen.description}
      </p>

      {/* Real-Time Vitals Cards */}
      <div className="grid grid-cols-2 gap-2 my-3 bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
            <span>Vitality</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-semibold text-neutral-100">{specimen.health}%</span>
            <span className="text-[10px] text-emerald-400">Optimum</span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-1 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${specimen.health}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            <span>Hydration</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-semibold text-neutral-100">{specimen.moisture}%</span>
            <span className="text-[10px] text-sky-400">Stable</span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-1 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${specimen.moisture}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recharts Growth & Vitals Trend Chart */}
      <div className="my-3 bg-neutral-950/80 border border-neutral-800/90 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Growth History Log</span>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center gap-2.5 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-0.5 bg-emerald-400 rounded-full" />
              Health
            </span>
            <span className="flex items-center gap-1 text-sky-400">
              <span className="w-2 h-0.5 bg-sky-400 rounded-full" />
              Moisture
            </span>
          </div>
        </div>

        {/* Small Line Chart Container */}
        <div className="w-full h-32 pt-1">
          <ResponsiveContainer width="100%" height={124}>
            <LineChart
              data={historyData}
              margin={{ top: 6, right: 8, left: -20, bottom: 2 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis
                dataKey="timestamp"
                stroke="#737373"
                fontSize={9}
                tickLine={false}
                axisLine={{ stroke: '#404040' }}
              />
              <YAxis
                domain={[30, 100]}
                stroke="#737373"
                fontSize={9}
                tickLine={false}
                axisLine={{ stroke: '#404040' }}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Line
                type="monotone"
                dataKey="health"
                name="Health"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#10b981', strokeWidth: 0 }}
                activeDot={{ r: 4.5, fill: '#34d399', stroke: '#064e3b', strokeWidth: 2 }}
                isAnimationActive={true}
              />
              <Line
                type="monotone"
                dataKey="moisture"
                name="Moisture"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#38bdf8', strokeWidth: 0 }}
                activeDot={{ r: 4.5, fill: '#7dd3fc', stroke: '#0c4a6e', strokeWidth: 2 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Event Status footer */}
        <div className="flex items-center justify-between text-[10px] text-neutral-400 border-t border-neutral-800/80 pt-1.5 mt-1 font-mono">
          <span className="flex items-center gap-1 text-neutral-400">
            <Activity className="w-3 h-3 text-emerald-400" />
            Last event: <span className="text-neutral-200">{latestEvent}</span>
          </span>
          <span className="text-neutral-500">Live Telemetry</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onHydrate(specimen.id)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors cursor-pointer shadow"
        >
          <Droplets className="w-3.5 h-3.5" />
          <span>Hydrate Plant (+25%)</span>
        </button>

        <button
          onClick={() => onFocus(specimen)}
          className="flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-200 text-xs font-medium py-2 px-3 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          title="Zoom camera onto plant"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Focus</span>
        </button>
      </div>
    </div>
  );
};

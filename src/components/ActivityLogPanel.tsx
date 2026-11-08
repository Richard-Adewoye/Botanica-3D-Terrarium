import React, { useState } from 'react';
import { ActivityLogItem, ActivityCategory } from '../types/terrarium';
import {
  History,
  CloudRain,
  Dna,
  Droplets,
  Bug,
  Video,
  Trophy,
  Trash2,
  Download,
  Filter,
  Sparkles,
} from 'lucide-react';

interface ActivityLogPanelProps {
  activityLog: ActivityLogItem[];
  onClearLog?: () => void;
}

const CATEGORY_CONFIG: Record<
  ActivityCategory,
  { label: string; icon: React.ReactNode; colorClass: string; bgClass: string }
> = {
  weather: {
    label: 'Weather',
    icon: <CloudRain className="w-3.5 h-3.5 text-sky-400" />,
    colorClass: 'text-sky-300 border-sky-800/80',
    bgClass: 'bg-sky-950/80',
  },
  mutation: {
    label: 'Genetics',
    icon: <Dna className="w-3.5 h-3.5 text-purple-400" />,
    colorClass: 'text-purple-300 border-purple-800/80',
    bgClass: 'bg-purple-950/80',
  },
  hydration: {
    label: 'Care',
    icon: <Droplets className="w-3.5 h-3.5 text-teal-400" />,
    colorClass: 'text-teal-300 border-teal-800/80',
    bgClass: 'bg-teal-950/80',
  },
  creature: {
    label: 'Fauna',
    icon: <Bug className="w-3.5 h-3.5 text-amber-400" />,
    colorClass: 'text-amber-300 border-amber-800/80',
    bgClass: 'bg-amber-950/80',
  },
  timelapse: {
    label: 'Media',
    icon: <Video className="w-3.5 h-3.5 text-emerald-400" />,
    colorClass: 'text-emerald-300 border-emerald-800/80',
    bgClass: 'bg-emerald-950/80',
  },
  task: {
    label: 'Task',
    icon: <Trophy className="w-3.5 h-3.5 text-rose-400" />,
    colorClass: 'text-rose-300 border-rose-800/80',
    bgClass: 'bg-rose-950/80',
  },
};

export const ActivityLogPanel: React.FC<ActivityLogPanelProps> = ({
  activityLog,
  onClearLog,
}) => {
  const [filter, setFilter] = useState<string>('all');

  const filteredLog =
    filter === 'all'
      ? activityLog
      : activityLog.filter((item) => item.category === filter);

  const handleExportLog = () => {
    const jsonString = JSON.stringify(activityLog, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terrarium-activity-log-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3 pt-2 border-t border-neutral-800/80 select-none">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-800/80 text-emerald-400 shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-100 flex items-center gap-2">
              Ecosystem Activity Log
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.2 rounded font-normal">
                {activityLog.length} Recorded Events
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              Tracks real-time environmental shifts, genetic mutations, hydration care, and fauna interactions.
            </p>
          </div>
        </div>

        {/* Export & Clear Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportLog}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
            title="Download activity history as JSON"
          >
            <Download className="w-3 h-3 text-sky-400" />
            <span>Export Log</span>
          </button>

          {onClearLog && (
            <button
              onClick={onClearLog}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-rose-300 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
              title="Clear current log history"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Category Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] text-neutral-500 font-mono flex items-center gap-1 shrink-0 mr-1">
          <Filter className="w-3 h-3 text-neutral-400" /> Filter:
        </span>

        {[
          { id: 'all', label: 'All Events' },
          { id: 'weather', label: 'Weather ⛈️' },
          { id: 'mutation', label: 'Genetics 🧬' },
          { id: 'hydration', label: 'Care 💧' },
          { id: 'creature', label: 'Fauna 🐞' },
          { id: 'timelapse', label: 'Media 📸' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`px-2.5 py-0.5 text-[11px] font-medium rounded-lg border transition-colors shrink-0 cursor-pointer ${
              filter === item.id
                ? 'bg-emerald-950 border-emerald-600 text-emerald-300 font-semibold'
                : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Scrollable Feed List */}
      <div className="bg-neutral-950/90 border border-neutral-800 rounded-xl p-2.5 max-h-[180px] overflow-y-auto space-y-2 pr-1 shadow-inner">
        {filteredLog.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-500 italic">
            No logged events in this category yet. Interact with plants, change weather, or re-seed flora!
          </div>
        ) : (
          filteredLog.map((item) => {
            const catConf = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.weather;
            return (
              <div
                key={item.id}
                className="flex items-start justify-between p-2 rounded-lg border border-neutral-800/80 bg-neutral-900/60 hover:bg-neutral-900 transition-colors"
              >
                <div className="flex items-start gap-2.5 min-w-0 pr-2">
                  <div className={`p-1.5 rounded-md border ${catConf.bgClass} ${catConf.colorClass} shrink-0 mt-0.5`}>
                    {catConf.icon}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-neutral-200 truncate">
                        {item.title}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${catConf.bgClass} ${catConf.colorClass}`}>
                        {catConf.label}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-400 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-neutral-500 shrink-0 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-850">
                  {item.timestamp}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

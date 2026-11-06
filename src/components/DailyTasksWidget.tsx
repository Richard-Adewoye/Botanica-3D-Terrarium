import React, { useState } from 'react';
import { DailyTask } from '../types/terrarium';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Droplets,
  CloudRain,
  Video,
  Gift,
  ChevronRight,
  Trophy,
  Zap,
} from 'lucide-react';

interface DailyTasksWidgetProps {
  tasks: DailyTask[];
  onCompleteTask: (taskId: string) => void;
  onOpenTimeLapse?: () => void;
  onCaptureSnapshot?: () => void;
}

const TASK_ICONS: Record<string, React.ReactNode> = {
  hydration: <Droplets className="w-4 h-4 text-sky-400" />,
  weather: <CloudRain className="w-4 h-4 text-indigo-400" />,
  timelapse: <Video className="w-4 h-4 text-emerald-400" />,
  camera: <Sparkles className="w-4 h-4 text-amber-400" />,
  observation: <Trophy className="w-4 h-4 text-purple-400" />,
};

export const DailyTasksWidget: React.FC<DailyTasksWidgetProps> = ({
  tasks,
  onCompleteTask,
  onOpenTimeLapse,
  onCaptureSnapshot,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = Math.round((completedCount / (totalCount || 1)) * 100);

  return (
    <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 shadow-2xl space-y-3 backdrop-blur-md select-none">
      {/* Widget Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-800/80 text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-100 flex items-center gap-2">
              Daily Terrarium Activities
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/90 border border-amber-700/80 px-2 py-0.2 rounded-full font-normal">
                {completedCount}/{totalCount} Completed
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              Complete daily care activities to earn growth boosts &amp; cosmetic bloom effects.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-neutral-400 hover:text-white px-2 py-1 bg-neutral-900 rounded-lg border border-neutral-800 cursor-pointer transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Expand Tasks'}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
          <span>Overall Ecosystem Progress</span>
          <span className="text-amber-300 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Expandable Tasks Checklist */}
      {isExpanded && (
        <div className="space-y-2 pt-1">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-start justify-between p-2.5 rounded-xl border transition-all ${
                task.completed
                  ? 'bg-emerald-950/40 border-emerald-800/60 opacity-90'
                  : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0 pr-2">
                <div className="mt-0.5 shrink-0">
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-500" />
                  )}
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-neutral-100 flex items-center gap-1">
                      {TASK_ICONS[task.category] || <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                      {task.title}
                    </span>
                    <span className="text-[9px] font-mono text-amber-300 bg-amber-950/80 border border-amber-800/80 px-1.5 py-0.2 rounded shrink-0">
                      🎁 {task.rewardText}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    {task.description}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-mono italic">
                    Hint: {task.actionHint}
                  </p>
                </div>
              </div>

              {/* Action / Claim Button */}
              <div className="shrink-0 self-center">
                {task.completed ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/90 border border-emerald-700 px-2.5 py-1 rounded-lg">
                    <Sparkles className="w-3 h-3 text-emerald-300" />
                    <span>Boosted!</span>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      if (task.id === 'task-timelapse' && onOpenTimeLapse) {
                        onOpenTimeLapse();
                      }
                      onCompleteTask(task.id);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-lg shadow border border-amber-400/30 cursor-pointer transition-colors"
                  >
                    <span>Complete</span>
                    <Zap className="w-3 h-3 text-amber-200 fill-current" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

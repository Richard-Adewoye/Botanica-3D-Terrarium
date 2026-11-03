import React from 'react';
import { CreatureSpecimen } from '../types/terrarium';
import { Sparkles, X, Eye, Activity, Bug } from 'lucide-react';

interface CreatureInspectorModalProps {
  creature: CreatureSpecimen;
  onClose: () => void;
  onInteract: (creatureId: string) => void;
  onFocus: (creature: CreatureSpecimen) => void;
}

export const CreatureInspectorModal: React.FC<CreatureInspectorModalProps> = ({
  creature,
  onClose,
  onInteract,
  onFocus,
}) => {
  return (
    <div
      className="absolute top-4 right-4 z-20 w-80 bg-neutral-900/95 text-neutral-100 border border-neutral-700/80 rounded-xl shadow-2xl p-4 transition-all duration-200"
      role="dialog"
      aria-labelledby="creature-name"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-neutral-800 pb-2.5">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 bg-amber-950/70 border border-amber-800/60 px-2 py-0.5 rounded">
            Micro-Fauna • {creature.type}
          </span>
          <h3 id="creature-name" className="text-base font-semibold text-neutral-100 mt-1 leading-snug">
            {creature.name}
          </h3>
          <p className="text-xs italic text-neutral-400 font-serif">
            {creature.scientificName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          title="Close details"
          aria-label="Close creature inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-neutral-300 mt-3 leading-relaxed">
        {creature.description}
      </p>

      {/* Vitals */}
      <div className="grid grid-cols-2 gap-2 my-3.5 bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800/80">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Activity</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-semibold text-neutral-100">{creature.activityLevel}%</span>
            <span className="text-[10px] text-emerald-400">Active</span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-1 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${creature.activityLevel}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <Bug className="w-3.5 h-3.5 text-emerald-400" />
            <span>Terrarium Role</span>
          </div>
          <p className="text-xs text-neutral-200 mt-0.5 font-medium">
            {creature.type === 'beetle' ? 'Bark Aerator' : 'Moss Grazer'}
          </p>
          <span className="text-[10px] text-neutral-400">Nutrient Cycler</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onInteract(creature.id)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors cursor-pointer shadow"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interact & Listen</span>
        </button>

        <button
          onClick={() => onFocus(creature)}
          className="flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-200 text-xs font-medium py-2 px-3 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          title="Zoom camera onto creature"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Follow</span>
        </button>
      </div>
    </div>
  );
};

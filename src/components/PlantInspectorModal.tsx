import React from 'react';
import { PlantSpecimen } from '../types/terrarium';
import { Droplets, Sparkles, X, Eye, HeartPulse } from 'lucide-react';

interface PlantInspectorModalProps {
  specimen: PlantSpecimen;
  onClose: () => void;
  onHydrate: (plantId: string) => void;
  onFocus: (specimen: PlantSpecimen) => void;
}

export const PlantInspectorModal: React.FC<PlantInspectorModalProps> = ({
  specimen,
  onClose,
  onHydrate,
  onFocus,
}) => {
  return (
    <div
      className="absolute top-4 right-4 z-20 w-80 bg-neutral-900/95 text-neutral-100 border border-neutral-700/80 rounded-xl shadow-2xl p-4 transition-all duration-200"
      role="dialog"
      aria-labelledby="specimen-name"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-neutral-800 pb-2.5">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded">
            {specimen.type}
          </span>
          <h3 id="specimen-name" className="text-base font-semibold text-neutral-100 mt-1 leading-snug">
            {specimen.name}
          </h3>
          <p className="text-xs italic text-neutral-400 font-serif">
            {specimen.scientificName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          title="Close details"
          aria-label="Close plant inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-neutral-300 mt-3 leading-relaxed">
        {specimen.description}
      </p>

      {/* Vitals */}
      <div className="grid grid-cols-2 gap-2 my-3.5 bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800/80">
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

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onHydrate(specimen.id)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors cursor-pointer shadow"
        >
          <Droplets className="w-3.5 h-3.5" />
          <span>Hydrate Plant</span>
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

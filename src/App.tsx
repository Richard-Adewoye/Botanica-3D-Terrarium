/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TerrariumCanvas } from './components/TerrariumCanvas';
import { ControlOverlay } from './components/ControlOverlay';
import { PlantInspectorModal } from './components/PlantInspectorModal';
import { CreatureInspectorModal } from './components/CreatureInspectorModal';
import { TerrariumScene } from './three/TerrariumScene';
import { INITIAL_SPECIMENS } from './data/initialFlora';
import { INITIAL_CREATURES } from './data/initialCreatures';
import { PlantSpecimen, CreatureSpecimen, TerrariumConfig } from './types/terrarium';
import { terrariumAudio } from './audio/proceduralAudio';
import { Camera, Check } from 'lucide-react';

export default function App() {
  const sceneRef = useRef<TerrariumScene | null>(null);

  const [specimens, setSpecimens] = useState<PlantSpecimen[]>(INITIAL_SPECIMENS);
  const [creatures, setCreatures] = useState<CreatureSpecimen[]>(INITIAL_CREATURES);

  const [selectedPlant, setSelectedPlant] = useState<PlantSpecimen | null>(null);
  const [selectedCreature, setSelectedCreature] = useState<CreatureSpecimen | null>(null);

  // Snapshot visual feedback
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const [snapshotToast, setSnapshotToast] = useState<string | null>(null);

  const [config, setConfig] = useState<TerrariumConfig>({
    timeHours: 12.0, // High noon initially
    autoCycleTime: false,
    timeCycleSpeed: 1,
    weather: 'clear',
    humidity: 55,
    lidOpenAmount: 0,
    cameraPreset: 'default',
    autoRotate: false,
    vesselStyle: 'hexagonal',
    soundEnabled: true,
    soundVolume: 0.5,
    selectedPlantId: null,
    selectedCreatureId: null,
    showCreatures: true,
    seed: 42,
  });

  const handleUpdateConfig = useCallback((newPartial: Partial<TerrariumConfig>) => {
    setConfig((prev) => ({ ...prev, ...newPartial }));
  }, []);

  const handleSelectPlant = useCallback((specimen: PlantSpecimen | null) => {
    setSelectedPlant(specimen);
    if (specimen) {
      setSelectedCreature(null);
    }
    handleUpdateConfig({
      selectedPlantId: specimen ? specimen.id : null,
      selectedCreatureId: null,
    });
  }, [handleUpdateConfig]);

  const handleSelectCreature = useCallback((creature: CreatureSpecimen | null) => {
    setSelectedCreature(creature);
    if (creature) {
      setSelectedPlant(null);
    }
    handleUpdateConfig({
      selectedCreatureId: creature ? creature.id : null,
      selectedPlantId: null,
    });
  }, [handleUpdateConfig]);

  const handleHydratePlant = useCallback((plantId: string) => {
    if (sceneRef.current) {
      sceneRef.current.hydratePlant(plantId);
    }
    const h = Math.floor(config.timeHours);
    const m = Math.floor((config.timeHours % 1) * 60);
    const timeLabel = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    setSpecimens((prev) =>
      prev.map((s) => {
        if (s.id !== plantId) return s;
        const newMoisture = Math.min(100, s.moisture + 25);
        const newHealth = Math.min(100, s.health + 5);
        const newHistory = [
          ...(s.growthHistory || []),
          {
            timestamp: timeLabel,
            health: newHealth,
            moisture: newMoisture,
            event: 'Hydrated (+25%)',
          },
        ].slice(-12);

        const updated = {
          ...s,
          moisture: newMoisture,
          health: newHealth,
          growthHistory: newHistory,
        };

        // Also sync currently inspected plant modal
        setSelectedPlant((curr) => (curr && curr.id === plantId ? updated : curr));
        return updated;
      })
    );
  }, [config.timeHours]);

  const handleFocusPlant = useCallback((specimen: PlantSpecimen) => {
    if (sceneRef.current) {
      sceneRef.current.focusOnPlant(specimen);
    }
  }, []);

  const handleInteractCreature = useCallback((creatureId: string) => {
    if (sceneRef.current) {
      sceneRef.current.petCreature(creatureId);
    }
    setCreatures((prev) =>
      prev.map((c) =>
        c.id === creatureId ? { ...c, activityLevel: Math.min(100, c.activityLevel + 15) } : c
      )
    );
  }, []);

  const handleFocusCreature = useCallback((creature: CreatureSpecimen) => {
    if (sceneRef.current) {
      sceneRef.current.focusOnCreature(creature);
    }
  }, []);

  const handleRegenerateFlora = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 10000);
    const randomized = INITIAL_SPECIMENS.map((s) => ({
      ...s,
      scale: s.scale * (0.9 + Math.random() * 0.2),
      rotationY: Math.random() * Math.PI * 2,
      moisture: Math.floor(55 + Math.random() * 40),
      health: Math.floor(88 + Math.random() * 12),
      growthHistory: s.growthHistory.map((pt) => ({
        ...pt,
        health: Math.min(100, Math.max(40, pt.health + Math.floor((Math.random() - 0.5) * 8))),
        moisture: Math.min(100, Math.max(30, pt.moisture + Math.floor((Math.random() - 0.5) * 12))),
      })),
    }));
    setSpecimens(randomized);
    setSelectedPlant((curr) => (curr ? randomized.find((r) => r.id === curr.id) || null : null));
    handleUpdateConfig({ seed: newSeed });
  }, [handleUpdateConfig]);

  // Snapshot Capture logic
  const handleCaptureSnapshot = useCallback(() => {
    if (!sceneRef.current) return;

    // 1. Play realistic mechanical camera shutter sound
    terrariumAudio.playShutterSound();

    // 2. Visual camera shutter flash
    setIsShutterFlashing(true);
    setTimeout(() => {
      setIsShutterFlashing(false);
    }, 180);

    // 3. Render and capture full canvas data URL
    const dataUrl = sceneRef.current.captureSnapshot();

    // 4. Generate formatted filename with timestamp
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const fileName = `botanica-terrarium-${timeStamp}.png`;

    // 5. Trigger download via client link
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 6. Toast feedback
    setSnapshotToast(fileName);
    setTimeout(() => {
      setSnapshotToast(null);
    }, 3800);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        setSelectedPlant(null);
        setSelectedCreature(null);
        handleUpdateConfig({ selectedPlantId: null, selectedCreatureId: null });
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setConfig((prev) => ({ ...prev, autoRotate: !prev.autoRotate }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUpdateConfig]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none">
      {/* Visual Camera Shutter Flash Overlay */}
      {isShutterFlashing && (
        <div
          className="fixed inset-0 bg-white/45 pointer-events-none z-50 transition-opacity duration-150 animate-out fade-out"
          aria-hidden="true"
        />
      )}

      {/* Snapshot Toast Notification */}
      {snapshotToast && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-neutral-900/95 text-neutral-100 border border-sky-500/80 px-4 py-2 rounded-xl shadow-2xl transition-all duration-300"
          role="status"
        >
          <div className="p-1 rounded-full bg-sky-500/20 text-sky-400">
            <Check className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-neutral-100 flex items-center gap-1.5">
              Snapshot Captured & Downloaded
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              {snapshotToast}
            </span>
          </div>
        </div>
      )}

      {/* 3D Terrarium Canvas Container */}
      <TerrariumCanvas
        config={config}
        specimens={specimens}
        creatures={creatures}
        onSelectPlant={handleSelectPlant}
        onSelectCreature={handleSelectCreature}
        onSceneReady={(scene) => {
          sceneRef.current = scene;
        }}
        onTimeUpdate={(timeHours) => {
          setConfig((prev) => ({ ...prev, timeHours }));
        }}
      />

      {/* Selected Plant Detail Inspector Card */}
      {selectedPlant && (
        <PlantInspectorModal
          specimen={selectedPlant}
          onClose={() => handleSelectPlant(null)}
          onHydrate={handleHydratePlant}
          onFocus={handleFocusPlant}
        />
      )}

      {/* Selected Creature Detail Inspector Card */}
      {selectedCreature && (
        <CreatureInspectorModal
          creature={selectedCreature}
          onClose={() => handleSelectCreature(null)}
          onInteract={handleInteractCreature}
          onFocus={handleFocusCreature}
        />
      )}

      {/* Sleek Collapsible Bottom Dock */}
      <ControlOverlay
        config={config}
        onUpdateConfig={handleUpdateConfig}
        specimens={specimens}
        creatures={creatures}
        onSelectPlant={handleSelectPlant}
        onSelectCreature={handleSelectCreature}
        onHydratePlant={handleHydratePlant}
        onRegenerateFlora={handleRegenerateFlora}
        onCaptureSnapshot={handleCaptureSnapshot}
      />
    </main>
  );
}

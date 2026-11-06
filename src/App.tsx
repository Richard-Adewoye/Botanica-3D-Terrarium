/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TerrariumCanvas } from './components/TerrariumCanvas';
import { ControlOverlay } from './components/ControlOverlay';
import { PlantInspectorModal } from './components/PlantInspectorModal';
import { CreatureInspectorModal } from './components/CreatureInspectorModal';
import { TimeLapseModal } from './components/TimeLapseModal';
import { TerrariumScene } from './three/TerrariumScene';
import { INITIAL_SPECIMENS } from './data/initialFlora';
import { INITIAL_CREATURES } from './data/initialCreatures';
import { DEFAULT_CIRCADIAN_NODES } from './components/CircadianSchedulePanel';
import { PlantSpecimen, CreatureSpecimen, TerrariumConfig, DailyTask } from './types/terrarium';
import { DEFAULT_SOUND_LAYERS, terrariumAudio } from './audio/proceduralAudio';
import { Camera, Check } from 'lucide-react';

export default function App() {
  const sceneRef = useRef<TerrariumScene | null>(null);

  const [specimens, setSpecimens] = useState<PlantSpecimen[]>(INITIAL_SPECIMENS);
  const [creatures, setCreatures] = useState<CreatureSpecimen[]>(INITIAL_CREATURES);

  const [selectedPlant, setSelectedPlant] = useState<PlantSpecimen | null>(null);
  const [selectedCreature, setSelectedCreature] = useState<CreatureSpecimen | null>(null);

  // Time-Lapse Studio state
  const [isTimeLapseActive, setIsTimeLapseActive] = useState<boolean>(false);
  const [timeLapseTargetPlantId, setTimeLapseTargetPlantId] = useState<string | null>(null);

  // Daily Tasks state
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([
    {
      id: 'task-hydrate',
      title: 'Hydrate Terrarium Flora',
      category: 'hydration',
      description: 'Water any plant specimen in the terrarium to boost root hydration.',
      rewardText: '+10% All Flora Vitality Surge',
      completed: false,
      actionHint: 'Click a plant specimen and select Hydrate (+25%)',
    },
    {
      id: 'task-weather',
      title: 'Atmospheric Weather Shift',
      category: 'weather',
      description: 'Switch terrarium atmosphere to Rain, Storm, or Spores mode.',
      rewardText: 'Golden Spores & Radiant Bloom Burst',
      completed: false,
      actionHint: 'Select Rain, Storm, or Spores in Weather tab',
    },
    {
      id: 'task-timelapse',
      title: 'Cinematic Growth Recording',
      category: 'timelapse',
      description: 'Launch the Flora Growth Time-Lapse Studio or capture a PNG snapshot.',
      rewardText: 'Supernova Bloom Intensity & Max Health',
      completed: false,
      actionHint: 'Press "T" for Time-Lapse Studio or "S" for Snapshot',
    },
  ]);

  // Snapshot visual feedback
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const [snapshotToast, setSnapshotToast] = useState<string | null>(null);

  const [config, setConfig] = useState<TerrariumConfig>({
    timeHours: 12.0, // High noon initially
    autoCycleTime: false,
    timeCycleSpeed: 1,
    autoCircadianSchedule: false,
    circadianNodes: DEFAULT_CIRCADIAN_NODES,
    weather: 'clear',
    humidity: 55,
    showWeatherParticles: true,
    lidOpenAmount: 0,
    cameraPreset: 'default',
    autoRotate: false,
    vesselStyle: 'hexagonal',
    soundEnabled: true,
    soundVolume: 0.5,
    soundLayers: { ...DEFAULT_SOUND_LAYERS },
    bloomIntensity: 0.45,
    selectedPlantId: null,
    selectedCreatureId: null,
    showCreatures: true,
    seed: 42,
  });

  // Automated Circadian Schedule Engine
  useEffect(() => {
    if (!config.autoCircadianSchedule) return;

    const nodes = config.circadianNodes || DEFAULT_CIRCADIAN_NODES;
    if (nodes.length === 0) return;

    const currentHour = config.timeHours;
    const sorted = [...nodes].sort((a, b) => a.startHour - b.startHour);

    let activeNode = sorted[sorted.length - 1];
    for (let i = 0; i < sorted.length; i++) {
      if (currentHour >= sorted[i].startHour) {
        activeNode = sorted[i];
      }
    }

    if (activeNode) {
      setConfig((prev) => {
        if (
          prev.weather === activeNode.weather &&
          prev.humidity === activeNode.targetHumidity &&
          Math.abs(prev.bloomIntensity - activeNode.bloomIntensity) < 0.02
        ) {
          return prev;
        }
        return {
          ...prev,
          weather: activeNode.weather,
          humidity: activeNode.targetHumidity,
          bloomIntensity: activeNode.bloomIntensity,
        };
      });
    }
  }, [config.timeHours, config.autoCircadianSchedule, config.circadianNodes]);

  const handleCompleteTask = useCallback((taskId: string) => {
    setDailyTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId || t.completed) return t;

        // Play celebratory chime
        terrariumAudio.playInteractionTone(880);

        // Apply task reward
        if (taskId === 'task-hydrate') {
          setSpecimens((currSpecimens) =>
            currSpecimens.map((s) => ({
              ...s,
              health: Math.min(100, s.health + 10),
              moisture: Math.min(100, s.moisture + 10),
              growthHistory: [
                ...(s.growthHistory || []),
                {
                  timestamp: 'Reward',
                  health: Math.min(100, s.health + 10),
                  moisture: Math.min(100, s.moisture + 10),
                  event: '🏆 Daily Task: +10% Vitality',
                },
              ].slice(-12),
            }))
          );
          setSnapshotToast('🎉 Daily Task Completed: +10% Vitality Surge applied to all flora!');
        } else if (taskId === 'task-weather') {
          setConfig((c) => ({ ...c, bloomIntensity: 0.85, weather: 'spores' }));
          setSnapshotToast('🎉 Daily Task Completed: Golden Spores & Radiant Bloom unlocked!');
        } else if (taskId === 'task-timelapse') {
          setConfig((c) => ({ ...c, bloomIntensity: 1.2 }));
          setSnapshotToast('🎉 Daily Task Completed: Supernova Bloom Burst unlocked!');
        }

        setTimeout(() => setSnapshotToast(null), 4200);
        return { ...t, completed: true };
      })
    );
  }, []);

  const handleUpdateConfig = useCallback((newPartial: Partial<TerrariumConfig>) => {
    setConfig((prev) => ({ ...prev, ...newPartial }));
    if (newPartial.weather && newPartial.weather !== 'clear') {
      handleCompleteTask('task-weather');
    }
  }, [handleCompleteTask]);

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
    handleCompleteTask('task-hydrate');
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
  }, [config.timeHours, handleCompleteTask]);

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

  const handleOpenTimeLapse = useCallback((plantId?: string) => {
    setTimeLapseTargetPlantId(plantId || null);
    setIsTimeLapseActive(true);
    handleCompleteTask('task-timelapse');
  }, [handleCompleteTask]);

  const handleCloseTimeLapse = useCallback(() => {
    setIsTimeLapseActive(false);
  }, []);

  // Snapshot Capture logic
  const handleCaptureSnapshot = useCallback(() => {
    if (!sceneRef.current) return;
    handleCompleteTask('task-timelapse');

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
      {selectedPlant && !isTimeLapseActive && (
        <PlantInspectorModal
          specimen={selectedPlant}
          onClose={() => handleSelectPlant(null)}
          onHydrate={handleHydratePlant}
          onFocus={handleFocusPlant}
          onOpenTimeLapse={handleOpenTimeLapse}
        />
      )}

      {/* Selected Creature Detail Inspector Card */}
      {selectedCreature && !isTimeLapseActive && (
        <CreatureInspectorModal
          creature={selectedCreature}
          onClose={() => handleSelectCreature(null)}
          onInteract={handleInteractCreature}
          onFocus={handleFocusCreature}
        />
      )}

      {/* Time-Lapse 4D Growth Studio Overlay Modal */}
      {isTimeLapseActive && (
        <TimeLapseModal
          specimens={specimens}
          config={config}
          onUpdateConfig={handleUpdateConfig}
          sceneRef={sceneRef}
          onClose={handleCloseTimeLapse}
          initialPlantId={timeLapseTargetPlantId}
        />
      )}

      {/* Sleek Collapsible Bottom Dock */}
      {!isTimeLapseActive && (
        <ControlOverlay
          config={config}
          onUpdateConfig={handleUpdateConfig}
          specimens={specimens}
          creatures={creatures}
          dailyTasks={dailyTasks}
          onCompleteTask={handleCompleteTask}
          onSelectPlant={handleSelectPlant}
          onSelectCreature={handleSelectCreature}
          onHydratePlant={handleHydratePlant}
          onRegenerateFlora={handleRegenerateFlora}
          onCaptureSnapshot={handleCaptureSnapshot}
          onOpenTimeLapse={handleOpenTimeLapse}
        />
      )}
    </main>
  );
}

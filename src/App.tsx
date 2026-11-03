/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TerrariumCanvas } from './components/TerrariumCanvas';
import { ControlOverlay } from './components/ControlOverlay';
import { PlantInspectorModal } from './components/PlantInspectorModal';
import { TerrariumScene } from './three/TerrariumScene';
import { INITIAL_SPECIMENS } from './data/initialFlora';
import { PlantSpecimen, TerrariumConfig } from './types/terrarium';

export default function App() {
  const sceneRef = useRef<TerrariumScene | null>(null);

  const [specimens, setSpecimens] = useState<PlantSpecimen[]>(INITIAL_SPECIMENS);
  const [selectedPlant, setSelectedPlant] = useState<PlantSpecimen | null>(null);

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
    soundEnabled: false,
    soundVolume: 0.45,
    selectedPlantId: null,
    seed: 42,
  });

  const handleUpdateConfig = useCallback((newPartial: Partial<TerrariumConfig>) => {
    setConfig((prev) => ({ ...prev, ...newPartial }));
  }, []);

  const handleSelectPlant = useCallback((specimen: PlantSpecimen | null) => {
    setSelectedPlant(specimen);
    handleUpdateConfig({ selectedPlantId: specimen ? specimen.id : null });
  }, [handleUpdateConfig]);

  const handleHydratePlant = useCallback((plantId: string) => {
    if (sceneRef.current) {
      sceneRef.current.hydratePlant(plantId);
    }
    setSpecimens((prev) =>
      prev.map((s) =>
        s.id === plantId
          ? { ...s, moisture: Math.min(100, s.moisture + 25), health: Math.min(100, s.health + 5) }
          : s
      )
    );
  }, []);

  const handleFocusPlant = useCallback((specimen: PlantSpecimen) => {
    if (sceneRef.current) {
      sceneRef.current.focusOnPlant(specimen);
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
    }));
    setSpecimens(randomized);
    handleUpdateConfig({ seed: newSeed });
  }, [handleUpdateConfig]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        setSelectedPlant(null);
        handleUpdateConfig({ selectedPlantId: null });
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
      {/* 3D Terrarium Canvas Container */}
      <TerrariumCanvas
        config={config}
        specimens={specimens}
        onSelectPlant={handleSelectPlant}
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

      {/* Sleek Collapsible Bottom Dock */}
      <ControlOverlay
        config={config}
        onUpdateConfig={handleUpdateConfig}
        specimens={specimens}
        onSelectPlant={handleSelectPlant}
        onHydratePlant={handleHydratePlant}
        onRegenerateFlora={handleRegenerateFlora}
      />
    </main>
  );
}

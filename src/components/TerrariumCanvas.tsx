import React, { useEffect, useRef } from 'react';
import { TerrariumScene } from '../three/TerrariumScene';
import { PlantSpecimen, CreatureSpecimen, TerrariumConfig } from '../types/terrarium';

interface TerrariumCanvasProps {
  config: TerrariumConfig;
  specimens: PlantSpecimen[];
  creatures: CreatureSpecimen[];
  onSelectPlant: (specimen: PlantSpecimen | null) => void;
  onSelectCreature: (creature: CreatureSpecimen | null) => void;
  onSceneReady?: (scene: TerrariumScene) => void;
  onTimeUpdate?: (timeHours: number) => void;
}

export const TerrariumCanvas: React.FC<TerrariumCanvasProps> = ({
  config,
  specimens,
  creatures,
  onSelectPlant,
  onSelectCreature,
  onSceneReady,
  onTimeUpdate,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<TerrariumScene | null>(null);

  // Initialize Scene once
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new TerrariumScene(
      mountRef.current,
      config,
      specimens,
      creatures,
      (selected) => onSelectPlant(selected),
      (selectedCreature) => onSelectCreature(selectedCreature)
    );

    sceneRef.current = scene;
    onSceneReady?.(scene);

    // Periodic time sync if auto cycle is running
    const timeInterval = setInterval(() => {
      if (sceneRef.current && config.autoCycleTime) {
        onTimeUpdate?.(sceneRef.current.getTimeHours());
      }
    }, 250);

    return () => {
      clearInterval(timeInterval);
      scene.dispose();
      sceneRef.current = null;
    };
  }, []); // Run once on mount

  // Sync config changes without destroying scene
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateConfig(config);
    }
  }, [config]);

  // Sync specimens changes
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setSpecimens(specimens);
    }
  }, [specimens]);

  // Sync creatures changes
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setCreatures(creatures);
    }
  }, [creatures]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
      tabIndex={0}
      aria-label="3D Interactive Terrarium Scene"
    />
  );
};

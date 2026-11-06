import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlantSpecimen, TerrariumConfig } from '../types/terrarium';
import { TerrariumScene } from '../three/TerrariumScene';
import { terrariumAudio } from '../audio/proceduralAudio';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Video,
  X,
  Clock,
  Activity,
  Droplets,
  Sun,
  Check,
  Sliders,
} from 'lucide-react';

interface TimeLapseModalProps {
  specimens: PlantSpecimen[];
  config: TerrariumConfig;
  onUpdateConfig: (newConfig: Partial<TerrariumConfig>) => void;
  sceneRef: React.RefObject<TerrariumScene | null>;
  onClose: () => void;
  initialPlantId?: string | null;
}

export const TimeLapseModal: React.FC<TimeLapseModalProps> = ({
  specimens,
  config,
  onUpdateConfig,
  sceneRef,
  onClose,
  initialPlantId = null,
}) => {
  const [targetPlantId, setTargetPlantId] = useState<string | null>(initialPlantId);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0); // 0.0 to 1.0
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 0.5x, 1x, 2x, 4x, 8x
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [syncDayNight, setSyncDayNight] = useState<boolean>(true);

  // Recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);
  const [recordingToast, setRecordingToast] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Selected specimen or all flora
  const currentSpecimen = targetPlantId
    ? specimens.find((s) => s.id === targetPlantId) || specimens[0]
    : null;

  // Keyframe history timeline
  const activeHistory = currentSpecimen
    ? currentSpecimen.growthHistory || []
    : specimens[0]?.growthHistory || [];

  // Compute active keyframe point
  const totalPoints = activeHistory.length;
  const currentIndex = totalPoints > 0 ? Math.min(totalPoints - 1, Math.floor(progress * totalPoints)) : 0;
  const currentPoint = activeHistory[currentIndex] || {
    timestamp: '12:00',
    health: 95,
    moisture: 70,
    event: 'Normal Growth',
  };

  // Convert timestamp (e.g. "08:00") into hour decimal
  const parseHourFromTimestamp = (ts: string): number => {
    if (!ts) return 12;
    const parts = ts.split(':');
    const h = parseInt(parts[0], 10) || 12;
    const m = parseInt(parts[1], 10) || 0;
    return h + m / 60;
  };

  const currentHour = parseHourFromTimestamp(currentPoint.timestamp);

  // Sync 3D scene growth & lighting on progress change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Apply scale & health interpolation to specimens
    specimens.forEach((specimen) => {
      if (targetPlantId && specimen.id !== targetPlantId) return;

      const hist = specimen.growthHistory || [];
      if (hist.length === 0) return;

      const idxFloat = progress * (hist.length - 1);
      const lowIdx = Math.floor(idxFloat);
      const highIdx = Math.min(hist.length - 1, Math.ceil(idxFloat));
      const t = idxFloat - lowIdx;

      const pLow = hist[lowIdx];
      const pHigh = hist[highIdx];

      const healthInterp = pLow.health + (pHigh.health - pLow.health) * t;
      // Scale factor ranges from 0.7 to 1.15 based on growth history
      const growthFactor = 0.72 + (healthInterp / 100) * 0.38;

      // Update mesh scale directly in 3D scene
      const plantGroup = scene.getFloraGroup?.()?.getObjectByName(`plant-${specimen.id}`);
      if (plantGroup && plantGroup.userData?.originalScale) {
        const orig = plantGroup.userData.originalScale;
        plantGroup.scale.set(orig.x * growthFactor, orig.y * growthFactor, orig.z * growthFactor);
      }
    });

    // Optionally sync day-night light trajectory
    if (syncDayNight) {
      onUpdateConfig({ timeHours: currentHour });
    }
  }, [progress, specimens, targetPlantId, syncDayNight, currentHour, onUpdateConfig, sceneRef]);

  // Focus camera when target plant changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (targetPlantId) {
      const found = specimens.find((s) => s.id === targetPlantId);
      if (found) {
        scene.focusOnPlant(found);
      }
    } else {
      scene.applyCameraPreset('default');
    }
  }, [targetPlantId, specimens, sceneRef]);

  // Playback timer tick
  useEffect(() => {
    if (!isPlaying || isRecording) return;

    const durationSeconds = 8 / playbackSpeed; // base 8 seconds for full sequence
    const intervalMs = 40;
    const step = (intervalMs / 1000) / durationSeconds;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 1.0) {
          if (isLooping) {
            terrariumAudio.playFloraRustle(0.4);
            return 0;
          } else {
            setIsPlaying(false);
            return 1.0;
          }
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, isLooping, isRecording]);

  // Sound effect on event change
  const prevIndexRef = useRef<number>(currentIndex);
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      prevIndexRef.current = currentIndex;
      if (currentPoint.event?.includes('Hydrated') || currentPoint.event?.includes('Dew') || currentPoint.event?.includes('Moisture')) {
        terrariumAudio.playWaterDroplet();
      } else {
        terrariumAudio.playFloraRustle(0.6);
      }
    }
  }, [currentIndex, currentPoint]);

  // Reset plant scales when modal closes
  const handleCloseModal = () => {
    const scene = sceneRef.current;
    if (scene) {
      specimens.forEach((specimen) => {
        const plantGroup = scene.getFloraGroup?.()?.getObjectByName(`plant-${specimen.id}`);
        if (plantGroup && plantGroup.userData?.originalScale) {
          plantGroup.scale.copy(plantGroup.userData.originalScale);
        }
      });
      scene.applyCameraPreset('default');
    }
    onClose();
  };

  // WebM Canvas Video Exporter using MediaRecorder
  const handleStartExportVideo = useCallback(() => {
    if (!sceneRef.current) return;

    const canvas = sceneRef.current.getCanvasElement?.();
    if (!canvas) return;

    // Stop normal play loop and reset to beginning
    setIsPlaying(false);
    setProgress(0);
    setIsRecording(true);
    setRecordingProgress(0);
    recordedChunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = canvas.captureStream(30); // 30 FPS
    } catch {
      alert('Canvas video capture is not supported in this browser viewport.');
      setIsRecording(false);
      return;
    }

    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }

    try {
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4000000 });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const fileName = `botanica-timelapse-${targetPlantId || 'all'}-${Date.now()}.webm`;

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setIsRecording(false);
        setRecordingToast(`Downloaded ${fileName}`);
        setTimeout(() => setRecordingToast(null), 4000);
      };

      recorder.start();

      // Automated playback recording step loop
      const recordSteps = 100;
      let currentStep = 0;
      const stepInterval = setInterval(() => {
        currentStep++;
        const p = currentStep / recordSteps;
        setProgress(p);
        setRecordingProgress(Math.round(p * 100));

        if (currentStep >= recordSteps) {
          clearInterval(stepInterval);
          setTimeout(() => {
            if (recorder.state !== 'inactive') {
              recorder.stop();
            }
          }, 400);
        }
      }, 60); // 6 seconds total recording
    } catch (err) {
      console.error('Failed to initialize MediaRecorder:', err);
      setIsRecording(false);
    }
  }, [sceneRef, targetPlantId]);

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Header Control Bar */}
      <div className="pointer-events-auto flex items-center justify-between bg-neutral-900/95 border border-neutral-700/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-700/80 text-emerald-400">
            <Video className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              Flora Growth Time-Lapse Studio
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full font-normal">
                4D Simulation
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              Simulates morphological leaf scaling &amp; environmental history frame-by-frame.
            </p>
          </div>
        </div>

        {/* Target Specimen Dropdown Selector */}
        <div className="flex items-center gap-2">
          <select
            value={targetPlantId || 'all'}
            onChange={(e) => setTargetPlantId(e.target.value === 'all' ? null : e.target.value)}
            className="bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">🌱 All Terrarium Flora (Group Sequence)</option>
            {specimens.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.type})
              </option>
            ))}
          </select>

          <button
            onClick={handleCloseModal}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition-colors cursor-pointer"
            title="Exit Time-Lapse Studio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live HUD Floating Card (Top Right) */}
      <div className="pointer-events-auto self-end max-w-xs w-full bg-neutral-900/90 border border-neutral-700/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-neutral-100 space-y-2.5 my-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulated Hour:</span>
          </span>
          <span className="text-xs font-mono text-amber-300 font-bold bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded">
            {currentPoint.timestamp}
          </span>
        </div>

        {/* Active Event Callout */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-2.5 space-y-1">
          <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">
            Active Biological Event:
          </span>
          <p className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{currentPoint.event || 'Photosynthesis Cycle'}</span>
          </p>
        </div>

        {/* Gauges */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-neutral-800/60 p-2 rounded-xl border border-neutral-700/60">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400" /> Health
              </span>
              <span className="font-mono text-emerald-300 font-semibold">{currentPoint.health}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${currentPoint.health}%` }}
              />
            </div>
          </div>

          <div className="bg-neutral-800/60 p-2 rounded-xl border border-neutral-700/60">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3 text-sky-400" /> Moisture
              </span>
              <span className="font-mono text-sky-300 font-semibold">{currentPoint.moisture}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-300"
                style={{ width: `${currentPoint.moisture}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {recordingToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 pointer-events-auto bg-emerald-900 border border-emerald-500 text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{recordingToast}</span>
        </div>
      )}

      {/* Recording Overlay Indicator */}
      {isRecording && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 pointer-events-auto bg-neutral-900/95 border border-rose-500 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-medium">
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
          <div className="flex flex-col">
            <span className="font-semibold text-rose-300">Rendering &amp; Exporting WebM Video...</span>
            <span className="text-[10px] text-neutral-400 font-mono">Progress: {recordingProgress}%</span>
          </div>
        </div>
      )}

      {/* Bottom Main Video Controls Bar */}
      <div className="pointer-events-auto bg-neutral-900/95 border border-neutral-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md max-w-4xl mx-auto w-full space-y-3">
        {/* Scrubber Timeline Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-300">
            <span className="font-medium flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Timeline Scrubber Sequence:</span>
            </span>
            <span className="font-mono text-emerald-400 font-semibold">
              {Math.round(progress * 100)}% Complete ({currentPoint.timestamp})
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.005"
              value={progress}
              onChange={(e) => {
                setIsPlaying(false);
                setProgress(parseFloat(e.target.value));
              }}
              className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />

            {/* Keyframe Markers along timeline */}
            {activeHistory.map((pt, idx) => {
              const markerPos = (idx / (totalPoints - 1 || 1)) * 100;
              const isActive = idx === currentIndex;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setIsPlaying(false);
                    setProgress(idx / (totalPoints - 1 || 1));
                  }}
                  className={`absolute -top-1.5 w-3 h-3 rounded-full border-2 transition-all cursor-pointer -translate-x-1/2 ${
                    isActive
                      ? 'bg-emerald-400 border-white scale-125 z-10 shadow-lg'
                      : 'bg-neutral-800 border-neutral-500 hover:bg-emerald-600'
                  }`}
                  style={{ left: `${markerPos}%` }}
                  title={`${pt.timestamp}: ${pt.event} (Health: ${pt.health}%)`}
                />
              );
            })}
          </div>
        </div>

        {/* Buttons Control Deck */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Play / Pause / Reset Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={isRecording}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow transition-all cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play Sequence</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setProgress(0);
                setIsPlaying(true);
              }}
              disabled={isRecording}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition-colors cursor-pointer"
              title="Restart from 00:00"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Playback Speed Toggles */}
            <div className="flex items-center gap-1 bg-neutral-800/80 p-1 rounded-xl border border-neutral-700/80">
              {[0.5, 1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-emerald-600 text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Feature Toggles (Sync Day-Night & Loop) */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={syncDayNight}
                onChange={(e) => setSyncDayNight(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Sync Day/Night Lighting</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isLooping}
                onChange={(e) => setIsLooping(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <span>Loop Sequence</span>
            </label>
          </div>

          {/* Export Video Button */}
          <button
            onClick={handleStartExportVideo}
            disabled={isRecording}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow border border-sky-400/30 transition-all cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>Export WebM Video</span>
          </button>
        </div>
      </div>
    </div>
  );
};

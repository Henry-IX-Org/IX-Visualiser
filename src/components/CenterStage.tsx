import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Rewind, 
  FastForward, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX 
} from 'lucide-react';
import { VisualizerCanvas } from './VisualizerCanvas';
import { DJBrandingOverlay } from './DJBrandingOverlay';
import { VisualizerConfig, DJBranding } from '../types/visualizer';
import { AspectRatio, TimelineClip } from '../types/timeline';
import { AudioEngine } from '../audio/AudioEngine';
import { Tooltip } from './common/Tooltip';

interface CenterStageProps {
  audioEngine: AudioEngine;
  config: VisualizerConfig;
  aspectRatio: AspectRatio;
  activeClip: TimelineClip | null;
  onCanvasReady: (canvas: HTMLCanvasElement | null) => void;
  branding: DJBranding;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export const CenterStage: React.FC<CenterStageProps> = ({
  audioEngine,
  config,
  aspectRatio,
  activeClip,
  onCanvasReady,
  branding,
  currentTime,
  duration,
  onSeek,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsPlaying(audioEngine.getIsPlaying());
    }, 120);
    return () => clearInterval(timer);
  }, [audioEngine]);

  const handlePlayPause = async () => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      await audioEngine.play();
      setIsPlaying(true);
    }
  };

  const handleJump = (seconds: number) => {
    const target = Math.max(0, Math.min(duration || 120, currentTime + seconds));
    onSeek(target);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    onSeek(target);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioEngine.setVolume(val);
    if (val > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      audioEngine.setVolume(volume);
      setIsMuted(false);
    } else {
      audioEngine.setVolume(0);
      setIsMuted(true);
    }
  };

  const formatTimecode = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const h = Math.floor(m / 60);
    if (h > 0) {
      return `${h}:${(m % 60).toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <main className="relative flex-1 min-w-0 min-h-0 flex flex-col items-center justify-between bg-black overflow-hidden select-none">
      {/* Visualiser Viewport framed by Aspect Ratio */}
      <div className="relative flex-1 w-full min-h-0 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        <VisualizerCanvas
          audioEngine={audioEngine}
          config={config}
          aspectRatio={aspectRatio}
          activeClip={activeClip}
          onCanvasReady={onCanvasReady}
        />

        {/* HUD Watermark */}
        <DJBrandingOverlay
          branding={branding}
          audioEngine={audioEngine}
          accentColor={config.palette.primary}
        />
      </div>

      {/* Docked Audio Transport Bar */}
      <div className="w-full max-w-2xl px-4 py-2 z-20 flex flex-col gap-2 shrink-0 bg-gradient-to-t from-black via-black/90 to-transparent">
        {/* Scrubber & Timecode */}
        <div className="w-full flex items-center gap-3 font-mono text-[11px]">
          <span className="text-white font-bold w-12 text-right">
            {formatTimecode(currentTime)}
          </span>

          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            className="flex-1 h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-[#D8163F]"
          />

          <span className="text-neutral-500 w-12 text-left">
            {formatTimecode(duration)}
          </span>
        </div>

        {/* Audio Transport Buttons */}
        <div className="flex items-center justify-between">
          <div className="w-20" /> {/* Spacer to balance volume */}

          {/* Central Controls: Jump -15s, Rewind, Play/Pause, Fast Forward, Jump +15s */}
          <div className="flex items-center gap-2">
            {/* Jump -15s */}
            <Tooltip text="Jump -15s" position="top">
              <button
                onClick={() => handleJump(-15)}
                className="w-7 h-7 flex items-center justify-center gap-0.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-900 border border-white/5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[9px] font-mono font-bold">15</span>
              </button>
            </Tooltip>

            {/* Rewind */}
            <Tooltip text="Rewind -5s" position="top">
              <button
                onClick={() => handleJump(-5)}
                className="w-7 h-7 flex items-center justify-center rounded text-neutral-400 hover:text-white hover:bg-neutral-900 border border-white/5 transition-colors cursor-pointer"
              >
                <Rewind className="w-3.5 h-3.5 fill-current" />
              </button>
            </Tooltip>

            {/* Play / Pause */}
            <Tooltip text={isPlaying ? "Pause" : "Play"} position="top">
              <button
                onClick={handlePlayPause}
                className="w-8 h-8 rounded-full bg-[#D8163F] hover:bg-[#b01032] text-white flex items-center justify-center shadow-lg shadow-[#D8163F]/40 transition-all cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>
            </Tooltip>

            {/* Fast Forward */}
            <Tooltip text="Fast Forward +5s" position="top">
              <button
                onClick={() => handleJump(5)}
                className="w-7 h-7 flex items-center justify-center rounded text-neutral-400 hover:text-white hover:bg-neutral-900 border border-white/5 transition-colors cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5 fill-current" />
              </button>
            </Tooltip>

            {/* Jump +15s */}
            <Tooltip text="Jump +15s" position="top">
              <button
                onClick={() => handleJump(15)}
                className="w-7 h-7 flex items-center justify-center gap-0.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-900 border border-white/5 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="text-[9px] font-mono font-bold">15</span>
              </button>
            </Tooltip>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5 w-24 justify-end text-neutral-400">
            <Tooltip text={isMuted || volume === 0 ? "Unmute" : "Mute"} position="top">
              <button
                onClick={toggleMute}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-900 hover:text-white cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
            </Tooltip>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-14 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-[#D8163F]"
            />
          </div>
        </div>
      </div>
    </main>
  );
};

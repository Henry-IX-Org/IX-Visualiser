import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Video, 
  Maximize, 
  Minimize
} from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { AudioSourceType } from '../types/visualizer';
import { Tooltip } from './common/Tooltip';

interface StudioHeaderProps {
  audioEngine: AudioEngine;
  onToggleDrawer: () => void;
  onOpenRecordModal: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  trackName: string;
  setTrackName: (name: string) => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  audioEngine,
  onToggleDrawer,
  onOpenRecordModal,
  isFullscreen,
  onToggleFullscreen,
  trackName,
  setTrackName,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [sourceType, setSourceType] = useState<AudioSourceType>('file');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsPlaying(audioEngine.getIsPlaying());
      setCurrentTime(audioEngine.getCurrentTime());
      setDuration(audioEngine.getDuration());
      setSourceType(audioEngine.getCurrentSource());
    }, 150);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const name = await audioEngine.loadFile(file);
      setTrackName(name.replace(/\.[^/.]+$/, ''));
      setIsPlaying(true);
      setSourceType('file');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSourceSelect = async (type: string) => {
    if (type === 'upload') {
      fileInputRef.current?.click();
    } else if (type === 'mic') {
      try {
        await audioEngine.enableMicrophone();
        setSourceType('mic');
        setIsPlaying(true);
        setTrackName('MIC / LINE-IN');
      } catch (err: any) {
        alert(err.message);
      }
    } else if (type === 'synth') {
      await audioEngine.startDemoSynth();
      setSourceType('synth');
      setIsPlaying(true);
      setTrackName('128 BPM SYNTH');
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    audioEngine.seek(target);
    setCurrentTime(target);
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
    <header className="absolute top-0 left-0 right-0 z-30 flex h-10 items-center justify-between px-3 bg-black/95 backdrop-blur-2xl border-b border-white/10 text-white shadow-xl font-ocra text-xs select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Left: Brand & Minimal Source Dropdown */}
      <div className="flex items-center gap-2">
        <img src="/logo-ix.svg" alt="IX" className="w-5 h-5 drop-shadow-[0_0_6px_#D8163F]" />
        <span className="font-avathe text-base tracking-widest text-white uppercase redline-glow hidden sm:inline">
          HENRY IX
        </span>

        <div className="h-4 w-px bg-white/10 mx-1" />

        <Tooltip text="Audio Source" position="bottom">
          <select
            value={sourceType === 'file' ? 'upload' : sourceType}
            onChange={(e) => handleSourceSelect(e.target.value)}
            className="h-7 px-2 bg-neutral-900 text-white text-[11px] font-bold rounded border border-white/10 focus:border-[#D8163F] outline-none cursor-pointer"
          >
            <option value="upload">File</option>
            <option value="mic">Mic</option>
            <option value="synth">Synth</option>
          </select>
        </Tooltip>

        <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[140px] md:max-w-xs hidden lg:inline">
          {trackName}
        </span>
      </div>

      {/* Center: Transport */}
      <div className="flex items-center gap-2">
        <Tooltip text={isPlaying ? "Pause (Space)" : "Play (Space)"} position="bottom">
          <button
            onClick={handlePlayPause}
            className={`w-7 h-7 flex items-center justify-center rounded transition-all cursor-pointer ${
              isPlaying
                ? 'bg-[#D8163F] text-white shadow-sm'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-white/10'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>
        </Tooltip>

        <div className="h-7 flex items-center gap-1.5 bg-neutral-950 px-2 rounded border border-white/10 font-mono text-[11px]">
          <span className="text-white font-bold">{formatTimecode(currentTime)}</span>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-400">{formatTimecode(duration)}</span>
        </div>

        {sourceType === 'file' && (
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-20 md:w-32 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-[#D8163F] hidden sm:block"
          />
        )}

        <div className="hidden md:flex items-center gap-1 text-neutral-400">
          <Tooltip text={isMuted || volume === 0 ? "Unmute" : "Mute"} position="bottom">
            <button onClick={toggleMute} className="w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-800 hover:text-white cursor-pointer">
              {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
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

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <Tooltip text="Export" position="bottom">
          <button
            onClick={onOpenRecordModal}
            className="w-7 h-7 flex items-center justify-center rounded bg-neutral-900 hover:bg-neutral-800 text-[#D8163F] border border-[#D8163F]/40 cursor-pointer transition-colors"
          >
            <Video className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <Tooltip text="Inspector" position="bottom">
          <button
            onClick={onToggleDrawer}
            className="w-7 h-7 flex items-center justify-center rounded bg-neutral-900 hover:bg-neutral-800 text-white border border-white/10 hover:border-[#D8163F] cursor-pointer transition-colors shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-[#D8163F]" />
          </button>
        </Tooltip>

        <Tooltip text={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"} position="bottom">
          <button
            onClick={onToggleFullscreen}
            className="w-7 h-7 flex items-center justify-center rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/10 cursor-pointer transition-colors"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </Tooltip>
      </div>
    </header>
  );
};

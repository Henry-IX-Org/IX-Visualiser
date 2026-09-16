import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Video, 
  Maximize, 
  Minimize,
  ChevronDown
} from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { AudioSourceType } from '../types/visualizer';

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
      console.error('Failed to load audio file:', err);
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
        setTrackName('HENRY IX • LIVE MIXER LINE-IN');
      } catch (err) {
        alert('Could not access microphone/line-in input: ' + (err as Error).message);
      }
    } else if (type === 'synth') {
      await audioEngine.startDemoSynth();
      setSourceType('synth');
      setIsPlaying(true);
      setTrackName('HENRY IX • 128 BPM TECHNO TEST');
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
    if (!Number.isFinite(seconds) || seconds <= 0) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2 bg-black/95 backdrop-blur-2xl border-b border-white/10 text-white shadow-xl font-ocra text-xs select-none">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Left: Brand & Audio Input Source Dropdown */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <img src="/logo-ix.svg" alt="IX" className="w-5 h-5 object-contain drop-shadow-[0_0_8px_#D8163F]" />
          <span className="font-avathe text-base tracking-widest text-white uppercase hidden sm:inline redline-glow">
            HENRY IX
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-neutral-400 font-mono">STUDIO</span>
        </div>

        <div className="h-4 w-px bg-white/10 hidden md:block" />

        {/* Audio Input Source Dropdown */}
        <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded border border-white/10">
          <span className="text-[10px] text-neutral-400 font-semibold uppercase">Source:</span>
          <select
            value={sourceType === 'file' ? 'upload' : sourceType}
            onChange={(e) => handleSourceSelect(e.target.value)}
            className="bg-transparent text-white text-[11px] font-bold focus:outline-none cursor-pointer pr-1"
          >
            <option value="upload" className="bg-neutral-900 text-white">Audio File (Open Mix...)</option>
            <option value="mic" className="bg-neutral-900 text-white">Live Line-In / Mixer Mic</option>
            <option value="synth" className="bg-neutral-900 text-white">Built-in Techno Synth</option>
          </select>
        </div>

        <div className="truncate max-w-[140px] md:max-w-xs text-[11px] text-neutral-400 truncate hidden lg:block">
          {trackName}
        </div>
      </div>

      {/* Center: DAW Precision Transport Control */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          className={`p-2 rounded transition-all cursor-pointer ${
            isPlaying
              ? 'bg-[#D8163F] text-white shadow-md shadow-[#D8163F]/40'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-white/10'
          }`}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
        </button>

        {/* Precision Timecode Display */}
        <div className="flex items-center gap-2 bg-neutral-950 px-2.5 py-1 rounded border border-white/10 font-mono text-[11px]">
          <span className="text-white font-bold">{formatTimecode(currentTime)}</span>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-400">{formatTimecode(duration)}</span>
        </div>

        {/* Compact Timeline Scrub */}
        {sourceType === 'file' && (
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-24 md:w-36 h-1 bg-neutral-800 appearance-none cursor-pointer accent-[#D8163F] hidden sm:block"
          />
        )}

        {/* Volume Stepper */}
        <div className="hidden md:flex items-center gap-1 text-neutral-400">
          <button onClick={toggleMute} className="p-1 hover:text-white">
            {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-14 h-1 bg-neutral-800 appearance-none cursor-pointer accent-[#D8163F]"
          />
        </div>
      </div>

      {/* Right: Studio Actions & Workspace Windows */}
      <div className="flex items-center gap-2">
        {/* Export Video */}
        <button
          onClick={onOpenRecordModal}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-[#D8163F] border border-[#D8163F]/40 transition-colors cursor-pointer"
          title="Export Video (MP4 / WebCodecs)"
        >
          <Video className="w-3.5 h-3.5" />
          <span className="font-bold hidden sm:inline">Export...</span>
        </button>

        {/* Inspector / Studio Drawer */}
        <button
          onClick={onToggleDrawer}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#D8163F] hover:bg-[#b01032] text-white transition-colors cursor-pointer shadow-sm"
          title="Open Inspector Drawer (S)"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="font-bold hidden sm:inline">Inspector</span>
        </button>

        {/* Fullscreen VJ Mode */}
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen VJ Mode (F)'}
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Upload, 
  Mic, 
  Radio, 
  Maximize, 
  Minimize, 
  Sliders, 
  Video, 
  Volume2, 
  VolumeX
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
    }, 200);
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
    } catch (err) {
      console.error('Failed to load audio file:', err);
    }
  };

  const handleMicToggle = async () => {
    if (sourceType === 'mic') {
      audioEngine.disconnectMic();
      setSourceType('file');
      setIsPlaying(false);
    } else {
      try {
        await audioEngine.enableMicrophone();
        setSourceType('mic');
        setIsPlaying(true);
        setTrackName('HENRY IX • LIVE MIXER LINE-IN');
      } catch (err) {
        alert('Could not access microphone/line-in input: ' + (err as Error).message);
      }
    }
  };

  const handleDemoSynthToggle = async () => {
    if (sourceType === 'synth' && isPlaying) {
      audioEngine.stopSynth();
      setIsPlaying(false);
    } else {
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

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) {
      return `${hours}:${(mins % 60).toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-3.5 bg-black/90 backdrop-blur-2xl border-b border-[#D8163F]/25 text-white shadow-2xl transition-opacity duration-300">
      {/* Brand: Official Henry IX Logo & Track Info */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex items-center gap-2.5">
          <img src="/logo-ix.svg" alt="IX" className="w-6 h-6 object-contain drop-shadow-[0_0_8px_#D8163F]" />
          <span className="font-avathe text-xl tracking-widest text-white uppercase hidden sm:inline redline-glow">
            HENRY IX
          </span>
        </div>

        <div className="h-4 w-px bg-white/20 hidden md:block" />

        <div className="truncate max-w-[140px] sm:max-w-xs font-ocra text-xs tracking-wider text-neutral-300 uppercase">
          {trackName || 'NO TRACK LOADED'}
        </div>
      </div>

      {/* Audio Playback & Transport Controls (Pioneer CDJ Style) */}
      <div className="flex items-center gap-3.5 max-w-md w-full justify-center">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          className={`p-2.5 rounded-full transition-all cursor-pointer ${
            isPlaying
              ? 'bg-[#D8163F] text-white shadow-lg shadow-[#D8163F]/50 ring-2 ring-[#D8163F]/80'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-white/10'
          }`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Timeline Slider */}
        {sourceType === 'file' ? (
          <div className="flex items-center gap-2.5 flex-1 max-w-[240px]">
            <span className="font-ocra text-[10px] text-neutral-400 w-11 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-neutral-800 rounded-none appearance-none cursor-pointer accent-[#D8163F]"
            />
            <span className="font-ocra text-[10px] text-neutral-400 w-11">
              {formatTime(duration)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 bg-[#D8163F]/15 border border-[#D8163F]/40 rounded-full font-ocra text-[11px] text-[#D8163F] tracking-wider animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#D8163F] animate-ping" />
            {sourceType === 'mic' ? 'LIVE INPUT MONITOR' : 'TECHNO TEST SYNTH'}
          </div>
        )}

        {/* Volume slider */}
        <div className="hidden md:flex items-center gap-1.5">
          <button onClick={toggleMute} className="text-neutral-400 hover:text-white p-1">
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1.5 bg-neutral-800 rounded-none appearance-none cursor-pointer accent-[#D8163F]"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Upload Audio File */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 text-xs font-semibold rounded border border-white/10 hover:border-[#D8163F]/40 transition-colors cursor-pointer"
          title="Upload DJ Mix (MP3, WAV, FLAC, AAC)"
        >
          <Upload className="w-3.5 h-3.5 text-[#D8163F]" />
          <span className="hidden sm:inline font-ocra text-[11px]">UPLOAD</span>
        </button>

        {/* Live Mic / Line-in */}
        <button
          onClick={handleMicToggle}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded border transition-all cursor-pointer ${
            sourceType === 'mic'
              ? 'bg-[#D8163F]/20 text-[#D8163F] border-[#D8163F] shadow-sm shadow-[#D8163F]/40'
              : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 border-white/10'
          }`}
          title="Live DJ Mixer Line-in or Mic"
        >
          <Mic className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-ocra text-[11px]">LINE-IN</span>
        </button>

        {/* Demo Synth Button */}
        <button
          onClick={handleDemoSynthToggle}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded border transition-all cursor-pointer ${
            sourceType === 'synth' && isPlaying
              ? 'bg-[#D8163F]/20 text-[#D8163F] border-[#D8163F]'
              : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 border-white/10'
          }`}
          title="Play 128 BPM Techno Test Track"
        >
          <Radio className="w-3.5 h-3.5 text-[#E5A93C]" />
          <span className="hidden sm:inline font-ocra text-[11px]">TEST SYNTH</span>
        </button>

        {/* Video Recorder */}
        <button
          onClick={onOpenRecordModal}
          className="p-2 bg-neutral-900/90 hover:bg-neutral-800 text-[#D8163F] rounded border border-white/10 hover:border-[#D8163F]/40 transition-colors cursor-pointer"
          title="Record 60 FPS Visualizer Video"
        >
          <Video className="w-4 h-4" />
        </button>

        {/* Visualiser Studio Controls Drawer Toggle */}
        <button
          onClick={onToggleDrawer}
          className="p-2 bg-[#D8163F] hover:bg-[#b01032] text-white rounded shadow-md shadow-[#D8163F]/40 transition-colors cursor-pointer"
          title="Open Visualiser Studio"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 rounded border border-white/10 transition-colors cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Performance Mode'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

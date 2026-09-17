import React, { useState } from 'react';
import { 
  Zap, 
  Layers, 
  SlidersHorizontal, 
  AudioLines,
  Flame,
  Radio,
  Sparkles,
  Camera,
  RotateCw,
  Plus,
  Trash2,
  Bookmark
} from 'lucide-react';
import { TimelineContainer } from './timeline/TimelineContainer';
import { 
  TimelineTrack, 
  TimelineClip, 
  AspectRatio, 
  AudioWaveformMap 
} from '../types/timeline';
import { VisualizerConfig } from '../types/visualizer';
import { AudioEngine } from '../audio/AudioEngine';

interface BottomPanelProps {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  onUpdateClips: (clips: TimelineClip[]) => void;
  selectedClip: TimelineClip | null;
  onSelectClip: (clip: TimelineClip | null) => void;
  aspectRatio: AspectRatio;
  onChangeAspectRatio: (ar: AspectRatio) => void;
  waveformMap: AudioWaveformMap | null;
  config: VisualizerConfig;
  onChangeConfig: (config: VisualizerConfig) => void;
  audioEngine: AudioEngine;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  duration,
  currentTime,
  onSeek,
  tracks,
  clips,
  onUpdateClips,
  selectedClip,
  onSelectClip,
  aspectRatio,
  onChangeAspectRatio,
  waveformMap,
  config,
  onChangeConfig,
  audioEngine,
}) => {
  const [activeTab, setActiveTab] = useState<'vj' | 'timeline' | 'audio' | 'waveform'>('timeline');

  // VJ Pad active state for visual feedback
  const [activePad, setActivePad] = useState<string | null>(null);

  const triggerPad = (padName: string) => {
    setActivePad(padName);
    setTimeout(() => setActivePad(null), 300);
  };

  return (
    <footer className="w-full h-[33vh] min-h-[220px] max-h-[420px] shrink-0 border-t border-white/10 bg-black flex flex-col font-ocra text-xs select-none">
      {/* Top Tab Bar */}
      <div className="h-8 border-b border-white/10 bg-neutral-950 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-1 h-full">
          <button
            onClick={() => setActiveTab('vj')}
            className={`h-full px-3 flex items-center gap-1.5 border-b-2 text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'vj'
                ? 'border-[#D8163F] text-white bg-white/5'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#D8163F]" />
            <span>VJing</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`h-full px-3 flex items-center gap-1.5 border-b-2 text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'border-[#D8163F] text-white bg-white/5'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#E5A93C]" />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`h-full px-3 flex items-center gap-1.5 border-b-2 text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'border-[#D8163F] text-white bg-white/5'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audio Adjustments</span>
          </button>

          <button
            onClick={() => setActiveTab('waveform')}
            className={`h-full px-3 flex items-center gap-1.5 border-b-2 text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'waveform'
                ? 'border-[#D8163F] text-white bg-white/5'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <AudioLines className="w-3.5 h-3.5 text-emerald-400" />
            <span>Waveform</span>
          </button>
        </div>

        {/* Tab Subtitle / Status Tag */}
        <div className="text-[10px] text-neutral-500 font-mono hidden sm:block">
          {activeTab === 'vj' && 'LIVE PERFORMANCE PAD MATRIX'}
          {activeTab === 'timeline' && 'MULTI-TRACK SEQUENCER'}
          {activeTab === 'audio' && 'DSP & SPECTRAL CALIBRATION'}
          {activeTab === 'waveform' && 'CUE MARKS & TRANSIENT SLICER'}
        </div>
      </div>

      {/* Tab Body Area */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {/* TAB 1: VJing */}
        {activeTab === 'vj' && (
          <div className="h-full p-4 overflow-y-auto flex flex-col justify-between">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 flex-1">
              {[
                { name: 'STROBE DROP', color: '#D8163F', icon: Zap },
                { name: 'RGB GLITCH', color: '#00F0FF', icon: Sparkles },
                { name: 'BASS QUAKE', color: '#E5A93C', icon: Flame },
                { name: 'CAMERA SHAKE', color: '#FF3366', icon: Camera },
                { name: 'NEBULA WARP', color: '#A855F7', icon: RotateCw },
                { name: 'LASER SCAN', color: '#10B981', icon: Radio },
                { name: 'COLOR INVERT', color: '#FFFFFF', icon: Layers },
                { name: 'BLACKOUT', color: '#666666', icon: Zap },
              ].map((pad) => {
                const IconComponent = pad.icon;
                const isPressed = activePad === pad.name;
                return (
                  <button
                    key={pad.name}
                    onClick={() => triggerPad(pad.name)}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all cursor-pointer ${
                      isPressed
                        ? 'scale-95 shadow-lg'
                        : 'bg-neutral-900/80 hover:bg-neutral-800 border-white/10 hover:border-white/20'
                    }`}
                    style={{
                      borderColor: isPressed ? pad.color : undefined,
                      boxShadow: isPressed ? `0 0 20px ${pad.color}88` : undefined,
                    }}
                  >
                    <IconComponent className="w-5 h-5" style={{ color: pad.color }} />
                    <span className="text-[10px] font-bold tracking-wider text-neutral-200 text-center">
                      {pad.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-neutral-500">Live BPM Nudge:</span>
                <button className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 rounded border border-white/10 text-white font-mono">-1</button>
                <button className="px-3 py-1 bg-[#D8163F]/20 hover:bg-[#D8163F]/30 rounded border border-[#D8163F]/50 text-[#D8163F] font-bold">TAP BPM</button>
                <button className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 rounded border border-white/10 text-white font-mono">+1</button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-bold text-neutral-500">VJ Intensity:</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  defaultValue={85}
                  className="w-32 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-[#D8163F]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Multi Track Timeline */}
        {activeTab === 'timeline' && (
          <div className="h-full flex flex-col">
            <TimelineContainer
              duration={duration}
              currentTime={currentTime}
              onSeek={onSeek}
              tracks={tracks}
              clips={clips}
              onUpdateClips={onUpdateClips}
              selectedClip={selectedClip}
              onSelectClip={onSelectClip}
              aspectRatio={aspectRatio}
              onChangeAspectRatio={onChangeAspectRatio}
              waveformMap={waveformMap}
            />
          </div>
        )}

        {/* TAB 3: Audio Adjustments */}
        {activeTab === 'audio' && (
          <div className="h-full p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Master Dynamics */}
            <div className="space-y-3 bg-neutral-950 p-3 rounded-lg border border-white/5">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider block">
                Master Dynamics
              </span>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-neutral-400">Master Sensitivity</span>
                  <span className="text-[#D8163F] font-mono">{(config.sensitivity ?? 1.4).toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={3.0}
                  step={0.1}
                  value={config.sensitivity ?? 1.4}
                  onChange={(e) => onChangeConfig({ ...config, sensitivity: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-[#D8163F]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-neutral-400">Audio Smoothing</span>
                  <span className="text-[#D8163F] font-mono">{(config.smoothing ?? 0.82).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.95}
                  step={0.01}
                  value={config.smoothing ?? 0.82}
                  onChange={(e) => onChangeConfig({ ...config, smoothing: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-[#D8163F]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-neutral-400">Drop Threshold</span>
                  <span className="text-[#D8163F] font-mono">{(config.beatThreshold ?? 0.20).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  value={config.beatThreshold ?? 0.20}
                  onChange={(e) => onChangeConfig({ ...config, beatThreshold: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-[#D8163F]"
                />
              </div>
            </div>

            {/* Column 2: EQ Band Splits */}
            <div className="space-y-3 bg-neutral-950 p-3 rounded-lg border border-white/5">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider block">
                EQ Band Reactivity
              </span>
              <div className="grid grid-cols-4 gap-2 text-center h-28 items-end pb-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-4 h-20 bg-neutral-900 rounded-t relative overflow-hidden">
                    <div className="absolute bottom-0 w-full bg-[#D8163F] rounded-t" style={{ height: '75%' }} />
                  </div>
                  <span className="text-[9px] text-neutral-400 font-mono">SUB</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-4 h-20 bg-neutral-900 rounded-t relative overflow-hidden">
                    <div className="absolute bottom-0 w-full bg-[#E5A93C] rounded-t" style={{ height: '55%' }} />
                  </div>
                  <span className="text-[9px] text-neutral-400 font-mono">BASS</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-4 h-20 bg-neutral-900 rounded-t relative overflow-hidden">
                    <div className="absolute bottom-0 w-full bg-cyan-400 rounded-t" style={{ height: '40%' }} />
                  </div>
                  <span className="text-[9px] text-neutral-400 font-mono">MID</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-4 h-20 bg-neutral-900 rounded-t relative overflow-hidden">
                    <div className="absolute bottom-0 w-full bg-emerald-400 rounded-t" style={{ height: '60%' }} />
                  </div>
                  <span className="text-[9px] text-neutral-400 font-mono">HIGH</span>
                </div>
              </div>
            </div>

            {/* Column 3: Peak Limiter & Output */}
            <div className="space-y-3 bg-neutral-950 p-3 rounded-lg border border-white/5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider block mb-2">
                  Limiter & Headroom
                </span>
                <div className="flex items-center justify-between p-2 rounded bg-neutral-900 border border-white/10 mb-2">
                  <span className="text-[10px] text-neutral-300">Peak Limiter</span>
                  <input type="checkbox" defaultChecked className="accent-[#D8163F] cursor-pointer" />
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-neutral-900 border border-white/10">
                  <span className="text-[10px] text-neutral-300">Dynamic Normalization</span>
                  <input type="checkbox" defaultChecked className="accent-[#D8163F] cursor-pointer" />
                </div>
              </div>
              <button
                onClick={() => {
                  onChangeConfig({
                    ...config,
                    sensitivity: 1.4,
                    smoothing: 0.82,
                    beatThreshold: 0.20,
                  });
                }}
                className="w-full h-7 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/10 text-[10px] font-bold uppercase transition-colors"
              >
                Reset Calibration
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: Waveform Editing */}
        {activeTab === 'waveform' && (
          <div className="h-full p-4 overflow-y-auto flex flex-col justify-between space-y-3">
            <div className="flex-1 bg-neutral-950 p-3 rounded-lg border border-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                  Full Mix Waveform & Cue Points
                </span>
                <div className="flex items-center gap-2">
                  <button className="h-6 px-2 flex items-center gap-1 rounded bg-[#D8163F]/20 text-[#D8163F] border border-[#D8163F]/40 text-[10px] font-bold cursor-pointer">
                    <Plus className="w-3 h-3" />
                    <span>Add Cue at Playhead</span>
                  </button>
                  <button className="h-6 px-2 flex items-center gap-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-white/10 text-[10px] cursor-pointer">
                    <Bookmark className="w-3 h-3" />
                    <span>Export CUE</span>
                  </button>
                </div>
              </div>

              {/* Detected Cues List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {(waveformMap?.dropMarkers || [15, 30, 45, 60, 75, 90, 105]).map((time, idx) => {
                  const m = Math.floor(time / 60);
                  const s = Math.floor(time % 60);
                  const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-neutral-900/70 border border-white/5 text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-[#D8163F]/20 text-[#D8163F] font-bold text-[9px]">
                          DROP {idx + 1}
                        </span>
                        <span className="font-mono text-white font-bold">{timeStr}</span>
                        <span className="text-neutral-400 text-[10px]">Peak transient detected</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onSeek(time)}
                          className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] cursor-pointer"
                        >
                          Jump
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};

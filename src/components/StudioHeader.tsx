import React, { useRef } from 'react';
import { 
  Maximize, 
  Minimize,
  PanelBottom,
  PanelLeft,
  MonitorPlay,
  Video
} from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { Tooltip } from './common/Tooltip';

interface StudioHeaderProps {
  audioEngine: AudioEngine;
  trackName: string;
  setTrackName: (name: string) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isBottomPanelOpen: boolean;
  onToggleBottomPanel: () => void;
  isLeftPanelOpen: boolean;
  onToggleLeftPanel: () => void;
  isVisualizerSolo: boolean;
  onToggleVisualizerSolo: () => void;
  onOpenRecordModal: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  audioEngine,
  trackName,
  setTrackName,
  isFullscreen,
  onToggleFullscreen,
  isBottomPanelOpen,
  onToggleBottomPanel,
  isLeftPanelOpen,
  onToggleLeftPanel,
  isVisualizerSolo,
  onToggleVisualizerSolo,
  onOpenRecordModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentSource = audioEngine.getCurrentSource();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const name = await audioEngine.loadFile(file);
      setTrackName(name.replace(/\.[^/.]+$/, ''));
      await audioEngine.play();
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
        setTrackName('MIC / LINE-IN');
      } catch (err: any) {
        alert(err.message);
      }
    } else if (type === 'synth') {
      await audioEngine.startDemoSynth();
      setTrackName('128 BPM SYNTH');
    }
  };

  return (
    <header className="relative z-30 flex h-9 shrink-0 items-center justify-between px-3 bg-black border-b border-white/10 text-white font-ocra text-xs select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Left: Audio Source & Track Name & Export */}
      <div className="flex items-center gap-2 z-10">
        <Tooltip text="Audio Source" position="bottom">
          <select
            value={currentSource === 'file' ? 'upload' : currentSource}
            onChange={(e) => handleSourceSelect(e.target.value)}
            className="h-6 px-2 bg-neutral-900 text-white text-[11px] font-bold rounded border border-white/10 focus:border-[#D8163F] outline-none cursor-pointer"
          >
            <option value="upload">File</option>
            <option value="mic">Mic</option>
            <option value="synth">Synth</option>
          </select>
        </Tooltip>

        <span className="text-[11px] font-mono text-neutral-400 truncate max-w-[140px] sm:max-w-xs">
          {trackName}
        </span>

        <div className="h-3.5 w-px bg-white/10 mx-0.5" />

        <Tooltip text="Export Video" position="bottom">
          <button
            onClick={onOpenRecordModal}
            className="w-6 h-6 flex items-center justify-center rounded bg-neutral-900 hover:bg-neutral-800 text-[#D8163F] border border-[#D8163F]/30 cursor-pointer transition-colors"
          >
            <Video className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>

      {/* Center: Absolute Pinned Brand — NEVER moves or readjusts */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2 select-none">
        <img src="/logo-ix.svg" alt="IX" className="w-4 h-4 drop-shadow-[0_0_8px_#D8163F]" />
        <span className="font-avathe text-sm tracking-widest text-white uppercase redline-glow">
          HENRY IX
        </span>
      </div>

      {/* Right: Actions in strict order:
          1. Solo Visualiser (leftmost of the 4)
          2. Toggle Left Panel
          3. Toggle Bottom Panel
          4. Fullscreen (rightmost)
      */}
      <div className="flex items-center gap-1 z-10">
        {/* Toggle Visualiser to be fullscreen by itself */}
        <Tooltip text={isVisualizerSolo ? "Exit Solo View" : "Solo Visualiser"} position="bottom">
          <button
            onClick={onToggleVisualizerSolo}
            className={`w-6 h-6 flex items-center justify-center rounded border transition-colors cursor-pointer ${
              isVisualizerSolo
                ? 'bg-[#D8163F]/20 text-[#D8163F] border-[#D8163F]/60'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border-white/10'
            }`}
          >
            <MonitorPlay className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        {/* Toggle Left Panel */}
        <Tooltip text={isLeftPanelOpen ? "Hide Left Panel" : "Show Left Panel"} position="bottom">
          <button
            onClick={onToggleLeftPanel}
            className={`w-6 h-6 flex items-center justify-center rounded border transition-colors cursor-pointer ${
              isLeftPanelOpen && !isVisualizerSolo
                ? 'bg-[#D8163F]/20 text-[#D8163F] border-[#D8163F]/60'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border-white/10'
            }`}
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        {/* Toggle Bottom Panel */}
        <Tooltip text={isBottomPanelOpen ? "Hide Bottom Panel" : "Show Bottom Panel"} position="bottom">
          <button
            onClick={onToggleBottomPanel}
            className={`w-6 h-6 flex items-center justify-center rounded border transition-colors cursor-pointer ${
              isBottomPanelOpen && !isVisualizerSolo
                ? 'bg-[#D8163F]/20 text-[#D8163F] border-[#D8163F]/60'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border-white/10'
            }`}
          >
            <PanelBottom className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        {/* Fullscreen Icon (Rightmost) */}
        <Tooltip text={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} position="bottom">
          <button
            onClick={onToggleFullscreen}
            className={`w-6 h-6 flex items-center justify-center rounded border transition-colors cursor-pointer ${
              isFullscreen
                ? 'bg-[#D8163F]/20 text-[#D8163F] border-[#D8163F]/60'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border-white/10'
            }`}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </Tooltip>
      </div>
    </header>
  );
};

import React from 'react';
import { 
  Scissors, 
  Trash2, 
  Copy, 
  Magnet, 
  ZoomIn, 
  ZoomOut, 
  FileText, 
  Smartphone, 
  Monitor, 
  Square, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { AspectRatio } from '../../types/timeline';

interface TimelineToolbarProps {
  onSplitClip: () => void;
  onDeleteClip: () => void;
  onDuplicateClip: () => void;
  isSnapping: boolean;
  onToggleSnapping: () => void;
  zoom: number; // Pixels per second
  onZoomChange: (val: number) => void;
  aspectRatio: AspectRatio;
  onChangeAspectRatio: (ratio: AspectRatio) => void;
  onOpenTracklistModal: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  hasSelectedClip: boolean;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  onSplitClip,
  onDeleteClip,
  onDuplicateClip,
  isSnapping,
  onToggleSnapping,
  zoom,
  onZoomChange,
  aspectRatio,
  onChangeAspectRatio,
  onOpenTracklistModal,
  isCollapsed,
  onToggleCollapse,
  hasSelectedClip,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-black/95 border-b border-[#D8163F]/25 font-ocra text-xs text-neutral-300 select-none">
      {/* Left: Edit Tools */}
      <div className="flex items-center gap-2">
        {/* Split Razor Tool */}
        <button
          onClick={onSplitClip}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-white border border-white/10 hover:border-[#D8163F] transition-all cursor-pointer shadow-sm active:scale-95"
          title="Split Clip at Playhead (Shortcut: S or Cmd+B)"
        >
          <Scissors className="w-3.5 h-3.5 text-[#D8163F]" />
          <span className="font-bold">SPLIT (S)</span>
        </button>

        {/* Duplicate Clip */}
        <button
          onClick={onDuplicateClip}
          disabled={!hasSelectedClip}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-all ${
            hasSelectedClip
              ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-white/10 cursor-pointer'
              : 'bg-neutral-950 text-neutral-600 border-white/5 cursor-not-allowed'
          }`}
          title="Duplicate Selected Clip"
        >
          <Copy className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">DUPLICATE</span>
        </button>

        {/* Delete Clip */}
        <button
          onClick={onDeleteClip}
          disabled={!hasSelectedClip}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-all ${
            hasSelectedClip
              ? 'bg-neutral-900 hover:bg-red-950/40 text-red-400 border-red-500/30 cursor-pointer'
              : 'bg-neutral-950 text-neutral-600 border-white/5 cursor-not-allowed'
          }`}
          title="Delete Selected Clip (Backspace / Delete)"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">DELETE</span>
        </button>

        {/* Snap to Beat Drops */}
        <button
          onClick={onToggleSnapping}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded border transition-all cursor-pointer ${
            isSnapping
              ? 'bg-[#D8163F]/20 text-[#D8163F] border-[#D8163F] shadow-sm shadow-[#D8163F]/40'
              : 'bg-neutral-900 text-neutral-400 border-white/10 hover:text-white'
          }`}
          title="Snap Cuts to Detected Beat Drops & Downbeats"
        >
          <Magnet className="w-3.5 h-3.5" />
          <span className="hidden md:inline">SNAP DROPS</span>
        </button>

        {/* Auto Tracklist Import */}
        <button
          onClick={onOpenTracklistModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-[#E5A93C] border border-[#E5A93C]/30 hover:border-[#E5A93C] transition-all cursor-pointer"
          title="Paste Tracklist / CUE File to Auto-Slice Timeline"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="font-bold">AUTO-SPLIT TRACKLIST</span>
        </button>
      </div>

      {/* Right: Aspect Ratio, Zoom & Collapse */}
      <div className="flex items-center gap-3">
        {/* Aspect Ratio Selector */}
        <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded border border-white/10">
          <button
            onClick={() => onChangeAspectRatio('16:9')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
              aspectRatio === '16:9'
                ? 'bg-[#D8163F] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="16:9 Widescreen (YouTube, Twitch, Club Screens)"
          >
            <Monitor className="w-3 h-3" />
            <span>16:9</span>
          </button>

          <button
            onClick={() => onChangeAspectRatio('9:16')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
              aspectRatio === '9:16'
                ? 'bg-[#D8163F] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="9:16 Vertical (Instagram Reels, TikTok, YouTube Shorts)"
          >
            <Smartphone className="w-3 h-3" />
            <span>9:16</span>
          </button>

          <button
            onClick={() => onChangeAspectRatio('1:1')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
              aspectRatio === '1:1'
                ? 'bg-[#D8163F] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="1:1 Square (Feed & Artwork)"
          >
            <Square className="w-3 h-3" />
            <span>1:1</span>
          </button>
        </div>

        {/* Zoom Slider */}
        <div className="hidden lg:flex items-center gap-2">
          <button onClick={() => onZoomChange(Math.max(2, zoom * 0.7))} className="text-neutral-400 hover:text-white p-1">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min={2}
            max={80}
            step={2}
            value={zoom}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className="w-20 h-1 bg-neutral-800 appearance-none cursor-pointer accent-[#D8163F]"
            title="Timeline Zoom Level"
          />
          <button onClick={() => onZoomChange(Math.min(80, zoom * 1.3))} className="text-neutral-400 hover:text-white p-1">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Collapse / Expand Toggle */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-white/10 cursor-pointer"
          title={isCollapsed ? 'Expand Timeline Editor' : 'Collapse Timeline'}
        >
          {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

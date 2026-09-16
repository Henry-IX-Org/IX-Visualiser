import React from 'react';
import { 
  Scissors, 
  Trash2, 
  Copy, 
  Magnet, 
  ZoomIn, 
  ZoomOut, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Maximize2
} from 'lucide-react';
import { AspectRatio } from '../../types/timeline';

interface TimelineToolbarProps {
  onSplitClip: () => void;
  onDeleteClip: () => void;
  onDuplicateClip: () => void;
  isSnapping: boolean;
  onToggleSnapping: () => void;
  zoom: number;
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
    <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-950 border-b border-white/10 font-ocra text-[11px] text-neutral-300 select-none">
      {/* Left: Professional Edit & Selection Tools */}
      <div className="flex items-center gap-1.5">
        {/* Split Razor Tool */}
        <button
          onClick={onSplitClip}
          className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-white border border-white/10 hover:border-[#D8163F] transition-colors cursor-pointer active:scale-95"
          title="Razor Split at Playhead (Shortcut: S or Cmd+B)"
        >
          <Scissors className="w-3 h-3 text-[#D8163F]" />
          <span className="font-semibold">Split</span>
          <span className="text-[9px] text-neutral-500 ml-0.5">S</span>
        </button>

        {/* Duplicate Clip */}
        <button
          onClick={onDuplicateClip}
          disabled={!hasSelectedClip}
          className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
            hasSelectedClip
              ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-white/10 cursor-pointer'
              : 'bg-neutral-950 text-neutral-600 border-transparent cursor-not-allowed'
          }`}
          title="Duplicate selected clip"
        >
          <Copy className="w-3 h-3" />
          <span>Duplicate</span>
        </button>

        {/* Delete Clip */}
        <button
          onClick={onDeleteClip}
          disabled={!hasSelectedClip}
          className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
            hasSelectedClip
              ? 'bg-neutral-900 hover:bg-red-950/40 text-red-400 border-red-500/30 cursor-pointer'
              : 'bg-neutral-950 text-neutral-600 border-transparent cursor-not-allowed'
          }`}
          title="Delete selected clip (Backspace / Delete)"
        >
          <Trash2 className="w-3 h-3" />
          <span>Delete</span>
        </button>

        <div className="h-3.5 w-px bg-white/10 mx-1" />

        {/* Snap to Drops Toggle */}
        <button
          onClick={onToggleSnapping}
          className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors cursor-pointer ${
            isSnapping
              ? 'bg-[#D8163F]/20 text-[#D8163F] border-[#D8163F]/50 shadow-sm'
              : 'bg-neutral-900 text-neutral-400 border-white/10 hover:text-white'
          }`}
          title="Toggle snap cuts to audio drop markers"
        >
          <Magnet className="w-3 h-3" />
          <span>Snap Drops</span>
        </button>

        {/* Tracklist Import Menu Button */}
        <button
          onClick={onOpenTracklistModal}
          className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-white/10 hover:border-[#E5A93C]/50 transition-colors cursor-pointer"
          title="Import Tracklist or Serato/Rekordbox .CUE file"
        >
          <FileText className="w-3 h-3 text-[#E5A93C]" />
          <span>Tracklist Import...</span>
        </button>
      </div>

      {/* Right: Aspect Ratio Dropdown, Zoom & Collapse */}
      <div className="flex items-center gap-3">
        {/* Precision Aspect Ratio Dropdown Menu */}
        <div className="flex items-center gap-1.5 bg-neutral-900 px-2 py-0.5 rounded border border-white/10">
          <span className="text-[10px] text-neutral-400 font-semibold uppercase">Aspect:</span>
          <select
            value={aspectRatio}
            onChange={(e) => onChangeAspectRatio(e.target.value as AspectRatio)}
            className="bg-transparent text-white text-[11px] font-bold focus:outline-none cursor-pointer pr-1"
          >
            <option value="16:9" className="bg-neutral-900 text-white">16:9 Widescreen (1920×1080)</option>
            <option value="9:16" className="bg-neutral-900 text-white">9:16 Vertical (1080×1920)</option>
            <option value="1:1" className="bg-neutral-900 text-white">1:1 Square (1080×1080)</option>
          </select>
        </div>

        {/* Zoom Stepper / Slider */}
        <div className="flex items-center gap-1 text-neutral-400">
          <button
            onClick={() => onZoomChange(Math.max(2, zoom * 0.75))}
            className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <input
            type="range"
            min={2}
            max={80}
            step={2}
            value={zoom}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className="w-16 h-1 bg-neutral-800 appearance-none cursor-pointer accent-[#D8163F]"
            title="Timeline Zoom"
          />
          <button
            onClick={() => onZoomChange(Math.min(80, zoom * 1.3))}
            className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        {/* Collapse / Expand Toggle */}
        <button
          onClick={onToggleCollapse}
          className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Timeline' : 'Collapse Timeline'}
        >
          {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

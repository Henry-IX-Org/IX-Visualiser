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
  ChevronUp
} from 'lucide-react';
import { AspectRatio } from '../../types/timeline';
import { Tooltip } from '../common/Tooltip';

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
    <div className="flex items-center justify-between px-2.5 py-1 bg-neutral-950 border-b border-white/10 font-ocra text-xs text-neutral-300 select-none">
      {/* Left: Tools */}
      <div className="flex items-center gap-1">
        <Tooltip text="Split (S)" position="top">
          <button
            onClick={onSplitClip}
            className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-white border border-white/10 hover:border-[#D8163F] cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5 text-[#D8163F]" />
          </button>
        </Tooltip>

        <Tooltip text="Duplicate" position="top">
          <button
            onClick={onDuplicateClip}
            disabled={!hasSelectedClip}
            className={`p-1.5 rounded border transition-colors ${
              hasSelectedClip
                ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-white/10 cursor-pointer'
                : 'bg-neutral-950 text-neutral-600 border-transparent cursor-not-allowed'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <Tooltip text="Delete" position="top">
          <button
            onClick={onDeleteClip}
            disabled={!hasSelectedClip}
            className={`p-1.5 rounded border transition-colors ${
              hasSelectedClip
                ? 'bg-neutral-900 hover:bg-red-950/40 text-red-400 border-red-500/30 cursor-pointer'
                : 'bg-neutral-950 text-neutral-600 border-transparent cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <div className="h-3 w-px bg-white/10 mx-1" />

        <Tooltip text="Snap Drops" position="top">
          <button
            onClick={onToggleSnapping}
            className={`p-1.5 rounded border transition-colors cursor-pointer ${
              isSnapping
                ? 'bg-[#D8163F]/20 text-[#D8163F] border-[#D8163F]/50 shadow-sm'
                : 'bg-neutral-900 text-neutral-400 border-white/10 hover:text-white'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <Tooltip text="Tracklist" position="top">
          <button
            onClick={onOpenTracklistModal}
            className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-white/10 hover:border-[#E5A93C]/50 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#E5A93C]" />
          </button>
        </Tooltip>
      </div>

      {/* Right: Aspect Ratio & Zoom */}
      <div className="flex items-center gap-2">
        <Tooltip text="Aspect Ratio" position="top">
          <select
            value={aspectRatio}
            onChange={(e) => onChangeAspectRatio(e.target.value as AspectRatio)}
            className="bg-neutral-900 text-white text-[11px] font-bold px-2 py-1 rounded border border-white/10 focus:outline-none cursor-pointer"
          >
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="1:1">1:1</option>
          </select>
        </Tooltip>

        <div className="flex items-center gap-0.5 text-neutral-400">
          <Tooltip text="Zoom Out" position="top">
            <button
              onClick={() => onZoomChange(Math.max(2, zoom * 0.75))}
              className="p-1 hover:text-white rounded hover:bg-neutral-800 cursor-pointer"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
          </Tooltip>

          <input
            type="range"
            min={2}
            max={80}
            step={2}
            value={zoom}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className="w-14 h-1 bg-neutral-800 appearance-none cursor-pointer accent-[#D8163F]"
          />

          <Tooltip text="Zoom In" position="top">
            <button
              onClick={() => onZoomChange(Math.min(80, zoom * 1.3))}
              className="p-1 hover:text-white rounded hover:bg-neutral-800 cursor-pointer"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </Tooltip>
        </div>

        <Tooltip text={isCollapsed ? "Expand" : "Collapse"} position="top">
          <button
            onClick={onToggleCollapse}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 cursor-pointer"
          >
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

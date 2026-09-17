import React from 'react';
import { TimelineTrack, TimelineClip, EQTarget, TransitionType } from '../../types/timeline';
import { Sparkles, Layers, Type, Flame, ChevronRight } from 'lucide-react';

interface TimelineTrackRowProps {
  track: TimelineTrack;
  clips: TimelineClip[];
  selectedClipId: string | null;
  onSelectClip: (clip: TimelineClip) => void;
  onUpdateClip: (clip: TimelineClip) => void;
  zoom: number; // Pixels per second
  currentTime: number;
}

export const TimelineTrackRow: React.FC<TimelineTrackRowProps> = ({
  track,
  clips,
  selectedClipId,
  onSelectClip,
  onUpdateClip,
  zoom,
  currentTime,
}) => {
  const trackClips = clips.filter((c) => c.trackId === track.id);

  const getTrackIcon = () => {
    switch (track.type) {
      case 'base': return <Flame className="w-3.5 h-3.5 text-[#D8163F]" />;
      case 'overlay': return <Layers className="w-3.5 h-3.5 text-[#E5A93C]" />;
      case 'branding': return <Type className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const handleDragTrim = (
    e: React.MouseEvent,
    clip: TimelineClip,
    edge: 'start' | 'end'
  ) => {
    e.stopPropagation();
    const startX = e.clientX;
    const origStart = clip.startTime;
    const origEnd = clip.endTime;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaSeconds = (moveEvent.clientX - startX) / zoom;
      if (edge === 'start') {
        const newStart = Math.max(0, Math.min(origEnd - 1, origStart + deltaSeconds));
        onUpdateClip({ ...clip, startTime: newStart });
      } else {
        const newEnd = Math.max(origStart + 1, origEnd + deltaSeconds);
        onUpdateClip({ ...clip, endTime: newEnd });
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="relative flex h-11 border-b border-white/5 bg-neutral-950/60 font-ocra text-xs select-none">
      {/* Track Header (Sticky Left: exactly 160px / w-40) */}
      <div className="sticky left-0 z-20 w-40 h-full bg-neutral-900 border-r border-white/10 px-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2 truncate">
          {getTrackIcon()}
          <span className="font-bold text-neutral-200 text-[10px] tracking-wider truncate uppercase">{track.name}</span>
        </div>
        <span className="text-[8px] text-neutral-500 font-mono">T{track.id}</span>
      </div>

      {/* Clip Lane */}
      <div className="relative flex-1 h-full">
        {trackClips.map((clip) => {
          const isSelected = selectedClipId === clip.id;
          const leftPx = clip.startTime * zoom;
          const widthPx = Math.max(20, (clip.endTime - clip.startTime) * zoom);
          const isCurrent = currentTime >= clip.startTime && currentTime <= clip.endTime;

          // Color accents based on track type
          const borderClass = isSelected
            ? 'border-2 border-[#D8163F] shadow-lg shadow-[#D8163F]/40'
            : isCurrent
            ? 'border border-[#D8163F]/70'
            : 'border border-white/10 hover:border-white/20';

          const bgClass = {
            base: 'bg-[#D8163F]/20',
            overlay: 'bg-[#E5A93C]/20',
            branding: 'bg-cyan-950/40',
          }[track.type];

          return (
            <div
              key={clip.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectClip(clip);
              }}
              style={{
                left: `${leftPx}px`,
                width: `${widthPx}px`,
              }}
              className={`absolute top-1 bottom-1 rounded overflow-hidden flex items-center justify-between px-2 cursor-pointer transition-all ${borderClass} ${bgClass}`}
            >
              {/* Left Trim Handle */}
              <div
                onMouseDown={(e) => handleDragTrim(e, clip, 'start')}
                className="absolute left-0 top-0 bottom-0 w-1.5 hover:w-2 bg-white/20 hover:bg-[#D8163F] cursor-ew-resize transition-all"
                title="Drag to trim start"
              />

              {/* Clip Content Label */}
              <div className="flex items-center gap-1.5 truncate pl-1">
                <span className="font-ocra text-[10px] font-bold text-white tracking-wider truncate uppercase">
                  {clip.titleCard || clip.visualMode}
                </span>

                {/* EQ Target Badge */}
                {track.type === 'overlay' && (
                  <span className="text-[7px] px-1 py-0.5 rounded bg-black/70 text-[#E5A93C] font-bold uppercase">
                    {clip.eqTarget}
                  </span>
                )}

                {/* Transition In Badge */}
                {clip.transitionIn !== 'cut' && (
                  <span className="text-[7px] px-1 py-0.5 rounded bg-[#D8163F]/40 text-white uppercase flex items-center">
                    <ChevronRight className="w-2 h-2" />
                    {clip.transitionIn}
                  </span>
                )}
              </div>

              {/* Right Trim Handle */}
              <div
                onMouseDown={(e) => handleDragTrim(e, clip, 'end')}
                className="absolute right-0 top-0 bottom-0 w-1.5 hover:w-2 bg-white/20 hover:bg-[#D8163F] cursor-ew-resize transition-all"
                title="Drag to trim end"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

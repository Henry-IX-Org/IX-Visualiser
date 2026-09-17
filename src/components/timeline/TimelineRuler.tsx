import React, { useRef } from 'react';
import { AudioWaveformMap } from '../../types/timeline';

interface TimelineRulerProps {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  zoom: number; // Pixels per second
  waveformMap: AudioWaveformMap | null;
  scrollLeft: number;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  duration,
  currentTime,
  onSeek,
  zoom,
  waveformMap,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const totalWidth = Math.max(1200, duration * zoom);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const ruler = rulerRef.current;
    if (!ruler) return;

    ruler.setPointerCapture(e.pointerId);

    const updateTimeFromPointer = (clientX: number) => {
      const rect = ruler.getBoundingClientRect();
      // Account for the 160px sticky track header spacer
      const trackAreaLeft = rect.left + 160;
      const clickX = clientX - trackAreaLeft;
      const targetTime = Math.max(0, Math.min(duration, clickX / zoom));
      onSeek(targetTime);
    };

    updateTimeFromPointer(e.clientX);

    const handlePointerMove = (ev: PointerEvent) => {
      updateTimeFromPointer(ev.clientX);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Format time markings
  const formatMarkTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Determine tick interval based on zoom level
  let tickInterval = 60; // default 1 min
  if (zoom > 20) tickInterval = 5;
  else if (zoom > 10) tickInterval = 15;
  else if (zoom > 4) tickInterval = 30;
  else if (zoom < 1.5) tickInterval = 300; // 5 mins

  const numTicks = Math.ceil(duration / tickInterval);
  const ticks = Array.from({ length: numTicks + 1 }, (_, i) => i * tickInterval);

  return (
    <div
      ref={rulerRef}
      onPointerDown={handlePointerDown}
      style={{ width: `${totalWidth + 160}px` }}
      className="relative flex h-10 bg-neutral-950 border-b border-white/10 cursor-pointer select-none font-ocra text-[9px] text-neutral-400"
    >
      {/* Sticky Left Corner Header (160px / w-40, matching Track Rows exactly) */}
      <div className="sticky left-0 z-20 w-40 h-full bg-neutral-900 border-r border-white/10 px-3 flex items-center justify-between shadow-md select-none pointer-events-none">
        <span className="text-[10px] font-bold text-neutral-300 tracking-wider uppercase">TRACKS</span>
        <span className="text-[8px] font-mono text-neutral-500 uppercase">TIME</span>
      </div>

      {/* Waveform & Ruler Lane */}
      <div className="relative h-full" style={{ width: `${totalWidth}px` }}>
        {/* 2-Hour Waveform Map Background */}
        {waveformMap && waveformMap.peaks.length > 0 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
            preserveAspectRatio="none"
            viewBox={`0 0 ${waveformMap.peaks.length} 100`}
          >
            {/* Waveform Bars */}
            {waveformMap.peaks.map((p, i) => {
              const h = p * 42;
              const isKick = waveformMap.kickTransients[i] > 0.4;
              return (
                <rect
                  key={i}
                  x={i}
                  y={50 - h}
                  width={1}
                  height={h * 2}
                  fill={isKick ? '#D8163F' : '#E5A93C'}
                />
              );
            })}
          </svg>
        )}

        {/* Beat Drop Marker Flags */}
        {waveformMap?.dropMarkers.map((dropTime, idx) => (
          <div
            key={idx}
            style={{ left: `${dropTime * zoom}px` }}
            className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center"
          >
            <div className="bg-[#D8163F] text-white text-[7px] font-bold px-1 py-0.5 rounded-sm shadow-sm transform -translate-x-1/2">
              DROP
            </div>
            <div className="w-px h-full bg-[#D8163F]/70" />
          </div>
        ))}

        {/* Time ticks */}
        {ticks.map((t) => (
          <div
            key={t}
            style={{ left: `${t * zoom}px` }}
            className="absolute top-0 bottom-0 pointer-events-none border-l border-white/10 flex flex-col justify-between pl-1 pb-1"
          >
            <span className="text-[8px]">{formatMarkTime(t)}</span>
            <div className="w-0.5 h-1 bg-white/20" />
          </div>
        ))}

        {/* Playhead Redline */}
        <div
          style={{ left: `${currentTime * zoom}px` }}
          className="absolute top-0 bottom-0 pointer-events-none z-30 transform -translate-x-1/2 flex flex-col items-center"
        >
          <div className="w-2.5 h-2.5 bg-[#D8163F] rotate-45 transform -translate-y-1/2 shadow-lg shadow-[#D8163F]" />
          <div className="w-0.5 h-full bg-[#D8163F] shadow-lg shadow-[#D8163F]" />
        </div>
      </div>
    </div>
  );
};

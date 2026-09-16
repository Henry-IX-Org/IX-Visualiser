import React, { useState, useRef } from 'react';
import { 
  TimelineTrack, 
  TimelineClip, 
  AspectRatio, 
  AudioWaveformMap, 
  TracklistEntry 
} from '../../types/timeline';
import { TimelineToolbar } from './TimelineToolbar';
import { TimelineRuler } from './TimelineRuler';
import { TimelineTrackRow } from './TimelineTrackRow';
import { TracklistImportModal } from './TracklistImportModal';
import { DEFAULT_PRESETS } from '../../presets/defaultPresets';
import { Tooltip } from '../common/Tooltip';

interface TimelineContainerProps {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  onUpdateClips: (clips: TimelineClip[]) => void;
  selectedClip: TimelineClip | null;
  onSelectClip: (clip: TimelineClip | null) => void;
  aspectRatio: AspectRatio;
  onChangeAspectRatio: (ratio: AspectRatio) => void;
  waveformMap: AudioWaveformMap | null;
}

export const TimelineContainer: React.FC<TimelineContainerProps> = ({
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
}) => {
  const [zoom, setZoom] = useState(12); // pixels per second
  const [isSnapping, setIsSnapping] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isTracklistModalOpen, setIsTracklistModalOpen] = useState(false);
  const [scrollLeft, setScrollLeft] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  // --- Razor Split Tool (Shortcut S / Cmd+B) ---
  const handleSplitClip = () => {
    let splitTime = currentTime;

    // If snapping is enabled and a drop marker is within 1.5 seconds, snap to it
    if (isSnapping && waveformMap?.dropMarkers) {
      const nearestDrop = waveformMap.dropMarkers.find(
        (m) => Math.abs(m - currentTime) < 1.5
      );
      if (nearestDrop !== undefined) {
        splitTime = nearestDrop;
      }
    }

    // Find clips that intersect splitTime
    const targetClips = selectedClip 
      ? [selectedClip]
      : clips.filter((c) => c.startTime < splitTime && c.endTime > splitTime);

    if (targetClips.length === 0) return;

    let updatedClips = [...clips];

    targetClips.forEach((target) => {
      if (target.startTime >= splitTime || target.endTime <= splitTime) return;

      const clipA: TimelineClip = {
        ...target,
        endTime: splitTime,
      };

      const clipB: TimelineClip = {
        ...target,
        id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        startTime: splitTime,
      };

      updatedClips = updatedClips.filter((c) => c.id !== target.id).concat([clipA, clipB]);
    });

    onUpdateClips(updatedClips);
  };

  // Delete selected clip
  const handleDeleteClip = () => {
    if (!selectedClip) return;
    onUpdateClips(clips.filter((c) => c.id !== selectedClip.id));
    onSelectClip(null);
  };

  // Duplicate selected clip
  const handleDuplicateClip = () => {
    if (!selectedClip) return;
    const durationClip = selectedClip.endTime - selectedClip.startTime;
    const newClip: TimelineClip = {
      ...selectedClip,
      id: `clip-${Date.now()}`,
      startTime: selectedClip.endTime,
      endTime: selectedClip.endTime + durationClip,
    };
    onUpdateClips([...clips, newClip]);
  };

  // Update single clip
  const handleUpdateSingleClip = (updated: TimelineClip) => {
    onUpdateClips(clips.map((c) => (c.id === updated.id ? updated : c)));
  };

  // Auto-slice timeline from imported tracklist
  const handleApplyTracklist = (entries: TracklistEntry[]) => {
    if (entries.length === 0) return;

    const newClips: TimelineClip[] = [];
    const basePresets = DEFAULT_PRESETS;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const nextTime = i < entries.length - 1 ? entries[i + 1].timestampSeconds : duration || 7200;
      const presetIdx = i % basePresets.length;
      const chosenPreset = basePresets[presetIdx];

      // Track 1: Base Scene Clip
      newClips.push({
        id: `clip-t1-${i}`,
        trackId: 1,
        startTime: entry.timestampSeconds,
        endTime: nextTime,
        visualMode: chosenPreset.config.mode,
        config: chosenPreset.config,
        titleCard: entry.title,
        artistName: entry.artist,
        eqTarget: 'master',
        transitionIn: i === 0 ? 'cut' : 'strobe-drop',
        transitionDuration: 0.5,
      });

      // Track 3: Now Playing Title Card (shows for 15s at each track start)
      newClips.push({
        id: `clip-t3-${i}`,
        trackId: 3,
        startTime: entry.timestampSeconds,
        endTime: Math.min(nextTime, entry.timestampSeconds + 15),
        visualMode: 'radial-spectrum',
        config: chosenPreset.config,
        titleCard: entry.title,
        artistName: entry.artist,
        eqTarget: 'mids',
        transitionIn: 'crossfade',
        transitionDuration: 0.5,
      });
    }

    onUpdateClips(newClips);
  };

  if (isCollapsed) {
    return (
      <div className="absolute bottom-0 left-0 right-0 z-30 flex justify-center">
        <Tooltip text="Open DAW timeline" position="top">
          <button
            onClick={() => setIsCollapsed(false)}
            className="px-3 py-1 bg-black/90 hover:bg-neutral-900 border-t border-x border-[#D8163F]/40 rounded-t-lg font-ocra text-xs text-[#D8163F] font-bold tracking-wider cursor-pointer shadow-2xl flex items-center gap-1.5"
          >
            <span>▲ Timeline</span>
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <section className="absolute bottom-0 left-0 right-0 z-30 flex flex-col bg-black/95 border-t border-[#D8163F]/30 shadow-2xl transition-all duration-300">
      {/* Toolbar */}
      <TimelineToolbar
        onSplitClip={handleSplitClip}
        onDeleteClip={handleDeleteClip}
        onDuplicateClip={handleDuplicateClip}
        isSnapping={isSnapping}
        onToggleSnapping={() => setIsSnapping(!isSnapping)}
        zoom={zoom}
        onZoomChange={setZoom}
        aspectRatio={aspectRatio}
        onChangeAspectRatio={onChangeAspectRatio}
        onOpenTracklistModal={() => setIsTracklistModalOpen(true)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(true)}
        hasSelectedClip={!!selectedClip}
      />

      {/* Scrollable Timeline Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="w-full overflow-x-auto overflow-y-hidden max-h-56 bg-neutral-950/90"
      >
        {/* Ruler with 2-hour waveform */}
        <TimelineRuler
          duration={duration}
          currentTime={currentTime}
          onSeek={onSeek}
          zoom={zoom}
          waveformMap={waveformMap}
          scrollLeft={scrollLeft}
        />

        {/* Tracks */}
        <div className="flex flex-col" style={{ width: `${Math.max(1200, duration * zoom)}px` }}>
          {tracks.map((track) => (
            <TimelineTrackRow
              key={track.id}
              track={track}
              clips={clips}
              selectedClipId={selectedClip?.id || null}
              onSelectClip={onSelectClip}
              onUpdateClip={handleUpdateSingleClip}
              zoom={zoom}
              currentTime={currentTime}
            />
          ))}
        </div>
      </div>

      {/* Tracklist Import Modal */}
      <TracklistImportModal
        isOpen={isTracklistModalOpen}
        onClose={() => setIsTracklistModalOpen(false)}
        onApplyTracklist={handleApplyTracklist}
      />
    </section>
  );
};

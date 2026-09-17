import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AudioEngine } from './audio/AudioEngine';
import { AudioScanner } from './audio/AudioScanner';
import { StudioHeader } from './components/StudioHeader';
import { LeftPanel } from './components/LeftPanel';
import { CenterStage } from './components/CenterStage';
import { BottomPanel } from './components/BottomPanel';
import { VideoRecorderModal } from './components/VideoRecorderModal';
import { VisualizerConfig, DJBranding } from './types/visualizer';
import { TimelineTrack, TimelineClip, AspectRatio, AudioWaveformMap } from './types/timeline';
import { DEFAULT_PRESETS } from './presets/defaultPresets';

export const App: React.FC = () => {
  const audioEngine = useMemo(() => new AudioEngine(), []);

  // Global & Clip Visualizer Config
  const [config, setConfig] = useState<VisualizerConfig>(() => {
    const saved = localStorage.getItem('henry_ix_viz_config');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DEFAULT_PRESETS[0].config;
  });

  // DJ Branding State
  const [branding, setBranding] = useState<DJBranding>(() => {
    const saved = localStorage.getItem('henry_ix_viz_branding');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      enabled: true,
      djName: 'HENRY IX',
      mixTitle: 'LONDON SESSIONS • VOL. 09',
      logoUrl: '/logo-ix.svg',
      showBpm: true,
      position: 'bottom-left',
    };
  });

  // Timeline State
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120);
  const [waveformMap, setWaveformMap] = useState<AudioWaveformMap | null>(() =>
    AudioScanner.generateFallbackMap(120)
  );

  const [tracks] = useState<TimelineTrack[]>([
    { id: 1, name: 'Base Scene', type: 'base', muted: false, locked: false, color: '#D8163F' },
    { id: 2, name: 'Overlays & FX', type: 'overlay', muted: false, locked: false, color: '#E5A93C' },
    { id: 3, name: 'Titles & Branding', type: 'branding', muted: false, locked: false, color: '#00F0FF' },
  ]);

  const [clips, setClips] = useState<TimelineClip[]>(() => [
    {
      id: 'clip-base-1',
      trackId: 1,
      startTime: 0,
      endTime: 60,
      visualMode: 'radial-spectrum',
      config: DEFAULT_PRESETS[0].config,
      titleCard: '01. HENRYIX - WOST - APRICOT',
      artistName: 'HENRY IX',
      eqTarget: 'master',
      transitionIn: 'cut',
      transitionDuration: 0.5,
    },
    {
      id: 'clip-base-2',
      trackId: 1,
      startTime: 60,
      endTime: 120,
      visualMode: 'cyber-tunnel',
      config: DEFAULT_PRESETS[1].config,
      titleCard: '02. HENRYIX - MILKSHAKE (WATTO EDIT)',
      artistName: 'HENRY IX',
      eqTarget: 'sub',
      transitionIn: 'strobe-drop',
      transitionDuration: 0.5,
    },
    {
      id: 'clip-branding-1',
      trackId: 3,
      startTime: 0,
      endTime: 18,
      visualMode: 'radial-spectrum',
      config: DEFAULT_PRESETS[0].config,
      titleCard: 'HENRYIX - WOST - APRICOT',
      artistName: 'HENRY IX',
      eqTarget: 'mids',
      transitionIn: 'crossfade',
      transitionDuration: 0.5,
    },
    {
      id: 'clip-branding-2',
      trackId: 3,
      startTime: 60,
      endTime: 78,
      visualMode: 'radial-spectrum',
      config: DEFAULT_PRESETS[1].config,
      titleCard: 'HENRYIX - MILKSHAKE (WATTO EDIT)',
      artistName: 'HENRY IX',
      eqTarget: 'mids',
      transitionIn: 'crossfade',
      transitionDuration: 0.5,
    },
  ]);

  const [selectedClip, setSelectedClip] = useState<TimelineClip | null>(null);

  // Layout & Panel State
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  const [isVisualizerSolo, setIsVisualizerSolo] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [trackName, setTrackName] = useState('HENRY IX • 128 BPM TECHNO TEST');
  const [activeCanvas, setActiveCanvas] = useState<HTMLCanvasElement | null>(null);

  const [showControls, setShowControls] = useState(true);
  const hideControlsTimerRef = useRef<number | null>(null);

  // Synchronize audio playback timer with timeline currentTime
  useEffect(() => {
    const timer = setInterval(() => {
      if (audioEngine.getIsPlaying()) {
        const t = audioEngine.getCurrentTime();
        setCurrentTime(t);
      }
      const dur = audioEngine.getDuration();
      if (dur > 0 && dur !== duration) {
        setDuration(dur);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [audioEngine, duration]);

  // Handle timeline seek
  const handleTimelineSeek = (targetTime: number) => {
    audioEngine.seek(targetTime);
    setCurrentTime(targetTime);
  };

  // Find active base clip at currentTime
  const activeBaseClip = useMemo(() => {
    return clips.find(
      (c) => c.trackId === 1 && currentTime >= c.startTime && currentTime <= c.endTime
    ) || clips.find((c) => c.trackId === 1) || null;
  }, [clips, currentTime]);

  // Synchronize selected clip with LeftPanel
  const handleConfigChange = (newConfig: VisualizerConfig) => {
    setConfig(newConfig);
    if (selectedClip) {
      setClips((prev) =>
        prev.map((c) => (c.id === selectedClip.id ? { ...c, config: newConfig, visualMode: newConfig.mode } : c))
      );
    }
  };

  useEffect(() => {
    audioEngine.setSensitivity(config.sensitivity);
    audioEngine.setSmoothing(config.smoothing);
    audioEngine.setBeatThreshold(config.beatThreshold);
    localStorage.setItem('henry_ix_viz_config', JSON.stringify(config));
  }, [config, audioEngine]);

  useEffect(() => {
    localStorage.setItem('henry_ix_viz_branding', JSON.stringify(branding));
  }, [branding]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    if (isFullscreen) {
      hideControlsTimerRef.current = window.setTimeout(() => setShowControls(false), 3500);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (audioEngine.getIsPlaying()) {
          audioEngine.pause();
        } else {
          audioEngine.play();
        }
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyB') {
        e.preventDefault();
        setIsBottomPanelOpen((prev) => !prev);
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        setIsLeftPanelOpen((prev) => !prev);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        setIsVisualizerSolo((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audioEngine]);

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen overflow-hidden bg-black text-white select-none flex flex-col justify-between"
    >
      {/* Subtle Bayer Dither Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 bayer-dither opacity-50" />

      {/* Slim Header: Centered HENRY IX Brand + 4 Right-Corner Toggles */}
      <div className={`transition-opacity duration-300 ${!showControls && isFullscreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <StudioHeader
          audioEngine={audioEngine}
          trackName={trackName}
          setTrackName={setTrackName}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          isBottomPanelOpen={isBottomPanelOpen}
          onToggleBottomPanel={() => setIsBottomPanelOpen((prev) => !prev)}
          isLeftPanelOpen={isLeftPanelOpen}
          onToggleLeftPanel={() => setIsLeftPanelOpen((prev) => !prev)}
          isVisualizerSolo={isVisualizerSolo}
          onToggleVisualizerSolo={() => setIsVisualizerSolo((prev) => !prev)}
          onOpenRecordModal={() => setIsRecordModalOpen(true)}
        />
      </div>

      {/* Middle Area: Left Customization Panel + Center Stage */}
      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        {/* Left Panel: Notion/Antigravity proportion, ends at top of bottom panel */}
        {isLeftPanelOpen && !isVisualizerSolo && (
          <LeftPanel
            config={config}
            onChangeConfig={handleConfigChange}
            branding={branding}
            onChangeBranding={setBranding}
            aspectRatio={aspectRatio}
            onChangeAspectRatio={setAspectRatio}
          />
        )}

        {/* Center Stage: Framed Visualiser Canvas + Docked Audio Transport Bar */}
        <CenterStage
          audioEngine={audioEngine}
          config={config}
          aspectRatio={aspectRatio}
          activeClip={activeBaseClip}
          onCanvasReady={setActiveCanvas}
          branding={branding}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleTimelineSeek}
        />
      </div>

      {/* Bottom Panel: Full Width (~33vh), Takes Priority, Pushes Left Panel Up */}
      {isBottomPanelOpen && !isVisualizerSolo && (
        <BottomPanel
          duration={duration}
          currentTime={currentTime}
          onSeek={handleTimelineSeek}
          tracks={tracks}
          clips={clips}
          onUpdateClips={setClips}
          selectedClip={selectedClip}
          onSelectClip={(c) => {
            setSelectedClip(c);
            if (c) setConfig(c.config);
          }}
          aspectRatio={aspectRatio}
          onChangeAspectRatio={setAspectRatio}
          waveformMap={waveformMap}
          config={config}
          onChangeConfig={handleConfigChange}
          audioEngine={audioEngine}
        />
      )}

      {/* Video Recorder / Hardware Export Modal */}
      <VideoRecorderModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        canvas={activeCanvas}
        audioEngine={audioEngine}
        trackTitle={trackName}
        duration={duration}
        clips={clips}
        aspectRatio={aspectRatio}
        waveformMap={waveformMap}
      />
    </div>
  );
};

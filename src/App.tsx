import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AudioEngine } from './audio/AudioEngine';
import { AudioScanner } from './audio/AudioScanner';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { StudioHeader } from './components/StudioHeader';
import { ControlsDrawer } from './components/ControlsDrawer';
import { DJBrandingOverlay } from './components/DJBrandingOverlay';
import { VideoRecorderModal } from './components/VideoRecorderModal';
import { TimelineContainer } from './components/timeline/TimelineContainer';
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

  // UI state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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

  // Synchronize selected clip with ControlsDrawer
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

  // Handle Track Audio Load & Scan
  const handleAudioUpload = async (file: File) => {
    const name = await audioEngine.loadFile(file);
    setTrackName(name.replace(/\.[^/.]+$/, ''));

    // Scan waveform in background
    AudioScanner.scanFile(file).then((map) => {
      setWaveformMap(map);
      setDuration(map.duration);
      // Extend initial clip to entire mix duration
      setClips((prev) => [
        {
          ...prev[0],
          endTime: map.duration,
        },
      ]);
    });
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
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        setIsDrawerOpen((prev) => !prev);
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

      {/* Header */}
      <div className={`transition-opacity duration-500 ${!showControls && isFullscreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <StudioHeader
          audioEngine={audioEngine}
          onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
          onOpenRecordModal={() => setIsRecordModalOpen(true)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          trackName={trackName}
          setTrackName={setTrackName}
        />
      </div>

      {/* Center Visualizer Render Viewport (framed by aspect ratio) */}
      <main className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center p-2">
        <VisualizerCanvas
          audioEngine={audioEngine}
          config={config}
          aspectRatio={aspectRatio}
          activeClip={activeBaseClip}
          onCanvasReady={setActiveCanvas}
        />

        {/* DJ Branding / HUD Watermark */}
        <DJBrandingOverlay
          branding={branding}
          audioEngine={audioEngine}
          accentColor={config.palette.primary}
        />
      </main>

      {/* Bottom Timeline DAW Editor (hides in fullscreen VJ mode) */}
      {!isFullscreen && (
        <TimelineContainer
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
        />
      )}

      {/* Visualiser Studio Controls Drawer */}
      <ControlsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        config={config}
        onChangeConfig={handleConfigChange}
        branding={branding}
        onChangeBranding={setBranding}
      />

      {/* Video Recorder / Fast Hardware Export Modal */}
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

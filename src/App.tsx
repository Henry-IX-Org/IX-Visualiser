import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AudioEngine } from './audio/AudioEngine';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { StudioHeader } from './components/StudioHeader';
import { ControlsDrawer } from './components/ControlsDrawer';
import { DJBrandingOverlay } from './components/DJBrandingOverlay';
import { VideoRecorderModal } from './components/VideoRecorderModal';
import { VisualizerConfig, DJBranding } from './types/visualizer';
import { DEFAULT_PRESETS } from './presets/defaultPresets';

export const App: React.FC = () => {
  const audioEngine = useMemo(() => new AudioEngine(), []);

  const [config, setConfig] = useState<VisualizerConfig>(() => {
    const saved = localStorage.getItem('henry_ix_viz_config');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DEFAULT_PRESETS[0].config;
  });

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

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [trackName, setTrackName] = useState('HENRY IX • 128 BPM TECHNO TEST');
  const [activeCanvas, setActiveCanvas] = useState<HTMLCanvasElement | null>(null);

  const [showControls, setShowControls] = useState(true);
  const hideControlsTimerRef = useRef<number | null>(null);

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
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Exit fullscreen failed:', err);
      });
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isFullscreen) {
      hideControlsTimerRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

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
      } else if (e.key >= '1' && e.key <= '5') {
        const idx = parseInt(e.key, 10) - 1;
        if (DEFAULT_PRESETS[idx]) {
          setConfig(DEFAULT_PRESETS[idx].config);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audioEngine]);

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen overflow-hidden bg-black text-white select-none"
    >
      {/* Subtle Bayer Dither Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 bayer-dither opacity-60" />

      {/* Header (auto-hides in fullscreen) */}
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

      {/* Main Visualizer Render Viewport */}
      <main className="w-full h-full">
        <VisualizerCanvas
          audioEngine={audioEngine}
          config={config}
          onCanvasReady={setActiveCanvas}
        />
      </main>

      {/* DJ Branding / HUD Watermark */}
      <DJBrandingOverlay
        branding={branding}
        audioEngine={audioEngine}
        accentColor={config.palette.primary}
      />

      {/* Visualiser Studio Controls Drawer */}
      <ControlsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        config={config}
        onChangeConfig={setConfig}
        branding={branding}
        onChangeBranding={setBranding}
      />

      {/* Video Recorder Modal */}
      <VideoRecorderModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        canvas={activeCanvas}
        audioEngine={audioEngine}
        trackTitle={trackName}
      />
    </div>
  );
};

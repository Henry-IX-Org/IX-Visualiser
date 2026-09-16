import React, { useEffect, useRef } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { VisualizerConfig } from '../types/visualizer';
import { AspectRatio, TimelineClip } from '../types/timeline';
import { CanvasRadialVisualizer } from '../visualizers/CanvasRadialVisualizer';
import { ThreeTunnelVisualizer } from '../visualizers/ThreeTunnelVisualizer';
import { ThreeParticleVisualizer } from '../visualizers/ThreeParticleVisualizer';
import { ThreeTerrainVisualizer } from '../visualizers/ThreeTerrainVisualizer';
import { ShaderGlslVisualizer } from '../visualizers/ShaderGlslVisualizer';

interface VisualizerCanvasProps {
  audioEngine: AudioEngine;
  config: VisualizerConfig;
  aspectRatio: AspectRatio;
  activeClip?: TimelineClip | null;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  audioEngine,
  config,
  aspectRatio,
  activeClip,
  onCanvasReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Use active timeline clip's mode and config if provided, otherwise fallback to global config
  const activeConfig = activeClip?.config || config;
  const activeMode = activeClip?.visualMode || config.mode;

  // Engine references
  const radial2DRef = useRef<CanvasRadialVisualizer | null>(null);
  const tunnel3DRef = useRef<ThreeTunnelVisualizer | null>(null);
  const particle3DRef = useRef<ThreeParticleVisualizer | null>(null);
  const terrain3DRef = useRef<ThreeTerrainVisualizer | null>(null);
  const glslShaderRef = useRef<ShaderGlslVisualizer | null>(null);

  const animFrameIdRef = useRef<number | null>(null);
  const currentModeRef = useRef(activeMode);

  useEffect(() => {
    if (canvasRef.current && onCanvasReady) {
      onCanvasReady(canvasRef.current);
    }
  }, [onCanvasReady]);

  // Handle engine instantiation and mode changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (tunnel3DRef.current && activeMode !== 'cyber-tunnel') {
      tunnel3DRef.current.dispose();
      tunnel3DRef.current = null;
    }
    if (particle3DRef.current && activeMode !== 'particle-nebula') {
      particle3DRef.current.dispose();
      particle3DRef.current = null;
    }
    if (terrain3DRef.current && activeMode !== 'synthwave-terrain') {
      terrain3DRef.current.dispose();
      terrain3DRef.current = null;
    }
    if (glslShaderRef.current && activeMode !== 'glsl-warp') {
      glslShaderRef.current.dispose();
      glslShaderRef.current = null;
    }

    currentModeRef.current = activeMode;

    if (activeMode === 'radial-spectrum' && !radial2DRef.current) {
      radial2DRef.current = new CanvasRadialVisualizer();
    } else if (activeMode === 'cyber-tunnel' && !tunnel3DRef.current) {
      tunnel3DRef.current = new ThreeTunnelVisualizer(canvas);
    } else if (activeMode === 'particle-nebula' && !particle3DRef.current) {
      particle3DRef.current = new ThreeParticleVisualizer(canvas, activeConfig.particleCount || 3500);
    } else if (activeMode === 'synthwave-terrain' && !terrain3DRef.current) {
      terrain3DRef.current = new ThreeTerrainVisualizer(canvas);
    } else if (activeMode === 'glsl-warp' && !glslShaderRef.current) {
      glslShaderRef.current = new ShaderGlslVisualizer(canvas);
      if (activeConfig.glslShaderCode) {
        glslShaderRef.current.setCustomShader(activeConfig.glslShaderCode);
      }
    }
  }, [activeMode, activeConfig.particleCount, activeConfig.glslShaderCode]);

  // Handle Resize and Aspect Ratio Framing
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const contWidth = container.clientWidth;
      const contHeight = container.clientHeight;

      // Aspect ratio calculation
      let targetRatio = 16 / 9;
      if (aspectRatio === '9:16') targetRatio = 9 / 16;
      else if (aspectRatio === '1:1') targetRatio = 1;

      let renderWidth = contWidth;
      let renderHeight = contWidth / targetRatio;

      if (renderHeight > contHeight) {
        renderHeight = contHeight;
        renderWidth = contHeight * targetRatio;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(renderWidth * (activeMode === 'radial-spectrum' ? dpr : 1));
      canvas.height = Math.floor(renderHeight * (activeMode === 'radial-spectrum' ? dpr : 1));
      canvas.style.width = `${Math.floor(renderWidth)}px`;
      canvas.style.height = `${Math.floor(renderHeight)}px`;

      if (tunnel3DRef.current) tunnel3DRef.current.resize(renderWidth, renderHeight);
      if (particle3DRef.current) particle3DRef.current.resize(renderWidth, renderHeight);
      if (terrain3DRef.current) terrain3DRef.current.resize(renderWidth, renderHeight);
      if (glslShaderRef.current) glslShaderRef.current.resize(renderWidth, renderHeight);
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', handleResize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [activeMode, aspectRatio]);

  // Main Render Loop
  useEffect(() => {
    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const metrics = audioEngine.getMetrics();
      const mode = currentModeRef.current;

      if (mode === 'radial-spectrum') {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (!radial2DRef.current) radial2DRef.current = new CanvasRadialVisualizer();
          radial2DRef.current.render(ctx, canvas.width, canvas.height, metrics, activeConfig);
        }
      } else if (mode === 'cyber-tunnel') {
        if (tunnel3DRef.current) {
          tunnel3DRef.current.render(metrics, activeConfig);
        }
      } else if (mode === 'particle-nebula') {
        if (particle3DRef.current) {
          particle3DRef.current.render(metrics, activeConfig);
        }
      } else if (mode === 'synthwave-terrain') {
        if (terrain3DRef.current) {
          terrain3DRef.current.render(metrics, activeConfig);
        }
      } else if (mode === 'glsl-warp') {
        if (glslShaderRef.current) {
          glslShaderRef.current.render(canvas.width, canvas.height, metrics, activeConfig);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [audioEngine, activeConfig]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
      <canvas
        key={`${activeMode}-${aspectRatio}`}
        ref={canvasRef}
        className="block shadow-2xl border border-white/5"
      />
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { VisualizerConfig } from '../types/visualizer';
import { CanvasRadialVisualizer } from '../visualizers/CanvasRadialVisualizer';
import { ThreeTunnelVisualizer } from '../visualizers/ThreeTunnelVisualizer';
import { ThreeParticleVisualizer } from '../visualizers/ThreeParticleVisualizer';
import { ThreeTerrainVisualizer } from '../visualizers/ThreeTerrainVisualizer';
import { ShaderGlslVisualizer } from '../visualizers/ShaderGlslVisualizer';

interface VisualizerCanvasProps {
  audioEngine: AudioEngine;
  config: VisualizerConfig;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  audioEngine,
  config,
  onCanvasReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Engine references
  const radial2DRef = useRef<CanvasRadialVisualizer | null>(null);
  const tunnel3DRef = useRef<ThreeTunnelVisualizer | null>(null);
  const particle3DRef = useRef<ThreeParticleVisualizer | null>(null);
  const terrain3DRef = useRef<ThreeTerrainVisualizer | null>(null);
  const glslShaderRef = useRef<ShaderGlslVisualizer | null>(null);

  const animFrameIdRef = useRef<number | null>(null);
  const currentModeRef = useRef(config.mode);

  // Notify parent of canvas ready for video recording
  useEffect(() => {
    if (canvasRef.current && onCanvasReady) {
      onCanvasReady(canvasRef.current);
    }
  }, [onCanvasReady]);

  // Handle engine instantiation and mode changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Cleanup previous 3D/GL instances when switching modes
    if (tunnel3DRef.current && config.mode !== 'cyber-tunnel') {
      tunnel3DRef.current.dispose();
      tunnel3DRef.current = null;
    }
    if (particle3DRef.current && config.mode !== 'particle-nebula') {
      particle3DRef.current.dispose();
      particle3DRef.current = null;
    }
    if (terrain3DRef.current && config.mode !== 'synthwave-terrain') {
      terrain3DRef.current.dispose();
      terrain3DRef.current = null;
    }
    if (glslShaderRef.current && config.mode !== 'glsl-warp') {
      glslShaderRef.current.dispose();
      glslShaderRef.current = null;
    }

    currentModeRef.current = config.mode;

    // Initialize the active mode engine
    if (config.mode === 'radial-spectrum' && !radial2DRef.current) {
      radial2DRef.current = new CanvasRadialVisualizer();
    } else if (config.mode === 'cyber-tunnel' && !tunnel3DRef.current) {
      tunnel3DRef.current = new ThreeTunnelVisualizer(canvas);
    } else if (config.mode === 'particle-nebula' && !particle3DRef.current) {
      particle3DRef.current = new ThreeParticleVisualizer(canvas, config.particleCount || 3500);
    } else if (config.mode === 'synthwave-terrain' && !terrain3DRef.current) {
      terrain3DRef.current = new ThreeTerrainVisualizer(canvas);
    } else if (config.mode === 'glsl-warp' && !glslShaderRef.current) {
      glslShaderRef.current = new ShaderGlslVisualizer(canvas);
      if (config.glslShaderCode) {
        glslShaderRef.current.setCustomShader(config.glslShaderCode);
      }
    }
  }, [config.mode, config.particleCount, config.glslShaderCode]);

  // Resize handling
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      // Update canvas resolution with DPR for 2D, or standard for 3D performance
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * (config.mode === 'radial-spectrum' ? dpr : 1));
      canvas.height = Math.floor(height * (config.mode === 'radial-spectrum' ? dpr : 1));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      if (tunnel3DRef.current) tunnel3DRef.current.resize(width, height);
      if (particle3DRef.current) particle3DRef.current.resize(width, height);
      if (terrain3DRef.current) terrain3DRef.current.resize(width, height);
      if (glslShaderRef.current) glslShaderRef.current.resize(width, height);
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', handleResize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [config.mode]);

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
          radial2DRef.current.render(ctx, canvas.width, canvas.height, metrics, config);
        }
      } else if (mode === 'cyber-tunnel') {
        if (tunnel3DRef.current) {
          tunnel3DRef.current.render(metrics, config);
        }
      } else if (mode === 'particle-nebula') {
        if (particle3DRef.current) {
          particle3DRef.current.render(metrics, config);
        }
      } else if (mode === 'synthwave-terrain') {
        if (terrain3DRef.current) {
          terrain3DRef.current.render(metrics, config);
        }
      } else if (mode === 'glsl-warp') {
        if (glslShaderRef.current) {
          glslShaderRef.current.render(canvas.width, canvas.height, metrics, config);
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
  }, [audioEngine, config]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
      {/* Keying canvas element by mode ensures proper WebGL vs 2D context binding */}
      <canvas
        key={config.mode}
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};

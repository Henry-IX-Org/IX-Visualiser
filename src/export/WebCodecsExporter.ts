import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { TimelineClip, AspectRatio, AudioWaveformMap } from '../types/timeline';
import { VisualizerConfig } from '../types/visualizer';
import { CanvasRadialVisualizer } from '../visualizers/CanvasRadialVisualizer';
import { ShaderGlslVisualizer } from '../visualizers/ShaderGlslVisualizer';

export interface RenderProgress {
  percent: number;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  etaSeconds: number;
}

export class WebCodecsExporter {
  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoFrame' in window;
  }

  public static async renderToMP4(
    canvas: HTMLCanvasElement,
    durationSeconds: number,
    aspectRatio: AspectRatio,
    clips: TimelineClip[],
    waveformMap: AudioWaveformMap | null,
    onProgress: (progress: RenderProgress) => void,
    signal?: AbortSignal
  ): Promise<Blob> {
    if (!this.isSupported()) {
      throw new Error('WebCodecs is not supported in this browser. Please use Chrome, Edge, or Desktop Electron.');
    }

    // Determine target dimensions
    let width = 1920;
    let height = 1080;
    if (aspectRatio === '9:16') {
      width = 1080;
      height = 1920;
    } else if (aspectRatio === '1:1') {
      width = 1080;
      height = 1080;
    }

    canvas.width = width;
    canvas.height = height;

    const fps = 60;
    const totalFrames = Math.floor(durationSeconds * fps);
    const target = new ArrayBufferTarget();

    const muxer = new Muxer({
      target,
      video: {
        codec: 'avc',
        width,
        height,
      },
      fastStart: 'in-memory',
    });

    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error('VideoEncoder error:', e),
    });

    videoEncoder.configure({
      codec: 'avc1.640028', // H.264 High Profile Level 4.0
      width,
      height,
      bitrate: 10_000_000, // 10 Mbps
      framerate: fps,
    });

    const radial2D = new CanvasRadialVisualizer();
    const ctx = canvas.getContext('2d');
    const startTime = performance.now();

    // Render loop
    for (let frame = 0; frame < totalFrames; frame++) {
      if (signal?.aborted) {
        videoEncoder.close();
        throw new Error('Export canceled by user.');
      }

      const currentTime = frame / fps;

      // Find active clips at currentTime
      const activeBaseClip = clips.find((c) => c.trackId === 1 && c.startTime <= currentTime && c.endTime > currentTime) || clips[0];
      const activeConfig: VisualizerConfig = activeBaseClip?.config || {
        mode: 'radial-spectrum',
        palette: {
          id: 'henry-ix-redline',
          name: 'HENRY IX REDLINE',
          primary: '#D8163F',
          secondary: '#FFFFFF',
          accent: '#E5A93C',
          background: '#040406',
        },
        sensitivity: 1.4,
        smoothing: 0.8,
        beatThreshold: 0.2,
        bloomIntensity: 1.5,
        cameraShake: true,
        strobeOnDrop: true,
        chromaticAberration: true,
        particleCount: 2000,
        wireframe: false,
        speed: 1.2,
        barCount: 72,
      };

      // Synthesize audio metrics from waveform map for this frame
      let bassEnergy = 0.4;
      let isBeat = false;
      if (waveformMap && waveformMap.peaks.length > 0) {
        const peakIdx = Math.min(
          waveformMap.peaks.length - 1,
          Math.floor((currentTime / waveformMap.duration) * waveformMap.peaks.length)
        );
        bassEnergy = waveformMap.subEnergy[peakIdx] || 0.4;
        isBeat = (waveformMap.kickTransients[peakIdx] || 0) > 0.5;
      }

      const dummyFreq = new Uint8Array(256);
      for (let k = 0; k < 256; k++) {
        dummyFreq[k] = Math.floor(Math.sin(k * 0.1 + frame * 0.2) * 100 + 120 * bassEnergy);
      }

      const metrics = {
        overall: bassEnergy,
        bass: bassEnergy,
        mid: 0.5,
        treble: 0.4,
        frequencyData: dummyFreq,
        timeDomainData: new Uint8Array(256).fill(128),
        isBeat,
        beatIntensity: isBeat ? 1.0 : 0.2,
        bpm: 128,
      };

      if (ctx) {
        radial2D.render(ctx, width, height, metrics, activeConfig);

        // Aspect ratio border masking if needed
        if (activeBaseClip?.titleCard) {
          ctx.save();
          ctx.font = `bold ${Math.round(width * 0.03)}px 'Avathe', sans-serif`;
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#D8163F';
          ctx.fillText(activeBaseClip.titleCard.toUpperCase(), width * 0.05, height * 0.92);
          ctx.restore();
        }
      }

      const videoFrame = new VideoFrame(canvas, {
        timestamp: Math.round((frame * 1_000_000) / fps),
      });

      videoEncoder.encode(videoFrame, { keyFrame: frame % (fps * 2) === 0 });
      videoFrame.close();

      // Report progress every 30 frames
      if (frame % 30 === 0 || frame === totalFrames - 1) {
        const elapsedSecs = (performance.now() - startTime) / 1000;
        const currentFps = elapsedSecs > 0 ? frame / elapsedSecs : 0;
        const remainingFrames = totalFrames - frame;
        const etaSeconds = currentFps > 0 ? remainingFrames / currentFps : 0;

        onProgress({
          percent: Math.round((frame / totalFrames) * 100),
          currentFrame: frame,
          totalFrames,
          fps: Math.round(currentFps),
          etaSeconds: Math.round(etaSeconds),
        });

        // Yield execution so UI remains responsive
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    await videoEncoder.flush();
    muxer.finalize();

    const buffer = target.buffer;
    return new Blob([buffer], { type: 'video/mp4' });
  }
}

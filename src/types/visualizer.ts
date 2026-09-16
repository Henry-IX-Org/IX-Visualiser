export type VisualizerMode = 
  | 'radial-spectrum' 
  | 'cyber-tunnel' 
  | 'particle-nebula' 
  | 'synthwave-terrain' 
  | 'glsl-warp';

export interface AudioMetrics {
  overall: number;       // 0.0 - 1.0 (RMS/energy)
  bass: number;          // 0.0 - 1.0 (sub-bass & punch 20-250Hz)
  mid: number;           // 0.0 - 1.0 (instruments & vocals 250-2500Hz)
  treble: number;        // 0.0 - 1.0 (highs & cymbals 2.5k-16kHz)
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  isBeat: boolean;       // Instantaneous beat onset flag
  beatIntensity: number; // Decaying beat hit energy (0.0 - 1.0)
  bpm: number;           // Estimated BPM or tap tempo
}

export interface ColorPalette {
  id: string;
  name: string;
  primary: string;       // Hex or CSS color
  secondary: string;
  accent: string;
  background: string;
}

export interface VisualizerConfig {
  mode: VisualizerMode;
  palette: ColorPalette;
  sensitivity: number;        // Multiplier: 0.5 - 3.0
  smoothing: number;          // AnalyserNode smoothing: 0.1 - 0.95
  beatThreshold: number;      // Dynamic onset threshold: 0.05 - 0.5
  bloomIntensity: number;     // Visual glow: 0.0 - 2.0
  cameraShake: boolean;       // Reactive vibration on bass kicks
  strobeOnDrop: boolean;      // Light flash on heavy drops
  chromaticAberration: boolean; // RGB shift effect
  particleCount: number;      // 500 - 10000
  wireframe: boolean;         // 3D wireframe toggle
  speed: number;              // Tunnel / flight speed factor: 0.2 - 3.0
  barCount: number;           // Spectrum resolution (32 to 256)
  glslShaderCode?: string;    // Custom fragment shader if in GLSL mode
}

export interface DJBranding {
  enabled: boolean;
  djName: string;
  mixTitle: string;
  logoUrl: string | null;
  showBpm: boolean;
  position: 'center' | 'bottom-left' | 'bottom-center' | 'top-left';
}

export type AudioSourceType = 'file' | 'mic' | 'synth';

export interface VisualizerPreset {
  id: string;
  name: string;
  description: string;
  genreTag: string;
  config: VisualizerConfig;
}

import { VisualizerMode, VisualizerConfig } from './visualizer';

export type AspectRatio = '16:9' | '9:16' | '1:1';

export type TransitionType = 'cut' | 'crossfade' | 'strobe-drop' | 'glitch';

export type EQTarget = 'master' | 'sub' | 'kick' | 'bass' | 'mids' | 'highs';

export interface TimelineClip {
  id: string;
  trackId: number;              // 1 = Base Scene, 2 = Overlays/Particles, 3 = Titles & Branding
  startTime: number;            // In seconds
  endTime: number;              // In seconds
  visualMode: VisualizerMode;
  config: VisualizerConfig;
  titleCard?: string;           // Track title for lower-third cards
  artistName?: string;          // Artist name
  eqTarget: EQTarget;           // Which audio stem/frequency band triggers reactivity
  transitionIn: TransitionType;
  transitionDuration: number;   // In seconds (0.1 to 2.0s)
}

export interface TimelineTrack {
  id: number;
  name: string;
  type: 'base' | 'overlay' | 'branding';
  muted: boolean;
  locked: boolean;
  color: string;
}

export interface AudioWaveformMap {
  duration: number;
  peaks: number[];              // 2000-4000 downsampled peak values (0 to 1)
  subEnergy: number[];          // Sub-bass energy curve
  kickTransients: number[];     // Kick drum transient peaks
  dropMarkers: number[];        // Detected beat drop timestamps (seconds)
}

export interface TracklistEntry {
  timestampSeconds: number;
  artist: string;
  title: string;
}

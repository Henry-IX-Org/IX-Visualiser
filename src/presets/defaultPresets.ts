import { ColorPalette, VisualizerPreset } from '../types/visualizer';

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'henry-ix-redline',
    name: 'HENRY IX REDLINE',
    primary: '#D8163F',   // Iconic Henry IX Crimson
    secondary: '#FFFFFF', // High-contrast White
    accent: '#E5A93C',    // Imperial Gold
    background: '#040406',// Pitch Obsidian Void
  },
  {
    id: 'kvngs-royal-gold',
    name: 'KVNGS ROYAL GOLD',
    primary: '#E5A93C',   // Imperial Amber Gold
    secondary: '#D8163F', // Crimson
    accent: '#F8FAFC',    // Diamond Platinum
    background: '#050508',// Deep Velvet Onyx
  },
  {
    id: 'knight-club-bass',
    name: 'KNIGHT CLUB LONDON',
    primary: '#D8163F',   // Crimson
    secondary: '#8B0000', // Deep Blood Red
    accent: '#00F0FF',    // Electric Ice
    background: '#000000',// Pure Black
  },
  {
    id: 'acid-redline',
    name: 'ACID REDLINE',
    primary: '#D8163F',   // Crimson
    secondary: '#39FF14', // Toxic Acid Green
    accent: '#FFFFFF',
    background: '#050805',
  },
  {
    id: 'obsidian-monolith',
    name: 'OBSIDIAN MONOLITH',
    primary: '#F8FAFC',   // White
    secondary: '#D8163F', // Crimson
    accent: '#94A3B8',    // Silver Titanium
    background: '#020204',
  },
];

export const DEFAULT_PRESETS: VisualizerPreset[] = [
  {
    id: 'henry-ix-redline-radial',
    name: 'HENRY IX REDLINE',
    genreTag: 'Club / UK Bass / Techno',
    description: 'Iconic crimson redline pulse with central IX monogram, shockwave drops, and sub-bass energy.',
    config: {
      mode: 'radial-spectrum',
      palette: COLOR_PALETTES[0],
      sensitivity: 1.4,
      smoothing: 0.82,
      beatThreshold: 0.2,
      bloomIntensity: 1.6,
      cameraShake: true,
      strobeOnDrop: true,
      chromaticAberration: true,
      particleCount: 1500,
      wireframe: false,
      speed: 1.2,
      barCount: 72,
    },
  },
  {
    id: 'london-club-tunnel',
    name: 'LONDON CLUB 3D TUNNEL',
    genreTag: 'Hard Groove / Dubstep / Rave',
    description: 'Brutalist industrial tunnel lined with crimson and gold laser octagons accelerating to 140+ BPM.',
    config: {
      mode: 'cyber-tunnel',
      palette: COLOR_PALETTES[0],
      sensitivity: 1.5,
      smoothing: 0.78,
      beatThreshold: 0.22,
      bloomIntensity: 1.5,
      cameraShake: true,
      strobeOnDrop: true,
      chromaticAberration: true,
      particleCount: 2000,
      wireframe: true,
      speed: 1.4,
      barCount: 64,
    },
  },
  {
    id: 'kvngs-particle-nebula',
    name: 'KVNGS ROYAL NEBULA',
    genreTag: 'Afro-house / Rap / Trap',
    description: 'Swirling celestial vortex of 4,000 crimson and imperial gold particles detonating on 808 hits.',
    config: {
      mode: 'particle-nebula',
      palette: COLOR_PALETTES[1],
      sensitivity: 1.3,
      smoothing: 0.84,
      beatThreshold: 0.24,
      bloomIntensity: 1.4,
      cameraShake: true,
      strobeOnDrop: false,
      chromaticAberration: false,
      particleCount: 4000,
      wireframe: false,
      speed: 1.1,
      barCount: 96,
    },
  },
  {
    id: 'uk-bassline-cavern',
    name: 'UK BASSLINE GRID',
    genreTag: 'UK Garage / Grime / Jungle',
    description: 'Monolithic pitch-black terrain with blood-red laser mountain peaks undulating to deep sub-bass.',
    config: {
      mode: 'synthwave-terrain',
      palette: COLOR_PALETTES[2],
      sensitivity: 1.5,
      smoothing: 0.75,
      beatThreshold: 0.22,
      bloomIntensity: 1.4,
      cameraShake: true,
      strobeOnDrop: true,
      chromaticAberration: true,
      particleCount: 1500,
      wireframe: true,
      speed: 1.2,
      barCount: 64,
    },
  },
  {
    id: 'berghain-glsl-redline',
    name: 'BERGHAIN GLSL WARP',
    genreTag: 'Industrial Techno / Acid',
    description: 'Hardware-accelerated raymarched redline kaleidoscope with brutalist distortion and audio strobe.',
    config: {
      mode: 'glsl-warp',
      palette: COLOR_PALETTES[0],
      sensitivity: 1.6,
      smoothing: 0.76,
      beatThreshold: 0.2,
      bloomIntensity: 1.8,
      cameraShake: true,
      strobeOnDrop: true,
      chromaticAberration: true,
      particleCount: 1000,
      wireframe: false,
      speed: 1.5,
      barCount: 64,
    },
  },
];

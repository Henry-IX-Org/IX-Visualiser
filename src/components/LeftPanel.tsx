import React, { useState } from 'react';
import { 
  Sliders, 
  Layers, 
  Palette, 
  Type, 
  Radio, 
  Sparkles, 
  Volume2, 
  Move,
  Upload,
  Download,
  Check
} from 'lucide-react';
import { VisualizerConfig, DJBranding } from '../types/visualizer';
import { AspectRatio } from '../types/timeline';
import { DEFAULT_PRESETS } from '../presets/defaultPresets';
import { Tooltip } from './common/Tooltip';

interface LeftPanelProps {
  config: VisualizerConfig;
  onChangeConfig: (config: VisualizerConfig) => void;
  branding: DJBranding;
  onChangeBranding: (branding: DJBranding) => void;
  aspectRatio: AspectRatio;
  onChangeAspectRatio: (ar: AspectRatio) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  config,
  onChangeConfig,
  branding,
  onChangeBranding,
  aspectRatio,
  onChangeAspectRatio,
}) => {
  const [activeSection, setActiveSection] = useState<'all' | 'visual' | 'audio'>('all');
  const [audioTarget, setAudioTarget] = useState<'overall' | 'eq' | 'stems'>('overall');
  const [eqBand, setEqBand] = useState<'master' | 'sub' | 'bass' | 'mid' | 'high'>('master');

  const handlePresetSelect = (presetId: string) => {
    const p = DEFAULT_PRESETS.find((item) => item.id === presetId);
    if (p) {
      onChangeConfig(p.config);
    }
  };

  return (
    <aside className="w-[268px] shrink-0 border-r border-white/10 bg-neutral-950/98 flex flex-col h-full overflow-y-auto text-xs font-ocra select-none">
      {/* Panel Header */}
      <div className="h-9 px-3 border-b border-white/10 flex items-center justify-between bg-black shrink-0">
        <div className="flex items-center gap-2 text-neutral-200 font-bold text-[11px] tracking-wider uppercase">
          <Sliders className="w-3.5 h-3.5 text-[#D8163F]" />
          <span>Visualiser Setup</span>
        </div>
      </div>

      <div className="p-3 space-y-4 flex-1">
        {/* SECTION 1: Aspect Ratio */}
        <section className="space-y-1.5">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Aspect Ratio
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ar) => (
              <button
                key={ar}
                onClick={() => onChangeAspectRatio(ar)}
                className={`h-7 rounded border text-[11px] font-bold transition-all cursor-pointer ${
                  aspectRatio === ar
                    ? 'border-[#D8163F] bg-[#D8163F]/20 text-white'
                    : 'border-white/10 bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                {ar}
              </button>
            ))}
          </div>
        </section>

        <div className="h-px bg-white/5" />

        {/* SECTION 2: Presets */}
        <section className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Presets
            </label>
            <div className="flex items-center gap-1">
              <Tooltip text="Export" position="top">
                <button className="w-5 h-5 flex items-center justify-center rounded text-neutral-400 hover:text-white cursor-pointer">
                  <Download className="w-3 h-3" />
                </button>
              </Tooltip>
              <Tooltip text="Import" position="top">
                <button className="w-5 h-5 flex items-center justify-center rounded text-neutral-400 hover:text-white cursor-pointer">
                  <Upload className="w-3 h-3" />
                </button>
              </Tooltip>
            </div>
          </div>
          <select
            value={DEFAULT_PRESETS.find(p => p.config.mode === config.mode)?.id || 'redline'}
            onChange={(e) => handlePresetSelect(e.target.value)}
            className="w-full h-7 px-2 bg-neutral-900 text-white text-[11px] rounded border border-white/10 focus:border-[#D8163F] outline-none cursor-pointer"
          >
            {DEFAULT_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </section>

        <div className="h-px bg-white/5" />

        {/* SECTION 3: Watermark & Branding */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Watermark
            </label>
            <input
              type="checkbox"
              checked={branding.enabled}
              onChange={(e) => onChangeBranding({ ...branding, enabled: e.target.checked })}
              className="accent-[#D8163F] cursor-pointer"
            />
          </div>

          {branding.enabled && (
            <div className="space-y-2 pt-1">
              <div>
                <span className="text-[9px] text-neutral-500 uppercase block mb-1">DJ Name</span>
                <input
                  type="text"
                  value={branding.djName}
                  onChange={(e) => onChangeBranding({ ...branding, djName: e.target.value })}
                  className="w-full h-7 px-2 bg-neutral-900 border border-white/10 rounded font-mono text-[11px] text-neutral-200 outline-none focus:border-[#D8163F]"
                />
              </div>

              <div>
                <span className="text-[9px] text-neutral-500 uppercase block mb-1">Mix Title</span>
                <input
                  type="text"
                  value={branding.mixTitle}
                  onChange={(e) => onChangeBranding({ ...branding, mixTitle: e.target.value })}
                  className="w-full h-7 px-2 bg-neutral-900 border border-white/10 rounded font-mono text-[11px] text-neutral-200 outline-none focus:border-[#D8163F]"
                />
              </div>

              <div>
                <span className="text-[9px] text-neutral-500 uppercase block mb-1">Position</span>
                <select
                  value={branding.position}
                  onChange={(e) => onChangeBranding({ ...branding, position: e.target.value as any })}
                  className="w-full h-7 px-2 bg-neutral-900 border border-white/10 rounded text-[11px] text-white outline-none cursor-pointer"
                >
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-center">Bottom Center</option>
                  <option value="top-left">Top Left</option>
                  <option value="center">Center</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-neutral-400">BPM Badge</span>
                <input
                  type="checkbox"
                  checked={branding.showBpm}
                  onChange={(e) => onChangeBranding({ ...branding, showBpm: e.target.checked })}
                  className="accent-[#D8163F] cursor-pointer"
                />
              </div>
            </div>
          )}
        </section>

        <div className="h-px bg-white/5" />

        {/* SECTION 4: Visual Design Elements (Drag & Drop) */}
        <section className="space-y-1.5">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Visual Elements
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button className="h-7 px-2 flex items-center justify-start gap-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 text-[10px] cursor-grab">
              <Type className="w-3 h-3 text-[#E5A93C]" />
              <span>+ Text Card</span>
            </button>
            <button className="h-7 px-2 flex items-center justify-start gap-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 text-[10px] cursor-grab">
              <Sparkles className="w-3 h-3 text-[#D8163F]" />
              <span>+ BPM HUD</span>
            </button>
            <button className="h-7 px-2 flex items-center justify-start gap-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 text-[10px] cursor-grab">
              <Radio className="w-3 h-3 text-cyan-400" />
              <span>+ EQ Meter</span>
            </button>
            <button className="h-7 px-2 flex items-center justify-start gap-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 text-[10px] cursor-grab">
              <Move className="w-3 h-3 text-emerald-400" />
              <span>+ Drop Flash</span>
            </button>
          </div>
        </section>

        <div className="h-px bg-white/5" />

        {/* SECTION 5: Element Editing (Colours, Shapes, Pulses) */}
        <section className="space-y-2">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Element Editing
          </label>

          {/* Colours */}
          <div>
            <span className="text-[9px] text-neutral-500 uppercase block mb-1.5">Colours Used</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex flex-col items-center gap-1 p-1.5 bg-neutral-900 rounded border border-white/10">
                <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: config.palette.primary }} />
                <span className="text-[8px] text-neutral-400">PRI</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1 p-1.5 bg-neutral-900 rounded border border-white/10">
                <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: config.palette.secondary }} />
                <span className="text-[8px] text-neutral-400">SEC</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1 p-1.5 bg-neutral-900 rounded border border-white/10">
                <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: config.palette.accent }} />
                <span className="text-[8px] text-neutral-400">ACC</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1 p-1.5 bg-neutral-900 rounded border border-white/10">
                <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: config.palette.background }} />
                <span className="text-[8px] text-neutral-400">BG</span>
              </div>
            </div>
          </div>

          {/* Shapes */}
          <div>
            <span className="text-[9px] text-neutral-500 uppercase block mb-1">Visual Engine Shape</span>
            <select
              value={config.mode}
              onChange={(e) => onChangeConfig({ ...config, mode: e.target.value as any })}
              className="w-full h-7 px-2 bg-neutral-900 text-white text-[11px] rounded border border-white/10 focus:border-[#D8163F] outline-none cursor-pointer"
            >
              <option value="radial-spectrum">Radial Ring</option>
              <option value="cyber-tunnel">Cyber Tunnel</option>
              <option value="cosmic-nebula">Cosmic Nebula</option>
              <option value="bassline-grid">Wireframe Grid</option>
              <option value="glsl-warp">GLSL Warp</option>
            </select>
          </div>

          {/* Pulse / Density */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-neutral-400 uppercase">Pulse Density</span>
              <span className="text-[#D8163F] font-mono">{config.particleCount}</span>
            </div>
            <input
              type="range"
              min={32}
              max={128}
              value={config.particleCount}
              onChange={(e) => onChangeConfig({ ...config, particleCount: parseInt(e.target.value) })}
              className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-[#D8163F]"
            />
          </div>
        </section>

        <div className="h-px bg-white/5" />

        {/* SECTION 6: Audio Processing Settings (Decibel, EQ, Stems) */}
        <section className="space-y-2">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Audio Processing
          </label>

          {/* Target: dB, EQ, Stems */}
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setAudioTarget('overall')}
              className={`h-6 rounded border text-[10px] font-bold transition-all cursor-pointer ${
                audioTarget === 'overall'
                  ? 'border-[#D8163F] bg-[#D8163F]/20 text-white'
                  : 'border-white/10 bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              Decibel
            </button>
            <button
              onClick={() => setAudioTarget('eq')}
              className={`h-6 rounded border text-[10px] font-bold transition-all cursor-pointer ${
                audioTarget === 'eq'
                  ? 'border-[#D8163F] bg-[#D8163F]/20 text-white'
                  : 'border-white/10 bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              EQ Bands
            </button>
            <button
              onClick={() => setAudioTarget('stems')}
              className={`h-6 rounded border text-[10px] font-bold transition-all cursor-pointer ${
                audioTarget === 'stems'
                  ? 'border-[#D8163F] bg-[#D8163F]/20 text-white'
                  : 'border-white/10 bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              Stems
            </button>
          </div>

          {/* EQ Target */}
          {audioTarget === 'eq' && (
            <div>
              <span className="text-[9px] text-neutral-500 uppercase block mb-1">Target Band</span>
              <select
                value={eqBand}
                onChange={(e) => setEqBand(e.target.value as any)}
                className="w-full h-7 px-2 bg-neutral-900 border border-white/10 rounded text-[11px] text-white outline-none cursor-pointer"
              >
                <option value="master">Master Spectrum</option>
                <option value="sub">Sub (20 - 60 Hz)</option>
                <option value="bass">Bass (60 - 250 Hz)</option>
                <option value="mid">Mids (250 - 4 kHz)</option>
                <option value="high">Highs (4k - 20 kHz)</option>
              </select>
            </div>
          )}

          {/* Stems Mock Options */}
          {audioTarget === 'stems' && (
            <div>
              <span className="text-[9px] text-neutral-500 uppercase block mb-1">Active Stem</span>
              <select
                className="w-full h-7 px-2 bg-neutral-900 border border-white/10 rounded text-[11px] text-white outline-none cursor-pointer"
              >
                <option value="drums">Drums & Percussion</option>
                <option value="bass">Bassline</option>
                <option value="vocals">Vocals & Leads</option>
                <option value="other">Synths & FX</option>
              </select>
            </div>
          )}

          {/* Sensitivity */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-neutral-400 uppercase">Sensitivity</span>
              <span className="text-[#D8163F] font-mono">{(config.sensitivity ?? 1.4).toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={3.0}
              step={0.1}
              value={config.sensitivity ?? 1.4}
              onChange={(e) => onChangeConfig({ ...config, sensitivity: parseFloat(e.target.value) })}
              className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-[#D8163F]"
            />
          </div>

          {/* Smoothing */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-neutral-400 uppercase">Smoothing</span>
              <span className="text-[#D8163F] font-mono">{(config.smoothing ?? 0.82).toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={0.95}
              step={0.01}
              value={config.smoothing ?? 0.82}
              onChange={(e) => onChangeConfig({ ...config, smoothing: parseFloat(e.target.value) })}
              className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-[#D8163F]"
            />
          </div>
        </section>
      </div>
    </aside>
  );
};

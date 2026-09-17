import React, { useState, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Download, 
  UploadCloud, 
  Check,
  Sliders,
  Palette,
  SlidersHorizontal,
  User,
  Code
} from 'lucide-react';
import { VisualizerConfig, VisualizerMode, DJBranding, VisualizerPreset } from '../types/visualizer';
import { COLOR_PALETTES, DEFAULT_PRESETS } from '../presets/defaultPresets';
import { DEFAULT_FRAGMENT_SHADER } from '../visualizers/ShaderGlslVisualizer';
import { Tooltip } from './common/Tooltip';

interface ControlsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: VisualizerConfig;
  onChangeConfig: (newConfig: VisualizerConfig) => void;
  branding: DJBranding;
  onChangeBranding: (newBranding: DJBranding) => void;
}

export const ControlsDrawer: React.FC<ControlsDrawerProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  branding,
  onChangeBranding,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'dsp' | 'branding' | 'presets' | 'shader'>('visual');
  const [customShaderText, setCustomShaderText] = useState(config.glslShaderCode || DEFAULT_FRAGMENT_SHADER);
  const [shaderApplied, setShaderApplied] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const presetImportRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleModeChange = (mode: VisualizerMode) => {
    onChangeConfig({ ...config, mode });
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = DEFAULT_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      onChangeConfig({ ...preset.config });
    }
  };

  const handlePaletteSelect = (paletteId: string) => {
    const pal = COLOR_PALETTES.find((p) => p.id === paletteId);
    if (pal) {
      onChangeConfig({ ...config, palette: pal });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        onChangeBranding({ ...branding, logoUrl: event.target.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExportPreset = () => {
    const exportData = {
      name: 'HENRY IX Custom Preset',
      timestamp: new Date().toISOString(),
      config,
      branding,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `henry-ix-preset-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportPreset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.config) onChangeConfig(parsed.config);
        if (parsed.branding) onChangeBranding(parsed.branding);
      } catch (err) {
        alert('Invalid preset JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleApplyCustomShader = () => {
    onChangeConfig({
      ...config,
      mode: 'glsl-warp',
      glslShaderCode: customShaderText,
    });
    setShaderApplied(true);
    setTimeout(() => setShaderApplied(false), 2000);
  };

  return (
    <aside className="fixed top-0 right-0 bottom-0 z-40 w-full sm:w-[360px] bg-neutral-950/98 backdrop-blur-3xl border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-150 font-ocra text-xs">
      {/* Header */}
      <div className="flex h-10 items-center justify-between px-3 border-b border-white/10 bg-black">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-[#D8163F]" />
          <h2 className="font-bold text-white tracking-wider uppercase text-[11px]">
            INSPECTOR
          </h2>
        </div>
        <Tooltip text="Close" position="left">
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      {/* Tabs */}
      <div className="flex h-9 border-b border-white/10 px-2 bg-neutral-900/60 overflow-x-auto text-[10px]">
        {[
          { id: 'visual', label: 'Engine', icon: Palette, tip: 'Engine & Palette' },
          { id: 'dsp', label: 'DSP', icon: SlidersHorizontal, tip: 'DSP & Audio FX' },
          { id: 'branding', label: 'Brand', icon: User, tip: 'Branding & Watermark' },
          { id: 'presets', label: 'Presets', icon: Sparkles, tip: 'Saved Presets' },
          { id: 'shader', label: 'GLSL', icon: Code, tip: 'Fragment Shader' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Tooltip key={tab.id} text={tab.tip} position="bottom">
              <button
                onClick={() => setActiveTab(tab.id as any)}
                className={`h-full flex items-center gap-1 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#D8163F] text-[#D8163F] font-bold'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
        {/* TAB 1: VISUAL */}
        {activeTab === 'visual' && (
          <div className="space-y-3">
            {/* Engine Mode Dropdown */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Engine
              </label>
              <select
                value={config.mode}
                onChange={(e) => handleModeChange(e.target.value as VisualizerMode)}
                className="w-full h-7 px-2 bg-neutral-900 border border-white/10 rounded text-white font-mono text-[11px] focus:border-[#D8163F] outline-none cursor-pointer"
              >
                <option value="radial-spectrum">Radial</option>
                <option value="cyber-tunnel">Tunnel</option>
                <option value="particle-nebula">Nebula</option>
                <option value="synthwave-terrain">Grid</option>
                <option value="glsl-warp">GLSL Warp</option>
              </select>
            </div>

            {/* Color Palette Dropdown */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Palette
              </label>
              <select
                value={config.palette.id}
                onChange={(e) => handlePaletteSelect(e.target.value)}
                className="w-full h-7 px-2 bg-neutral-900 border border-white/10 rounded text-white font-mono text-[11px] focus:border-[#D8163F] outline-none cursor-pointer"
              >
                {COLOR_PALETTES.map((pal) => (
                  <option key={pal.id} value={pal.id}>
                    {pal.name.replace('HENRY IX ', '').replace('KVNGS ', '').replace(' LONDON', '')}
                  </option>
                ))}
              </select>

              {/* Palette Color Previews */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: config.palette.primary }} title="Primary" />
                <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: config.palette.secondary }} title="Secondary" />
                <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: config.palette.accent }} title="Accent" />
                <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: config.palette.background }} title="Background" />
              </div>
            </div>

            {/* Resolution / Spectrum Density */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                <span>Density</span>
                <span className="font-mono text-[#D8163F] font-bold">{config.barCount}</span>
              </div>
              <input
                type="range"
                min={32}
                max={128}
                step={8}
                value={config.barCount}
                onChange={(e) => onChangeConfig({ ...config, barCount: parseInt(e.target.value, 10) })}
                className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-[#D8163F]"
              />
            </div>

            {/* Wireframe Toggle */}
            {config.mode !== 'radial-spectrum' && config.mode !== 'glsl-warp' && (
              <div className="flex items-center justify-between h-8 px-2.5 bg-neutral-900/60 rounded border border-white/10 hover:border-white/20 transition-colors">
                <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider">Wireframe</span>
                <input
                  type="checkbox"
                  checked={config.wireframe}
                  onChange={(e) => onChangeConfig({ ...config, wireframe: e.target.checked })}
                  className="w-3.5 h-3.5 accent-[#D8163F] cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DSP */}
        {activeTab === 'dsp' && (
          <div className="space-y-3">
            {/* Audio Sensitivity */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                <span>Gain</span>
                <span className="font-mono text-[#D8163F] font-bold">{config.sensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={config.sensitivity}
                onChange={(e) => onChangeConfig({ ...config, sensitivity: parseFloat(e.target.value) })}
                className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-[#D8163F]"
              />
            </div>

            {/* Spectrum Smoothing */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                <span>Smoothing</span>
                <span className="font-mono text-[#D8163F] font-bold">{config.smoothing.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.95"
                step="0.02"
                value={config.smoothing}
                onChange={(e) => onChangeConfig({ ...config, smoothing: parseFloat(e.target.value) })}
                className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-[#D8163F]"
              />
            </div>

            {/* Beat Threshold */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                <span>Drop Threshold</span>
                <span className="font-mono text-[#D8163F] font-bold">{config.beatThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.6"
                step="0.02"
                value={config.beatThreshold}
                onChange={(e) => onChangeConfig({ ...config, beatThreshold: parseFloat(e.target.value) })}
                className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-[#D8163F]"
              />
            </div>

            {/* Speed Factor */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                <span>Speed</span>
                <span className="font-mono text-[#D8163F] font-bold">{config.speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={config.speed}
                onChange={(e) => onChangeConfig({ ...config, speed: parseFloat(e.target.value) })}
                className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-[#D8163F]"
              />
            </div>

            {/* Bloom Intensity */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                <span>Bloom</span>
                <span className="font-mono text-[#D8163F] font-bold">{config.bloomIntensity.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.5"
                step="0.1"
                value={config.bloomIntensity}
                onChange={(e) => onChangeConfig({ ...config, bloomIntensity: parseFloat(e.target.value) })}
                className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-[#D8163F]"
              />
            </div>

            {/* Checkbox FX */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between h-8 px-2.5 bg-neutral-900/60 rounded border border-white/10 hover:border-white/20 transition-colors">
                <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider">Camera Shake</span>
                <input
                  type="checkbox"
                  checked={config.cameraShake}
                  onChange={(e) => onChangeConfig({ ...config, cameraShake: e.target.checked })}
                  className="w-3.5 h-3.5 accent-[#D8163F] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between h-8 px-2.5 bg-neutral-900/60 rounded border border-white/10 hover:border-white/20 transition-colors">
                <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider">Strobe Drop</span>
                <input
                  type="checkbox"
                  checked={config.strobeOnDrop}
                  onChange={(e) => onChangeConfig({ ...config, strobeOnDrop: e.target.checked })}
                  className="w-3.5 h-3.5 accent-[#D8163F] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BRAND */}
        {activeTab === 'branding' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between h-8 px-2.5 bg-neutral-900/60 rounded border border-white/10 hover:border-white/20 transition-colors">
              <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider">Watermark</span>
              <input
                type="checkbox"
                checked={branding.enabled}
                onChange={(e) => onChangeBranding({ ...branding, enabled: e.target.checked })}
                className="w-3.5 h-3.5 accent-[#D8163F] cursor-pointer"
              />
            </div>

            {/* DJ Name */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Artist</label>
              <input
                type="text"
                value={branding.djName}
                onChange={(e) => onChangeBranding({ ...branding, djName: e.target.value })}
                className="w-full h-7 px-2.5 bg-neutral-900 border border-white/10 rounded font-mono text-[11px] text-white uppercase focus:border-[#D8163F] outline-none"
              />
            </div>

            {/* Mix Title */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Title</label>
              <input
                type="text"
                value={branding.mixTitle}
                onChange={(e) => onChangeBranding({ ...branding, mixTitle: e.target.value })}
                className="w-full h-7 px-2.5 bg-neutral-900 border border-white/10 rounded font-mono text-[11px] text-white uppercase focus:border-[#D8163F] outline-none"
              />
            </div>

            {/* Position Dropdown */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Position</label>
              <select
                value={branding.position}
                onChange={(e) => onChangeBranding({ ...branding, position: e.target.value as any })}
                className="w-full h-7 px-2 bg-neutral-900 border border-white/10 rounded text-white font-mono text-[11px] focus:border-[#D8163F] outline-none cursor-pointer"
              >
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-center">Bottom Center</option>
                <option value="top-left">Top Left</option>
                <option value="center">Center</option>
              </select>
            </div>

            {/* Emblem Artwork Dropdown */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Emblem</label>
              <div className="flex items-center gap-2">
                <select
                  value={branding.logoUrl || '/logo-ix.svg'}
                  onChange={(e) => onChangeBranding({ ...branding, logoUrl: e.target.value })}
                  className="flex-1 h-7 px-2 bg-neutral-900 border border-white/10 rounded text-white font-mono text-[11px] focus:border-[#D8163F] outline-none cursor-pointer"
                >
                  <option value="/logo-ix.svg">IX Logo</option>
                  <option value="/cover.png">Cover Art</option>
                </select>
                <Tooltip text="Upload logo" position="top">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="h-7 px-3 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-bold uppercase cursor-pointer transition-colors"
                  >
                    Upload
                  </button>
                </Tooltip>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
            </div>

            {/* Show BPM */}
            <div className="flex items-center justify-between h-8 px-2.5 bg-neutral-900/60 rounded border border-white/10 hover:border-white/20 transition-colors">
              <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider">BPM Badge</span>
              <input
                type="checkbox"
                checked={branding.showBpm}
                onChange={(e) => onChangeBranding({ ...branding, showBpm: e.target.checked })}
                className="w-3.5 h-3.5 accent-[#D8163F] cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* TAB 4: PRESETS */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Preset</label>
              <select
                onChange={(e) => handlePresetSelect(e.target.value)}
                defaultValue=""
                className="w-full h-7 px-2 bg-neutral-900 border border-white/10 rounded text-white font-mono text-[11px] focus:border-[#D8163F] outline-none cursor-pointer"
              >
                <option value="" disabled>Select...</option>
                {DEFAULT_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name.replace('HENRY IX ', '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Compact preset buttons */}
            <div className="grid grid-cols-1 gap-1.5 pt-1">
              {DEFAULT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onChangeConfig({ ...p.config })}
                  className={`w-full h-7 px-2.5 rounded text-left border transition-all cursor-pointer flex items-center justify-between ${
                    config.mode === p.config.mode && config.palette.id === p.config.palette.id
                      ? 'bg-[#D8163F]/20 border-[#D8163F] text-white'
                      : 'bg-neutral-900/50 border-white/5 hover:bg-neutral-900 text-neutral-300'
                  }`}
                >
                  <span className="font-mono font-bold text-[10px] uppercase truncate">{p.name.replace('HENRY IX ', '')}</span>
                </button>
              ))}
            </div>

            {/* Export / Import */}
            <div className="pt-2 border-t border-white/10 flex items-center gap-2">
              <Tooltip text="Export JSON" position="top">
                <button
                  onClick={handleExportPreset}
                  className="flex-1 h-7 px-3 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-white/10 text-[10px] font-bold uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Download className="w-3 h-3 text-[#D8163F]" />
                  Export
                </button>
              </Tooltip>
              <input ref={presetImportRef} type="file" accept=".json" className="hidden" onChange={handleImportPreset} />
              <Tooltip text="Import JSON" position="top">
                <button
                  onClick={() => presetImportRef.current?.click()}
                  className="flex-1 h-7 px-3 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-white/10 text-[10px] font-bold uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <UploadCloud className="w-3 h-3 text-[#E5A93C]" />
                  Import
                </button>
              </Tooltip>
            </div>
          </div>
        )}

        {/* TAB 5: GLSL SHADER */}
        {activeTab === 'shader' && (
          <div className="space-y-3">
            <div className="text-[10px] text-neutral-400 space-y-1">
              <span className="block font-bold text-neutral-400 uppercase tracking-wider">Uniforms</span>
              <code className="block p-1.5 bg-black border border-white/10 rounded font-mono text-[9px] text-[#D8163F] truncate">
                u_time, u_bass, u_mid, u_treble, u_beat, u_resolution
              </code>
            </div>

            <textarea
              value={customShaderText}
              onChange={(e) => setCustomShaderText(e.target.value)}
              className="w-full h-64 p-2.5 bg-black border border-white/15 rounded font-mono text-[10px] text-emerald-400 outline-none focus:border-[#D8163F] leading-relaxed resize-none"
              spellCheck={false}
            />

            <button
              onClick={handleApplyCustomShader}
              className="w-full h-8 rounded bg-[#D8163F] hover:bg-[#b01032] text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors"
            >
              {shaderApplied ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              {shaderApplied ? 'Applied' : 'Apply'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

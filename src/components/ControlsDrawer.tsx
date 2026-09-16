import React, { useState, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Palette, 
  SlidersHorizontal, 
  Flame, 
  User, 
  Code, 
  Download, 
  UploadCloud, 
  Check,
  Disc
} from 'lucide-react';
import { VisualizerConfig, VisualizerMode, DJBranding, VisualizerPreset } from '../types/visualizer';
import { COLOR_PALETTES, DEFAULT_PRESETS } from '../presets/defaultPresets';
import { DEFAULT_FRAGMENT_SHADER } from '../visualizers/ShaderGlslVisualizer';

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
  const [activeTab, setActiveTab] = useState<'presets' | 'visual' | 'dsp' | 'branding' | 'shader'>('presets');
  const [customShaderText, setCustomShaderText] = useState(config.glslShaderCode || DEFAULT_FRAGMENT_SHADER);
  const [shaderApplied, setShaderApplied] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const presetImportRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleModeChange = (mode: VisualizerMode) => {
    onChangeConfig({ ...config, mode });
  };

  const handlePresetSelect = (preset: VisualizerPreset) => {
    onChangeConfig({ ...preset.config });
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
        if (parsed.config) {
          onChangeConfig(parsed.config);
        }
        if (parsed.branding) {
          onChangeBranding(parsed.branding);
        }
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
    <aside className="fixed top-0 right-0 bottom-0 z-40 w-full sm:w-[440px] bg-black/95 backdrop-blur-3xl border-l border-[#D8163F]/30 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8163F]/25 bg-neutral-950/80">
        <div className="flex items-center gap-2.5">
          <img src="/logo-ix.svg" alt="IX" className="w-5 h-5 drop-shadow-[0_0_6px_#D8163F]" />
          <h2 className="font-avathe text-lg tracking-widest text-white uppercase redline-glow">
            STUDIO CONTROL
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-3 bg-black/60 overflow-x-auto text-xs font-ocra">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-1.5 px-3 py-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'presets'
              ? 'border-[#D8163F] text-[#D8163F] font-bold shadow-sm'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          PRESETS
        </button>
        <button
          onClick={() => setActiveTab('visual')}
          className={`flex items-center gap-1.5 px-3 py-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'visual'
              ? 'border-[#D8163F] text-[#D8163F] font-bold shadow-sm'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          MODES & COLOR
        </button>
        <button
          onClick={() => setActiveTab('dsp')}
          className={`flex items-center gap-1.5 px-3 py-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'dsp'
              ? 'border-[#D8163F] text-[#D8163F] font-bold shadow-sm'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          REACTIVITY & FX
        </button>
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-1.5 px-3 py-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'branding'
              ? 'border-[#D8163F] text-[#D8163F] font-bold shadow-sm'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          BRANDING
        </button>
        <button
          onClick={() => setActiveTab('shader')}
          className={`flex items-center gap-1.5 px-3 py-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'shader'
              ? 'border-[#D8163F] text-[#D8163F] font-bold shadow-sm'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          GLSL
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
        {/* TAB 1: PRESETS */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <p className="font-ocra text-xs text-neutral-400 uppercase tracking-wider">
              OFFICIAL HENRY IX SOUNDSYSTEM PRESETS:
            </p>
            <div className="grid grid-cols-1 gap-3">
              {DEFAULT_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`p-4 rounded border transition-all cursor-pointer text-left ${
                    config.mode === preset.config.mode && config.palette.id === preset.config.palette.id
                      ? 'bg-[#D8163F]/15 border-[#D8163F] shadow-lg shadow-[#D8163F]/20'
                      : 'bg-neutral-950/70 hover:bg-neutral-900 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-avathe text-base tracking-wider text-white uppercase">{preset.name}</span>
                    <span className="font-ocra text-[9px] px-2 py-0.5 rounded bg-white/10 text-neutral-300 uppercase">
                      {preset.genreTag}
                    </span>
                  </div>
                  <p className="font-ocra text-xs text-neutral-400 line-clamp-2 leading-relaxed">{preset.description}</p>
                </div>
              ))}
            </div>

            {/* Export / Import Buttons */}
            <div className="pt-4 border-t border-white/10 flex items-center gap-3">
              <button
                onClick={handleExportPreset}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-white/10 font-ocra text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#D8163F]" />
                EXPORT
              </button>
              <input
                ref={presetImportRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportPreset}
              />
              <button
                onClick={() => presetImportRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-white/10 font-ocra text-xs font-semibold cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#E5A93C]" />
                IMPORT
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: VISUAL & COLORS */}
        {activeTab === 'visual' && (
          <div className="space-y-6">
            <div>
              <label className="block font-ocra text-xs font-bold text-neutral-300 uppercase tracking-wider mb-3">
                RENDERING ENGINE MODE
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { id: 'radial-spectrum', label: 'HENRY IX RADIAL PULSE', desc: 'Crisp 2D circular wave with central IX monogram' },
                  { id: 'cyber-tunnel', label: 'LONDON CLUB 3D TUNNEL', desc: 'Infinite high-speed polygonal wireframe flight' },
                  { id: 'particle-nebula', label: 'KVNGS ROYAL NEBULA', desc: '4,000 crimson & gold particle explosion vortex' },
                  { id: 'synthwave-terrain', label: 'UK BASSLINE GRID', desc: 'Undulating crimson wireframe mountain terrain' },
                  { id: 'glsl-warp', label: 'BERGHAIN GLSL WARP', desc: 'Hardware-accelerated redline raymarched shader' },
                ].map((modeItem) => (
                  <button
                    key={modeItem.id}
                    onClick={() => handleModeChange(modeItem.id as VisualizerMode)}
                    className={`w-full p-3.5 rounded text-left border transition-all cursor-pointer ${
                      config.mode === modeItem.id
                        ? 'bg-[#D8163F]/20 border-[#D8163F] text-white shadow-md shadow-[#D8163F]/20'
                        : 'bg-neutral-950/70 border-white/10 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="font-avathe text-sm tracking-wide text-white uppercase">{modeItem.label}</div>
                    <div className="font-ocra text-[11px] text-neutral-400 mt-1">{modeItem.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palettes */}
            <div>
              <label className="block font-ocra text-xs font-bold text-neutral-300 uppercase tracking-wider mb-3">
                HENRY IX COLOR PALETTES
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {COLOR_PALETTES.map((pal) => (
                  <button
                    key={pal.id}
                    onClick={() => handlePaletteSelect(pal.id)}
                    className={`p-3 rounded border text-left transition-all cursor-pointer flex items-center justify-between ${
                      config.palette.id === pal.id
                        ? 'bg-neutral-900 border-[#D8163F] ring-1 ring-[#D8163F]'
                        : 'bg-neutral-950/70 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="font-ocra text-xs font-bold text-white uppercase">{pal.name}</div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: pal.primary }} />
                      <span className="w-5 h-5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: pal.secondary }} />
                      <span className="w-5 h-5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: pal.accent }} />
                      <span className="w-5 h-5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: pal.background }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Wireframe toggle for 3D */}
            {config.mode !== 'radial-spectrum' && config.mode !== 'glsl-warp' && (
              <div className="flex items-center justify-between p-3.5 bg-neutral-950/80 rounded border border-white/10 font-ocra text-xs">
                <span className="font-semibold text-neutral-300 uppercase">3D WIREFRAME GEOMETRY</span>
                <input
                  type="checkbox"
                  checked={config.wireframe}
                  onChange={(e) => onChangeConfig({ ...config, wireframe: e.target.checked })}
                  className="w-4 h-4 accent-[#D8163F] cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REACTIVITY & DSP FX */}
        {activeTab === 'dsp' && (
          <div className="space-y-5 font-ocra">
            {/* Sensitivity */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-300 font-semibold uppercase">AUDIO SENSITIVITY</span>
                <span className="font-mono text-[#D8163F] font-bold">{config.sensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={config.sensitivity}
                onChange={(e) => onChangeConfig({ ...config, sensitivity: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-neutral-800 rounded-none appearance-none cursor-pointer accent-[#D8163F]"
              />
            </div>

            {/* FFT Smoothing */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-300 font-semibold uppercase">SPECTRUM SMOOTHING</span>
                <span className="font-mono text-[#D8163F] font-bold">{config.smoothing.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.95"
                step="0.02"
                value={config.smoothing}
                onChange={(e) => onChangeConfig({ ...config, smoothing: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-neutral-800 rounded-none appearance-none cursor-pointer accent-[#D8163F]"
              />
            </div>

            {/* Beat Threshold */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-300 font-semibold uppercase">BEAT DROP TRIGGER THRESHOLD</span>
                <span className="font-mono text-[#D8163F] font-bold">{config.beatThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.6"
                step="0.02"
                value={config.beatThreshold}
                onChange={(e) => onChangeConfig({ ...config, beatThreshold: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-neutral-800 rounded-none appearance-none cursor-pointer accent-[#D8163F]"
              />
            </div>

            {/* Speed Factor */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-300 font-semibold uppercase">TUNNEL / SCENE SPEED</span>
                <span className="font-mono text-[#D8163F] font-bold">{config.speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={config.speed}
                onChange={(e) => onChangeConfig({ ...config, speed: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-neutral-800 rounded-none appearance-none cursor-pointer accent-[#D8163F]"
              />
            </div>

            {/* Bloom Glow Intensity */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-300 font-semibold uppercase">REDLINE NEON BLOOM</span>
                <span className="font-mono text-[#D8163F] font-bold">{config.bloomIntensity.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.5"
                step="0.1"
                value={config.bloomIntensity}
                onChange={(e) => onChangeConfig({ ...config, bloomIntensity: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-neutral-800 rounded-none appearance-none cursor-pointer accent-[#D8163F]"
              />
            </div>

            {/* Toggle FX options */}
            <div className="pt-2 space-y-2.5">
              <div className="flex items-center justify-between p-3.5 bg-neutral-950/80 rounded border border-white/10">
                <div>
                  <div className="font-bold text-neutral-200 uppercase text-xs">CAMERA BASS SHAKE</div>
                  <div className="text-[10px] text-neutral-400">Vibrates viewport on 808 sub-bass drops</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.cameraShake}
                  onChange={(e) => onChangeConfig({ ...config, cameraShake: e.target.checked })}
                  className="w-4 h-4 accent-[#D8163F] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-neutral-950/80 rounded border border-white/10">
                <div>
                  <div className="font-bold text-neutral-200 uppercase text-xs">REDLINE DROP STROBE</div>
                  <div className="text-[10px] text-neutral-400">High-voltage flash on heavy beat drops</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.strobeOnDrop}
                  onChange={(e) => onChangeConfig({ ...config, strobeOnDrop: e.target.checked })}
                  className="w-4 h-4 accent-[#D8163F] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DJ BRANDING */}
        {activeTab === 'branding' && (
          <div className="space-y-4 font-ocra text-xs">
            <div className="flex items-center justify-between p-3.5 bg-neutral-950/80 rounded border border-white/10">
              <span className="font-bold text-neutral-200 uppercase">ENABLE BRANDING OVERLAY</span>
              <input
                type="checkbox"
                checked={branding.enabled}
                onChange={(e) => onChangeBranding({ ...branding, enabled: e.target.checked })}
                className="w-4 h-4 accent-[#D8163F] cursor-pointer"
              />
            </div>

            {/* DJ Name */}
            <div>
              <label className="block text-neutral-300 font-semibold uppercase mb-1.5">DJ / ARTIST NAME</label>
              <input
                type="text"
                value={branding.djName}
                onChange={(e) => onChangeBranding({ ...branding, djName: e.target.value })}
                placeholder="HENRY IX"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-white/10 rounded font-avathe text-sm text-white uppercase focus:border-[#D8163F] outline-none"
              />
            </div>

            {/* Mix Title */}
            <div>
              <label className="block text-neutral-300 font-semibold uppercase mb-1.5">MIX / EPISODE TITLE</label>
              <input
                type="text"
                value={branding.mixTitle}
                onChange={(e) => onChangeBranding({ ...branding, mixTitle: e.target.value })}
                placeholder="LONDON SESSIONS • VOL. 09"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-white/10 rounded text-xs text-white uppercase focus:border-[#D8163F] outline-none"
              />
            </div>

            {/* Show BPM badge */}
            <div className="flex items-center justify-between p-3.5 bg-neutral-950/80 rounded border border-white/10">
              <span className="font-bold text-neutral-200 uppercase">LIVE BPM COUNTER BADGE</span>
              <input
                type="checkbox"
                checked={branding.showBpm}
                onChange={(e) => onChangeBranding({ ...branding, showBpm: e.target.checked })}
                className="w-4 h-4 accent-[#D8163F] cursor-pointer"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-neutral-300 font-semibold uppercase mb-2">OVERLAY POSITION</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'bottom-left', label: 'BOTTOM LEFT' },
                  { id: 'bottom-center', label: 'BOTTOM CENTER' },
                  { id: 'top-left', label: 'TOP LEFT' },
                  { id: 'center', label: 'CENTER EMBLEM' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => onChangeBranding({ ...branding, position: pos.id as any })}
                    className={`p-2.5 rounded border text-center cursor-pointer transition-colors ${
                      branding.position === pos.id
                        ? 'bg-[#D8163F]/25 border-[#D8163F] text-white font-bold'
                        : 'bg-neutral-950/60 border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Logo / Emblem */}
            <div>
              <label className="block text-neutral-300 font-semibold uppercase mb-2">EMBLEM / COVER ARTWORK</label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-full overflow-hidden border border-[#D8163F] bg-black flex items-center justify-center">
                  <img src={branding.logoUrl || '/logo-ix.svg'} alt="Emblem" className="w-full h-full object-cover p-1" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onChangeBranding({ ...branding, logoUrl: '/logo-ix.svg' })}
                      className="px-2.5 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-white/10 text-[11px] cursor-pointer"
                    >
                      Use Official IX Logo
                    </button>
                    <button
                      onClick={() => onChangeBranding({ ...branding, logoUrl: '/cover.png' })}
                      className="px-2.5 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-white/10 text-[11px] cursor-pointer"
                    >
                      Use Cover Art
                    </button>
                  </div>
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] cursor-pointer"
                  >
                    Upload Custom Image...
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: GLSL SHADER CODE */}
        {activeTab === 'shader' && (
          <div className="space-y-3 font-ocra text-xs">
            <div className="text-neutral-400">
              Hardware-accelerated GLSL Fragment Shader. Audio uniforms are automatically bound:
              <code className="block mt-1.5 p-2 bg-neutral-950 border border-white/10 rounded text-[10px] text-[#D8163F]">
                u_time, u_bass, u_mid, u_treble, u_beat, u_beat_intensity, u_resolution, u_color_primary, u_color_secondary, u_color_accent
              </code>
            </div>

            <textarea
              value={customShaderText}
              onChange={(e) => setCustomShaderText(e.target.value)}
              className="w-full h-72 p-3 bg-black border border-white/15 rounded font-mono text-[11px] text-emerald-400 leading-relaxed outline-none focus:border-[#D8163F]"
              spellCheck={false}
            />

            <button
              onClick={handleApplyCustomShader}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded bg-[#D8163F] hover:bg-[#b01032] text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-[#D8163F]/30"
            >
              {shaderApplied ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              {shaderApplied ? 'SHADER COMPILED LIVE!' : 'COMPILE & APPLY LIVE SHADER'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

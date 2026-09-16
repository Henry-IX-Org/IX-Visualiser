import React, { useEffect, useState } from 'react';
import { DJBranding, AudioMetrics } from '../types/visualizer';
import { AudioEngine } from '../audio/AudioEngine';

interface DJBrandingOverlayProps {
  branding: DJBranding;
  audioEngine: AudioEngine;
  accentColor: string;
}

export const DJBrandingOverlay: React.FC<DJBrandingOverlayProps> = ({
  branding,
  audioEngine,
  accentColor,
}) => {
  const [metrics, setMetrics] = useState<AudioMetrics>({
    overall: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    frequencyData: new Uint8Array(0),
    timeDomainData: new Uint8Array(0),
    isBeat: false,
    beatIntensity: 0,
    bpm: 128,
  });

  useEffect(() => {
    let animId: number;
    const poll = () => {
      setMetrics(audioEngine.getMetrics());
      animId = requestAnimationFrame(poll);
    };
    animId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(animId);
  }, [audioEngine]);

  if (!branding.enabled) return null;

  const positionClasses = {
    'bottom-left': 'bottom-8 left-8 text-left items-start',
    'bottom-center': 'bottom-8 left-1/2 -translate-x-1/2 text-center items-center',
    'top-left': 'top-20 left-8 text-left items-start',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center items-center',
  }[branding.position] || 'bottom-left';

  const logoScale = 1.0 + metrics.bass * 0.16;
  const activeLogo = branding.logoUrl || '/logo-ix.svg';

  return (
    <div className={`pointer-events-none absolute z-20 flex flex-col gap-3 ${positionClasses} select-none transition-all duration-300`}>
      {/* Official IX Logo / Cover Art */}
      <div 
        className="relative rounded-full overflow-hidden border-2 transition-transform duration-75 flex items-center justify-center bg-black/90"
        style={{
          borderColor: accentColor || '#D8163F',
          transform: `scale(${logoScale})`,
          boxShadow: `0 0 28px ${accentColor || '#D8163F'}77`,
          width: branding.position === 'center' ? '128px' : '68px',
          height: branding.position === 'center' ? '128px' : '68px',
        }}
      >
        <img
          src={activeLogo}
          alt="Henry IX Emblem"
          className="w-full h-full object-cover p-1"
        />
      </div>

      {/* DJ Name and Mix Title with Henry IX Typography */}
      <div className="flex flex-col drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
        {branding.djName && (
          <h2 className="font-avathe text-3xl md:text-4xl tracking-widest text-white uppercase flex items-center gap-3 redline-glow">
            <span>{branding.djName}</span>
            {branding.showBpm && (
              <span 
                className="font-ocra text-xs font-bold px-2.5 py-0.5 rounded tracking-normal border"
                style={{
                  backgroundColor: 'rgba(216, 22, 63, 0.25)',
                  borderColor: '#D8163F',
                  color: '#FFFFFF',
                  boxShadow: metrics.isBeat ? '0 0 16px #D8163F' : 'none',
                }}
              >
                {metrics.bpm} BPM
              </span>
            )}
          </h2>
        )}
        {branding.mixTitle && (
          <p className="font-ocra text-xs md:text-sm tracking-widest text-neutral-300 uppercase mt-0.5">
            {branding.mixTitle}
          </p>
        )}
      </div>

      {/* Hardware Peak LED Meters */}
      <div className="flex items-center gap-2 mt-1 bg-black/85 backdrop-blur-xl px-2.5 py-1 rounded border border-[#D8163F]/30 shadow-lg">
        {/* Low */}
        <div className="flex items-center gap-1">
          <span className="font-ocra text-[7px] text-neutral-500 font-bold">L</span>
          <div className="w-12 h-1.5 bg-neutral-900 rounded-none overflow-hidden border border-white/10 flex">
            <div
              className="h-full transition-all duration-75"
              style={{
                width: `${Math.round(metrics.bass * 100)}%`,
                backgroundColor: metrics.bass > 0.8 ? '#D8163F' : '#E5A93C',
                boxShadow: metrics.bass > 0.8 ? '0 0 8px #D8163F' : 'none',
              }}
            />
          </div>
        </div>

        {/* Mid */}
        <div className="flex items-center gap-1">
          <span className="font-ocra text-[7px] text-neutral-500 font-bold">M</span>
          <div className="w-12 h-1.5 bg-neutral-900 rounded-none overflow-hidden border border-white/10 flex">
            <div
              className="h-full transition-all duration-75"
              style={{
                width: `${Math.round(metrics.mid * 100)}%`,
                backgroundColor: metrics.mid > 0.8 ? '#D8163F' : '#FFFFFF',
                boxShadow: metrics.mid > 0.8 ? '0 0 8px #D8163F' : 'none',
              }}
            />
          </div>
        </div>

        {/* Hi */}
        <div className="flex items-center gap-1">
          <span className="font-ocra text-[7px] text-neutral-500 font-bold">H</span>
          <div className="w-12 h-1.5 bg-neutral-900 rounded-none overflow-hidden border border-white/10 flex">
            <div
              className="h-full transition-all duration-75"
              style={{
                width: `${Math.round(metrics.treble * 100)}%`,
                backgroundColor: metrics.treble > 0.8 ? '#D8163F' : '#00F0FF',
                boxShadow: metrics.treble > 0.8 ? '0 0 8px #D8163F' : 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

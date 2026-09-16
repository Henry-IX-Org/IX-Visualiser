import { AudioMetrics, VisualizerConfig } from '../types/visualizer';

interface Particle2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

interface Shockwave {
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export class CanvasRadialVisualizer {
  private particles: Particle2D[] = [];
  private shockwaves: Shockwave[] = [];
  private rotationAngle = 0;

  constructor() {
    this.initParticles();
  }

  private initParticles(): void {
    this.particles = [];
    for (let i = 0; i < 140; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 2.5 + 0.8,
        alpha: Math.random() * 0.7 + 0.2,
        color: '#ffffff',
      });
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    metrics: AudioMetrics,
    config: VisualizerConfig
  ): void {
    const cx = width / 2;
    const cy = height / 2;
    const { palette, sensitivity, bloomIntensity, cameraShake, strobeOnDrop } = config;

    // Camera shake effect on bass kick
    let offsetX = 0;
    let offsetY = 0;
    if (cameraShake && metrics.beatIntensity > 0.25) {
      const shakeMag = metrics.beatIntensity * 16 * sensitivity;
      offsetX = (Math.random() - 0.5) * shakeMag;
      offsetY = (Math.random() - 0.5) * shakeMag;
    }

    ctx.save();
    ctx.translate(offsetX, offsetY);

    // Deep Pitch Black Void background
    ctx.fillStyle = palette.background;
    ctx.fillRect(-20, -20, width + 40, height + 40);

    // Strobe on heavy drop
    if (strobeOnDrop && metrics.isBeat && metrics.bass > 0.65) {
      ctx.fillStyle = `rgba(216, 22, 63, ${0.25 * metrics.bass})`;
      ctx.fillRect(0, 0, width, height);
    }

    // Trigger Shockwave on beat kick
    if (metrics.isBeat) {
      this.shockwaves.push({
        radius: Math.min(width, height) * 0.16,
        maxRadius: Math.max(width, height) * 0.7,
        alpha: 0.9,
        color: palette.primary,
      });
    }

    // Render Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += 9 + metrics.bass * 14;
      sw.alpha *= 0.93;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 3.5 * metrics.bass + 1.2;
      ctx.shadowBlur = 25 * bloomIntensity;
      ctx.shadowColor = sw.color;
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.stroke();
      ctx.restore();

      if (sw.alpha < 0.02 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Render Floating Particles (Henry IX Crimson & Gold dust)
    ctx.save();
    const particleSpeed = 1.0 + metrics.treble * 2.8;
    for (let idx = 0; idx < this.particles.length; idx++) {
      const p = this.particles[idx];
      p.x += p.vx * particleSpeed;
      p.y += p.vy * particleSpeed;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + metrics.mid * 1.5), 0, Math.PI * 2);
      const col = idx % 2 === 0 ? palette.primary : palette.accent;
      ctx.fillStyle = col;
      ctx.globalAlpha = p.alpha * (0.35 + metrics.treble * 0.65);
      ctx.shadowBlur = 8 * bloomIntensity;
      ctx.shadowColor = col;
      ctx.fill();
    }
    ctx.restore();

    // Central Pulsing Orb
    const baseRadius = Math.min(width, height) * 0.16;
    const pulseRadius = baseRadius + metrics.bass * 50 * sensitivity;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);

    const grad = ctx.createRadialGradient(cx, cy, pulseRadius * 0.15, cx, cy, pulseRadius);
    grad.addColorStop(0, 'rgba(216, 22, 63, 0.9)');
    grad.addColorStop(0.6, 'rgba(216, 22, 63, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.shadowBlur = 35 * bloomIntensity * (1 + metrics.bass);
    ctx.shadowColor = '#D8163F';
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.restore();

    // Inner Waveform Ring
    const timeData = metrics.timeDomainData;
    if (timeData.length > 0) {
      ctx.save();
      ctx.beginPath();
      const waveRadius = baseRadius * 0.78;
      const angleStep = (Math.PI * 2) / timeData.length;

      for (let i = 0; i < timeData.length; i++) {
        const v = (timeData[i] - 128) / 128.0;
        const r = waveRadius + v * 32 * sensitivity;
        const angle = i * angleStep;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = palette.accent || '#E5A93C';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 18 * bloomIntensity;
      ctx.shadowColor = palette.accent || '#E5A93C';
      ctx.globalAlpha = 0.95;
      ctx.stroke();
      ctx.restore();
    }

    // Central Iconic "IX" Monogram
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(baseRadius * 0.9 + metrics.bass * 18)}px 'Avathe', 'OCRA', sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = (20 + metrics.bass * 20) * bloomIntensity;
    ctx.shadowColor = '#D8163F';
    ctx.fillText('IX', cx, cy + 2);
    ctx.restore();

    // Radial Circular Spectrum Bars
    this.rotationAngle += 0.003 + metrics.overall * 0.009;
    const numBars = config.barCount || 72;
    const freqData = metrics.frequencyData;
    const barStep = (Math.PI * 2) / numBars;
    const maxBarHeight = Math.min(width, height) * 0.38;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotationAngle);

    for (let i = 0; i < numBars; i++) {
      const freqIndex = Math.floor((i / numBars) * (freqData.length * 0.65));
      const val = (freqData[freqIndex] || 0) / 255.0;
      const barHeight = Math.max(5, val * maxBarHeight * sensitivity);

      const angle = i * barStep;
      const startR = pulseRadius + 12;
      const endR = startR + barHeight;

      const x1 = Math.cos(angle) * startR;
      const y1 = Math.sin(angle) * startR;
      const x2 = Math.cos(angle) * endR;
      const y2 = Math.sin(angle) * endR;

      // Color interpolation: Crimson (primary) to White (secondary) to Imperial Gold (accent)
      const ratio = i / numBars;
      let barColor = palette.primary;
      if (ratio > 0.7) {
        barColor = palette.accent;
      } else if (ratio > 0.35) {
        barColor = palette.secondary;
      }

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = barColor;
      ctx.lineWidth = Math.max(2, (Math.PI * 2 * startR) / (numBars * 1.6));
      ctx.lineCap = 'round';
      ctx.shadowBlur = (14 + val * 12) * bloomIntensity;
      ctx.shadowColor = barColor;
      ctx.globalAlpha = 0.85 + val * 0.15;
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
  }
}

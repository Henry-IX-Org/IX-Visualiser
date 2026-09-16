import * as THREE from 'three';
import { AudioMetrics, VisualizerConfig } from '../types/visualizer';

export class ThreeParticleVisualizer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private points: THREE.Points | null = null;
  private particleCount: number;
  private originalPositions: Float32Array;
  private explosionVelocities: Float32Array;
  private currentDisplacements: Float32Array;
  private rotationAngle = 0;

  constructor(canvas: HTMLCanvasElement, count = 3500) {
    this.particleCount = count;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, canvas.width / canvas.height, 0.1, 1000);
    this.camera.position.set(0, 0, 45);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(canvas.width, canvas.height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.originalPositions = new Float32Array(count * 3);
    this.explosionVelocities = new Float32Array(count * 3);
    this.currentDisplacements = new Float32Array(count * 3);

    this.initParticles();
  }

  private initParticles(): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      // Spiral vortex distribution
      const theta = (i / this.particleCount) * Math.PI * 32;
      const radius = 2 + Math.pow(Math.random(), 1.5) * 22;
      const height = (Math.random() - 0.5) * 12;

      const x = Math.cos(theta) * radius;
      const y = Math.sin(theta) * radius * 0.7 + height;
      const z = (Math.random() - 0.5) * 15;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      this.originalPositions[i3] = x;
      this.originalPositions[i3 + 1] = y;
      this.originalPositions[i3 + 2] = z;

      // Normal radial direction for explosion
      const dist = Math.sqrt(x * x + y * y + z * z) || 1;
      this.explosionVelocities[i3] = (x / dist) * (Math.random() * 20 + 10);
      this.explosionVelocities[i3 + 1] = (y / dist) * (Math.random() * 20 + 10);
      this.explosionVelocities[i3 + 2] = (z / dist) * (Math.random() * 20 + 10);

      colors[i3] = 0.3;
      colors[i3 + 1] = 0.6;
      colors[i3 + 2] = 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public render(metrics: AudioMetrics, config: VisualizerConfig): void {
    const { palette, sensitivity, speed, cameraShake } = config;
    this.scene.background = new THREE.Color(palette.background);

    if (!this.points) return;

    this.rotationAngle += (0.005 + metrics.overall * 0.015) * speed;
    this.points.rotation.y = this.rotationAngle;
    this.points.rotation.x = Math.sin(this.rotationAngle * 0.5) * 0.2;

    const posAttr = this.points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.points.geometry.getAttribute('color') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const colors = colAttr.array as Float32Array;

    const primaryCol = new THREE.Color(palette.primary);
    const secondaryCol = new THREE.Color(palette.secondary);
    const accentCol = new THREE.Color(palette.accent);

    const freqData = metrics.frequencyData;
    const isBeatDrop = metrics.isBeat && metrics.bass > 0.6;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      // Frequency reactivity
      const freqIdx = Math.floor((i / this.particleCount) * (freqData.length * 0.7));
      const freqVal = ((freqData[freqIdx] || 0) / 255.0) * sensitivity;

      // Handle drop explosion
      if (isBeatDrop) {
        this.currentDisplacements[i3] = this.explosionVelocities[i3] * 0.8;
        this.currentDisplacements[i3 + 1] = this.explosionVelocities[i3 + 1] * 0.8;
        this.currentDisplacements[i3 + 2] = this.explosionVelocities[i3 + 2] * 0.8;
      } else {
        // Gravitational pull back to resting orbit
        this.currentDisplacements[i3] *= 0.88;
        this.currentDisplacements[i3 + 1] *= 0.88;
        this.currentDisplacements[i3 + 2] *= 0.88;
      }

      // Dynamic vertex position
      const pulseFactor = 1.0 + freqVal * 0.4;
      positions[i3] = this.originalPositions[i3] * pulseFactor + this.currentDisplacements[i3];
      positions[i3 + 1] = this.originalPositions[i3 + 1] * pulseFactor + this.currentDisplacements[i3 + 1];
      positions[i3 + 2] = this.originalPositions[i3 + 2] * pulseFactor + this.currentDisplacements[i3 + 2];

      // Dynamic color interpolation
      const c = new THREE.Color();
      if (i % 3 === 0) {
        c.lerpColors(primaryCol, accentCol, freqVal);
      } else {
        c.lerpColors(secondaryCol, primaryCol, freqVal);
      }

      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // Camera shake
    if (cameraShake && metrics.beatIntensity > 0.3) {
      const mag = metrics.beatIntensity * 1.5 * sensitivity;
      this.camera.position.x = (Math.random() - 0.5) * mag;
      this.camera.position.y = (Math.random() - 0.5) * mag;
    } else {
      this.camera.position.x = 0;
      this.camera.position.y = 0;
    }

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    if (this.points) {
      this.points.geometry.dispose();
      (this.points.material as THREE.Material).dispose();
    }
    this.renderer.dispose();
  }
}

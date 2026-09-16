import * as THREE from 'three';
import { AudioMetrics, VisualizerConfig } from '../types/visualizer';

export class ThreeTunnelVisualizer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private rings: THREE.LineSegments[] = [];
  private starParticles: THREE.Points | null = null;
  private readonly ringCount = 36;
  private readonly tunnelRadius = 8;
  private readonly ringSpacing = 4;
  private cameraZ = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(canvas.width, canvas.height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.initTunnel();
    this.initStarfield();
  }

  private initTunnel(): void {
    const polygonSegments = 8; // Octagonal tunnel
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];

    for (let i = 0; i < polygonSegments; i++) {
      const a1 = (i / polygonSegments) * Math.PI * 2;
      const a2 = ((i + 1) / polygonSegments) * Math.PI * 2;
      positions.push(
        Math.cos(a1) * this.tunnelRadius, Math.sin(a1) * this.tunnelRadius, 0,
        Math.cos(a2) * this.tunnelRadius, Math.sin(a2) * this.tunnelRadius, 0
      );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    for (let i = 0; i < this.ringCount; i++) {
      const material = new THREE.LineBasicMaterial({
        color: 0x00f3ff,
        linewidth: 2,
        transparent: true,
        opacity: 0.8,
      });
      const ring = new THREE.LineSegments(geometry, material);
      ring.position.z = -i * this.ringSpacing;
      this.scene.add(ring);
      this.rings.push(ring);
    }
  }

  private initStarfield(): void {
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 50;
      starPositions[i + 1] = (Math.random() - 0.5) * 50;
      starPositions[i + 2] = -Math.random() * (this.ringCount * this.ringSpacing);
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.2,
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
    });
    this.starParticles = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starParticles);
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public render(metrics: AudioMetrics, config: VisualizerConfig): void {
    const { palette, sensitivity, speed, cameraShake } = config;

    // Background color
    this.scene.background = new THREE.Color(palette.background);

    // Speed progression
    const forwardSpeed = (0.2 + metrics.bass * 0.5) * speed * sensitivity;
    this.cameraZ -= forwardSpeed;

    // Camera shake on heavy beat
    let shakeX = 0;
    let shakeY = 0;
    if (cameraShake && metrics.beatIntensity > 0.3) {
      const shakeMag = metrics.beatIntensity * 0.4 * sensitivity;
      shakeX = (Math.random() - 0.5) * shakeMag;
      shakeY = (Math.random() - 0.5) * shakeMag;
    }

    this.camera.position.set(shakeX, shakeY, this.cameraZ);

    const primaryColor = new THREE.Color(palette.primary);
    const secondaryColor = new THREE.Color(palette.secondary);
    const accentColor = new THREE.Color(palette.accent);

    // Loop and recycle rings
    const totalTunnelLength = this.ringCount * this.ringSpacing;
    const freqData = metrics.frequencyData;

    this.rings.forEach((ring, idx) => {
      // Recycle ring forward if camera has passed it
      if (ring.position.z > this.cameraZ) {
        ring.position.z -= totalTunnelLength;
      }

      // Audio distortion per ring
      const freqIdx = Math.floor((idx / this.ringCount) * (freqData.length * 0.5));
      const freqVal = ((freqData[freqIdx] || 0) / 255.0) * sensitivity;

      const scale = 1.0 + freqVal * 0.4 + (metrics.isBeat ? 0.2 : 0);
      ring.scale.set(scale, scale, 1);
      ring.rotation.z = idx * 0.05 + this.cameraZ * 0.005;

      const mat = ring.material as THREE.LineBasicMaterial;
      if (idx % 3 === 0) {
        mat.color.lerpColors(primaryColor, accentColor, freqVal);
      } else {
        mat.color.lerpColors(secondaryColor, primaryColor, freqVal);
      }
      mat.opacity = Math.min(1.0, 0.4 + freqVal * 0.6 + metrics.beatIntensity * 0.3);
    });

    // Animate starfield
    if (this.starParticles) {
      const posAttr = this.starParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;

      for (let i = 2; i < positions.length; i += 3) {
        if (positions[i] > this.cameraZ) {
          positions[i] -= totalTunnelLength;
        }
      }
      posAttr.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.rings.forEach((ring) => {
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
    });
    if (this.starParticles) {
      this.starParticles.geometry.dispose();
      (this.starParticles.material as THREE.Material).dispose();
    }
    this.renderer.dispose();
  }
}

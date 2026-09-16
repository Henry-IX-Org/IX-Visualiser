import * as THREE from 'three';
import { AudioMetrics, VisualizerConfig } from '../types/visualizer';

export class ThreeTerrainVisualizer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private terrain: THREE.Mesh | null = null;
  private sun: THREE.Mesh | null = null;
  private gridSegmentsX = 48;
  private gridSegmentsY = 48;
  private planeWidth = 60;
  private planeHeight = 60;
  private terrainOffset = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 1000);
    this.camera.position.set(0, 3, 14);
    this.camera.lookAt(0, 1.5, -20);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(canvas.width, canvas.height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.initTerrain();
    this.initSun();
  }

  private initTerrain(): void {
    const geometry = new THREE.PlaneGeometry(
      this.planeWidth,
      this.planeHeight,
      this.gridSegmentsX,
      this.gridSegmentsY
    );
    // Rotate plane to lie flat along the ground
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshBasicMaterial({
      color: 0xff007f,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });

    this.terrain = new THREE.Mesh(geometry, material);
    this.terrain.position.set(0, -1.5, -15);
    this.scene.add(this.terrain);
  }

  private initSun(): void {
    const sunGeo = new THREE.CircleGeometry(8, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xff7700,
      transparent: true,
      opacity: 0.9,
    });
    this.sun = new THREE.Mesh(sunGeo, sunMat);
    this.sun.position.set(0, 4, -40);
    this.scene.add(this.sun);
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public render(metrics: AudioMetrics, config: VisualizerConfig): void {
    const { palette, sensitivity, speed, cameraShake } = config;
    this.scene.background = new THREE.Color(palette.background);

    if (this.sun) {
      const sunMat = this.sun.material as THREE.MeshBasicMaterial;
      sunMat.color.set(palette.secondary);
      const sunPulse = 1.0 + metrics.bass * 0.25 * sensitivity;
      this.sun.scale.set(sunPulse, sunPulse, 1);
    }

    if (this.terrain) {
      const mat = this.terrain.material as THREE.MeshBasicMaterial;
      mat.color.set(palette.primary);

      this.terrainOffset += (0.05 + metrics.bass * 0.1) * speed;

      const posAttr = this.terrain.geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      const freqData = metrics.frequencyData;

      let idx = 0;
      for (let y = 0; y <= this.gridSegmentsY; y++) {
        for (let x = 0; x <= this.gridSegmentsX; x++) {
          const i3 = idx * 3;

          // Frequency modulation on the mountains (outer edges have higher mountains)
          const normX = (x / this.gridSegmentsX) * 2 - 1; // -1 to +1
          const distFromCenter = Math.abs(normX);

          const freqIdx = Math.floor((distFromCenter) * (freqData.length * 0.4));
          const freqVal = ((freqData[freqIdx] || 0) / 255.0) * sensitivity;

          // Perlin-style undulating waves
          const wave = Math.sin(y * 0.4 - this.terrainOffset) * Math.cos(x * 0.3);
          const height = Math.pow(distFromCenter, 1.8) * (wave * 2.5 + freqVal * 5.0 * sensitivity);

          // Y coordinate in 3D represents terrain height
          positions[i3 + 1] = height;

          idx++;
        }
      }
      posAttr.needsUpdate = true;
    }

    // Camera shake
    if (cameraShake && metrics.beatIntensity > 0.3) {
      const mag = metrics.beatIntensity * 0.3 * sensitivity;
      this.camera.position.x = (Math.random() - 0.5) * mag;
      this.camera.position.y = 3 + (Math.random() - 0.5) * mag;
    } else {
      this.camera.position.x = 0;
      this.camera.position.y = 3;
    }

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    if (this.terrain) {
      this.terrain.geometry.dispose();
      (this.terrain.material as THREE.Material).dispose();
    }
    if (this.sun) {
      this.sun.geometry.dispose();
      (this.sun.material as THREE.Material).dispose();
    }
    this.renderer.dispose();
  }
}

import { AudioMetrics, VisualizerConfig } from '../types/visualizer';

export const DEFAULT_FRAGMENT_SHADER = `
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_bass;
uniform float u_mid;
uniform float u_treble;
uniform float u_beat;
uniform float u_beat_intensity;
uniform vec3 u_color_primary;
uniform vec3 u_color_secondary;
uniform vec3 u_color_accent;

// 2D Rotation
mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  
  // Distortion based on bass and beat intensity
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);
  
  // Camera shake / warp
  uv *= rot(u_time * 0.2 + u_bass * 0.4);

  // Kaleidoscopic symmetry
  float sides = 6.0;
  angle = mod(angle, 6.28318 / sides) - 3.14159 / sides;
  vec2 p = vec2(cos(angle), sin(angle)) * dist;

  // Audio-reactive fractal ring iterations
  vec3 finalColor = vec3(0.0);
  float d = length(p);

  for (float i = 0.0; i < 4.0; i++) {
    p = abs(p) - (0.2 + u_bass * 0.3);
    p *= rot(u_time * 0.15 + i * 0.5);
    
    float ring = abs(sin(d * (10.0 + u_treble * 15.0) - u_time * 3.0));
    ring = 0.02 / max(0.001, ring);
    
    vec3 col = mix(u_color_primary, u_color_secondary, sin(u_time + i) * 0.5 + 0.5);
    col = mix(col, u_color_accent, u_beat_intensity);
    
    finalColor += col * ring * (0.4 + u_bass * 0.6);
  }

  // Shockwave ring on beat drop
  if (u_beat_intensity > 0.01) {
    float shockRadius = mod(u_time * 2.0, 1.5);
    float shockRing = abs(dist - shockRadius);
    if (shockRing < 0.05) {
      finalColor += u_color_accent * (1.0 - shockRing / 0.05) * u_beat_intensity * 1.5;
    }
  }

  // Vignette
  finalColor *= smoothstep(1.4, 0.2, dist);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export class ShaderGlslVisualizer {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private startTime = performance.now();
  private fragmentShaderSource = DEFAULT_FRAGMENT_SHADER;

  // Uniform locations
  private uTimeLoc: WebGLUniformLocation | null = null;
  private uResLoc: WebGLUniformLocation | null = null;
  private uBassLoc: WebGLUniformLocation | null = null;
  private uMidLoc: WebGLUniformLocation | null = null;
  private uTrebleLoc: WebGLUniformLocation | null = null;
  private uBeatLoc: WebGLUniformLocation | null = null;
  private uBeatIntensityLoc: WebGLUniformLocation | null = null;
  private uColPriLoc: WebGLUniformLocation | null = null;
  private uColSecLoc: WebGLUniformLocation | null = null;
  private uColAccLoc: WebGLUniformLocation | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl', { antialias: false, powerPreference: 'high-performance' });
    if (!this.gl) {
      console.error('WebGL not supported');
      return;
    }

    this.initProgram(this.fragmentShaderSource);
    this.initQuad();
  }

  public setCustomShader(shaderSource: string): boolean {
    return this.initProgram(shaderSource);
  }

  private initProgram(fragSrc: string): boolean {
    if (!this.gl) return false;

    const vertShader = this.compileShader(this.gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragSrc);

    if (!vertShader || !fragShader) return false;

    const prog = this.gl.createProgram();
    if (!prog) return false;

    this.gl.attachShader(prog, vertShader);
    this.gl.attachShader(prog, fragShader);
    this.gl.linkProgram(prog);

    if (!this.gl.getProgramParameter(prog, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(prog));
      return false;
    }

    this.program = prog;
    this.fragmentShaderSource = fragSrc;

    // Cache locations
    this.uTimeLoc = this.gl.getUniformLocation(prog, 'u_time');
    this.uResLoc = this.gl.getUniformLocation(prog, 'u_resolution');
    this.uBassLoc = this.gl.getUniformLocation(prog, 'u_bass');
    this.uMidLoc = this.gl.getUniformLocation(prog, 'u_mid');
    this.uTrebleLoc = this.gl.getUniformLocation(prog, 'u_treble');
    this.uBeatLoc = this.gl.getUniformLocation(prog, 'u_beat');
    this.uBeatIntensityLoc = this.gl.getUniformLocation(prog, 'u_beat_intensity');
    this.uColPriLoc = this.gl.getUniformLocation(prog, 'u_color_primary');
    this.uColSecLoc = this.gl.getUniformLocation(prog, 'u_color_secondary');
    this.uColAccLoc = this.gl.getUniformLocation(prog, 'u_color_accent');

    return true;
  }

  private compileShader(type: number, src: string): WebGLShader | null {
    if (!this.gl) return null;
    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, src);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private initQuad(): void {
    if (!this.gl) return;
    this.buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    // Full screen quad (-1 to 1)
    const positions = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
  }

  public resize(width: number, height: number): void {
    if (!this.gl) return;
    this.gl.viewport(0, 0, width, height);
  }

  public render(width: number, height: number, metrics: AudioMetrics, config: VisualizerConfig): void {
    if (!this.gl || !this.program) return;

    this.gl.useProgram(this.program);
    this.gl.viewport(0, 0, width, height);

    const time = (performance.now() - this.startTime) / 1000;

    // Set uniforms
    if (this.uTimeLoc) this.gl.uniform1f(this.uTimeLoc, time * config.speed);
    if (this.uResLoc) this.gl.uniform2f(this.uResLoc, width, height);
    if (this.uBassLoc) this.gl.uniform1f(this.uBassLoc, metrics.bass * config.sensitivity);
    if (this.uMidLoc) this.gl.uniform1f(this.uMidLoc, metrics.mid * config.sensitivity);
    if (this.uTrebleLoc) this.gl.uniform1f(this.uTrebleLoc, metrics.treble * config.sensitivity);
    if (this.uBeatLoc) this.gl.uniform1f(this.uBeatLoc, metrics.isBeat ? 1.0 : 0.0);
    if (this.uBeatIntensityLoc) this.gl.uniform1f(this.uBeatIntensityLoc, metrics.beatIntensity);

    // Color conversion from hex
    const pRGB = this.hexToRgb(config.palette.primary);
    const sRGB = this.hexToRgb(config.palette.secondary);
    const aRGB = this.hexToRgb(config.palette.accent);

    if (this.uColPriLoc) this.gl.uniform3f(this.uColPriLoc, pRGB[0], pRGB[1], pRGB[2]);
    if (this.uColSecLoc) this.gl.uniform3f(this.uColSecLoc, sRGB[0], sRGB[1], sRGB[2]);
    if (this.uColAccLoc) this.gl.uniform3f(this.uColAccLoc, aRGB[0], aRGB[1], aRGB[2]);

    // Bind vertices
    const aPos = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    this.gl.enableVertexAttribArray(aPos);
    this.gl.vertexAttribPointer(aPos, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  private hexToRgb(hex: string): [number, number, number] {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    const num = parseInt(clean, 16);
    return [
      ((num >> 16) & 255) / 255,
      ((num >> 8) & 255) / 255,
      (num & 255) / 255,
    ];
  }

  public dispose(): void {
    if (this.gl && this.buffer) {
      this.gl.deleteBuffer(this.buffer);
    }
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
    }
  }
}

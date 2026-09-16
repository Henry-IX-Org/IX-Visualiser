import { AudioMetrics, AudioSourceType } from '../types/visualizer';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private mediaStreamDest: MediaStreamAudioDestinationNode | null = null;

  // Audio source elements
  private audioElement: HTMLAudioElement | null = null;
  private mediaElementSource: MediaElementAudioSourceNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;

  // Demo synthesizer state
  private isSynthRunning: boolean = false;
  private synthInterval: number | null = null;

  // Analysis buffers
  private freqData: Uint8Array<ArrayBuffer> = new Uint8Array(0);
  private timeData: Uint8Array<ArrayBuffer> = new Uint8Array(0);

  // DSP Beat detection variables
  private bassHistory: number[] = [];
  private readonly historySize = 40;
  private beatIntensity = 0;
  private lastBeatTime = 0;
  private beatIntervals: number[] = [];
  private estimatedBpm = 126;

  // State
  private currentSource: AudioSourceType = 'file';
  private sensitivity = 1.2;
  private beatThreshold = 0.22;
  private trackDuration = 0;
  private isPlaying = false;
  private volume = 0.8;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
  }

  public async init(): Promise<void> {
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.82;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = this.volume;

    // Stream destination for video export recording
    this.mediaStreamDest = this.ctx.createMediaStreamDestination();

    // Connect gain -> destination (speakers) and -> mediaStreamDest (recorder)
    this.gainNode.connect(this.ctx.destination);
    this.gainNode.connect(this.mediaStreamDest);

    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeData = new Uint8Array(this.analyser.frequencyBinCount);

    // Setup HTML audio element for DJ mix streaming
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.preload = 'metadata';

    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      if (this.audioElement) {
        this.trackDuration = this.audioElement.duration || 0;
      }
    });

    this.mediaElementSource = this.ctx.createMediaElementSource(this.audioElement);
    this.mediaElementSource.connect(this.analyser);
    this.analyser.connect(this.gainNode);
  }

  public async resume(): Promise<void> {
    await this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public getMediaStreamDestination(): MediaStreamAudioDestinationNode | null {
    return this.mediaStreamDest;
  }

  public setSensitivity(val: number): void {
    this.sensitivity = Math.max(0.2, Math.min(3.0, val));
  }

  public setSmoothing(val: number): void {
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = Math.max(0.1, Math.min(0.95, val));
    }
  }

  public setBeatThreshold(val: number): void {
    this.beatThreshold = Math.max(0.05, Math.min(0.8, val));
  }

  public setVolume(val: number): void {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  // --- Audio Source 1: DJ Mix File ---
  public async loadFile(file: File): Promise<string> {
    await this.resume();
    this.stopSynth();
    this.disconnectMic();

    if (!this.audioElement) throw new Error('Audio element not ready');

    const objectUrl = URL.createObjectURL(file);
    this.audioElement.src = objectUrl;
    this.currentSource = 'file';
    
    await this.audioElement.load();
    await this.play();
    return file.name;
  }

  public async play(): Promise<void> {
    await this.resume();
    if (this.currentSource === 'file' && this.audioElement) {
      await this.audioElement.play();
      this.isPlaying = true;
    } else if (this.currentSource === 'synth') {
      this.startSynth();
      this.isPlaying = true;
    }
  }

  public pause(): void {
    if (this.currentSource === 'file' && this.audioElement) {
      this.audioElement.pause();
      this.isPlaying = false;
    } else if (this.currentSource === 'synth') {
      this.stopSynth();
      this.isPlaying = false;
    }
  }

  public seek(seconds: number): void {
    if (this.audioElement && Number.isFinite(seconds)) {
      this.audioElement.currentTime = Math.max(0, Math.min(this.audioElement.duration || 0, seconds));
    }
  }

  public getCurrentTime(): number {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }

  public getDuration(): number {
    return this.audioElement ? (this.audioElement.duration || this.trackDuration) : 0;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentSource(): AudioSourceType {
    return this.currentSource;
  }

  // --- Audio Source 2: Microphone / Line-in ---
  public async enableMicrophone(): Promise<boolean> {
    await this.resume();
    this.pause();
    this.stopSynth();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Microphone input is not supported in this environment.');
    }

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
        video: false,
      });

      if (!this.ctx || !this.analyser) return false;

      this.micSource = this.ctx.createMediaStreamSource(this.micStream);
      // Connect mic to analyser only (NOT to gainNode/destination to prevent acoustic feedback squeal!)
      this.micSource.connect(this.analyser);

      this.currentSource = 'mic';
      this.isPlaying = true;
      return true;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      throw err;
    }
  }

  public disconnectMic(): void {
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
  }

  // --- Audio Source 3: Built-in DJ Demo Synth Groove ---
  public async startDemoSynth(): Promise<void> {
    await this.resume();
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.disconnectMic();
    this.currentSource = 'synth';
    this.startSynth();
    this.isPlaying = true;
  }

  private startSynth(): void {
    if (this.isSynthRunning || !this.ctx || !this.analyser || !this.gainNode) return;
    this.isSynthRunning = true;

    // 128 BPM = 16th note every ~117ms
    const bpm = 128;
    const intervalMs = (60 / bpm / 4) * 1000;
    let step = 0;

    this.synthInterval = window.setInterval(() => {
      if (!this.ctx || !this.isSynthRunning || !this.analyser) return;

      const now = this.ctx.currentTime;

      // 4-on-the-floor Kick on beats 0, 4, 8, 12
      if (step % 4 === 0) {
        this.triggerSynthKick(now);
      }

      // Snare / Clap on beats 4, 12
      if (step % 8 === 4) {
        this.triggerSynthClap(now);
      }

      // Hi-hat on offbeats (2, 6, 10, 14)
      if (step % 2 === 1) {
        this.triggerSynthHihat(now);
      }

      // Rolling bassline
      if (step % 2 === 0 && step % 4 !== 0) {
        const bassFreq = [55, 65.41, 48.99, 58.27][Math.floor(step / 4) % 4];
        this.triggerSynthBass(now, bassFreq);
      }

      step = (step + 1) % 16;
    }, intervalMs);
  }

  public stopSynth(): void {
    this.isSynthRunning = false;
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  private triggerSynthKick(time: number): void {
    if (!this.ctx || !this.analyser || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const kickGain = this.ctx.createGain();

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.09);

    kickGain.gain.setValueAtTime(1.0, time);
    kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(kickGain);
    kickGain.connect(this.analyser);
    kickGain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  private triggerSynthClap(time: number): void {
    if (!this.ctx || !this.analyser || !this.gainNode) return;
    // Noise buffer for clap/snare
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 1.5;

    const clapGain = this.ctx.createGain();
    clapGain.gain.setValueAtTime(0.7, time);
    clapGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    noise.connect(filter);
    filter.connect(clapGain);
    clapGain.connect(this.analyser);
    clapGain.connect(this.gainNode);

    noise.start(time);
    noise.stop(time + 0.15);
  }

  private triggerSynthHihat(time: number): void {
    if (!this.ctx || !this.analyser || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;

    const hatGain = this.ctx.createGain();
    hatGain.gain.setValueAtTime(0.35, time);
    hatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    noise.connect(filter);
    filter.connect(hatGain);
    hatGain.connect(this.analyser);
    hatGain.connect(this.gainNode);

    noise.start(time);
    noise.stop(time + 0.05);
  }

  private triggerSynthBass(time: number, freq: number): void {
    if (!this.ctx || !this.analyser || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, time);
    filter.frequency.exponentialRampToValueAtTime(150, time + 0.2);

    const bassGain = this.ctx.createGain();
    bassGain.gain.setValueAtTime(0.5, time);
    bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(filter);
    filter.connect(bassGain);
    bassGain.connect(this.analyser);
    bassGain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + 0.22);
  }

  // --- Real-time Metrics & Beat Detection ---
  public getMetrics(): AudioMetrics {
    if (!this.analyser) {
      return {
        overall: 0,
        bass: 0,
        mid: 0,
        treble: 0,
        frequencyData: this.freqData,
        timeDomainData: this.timeData,
        isBeat: false,
        beatIntensity: 0,
        bpm: this.estimatedBpm,
      };
    }

    this.analyser.getByteFrequencyData(this.freqData);
    this.analyser.getByteTimeDomainData(this.timeData);

    const binCount = this.analyser.frequencyBinCount; // 512 bins (0 to ~22kHz)
    const nyquist = (this.ctx?.sampleRate || 44100) / 2;
    const hzPerBin = nyquist / binCount;

    // Bin ranges:
    // Bass: 20Hz - 250Hz
    const bassEndBin = Math.max(1, Math.floor(250 / hzPerBin));
    // Mid: 250Hz - 2500Hz
    const midEndBin = Math.max(bassEndBin + 1, Math.floor(2500 / hzPerBin));
    // Treble: 2500Hz - 16000Hz
    const trebleEndBin = Math.min(binCount - 1, Math.floor(16000 / hzPerBin));

    let bassSum = 0;
    for (let i = 0; i < bassEndBin; i++) {
      bassSum += this.freqData[i];
    }
    const rawBass = (bassSum / (bassEndBin * 255)) * this.sensitivity;
    const bass = Math.min(1.0, rawBass);

    let midSum = 0;
    for (let i = bassEndBin; i < midEndBin; i++) {
      midSum += this.freqData[i];
    }
    const rawMid = (midSum / ((midEndBin - bassEndBin) * 255)) * this.sensitivity;
    const mid = Math.min(1.0, rawMid);

    let trebleSum = 0;
    for (let i = midEndBin; i < trebleEndBin; i++) {
      trebleSum += this.freqData[i];
    }
    const rawTreble = (trebleSum / ((trebleEndBin - midEndBin) * 255)) * this.sensitivity;
    const treble = Math.min(1.0, rawTreble);

    // RMS overall
    let timeSum = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const normalized = (this.timeData[i] - 128) / 128;
      timeSum += normalized * normalized;
    }
    const rawOverall = Math.sqrt(timeSum / this.timeData.length) * this.sensitivity * 1.8;
    const overall = Math.min(1.0, rawOverall);

    // --- Dynamic Beat Detection ---
    let isBeat = false;
    const nowMs = performance.now();

    // Maintain running bass energy history
    this.bassHistory.push(bass);
    if (this.bassHistory.length > this.historySize) {
      this.bassHistory.shift();
    }

    const avgBass = this.bassHistory.reduce((a, b) => a + b, 0) / this.bassHistory.length;
    // Beat condition: current bass exceeds average by beatThreshold and minimum 180ms cooldown
    if (bass > 0.25 && bass > avgBass * (1.0 + this.beatThreshold) && (nowMs - this.lastBeatTime > 200)) {
      isBeat = true;
      const interval = nowMs - this.lastBeatTime;
      this.lastBeatTime = nowMs;
      this.beatIntensity = 1.0;

      // Calculate tempo if interval is within normal DJ tempo range (70 to 180 BPM => 333ms to 857ms)
      if (interval >= 300 && interval <= 900) {
        this.beatIntervals.push(interval);
        if (this.beatIntervals.length > 8) {
          this.beatIntervals.shift();
        }
        const avgInterval = this.beatIntervals.reduce((a, b) => a + b, 0) / this.beatIntervals.length;
        this.estimatedBpm = Math.round(60000 / avgInterval);
      }
    } else {
      // Exponential decay of beat intensity
      this.beatIntensity *= 0.88;
    }

    return {
      overall,
      bass,
      mid,
      treble,
      frequencyData: this.freqData,
      timeDomainData: this.timeData,
      isBeat,
      beatIntensity: this.beatIntensity,
      bpm: this.estimatedBpm,
    };
  }

  public cleanup(): void {
    this.stopSynth();
    this.disconnectMic();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

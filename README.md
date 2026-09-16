# DJ Mix Custom Music Visualiser Studio 🎵⚡

A high-performance, cross-platform audio-reactive visualiser studio engineered for DJ mixes, livestreams, and stage performances.

Targeted and optimized to run on:
- 🌐 **Web**: Deployed to **Cloudflare Workers** (with edge static assets)
- 💻 **Desktop**: **macOS** and **Windows** (via Electron standalone wrapper)
- 📱 **Mobile**: **iOS** and **Android** (via Capacitor native shells)

---

## 🚀 Key Features

### 🎧 DJ Mix Audio Reactivity Engine
- **Streaming Long-Mix Support**: Supports 1 to 3+ hour DJ sets without high memory usage via HTML5 Audio + `AudioContext.createMediaElementSource`.
- **Live Performance Input**: Low-latency microphone / DJ mixer audio interface line-in.
- **Built-in 128 BPM Techno Synth**: Instant 4-on-the-floor kick, bass, and hi-hat generator for testing without an external audio file.
- **Dynamic Beat & Drop Detection**: Energy thresholding algorithm with exponential decay to trigger bass kicks, camera shakes, and shockwaves.
- **FFT Spectrum Analysis**: Divided into Sub-Bass, Bass, Mid, and Treble frequency bands.

### 🎨 Modular Visualizer Creation Studio
- **5 Rendering Modes**:
  1. **2D Radial Spectrum & Pulse**: Circular audio waveform, mirrored spectrum bars, shockwave explosions, and ambient particles.
  2. **3D Cyber Tunnel**: Infinite high-speed polygonal wireframe flight with camera acceleration synced to audio energy.
  3. **3D Particle Nebula**: Celestial vortex of 4,000 particles that detonates into shockwaves on bass drops.
  4. **3D Retro Synthwave Grid**: Undulating audio-displaced mountain wireframes under a glowing 80s sun.
  5. **WebGL GLSL Warp**: Hardware-accelerated fragment shader raymarching with live code editing and audio uniform reactivity (`u_bass`, `u_mid`, `u_treble`, `u_beat`, `u_beat_intensity`, `u_time`).
- **Color Palettes**: Cyberpunk Neon, Acid Techno, 80s Synthwave, Liquid DnB, Aurora Borealis, Monochrome & Gold.
- **Live FX & DSP Tweaks**: Audio sensitivity multiplier, FFT smoothing, beat trigger sensitivity, speed factor, bloom glow, camera shake, strobe drops.
- **DJ Branding Overlay**: Custom avatar/logo watermark, DJ name, mix title, live BPM badge, and EQ level meters.
- **Preset Export & Import**: Save custom configurations as `.json` or share with other DJs.
- **60 FPS Video Recorder**: In-browser canvas + audio recording using `MediaRecorder` to download `.webm` / `.mp4` videos for social media.
- **Performance Fullscreen Mode**: Press `F` to enter borderless presentation mode with auto-hiding controls for projectors and OBS Studio capture.

---

## 🛠️ Quickstart (Development)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Navigate to `http://localhost:3000` in your browser.

---

## 🌐 Deploy to Cloudflare Workers (Web)

The project is configured with `wrangler.jsonc` and `worker.ts` for Cloudflare Workers Static Assets:

```bash
# 1. Build production bundle
npm run build

# 2. Deploy directly to your Cloudflare account
npx wrangler deploy
```

---

## 💻 Run Desktop App (macOS & Windows)

The project includes an Electron desktop wrapper configured in `electron/main.cjs` with GPU hardware acceleration flags.

```bash
# Run desktop app locally
npm run desktop
```

To package standalone installers (`.dmg` / `.app` on macOS, `.exe` on Windows):
```bash
npx electron-builder
```

---

## 📱 Build for Mobile (iOS & Android)

The app is powered by Capacitor with hardware acceleration and responsive touch controls.

```bash
# 1. Build the web app and copy assets
npm run build
npx cap copy

# 2. Add native iOS or Android projects (one time)
npm run cap:add:ios
npm run cap:add:android

# 3. Open in Xcode or Android Studio to test on physical devices or emulators
npm run cap:open:ios
npm run cap:open:android
```

---

## ⌨️ Live DJ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause Audio |
| `F` | Toggle Fullscreen Performance Mode |
| `S` | Open / Close Visualiser Studio Drawer |
| `1` - `5` | Switch Visualiser Presets / Modes |

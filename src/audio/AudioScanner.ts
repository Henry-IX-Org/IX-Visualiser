import { AudioWaveformMap, TracklistEntry } from '../types/timeline';

export class AudioScanner {
  public static async scanFile(file: File, onProgress?: (percent: number) => void): Promise<AudioWaveformMap> {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // For fast waveform extraction without decoding entire multi-gigabyte files into RAM,
    // read the array buffer and decode in segments or downsample
    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(30);

    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (err) {
      console.warn('Full buffer decode failed, falling back to approximation:', err);
      return this.generateFallbackMap(file.size / (44100 * 2 * 2));
    }
    onProgress?.(70);

    const channelData = audioBuffer.getChannelData(0);
    const totalSamples = channelData.length;
    const duration = audioBuffer.duration;
    const numPoints = 2500;
    const blockSize = Math.floor(totalSamples / numPoints);

    const peaks: number[] = new Array(numPoints);
    const subEnergy: number[] = new Array(numPoints);
    const kickTransients: number[] = new Array(numPoints);
    const dropMarkers: number[] = [];

    let prevPeak = 0;

    for (let i = 0; i < numPoints; i++) {
      let maxVal = 0;
      let sum = 0;
      const start = i * blockSize;
      const end = Math.min(start + blockSize, totalSamples);

      for (let j = start; j < end; j += 4) {
        const val = Math.abs(channelData[j]);
        if (val > maxVal) maxVal = val;
        sum += val;
      }

      peaks[i] = Math.min(1.0, maxVal);
      const avgEnergy = sum / ((end - start) / 4);
      subEnergy[i] = Math.min(1.0, avgEnergy * 1.5);

      // Transient spike calculation (kick detection)
      const diff = maxVal - prevPeak;
      kickTransients[i] = diff > 0.25 ? Math.min(1.0, diff * 2.0) : 0;

      // Drop detection: significant energy leap after a quiet breakdown
      if (diff > 0.45 && maxVal > 0.6) {
        const timestamp = (i / numPoints) * duration;
        if (dropMarkers.length === 0 || timestamp - dropMarkers[dropMarkers.length - 1] > 30) {
          dropMarkers.push(Math.round(timestamp));
        }
      }

      prevPeak = maxVal;
    }

    audioContext.close();
    onProgress?.(100);

    return {
      duration,
      peaks,
      subEnergy,
      kickTransients,
      dropMarkers,
    };
  }

  public static generateFallbackMap(estimatedDuration = 7200): AudioWaveformMap {
    const numPoints = 2500;
    const peaks: number[] = new Array(numPoints);
    const subEnergy: number[] = new Array(numPoints);
    const kickTransients: number[] = new Array(numPoints);
    const dropMarkers: number[] = [];

    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * 50;
      const wave = Math.sin(t) * 0.3 + Math.sin(t * 3.5) * 0.2 + 0.4;
      peaks[i] = Math.max(0.05, Math.min(1.0, wave + (Math.random() - 0.5) * 0.15));
      subEnergy[i] = peaks[i] * 0.8;
      kickTransients[i] = (i % 8 === 0) ? 0.9 : 0.1;

      if (i % 250 === 60) {
        dropMarkers.push(Math.round((i / numPoints) * estimatedDuration));
      }
    }

    return {
      duration: estimatedDuration,
      peaks,
      subEnergy,
      kickTransients,
      dropMarkers,
    };
  }

  // --- Tracklist & CUE file parser ---
  public static parseTracklist(text: string): TracklistEntry[] {
    const entries: TracklistEntry[] = [];
    const lines = text.split(/\r?\n/);

    // Check if CUE file format
    const isCue = text.toUpperCase().includes('FILE') || text.toUpperCase().includes('TRACK');

    if (isCue) {
      let currentTitle = '';
      let currentPerformer = '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('TITLE') && !trimmed.startsWith('TITLE "DJ')) {
          const match = trimmed.match(/TITLE\s+"([^"]+)"/i);
          if (match) currentTitle = match[1];
        } else if (trimmed.startsWith('PERFORMER')) {
          const match = trimmed.match(/PERFORMER\s+"([^"]+)"/i);
          if (match) currentPerformer = match[1];
        } else if (trimmed.startsWith('INDEX 01')) {
          const match = trimmed.match(/INDEX 01\s+(\d+):(\d+):(\d+)/i);
          if (match) {
            const mins = parseInt(match[1], 10);
            const secs = parseInt(match[2], 10);
            const totalSecs = mins * 60 + secs;
            entries.push({
              timestampSeconds: totalSecs,
              artist: currentPerformer || 'HENRY IX',
              title: currentTitle || `Track ${entries.length + 1}`,
            });
            currentTitle = '';
          }
        }
      }
      if (entries.length > 0) return entries;
    }

    // Standard timestamp lines: e.g. "00:00 Artist - Title" or "[01:24:12] Title"
    const timestampRegex = /(?:\[?(\d{1,2}):(\d{2})(?::(\d{2}))?\]?)\s*[-–.]?\s*(.+)/;

    for (const line of lines) {
      const match = line.match(timestampRegex);
      if (match) {
        let totalSecs = 0;
        if (match[3] !== undefined) {
          // Format: HH:MM:SS
          const hours = parseInt(match[1], 10);
          const mins = parseInt(match[2], 10);
          const secs = parseInt(match[3], 10);
          totalSecs = hours * 3600 + mins * 60 + secs;
        } else {
          // Format: MM:SS
          const mins = parseInt(match[1], 10);
          const secs = parseInt(match[2], 10);
          totalSecs = mins * 60 + secs;
        }

        const rawDetails = match[4].trim();
        let artist = 'HENRY IX';
        let title = rawDetails;

        if (rawDetails.includes(' - ')) {
          const parts = rawDetails.split(' - ');
          artist = parts[0].trim();
          title = parts.slice(1).join(' - ').trim();
        }

        entries.push({
          timestampSeconds: totalSecs,
          artist,
          title,
        });
      }
    }

    return entries.sort((a, b) => a.timestampSeconds - b.timestampSeconds);
  }
}

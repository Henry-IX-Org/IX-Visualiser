import React, { useState, useRef, useEffect } from 'react';
import { X, Video, Download, Disc3, Zap, Radio, Check, AlertCircle } from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { WebCodecsExporter, RenderProgress } from '../export/WebCodecsExporter';
import { TimelineClip, AspectRatio, AudioWaveformMap } from '../types/timeline';
import { Tooltip } from './common/Tooltip';

interface VideoRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvas: HTMLCanvasElement | null;
  audioEngine: AudioEngine;
  trackTitle: string;
  duration: number;
  clips: TimelineClip[];
  aspectRatio: AspectRatio;
  waveformMap: AudioWaveformMap | null;
}

export const VideoRecorderModal: React.FC<VideoRecorderModalProps> = ({
  isOpen,
  onClose,
  canvas,
  audioEngine,
  trackTitle,
  duration,
  clips,
  aspectRatio,
  waveformMap,
}) => {
  const [exportTab, setExportTab] = useState<'fast-mp4' | 'live-vj'>('fast-mp4');

  // Fast WebCodecs State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<RenderProgress | null>(null);
  const [exportedMp4Url, setExportedMp4Url] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Live Real-Time State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  // --- Fast WebCodecs MP4 Export ---
  const startFastExport = async () => {
    if (!canvas) {
      alert('Canvas viewport not initialized');
      return;
    }

    try {
      setIsExporting(true);
      setExportedMp4Url(null);
      setExportProgress(null);

      abortControllerRef.current = new AbortController();

      // Render duration: either full mix duration, or at least 15 seconds if zero
      const renderDuration = Math.max(15, duration || 120);

      const mp4Blob = await WebCodecsExporter.renderToMP4(
        canvas,
        renderDuration,
        aspectRatio,
        clips,
        waveformMap,
        (progress) => setExportProgress(progress),
        abortControllerRef.current.signal
      );

      const url = URL.createObjectURL(mp4Blob);
      setExportedMp4Url(url);
      setIsExporting(false);
    } catch (err: any) {
      if (err.message !== 'Export canceled by user.') {
        console.error('Fast MP4 Export failed:', err);
        alert('Fast export encountered an error: ' + err.message);
      }
      setIsExporting(false);
    }
  };

  const cancelFastExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // --- Live Real-time Recording ---
  const startLiveRecording = () => {
    if (!canvas) return;

    try {
      recordedChunksRef.current = [];
      setRecordedBlobUrl(null);
      setRecordingDuration(0);

      const videoStream = canvas.captureStream(60);
      const audioDest = audioEngine.getMediaStreamDestination();
      const combinedStream = new MediaStream();

      videoStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
      if (audioDest && audioDest.stream.getAudioTracks().length > 0) {
        audioDest.stream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
      }

      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 9000000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        setRecordedBlobUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 500);

      if (!audioEngine.getIsPlaying()) {
        audioEngine.play();
      }
    } catch (err: any) {
      alert('Unable to start live recording: ' + err.message);
    }
  };

  const stopLiveRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-black border border-[#D8163F]/40 rounded-xl p-6 shadow-2xl">
        <Tooltip text="Close" position="left">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded bg-[#D8163F]/20 text-[#D8163F] border border-[#D8163F]/40">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-avathe text-lg tracking-wider text-white uppercase redline-glow">
              EXPORT VIDEO
            </h3>
            <p className="font-ocra text-[11px] text-neutral-400">
              {aspectRatio} • 1080p
            </p>
          </div>
        </div>

        {/* Export Mode Tabs */}
        <div className="flex border-b border-white/10 mb-4 font-ocra text-xs">
          <button
            onClick={() => setExportTab('fast-mp4')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 border-b-2 font-bold transition-all cursor-pointer ${
              exportTab === 'fast-mp4'
                ? 'border-[#D8163F] text-[#D8163F]'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Fast MP4
          </button>
          <button
            onClick={() => setExportTab('live-vj')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 border-b-2 font-bold transition-all cursor-pointer ${
              exportTab === 'live-vj'
                ? 'border-[#D8163F] text-[#D8163F]'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Live Record
          </button>
        </div>

        {/* TAB 1: Fast Background MP4 Export */}
        {exportTab === 'fast-mp4' && (
          <div className="space-y-4 font-ocra text-xs">
            {/* Status box */}
            <div className="p-4 rounded bg-neutral-950 border border-white/10 flex flex-col items-center justify-center gap-3">
              {isExporting && exportProgress ? (
                <div className="w-full flex flex-col gap-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-[#D8163F] animate-pulse">Rendering...</span>
                    <span className="text-white text-sm">{exportProgress.percent}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-[#D8163F] via-[#E5A93C] to-[#D8163F] transition-all duration-150"
                      style={{ width: `${exportProgress.percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                    <span>Frame: {exportProgress.currentFrame}/{exportProgress.totalFrames}</span>
                    <span>{exportProgress.fps} FPS</span>
                    <span>ETA: {exportProgress.etaSeconds}s</span>
                  </div>
                </div>
              ) : exportedMp4Url ? (
                <div className="flex flex-col items-center gap-1 text-emerald-400 font-bold py-2">
                  <Check className="w-6 h-6 text-emerald-400" />
                  <span className="text-xs">Render Complete</span>
                </div>
              ) : (
                <div className="text-neutral-400 text-center text-xs py-2">
                  High-speed background hardware render (H.264 MP4).
                </div>
              )}
            </div>

            {/* Actions */}
            {isExporting ? (
              <button
                onClick={cancelFastExport}
                className="w-full py-2.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
            ) : exportedMp4Url ? (
              <a
                href={exportedMp4Url}
                download={`${trackTitle || 'henry-ix-mix'}-${aspectRatio.replace(':', 'x')}.mp4`}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                <Download className="w-4 h-4" />
                Download MP4
              </a>
            ) : (
              <button
                onClick={startFastExport}
                className="w-full py-2.5 rounded bg-[#D8163F] hover:bg-[#b01032] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#D8163F]/40 transition-all cursor-pointer"
              >
                Export MP4
              </button>
            )}
          </div>
        )}

        {/* TAB 2: Live Real-time VJ Capture */}
        {exportTab === 'live-vj' && (
          <div className="space-y-4 font-ocra text-xs">
            <div className="p-4 rounded bg-neutral-950 border border-white/10 flex flex-col items-center justify-center gap-2">
              {isRecording ? (
                <div className="flex flex-col items-center gap-1.5 py-1">
                  <div className="flex items-center gap-1.5 text-[#D8163F] font-bold text-xs tracking-wider animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#D8163F] animate-ping" />
                    Recording
                  </div>
                  <div className="text-3xl font-bold font-mono text-white tracking-widest mt-0.5">
                    {formatSeconds(recordingDuration)}
                  </div>
                </div>
              ) : recordedBlobUrl ? (
                <div className="flex flex-col items-center gap-1 text-emerald-400 font-bold py-2">
                  <Disc3 className="w-6 h-6 text-[#D8163F] animate-spin" />
                  <span>Done ({formatSeconds(recordingDuration)})</span>
                </div>
              ) : (
                <div className="text-neutral-400 text-center text-xs py-2">
                  Real-time live session capture with manual tweaks.
                </div>
              )}
            </div>

            {isRecording ? (
              <button
                onClick={stopLiveRecording}
                className="w-full py-2.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/40 transition-all cursor-pointer"
              >
                Stop
              </button>
            ) : recordedBlobUrl ? (
              <a
                href={recordedBlobUrl}
                download={`${trackTitle || 'henry-ix-live'}-capture.webm`}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                <Download className="w-4 h-4" />
                Download WebM
              </a>
            ) : (
              <button
                onClick={startLiveRecording}
                className="w-full py-2.5 rounded bg-[#D8163F] hover:bg-[#b01032] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#D8163F]/40 transition-all cursor-pointer"
              >
                Record
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

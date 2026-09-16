import React, { useState, useRef, useEffect } from 'react';
import { X, Video, Download, Disc3 } from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';

interface VideoRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvas: HTMLCanvasElement | null;
  audioEngine: AudioEngine;
  trackTitle: string;
}

export const VideoRecorderModal: React.FC<VideoRecorderModalProps> = ({
  isOpen,
  onClose,
  canvas,
  audioEngine,
  trackTitle,
}) => {
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

  const startRecording = () => {
    if (!canvas) {
      alert('Visualizer canvas is not ready for recording.');
      return;
    }

    try {
      recordedChunksRef.current = [];
      setRecordedBlobUrl(null);
      setRecordingDuration(0);

      // 1. Capture 60 FPS video stream from canvas
      const videoStream = canvas.captureStream(60);

      // 2. Get audio stream from Web Audio engine
      const audioDest = audioEngine.getMediaStreamDestination();
      const combinedStream = new MediaStream();

      videoStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));

      if (audioDest && audioDest.stream.getAudioTracks().length > 0) {
        audioDest.stream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
      }

      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }

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
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);
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
    } catch (err) {
      console.error('Error starting video recording:', err);
      alert('Unable to record video: ' + (err as Error).message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-black border border-[#D8163F]/40 rounded-xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded bg-[#D8163F]/20 text-[#D8163F] border border-[#D8163F]/40">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-avathe text-lg tracking-wider text-white uppercase redline-glow">
              RENDER 60 FPS VIDEO
            </h3>
            <p className="font-ocra text-xs text-neutral-400 mt-0.5">High-definition export synced with mix audio</p>
          </div>
        </div>

        {/* Status display */}
        <div className="my-6 p-5 rounded bg-neutral-950 border border-white/10 flex flex-col items-center justify-center gap-2 font-ocra">
          {isRecording ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-[#D8163F] font-bold text-xs tracking-widest animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D8163F] animate-ping" />
                RECORDING AUDIO & 60FPS GRAPHICS
              </div>
              <div className="text-4xl font-bold font-mono text-white tracking-widest mt-1">
                {formatDuration(recordingDuration)}
              </div>
            </div>
          ) : recordedBlobUrl ? (
            <div className="flex flex-col items-center gap-2 text-emerald-400 font-bold text-xs tracking-wider">
              <Disc3 className="w-8 h-8 text-[#D8163F] animate-spin" />
              <span>RECORDING READY ({formatDuration(recordingDuration)})</span>
            </div>
          ) : (
            <div className="text-neutral-400 text-xs text-center leading-relaxed">
              Captures canvas visuals and high-fidelity DJ mix audio directly into a ready-to-share video for YouTube and Instagram.
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 font-ocra">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="w-full py-3 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/40 transition-all cursor-pointer"
            >
              STOP & SAVE RECORDING
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="w-full py-3 rounded bg-[#D8163F] hover:bg-[#b01032] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#D8163F]/40 transition-all cursor-pointer"
            >
              START 60 FPS RECORDING
            </button>
          )}

          {recordedBlobUrl && (
            <a
              href={recordedBlobUrl}
              download={`${trackTitle || 'henry-ix-visualizer'}-render.webm`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              <Download className="w-4 h-4" />
              DOWNLOAD VIDEO (.WEBM)
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

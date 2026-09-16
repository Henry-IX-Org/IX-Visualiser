import React, { useState } from 'react';
import { X, FileText, Upload, Sparkles, Check } from 'lucide-react';
import { AudioScanner } from '../../audio/AudioScanner';
import { TracklistEntry } from '../../types/timeline';
import { Tooltip } from '../common/Tooltip';

interface TracklistImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTracklist: (entries: TracklistEntry[]) => void;
}

export const TracklistImportModal: React.FC<TracklistImportModalProps> = ({
  isOpen,
  onClose,
  onApplyTracklist,
}) => {
  const [tracklistText, setTracklistText] = useState(
`00:00 HENRY IX - WOST - APRICOT
04:15 HENRY IX - MILKSHAKE (WATTO EDIT)
08:30 HENRY IX - DRIVER UNKNOWN
12:45 HENRY IX - CVNTS - TOO MANY MEN
17:00 HENRY IX - Charli XCX - 365 (JERSEY CLUB REMIX)
21:20 HENRY IX - Left to Right (Nomad Edit)
25:40 HENRY IX - RATATA!
30:10 HENRY IX - M.I.A - BAD GIRLS (Goonter Edit)`
  );

  const [parsedTracks, setParsedTracks] = useState<TracklistEntry[]>(() => 
    AudioScanner.parseTracklist(tracklistText)
  );

  if (!isOpen) return null;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTracklistText(val);
    setParsedTracks(AudioScanner.parseTracklist(val));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTracklistText(content);
      setParsedTracks(AudioScanner.parseTracklist(content));
    };
    reader.readAsText(file);
  };

  const handleApply = () => {
    if (parsedTracks.length === 0) {
      alert('No valid timestamped tracks found. Please use format: "00:00 Artist - Title"');
      return;
    }
    onApplyTracklist(parsedTracks);
    onClose();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const h = Math.floor(m / 60);
    if (h > 0) {
      return `${h}:${(m % 60).toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-black border border-[#D8163F]/40 rounded-xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <Tooltip text="Close" position="left">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </Tooltip>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded bg-[#D8163F]/20 text-[#D8163F] border border-[#D8163F]/40">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-avathe text-lg tracking-wider text-white uppercase redline-glow">
              TRACKLIST IMPORT
            </h3>
            <p className="font-ocra text-[11px] text-neutral-400">
              Auto-slice scenes from timestamps or CUE
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 mb-4">
          {/* Input text */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-ocra text-xs font-bold text-neutral-300 uppercase">Tracklist</span>
              <label className="flex items-center gap-1 font-ocra text-[10px] text-[#D8163F] hover:underline cursor-pointer">
                <Upload className="w-3 h-3" />
                Upload CUE
                <input type="file" accept=".cue,.txt" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <textarea
              value={tracklistText}
              onChange={handleTextChange}
              placeholder="00:00 Artist - Title&#10;04:15 Artist - Title..."
              className="flex-1 w-full p-3 bg-neutral-950 border border-white/10 rounded font-mono text-xs text-neutral-200 outline-none focus:border-[#D8163F] resize-none"
              spellCheck={false}
            />
          </div>

          {/* Parsed Preview */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between font-ocra text-xs">
              <span className="font-bold text-neutral-300 uppercase">Scenes</span>
              <span className="px-1.5 py-0.5 rounded bg-[#D8163F]/20 text-[#D8163F] font-bold text-[10px]">
                {parsedTracks.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 bg-neutral-950/80 border border-white/10 rounded space-y-2">
              {parsedTracks.length === 0 ? (
                <div className="text-center text-neutral-500 font-ocra text-xs py-8">
                  No timestamped tracks recognized.
                </div>
              ) : (
                parsedTracks.map((tr, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-2 bg-neutral-900/60 rounded border border-white/5 font-ocra text-xs">
                    <span className="font-bold text-[#E5A93C] w-12 text-right">{formatTime(tr.timestampSeconds)}</span>
                    <div className="flex-1 truncate">
                      <span className="font-bold text-white">{tr.title}</span>
                      {tr.artist && <span className="text-neutral-400 ml-1.5 font-normal">({tr.artist})</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-2 font-ocra">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <Tooltip text="Slice timeline into scenes" position="top">
            <button
              onClick={handleApply}
              disabled={parsedTracks.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#D8163F] hover:bg-[#b01032] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-[#D8163F]/30 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Import ({parsedTracks.length})
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

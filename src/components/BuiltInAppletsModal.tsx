import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Cpu,
  Delete,
  Pause,
  Phone,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { AndroidBridgeCapabilities, BuiltInAppletId } from '../types/launcher';

interface BuiltInAppletsModalProps {
  appletId: BuiltInAppletId | null;
  capabilities: AndroidBridgeCapabilities;
  installedCount: number;
  onClose: () => void;
}

export const BuiltInAppletsModal: React.FC<BuiltInAppletsModalProps> = ({
  appletId,
  capabilities,
  installedCount,
  onClose,
}) => {
  if (!appletId) return null;

  const titles: Record<BuiltInAppletId, string> = {
    calculator: 'Calculator',
    notes: 'Notes',
    'clock-timer': 'Clock & Stopwatch',
    dialer: 'Phone Dialer',
    camera: 'Camera Viewfinder',
    'system-inspector': 'Device Inspector',
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={titles[appletId]}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-zinc-950 border border-white/15 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-base font-semibold text-white tracking-tight">
            {titles[appletId]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {appletId === 'calculator' && <CalculatorApplet />}
          {appletId === 'notes' && <NotesApplet />}
          {appletId === 'clock-timer' && <StopwatchApplet />}
          {appletId === 'dialer' && <DialerApplet />}
          {appletId === 'camera' && <CameraApplet />}
          {appletId === 'system-inspector' && (
            <SystemInspectorApplet
              capabilities={capabilities}
              installedCount={installedCount}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const CalculatorApplet: React.FC = () => {
  const [expr, setExpr] = useState('0');
  const [lastResult, setLastResult] = useState<string | null>(null);

  const press = (val: string) => {
    if (val === 'C') {
      setExpr('0');
      setLastResult(null);
      return;
    }
    if (val === '=') {
      try {
        const sanitized = expr.replace(/[^0-9+\-*/().% ]/g, '');
        // Safe arithmetic evaluation using Function on strictly sanitized expression
        const res = Function(`"use strict"; return (${sanitized})`)();
        const formatted = Number.isFinite(res) ? String(Number(res.toFixed(8))) : 'Error';
        setLastResult(expr);
        setExpr(formatted);
      } catch {
        setExpr('Error');
      }
      return;
    }
    setExpr((prev) => (prev === '0' || prev === 'Error' ? val : prev + val));
  };

  const keys = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'];

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-black border border-white/10 text-right">
        <div className="text-xs font-mono-tabular text-zinc-500 h-4">
          {lastResult || ''}
        </div>
        <div className="text-3xl font-mono-tabular font-light text-white truncate mt-1">
          {expr}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => press('C')}
          className="col-span-2 min-h-[48px] rounded-2xl bg-zinc-900 border border-white/10 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => setExpr((p) => (p.length > 1 ? p.slice(0, -1) : '0'))}
          aria-label="Backspace"
          className="min-h-[48px] rounded-2xl bg-zinc-900 border border-white/10 text-zinc-200 flex items-center justify-center hover:bg-zinc-800"
        >
          <Delete className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => press('%')}
          className="min-h-[48px] rounded-2xl bg-zinc-900 border border-white/10 text-sm font-mono-tabular text-zinc-200 hover:bg-zinc-800"
        >
          %
        </button>
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            className={`min-h-[48px] rounded-2xl font-mono-tabular text-base transition-colors ${
              k === '='
                ? 'bg-white text-black font-semibold hover:bg-zinc-200'
                : ['/', '*', '-', '+'].includes(k)
                ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                : 'bg-zinc-900 border border-white/10 text-zinc-100 hover:bg-zinc-800'
            }`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
};

interface NoteItem {
  id: string;
  text: string;
  createdAt: number;
}

const NotesApplet: React.FC = () => {
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const raw = localStorage.getItem('sky_launcher_notes_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState('');

  useEffect(() => {
    localStorage.setItem('sky_launcher_notes_v1', JSON.stringify(notes));
  }, [notes]);

  const addNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setNotes((prev) => [{ id: String(Date.now()), text: draft.trim(), createdAt: Date.now() }, ...prev]);
    setDraft('');
  };

  return (
    <div className="space-y-4">
      <form onSubmit={addNote} className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a quick note..."
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-black border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
        />
        <button
          type="submit"
          aria-label="Save note"
          className="min-w-[44px] min-h-[44px] rounded-xl bg-white text-black flex items-center justify-center hover:bg-zinc-200"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
      <div className="max-h-64 overflow-y-auto no-scrollbar space-y-2">
        {notes.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">No saved notes yet.</p>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              className="flex items-start justify-between gap-3 p-3 rounded-xl bg-zinc-900/80 border border-white/10"
            >
              <div className="min-w-0">
                <p className="text-sm text-zinc-100 break-words">{n.text}</p>
                <p className="text-[11px] font-mono-tabular text-zinc-500 mt-1">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotes((prev) => prev.filter((item) => item.id !== n.id))}
                aria-label="Delete note"
                className="p-2 text-zinc-500 hover:text-white"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const StopwatchApplet: React.FC = () => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const start = performance.now() - elapsedMs;
    const id = window.setInterval(() => {
      setElapsedMs(performance.now() - start);
    }, 30);
    return () => window.clearInterval(id);
  }, [running]);

  const mins = String(Math.floor(elapsedMs / 60000)).padStart(2, '0');
  const secs = String(Math.floor((elapsedMs % 60000) / 1000)).padStart(2, '0');
  const cs = String(Math.floor((elapsedMs % 1000) / 10)).padStart(2, '0');

  return (
    <div className="space-y-6 py-2 text-center">
      <div className="font-mono-tabular text-5xl font-light text-white tracking-tight">
        {mins}:{secs}
        <span className="text-2xl text-zinc-400">.{cs}</span>
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="min-h-[44px] px-6 rounded-full bg-white text-black text-sm font-semibold flex items-center gap-2 hover:bg-zinc-200"
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{running ? 'Pause' : 'Start'}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setElapsedMs(0);
          }}
          className="min-h-[44px] px-5 rounded-full bg-zinc-900 border border-white/15 text-zinc-200 text-sm flex items-center gap-2 hover:bg-zinc-800"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};

const DialerApplet: React.FC = () => {
  const [number, setNumber] = useState('');
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-black border border-white/10">
        <span className="font-mono-tabular text-2xl text-white tracking-wider min-h-[32px]">
          {number || 'Enter number'}
        </span>
        {number && (
          <button
            type="button"
            onClick={() => setNumber((n) => n.slice(0, -1))}
            aria-label="Backspace"
            className="p-2 text-zinc-400 hover:text-white"
          >
            <Delete className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {digits.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setNumber((n) => n + d)}
            className="min-h-[48px] rounded-2xl bg-zinc-900 border border-white/10 text-lg font-mono-tabular text-white hover:bg-zinc-800"
          >
            {d}
          </button>
        ))}
      </div>
      <a
        href={number ? `tel:${number}` : 'tel:'}
        className="w-full min-h-[48px] rounded-2xl bg-white text-black font-semibold text-sm flex items-center justify-center gap-2 hover:bg-zinc-200"
      >
        <Phone className="w-4 h-4" />
        <span>Call {number || 'Dialer'}</span>
      </a>
    </div>
  );
};

const CameraApplet: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera hardware API unavailable in this browser context.');
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(() => {
        setError('Camera permission denied or no camera sensor detected.');
      });

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full rounded-2xl bg-black border border-white/10 overflow-hidden flex items-center justify-center">
        {error ? (
          <div className="p-6 text-center space-y-2">
            <Camera className="w-7 h-7 text-zinc-500 mx-auto" />
            <p className="text-xs text-zinc-400">{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover grayscale contrast-110"
          />
        )}
      </div>
    </div>
  );
};

const SystemInspectorApplet: React.FC<{
  capabilities: AndroidBridgeCapabilities;
  installedCount: number;
}> = ({ capabilities, installedCount }) => {
  return (
    <div className="space-y-3 font-mono-tabular text-xs">
      <div className="p-4 rounded-2xl bg-black border border-white/10 space-y-2.5">
        <div className="flex items-center gap-2 text-zinc-200 font-sans text-sm font-medium pb-1 border-b border-white/10">
          <Cpu className="w-4 h-4 text-zinc-400" />
          <span>Runtime Telemetry</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Environment</span>
          <span className="text-zinc-200">
            {capabilities.isNativeAndroid ? 'Android Native WebView' : 'Web / PWA Runtime'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Default Home Intent</span>
          <span className="text-zinc-200">
            {capabilities.isDefaultLauncher ? 'Active' : 'Not Set'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Notification Listener</span>
          <span className="text-zinc-200">
            {capabilities.hasNotificationAccess ? 'Granted' : 'Restricted'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Indexed Applications</span>
          <span className="text-zinc-200">{installedCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Viewport</span>
          <span className="text-zinc-200">
            {window.innerWidth} × {window.innerHeight}px
          </span>
        </div>
      </div>
    </div>
  );
};

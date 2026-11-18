import React, { useEffect, useState } from 'react';
import { Clock, Focus, Lock, ShieldAlert, X } from 'lucide-react';
import { AppItem, IconShape } from '../types/launcher';
import { AppIconGlyph } from './AppIconGlyph';

export type LaunchGateState =
  | { type: 'passcode'; app: AppItem }
  | { type: 'pause'; app: AppItem; seconds: number }
  | { type: 'limit'; app: AppItem; usedToday: number; limit: number }
  | { type: 'focus-blocked'; app: AppItem; focusLabel: string }
  | null;

interface LaunchGateModalProps {
  gate: LaunchGateState;
  hasPasscode: boolean;
  passcodeValue: string | null;
  iconShape: IconShape;
  iconMonochrome: boolean;
  iconUniformMask?: boolean;
  onCancel: () => void;
  onVerifiedPasscode: (app: AppItem) => void;
  onSetPasscode: (pass: string) => void;
  onConfirmPauseLaunch: (app: AppItem) => void;
  onOverrideLimitLaunch: (app: AppItem) => void;
  onOverrideFocusLaunch: (app: AppItem) => void;
}

export const LaunchGateModal: React.FC<LaunchGateModalProps> = ({
  gate,
  hasPasscode,
  passcodeValue,
  iconShape,
  iconMonochrome,
  iconUniformMask = false,
  onCancel,
  onVerifiedPasscode,
  onSetPasscode,
  onConfirmPauseLaunch,
  onOverrideLimitLaunch,
  onOverrideFocusLaunch,
}) => {
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    setPassInput('');
    setPassError('');
    if (gate?.type === 'pause') {
      setRemainingSeconds(gate.seconds);
    }
  }, [gate]);

  useEffect(() => {
    if (gate?.type !== 'pause' || remainingSeconds <= 0) return;
    const timer = window.setTimeout(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [gate, remainingSeconds]);

  if (!gate) return null;

  const handlePassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = passInput.trim();
    if (!hasPasscode) {
      if (trimmed.length < 4) {
        setPassError('Enter at least 4 characters or digits');
        return;
      }
      onSetPasscode(trimmed);
      if (gate.type === 'passcode') {
        onVerifiedPasscode(gate.app);
      }
      return;
    }

    if (trimmed === passcodeValue) {
      if (gate.type === 'passcode') {
        onVerifiedPasscode(gate.app);
      }
    } else {
      setPassError('Incorrect passcode');
      setPassInput('');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
      className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/20 p-6 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <AppIconGlyph
              app={gate.app}
              size="small"
              shape={iconShape}
              monochrome={iconMonochrome}
              uniformMask={iconUniformMask}
              highlighted
            />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">{gate.app.name}</h3>
              <p className="text-[11px] font-mono-tabular text-zinc-400 truncate">
                {gate.type === 'passcode'
                  ? 'Locked Application'
                  : gate.type === 'pause'
                  ? 'Mindful Launch Pause'
                  : gate.type === 'limit'
                  ? 'Daily Open Limit Reached'
                  : `${gate.focusLabel} Active`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {gate.type === 'passcode' && (
          <form onSubmit={handlePassSubmit} className="space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/70 border border-white/10">
              <Lock className="w-4 h-4 text-zinc-300 shrink-0" />
              <p className="text-xs text-zinc-300 leading-relaxed">
                {hasPasscode
                  ? `Enter your SKY LAUNCHER passcode to open ${gate.app.name}.`
                  : 'Create a 4–12 character passcode to lock protected apps.'}
              </p>
            </div>

            <input
              type="password"
              autoFocus
              value={passInput}
              maxLength={12}
              onChange={(e) => {
                setPassInput(e.target.value);
                setPassError('');
              }}
              placeholder={hasPasscode ? 'Enter passcode...' : 'New passcode (4–12 chars)...'}
              className="w-full min-h-[44px] px-4 rounded-xl bg-black border border-white/20 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white"
            />
            {passError && <p className="text-xs text-zinc-200">{passError}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 min-h-[44px] rounded-xl bg-zinc-900 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 min-h-[44px] rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200"
              >
                {hasPasscode ? 'Unlock & Open' : 'Save & Open'}
              </button>
            </div>
          </form>
        )}

        {gate.type === 'pause' && (
          <div className="space-y-5">
            <div className="py-5 px-4 rounded-2xl bg-black border border-white/10 flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center font-mono-tabular text-2xl font-semibold text-white">
                {remainingSeconds > 0 ? remainingSeconds : <Clock className="w-6 h-6" />}
              </div>
              <p className="text-sm text-zinc-200 font-medium">
                {remainingSeconds > 0
                  ? `Take a breath before opening ${gate.app.name}`
                  : `Still want to open ${gate.app.name}?`}
              </p>
              <p className="text-xs text-zinc-500">
                Mindful pause helps prevent automatic app checking.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 min-h-[44px] rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200"
              >
                Stay Present
              </button>
              <button
                type="button"
                disabled={remainingSeconds > 0}
                onClick={() => onConfirmPauseLaunch(gate.app)}
                className="flex-1 min-h-[44px] rounded-xl bg-zinc-900 border border-white/15 text-xs font-medium text-zinc-200 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {remainingSeconds > 0 ? `Wait ${remainingSeconds}s` : 'Open App'}
              </button>
            </div>
          </div>
        )}

        {gate.type === 'limit' && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-black border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-zinc-200">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">Daily launch limit reached</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                You have opened <span className="text-zinc-200">{gate.app.name}</span>{' '}
                <span className="font-mono-tabular text-white">
                  {gate.usedToday}/{gate.limit}
                </span>{' '}
                times today.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 min-h-[44px] rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => onOverrideLimitLaunch(gate.app)}
                className="flex-1 min-h-[44px] rounded-xl bg-zinc-900 border border-white/15 text-xs font-medium text-zinc-300 hover:text-white"
              >
                Open Anyway
              </button>
            </div>
          </div>
        )}

        {gate.type === 'focus-blocked' && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-black border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-zinc-200">
                <Focus className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">{gate.focusLabel} Mode is Active</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {gate.app.name} is currently paused during your {gate.focusLabel.toLowerCase()} session.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 min-h-[44px] rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200"
              >
                Stay in {gate.focusLabel}
              </button>
              <button
                type="button"
                onClick={() => onOverrideFocusLaunch(gate.app)}
                className="flex-1 min-h-[44px] rounded-xl bg-zinc-900 border border-white/15 text-xs font-medium text-zinc-300 hover:text-white"
              >
                Open Once
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

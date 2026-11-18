import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  X,
} from 'lucide-react';
import { AppItem, IconShape, IconSize } from '../types/launcher';
import { AppIconGlyph } from './AppIconGlyph';

interface HiddenAppsPageProps {
  apps: AppItem[];
  hiddenSet: Set<string>;
  hiddenPassword: string | null;
  onSetHiddenPassword: (password: string | null) => void;
  onShowNotice: (msg: string) => void;
  showAppIcons?: boolean;
  textOnlySet?: Set<string>;
  disabledSet?: Set<string>;
  iconSize: IconSize;
  iconShape: IconShape;
  iconMonochrome: boolean;
  onBackToWheel: () => void;
  onToggleHideApp: (appId: string) => void;
  onLaunchApp: (app: AppItem) => void;
  onOpenOptions: (app: AppItem) => void;
}

export const HiddenAppsPage: React.FC<HiddenAppsPageProps> = ({
  apps,
  hiddenSet,
  hiddenPassword,
  onSetHiddenPassword,
  onShowNotice,
  showAppIcons = true,
  textOnlySet,
  disabledSet,
  iconSize,
  iconShape,
  iconMonochrome,
  onBackToWheel,
  onToggleHideApp,
  onLaunchApp,
  onOpenOptions,
}) => {
  // If no password is set, open immediately. If password exists, require unlocking.
  const [isUnlocked, setIsUnlocked] = useState<boolean>(!hiddenPassword);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isManagingPasscode, setIsManagingPasscode] = useState<boolean>(false);

  // Modal form states
  const [currentPass, setCurrentPass] = useState<string>('');
  const [newPass, setNewPass] = useState<string>('');
  const [confirmPass, setConfirmPass] = useState<string>('');
  const [manageError, setManageError] = useState<string>('');
  const [manageMode, setManageMode] = useState<'set' | 'change' | 'remove'>('set');

  const passwordInputRef = useRef<HTMLInputElement>(null);

  const hiddenApps = useMemo(() => {
    return apps
      .filter((app) => hiddenSet.has(app.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [apps, hiddenSet]);

  const handleUnhideAll = () => {
    for (const app of hiddenApps) {
      onToggleHideApp(app.id);
    }
  };

  // Verification
  const verifyAndUnlock = useCallback(
    (entered: string) => {
      if (!hiddenPassword) {
        setIsUnlocked(true);
        return;
      }
      if (entered.trim() === hiddenPassword.trim()) {
        setIsUnlocked(true);
        setPinInput('');
        setPinError('');
        onShowNotice('Hidden space unlocked');
      } else {
        setPinError('Incorrect passcode. Please try again.');
        setPinInput('');
      }
    },
    [hiddenPassword, onShowNotice]
  );

  // Physical keyboard listeners when locked
  useEffect(() => {
    if (isUnlocked || !hiddenPassword) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        setPinInput((prev) => {
          const next = prev.length < 12 ? prev + e.key : prev;
          setPinError('');
          return next;
        });
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setPinInput((prev) => prev.slice(0, -1));
        setPinError('');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pinInput) {
          verifyAndUnlock(pinInput);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBackToWheel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUnlocked, hiddenPassword, pinInput, verifyAndUnlock, onBackToWheel]);

  // Keypad button click
  const handleKeypadPress = (val: string) => {
    setPinError('');
    if (val === 'clear') {
      setPinInput('');
    } else if (val === 'backspace') {
      setPinInput((prev) => prev.slice(0, -1));
    } else {
      setPinInput((prev) => {
        const next = prev.length < 12 ? prev + val : prev;
        return next;
      });
    }
  };

  // Open manage modal
  const handleOpenManager = () => {
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setManageError('');
    setManageMode(hiddenPassword ? 'change' : 'set');
    setIsManagingPasscode(true);
  };

  const handleSaveNewPasscode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setManageError('');

    const trimmedNew = newPass.trim();
    const trimmedConfirm = confirmPass.trim();

    if (trimmedNew.length < 4) {
      setManageError('Passcode must be at least 4 digits or characters.');
      return;
    }
    if (trimmedNew !== trimmedConfirm) {
      setManageError('Passcodes do not match. Please verify.');
      return;
    }

    onSetHiddenPassword(trimmedNew);
    setIsUnlocked(true);
    setIsManagingPasscode(false);
    onShowNotice('Passcode set for hidden apps');
  };

  const handleChangePasscode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setManageError('');

    if (currentPass.trim() !== (hiddenPassword || '').trim()) {
      setManageError('Current passcode is incorrect.');
      return;
    }

    const trimmedNew = newPass.trim();
    const trimmedConfirm = confirmPass.trim();

    if (trimmedNew.length < 4) {
      setManageError('New passcode must be at least 4 digits or characters.');
      return;
    }
    if (trimmedNew !== trimmedConfirm) {
      setManageError('New passcodes do not match.');
      return;
    }

    onSetHiddenPassword(trimmedNew);
    setIsManagingPasscode(false);
    onShowNotice('Passcode updated successfully');
  };

  const handleRemovePasscode = () => {
    setManageError('');
    if (currentPass.trim() !== (hiddenPassword || '').trim()) {
      setManageError('Current passcode is incorrect.');
      return;
    }

    onSetHiddenPassword(null);
    setIsUnlocked(true);
    setIsManagingPasscode(false);
    onShowNotice('Passcode protection removed');
  };

  const handleLockNow = () => {
    if (hiddenPassword) {
      setIsUnlocked(false);
      setPinInput('');
      setPinError('');
      onShowNotice('Hidden apps locked');
    }
  };

  // 1. LOCKED VIEW: When password is set and not yet unlocked
  if (hiddenPassword && !isUnlocked) {
    return (
      <section
        aria-label="Locked Hidden Apps"
        className="sky-slide-up flex flex-col w-full max-w-sm mx-auto h-full min-h-0 justify-between items-center py-4 px-3 select-none"
      >
        {/* Top Header */}
        <div className="w-full flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onBackToWheel}
            aria-label="Back to 3D App Wheel"
            className="min-h-[40px] px-3 rounded-xl bg-zinc-950/90 border border-white/15 text-zinc-300 hover:text-white hover:border-white/35 text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <span className="text-[11px] font-mono-tabular tracking-wider uppercase text-zinc-400">
            Protected Space
          </span>
        </div>

        {/* Center Lock Status & PIN Dots */}
        <div className="flex flex-col items-center justify-center text-center my-auto py-2">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-950 border border-white/20 flex items-center justify-center shadow-xl mb-3">
            <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>

          <h2 className="font-display text-lg sm:text-xl font-semibold text-white tracking-tight">
            Hidden Space
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-[260px]">
            Enter passcode to view hidden applications
          </p>

          {/* Masked Dots Display */}
          <div className="mt-4 flex items-center justify-center gap-2.5 h-7">
            {Array.from({ length: Math.max(4, pinInput.length) }).map((_, idx) => {
              const isFilled = idx < pinInput.length;
              return (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-all duration-150 ${
                    isFilled
                      ? 'bg-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.7)]'
                      : 'border border-white/30 bg-transparent'
                  }`}
                />
              );
            })}
          </div>

          {/* Error Message */}
          {pinError ? (
            <p className="text-xs text-zinc-300 mt-2.5 font-medium flex items-center gap-1.5 bg-zinc-900 border border-white/20 px-3 py-1.5 rounded-lg animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-white" />
              <span>{pinError}</span>
            </p>
          ) : (
            <p className="text-[11px] text-zinc-500 mt-2.5 font-mono-tabular">
              Tap digits or type on physical keyboard
            </p>
          )}

          {/* Hidden/accessible input for desktop / soft keyboard */}
          <input
            ref={passwordInputRef}
            type="password"
            value={pinInput}
            onChange={(e) => {
              setPinError('');
              setPinInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && pinInput) {
                verifyAndUnlock(pinInput);
              }
            }}
            className="sr-only"
            aria-label="Enter passcode"
            autoFocus
          />
        </div>

        {/* Numeric Keypad */}
        <div className="w-full max-w-[280px] grid grid-cols-3 gap-2 sm:gap-2.5 shrink-0 mb-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeypadPress(digit)}
              className="h-12 sm:h-13 rounded-2xl bg-zinc-950 border border-white/15 hover:border-white/40 active:scale-95 text-white font-mono-tabular text-lg font-medium flex items-center justify-center transition-all"
            >
              {digit}
            </button>
          ))}

          {/* Row 4: Clear, 0, Backspace */}
          <button
            type="button"
            onClick={() => handleKeypadPress('clear')}
            aria-label="Clear passcode"
            className="h-12 sm:h-13 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/30 active:scale-95 text-zinc-400 hover:text-white text-xs font-medium uppercase flex items-center justify-center transition-all"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleKeypadPress('0')}
            className="h-12 sm:h-13 rounded-2xl bg-zinc-950 border border-white/15 hover:border-white/40 active:scale-95 text-white font-mono-tabular text-lg font-medium flex items-center justify-center transition-all"
          >
            0
          </button>

          <button
            type="button"
            onClick={() => handleKeypadPress('backspace')}
            aria-label="Delete last digit"
            className="h-12 sm:h-13 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/30 active:scale-95 text-zinc-300 hover:text-white flex items-center justify-center transition-all"
          >
            <span className="font-mono text-base">⌫</span>
          </button>
        </div>

        {/* Unlock Action Button */}
        <div className="w-full max-w-[280px] shrink-0">
          <button
            type="button"
            onClick={() => verifyAndUnlock(pinInput)}
            disabled={!pinInput}
            className={`w-full min-h-[46px] rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
              pinInput
                ? 'bg-white text-black hover:bg-zinc-200 active:scale-[0.98]'
                : 'bg-zinc-900 border border-white/10 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <Unlock className="w-4 h-4" />
            <span>Unlock Space</span>
          </button>
        </div>
      </section>
    );
  }

  // 2. UNLOCKED VIEW: Full access to hidden apps without search bar
  return (
    <section
      aria-label="Hidden Apps Page"
      className="sky-slide-up flex flex-col w-full max-w-2xl mx-auto h-full min-h-0 gap-3 px-0.5"
    >
      {/* Dedicated Page Header */}
      <div className="shrink-0 flex items-center justify-between gap-2 pt-1 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBackToWheel}
            aria-label="Back to 3D App Wheel"
            className="min-h-[40px] px-3 rounded-xl bg-zinc-950/90 border border-white/15 text-zinc-200 hover:text-white hover:border-white/35 text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="min-w-0">
            <h1 className="font-display text-base sm:text-lg font-semibold tracking-tight text-white truncate">
              Hidden Apps
            </h1>
            <p className="text-[11px] font-mono-tabular text-zinc-400 truncate">
              {hiddenApps.length} {hiddenApps.length === 1 ? 'app hidden' : 'apps hidden'}
              {hiddenPassword && ' · Locked with Passcode'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Lock Now Button (if password is set) */}
          {hiddenPassword && (
            <button
              type="button"
              onClick={handleLockNow}
              title="Lock hidden space now"
              aria-label="Lock hidden space now"
              className="min-h-[38px] px-2.5 rounded-xl bg-zinc-950 border border-white/15 text-zinc-300 hover:text-white hover:border-white/35 text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          )}

          {/* Set / Manage Passcode Button */}
          <button
            type="button"
            onClick={handleOpenManager}
            title={hiddenPassword ? 'Change or remove passcode' : 'Set a passcode for hidden apps'}
            className="min-h-[38px] px-3 rounded-xl bg-zinc-950 border border-white/15 text-zinc-200 hover:text-white hover:border-white/35 text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            {hiddenPassword ? (
              <>
                <KeyRound className="w-3.5 h-3.5" />
                <span>Passcode</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Set Passcode</span>
              </>
            )}
          </button>

          {/* Unhide All Button */}
          {hiddenApps.length > 0 && (
            <button
              type="button"
              onClick={handleUnhideAll}
              title="Unhide all applications"
              className="min-h-[38px] px-3 rounded-xl bg-zinc-950 border border-white/15 text-zinc-300 hover:text-white hover:border-white/35 text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unhide All</span>
            </button>
          )}
        </div>
      </div>

      {/* Hidden Apps List (No search bar) */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar rounded-2xl bg-zinc-950/80 border border-white/10 divide-y divide-white/[0.06]">
        {hiddenApps.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <EyeOff className="w-7 h-7 text-zinc-500 mx-auto" />
            <p className="text-sm text-zinc-200 font-medium">No hidden apps yet</p>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              To hide an application, tap its options on the 3D wheel or Home screen and select Hide.
            </p>
          </div>
        ) : (
          hiddenApps.map((app) => {
            const hideIcon = !showAppIcons || (textOnlySet?.has(app.id) ?? false);
            const isDisabled = disabledSet?.has(app.id) ?? false;
            return (
              <div
                key={app.id}
                className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 hover:bg-white/[0.03] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onOpenOptions(app)}
                  className="flex-1 flex items-center gap-3 text-left min-w-0 min-h-[44px]"
                >
                  {!hideIcon && (
                    <div className="opacity-60 grayscale hover:opacity-100 transition-opacity">
                      <AppIconGlyph
                        app={app}
                        size={iconSize === 'large' ? 'medium' : iconSize}
                        shape={iconShape}
                        monochrome={iconMonochrome}
                        highlighted={false}
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate sky-app-label text-zinc-200 hover:text-white">
                      {app.name}
                    </p>
                    <p className="text-[11px] font-mono-tabular text-zinc-500 truncate">
                      {app.category} · Hidden{isDisabled ? ' · Off' : ''}
                    </p>
                  </div>
                </button>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onLaunchApp(app)}
                  aria-label={`Open ${app.name}`}
                  title={`Open ${app.name}`}
                  className="min-w-[38px] min-h-[38px] rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:border-white/30 flex items-center justify-center transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>

                <button
                  type="button"
                  onClick={() => onToggleHideApp(app.id)}
                  aria-label={`Unhide ${app.name}`}
                  title={`Unhide ${app.name}`}
                  className="min-h-[38px] px-3 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 border border-white bg-white text-black hover:bg-zinc-200 transition-colors whitespace-nowrap shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Unhide</span>
                </button>
              </div>
            </div>
            );
          })
        )}
      </div>

      {/* Passcode Configuration Modal */}
      {isManagingPasscode && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/20 p-5 shadow-2xl flex flex-col gap-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-white" />
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  {hiddenPassword ? 'Passcode Settings' : 'Set Hidden Apps Passcode'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManagingPasscode(false)}
                aria-label="Close dialog"
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error banner */}
            {manageError && (
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-white/20 text-xs text-zinc-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-white shrink-0" />
                <span>{manageError}</span>
              </div>
            )}

            {/* If NO password is set yet */}
            {!hiddenPassword ? (
              <form onSubmit={handleSaveNewPasscode} className="space-y-3">
                <p className="text-xs text-zinc-400">
                  Create a passcode (4–12 digits or characters) to require before hidden apps can be viewed.
                </p>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono-tabular uppercase tracking-wider text-zinc-400">
                    New Passcode
                  </label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Enter passcode"
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono-tabular uppercase tracking-wider text-zinc-400">
                    Confirm Passcode
                  </label>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Repeat passcode"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsManagingPasscode(false)}
                    className="min-h-[40px] px-3.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="min-h-[40px] px-4 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Passcode</span>
                  </button>
                </div>
              </form>
            ) : (
              /* If password is ALREADY set: Change or Remove */
              <div className="space-y-4">
                {/* Tabs: Change vs Remove */}
                <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-900 border border-white/10 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setManageMode('change');
                      setManageError('');
                    }}
                    className={`py-1.5 rounded-lg text-center transition-all ${
                      manageMode === 'change'
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Change Passcode
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManageMode('remove');
                      setManageError('');
                    }}
                    className={`py-1.5 rounded-lg text-center transition-all ${
                      manageMode === 'remove'
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Remove Passcode
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono-tabular uppercase tracking-wider text-zinc-400">
                    Current Passcode
                  </label>
                  <input
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="Enter current passcode"
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                {manageMode === 'change' ? (
                  <form onSubmit={handleChangePasscode} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono-tabular uppercase tracking-wider text-zinc-400">
                        New Passcode
                      </label>
                      <input
                        type="password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="Enter new passcode"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-white transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-mono-tabular uppercase tracking-wider text-zinc-400">
                        Confirm New Passcode
                      </label>
                      <input
                        type="password"
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        placeholder="Repeat new passcode"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-white transition-colors"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsManagingPasscode(false)}
                        className="min-h-[40px] px-3.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="min-h-[40px] px-4 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Update Passcode</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-400">
                      Removing the passcode will make your hidden apps accessible without authentication.
                    </p>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsManagingPasscode(false)}
                        className="min-h-[40px] px-3.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePasscode}
                        className="min-h-[40px] px-4 rounded-xl border border-white/30 bg-zinc-900 text-zinc-100 hover:bg-white hover:text-black text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Turn Off Passcode</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

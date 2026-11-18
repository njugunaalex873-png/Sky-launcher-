import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AppItem } from '../types/launcher';

interface AlphabetRailProps {
  apps: AppItem[];
  activeLetter: string | null;
  enableHaptics?: boolean;
  isLight?: boolean;
  accentHex?: string;
  onSelectLetter: (letter: string, firstMatchIndex: number) => void;
}

const LETTERS = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export const AlphabetRail: React.FC<AlphabetRailProps> = ({
  apps,
  activeLetter,
  enableHaptics = true,
  isLight = false,
  accentHex = '#ffffff',
  onSelectLetter,
}) => {
  const railRef = useRef<HTMLDivElement>(null);
  const [scrubbingLetter, setScrubbingLetter] = useState<string | null>(null);
  const lastHapticLetterRef = useRef<string | null>(null);

  // Precompute first app index for each letter in O(N)
  const letterIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    apps.forEach((app, idx) => {
      const first = (app.name.trim()[0] || '#').toUpperCase();
      const key = /[A-Z]/.test(first) ? first : '#';
      if (!map.has(key)) {
        map.set(key, idx);
      }
    });
    return map;
  }, [apps]);

  const triggerLetterTick = useCallback(
    (letter: string) => {
      if (!enableHaptics || lastHapticLetterRef.current === letter) return;
      lastHapticLetterRef.current = letter;
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate(3);
        } catch {
          // Ignore vibrate errors
        }
      }
    },
    [enableHaptics]
  );

  const pickLetterAtY = useCallback(
    (clientY: number) => {
      const el = railRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const rel = Math.max(0, Math.min(0.999, (clientY - rect.top) / rect.height));
      const idx = Math.floor(rel * LETTERS.length);
      const letter = LETTERS[idx];
      setScrubbingLetter(letter);
      triggerLetterTick(letter);

      if (letterIndexMap.has(letter)) {
        onSelectLetter(letter, letterIndexMap.get(letter)!);
      } else {
        for (let offset = 1; offset < LETTERS.length; offset++) {
          const forward = LETTERS[idx + offset];
          if (forward && letterIndexMap.has(forward)) {
            onSelectLetter(forward, letterIndexMap.get(forward)!);
            break;
          }
          const backward = LETTERS[idx - offset];
          if (backward && letterIndexMap.has(backward)) {
            onSelectLetter(backward, letterIndexMap.get(backward)!);
            break;
          }
        }
      }
    },
    [letterIndexMap, onSelectLetter, triggerLetterTick]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pickLetterAtY(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    if (scrubbingLetter !== null) {
      pickLetterAtY(e.clientY);
    }
  };

  const handlePointerUp = () => {
    setScrubbingLetter(null);
    lastHapticLetterRef.current = null;
  };

  const highlighted = scrubbingLetter || activeLetter;

  return (
    <div className="relative flex items-center select-none z-30 h-full py-2">
      {/* Floating Letter Loupe when scrubbing */}
      {scrubbingLetter && (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl border flex flex-col items-center justify-center z-50 ${
            isLight
              ? 'bg-white/95 border-zinc-900/25 shadow-xl'
              : 'bg-zinc-950/95 border-white/45 shadow-[0_0_36px_rgba(255,255,255,0.22)]'
          }`}
        >
          <span
            className="font-display text-2xl font-semibold"
            style={{ color: accentHex }}
          >
            {scrubbingLetter}
          </span>
        </div>
      )}

      <div
        ref={railRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="navigation"
        aria-label="Alphabetical app navigation"
        className={`flex flex-col items-center justify-between py-1.5 px-1 sm:px-1.5 rounded-full border backdrop-blur-md touch-none cursor-pointer h-full max-h-[min(74vh,520px)] ${
          isLight
            ? 'bg-white/80 border-zinc-900/15 shadow-sm'
            : 'bg-zinc-950/75 border-white/15'
        }`}
      >
        {LETTERS.map((letter) => {
          const hasApps = letterIndexMap.has(letter);
          const isActive = highlighted === letter;
          return (
            <button
              key={letter}
              type="button"
              onClick={() => {
                if (hasApps) {
                  onSelectLetter(letter, letterIndexMap.get(letter)!);
                }
              }}
              disabled={!hasApps}
              aria-label={`Jump to ${letter}`}
              style={isActive ? { color: accentHex } : undefined}
              className={`w-6 sm:w-7 flex-1 min-h-0 flex items-center justify-center font-mono-tabular text-[9px] sm:text-[10px] leading-none transition-transform duration-150 ${
                isActive
                  ? 'font-semibold scale-125'
                  : hasApps
                  ? isLight
                    ? 'text-zinc-700 hover:text-zinc-950'
                    : 'text-zinc-300 hover:text-white'
                  : isLight
                  ? 'text-zinc-400/60 cursor-default'
                  : 'text-zinc-700 cursor-default'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
};

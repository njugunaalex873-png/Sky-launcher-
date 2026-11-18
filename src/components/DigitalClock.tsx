import React, { useEffect, useState } from 'react';
import { ClockStyle, FontScale } from '../types/launcher';

interface DigitalClockProps {
  clockStyle: ClockStyle;
  use24Hour: boolean;
  showSeconds: boolean;
  fontScale: FontScale;
  isLight?: boolean;
  accentHex?: string;
  onClockClick?: () => void;
}

export const DigitalClock: React.FC<DigitalClockProps> = ({
  clockStyle,
  use24Hour,
  showSeconds,
  fontScale,
  isLight = false,
  accentHex = '#ffffff',
  onClockClick,
}) => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const syncNow = () => setNow(new Date());
    const interval = window.setInterval(syncNow, 1000);
    window.addEventListener('focus', syncNow);
    document.addEventListener('visibilitychange', syncNow);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', syncNow);
      document.removeEventListener('visibilitychange', syncNow);
    };
  }, []);

  const hours24 = now.getHours();
  const displayHour = use24Hour
    ? String(hours24).padStart(2, '0')
    : String(hours24 % 12 || 12).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const meridiem = hours24 >= 12 ? 'PM' : 'AM';

  // Always derive weekday and calendar date directly from actual device Date
  const dayName = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(now);
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(now);

  const sizeScale =
    fontScale === 'compact'
      ? 'text-[3rem] sm:text-[3.75rem]'
      : fontScale === 'large'
      ? 'text-[3.9rem] sm:text-[5rem]'
      : fontScale === 'xlarge'
      ? 'text-[4.25rem] sm:text-[5.75rem]'
      : 'text-[3.5rem] sm:text-[4.5rem]';

  const compactSplitSize =
    fontScale === 'compact'
      ? 'text-[2.15rem] sm:text-[2.6rem]'
      : fontScale === 'large'
      ? 'text-[2.75rem] sm:text-[3.35rem]'
      : fontScale === 'xlarge'
      ? 'text-[3rem] sm:text-[3.6rem]'
      : 'text-[2.45rem] sm:text-[3rem]';

  const primaryText = isLight ? 'text-zinc-900' : 'text-white';
  const secondaryText = isLight ? 'text-zinc-700' : 'text-zinc-200';
  const mutedText = isLight ? 'text-zinc-600' : 'text-zinc-400';
  const subtleDotText = isLight ? 'text-zinc-400' : 'text-zinc-600';
  const focusRing = isLight ? 'focus-visible:ring-zinc-900/35' : 'focus-visible:ring-white/40';

  const renderDateLine = (extraMargin = 'mt-2.5') => (
    <p className={`${extraMargin} text-xs sm:text-sm ${mutedText} tracking-wide font-normal`}>
      <span className={`${isLight ? 'text-zinc-900' : 'text-zinc-100'} font-medium`}>{dayName}</span>
      <span className={`mx-2 ${subtleDotText}`} aria-hidden="true">·</span>
      <span>{dateLabel}</span>
    </p>
  );

  // Compute exact analog/orbital angles from real device Date
  const secVal = now.getSeconds();
  const minVal = now.getMinutes();
  const hr12 = hours24 % 12;
  const secondAngleDeg = secVal * 6;
  const minuteAngleDeg = minVal * 6 + secVal * 0.1;
  const hourAngleDeg = hr12 * 30 + minVal * 0.5;
  const orbitalProgress = (minVal + secVal / 60) / 60;
  const orbitalRadius = 32;
  const orbitalCircumference = 2 * Math.PI * orbitalRadius;
  const orbitalDashOffset = orbitalCircumference * (1 - orbitalProgress);

  if (clockStyle === 'analog-dial') {
    const dialFace = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(9,9,11,0.9)';
    const dialOuterStroke = isLight ? 'rgba(24,24,27,0.22)' : 'rgba(255,255,255,0.28)';
    const dialInnerStroke = isLight ? 'rgba(24,24,27,0.08)' : 'rgba(255,255,255,0.08)';
    const majorTick = isLight ? 'rgba(24,24,27,0.82)' : 'rgba(255,255,255,0.8)';
    const minorTick = isLight ? 'rgba(24,24,27,0.24)' : 'rgba(255,255,255,0.28)';
    const handColor = isLight ? '#18181b' : '#ffffff';
    const minHandColor = isLight ? 'rgba(39,39,42,0.88)' : 'rgba(228,228,231,0.95)';

    return (
      <button
        type="button"
        onClick={onClockClick}
        className={`w-full text-left group focus:outline-none focus-visible:ring-1 ${focusRing} rounded-lg`}
        aria-label="Open Clock & Timer"
      >
        <div className="flex items-center gap-4 sm:gap-5">
          <svg
            width="76"
            height="76"
            viewBox="0 0 80 80"
            aria-hidden="true"
            className="shrink-0 drop-shadow-[0_0_14px_rgba(0,0,0,0.12)]"
          >
            <circle
              cx="40"
              cy="40"
              r="36"
              fill={dialFace}
              stroke={dialOuterStroke}
              strokeWidth="1.2"
            />
            <circle
              cx="40"
              cy="40"
              r="31"
              fill="none"
              stroke={dialInnerStroke}
              strokeWidth="0.8"
            />
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i * 30 * Math.PI) / 180;
              const isMajor = i % 3 === 0;
              const r1 = isMajor ? 28.5 : 30.5;
              const r2 = 34;
              return (
                <line
                  key={i}
                  x1={40 + Math.sin(a) * r1}
                  y1={40 - Math.cos(a) * r1}
                  x2={40 + Math.sin(a) * r2}
                  y2={40 - Math.cos(a) * r2}
                  stroke={isMajor ? majorTick : minorTick}
                  strokeWidth={isMajor ? '1.6' : '0.9'}
                  strokeLinecap="round"
                />
              );
            })}
            <g transform={`rotate(${hourAngleDeg} 40 40)`}>
              <line
                x1="40"
                y1="43"
                x2="40"
                y2="21"
                stroke={handColor}
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </g>
            <g transform={`rotate(${minuteAngleDeg} 40 40)`}>
              <line
                x1="40"
                y1="44"
                x2="40"
                y2="14"
                stroke={minHandColor}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </g>
            {showSeconds && (
              <g transform={`rotate(${secondAngleDeg} 40 40)`}>
                <line
                  x1="40"
                  y1="47"
                  x2="40"
                  y2="11"
                  stroke={accentHex}
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
              </g>
            )}
            <circle cx="40" cy="40" r="2.8" fill={accentHex} />
          </svg>

          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 font-display tabular-nums leading-none">
              <span className={`text-2xl sm:text-3xl sky-clock-digits ${primaryText} tracking-tight`}>
                {displayHour}:{minutes}
              </span>
              {showSeconds && (
                <span className={`font-mono-tabular text-xs sm:text-sm ${mutedText}`}>
                  :{seconds}
                </span>
              )}
              {!use24Hour && (
                <span className={`text-[10px] sm:text-xs font-medium tracking-widest ${mutedText} ml-0.5`}>
                  {meridiem}
                </span>
              )}
            </div>
            {renderDateLine('mt-1.5')}
          </div>
        </div>
      </button>
    );
  }

  if (clockStyle === 'orbital-ring') {
    const trackBg = isLight ? 'rgba(24,24,27,0.04)' : 'rgba(255,255,255,0.03)';
    const trackStroke = isLight ? 'rgba(24,24,27,0.14)' : 'rgba(255,255,255,0.14)';

    return (
      <button
        type="button"
        onClick={onClockClick}
        className={`w-full text-left group focus:outline-none focus-visible:ring-1 ${focusRing} rounded-lg`}
        aria-label="Open Clock & Timer"
      >
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative w-[78px] h-[78px] shrink-0 flex items-center justify-center">
            <svg width="78" height="78" viewBox="0 0 78 78" aria-hidden="true" className="-rotate-90">
              <circle
                cx="39"
                cy="39"
                r={orbitalRadius}
                fill={trackBg}
                stroke={trackStroke}
                strokeWidth="2.5"
              />
              <circle
                cx="39"
                cy="39"
                r={orbitalRadius}
                fill="none"
                stroke={accentHex}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={orbitalCircumference}
                strokeDashoffset={orbitalDashOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono-tabular tabular-nums">
              <span className={`text-sm font-semibold ${primaryText} leading-none`}>
                {displayHour}:{minutes}
              </span>
              {showSeconds ? (
                <span className={`text-[10px] ${mutedText} mt-0.5 leading-none`}>{seconds}s</span>
              ) : !use24Hour ? (
                <span className={`text-[9px] tracking-widest ${mutedText} mt-0.5 leading-none`}>
                  {meridiem}
                </span>
              ) : null}
            </div>
          </div>

          <div className="min-w-0">
            <p className={`text-base sm:text-xl font-display font-medium ${primaryText} tracking-tight truncate`}>
              {dayName}
            </p>
            <p className={`text-xs sm:text-sm ${mutedText} font-mono-tabular mt-0.5 truncate`}>
              {dateLabel}
            </p>
          </div>
        </div>
      </button>
    );
  }

  if (clockStyle === 'split-flap') {
    const tileClass = isLight
      ? 'bg-white/90 border-zinc-900/15 shadow-sm'
      : 'bg-zinc-950 border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]';
    const seamClass = isLight
      ? 'bg-zinc-900/10 border-t border-white/60'
      : 'bg-black/80 border-t border-white/10';

    return (
      <button
        type="button"
        onClick={onClockClick}
        className={`w-full text-left group focus:outline-none focus-visible:ring-1 ${focusRing} rounded-lg`}
        aria-label="Open Clock & Timer"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 font-display tabular-nums leading-none">
          <div className={`relative px-3 py-2 rounded-xl border overflow-hidden ${tileClass}`}>
            <span className={`${compactSplitSize} sky-clock-digits ${primaryText} tracking-tight`}>
              {displayHour}
            </span>
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 top-1/2 h-px ${seamClass}`}
            />
          </div>
          <span className={`text-2xl sm:text-3xl font-light ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
            :
          </span>
          <div className={`relative px-3 py-2 rounded-xl border overflow-hidden ${tileClass}`}>
            <span className={`${compactSplitSize} sky-clock-digits ${secondaryText} tracking-tight`}>
              {minutes}
            </span>
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 top-1/2 h-px ${seamClass}`}
            />
          </div>
          {showSeconds && (
            <div
              className={`relative px-2 py-1.5 rounded-lg border self-end ${
                isLight ? 'bg-white/75 border-zinc-900/10' : 'bg-zinc-950/80 border-white/10'
              }`}
            >
              <span className={`font-mono-tabular text-sm sm:text-base ${secondaryText}`}>
                {seconds}
              </span>
            </div>
          )}
          {!use24Hour && (
            <span className={`text-[10px] sm:text-xs font-medium tracking-widest ${mutedText} self-end pb-1 ml-0.5`}>
              {meridiem}
            </span>
          )}
        </div>
        {renderDateLine()}
      </button>
    );
  }

  if (clockStyle === 'minimal-dot') {
    return (
      <button
        type="button"
        onClick={onClockClick}
        className={`w-full text-left group focus:outline-none focus-visible:ring-1 ${focusRing} rounded-lg`}
        aria-label="Open Clock & Timer"
      >
        <div
          className={`inline-flex items-baseline gap-2.5 px-4 py-2.5 rounded-2xl border backdrop-blur-md ${
            isLight
              ? 'border-zinc-900/15 bg-white/80 shadow-sm'
              : 'border-white/20 bg-zinc-950/60'
          }`}
        >
          <span
            className="w-2 h-2 rounded-full self-center shrink-0"
            style={{ backgroundColor: accentHex }}
            aria-hidden="true"
          />
          <span className={`font-display text-3xl sm:text-4xl sky-clock-digits tabular-nums ${primaryText} tracking-tight leading-none`}>
            {displayHour}:{minutes}
          </span>
          {showSeconds && (
            <span className={`font-mono-tabular text-sm sm:text-base ${mutedText}`}>{seconds}</span>
          )}
          {!use24Hour && (
            <span className={`text-[10px] font-medium tracking-widest ${mutedText}`}>{meridiem}</span>
          )}
        </div>
        {renderDateLine('mt-2')}
      </button>
    );
  }

  if (clockStyle === 'editorial') {
    return (
      <button
        type="button"
        onClick={onClockClick}
        className={`w-full text-left group focus:outline-none focus-visible:ring-1 ${focusRing} rounded-lg`}
        aria-label="Open Clock & Timer"
      >
        <div className="flex items-baseline gap-1.5 sm:gap-2 font-display tabular-nums leading-none tracking-tight">
          <span className={`${sizeScale} sky-clock-digits ${primaryText}`}>{displayHour}</span>
          <span className={`${sizeScale} font-extralight ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>:</span>
          <span className={`${sizeScale} sky-clock-digits ${secondaryText}`}>{minutes}</span>
          {showSeconds && (
            <span className={`font-mono-tabular text-base sm:text-xl ${mutedText} ml-1`}>
              {seconds}
            </span>
          )}
          {!use24Hour && (
            <span className={`text-[11px] sm:text-xs font-medium tracking-widest ${mutedText} ml-1`}>
              {meridiem}
            </span>
          )}
        </div>
        {renderDateLine()}
      </button>
    );
  }

  if (clockStyle === 'chronos') {
    return (
      <button
        type="button"
        onClick={onClockClick}
        className={`w-full text-left group focus:outline-none focus-visible:ring-1 ${focusRing} rounded-lg`}
        aria-label="Open Clock & Timer"
      >
        <div className="flex flex-col font-display tabular-nums leading-[0.88] tracking-tighter">
          <span className={`${compactSplitSize} sky-clock-digits ${primaryText}`}>{displayHour}</span>
          <div className="flex items-baseline gap-2">
            <span className={`${compactSplitSize} sky-clock-digits ${secondaryText} opacity-85`}>
              {minutes}
            </span>
            {showSeconds && (
              <span className={`font-mono-tabular text-sm sm:text-base ${mutedText}`}>
                {seconds}
              </span>
            )}
            {!use24Hour && (
              <span className={`text-[11px] sm:text-xs font-medium tracking-widest ${mutedText}`}>
                {meridiem}
              </span>
            )}
          </div>
        </div>
        {renderDateLine('mt-2')}
      </button>
    );
  }

  if (clockStyle === 'horizon') {
    return (
      <button
        type="button"
        onClick={onClockClick}
        className={`w-full text-left group focus:outline-none focus-visible:ring-1 ${focusRing} rounded-lg`}
        aria-label="Open Clock & Timer"
      >
        <div className="flex items-baseline gap-2 font-mono-tabular leading-none">
          <span className={`${sizeScale} sky-clock-digits tracking-tight ${primaryText}`}>
            {displayHour}:{minutes}
          </span>
          {showSeconds && <span className={`text-lg sm:text-xl ${mutedText}`}>:{seconds}</span>}
          {!use24Hour && <span className={`text-xs ${mutedText} ml-1`}>{meridiem}</span>}
        </div>
        <div
          className="mt-2.5 h-px w-24"
          style={{
            background: `linear-gradient(to right, ${accentHex}, transparent)`,
          }}
        />
        {renderDateLine()}
      </button>
    );
  }

  // Default: 'architectural'
  return (
    <button
      type="button"
      onClick={onClockClick}
      className={`w-full text-left group focus:outline-none focus-visible:ring-1 ${focusRing} rounded-lg`}
      aria-label="Open Clock & Timer"
    >
      <div className="flex items-baseline gap-1.5 font-display tabular-nums leading-none tracking-[-0.04em]">
        <span className={`${sizeScale} sky-clock-digits ${primaryText}`}>
          {displayHour}:{minutes}
        </span>
        {showSeconds && (
          <span className={`font-mono-tabular text-base sm:text-xl font-normal ${mutedText} ml-1`}>
            {seconds}
          </span>
        )}
        {!use24Hour && (
          <span className={`text-[11px] sm:text-xs font-medium tracking-widest ${mutedText} ml-1.5`}>
            {meridiem}
          </span>
        )}
      </div>
      {renderDateLine()}
    </button>
  );
};

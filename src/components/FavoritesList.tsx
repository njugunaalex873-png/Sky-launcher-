import React, { useRef, useState } from 'react';
import { Folder, Lock, MoreHorizontal, Zap } from 'lucide-react';
import { HomeSlotEntry } from '../hooks/useLauncherState';
import { getDefaultQuickActions, launchQuickActionTarget } from '../services/androidBridge';
import {
  AppItem,
  AppQuickAction,
  DailyAppUsageRecord,
  FontScale,
  HomeFolder,
  IconShape,
  IconSize,
  NotificationSummary,
} from '../types/launcher';
import { AppIconGlyph } from './AppIconGlyph';

interface FavoritesListProps {
  entries: HomeSlotEntry[];
  recentApps: AppItem[];
  showRecent: boolean;
  showAppIcons?: boolean;
  iconSize: IconSize;
  iconShape: IconShape;
  iconMonochrome: boolean;
  iconUniformMask?: boolean;
  fontScale: FontScale;
  notifications: Map<string, NotificationSummary>;
  showNotificationBadges: boolean;
  showNotificationPreview: boolean;
  lockedSet?: Set<string>;
  textOnlySet?: Set<string>;
  disabledSet?: Set<string>;
  dailyLimits?: Record<string, number>;
  dailyUsage?: Record<string, DailyAppUsageRecord>;
  customQuickActions?: Record<string, AppQuickAction[]>;
  isLight?: boolean;
  hasArtBackdrop?: boolean;
  accentHex?: string;
  accentFgHex?: string;
  onLaunch: (app: AppItem) => void;
  onOpenFolder?: (folder: HomeFolder) => void;
  onOpenOptions: (app: AppItem) => void;
  onStartDrag?: (app: AppItem) => void;
  onEndDrag?: () => void;
  onOpenHomeSelector?: () => void;
  onShowNotice?: (msg: string) => void;
}

export const FavoritesList: React.FC<FavoritesListProps> = ({
  entries,
  recentApps,
  showRecent,
  showAppIcons = true,
  iconSize,
  iconShape,
  iconMonochrome,
  iconUniformMask = false,
  fontScale,
  notifications,
  showNotificationBadges,
  showNotificationPreview,
  lockedSet,
  textOnlySet,
  disabledSet,
  dailyLimits = {},
  dailyUsage = {},
  customQuickActions = {},
  isLight = false,
  hasArtBackdrop = false,
  accentHex = '#ffffff',
  accentFgHex = '#000000',
  onLaunch,
  onOpenFolder,
  onOpenOptions,
  onStartDrag,
  onEndDrag,
  onOpenHomeSelector,
  onShowNotice,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const pointerDraggedRef = useRef(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [expandedQuickAppId, setExpandedQuickAppId] = useState<string | null>(null);

  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const check = () => {
      setIsOverflowing(el.scrollHeight > el.clientHeight + 4);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [entries.length, recentApps.length, showRecent, fontScale, iconSize, expandedQuickAppId]);

  const textSizeClass =
    fontScale === 'compact'
      ? 'text-sm'
      : fontScale === 'large'
      ? 'text-[17px]'
      : fontScale === 'xlarge'
      ? 'text-lg'
      : 'text-[15px] sm:text-base';

  const startLongPress = (app: AppItem | null, x: number, y: number) => {
    longPressTriggeredRef.current = false;
    pointerDraggedRef.current = false;
    pointerDownPosRef.current = { x, y };
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }
    if (!app) return;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      onOpenOptions(app);
    }, 480);
  };

  const trackPointerMove = (x: number, y: number) => {
    if (!pointerDownPosRef.current) return;
    if (Math.hypot(x - pointerDownPosRef.current.x, y - pointerDownPosRef.current.y) > 10) {
      pointerDraggedRef.current = true;
      cancelLongPress();
    }
  };

  const finishPointer = (app: AppItem | null, x: number, y: number) => {
    cancelLongPress();
    if (app && pointerDownPosRef.current) {
      const dx = x - pointerDownPosRef.current.x;
      const dy = y - pointerDownPosRef.current.y;
      if (dx > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        pointerDraggedRef.current = true;
        setExpandedQuickAppId((prev) => (prev === app.id ? null : app.id));
      } else if (dx < -48 && Math.abs(dx) > Math.abs(dy) * 1.4 && expandedQuickAppId === app.id) {
        pointerDraggedRef.current = true;
        setExpandedQuickAppId(null);
      }
    }
    pointerDownPosRef.current = null;
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const getQuickActionsForApp = (app: AppItem): AppQuickAction[] => {
    const custom = customQuickActions[app.id] || [];
    const builtIn = getDefaultQuickActions(app);
    return [...custom, ...builtIn];
  };

  const renderAppRow = (app: AppItem, subtle = false) => {
    const notif = notifications.get(app.packageName);
    const isLocked = lockedSet?.has(app.id) ?? false;
    const isDisabled = disabledSet?.has(app.id) ?? false;
    const hideIcon = !showAppIcons || (textOnlySet?.has(app.id) ?? false);
    const limit = dailyLimits[app.id];
    const usedToday = dailyUsage[app.id]?.count || 0;
    const quickActions = getQuickActionsForApp(app);
    const showQuick = expandedQuickAppId === app.id && quickActions.length > 0;

    return (
      <div key={app.id} className="space-y-1">
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', app.id);
            onStartDrag?.(app);
          }}
          onDragEnd={() => onEndDrag?.()}
          className={`group relative flex items-center justify-between gap-2 rounded-2xl transition-colors cursor-grab active:cursor-grabbing ${
            isDisabled ? 'opacity-60' : ''
          } ${
            hasArtBackdrop
              ? isLight
                ? 'bg-white/45 hover:bg-white/65 backdrop-blur-[3px]'
                : 'bg-black/25 hover:bg-black/40 backdrop-blur-[3px]'
              : isLight
              ? 'hover:bg-zinc-900/[0.05]'
              : 'hover:bg-white/[0.04]'
          }`}
        >
          <button
            type="button"
            onPointerDown={(e) => startLongPress(app, e.clientX, e.clientY)}
            onPointerMove={(e) => trackPointerMove(e.clientX, e.clientY)}
            onPointerUp={(e) => finishPointer(app, e.clientX, e.clientY)}
            onPointerLeave={cancelLongPress}
            onPointerCancel={cancelLongPress}
            onContextMenu={(e) => {
              e.preventDefault();
              onOpenOptions(app);
            }}
            onClick={() => {
              if (longPressTriggeredRef.current || pointerDraggedRef.current) {
                longPressTriggeredRef.current = false;
                pointerDraggedRef.current = false;
                return;
              }
              onLaunch(app);
            }}
            className={`flex-1 flex items-center text-left min-h-[46px] focus:outline-none focus-visible:ring-1 rounded-2xl active:scale-[0.99] transition-transform min-w-0 ${
              hideIcon ? 'gap-2 py-2 px-3' : 'gap-3.5 py-1.5 px-1.5'
            } ${
              isLight ? 'focus-visible:ring-zinc-900/35' : 'focus-visible:ring-white/40'
            }`}
          >
            {!hideIcon && (
              <div className={isDisabled ? 'grayscale opacity-50' : ''}>
                <AppIconGlyph
                  app={app}
                  size={iconSize}
                  shape={iconShape}
                  monochrome={iconMonochrome}
                  uniformMask={iconUniformMask}
                  highlighted={!subtle}
                  isLight={isLight}
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`truncate sky-app-label ${textSizeClass} ${
                    isDisabled
                      ? isLight
                        ? 'text-zinc-500'
                        : 'text-zinc-500'
                      : isLight
                      ? subtle
                        ? 'text-zinc-600'
                        : 'text-zinc-900 group-hover:text-black'
                      : subtle
                      ? 'text-zinc-300'
                      : 'text-zinc-100 group-hover:text-white'
                  }`}
                >
                  {app.name}
                </span>
                {isDisabled && (
                  <span
                    className={`font-mono-tabular text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
                      isLight
                        ? 'border-zinc-900/15 text-zinc-600 bg-zinc-900/5'
                        : 'border-white/15 text-zinc-400 bg-white/5'
                    }`}
                  >
                    Off
                  </span>
                )}
                {isLocked && !isDisabled && (
                  <Lock className={`w-3 h-3 shrink-0 ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`} aria-label="Locked" />
                )}
                {limit ? (
                  <span className="font-mono-tabular text-[11px] text-zinc-500 shrink-0">
                    {usedToday}/{limit}
                  </span>
                ) : null}
                {!isDisabled && showNotificationBadges && notif && notif.count > 0 && (
                  <span
                    className="font-mono-tabular text-[11px] font-semibold shrink-0"
                    style={{ color: accentHex }}
                  >
                    {notif.count}
                  </span>
                )}
              </div>
              {!isDisabled && showNotificationPreview && notif?.latestTitle && (
                <p className={`text-xs truncate mt-0.5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  {notif.latestTitle}
                  {notif.latestText ? ` — ${notif.latestText}` : ''}
                </p>
              )}
            </div>
          </button>

          <div className="flex items-center shrink-0">
            {quickActions.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedQuickAppId((prev) => (prev === app.id ? null : app.id));
                }}
                aria-label={`Quick actions for ${app.name}`}
                style={showQuick ? { color: accentHex } : undefined}
                className={`min-w-[36px] min-h-[44px] flex items-center justify-center rounded-xl transition-opacity ${
                  showQuick
                    ? 'opacity-100'
                    : isLight
                    ? 'text-zinc-400 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 hover:text-zinc-900'
                    : 'text-zinc-600 opacity-50 sm:opacity-0 sm:group-hover:opacity-100 hover:text-zinc-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenOptions(app);
              }}
              aria-label={`Options for ${app.name}`}
              className={`min-w-[40px] min-h-[44px] flex items-center justify-center opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-xl focus:outline-none focus-visible:opacity-100 focus-visible:ring-1 shrink-0 ${
                isLight
                  ? 'text-zinc-400 hover:text-zinc-900 focus-visible:ring-zinc-900/35'
                  : 'text-zinc-600 hover:text-zinc-200 focus-visible:ring-white/40'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showQuick && (
          <div className="flex flex-wrap items-center gap-1.5 pl-14 pr-2 pb-1">
            {quickActions.map((qa) => (
              <button
                key={qa.id}
                type="button"
                onClick={() => {
                  const ok = launchQuickActionTarget(qa.targetUrl);
                  if (!ok) {
                    onShowNotice?.(`Unable to open ${qa.label}`);
                  }
                  setExpandedQuickAppId(null);
                }}
                className={`min-h-[32px] px-3 rounded-xl border text-[11px] font-medium transition-colors whitespace-nowrap ${
                  isLight
                    ? 'bg-white/90 border-zinc-900/15 text-zinc-800 hover:bg-zinc-900 hover:text-white'
                    : 'bg-zinc-900 border-white/15 text-zinc-200 hover:bg-white hover:text-black'
                }`}
              >
                {qa.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderFolderRow = (folder: HomeFolder, folderApps: AppItem[]) => {
    const boxSizeClass =
      iconSize === 'small'
        ? 'w-9 h-9'
        : iconSize === 'large'
        ? 'w-14 h-14'
        : 'w-11 h-11';
    const radiusClass =
      iconShape === 'circle'
        ? 'rounded-full'
        : iconShape === 'sharp'
        ? 'rounded-lg'
        : 'rounded-2xl';

    return (
      <div
        key={`folder-${folder.id}`}
        className={`group relative flex items-center justify-between gap-2 rounded-2xl transition-colors ${
          hasArtBackdrop
            ? isLight
              ? 'bg-white/45 hover:bg-white/65 backdrop-blur-[3px]'
              : 'bg-black/25 hover:bg-black/40 backdrop-blur-[3px]'
            : isLight
            ? 'hover:bg-zinc-900/[0.05]'
            : 'hover:bg-white/[0.04]'
        }`}
      >
        <button
          type="button"
          onClick={() => onOpenFolder?.(folder)}
          className={`flex-1 flex items-center text-left min-h-[46px] focus:outline-none focus-visible:ring-1 rounded-2xl active:scale-[0.99] transition-transform min-w-0 ${
            showAppIcons ? 'gap-3.5 py-1.5 px-1.5' : 'gap-2 py-2 px-3'
          } ${
            isLight ? 'focus-visible:ring-zinc-900/35' : 'focus-visible:ring-white/40'
          }`}
        >
          {showAppIcons && (
            <div
              className={`relative flex items-center justify-center shrink-0 border ${boxSizeClass} ${radiusClass} ${
                isLight
                  ? 'border-zinc-900/15 bg-white/85 text-zinc-900 shadow-sm'
                  : 'border-white/25 bg-gradient-to-b from-zinc-800/80 to-zinc-950 text-white'
              }`}
            >
              <Folder className="w-5 h-5" strokeWidth={1.7} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`truncate sky-app-label ${textSizeClass} ${
                  isLight ? 'text-zinc-900 group-hover:text-black' : 'text-zinc-100 group-hover:text-white'
                }`}
              >
                {folder.name}
              </span>
              <span className="font-mono-tabular text-[11px] text-zinc-500 shrink-0">
                {folderApps.length}
              </span>
            </div>
            {folderApps.length > 0 && (
              <p className={`text-xs truncate mt-0.5 ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
                {folderApps
                  .slice(0, 3)
                  .map((a) => a.name)
                  .join(' · ')}
              </p>
            )}
          </div>
        </button>
      </div>
    );
  };

  return (
    <div
      ref={listRef}
      data-fav-scroll="true"
      className={`flex-1 min-h-0 overscroll-contain no-scrollbar space-y-4 ${
        isOverflowing ? 'overflow-y-auto touch-pan-y' : 'overflow-y-hidden touch-none'
      }`}
    >
      <div className="space-y-1">
        {entries.length === 0 ? (
          <div className="py-6 px-1 space-y-3">
            <p className={`text-sm ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              No apps selected for the home screen yet.
            </p>
            {onOpenHomeSelector && (
              <button
                type="button"
                onClick={onOpenHomeSelector}
                style={{ backgroundColor: accentHex, color: accentFgHex }}
                className="min-h-[44px] px-5 rounded-2xl text-xs font-semibold inline-flex items-center gap-2 transition-opacity hover:opacity-90"
              >
                <span>Select Home Apps (Up to 8)</span>
              </button>
            )}
          </div>
        ) : (
          entries.map((entry) =>
            entry.kind === 'folder'
              ? renderFolderRow(entry.folder, entry.apps)
              : renderAppRow(entry.app, false)
          )
        )}
      </div>

      {showRecent && recentApps.length > 0 && (
        <div className={`pt-3 border-t ${isLight ? 'border-zinc-900/10' : 'border-white/[0.08]'}`}>
          <p className="px-1.5 pb-1.5 text-[11px] text-zinc-500 font-medium tracking-wider uppercase">
            Recent
          </p>
          <div className="space-y-1">
            {recentApps.map((app) => renderAppRow(app, true))}
          </div>
        </div>
      )}
    </div>
  );
};

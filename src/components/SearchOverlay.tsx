import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Globe, MoreHorizontal, Search, X } from 'lucide-react';
import { AppItem, AppUsageRecord, IconShape, IconSize } from '../types/launcher';
import { AppIconGlyph } from './AppIconGlyph';

interface SearchOverlayProps {
  isOpen: boolean;
  apps: AppItem[];
  usage: Record<string, AppUsageRecord>;
  showAppIcons?: boolean;
  textOnlySet?: Set<string>;
  disabledSet?: Set<string>;
  iconSize: IconSize;
  iconShape: IconShape;
  iconMonochrome: boolean;
  iconUniformMask?: boolean;
  onClose: () => void;
  onLaunch: (app: AppItem) => void;
  onOpenOptions: (app: AppItem) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  apps,
  usage,
  showAppIcons = true,
  textOnlySet,
  disabledSet,
  iconSize,
  iconShape,
  iconMonochrome,
  iconUniformMask = false,
  onClose,
  onLaunch,
  onOpenOptions,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const swipeStartYRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      const t = window.setTimeout(() => inputRef.current?.focus(), 80);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);

  const quickApps = useMemo(() => {
    return [...apps]
      .sort((a, b) => {
        const diff = (usage[b.id]?.lastUsed || 0) - (usage[a.id]?.lastUsed || 0);
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      })
      .slice(0, 6);
  }, [apps, usage]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [...apps].sort((a, b) => a.name.localeCompare(b.name));
    }
    return apps
      .filter(
        (app) =>
          app.name.toLowerCase().includes(q) ||
          app.category.toLowerCase().includes(q) ||
          app.packageName.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.name.localeCompare(b.name);
      });
  }, [apps, query]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      onLaunch(results[0]);
      onClose();
    } else if (query.trim()) {
      window.open(
        `https://duckduckgo.com/?q=${encodeURIComponent(query.trim())}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/92 backdrop-blur-2xl flex flex-col items-center p-3 sm:p-6 pt-2 sm:pt-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search Applications"
    >
      <div
        className="sky-slide-up w-full max-w-2xl flex flex-col h-full max-h-full min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Swipe-down handle to dismiss back to Home */}
        <div
          onPointerDown={(e) => {
            swipeStartYRef.current = e.clientY;
          }}
          onPointerUp={(e) => {
            if (swipeStartYRef.current !== null && e.clientY - swipeStartYRef.current > 44) {
              onClose();
            }
            swipeStartYRef.current = null;
          }}
          className="touch-none pt-1 pb-2.5 flex flex-col items-center cursor-grab active:cursor-grabbing shrink-0"
        >
          <span className="w-10 h-1 rounded-full bg-white/30" aria-hidden="true" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-950 border border-white/25 shadow-[0_0_40px_rgba(255,255,255,0.08)]"
        >
          <Search className="w-5 h-5 text-zinc-300 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
            placeholder="Search apps, packages, or web..."
            className="flex-1 min-w-0 bg-transparent text-base text-white placeholder:text-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white border border-white/15 rounded-xl whitespace-nowrap shrink-0"
          >
            Close
          </button>
        </form>

        {/* Quick Apps Strip when search box is empty */}
        {!query.trim() && quickApps.length > 0 && (
          <div className="mt-3 shrink-0 rounded-2xl bg-zinc-950/75 border border-white/10 p-3">
            <p className="px-1 pb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-500">
              Quick Apps
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {quickApps.map((app) => {
                const hideIcon = !showAppIcons || (textOnlySet?.has(app.id) ?? false);
                const isDisabled = disabledSet?.has(app.id) ?? false;
                return (
                  <button
                    key={`quick-${app.id}`}
                    type="button"
                    onClick={() => {
                      onLaunch(app);
                      onClose();
                    }}
                    className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl hover:bg-white/[0.06] active:scale-95 transition-all min-w-0 ${
                      hideIcon ? 'border border-white/10 bg-zinc-900/50 min-h-[44px]' : ''
                    } ${isDisabled ? 'opacity-50' : ''}`}
                  >
                    {!hideIcon && (
                      <div className={isDisabled ? 'grayscale opacity-60' : ''}>
                        <AppIconGlyph
                          app={app}
                          size="small"
                          shape={iconShape}
                          monochrome={iconMonochrome}
                          uniformMask={iconUniformMask}
                          highlighted
                        />
                      </div>
                    )}
                    <span className="w-full text-center text-[11px] text-zinc-200 truncate sky-app-label">
                      {app.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtered Installed Apps List */}
        <div className="mt-3 flex-1 min-h-0 overflow-y-auto no-scrollbar rounded-2xl bg-zinc-950/80 border border-white/10 divide-y divide-white/[0.06]">
          {results.length === 0 ? (
            <div className="p-6 text-center space-y-4">
              <p className="text-sm text-zinc-400">
                No installed apps match "{query}"
              </p>
              {query.trim() && (
                <a
                  href={`https://duckduckgo.com/?q=${encodeURIComponent(query.trim())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>Search web for "{query.trim()}"</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              )}
            </div>
          ) : (
            results.map((app) => {
              const hideIcon = !showAppIcons || (textOnlySet?.has(app.id) ?? false);
              const isDisabled = disabledSet?.has(app.id) ?? false;
              return (
                <div
                  key={app.id}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors ${
                    isDisabled ? 'opacity-60' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onLaunch(app);
                      onClose();
                    }}
                    className={`flex-1 flex items-center text-left min-h-[46px] min-w-0 ${
                      hideIcon ? 'gap-2' : 'gap-3.5'
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
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm sm:text-base text-white truncate sky-app-label">
                          {app.name}
                        </p>
                        {isDisabled && (
                          <span className="font-mono-tabular text-[10px] uppercase px-1.5 py-0.5 rounded border border-white/15 text-zinc-400 shrink-0">
                            Off
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 truncate font-mono-tabular">
                        {app.category} · {app.packageName}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenOptions(app)}
                    aria-label={`Options for ${app.name}`}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-500 hover:text-white rounded-xl"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

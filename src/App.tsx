import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Battery,
  Compass,
  Download,
  Focus,
  Home,
  Settings,
  SlidersHorizontal,
  Smartphone,
} from 'lucide-react';
import { AlphabetRail } from './components/AlphabetRail';
import { AppIconGlyph } from './components/AppIconGlyph';
import { AppOptionsSheet } from './components/AppOptionsSheet';
import { AppWheel3D } from './components/AppWheel3D';
import { BuiltInAppletsModal } from './components/BuiltInAppletsModal';
import { DigitalClock } from './components/DigitalClock';
import { FavoritesList } from './components/FavoritesList';
import { FolderPopupModal } from './components/FolderPopupModal';
import { HiddenAppsPage } from './components/HiddenAppsPage';
import { HomeAppsSelectorModal } from './components/HomeAppsSelectorModal';
import { LaunchGateModal, LaunchGateState } from './components/LaunchGateModal';
import { PhoneLauncherModal } from './components/PhoneLauncherModal';
import { QuickTogglesSheet } from './components/QuickTogglesSheet';
import { SearchOverlay } from './components/SearchOverlay';
import { SettingsModal } from './components/SettingsModal';
import { WeatherWidget } from './components/WeatherWidget';
import { useLauncherState } from './hooks/useLauncherState';
import { usePWAInstall } from './hooks/usePWAInstall';
import { getThemeDefinition, ThemeDefinition } from './services/themes';
import { AppItem, GestureAction, HomeFolder, SettingsSectionId } from './types/launcher';

export default function App() {
  const {
    settings,
    updateSettings,
    installedApps,
    visibleApps,
    wheelApps,
    hasCustomWheelOrder,
    homeEntries,
    homeFolders,
    createHomeFolder,
    updateHomeFolder,
    deleteHomeFolder,
    recentApps,
    favorites,
    homeAppsConfigured,
    saveHomeApps,
    hiddenApps,
    hiddenPassword,
    setHiddenPassword,
    setCustomAppName,
    setCustomAppCategory,
    updateCustomAppUrl,
    textOnlyApps,
    toggleTextOnlyApp,
    disabledApps,
    toggleDisableApp,
    lockedApps,
    toggleLockApp,
    pausedApps,
    togglePauseApp,
    appDailyLimits,
    setAppDailyLimit,
    dailyUsage,
    focusBlockedApps,
    toggleFocusBlockedApp,
    customQuickActions,
    addQuickAction,
    removeQuickAction,
    usage,
    capabilities,
    notificationByPackage,
    weather,
    weatherLoading,
    refreshWeather,
    refreshBridge,
    activeApplet,
    setActiveApplet,
    statusNotice,
    showNotice,
    handleLaunchApp,
    toggleFavorite,
    moveFavorite,
    reorderWheelApp,
    moveWheelApp,
    resetWheelOrder,
    toggleHideApp,
    addCustomApp,
    removeCustomApp,
    exportBackup,
    importBackup,
    resetToDefaults,
    clearUsageHistory,
  } = useLauncherState();

  const [activeView, setActiveView] = useState<'home' | 'wheel' | 'hidden'>('home');
  const [wheelCategory, setWheelCategory] = useState<string>('All');
  const [wheelSelectedIndex, setWheelSelectedIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [homeAppsModalOpen, setHomeAppsModalOpen] = useState(false);
  const [quickTogglesOpen, setQuickTogglesOpen] = useState(false);
  const [phoneSetupOpen, setPhoneSetupOpen] = useState(false);
  const [openFolder, setOpenFolder] = useState<HomeFolder | null>(null);
  const { isInstallable, isInstalled, isOnline, install } = usePWAInstall();
  const [launchGate, setLaunchGate] = useState<LaunchGateState>(null);
  const [settingsSection, setSettingsSection] = useState<SettingsSectionId>('home');
  const [optionsApp, setOptionsApp] = useState<AppItem | null>(null);
  const [draggingApp, setDraggingApp] = useState<AppItem | null>(null);
  const [dragPointerPos, setDragPointerPos] = useState<{ x: number; y: number } | null>(null);

  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);
  const hiddenSet = useMemo(() => new Set(hiddenApps), [hiddenApps]);
  const lockedSet = useMemo(() => new Set(lockedApps), [lockedApps]);
  const pausedSet = useMemo(() => new Set(pausedApps), [pausedApps]);
  const focusBlockedSet = useMemo(() => new Set(focusBlockedApps), [focusBlockedApps]);
  const textOnlySet = useMemo(() => new Set(textOnlyApps), [textOnlyApps]);
  const disabledSet = useMemo(() => new Set(disabledApps), [disabledApps]);

  const activeOptionsApp = useMemo(
    () => (optionsApp ? installedApps.find((a) => a.id === optionsApp.id) || optionsApp : null),
    [optionsApp, installedApps]
  );

  const requestLaunchApp = useCallback(
    (
      app: AppItem,
      opts?: { skipFocus?: boolean; skipLock?: boolean; skipLimit?: boolean; skipPause?: boolean }
    ) => {
      if (disabledSet.has(app.id)) {
        showNotice(`${app.name} is turned off`);
        setOptionsApp(app);
        return;
      }

      if (!opts?.skipFocus && settings.focusModeEnabled && focusBlockedSet.has(app.id)) {
        setLaunchGate({
          type: 'focus-blocked',
          app,
          focusLabel: settings.focusModeLabel || 'Focus',
        });
        return;
      }

      if (!opts?.skipLock && lockedSet.has(app.id)) {
        setLaunchGate({ type: 'passcode', app });
        return;
      }

      const limit = appDailyLimits[app.id];
      const usedToday = dailyUsage[app.id]?.count || 0;
      if (!opts?.skipLimit && limit && usedToday >= limit) {
        setLaunchGate({ type: 'limit', app, usedToday, limit });
        return;
      }

      if (!opts?.skipPause && pausedSet.has(app.id)) {
        setLaunchGate({
          type: 'pause',
          app,
          seconds: settings.launchPauseSeconds || 4,
        });
        return;
      }

      setLaunchGate(null);
      handleLaunchApp(app);
    },
    [
      settings.focusModeEnabled,
      settings.focusModeLabel,
      settings.launchPauseSeconds,
      focusBlockedSet,
      disabledSet,
      lockedSet,
      appDailyLimits,
      dailyUsage,
      pausedSet,
      handleLaunchApp,
      showNotice,
    ]
  );

  const handleDeleteApp = useCallback(
    (app: AppItem) => {
      if (app.isCustom) {
        removeCustomApp(app.id);
        showNotice(`Removed ${app.name}`);
      } else if (capabilities.isNativeAndroid && window.SkyAndroid?.uninstallApp) {
        window.SkyAndroid.uninstallApp(app.packageName);
        showNotice(`Uninstalling ${app.name}`);
      } else {
        toggleHideApp(app.id);
        if (favoritesSet.has(app.id)) {
          toggleFavorite(app.id);
        }
        showNotice(`Deleted ${app.name}`);
      }
    },
    [capabilities.isNativeAndroid, removeCustomApp, toggleHideApp, favoritesSet, toggleFavorite, showNotice]
  );

  const handleStartDragApp = useCallback((app: AppItem, startX?: number, startY?: number) => {
    setDraggingApp(app);
    const x = startX ?? window.innerWidth / 2;
    const y = startY ?? 180;
    setDragPointerPos({ x, y });
  }, []);

  const handleDragMoveApp = useCallback((x: number, y: number) => {
    setDragPointerPos({ x, y });
  }, []);

  const handleEndDragApp = useCallback(() => {
    setDraggingApp(null);
    setDragPointerPos(null);
  }, []);

  // Gesture tracking refs for Home canvas
  const touchStartRef = useRef<{ x: number; y: number; time: number; canScroll?: boolean } | null>(
    null
  );
  const touchLastRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTapTimeRef = useRef<number>(0);
  const homeLongPressRef = useRef<number | null>(null);



  const wheelCategories = useMemo(() => {
    const unique = Array.from(new Set(wheelApps.map((a) => a.category).filter(Boolean))).sort();
    return ['All', ...unique];
  }, [wheelApps]);

  const filteredWheelApps = useMemo(() => {
    if (wheelCategory === 'All') return wheelApps;
    return wheelApps.filter((a) => a.category === wheelCategory);
  }, [wheelApps, wheelCategory]);

  // Reset category to All if active category disappears
  useEffect(() => {
    if (wheelCategory !== 'All' && !wheelCategories.includes(wheelCategory)) {
      setWheelCategory('All');
    }
  }, [wheelCategory, wheelCategories]);

  // Clamp wheel index if app count shrinks
  useEffect(() => {
    if (filteredWheelApps.length === 0) {
      setWheelSelectedIndex(0);
    } else if (wheelSelectedIndex >= filteredWheelApps.length) {
      setWheelSelectedIndex(0);
    }
  }, [filteredWheelApps.length, wheelSelectedIndex]);

  const activeLetter = useMemo(() => {
    const current = filteredWheelApps[wheelSelectedIndex];
    if (!current) return null;
    const ch = (current.name.trim()[0] || '#').toUpperCase();
    return /[A-Z]/.test(ch) ? ch : '#';
  }, [filteredWheelApps, wheelSelectedIndex]);

  const handleReorderFilteredWheel = useCallback(
    (fromFilteredIdx: number, toFilteredIdx: number) => {
      const fromApp = filteredWheelApps[fromFilteredIdx];
      const toApp = filteredWheelApps[toFilteredIdx];
      if (!fromApp || !toApp) return;
      const realFrom = wheelApps.findIndex((a) => a.id === fromApp.id);
      const realTo = wheelApps.findIndex((a) => a.id === toApp.id);
      if (realFrom !== -1 && realTo !== -1) {
        reorderWheelApp(realFrom, realTo);
      }
    },
    [filteredWheelApps, wheelApps, reorderWheelApp]
  );

  const returnHome = useCallback(() => {
    setSearchOpen(false);
    setSettingsOpen(false);
    setHomeAppsModalOpen(false);
    setQuickTogglesOpen(false);
    setOpenFolder(null);
    setLaunchGate(null);
    setOptionsApp(null);
    setActiveApplet(null);
    setActiveView('home');
  }, [setActiveApplet]);

  const executeGesture = useCallback(
    (action: GestureAction) => {
      if (action === 'open-wheel') {
        setActiveView('wheel');
      } else if (action === 'open-search') {
        setSearchOpen(true);
      } else if (action === 'open-settings') {
        setSettingsSection('home');
        setSettingsOpen(true);
      } else if (action === 'open-quick-toggles') {
        setQuickTogglesOpen(true);
      } else if (action === 'toggle-focus') {
        const next = !settings.focusModeEnabled;
        updateSettings({ focusModeEnabled: next });
        showNotice(
          next
            ? `${settings.focusModeLabel || 'Focus'} Mode enabled`
            : `${settings.focusModeLabel || 'Focus'} Mode off`
        );
      } else if (action === 'return-home') {
        returnHome();
      }
    },
    [returnHome, settings.focusModeEnabled, settings.focusModeLabel, updateSettings, showNotice]
  );

  // Register Android hardware Back, Home button, Resume, and Package-change handlers
  useEffect(() => {
    window.__SKY_ANDROID_BACK__ = () => {
      if (launchGate) {
        setLaunchGate(null);
        return;
      }
      if (openFolder) {
        setOpenFolder(null);
        return;
      }
      if (quickTogglesOpen) {
        setQuickTogglesOpen(false);
        return;
      }
      if (phoneSetupOpen) {
        setPhoneSetupOpen(false);
        return;
      }
      if (optionsApp) {
        setOptionsApp(null);
        return;
      }
      if (activeApplet) {
        setActiveApplet(null);
        return;
      }
      if (searchOpen) {
        setSearchOpen(false);
        return;
      }
      if (homeAppsModalOpen) {
        setHomeAppsModalOpen(false);
        return;
      }
      if (settingsOpen) {
        setSettingsOpen(false);
        return;
      }
      if (activeView === 'hidden') {
        setActiveView('wheel');
        return;
      }
      if (activeView === 'wheel') {
        setActiveView('home');
      }
    };
    window.__SKY_ANDROID_HOME__ = () => {
      returnHome();
    };
    window.__SKY_ANDROID_RESUME__ = () => {
      refreshBridge();
    };
    window.__SKY_ANDROID_PACKAGES_CHANGED__ = () => {
      refreshBridge();
    };
    return () => {
      delete window.__SKY_ANDROID_BACK__;
      delete window.__SKY_ANDROID_HOME__;
      delete window.__SKY_ANDROID_RESUME__;
      delete window.__SKY_ANDROID_PACKAGES_CHANGED__;
    };
  }, [
    launchGate,
    openFolder,
    quickTogglesOpen,
    phoneSetupOpen,
    optionsApp,
    activeApplet,
    searchOpen,
    homeAppsModalOpen,
    settingsOpen,
    activeView,
    setActiveApplet,
    returnHome,
    refreshBridge,
  ]);

  const activeTheme = useMemo(() => getThemeDefinition(settings.theme), [settings.theme]);

  // Apply Font & Theme Settings globally to root CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.fontFamily = settings.fontFamily;
    root.dataset.fontWeight = settings.fontWeight;
    root.dataset.fontTracking = settings.fontTracking;
    root.dataset.uppercaseLabels = settings.uppercaseLabels ? 'true' : 'false';
    root.dataset.theme = activeTheme.id;
    root.style.setProperty('--sky-bg', activeTheme.bgHex);
    root.style.setProperty('--sky-fg', activeTheme.fgHex);
    root.style.setProperty('--sky-accent', activeTheme.accentHex);
    root.style.setProperty('--sky-accent-fg', activeTheme.accentFgHex);
    root.style.setProperty('--sky-accent-rgb', activeTheme.accentRgb);
    root.style.setProperty('--sky-track-rgb', activeTheme.trackRgb);
    root.style.setProperty('--sky-glow-rgb', activeTheme.glowRgb);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', activeTheme.bgHex);
    }
    window.SkyAndroid?.setSystemBarAppearance?.(activeTheme.isLight);
  }, [
    settings.fontFamily,
    settings.fontWeight,
    settings.fontTracking,
    settings.uppercaseLabels,
    activeTheme,
  ]);

  // Inject optional user-provided Innuendo font file (@font-face)
  useEffect(() => {
    const styleId = 'sky-custom-innuendo-font';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (settings.customFontDataUrl) {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `@font-face { font-family: 'Innuendo'; src: url('${settings.customFontDataUrl}'); font-display: swap; }`;
    } else if (styleEl) {
      styleEl.remove();
    }
  }, [settings.customFontDataUrl]);

  // Desktop keyboard shortcuts (Escape -> Home, / -> Search, Left/Right -> Spin wheel, A-Z -> Jump letter)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

      if (e.key === 'Escape') {
        returnHome();
        return;
      }
      if (
        isTyping ||
        searchOpen ||
        settingsOpen ||
        homeAppsModalOpen ||
        quickTogglesOpen ||
        openFolder ||
        launchGate ||
        optionsApp ||
        activeApplet
      )
        return;

      if (e.key === '/') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === 'ArrowRight' && filteredWheelApps.length > 0) {
        setWheelSelectedIndex((idx) => (idx + 1) % filteredWheelApps.length);
      } else if (e.key === 'ArrowLeft' && filteredWheelApps.length > 0) {
        setWheelSelectedIndex(
          (idx) => (idx - 1 + filteredWheelApps.length) % filteredWheelApps.length
        );
      } else if (/^[a-zA-Z]$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const letter = e.key.toUpperCase();
        const matchIdx = filteredWheelApps.findIndex((app) =>
          app.name.trim().toUpperCase().startsWith(letter)
        );
        if (matchIdx !== -1) {
          setWheelSelectedIndex(matchIdx);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    filteredWheelApps,
    searchOpen,
    settingsOpen,
    homeAppsModalOpen,
    quickTogglesOpen,
    openFolder,
    launchGate,
    optionsApp,
    activeApplet,
    returnHome,
  ]);

  const cancelHomeLongPress = () => {
    if (homeLongPressRef.current) {
      window.clearTimeout(homeLongPressRef.current);
      homeLongPressRef.current = null;
    }
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const scrollContainer = target.closest('[data-fav-scroll]') as HTMLElement | null;
    const canScroll = Boolean(
      scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight + 4
    );
    touchStartRef.current = { x: e.clientX, y: e.clientY, time: performance.now(), canScroll };
    touchLastRef.current = { x: e.clientX, y: e.clientY };

    if (activeView !== 'home' || searchOpen || settingsOpen || optionsApp || activeApplet) {
      return;
    }

    const isInteractive = Boolean(target.closest('button, a, input, select'));

    if (!isInteractive && settings.longPressHomeAction !== 'none') {
      cancelHomeLongPress();
      homeLongPressRef.current = window.setTimeout(() => {
        setSettingsSection(
          settings.longPressHomeAction === 'customize' ? 'wallpaper' : 'home'
        );
        setSettingsOpen(true);
      }, 550);
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    touchLastRef.current = { x: e.clientX, y: e.clientY };
    const dx = e.clientX - touchStartRef.current.x;
    const dy = e.clientY - touchStartRef.current.y;
    if (Math.hypot(dx, dy) > 12) {
      cancelHomeLongPress();
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    cancelHomeLongPress();
    if (!touchStartRef.current) return;

    const endX = e.type === 'pointercancel' ? touchLastRef.current.x : e.clientX;
    const endY = e.type === 'pointercancel' ? touchLastRef.current.y : e.clientY;
    const dx = endX - touchStartRef.current.x;
    const dy = endY - touchStartRef.current.y;
    const elapsed = performance.now() - touchStartRef.current.time;
    const startedInScrollableList = touchStartRef.current.canScroll;
    touchStartRef.current = null;

    if (activeView !== 'home' || searchOpen || settingsOpen || optionsApp || activeApplet) {
      return;
    }

    const target = e.target as HTMLElement;
    const isInteractive = Boolean(target.closest('button, a, input, select'));

    // Home Swipe Up / Down gesture recognition (Swipe Up opens Search App UI)
    if (
      !startedInScrollableList &&
      elapsed < 650 &&
      Math.abs(dy) > 42 &&
      Math.abs(dy) > Math.abs(dx) * 1.15
    ) {
      if (dy < 0) {
        executeGesture(settings.swipeUpAction);
      } else {
        executeGesture(settings.swipeDownAction);
      }
      return;
    }

    // Double-tap on neutral Home canvas
    if (e.type !== 'pointercancel' && !isInteractive && Math.hypot(dx, dy) < 12) {
      const now = performance.now();
      if (now - lastTapTimeRef.current < 320) {
        lastTapTimeRef.current = 0;
        executeGesture(settings.doubleTapAction);
      } else {
        lastTapTimeRef.current = now;
      }
    }
  };

  const isLightTheme = activeTheme.isLight;

  const handleSelectLetter = useCallback(
    (_letter: string, firstMatchIndex: number) => {
      setWheelSelectedIndex(firstMatchIndex);
    },
    []
  );

  const isHomeInteractiveSurface =
    activeView === 'home' &&
    !searchOpen &&
    !settingsOpen &&
    !homeAppsModalOpen &&
    !quickTogglesOpen &&
    !openFolder &&
    !launchGate &&
    !optionsApp &&
    !activeApplet;

  return (
    <div
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
      onPointerCancel={handleCanvasPointerUp}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: activeTheme.canvasBackground,
        color: activeTheme.fgHex,
      }}
      className={`relative w-screen h-screen overflow-hidden flex flex-col transition-[background,color] duration-300 ${
        isHomeInteractiveSurface ? 'touch-none' : ''
      }`}
    >
      {/* Wallpaper or Cartoon Theme Illustration Layer */}
      {settings.wallpaperDataUrl ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-cover bg-center transition-all duration-300"
          style={{
            backgroundImage: `url(${settings.wallpaperDataUrl})`,
            filter: `${settings.wallpaperMonochrome ? 'grayscale(100%) contrast(1.08)' : ''} blur(${settings.wallpaperBlur}px)`,
          }}
        />
      ) : activeTheme.backgroundImage ? (
        <>
          <img
            src={activeTheme.backgroundImage}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="pointer-events-none absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300"
          />
          {activeTheme.scrimCss && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: activeTheme.scrimCss }}
            />
          )}
          <WallpaperPresetBackdrop preset={settings.wallpaperPreset} theme={activeTheme} />
        </>
      ) : (
        <WallpaperPresetBackdrop preset={settings.wallpaperPreset} theme={activeTheme} />
      )}

      {/* Dim Scrim Layer (only when a custom photo or non-default dark preset needs dimming) */}
      {(settings.wallpaperDataUrl ||
        (!activeTheme.backgroundImage && settings.wallpaperPreset !== 'pure-black' && !isLightTheme)) && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-black"
          style={{
            opacity: settings.wallpaperDataUrl
              ? settings.wallpaperDim / 100
              : Math.min(0.35, (settings.wallpaperDim / 100) * 0.45),
          }}
        />
      )}

      {/* Minimal Top Bar */}
      <header className="relative z-20 flex items-center justify-between gap-4 px-5 sm:px-8 pt-4 pb-2 shrink-0">
        <button
          type="button"
          onClick={returnHome}
          className={`font-display text-sm sm:text-base font-semibold tracking-[0.18em] transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-1 rounded-lg py-1 ${
            isLightTheme
              ? 'text-zinc-800 hover:text-black focus-visible:ring-zinc-900/35'
              : 'text-zinc-200 hover:text-white focus-visible:ring-white/40'
          }`}
        >
          SKY LAUNCHER
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {capabilities.batteryLevel !== null && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono-tabular ${
                isLightTheme ? 'text-zinc-600' : 'text-zinc-400'
              }`}
            >
              <Battery className="w-3.5 h-3.5" />
              <span>{capabilities.batteryLevel}%</span>
            </span>
          )}

          {settings.focusModeEnabled && (
            <button
              type="button"
              onClick={() => updateSettings({ focusModeEnabled: false })}
              style={{
                backgroundColor: activeTheme.accentHex,
                color: activeTheme.accentFgHex,
              }}
              className="min-h-[36px] px-2.5 rounded-xl text-[11px] font-semibold inline-flex items-center gap-1 hover:opacity-90 transition-opacity whitespace-nowrap"
              title="Tap to exit Focus Mode"
            >
              <Focus className="w-3 h-3" />
              <span>{settings.focusModeLabel || 'Focus'}</span>
            </button>
          )}

          {/* Toggle between Home Screen and 3D App Wheel */}
          <button
            type="button"
            onClick={() => setActiveView((v) => (v === 'home' ? 'wheel' : 'home'))}
            className={`min-h-[40px] px-3 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              isLightTheme
                ? 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-900/[0.06]'
                : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            {activeView !== 'home' ? (
              <>
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5" />
                <span>Apps</span>
              </>
            )}
          </button>

          {activeView === 'home' && capabilities.isNativeAndroid && !capabilities.isDefaultLauncher && (
            <button
              type="button"
              onClick={() => window.SkyAndroid?.openHomeSettings()}
              style={{
                backgroundColor: activeTheme.accentHex,
                color: activeTheme.accentFgHex,
              }}
              className="min-h-[38px] px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Set as Home</span>
            </button>
          )}

          {activeView === 'home' && !capabilities.isNativeAndroid && isInstallable && !isInstalled && (
            <button
              type="button"
              onClick={async () => {
                const res = await install();
                if (res === 'accepted') showNotice('SKY LAUNCHER installed on phone');
              }}
              style={{
                backgroundColor: activeTheme.accentHex,
                color: activeTheme.accentFgHex,
              }}
              className="min-h-[38px] px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
          )}

          {activeView === 'home' && (
            <button
              type="button"
              onClick={() => setQuickTogglesOpen(true)}
              aria-label="Open quick controls"
              className={`min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center transition-colors ${
                isLightTheme
                  ? 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-900/[0.06]'
                  : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setSettingsSection('home');
              setSettingsOpen(true);
            }}
            aria-label="Open settings"
            className={`min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center transition-colors ${
              isLightTheme
                ? 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-900/[0.06]'
                : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Responsive Launcher Stage */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col px-4 sm:px-8 pb-4 pt-1">
        {activeView === 'home' ? (
          /* HOME SCREEN ONLY (3D Wheel appears only when Apps button is pressed) */
          <section
            aria-label="Home Screen"
            className="flex flex-col w-full max-w-2xl mx-auto h-full min-h-0 justify-between gap-3 sm:gap-5 px-1"
          >
            {/* Clock, Date & Optional Live Weather */}
            <div className="pt-2 sm:pt-5 space-y-2.5 shrink-0">
              <DigitalClock
                clockStyle={settings.clockStyle}
                use24Hour={settings.use24Hour}
                showSeconds={settings.showSeconds}
                fontScale={settings.fontScale}
                isLight={isLightTheme}
                accentHex={activeTheme.accentHex}
                onClockClick={() => setActiveApplet('clock-timer')}
              />

              {settings.showWeather && weather && (
                <div>
                  <WeatherWidget
                    weather={weather}
                    unit={settings.weatherUnit}
                    loading={weatherLoading}
                    isLight={isLightTheme}
                    onRefresh={refreshWeather}
                  />
                </div>
              )}
            </div>

            {/* Vertical Home Slots List (Up to 8 Selected Apps & Folders) */}
            <div className="flex-1 min-h-0 flex flex-col py-1">
              <FavoritesList
                entries={homeEntries}
                recentApps={recentApps}
                showRecent={settings.showRecentOnHome}
                showAppIcons={settings.showAppIcons}
                iconSize={settings.iconSize}
                iconShape={settings.iconShape}
                iconMonochrome={settings.iconMonochrome}
                iconUniformMask={settings.iconUniformMask}
                fontScale={settings.fontScale}
                notifications={notificationByPackage}
                showNotificationBadges={settings.showNotificationBadges}
                showNotificationPreview={settings.showNotificationPreview}
                lockedSet={lockedSet}
                textOnlySet={textOnlySet}
                disabledSet={disabledSet}
                dailyLimits={appDailyLimits}
                dailyUsage={dailyUsage}
                customQuickActions={customQuickActions}
                isLight={isLightTheme}
                hasArtBackdrop={Boolean(!settings.wallpaperDataUrl && activeTheme.backgroundImage)}
                accentHex={activeTheme.accentHex}
                accentFgHex={activeTheme.accentFgHex}
                onLaunch={(app) => requestLaunchApp(app)}
                onOpenFolder={(folder) => setOpenFolder(folder)}
                onOpenOptions={setOptionsApp}
                onStartDrag={handleStartDragApp}
                onEndDrag={handleEndDragApp}
                onOpenHomeSelector={() => setHomeAppsModalOpen(true)}
                onShowNotice={showNotice}
              />
            </div>

            {/* Bottom Home Bar */}
            <div
              className={`shrink-0 flex items-center pt-1 gap-2 ${
                !homeAppsConfigured && homeEntries.length > 0
                  ? 'justify-between'
                  : 'justify-end'
              }`}
            >
              {!homeAppsConfigured && homeEntries.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHomeAppsModalOpen(true)}
                  className={`min-h-[48px] px-4 sm:px-5 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-2 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 ${
                    isLightTheme
                      ? 'bg-white/85 border-zinc-900/15 text-zinc-900 hover:bg-white shadow-sm'
                      : 'bg-zinc-900/90 border-white/20 text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <span>Select Home Apps ({favorites.length}/8)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveView('wheel')}
                style={{
                  backgroundColor: activeTheme.accentHex,
                  color: activeTheme.accentFgHex,
                }}
                className="min-h-[48px] px-6 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 shadow-sm"
              >
                <Compass className="w-4 h-4" />
                <span>Apps</span>
              </button>
            </div>
          </section>
        ) : activeView === 'hidden' ? (
          /* DEDICATED HIDE APPS PAGE (Opened when pressing Hide App) */
          <HiddenAppsPage
            apps={installedApps}
            hiddenSet={hiddenSet}
            hiddenPassword={hiddenPassword}
            onSetHiddenPassword={setHiddenPassword}
            onShowNotice={showNotice}
            showAppIcons={settings.showAppIcons}
            textOnlySet={textOnlySet}
            disabledSet={disabledSet}
            iconSize={settings.iconSize}
            iconShape={settings.iconShape}
            iconMonochrome={settings.iconMonochrome}
            onBackToWheel={() => setActiveView('wheel')}
            onToggleHideApp={toggleHideApp}
            onLaunchApp={(app) => requestLaunchApp(app)}
            onOpenOptions={setOptionsApp}
          />
        ) : (
          /* 3D CIRCULAR APP WHEEL + A-Z RAIL (Shown when Apps is pressed) */
          <section
            aria-label="3D Circular App Navigation"
            className="flex flex-1 min-w-0 min-h-0 relative items-center justify-between gap-1.5 sm:gap-3"
          >
            <div className="flex-1 h-full min-w-0 min-h-0 flex flex-col">
              <AppWheel3D
                apps={filteredWheelApps}
                selectedIndex={wheelSelectedIndex}
                onSelectIndexChange={setWheelSelectedIndex}
                onLaunchApp={(app) => requestLaunchApp(app)}
                onOpenOptions={setOptionsApp}
                onToggleFavorite={toggleFavorite}
                onToggleHideApp={toggleHideApp}
                onDeleteApp={handleDeleteApp}
                onRemoveCustomApp={removeCustomApp}
                onReturnHome={returnHome}
                isNativeAndroid={capabilities.isNativeAndroid}
                onMoveWheelApp={moveWheelApp}
                onReorderWheelApp={handleReorderFilteredWheel}
                onOpenWheelSettings={() => {
                  setSettingsSection('wheel');
                  setSettingsOpen(true);
                }}
                onOpenHiddenManager={() => setActiveView('hidden')}
                onUpdateWheelSize={(size) => updateSettings({ wheelSize: size })}
                onStartDrag={handleStartDragApp}
                onDragMove={handleDragMoveApp}
                onEndDrag={handleEndDragApp}
                favoritesSet={favoritesSet}
                notifications={notificationByPackage}
                showNotificationBadges={settings.showNotificationBadges}
                wheelStyle={settings.wheelStyle}
                wheelSize={settings.wheelSize}
                wheelSpeed={settings.wheelSpeed}
                wheelPerspective={settings.wheelPerspective}
                wheelRotationDirection={settings.wheelRotationDirection}
                wheelReflections={settings.wheelReflections}
                wheelInertia={settings.wheelInertia}
                wheelTiltDegrees={settings.wheelTiltDegrees}
                showWheelLabels={settings.showWheelLabels}
                showAppIcons={settings.showAppIcons}
                textOnlySet={textOnlySet}
                disabledSet={disabledSet}
                iconSize={settings.iconSize}
                iconShape={settings.iconShape}
                iconMonochrome={settings.iconMonochrome}
                iconUniformMask={settings.iconUniformMask}
                animationPreset={settings.animationPreset}
                enableHorizontalSwipe={settings.enableWheelHorizontalSwipe}
                wheelSoundHaptics={settings.wheelSoundHaptics}
                categories={wheelCategories}
                activeCategory={wheelCategory}
                onSelectCategory={(cat) => {
                  setWheelCategory(cat);
                  setWheelSelectedIndex(0);
                }}
                isLight={isLightTheme}
                trackRgb={activeTheme.trackRgb}
                accentHex={activeTheme.accentHex}
                accentFgHex={activeTheme.accentFgHex}
              />
            </div>

            <AlphabetRail
              apps={filteredWheelApps}
              activeLetter={activeLetter}
              enableHaptics={settings.wheelSoundHaptics}
              isLight={isLightTheme}
              accentHex={activeTheme.accentHex}
              onSelectLetter={handleSelectLetter}
            />
          </section>
        )}
      </main>

      {/* Subtle Transient Notice Toast (monochrome only) */}
      {statusNotice && (
        <div
          role="status"
          className="pointer-events-none fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-zinc-900/95 border border-white/20 text-xs font-medium text-white shadow-xl"
        >
          {statusNotice}
        </div>
      )}

      {/* Overlays & Modals */}
      <SearchOverlay
        isOpen={searchOpen}
        apps={visibleApps}
        usage={usage}
        showAppIcons={settings.showAppIcons}
        textOnlySet={textOnlySet}
        disabledSet={disabledSet}
        iconSize={settings.iconSize}
        iconShape={settings.iconShape}
        iconMonochrome={settings.iconMonochrome}
        iconUniformMask={settings.iconUniformMask}
        onClose={() => setSearchOpen(false)}
        onLaunch={(app) => requestLaunchApp(app)}
        onOpenOptions={setOptionsApp}
      />

      <AppOptionsSheet
        app={activeOptionsApp}
        isHidden={activeOptionsApp ? hiddenSet.has(activeOptionsApp.id) : false}
        isLocked={activeOptionsApp ? lockedSet.has(activeOptionsApp.id) : false}
        isPaused={activeOptionsApp ? pausedSet.has(activeOptionsApp.id) : false}
        isFocusBlocked={activeOptionsApp ? focusBlockedSet.has(activeOptionsApp.id) : false}
        isTextOnly={activeOptionsApp ? textOnlySet.has(activeOptionsApp.id) : false}
        isDisabled={activeOptionsApp ? disabledSet.has(activeOptionsApp.id) : false}
        showAppIcons={settings.showAppIcons}
        dailyLimit={activeOptionsApp ? appDailyLimits[activeOptionsApp.id] : undefined}
        usedToday={activeOptionsApp ? dailyUsage[activeOptionsApp.id]?.count || 0 : 0}
        customQuickActions={activeOptionsApp ? customQuickActions[activeOptionsApp.id] : []}
        usageRecord={activeOptionsApp ? usage[activeOptionsApp.id] : undefined}
        isNativeAndroid={capabilities.isNativeAndroid}
        iconShape={settings.iconShape}
        iconMonochrome={settings.iconMonochrome}
        iconUniformMask={settings.iconUniformMask}
        onClose={() => setOptionsApp(null)}
        onLaunch={(app) => requestLaunchApp(app)}
        onToggleHide={toggleHideApp}
        onToggleLock={toggleLockApp}
        onTogglePause={togglePauseApp}
        onToggleFocusBlock={toggleFocusBlockedApp}
        onToggleTextOnly={toggleTextOnlyApp}
        onToggleDisable={toggleDisableApp}
        onSetDailyLimit={setAppDailyLimit}
        onRenameApp={setCustomAppName}
        onUpdateCategory={setCustomAppCategory}
        onUpdateCustomUrl={updateCustomAppUrl}
        onAddQuickAction={addQuickAction}
        onRemoveQuickAction={removeQuickAction}
        onRemoveCustom={removeCustomApp}
        onShowNotice={showNotice}
      />

      {/* Floating Dragged App (Shows only the app being long pressed) */}
      {draggingApp && dragPointerPos && (
        <div
          className="fixed z-[80] pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-zinc-950/95 border border-white/40 shadow-[0_12px_36px_rgba(0,0,0,0.95)] backdrop-blur-md select-none scale-105"
          style={{
            left: `${dragPointerPos.x}px`,
            top: `${dragPointerPos.y}px`,
          }}
        >
          {settings.showAppIcons && !textOnlySet.has(draggingApp.id) && (
            <AppIconGlyph
              app={draggingApp}
              size="small"
              shape={settings.iconShape}
              monochrome={settings.iconMonochrome}
              uniformMask={settings.iconUniformMask}
              highlighted={true}
            />
          )}
          <span className="text-xs font-semibold text-white truncate max-w-[140px]">
            {draggingApp.name}
          </span>
        </div>
      )}

      <BuiltInAppletsModal
        appletId={activeApplet}
        capabilities={capabilities}
        installedCount={installedApps.length}
        onClose={() => setActiveApplet(null)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        initialSection={settingsSection}
        settings={settings}
        installedApps={installedApps}
        wheelApps={wheelApps}
        hasCustomWheelOrder={hasCustomWheelOrder}
        favorites={favorites}
        hiddenApps={hiddenApps}
        hiddenPassword={hiddenPassword}
        onOpenHiddenManager={() => setActiveView('hidden')}
        capabilities={capabilities}
        onClose={() => setSettingsOpen(false)}
        onUpdateSettings={updateSettings}
        onToggleFavorite={toggleFavorite}
        onMoveFavorite={moveFavorite}
        onMoveWheelApp={moveWheelApp}
        onResetWheelOrder={resetWheelOrder}
        onToggleHideApp={toggleHideApp}
        onAddCustomApp={addCustomApp}
        onOpenHomeSelector={() => setHomeAppsModalOpen(true)}
        textOnlyApps={textOnlyApps}
        disabledApps={disabledApps}
        lockedApps={lockedApps}
        pausedApps={pausedApps}
        appDailyLimits={appDailyLimits}
        dailyUsage={dailyUsage}
        focusBlockedApps={focusBlockedApps}
        onToggleTextOnlyApp={toggleTextOnlyApp}
        onToggleDisableApp={toggleDisableApp}
        onEditApp={(app) => setOptionsApp(app)}
        onToggleLockApp={toggleLockApp}
        onTogglePauseApp={togglePauseApp}
        onSetAppDailyLimit={setAppDailyLimit}
        onToggleFocusBlockedApp={toggleFocusBlockedApp}
        onExportBackup={exportBackup}
        onImportBackup={importBackup}
        onResetDefaults={resetToDefaults}
        onClearUsage={clearUsageHistory}
        onRefreshBridge={refreshBridge}
        onShowNotice={showNotice}
      />

      <PhoneLauncherModal
        isOpen={phoneSetupOpen}
        capabilities={capabilities}
        onRefreshBridge={refreshBridge}
        onShowNotice={showNotice}
        onClose={() => setPhoneSetupOpen(false)}
      />

      {!isOnline && !capabilities.isNativeAndroid && (
        <div
          role="status"
          className="fixed bottom-4 left-4 z-40 px-3 py-1.5 rounded-full bg-zinc-900/95 border border-white/20 text-[11px] font-medium text-zinc-200 flex items-center gap-2 shadow-lg"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>Offline Mode</span>
        </div>
      )}

      <HomeAppsSelectorModal
        isOpen={homeAppsModalOpen}
        installedApps={installedApps}
        hiddenSet={hiddenSet}
        favorites={favorites}
        homeFolders={homeFolders}
        iconShape={settings.iconShape}
        iconMonochrome={settings.iconMonochrome}
        iconUniformMask={settings.iconUniformMask}
        onClose={() => setHomeAppsModalOpen(false)}
        onUpdateFavorites={saveHomeApps}
        onCreateFolder={createHomeFolder}
        onUpdateFolder={updateHomeFolder}
        onDeleteFolder={deleteHomeFolder}
        onShowNotice={showNotice}
      />

      <FolderPopupModal
        folder={openFolder}
        apps={
          openFolder
            ? openFolder.appIds
                .map((id) => installedApps.find((a) => a.id === id))
                .filter(
                  (app): app is AppItem =>
                    Boolean(
                      app &&
                        !hiddenSet.has(app.id) &&
                        !(settings.focusModeEnabled && focusBlockedSet.has(app.id))
                    )
                )
            : []
        }
        showAppIcons={settings.showAppIcons}
        textOnlySet={textOnlySet}
        disabledSet={disabledSet}
        iconShape={settings.iconShape}
        iconMonochrome={settings.iconMonochrome}
        iconUniformMask={settings.iconUniformMask}
        onClose={() => setOpenFolder(null)}
        onLaunchApp={(app) => requestLaunchApp(app)}
        onOpenOptions={setOptionsApp}
        onEditFolder={() => setHomeAppsModalOpen(true)}
      />

      <QuickTogglesSheet
        isOpen={quickTogglesOpen}
        settings={settings}
        capabilities={capabilities}
        focusBlockedCount={focusBlockedApps.length}
        onClose={() => setQuickTogglesOpen(false)}
        onUpdateSettings={updateSettings}
        onOpenMindfulSettings={() => {
          setSettingsSection('mindful');
          setSettingsOpen(true);
        }}
        onOpenPhoneSetup={() => setPhoneSetupOpen(true)}
        onShowNotice={showNotice}
      />

      <LaunchGateModal
        gate={launchGate}
        hasPasscode={Boolean(hiddenPassword)}
        passcodeValue={hiddenPassword}
        iconShape={settings.iconShape}
        iconMonochrome={settings.iconMonochrome}
        iconUniformMask={settings.iconUniformMask}
        onCancel={() => setLaunchGate(null)}
        onSetPasscode={(pass) => {
          setHiddenPassword(pass);
          showNotice('Passcode saved');
        }}
        onVerifiedPasscode={(app) =>
          requestLaunchApp(app, { skipLock: true, skipFocus: true })
        }
        onConfirmPauseLaunch={(app) => {
          setLaunchGate(null);
          handleLaunchApp(app);
        }}
        onOverrideLimitLaunch={(app) =>
          requestLaunchApp(app, { skipFocus: true, skipLock: true, skipLimit: true })
        }
        onOverrideFocusLaunch={(app) => requestLaunchApp(app, { skipFocus: true })}
      />
    </div>
  );
}

const WallpaperPresetBackdrop: React.FC<{
  preset: 'pure-black' | 'obsidian-radial' | 'silver-horizon' | 'monolith-grid';
  theme: ThemeDefinition;
}> = ({ preset, theme }) => {
  if (preset === 'pure-black') {
    if (!theme.ambientOverlay) return null;
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: theme.ambientOverlay }}
      />
    );
  }

  if (preset === 'obsidian-radial') {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: theme.isLight
            ? `radial-gradient(circle at 68% 44%, rgba(${theme.glowRgb}, 0.16) 0%, rgba(${theme.glowRgb}, 0.05) 42%, transparent 78%)`
            : `radial-gradient(circle at 68% 48%, rgba(${theme.glowRgb}, 0.22) 0%, rgba(${theme.accentRgb}, 0.07) 40%, rgba(0,0,0,0.45) 82%)`,
        }}
      />
    );
  }

  if (preset === 'silver-horizon') {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: theme.isLight
            ? `linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(${theme.glowRgb}, 0.09) 52%, transparent 100%)`
            : `linear-gradient(180deg, transparent 0%, rgba(${theme.glowRgb}, 0.12) 52%, rgba(0,0,0,0.42) 100%)`,
        }}
      />
    );
  }

  if (preset === 'monolith-grid') {
    const lineColor = theme.isLight
      ? `rgba(${theme.trackRgb}, 0.07)`
      : `rgba(${theme.trackRgb}, 0.09)`;
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: `linear-gradient(to right, ${lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
    );
  }

  return null;
};

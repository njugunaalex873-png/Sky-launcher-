import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_FAVORITES,
  DEFAULT_SETTINGS,
  fetchLiveWeather,
  getAndroidCapabilities,
  isNativeAndroidEnvironment,
  launchApplication,
  queryActiveNotifications,
  queryInstalledApps,
  resolveDefaultNativeFavorites,
} from '../services/androidBridge';
import {
  AndroidBridgeCapabilities,
  AppItem,
  AppQuickAction,
  AppUsageRecord,
  BuiltInAppletId,
  DailyAppUsageRecord,
  FocusItem,
  HomeFolder,
  LauncherBackup,
  LauncherSettings,
  NotificationSummary,
  WeatherData,
} from '../types/launcher';

const STORAGE_KEYS = {
  SETTINGS: 'sky_launcher_settings_v1',
  FAVORITES: 'sky_launcher_favorites_v1',
  HIDDEN: 'sky_launcher_hidden_v1',
  HIDDEN_PASSWORD: 'sky_launcher_hidden_password_v1',
  CUSTOM_APPS: 'sky_launcher_custom_apps_v1',
  WHEEL_ORDER: 'sky_launcher_wheel_order_v1',
  USAGE: 'sky_launcher_usage_v1',
  HOME_APPS_CONFIGURED: 'sky_launcher_home_apps_configured_v1',
  HOME_FOLDERS: 'sky_launcher_home_folders_v1',
  CUSTOM_APP_NAMES: 'sky_launcher_custom_names_v1',
  CUSTOM_APP_CATEGORIES: 'sky_launcher_custom_categories_v1',
  TEXT_ONLY_APPS: 'sky_launcher_text_only_apps_v1',
  DISABLED_APPS: 'sky_launcher_disabled_apps_v1',
  LOCKED_APPS: 'sky_launcher_locked_apps_v1',
  PAUSED_APPS: 'sky_launcher_paused_apps_v1',
  DAILY_LIMITS: 'sky_launcher_daily_limits_v1',
  DAILY_USAGE: 'sky_launcher_daily_usage_v1',
  FOCUS_BLOCKED: 'sky_launcher_focus_blocked_v1',
  FOCUS_ITEMS: 'sky_launcher_focus_items_v1',
  QUICK_ACTIONS: 'sky_launcher_quick_actions_v1',
};

export type HomeSlotEntry =
  | { kind: 'app'; id: string; app: AppItem }
  | { kind: 'folder'; id: string; folder: HomeFolder; apps: AppItem[] };

function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return fallback;
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    if (
      typeof fallback === 'object' &&
      fallback !== null &&
      !Array.isArray(fallback) &&
      (typeof parsed !== 'object' || Array.isArray(parsed))
    ) {
      return fallback;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

const HOME_8_MIGRATION_KEY = 'sky_launcher_home_8_v1';
const SWIPE_UP_SEARCH_MIGRATION_KEY = 'sky_launcher_swipe_up_search_v1';
const NATIVE_FAVORITES_SEEDED_KEY = 'sky_launcher_native_favorites_v1';

export function useLauncherState() {
  const [customApps, setCustomApps] = useState<AppItem[]>(() =>
    readStorage<AppItem[]>(STORAGE_KEYS.CUSTOM_APPS, [])
  );

  const [installedApps, setInstalledApps] = useState<AppItem[]>(() =>
    queryInstalledApps(readStorage<AppItem[]>(STORAGE_KEYS.CUSTOM_APPS, []))
  );

  const [settings, setSettings] = useState<LauncherSettings>(() => {
    const stored = readStorage<Partial<LauncherSettings>>(STORAGE_KEYS.SETTINGS, {});
    const merged = { ...DEFAULT_SETTINGS, ...stored };
    if (!readStorage<boolean>(HOME_8_MIGRATION_KEY, false)) {
      merged.maxFavoritesOnHome = 8;
      merged.showRecentOnHome = false;
    }
    if (!readStorage<boolean>(SWIPE_UP_SEARCH_MIGRATION_KEY, false)) {
      writeStorage(SWIPE_UP_SEARCH_MIGRATION_KEY, true);
      merged.swipeUpAction = 'open-search';
    }
    return merged;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const rawStored = readStorage<string[]>(STORAGE_KEYS.FAVORITES, []);
    let hasStored = false;
    try {
      hasStored = localStorage.getItem(STORAGE_KEYS.FAVORITES) !== null && Array.isArray(rawStored);
    } catch {
      hasStored = false;
    }
    if (isNativeAndroidEnvironment()) {
      const nativeApps = queryInstalledApps(readStorage<AppItem[]>(STORAGE_KEYS.CUSTOM_APPS, []));
      const nativeIds = new Set(nativeApps.map((a) => a.id));
      const hasValidNativeFav = hasStored && rawStored.some((id) => nativeIds.has(id));
      if (!readStorage<boolean>(NATIVE_FAVORITES_SEEDED_KEY, false) || !hasValidNativeFav) {
        if (nativeApps.length > 0) {
          writeStorage(NATIVE_FAVORITES_SEEDED_KEY, true);
          writeStorage(HOME_8_MIGRATION_KEY, true);
          return resolveDefaultNativeFavorites(nativeApps, 8);
        }
      }
      return hasStored ? rawStored : [];
    }

    const webStored = hasStored ? rawStored : DEFAULT_FAVORITES;
    if (!readStorage<boolean>(HOME_8_MIGRATION_KEY, false)) {
      writeStorage(HOME_8_MIGRATION_KEY, true);
      if (webStored.length === 7 && !webStored.includes('com.google.android.gm')) {
        return [...webStored, 'com.google.android.gm'];
      }
    }
    return webStored;
  });

  const [homeAppsConfigured, setHomeAppsConfigured] = useState<boolean>(() =>
    readStorage<boolean>(STORAGE_KEYS.HOME_APPS_CONFIGURED, false)
  );

  const [hiddenApps, setHiddenApps] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.HIDDEN, [])
  );

  const [hiddenPassword, setHiddenPasswordState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.HIDDEN_PASSWORD) || null;
    } catch {
      return null;
    }
  });

  const setHiddenPassword = useCallback((pass: string | null) => {
    const trimmed = pass ? pass.trim() : null;
    setHiddenPasswordState(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem(STORAGE_KEYS.HIDDEN_PASSWORD, trimmed);
      } else {
        localStorage.removeItem(STORAGE_KEYS.HIDDEN_PASSWORD);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const [customWheelOrder, setCustomWheelOrder] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.WHEEL_ORDER, [])
  );

  const [usage, setUsage] = useState<Record<string, AppUsageRecord>>(() =>
    readStorage<Record<string, AppUsageRecord>>(STORAGE_KEYS.USAGE, {})
  );

  const [homeFolders, setHomeFolders] = useState<HomeFolder[]>(() =>
    readStorage<HomeFolder[]>(STORAGE_KEYS.HOME_FOLDERS, [])
  );

  const [customAppNames, setCustomAppNames] = useState<Record<string, string>>(() =>
    readStorage<Record<string, string>>(STORAGE_KEYS.CUSTOM_APP_NAMES, {})
  );

  const [customAppCategories, setCustomAppCategories] = useState<Record<string, string>>(() =>
    readStorage<Record<string, string>>(STORAGE_KEYS.CUSTOM_APP_CATEGORIES, {})
  );

  const [textOnlyApps, setTextOnlyApps] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.TEXT_ONLY_APPS, [])
  );

  const [disabledApps, setDisabledApps] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.DISABLED_APPS, [])
  );

  const [lockedApps, setLockedApps] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.LOCKED_APPS, [])
  );

  const [pausedApps, setPausedApps] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.PAUSED_APPS, [])
  );

  const [appDailyLimits, setAppDailyLimits] = useState<Record<string, number>>(() =>
    readStorage<Record<string, number>>(STORAGE_KEYS.DAILY_LIMITS, {})
  );

  const [dailyUsage, setDailyUsage] = useState<Record<string, DailyAppUsageRecord>>(() => {
    const raw = readStorage<Record<string, DailyAppUsageRecord>>(STORAGE_KEYS.DAILY_USAGE, {});
    const today = getTodayDateKey();
    const cleaned: Record<string, DailyAppUsageRecord> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v && v.date === today) {
        cleaned[k] = v;
      }
    }
    return cleaned;
  });

  const [focusBlockedApps, setFocusBlockedApps] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.FOCUS_BLOCKED, [])
  );

  const [focusItems, setFocusItems] = useState<FocusItem[]>(() =>
    readStorage<FocusItem[]>(STORAGE_KEYS.FOCUS_ITEMS, [])
  );

  const [customQuickActions, setCustomQuickActions] = useState<Record<string, AppQuickAction[]>>(() =>
    readStorage<Record<string, AppQuickAction[]>>(STORAGE_KEYS.QUICK_ACTIONS, {})
  );

  const [capabilities, setCapabilities] = useState<AndroidBridgeCapabilities>(() =>
    getAndroidCapabilities()
  );

  const [notifications, setNotifications] = useState<NotificationSummary[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [activeApplet, setActiveApplet] = useState<BuiltInAppletId | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Persist changes locally
  useEffect(() => {
    writeStorage(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.FAVORITES, favorites);
  }, [favorites]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.HOME_APPS_CONFIGURED, homeAppsConfigured);
  }, [homeAppsConfigured]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.HIDDEN, hiddenApps);
  }, [hiddenApps]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.CUSTOM_APPS, customApps);
    setInstalledApps(queryInstalledApps(customApps));
  }, [customApps]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.WHEEL_ORDER, customWheelOrder);
  }, [customWheelOrder]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.USAGE, usage);
  }, [usage]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.HOME_FOLDERS, homeFolders);
  }, [homeFolders]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.CUSTOM_APP_NAMES, customAppNames);
  }, [customAppNames]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.CUSTOM_APP_CATEGORIES, customAppCategories);
  }, [customAppCategories]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.TEXT_ONLY_APPS, textOnlyApps);
  }, [textOnlyApps]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.DISABLED_APPS, disabledApps);
  }, [disabledApps]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.LOCKED_APPS, lockedApps);
  }, [lockedApps]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.PAUSED_APPS, pausedApps);
  }, [pausedApps]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.DAILY_LIMITS, appDailyLimits);
  }, [appDailyLimits]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.DAILY_USAGE, dailyUsage);
  }, [dailyUsage]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.FOCUS_BLOCKED, focusBlockedApps);
  }, [focusBlockedApps]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.FOCUS_ITEMS, focusItems);
  }, [focusItems]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.QUICK_ACTIONS, customQuickActions);
  }, [customQuickActions]);

  // Refresh Android native capabilities on focus/visibility/package-change
  const refreshBridge = useCallback(() => {
    setCapabilities(getAndroidCapabilities());
    const nextApps = queryInstalledApps(customApps);
    setInstalledApps(nextApps);
    if (
      isNativeAndroidEnvironment() &&
      nextApps.length > 0 &&
      !readStorage<boolean>(NATIVE_FAVORITES_SEEDED_KEY, false)
    ) {
      writeStorage(NATIVE_FAVORITES_SEEDED_KEY, true);
      setFavorites(resolveDefaultNativeFavorites(nextApps, 8));
    }
  }, [customApps]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshBridge();
      }
    };
    window.addEventListener('visibilitychange', onVisibility);
    return () => window.removeEventListener('visibilitychange', onVisibility);
  }, [refreshBridge]);

  // Poll notifications only if user explicitly enabled notification integration
  useEffect(() => {
    if (!settings.notificationsEnabled) {
      setNotifications([]);
      return;
    }
    const updateNotifications = () => {
      setNotifications(queryActiveNotifications(true));
    };
    updateNotifications();
    const interval = window.setInterval(updateNotifications, 5000);
    return () => window.clearInterval(interval);
  }, [settings.notificationsEnabled]);

  // Weather fetcher (strictly real Open-Meteo data when authorized; never fabricated)
  const refreshWeather = useCallback(async () => {
    if (!settings.showWeather) {
      setWeather(null);
      return;
    }
    setWeatherLoading(true);
    const data = await fetchLiveWeather(settings.weatherCity);
    setWeather(data);
    setWeatherLoading(false);
  }, [settings.showWeather, settings.weatherCity]);

  useEffect(() => {
    refreshWeather();
    if (!settings.showWeather) return;
    const timer = window.setInterval(refreshWeather, 30 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [refreshWeather, settings.showWeather]);

  // Transient notice helper
  const showNotice = useCallback((message: string) => {
    setStatusNotice(message);
    window.setTimeout(() => {
      setStatusNotice((prev) => (prev === message ? null : prev));
    }, 2800);
  }, []);

  const updateSettings = useCallback((patch: Partial<LauncherSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  // Apply user-configured custom app names & categories seamlessly across all launcher surfaces
  const displayInstalledApps = useMemo<AppItem[]>(() => {
    return installedApps.map((app) => {
      const nameOverride = customAppNames[app.id]?.trim();
      const catOverride = customAppCategories[app.id]?.trim();
      return {
        ...app,
        originalName: app.name,
        name: nameOverride || app.name,
        originalCategory: app.category,
        category: catOverride || app.category,
      };
    });
  }, [installedApps, customAppNames, customAppCategories]);

  const focusBlockedSet = useMemo(() => new Set(focusBlockedApps), [focusBlockedApps]);

  // Visible (non-hidden, non-focus-blocked when Focus Mode active) sorted apps
  const visibleApps = useMemo(() => {
    const hiddenSet = new Set(hiddenApps);
    const list = displayInstalledApps.filter(
      (app) => !hiddenSet.has(app.id) && !(settings.focusModeEnabled && focusBlockedSet.has(app.id))
    );

    return [...list].sort((a, b) => {
      if (settings.sortOrder === 'reverse') {
        return b.name.localeCompare(a.name);
      }
      if (settings.sortOrder === 'most-used') {
        const diff = (usage[b.id]?.count || 0) - (usage[a.id]?.count || 0);
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      }
      if (settings.sortOrder === 'recent') {
        const diff = (usage[b.id]?.lastUsed || 0) - (usage[a.id]?.lastUsed || 0);
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
  }, [displayInstalledApps, hiddenApps, settings.sortOrder, settings.focusModeEnabled, focusBlockedSet, usage]);

  // Alphabetical list specifically for reference & default ordering
  const alphabeticalApps = useMemo(() => {
    const hiddenSet = new Set(hiddenApps);
    return displayInstalledApps
      .filter(
        (app) => !hiddenSet.has(app.id) && !(settings.focusModeEnabled && focusBlockedSet.has(app.id))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [displayInstalledApps, hiddenApps, settings.focusModeEnabled, focusBlockedSet]);

  // Custom-ordered 3D Wheel app list (defaults to alphabetical when customWheelOrder is empty)
  const wheelApps = useMemo(() => {
    if (customWheelOrder.length === 0) {
      return alphabeticalApps;
    }
    const orderMap = new Map<string, number>();
    customWheelOrder.forEach((id, index) => orderMap.set(id, index));

    return [...alphabeticalApps].sort((a, b) => {
      const idxA = orderMap.get(a.id);
      const idxB = orderMap.get(b.id);
      if (idxA !== undefined && idxB !== undefined) return idxA - idxB;
      if (idxA !== undefined) return -1;
      if (idxB !== undefined) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [alphabeticalApps, customWheelOrder]);

  const homeFolderById = useMemo(() => {
    const map = new Map<string, HomeFolder>();
    for (const folder of homeFolders) {
      map.set(folder.id, folder);
    }
    return map;
  }, [homeFolders]);

  const favoriteApps = useMemo(() => {
    const hiddenSet = new Set(hiddenApps);
    const byId = new Map(displayInstalledApps.map((app) => [app.id, app]));
    return favorites
      .map((id) => byId.get(id))
      .filter(
        (app): app is AppItem =>
          Boolean(
            app &&
              !hiddenSet.has(app.id) &&
              !(settings.focusModeEnabled && focusBlockedSet.has(app.id))
          )
      )
      .slice(0, Math.min(settings.maxFavoritesOnHome, 8));
  }, [displayInstalledApps, favorites, hiddenApps, settings.maxFavoritesOnHome, settings.focusModeEnabled, focusBlockedSet]);

  const homeEntries = useMemo(() => {
    const hiddenSet = new Set(hiddenApps);
    const byId = new Map(displayInstalledApps.map((app) => [app.id, app]));
    const entries: Array<
      | { kind: 'app'; id: string; app: AppItem }
      | { kind: 'folder'; id: string; folder: HomeFolder; apps: AppItem[] }
    > = [];

    for (const rawId of favorites) {
      if (entries.length >= Math.min(settings.maxFavoritesOnHome, 8)) break;
      if (rawId.startsWith('folder:')) {
        const folderId = rawId.slice('folder:'.length);
        const folder = homeFolderById.get(folderId);
        if (folder) {
          const appsInFolder = folder.appIds
            .map((id) => byId.get(id))
            .filter(
              (app): app is AppItem =>
                Boolean(
                  app &&
                    !hiddenSet.has(app.id) &&
                    !(settings.focusModeEnabled && focusBlockedSet.has(app.id))
                )
            );
          entries.push({ kind: 'folder', id: rawId, folder, apps: appsInFolder });
        }
      } else {
        const app = byId.get(rawId);
        if (
          app &&
          !hiddenSet.has(app.id) &&
          !(settings.focusModeEnabled && focusBlockedSet.has(app.id))
        ) {
          entries.push({ kind: 'app', id: app.id, app });
        }
      }
    }
    return entries;
  }, [
    favorites,
    homeFolderById,
    displayInstalledApps,
    hiddenApps,
    settings.maxFavoritesOnHome,
    settings.focusModeEnabled,
    focusBlockedSet,
  ]);

  const recentApps = useMemo(() => {
    const hiddenSet = new Set(hiddenApps);
    const favSet = new Set(favorites);
    return displayInstalledApps
      .filter(
        (app) =>
          !hiddenSet.has(app.id) &&
          !favSet.has(app.id) &&
          !(settings.focusModeEnabled && focusBlockedSet.has(app.id)) &&
          (usage[app.id]?.lastUsed || 0) > 0
      )
      .sort((a, b) => (usage[b.id]?.lastUsed || 0) - (usage[a.id]?.lastUsed || 0))
      .slice(0, 3);
  }, [displayInstalledApps, hiddenApps, favorites, usage, settings.focusModeEnabled, focusBlockedSet]);

  const notificationByPackage = useMemo(() => {
    const map = new Map<string, NotificationSummary>();
    if (settings.focusModeEnabled && settings.focusSilenceNotifications) {
      return map;
    }
    const filterSet = new Set(settings.notificationFilterApps);
    const byPkgId = new Map(displayInstalledApps.map((a) => [a.packageName, a.id]));
    for (const item of notifications) {
      const appId = byPkgId.get(item.packageName) || item.packageName;
      if (settings.notificationFilterMode === 'allowlist') {
        if (!filterSet.has(appId) && !filterSet.has(item.packageName)) continue;
      } else if (settings.notificationFilterMode === 'blocklist') {
        if (filterSet.has(appId) || filterSet.has(item.packageName)) continue;
      }
      map.set(item.packageName, item);
    }
    return map;
  }, [
    notifications,
    settings.focusModeEnabled,
    settings.focusSilenceNotifications,
    settings.notificationFilterMode,
    settings.notificationFilterApps,
    displayInstalledApps,
  ]);

  const handleLaunchApp = useCallback(
    (app: AppItem) => {
      const today = getTodayDateKey();
      setUsage((prev) => ({
        ...prev,
        [app.id]: {
          count: (prev[app.id]?.count || 0) + 1,
          lastUsed: Date.now(),
        },
      }));
      setDailyUsage((prev) => {
        const existing = prev[app.id];
        const nextCount = existing && existing.date === today ? existing.count + 1 : 1;
        return {
          ...prev,
          [app.id]: { date: today, count: nextCount },
        };
      });

      const result = launchApplication(app);
      if (result.openedApplet) {
        setActiveApplet(result.openedApplet);
      } else if (result.error) {
        showNotice(result.error);
      }
    },
    [showNotice]
  );

  const toggleFavorite = useCallback((appId: string) => {
    setFavorites((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  }, []);

  const saveHomeApps = useCallback((selectedIds: string[]) => {
    const clamped = selectedIds.slice(0, 8);
    setFavorites(clamped);
    setHomeAppsConfigured(clamped.length > 0);
  }, []);

  const moveFavorite = useCallback((appId: string, direction: 'up' | 'down') => {
    setFavorites((prev) => {
      const idx = prev.indexOf(appId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(targetIdx, 0, item);
      return next;
    });
  }, []);

  const toggleHideApp = useCallback((appId: string) => {
    setHiddenApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  }, []);

  const addCustomApp = useCallback(
    (input: { name: string; packageOrUrl: string; category: string }) => {
      const trimmedName = input.name.trim();
      const trimmedTarget = input.packageOrUrl.trim();
      if (!trimmedName || !trimmedTarget) return;

      const isUrl =
        trimmedTarget.startsWith('http://') ||
        trimmedTarget.startsWith('https://') ||
        trimmedTarget.startsWith('mailto:') ||
        trimmedTarget.startsWith('tel:') ||
        trimmedTarget.startsWith('sms:') ||
        trimmedTarget.includes('.');

      const normalizedUrl =
        trimmedTarget.startsWith('http://') ||
        trimmedTarget.startsWith('https://') ||
        trimmedTarget.startsWith('mailto:') ||
        trimmedTarget.startsWith('tel:') ||
        trimmedTarget.startsWith('sms:')
          ? trimmedTarget
          : isUrl
          ? `https://${trimmedTarget}`
          : undefined;

      const newApp: AppItem = {
        id: `custom.${Date.now()}`,
        name: trimmedName,
        packageName: normalizedUrl ? `web.${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}` : trimmedTarget,
        category: input.category.trim() || 'Custom',
        iconKey: 'globe',
        launchUrl: normalizedUrl,
        isCustom: true,
      };
      setCustomApps((prev) => [...prev, newApp]);
      showNotice(`Added ${trimmedName}`);
    },
    [showNotice]
  );

  const removeCustomApp = useCallback((appId: string) => {
    setCustomApps((prev) => prev.filter((a) => a.id !== appId));
    setFavorites((prev) => prev.filter((id) => id !== appId));
    setHiddenApps((prev) => prev.filter((id) => id !== appId));
    setCustomWheelOrder((prev) => prev.filter((id) => id !== appId));
  }, []);

  const reorderWheelApp = useCallback(
    (fromIndex: number, toIndex: number) => {
      const currentIds = wheelApps.map((app) => app.id);
      if (
        fromIndex < 0 ||
        fromIndex >= currentIds.length ||
        toIndex < 0 ||
        toIndex >= currentIds.length ||
        fromIndex === toIndex
      ) {
        return;
      }
      const next = [...currentIds];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      setCustomWheelOrder(next);
    },
    [wheelApps]
  );

  const moveWheelApp = useCallback(
    (appId: string, direction: 'prev' | 'next') => {
      const currentIds = wheelApps.map((app) => app.id);
      const idx = currentIds.indexOf(appId);
      if (idx === -1 || currentIds.length < 2) return;
      const targetIdx =
        direction === 'prev'
          ? (idx - 1 + currentIds.length) % currentIds.length
          : (idx + 1) % currentIds.length;
      const next = [...currentIds];
      const [moved] = next.splice(idx, 1);
      next.splice(targetIdx, 0, moved);
      setCustomWheelOrder(next);
    },
    [wheelApps]
  );

  const resetWheelOrder = useCallback(() => {
    setCustomWheelOrder([]);
    showNotice('Wheel positions reset to A–Z');
  }, [showNotice]);

  const createHomeFolder = useCallback(
    (name: string, appIds: string[]): HomeFolder | null => {
      const trimmed = name.trim();
      if (!trimmed || appIds.length === 0) return null;
      const folder: HomeFolder = {
        id: `fld_${Date.now().toString(36)}`,
        name: trimmed,
        appIds,
      };
      setHomeFolders((prev) => [...prev, folder]);
      showNotice(`Created folder ${trimmed}`);
      return folder;
    },
    [showNotice]
  );

  const updateHomeFolder = useCallback((folderId: string, name: string, appIds: string[]) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setHomeFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name: trimmed, appIds } : f))
    );
  }, []);

  const deleteHomeFolder = useCallback(
    (folderId: string) => {
      setHomeFolders((prev) => prev.filter((f) => f.id !== folderId));
      setFavorites((prev) => prev.filter((id) => id !== `folder:${folderId}`));
      showNotice('Folder removed');
    },
    [showNotice]
  );

  const setCustomAppName = useCallback(
    (appId: string, customName: string | null) => {
      const trimmed = customName ? customName.trim() : '';
      setCustomAppNames((prev) => {
        const next = { ...prev };
        if (!trimmed) {
          delete next[appId];
        } else {
          next[appId] = trimmed;
        }
        return next;
      });
      showNotice(trimmed ? `Renamed to ${trimmed}` : 'Restored original app name');
    },
    [showNotice]
  );

  const setCustomAppCategory = useCallback(
    (appId: string, customCategory: string | null) => {
      const trimmed = customCategory ? customCategory.trim() : '';
      setCustomAppCategories((prev) => {
        const next = { ...prev };
        if (!trimmed) {
          delete next[appId];
        } else {
          next[appId] = trimmed;
        }
        return next;
      });
      showNotice(trimmed ? `Category updated to ${trimmed}` : 'Restored original category');
    },
    [showNotice]
  );

  const updateCustomAppUrl = useCallback(
    (appId: string, packageOrUrl: string) => {
      const trimmedTarget = packageOrUrl.trim();
      if (!trimmedTarget) return;
      const isUrl =
        trimmedTarget.startsWith('http://') ||
        trimmedTarget.startsWith('https://') ||
        trimmedTarget.startsWith('mailto:') ||
        trimmedTarget.startsWith('tel:') ||
        trimmedTarget.startsWith('sms:') ||
        trimmedTarget.includes('.');
      const normalizedUrl =
        trimmedTarget.startsWith('http://') ||
        trimmedTarget.startsWith('https://') ||
        trimmedTarget.startsWith('mailto:') ||
        trimmedTarget.startsWith('tel:') ||
        trimmedTarget.startsWith('sms:')
          ? trimmedTarget
          : isUrl
          ? `https://${trimmedTarget}`
          : undefined;
      setCustomApps((prev) =>
        prev.map((a) =>
          a.id === appId
            ? {
                ...a,
                launchUrl: normalizedUrl,
                packageName: normalizedUrl ? a.packageName : trimmedTarget,
              }
            : a
        )
      );
      showNotice('Shortcut target updated');
    },
    [showNotice]
  );

  const toggleTextOnlyApp = useCallback((appId: string) => {
    setTextOnlyApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  }, []);

  const toggleDisableApp = useCallback((appId: string) => {
    setDisabledApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  }, []);

  const toggleLockApp = useCallback((appId: string) => {
    setLockedApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  }, []);

  const togglePauseApp = useCallback((appId: string) => {
    setPausedApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  }, []);

  const setAppDailyLimit = useCallback((appId: string, limit: number | null) => {
    setAppDailyLimits((prev) => {
      const next = { ...prev };
      if (!limit || limit <= 0) {
        delete next[appId];
      } else {
        next[appId] = limit;
      }
      return next;
    });
  }, []);

  const toggleFocusBlockedApp = useCallback((appId: string) => {
    setFocusBlockedApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  }, []);

  const addFocusItem = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setFocusItems((prev) => [
      ...prev,
      { id: `foc_${Date.now().toString(36)}`, text: trimmed, done: false, createdAt: Date.now() },
    ]);
  }, []);

  const toggleFocusItem = useCallback((itemId: string) => {
    setFocusItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item))
    );
  }, []);

  const removeFocusItem = useCallback((itemId: string) => {
    setFocusItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const clearCompletedFocusItems = useCallback(() => {
    setFocusItems((prev) => prev.filter((item) => !item.done));
  }, []);

  const addQuickAction = useCallback(
    (appId: string, label: string, targetUrl: string) => {
      const l = label.trim();
      const t = targetUrl.trim();
      if (!l || !t) return;
      setCustomQuickActions((prev) => ({
        ...prev,
        [appId]: [
          ...(prev[appId] || []),
          { id: `cqa_${Date.now().toString(36)}`, label: l, targetUrl: t },
        ],
      }));
      showNotice(`Added quick action: ${l}`);
    },
    [showNotice]
  );

  const removeQuickAction = useCallback((appId: string, actionId: string) => {
    setCustomQuickActions((prev) => {
      const existing = prev[appId] || [];
      const filtered = existing.filter((a) => a.id !== actionId);
      const next = { ...prev };
      if (filtered.length === 0) {
        delete next[appId];
      } else {
        next[appId] = filtered;
      }
      return next;
    });
  }, []);

  const exportBackup = useCallback((): LauncherBackup => {
    return {
      version: 2,
      exportedAt: new Date().toISOString(),
      settings,
      favorites,
      hiddenApps,
      hiddenPassword,
      customApps,
      customWheelOrder,
      usage,
      homeFolders,
      customAppNames,
      customAppCategories,
      textOnlyApps,
      disabledApps,
      lockedApps,
      pausedApps,
      appDailyLimits,
      dailyUsage,
      focusBlockedApps,
      focusItems,
      customQuickActions,
    };
  }, [
    settings,
    favorites,
    hiddenApps,
    hiddenPassword,
    customApps,
    customWheelOrder,
    usage,
    homeFolders,
    customAppNames,
    customAppCategories,
    textOnlyApps,
    disabledApps,
    lockedApps,
    pausedApps,
    appDailyLimits,
    dailyUsage,
    focusBlockedApps,
    focusItems,
    customQuickActions,
  ]);

  const importBackup = useCallback(
    (rawJson: string): boolean => {
      try {
        const parsed = JSON.parse(rawJson) as Partial<LauncherBackup>;
        if (!parsed || typeof parsed !== 'object' || !parsed.settings) {
          showNotice('Invalid backup file');
          return false;
        }
        setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
        if (Array.isArray(parsed.favorites)) setFavorites(parsed.favorites);
        if (Array.isArray(parsed.hiddenApps)) setHiddenApps(parsed.hiddenApps);
        if (parsed.hiddenPassword !== undefined) setHiddenPassword(parsed.hiddenPassword);
        if (Array.isArray(parsed.customApps)) setCustomApps(parsed.customApps);
        if (Array.isArray(parsed.customWheelOrder)) {
          setCustomWheelOrder(parsed.customWheelOrder);
        }
        if (parsed.usage && typeof parsed.usage === 'object') setUsage(parsed.usage);
        if (Array.isArray(parsed.homeFolders)) setHomeFolders(parsed.homeFolders);
        if (parsed.customAppNames && typeof parsed.customAppNames === 'object') {
          setCustomAppNames(parsed.customAppNames);
        }
        if (parsed.customAppCategories && typeof parsed.customAppCategories === 'object') {
          setCustomAppCategories(parsed.customAppCategories);
        }
        if (Array.isArray(parsed.textOnlyApps)) setTextOnlyApps(parsed.textOnlyApps);
        if (Array.isArray(parsed.disabledApps)) setDisabledApps(parsed.disabledApps);
        if (Array.isArray(parsed.lockedApps)) setLockedApps(parsed.lockedApps);
        if (Array.isArray(parsed.pausedApps)) setPausedApps(parsed.pausedApps);
        if (parsed.appDailyLimits && typeof parsed.appDailyLimits === 'object') {
          setAppDailyLimits(parsed.appDailyLimits);
        }
        if (parsed.dailyUsage && typeof parsed.dailyUsage === 'object') {
          setDailyUsage(parsed.dailyUsage);
        }
        if (Array.isArray(parsed.focusBlockedApps)) setFocusBlockedApps(parsed.focusBlockedApps);
        if (Array.isArray(parsed.focusItems)) setFocusItems(parsed.focusItems);
        if (parsed.customQuickActions && typeof parsed.customQuickActions === 'object') {
          setCustomQuickActions(parsed.customQuickActions);
        }
        showNotice('Backup restored');
        return true;
      } catch {
        showNotice('Failed to parse backup JSON');
        return false;
      }
    },
    [showNotice, setHiddenPassword]
  );

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setFavorites(
      isNativeAndroidEnvironment()
        ? resolveDefaultNativeFavorites(installedApps, 8)
        : DEFAULT_FAVORITES
    );
    setHomeAppsConfigured(false);
    setHiddenApps([]);
    setHiddenPassword(null);
    setCustomApps([]);
    setCustomWheelOrder([]);
    setUsage({});
    setHomeFolders([]);
    setCustomAppNames({});
    setCustomAppCategories({});
    setTextOnlyApps([]);
    setDisabledApps([]);
    setLockedApps([]);
    setPausedApps([]);
    setAppDailyLimits({});
    setDailyUsage({});
    setFocusBlockedApps([]);
    setFocusItems([]);
    setCustomQuickActions({});
    showNotice('Launcher reset to defaults');
  }, [installedApps, showNotice, setHiddenPassword]);

  const clearUsageHistory = useCallback(() => {
    setUsage({});
    setDailyUsage({});
    showNotice('Usage history cleared');
  }, [showNotice]);

  return {
    settings,
    updateSettings,
    installedApps: displayInstalledApps,
    visibleApps,
    alphabeticalApps,
    wheelApps,
    hasCustomWheelOrder: customWheelOrder.length > 0,
    favoriteApps,
    homeEntries,
    homeFolders,
    createHomeFolder,
    updateHomeFolder,
    deleteHomeFolder,
    recentApps,
    favorites,
    setFavorites,
    homeAppsConfigured,
    saveHomeApps,
    hiddenApps,
    hiddenPassword,
    setHiddenPassword,
    customApps,
    customAppNames,
    setCustomAppName,
    customAppCategories,
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
    focusItems,
    addFocusItem,
    toggleFocusItem,
    removeFocusItem,
    clearCompletedFocusItems,
    customQuickActions,
    addQuickAction,
    removeQuickAction,
    usage,
    capabilities,
    notifications,
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
  };
}

import {
  AndroidBridgeCapabilities,
  AppItem,
  AppQuickAction,
  BuiltInAppletId,
  LauncherSettings,
  NotificationSummary,
  WeatherData,
} from '../types/launcher';

export const DEFAULT_SETTINGS: LauncherSettings = {
  clockStyle: 'architectural',
  use24Hour: false,
  showSeconds: false,
  showWeather: true,
  weatherUnit: 'C',
  weatherCity: 'Auto',
  showRecentOnHome: false,
  maxFavoritesOnHome: 8,
  showFocusStrip: false,

  wheelStyle: 'carousel',
  wheelSize: 'standard',
  wheelSpeed: 1.0,
  wheelPerspective: 1.0,
  wheelRotationDirection: 'normal',
  wheelReflections: true,
  wheelSoundHaptics: true,
  wheelInertia: 0.935,
  showWheelLabels: true,
  wheelTiltDegrees: 6,

  swipeUpAction: 'open-search',
  swipeDownAction: 'open-quick-toggles',
  doubleTapAction: 'return-home',
  longPressHomeAction: 'customize',
  enableWheelHorizontalSwipe: true,

  theme: 'amoled',
  fontScale: 'balanced',
  fontFamily: 'sky-modern',
  fontWeight: 'regular',
  fontTracking: 'normal',
  uppercaseLabels: false,
  customFontDataUrl: null,
  customFontName: null,
  animationPreset: 'fluid',

  wallpaperDataUrl: null,
  wallpaperPreset: 'pure-black',
  wallpaperMonochrome: true,
  wallpaperDim: 45,
  wallpaperBlur: 0,

  showAppIcons: true,
  iconSize: 'medium',
  iconShape: 'squircle',
  iconMonochrome: true,
  iconUniformMask: false,

  sortOrder: 'alphabetical',

  focusModeEnabled: false,
  focusModeLabel: 'Focus',
  focusSilenceNotifications: true,
  launchPauseSeconds: 4,

  notificationsEnabled: false,
  showNotificationBadges: true,
  showNotificationPreview: true,
  notificationFilterMode: 'all',
  notificationFilterApps: [],
};

/**
 * Functional application catalog used in Web/PWA environments when Android PackageManager
 * is unavailable. Every entry opens either a real built-in Sky utility applet or a real
 * functional URI/web target. On Android APK, PackageManager replaces this list dynamically
 * with all installed device applications.
 */
export const FUNCTIONAL_APP_CATALOG: AppItem[] = [
  {
    id: 'com.sky.calculator',
    name: 'Calculator',
    packageName: 'com.sky.calculator',
    category: 'Utilities',
    iconKey: 'calculator',
    appletId: 'calculator',
    isSystem: true,
  },
  {
    id: 'com.android.calendar',
    name: 'Calendar',
    packageName: 'com.google.android.calendar',
    category: 'Productivity',
    iconKey: 'calendar',
    launchUrl: 'https://calendar.google.com',
  },
  {
    id: 'com.sky.camera',
    name: 'Camera',
    packageName: 'com.sky.camera',
    category: 'Media',
    iconKey: 'camera',
    appletId: 'camera',
    isSystem: true,
  },
  {
    id: 'com.android.chrome',
    name: 'Browser',
    packageName: 'com.android.chrome',
    category: 'Internet',
    iconKey: 'globe',
    launchUrl: 'https://duckduckgo.com',
  },
  {
    id: 'com.sky.clock',
    name: 'Clock & Timer',
    packageName: 'com.sky.clock',
    category: 'Utilities',
    iconKey: 'clock',
    appletId: 'clock-timer',
    isSystem: true,
  },
  {
    id: 'com.google.android.apps.docs',
    name: 'Drive',
    packageName: 'com.google.android.apps.docs',
    category: 'Productivity',
    iconKey: 'cloud',
    launchUrl: 'https://drive.google.com',
  },
  {
    id: 'com.sky.files',
    name: 'Device Inspector',
    packageName: 'com.sky.inspector',
    category: 'System',
    iconKey: 'cpu',
    appletId: 'system-inspector',
    isSystem: true,
  },
  {
    id: 'com.github.android',
    name: 'GitHub',
    packageName: 'com.github.android',
    category: 'Developer',
    iconKey: 'code',
    launchUrl: 'https://github.com',
  },
  {
    id: 'com.google.android.gm',
    name: 'Mail',
    packageName: 'com.google.android.gm',
    category: 'Communication',
    iconKey: 'mail',
    launchUrl: 'mailto:',
  },
  {
    id: 'com.google.android.apps.maps',
    name: 'Maps',
    packageName: 'com.google.android.apps.maps',
    category: 'Navigation',
    iconKey: 'map',
    launchUrl: 'https://maps.google.com',
  },
  {
    id: 'com.android.mms',
    name: 'Messages',
    packageName: 'com.google.android.apps.messaging',
    category: 'Communication',
    iconKey: 'message',
    launchUrl: 'sms:',
  },
  {
    id: 'com.spotify.music',
    name: 'Music',
    packageName: 'com.spotify.music',
    category: 'Media',
    iconKey: 'music',
    launchUrl: 'https://open.spotify.com',
  },
  {
    id: 'com.sky.notes',
    name: 'Notes',
    packageName: 'com.sky.notes',
    category: 'Productivity',
    iconKey: 'note',
    appletId: 'notes',
    isSystem: true,
  },
  {
    id: 'com.sky.dialer',
    name: 'Phone',
    packageName: 'com.sky.dialer',
    category: 'Communication',
    iconKey: 'phone',
    appletId: 'dialer',
    isSystem: true,
  },
  {
    id: 'com.google.android.apps.photos',
    name: 'Photos',
    packageName: 'com.google.android.apps.photos',
    category: 'Media',
    iconKey: 'image',
    launchUrl: 'https://photos.google.com',
  },
  {
    id: 'com.podcast.player',
    name: 'Podcasts',
    packageName: 'com.google.android.apps.podcasts',
    category: 'Media',
    iconKey: 'radio',
    launchUrl: 'https://pocketcasts.com',
  },
  {
    id: 'org.wikipedia',
    name: 'Reference',
    packageName: 'org.wikipedia',
    category: 'Knowledge',
    iconKey: 'book',
    launchUrl: 'https://en.wikipedia.org',
  },
  {
    id: 'com.google.android.googlequicksearchbox',
    name: 'Search',
    packageName: 'com.google.android.googlequicksearchbox',
    category: 'Internet',
    iconKey: 'search',
    launchUrl: 'https://www.google.com',
  },
  {
    id: 'com.termux',
    name: 'Terminal',
    packageName: 'com.termux',
    category: 'Developer',
    iconKey: 'terminal',
    launchUrl: 'https://webvm.io',
  },
  {
    id: 'com.google.android.youtube',
    name: 'Video',
    packageName: 'com.google.android.youtube',
    category: 'Media',
    iconKey: 'video',
    launchUrl: 'https://www.youtube.com',
  },
  {
    id: 'com.recorder.audio',
    name: 'Voice Memo',
    packageName: 'com.google.android.apps.recorder',
    category: 'Utilities',
    iconKey: 'mic',
    appletId: 'notes',
  },
  {
    id: 'com.wallet.finance',
    name: 'Wallet',
    packageName: 'com.google.android.apps.walletnfcrel',
    category: 'Finance',
    iconKey: 'wallet',
    launchUrl: 'https://wallet.google.com',
  },
];

export const DEFAULT_FAVORITES = [
  'com.sky.dialer',
  'com.android.mms',
  'com.android.chrome',
  'com.google.android.gm',
  'com.sky.notes',
  'com.sky.camera',
  'com.sky.calculator',
  'com.google.android.apps.maps',
];

export function isNativeAndroidEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof window.SkyAndroid !== 'undefined';
}

export function getAndroidCapabilities(): AndroidBridgeCapabilities {
  if (typeof window !== 'undefined' && window.SkyAndroid) {
    try {
      const statusRaw = window.SkyAndroid.getDeviceStatus();
      const status = statusRaw ? JSON.parse(statusRaw) : {};
      return {
        isNativeAndroid: true,
        isDefaultLauncher: Boolean(window.SkyAndroid.isDefaultLauncher()),
        hasNotificationAccess: Boolean(window.SkyAndroid.hasNotificationAccess()),
        androidSdkVersion: typeof status.sdkInt === 'number' ? status.sdkInt : null,
        batteryLevel: typeof status.batteryLevel === 'number' ? status.batteryLevel : null,
        isCharging: Boolean(status.isCharging),
      };
    } catch {
      return {
        isNativeAndroid: true,
        isDefaultLauncher: false,
        hasNotificationAccess: false,
        androidSdkVersion: null,
        batteryLevel: null,
        isCharging: false,
      };
    }
  }

  return {
    isNativeAndroid: false,
    isDefaultLauncher: false,
    hasNotificationAccess: false,
    androidSdkVersion: null,
    batteryLevel: null,
    isCharging: false,
  };
}

export function queryInstalledApps(customApps: AppItem[]): AppItem[] {
  if (typeof window !== 'undefined' && window.SkyAndroid) {
    try {
      const raw = window.SkyAndroid.getInstalledApps();
      const parsed = JSON.parse(raw) as Array<{
        id?: string;
        name: string;
        packageName: string;
        category?: string;
        iconBase64?: string;
      }>;
      if (Array.isArray(parsed)) {
        const nativeApps: AppItem[] = parsed.map((item) => ({
          id: item.packageName,
          name: item.name,
          packageName: item.packageName,
          category: item.category || 'Installed',
          iconKey: 'layers',
          iconBase64: item.iconBase64,
        }));
        return mergeApps(nativeApps, customApps);
      }
    } catch {
      // Never mix web placeholder catalog in native Android mode
      return mergeApps([], customApps);
    }
    return mergeApps([], customApps);
  }
  return mergeApps(FUNCTIONAL_APP_CATALOG, customApps);
}

const NATIVE_FAVORITE_SLOT_RULES: Array<{
  packagePatterns: RegExp[];
  namePattern: RegExp;
}> = [
  {
    packagePatterns: [/dialer/i, /telecom/i, /contacts/i, /incallui/i],
    namePattern: /^(phone|dialer|calls?)$/i,
  },
  {
    packagePatterns: [/messaging/i, /\.mms$/i, /messages/i, /whatsapp/i],
    namePattern: /^(messages?|sms|messaging)$/i,
  },
  {
    packagePatterns: [/chrome/i, /sbrowser/i, /browser/i, /firefox/i, /brave/i, /duckduckgo/i],
    namePattern: /^(chrome|browser|internet|samsung internet|firefox|brave)$/i,
  },
  {
    packagePatterns: [/camera/i, /opencamera/i],
    namePattern: /^camera$/i,
  },
  {
    packagePatterns: [/android\.gm$/i, /outlook/i, /email/i, /k9/i],
    namePattern: /^(gmail|mail|email|outlook)$/i,
  },
  {
    packagePatterns: [/photos/i, /gallery/i],
    namePattern: /^(photos|gallery)$/i,
  },
  {
    packagePatterns: [/apps\.maps/i, /maps/i, /waze/i, /osmand/i],
    namePattern: /^maps$/i,
  },
  {
    packagePatterns: [/deskclock/i, /clock/i, /calendar/i, /settings/i, /spotify/i],
    namePattern: /^(clock|calendar|settings|music|spotify)$/i,
  },
];

export function resolveDefaultNativeFavorites(installedApps: AppItem[], maxCount = 8): string[] {
  if (installedApps.length === 0) return [];
  const selected: string[] = [];
  const used = new Set<string>();

  for (const rule of NATIVE_FAVORITE_SLOT_RULES) {
    if (selected.length >= maxCount) break;
    const match =
      installedApps.find(
        (app) =>
          !used.has(app.id) &&
          rule.packagePatterns.some((rx) => rx.test(app.packageName))
      ) ||
      installedApps.find(
        (app) => !used.has(app.id) && rule.namePattern.test(app.name.trim())
      );
    if (match) {
      used.add(match.id);
      selected.push(match.id);
    }
  }

  for (const app of installedApps) {
    if (selected.length >= maxCount) break;
    if (!used.has(app.id)) {
      used.add(app.id);
      selected.push(app.id);
    }
  }

  return selected;
}

function mergeApps(base: AppItem[], custom: AppItem[]): AppItem[] {
  const seen = new Set(base.map((a) => a.id));
  const merged = [...base];
  for (const app of custom) {
    if (!seen.has(app.id)) {
      seen.add(app.id);
      merged.push(app);
    }
  }
  return merged;
}

export interface LaunchResult {
  launchedNative: boolean;
  openedApplet?: BuiltInAppletId;
  openedUrl?: string;
  error?: string;
}

export function launchApplication(app: AppItem): LaunchResult {
  if (app.appletId) {
    return { launchedNative: false, openedApplet: app.appletId };
  }

  if (app.launchUrl) {
    try {
      if (app.launchUrl.startsWith('tel:') || app.launchUrl.startsWith('mailto:') || app.launchUrl.startsWith('sms:')) {
        window.location.href = app.launchUrl;
      } else {
        const link = document.createElement('a');
        link.href = app.launchUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      return { launchedNative: false, openedUrl: app.launchUrl };
    } catch {
      return { launchedNative: false, error: `Unable to launch ${app.name}` };
    }
  }

  if (typeof window !== 'undefined' && window.SkyAndroid) {
    try {
      const ok = window.SkyAndroid.launchApp(app.packageName);
      return ok
        ? { launchedNative: true }
        : { launchedNative: false, error: `Unable to open ${app.name}` };
    } catch {
      return { launchedNative: false, error: `Unable to launch ${app.name}` };
    }
  }

  return { launchedNative: false, error: `No launch target configured for ${app.name}` };
}

export function getDefaultQuickActions(app: AppItem): AppQuickAction[] {
  const pkg = app.packageName.toLowerCase();
  const name = (app.originalName || app.name).toLowerCase();

  if (pkg.includes('dialer') || name.includes('phone')) {
    return [
      { id: 'qa-dial-call', label: 'Quick Dial', targetUrl: 'tel:' },
      { id: 'qa-dial-voicemail', label: 'Voicemail', targetUrl: 'tel:*86' },
    ];
  }
  if (pkg.includes('messaging') || pkg.includes('mms') || name.includes('message')) {
    return [{ id: 'qa-new-sms', label: 'New Message', targetUrl: 'sms:' }];
  }
  if (pkg.includes('.gm') || name.includes('mail')) {
    return [{ id: 'qa-compose-mail', label: 'Compose Email', targetUrl: 'mailto:' }];
  }
  if (pkg.includes('chrome') || pkg.includes('browser') || app.iconKey === 'globe') {
    return [
      { id: 'qa-web-search', label: 'Private Search', targetUrl: 'https://duckduckgo.com' },
      { id: 'qa-news', label: 'Reader Mode', targetUrl: 'https://en.m.wikipedia.org' },
    ];
  }
  if (pkg.includes('maps') || app.iconKey === 'map') {
    return [
      {
        id: 'qa-maps-nearby',
        label: 'Search Nearby',
        targetUrl: 'https://maps.google.com/?q=coffee+near+me',
      },
    ];
  }
  if (pkg.includes('calendar') || app.iconKey === 'calendar') {
    return [
      {
        id: 'qa-cal-today',
        label: "Today's Agenda",
        targetUrl: 'https://calendar.google.com/calendar/r/day',
      },
    ];
  }
  return [];
}

export function launchQuickActionTarget(targetUrl: string): boolean {
  const trimmed = targetUrl.trim();
  if (!trimmed) return false;
  try {
    if (
      trimmed.startsWith('tel:') ||
      trimmed.startsWith('mailto:') ||
      trimmed.startsWith('sms:')
    ) {
      window.location.href = trimmed;
      return true;
    }
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const link = document.createElement('a');
    link.href = normalized;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch {
    return false;
  }
}

export function queryActiveNotifications(userEnabled: boolean): NotificationSummary[] {
  if (!userEnabled) return [];
  if (typeof window !== 'undefined' && window.SkyAndroid) {
    try {
      if (!window.SkyAndroid.hasNotificationAccess()) return [];
      const raw = window.SkyAndroid.getActiveNotifications();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

const CITY_COORDS: Record<string, { lat: number; lon: number; label: string }> = {
  Nairobi: { lat: -1.2921, lon: 36.8219, label: 'Nairobi' },
  London: { lat: 51.5072, lon: -0.1276, label: 'London' },
  'New York': { lat: 40.7128, lon: -74.006, label: 'New York' },
  Tokyo: { lat: 35.6762, lon: 139.6503, label: 'Tokyo' },
  'San Francisco': { lat: 37.7749, lon: -122.4194, label: 'San Francisco' },
  Berlin: { lat: 52.52, lon: 13.405, label: 'Berlin' },
};

function describeWmoCode(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code <= 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 48) return 'Mist';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

export async function fetchLiveWeather(cityPreference: string): Promise<WeatherData | null> {
  let lat: number | null = null;
  let lon: number | null = null;
  let locationName = '';

  if (cityPreference !== 'Auto' && CITY_COORDS[cityPreference]) {
    lat = CITY_COORDS[cityPreference].lat;
    lon = CITY_COORDS[cityPreference].lon;
    locationName = CITY_COORDS[cityPreference].label;
  } else if (cityPreference === 'Auto' && typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 4500,
          maximumAge: 600000,
        });
      });
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
      locationName = 'Current Location';
    } catch {
      // Do not fabricate a fallback city or weather reading
      return null;
    }
  }

  if (lat === null || lon === null) {
    return null;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const current = json.current;
    if (!current || typeof current.temperature_2m !== 'number') {
      return null;
    }
    const code = typeof current.weather_code === 'number' ? current.weather_code : 1;
    return {
      temperatureC: Math.round(current.temperature_2m),
      condition: describeWmoCode(code),
      weatherCode: code,
      locationName,
      windKmh: Math.round(typeof current.wind_speed_10m === 'number' ? current.wind_speed_10m : 0),
      humidity: Math.round(typeof current.relative_humidity_2m === 'number' ? current.relative_humidity_2m : 0),
      updatedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export const WEATHER_CITY_OPTIONS = ['Auto', ...Object.keys(CITY_COORDS)];

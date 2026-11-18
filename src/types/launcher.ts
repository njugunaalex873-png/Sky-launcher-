export type LauncherTheme =
  | 'amoled'
  | 'dark-grey'
  | 'silver'
  | 'midnight-ocean'
  | 'emerald-forest'
  | 'amber-sunset'
  | 'crimson-noir'
  | 'violet-cosmos'
  | 'nordic-paper'
  | 'sky-daylight'
  | 'cartoon-anime'
  | 'cartoon-comic'
  | 'cartoon-pixel'
  | 'cartoon-storybook'
  | 'cartoon-space';

export type ClockStyle =
  | 'architectural'
  | 'editorial'
  | 'chronos'
  | 'horizon'
  | 'analog-dial'
  | 'orbital-ring'
  | 'split-flap'
  | 'minimal-dot';

export type FontScale = 'compact' | 'balanced' | 'large' | 'xlarge';

export type FontFamilyId =
  | 'sky-modern'
  | 'futuristic-grotesk'
  | 'swiss-minimal'
  | 'editorial-serif'
  | 'mono-tech'
  | 'innuendo';

export type FontWeightPreset = 'light' | 'regular' | 'medium' | 'bold';

export type FontTrackingPreset = 'tight' | 'normal' | 'wide';

export type IconSize = 'small' | 'medium' | 'large';

export type IconShape = 'squircle' | 'circle' | 'sharp';

export type WheelSize = 'compact' | 'standard' | 'expanded';

export type WheelStyle = 'carousel' | 'sphere' | 'horizontal' | 'vertical';

export type WheelRotationDirection = 'normal' | 'inverted';

export type AnimationPreset = 'fluid' | 'crisp' | 'reduced';

export type SortOrder = 'alphabetical' | 'reverse' | 'most-used' | 'recent';

export type GestureAction =
  | 'open-wheel'
  | 'open-search'
  | 'open-settings'
  | 'open-quick-toggles'
  | 'toggle-focus'
  | 'return-home'
  | 'none';

export type BuiltInAppletId =
  | 'calculator'
  | 'notes'
  | 'clock-timer'
  | 'dialer'
  | 'camera'
  | 'system-inspector';

export type AppIconKey =
  | 'phone'
  | 'message'
  | 'mail'
  | 'globe'
  | 'camera'
  | 'image'
  | 'music'
  | 'video'
  | 'map'
  | 'calendar'
  | 'clock'
  | 'calculator'
  | 'note'
  | 'folder'
  | 'terminal'
  | 'code'
  | 'cloud'
  | 'compass'
  | 'book'
  | 'shield'
  | 'sliders'
  | 'radio'
  | 'search'
  | 'layers'
  | 'cpu'
  | 'wallet'
  | 'mic'
  | 'sparkles';

export interface AppItem {
  id: string;
  name: string;
  originalName?: string;
  packageName: string;
  category: string;
  originalCategory?: string;
  iconKey: AppIconKey;
  iconBase64?: string;
  launchUrl?: string;
  appletId?: BuiltInAppletId;
  isSystem?: boolean;
  isCustom?: boolean;
}

export interface HomeFolder {
  id: string;
  name: string;
  appIds: string[];
}

export interface AppQuickAction {
  id: string;
  label: string;
  targetUrl: string;
}

export interface FocusItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export interface AppUsageRecord {
  count: number;
  lastUsed: number;
}

export interface DailyAppUsageRecord {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface NotificationSummary {
  packageName: string;
  count: number;
  latestTitle?: string;
  latestText?: string;
  timestamp: number;
}

export interface WeatherData {
  temperatureC: number;
  condition: string;
  weatherCode: number;
  locationName: string;
  windKmh: number;
  humidity: number;
  updatedAt: number;
}

export type NotificationFilterMode = 'all' | 'allowlist' | 'blocklist';

export interface LauncherSettings {
  // Home screen
  clockStyle: ClockStyle;
  use24Hour: boolean;
  showSeconds: boolean;
  showWeather: boolean;
  weatherUnit: 'C' | 'F';
  weatherCity: string;
  showRecentOnHome: boolean;
  maxFavoritesOnHome: number;
  showFocusStrip: boolean;

  // App wheel
  wheelStyle: WheelStyle;
  wheelSize: WheelSize;
  wheelSpeed: number; // 0.4 to 2.5
  wheelPerspective: number; // 0.5 to 1.6
  wheelRotationDirection: WheelRotationDirection;
  wheelReflections: boolean;
  wheelSoundHaptics: boolean;
  wheelInertia: number; // 0.85 to 0.965 damping factor
  showWheelLabels: boolean;
  wheelTiltDegrees: number; // -12 to 18

  // Gestures
  swipeUpAction: GestureAction;
  swipeDownAction: GestureAction;
  doubleTapAction: GestureAction;
  longPressHomeAction: 'customize' | 'settings' | 'none';
  enableWheelHorizontalSwipe: boolean;

  // Appearance & typography
  theme: LauncherTheme;
  fontScale: FontScale;
  fontFamily: FontFamilyId;
  fontWeight: FontWeightPreset;
  fontTracking: FontTrackingPreset;
  uppercaseLabels: boolean;
  customFontDataUrl?: string | null;
  customFontName?: string | null;
  animationPreset: AnimationPreset;

  // Wallpaper
  wallpaperDataUrl: string | null;
  wallpaperPreset: 'pure-black' | 'obsidian-radial' | 'silver-horizon' | 'monolith-grid';
  wallpaperMonochrome: boolean;
  wallpaperDim: number; // 0 to 95
  wallpaperBlur: number; // 0 to 24

  // Icon customization
  showAppIcons: boolean;
  iconSize: IconSize;
  iconShape: IconShape;
  iconMonochrome: boolean;
  iconUniformMask: boolean;

  // App management
  sortOrder: SortOrder;

  // Mindful & Focus
  focusModeEnabled: boolean;
  focusModeLabel: string;
  focusSilenceNotifications: boolean;
  launchPauseSeconds: number;

  // Notifications
  notificationsEnabled: boolean;
  showNotificationBadges: boolean;
  showNotificationPreview: boolean;
  notificationFilterMode: NotificationFilterMode;
  notificationFilterApps: string[];
}

export interface LauncherBackup {
  version: number;
  exportedAt: string;
  settings: LauncherSettings;
  favorites: string[];
  hiddenApps: string[];
  hiddenPassword?: string | null;
  customApps: AppItem[];
  customWheelOrder?: string[];
  usage: Record<string, AppUsageRecord>;
  homeFolders?: HomeFolder[];
  customAppNames?: Record<string, string>;
  customAppCategories?: Record<string, string>;
  textOnlyApps?: string[];
  disabledApps?: string[];
  lockedApps?: string[];
  pausedApps?: string[];
  appDailyLimits?: Record<string, number>;
  dailyUsage?: Record<string, DailyAppUsageRecord>;
  focusBlockedApps?: string[];
  focusItems?: FocusItem[];
  customQuickActions?: Record<string, AppQuickAction[]>;
}

export interface AndroidBridgeCapabilities {
  isNativeAndroid: boolean;
  isDefaultLauncher: boolean;
  hasNotificationAccess: boolean;
  androidSdkVersion: number | null;
  batteryLevel: number | null;
  isCharging: boolean;
}

export type SettingsSectionId =
  | 'home'
  | 'wheel'
  | 'gestures'
  | 'fonts'
  | 'appearance'
  | 'wallpaper'
  | 'icons'
  | 'apps'
  | 'mindful'
  | 'notifications'
  | 'backup'
  | 'about';

export interface SkyAndroidNativeInterface {
  getInstalledApps: () => string; // JSON array of { id, name, packageName, category, iconBase64 }
  launchApp: (packageName: string) => boolean;
  openAppInfo: (packageName: string) => void;
  uninstallApp: (packageName: string) => void;
  isDefaultLauncher: () => boolean;
  openHomeSettings: () => void;
  hasNotificationAccess: () => boolean;
  openNotificationSettings: () => void;
  getActiveNotifications: () => string; // JSON array of NotificationSummary
  getDeviceStatus: () => string; // JSON { batteryLevel, isCharging, sdkInt }
  openWifiSettings?: () => void;
  openBluetoothSettings?: () => void;
  openDisplaySettings?: () => void;
  openSoundSettings?: () => void;
  toggleFlashlight?: () => boolean;
  setSystemBarAppearance?: (isLight: boolean) => void;
}

declare global {
  interface Window {
    SkyAndroid?: SkyAndroidNativeInterface;
    __SKY_ANDROID_BACK__?: () => void;
    __SKY_ANDROID_HOME__?: () => void;
    __SKY_ANDROID_RESUME__?: () => void;
    __SKY_ANDROID_PACKAGES_CHANGED__?: () => void;
  }
}

import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Clock,
  Compass,
  Download,
  Eye,
  Focus,
  Grid,
  Hand,
  Image as ImageIcon,
  Layers,
  Lock,
  Palette,
  Plus,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Type,
  Upload,
  X,
} from 'lucide-react';
import { WEATHER_CITY_OPTIONS } from '../services/androidBridge';
import { LAUNCHER_THEMES } from '../services/themes';
import {
  AndroidBridgeCapabilities,
  AppItem,
  ClockStyle,
  DailyAppUsageRecord,
  FontFamilyId,
  FontScale,
  FontTrackingPreset,
  FontWeightPreset,
  GestureAction,
  IconShape,
  IconSize,
  LauncherBackup,
  LauncherSettings,
  LauncherTheme,
  NotificationFilterMode,
  SettingsSectionId,
  SortOrder,
  WheelRotationDirection,
  WheelSize,
  WheelStyle,
  AnimationPreset,
} from '../types/launcher';
import { AppIconGlyph } from './AppIconGlyph';
import { DigitalClock } from './DigitalClock';
import { PhoneLauncherSetupPanel } from './PhoneLauncherModal';

interface SettingsModalProps {
  isOpen: boolean;
  initialSection?: SettingsSectionId;
  settings: LauncherSettings;
  installedApps: AppItem[];
  wheelApps: AppItem[];
  hasCustomWheelOrder: boolean;
  favorites: string[];
  hiddenApps: string[];
  hiddenPassword?: string | null;
  onOpenHiddenManager?: () => void;
  capabilities: AndroidBridgeCapabilities;
  onClose: () => void;
  onUpdateSettings: (patch: Partial<LauncherSettings>) => void;
  onToggleFavorite: (appId: string) => void;
  onMoveFavorite: (appId: string, dir: 'up' | 'down') => void;
  onMoveWheelApp: (appId: string, dir: 'prev' | 'next') => void;
  onResetWheelOrder: () => void;
  onToggleHideApp: (appId: string) => void;
  onAddCustomApp: (input: { name: string; packageOrUrl: string; category: string }) => void;
  onOpenHomeSelector?: () => void;
  textOnlyApps: string[];
  disabledApps: string[];
  lockedApps: string[];
  pausedApps: string[];
  appDailyLimits: Record<string, number>;
  dailyUsage: Record<string, DailyAppUsageRecord>;
  focusBlockedApps: string[];
  onToggleTextOnlyApp: (appId: string) => void;
  onToggleDisableApp: (appId: string) => void;
  onEditApp?: (app: AppItem) => void;
  onToggleLockApp: (appId: string) => void;
  onTogglePauseApp: (appId: string) => void;
  onSetAppDailyLimit: (appId: string, limit: number | null) => void;
  onToggleFocusBlockedApp: (appId: string) => void;
  onExportBackup: () => LauncherBackup;
  onImportBackup: (rawJson: string) => boolean;
  onResetDefaults: () => void;
  onClearUsage: () => void;
  onRefreshBridge?: () => void;
  onShowNotice: (msg: string) => void;
}

const SECTIONS: Array<{
  id: SettingsSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'home', label: 'Home Screen', icon: Clock },
  { id: 'wheel', label: '3D App Wheel', icon: Compass },
  { id: 'mindful', label: 'Focus & Wellbeing', icon: Focus },
  { id: 'gestures', label: 'Gestures', icon: Hand },
  { id: 'fonts', label: 'Font Settings', icon: Type },
  { id: 'appearance', label: 'Appearance & Themes', icon: Palette },
  { id: 'wallpaper', label: 'Wallpaper', icon: ImageIcon },
  { id: 'icons', label: 'Icon Customization', icon: Grid },
  { id: 'apps', label: 'App Management', icon: Layers },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'backup', label: 'Backup & Restore', icon: Download },
  { id: 'about', label: 'Phone & Home Setup', icon: Smartphone },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  initialSection = 'home',
  settings,
  installedApps,
  wheelApps,
  hasCustomWheelOrder,
  favorites,
  hiddenApps,
  hiddenPassword,
  onOpenHiddenManager,
  capabilities,
  onClose,
  onUpdateSettings,
  onToggleFavorite,
  onMoveFavorite,
  onMoveWheelApp,
  onResetWheelOrder,
  onToggleHideApp,
  onAddCustomApp,
  onOpenHomeSelector,
  textOnlyApps,
  disabledApps,
  lockedApps,
  pausedApps,
  appDailyLimits,
  dailyUsage,
  focusBlockedApps,
  onToggleTextOnlyApp,
  onToggleDisableApp,
  onEditApp,
  onToggleLockApp,
  onTogglePauseApp,
  onSetAppDailyLimit,
  onToggleFocusBlockedApp,
  onExportBackup,
  onImportBackup,
  onResetDefaults,
  onClearUsage,
  onRefreshBridge,
  onShowNotice,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(initialSection);
  const [customName, setCustomName] = useState('');
  const [customTarget, setCustomTarget] = useState('');
  const [customCategory, setCustomCategory] = useState('Custom');
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);

  const handleFontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateSettings({
          fontFamily: 'innuendo',
          customFontDataUrl: reader.result,
          customFontName: file.name,
        });
        onShowNotice(`Loaded font: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  React.useEffect(() => {
    if (isOpen) {
      setActiveSection(initialSection);
    }
  }, [isOpen, initialSection]);

  if (!isOpen) return null;

  const hiddenSet = new Set(hiddenApps);
  const favSet = new Set(favorites);
  const textOnlySet = new Set(textOnlyApps);
  const disabledSet = new Set(disabledApps);
  const hiddenAppItems = installedApps.filter((a) => hiddenSet.has(a.id));

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateSettings({ wallpaperDataUrl: reader.result });
        onShowNotice('Custom wallpaper applied');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDownloadBackup = () => {
    const backup = onExportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sky-launcher-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowNotice('Backup exported');
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImportBackup(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/88 backdrop-blur-xl flex items-center justify-center p-0 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Sky Launcher Settings"
    >
      <div
        className="w-full h-full sm:h-[min(86vh,760px)] sm:max-w-4xl sm:rounded-3xl bg-zinc-950 border-0 sm:border sm:border-white/15 flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="font-display text-lg font-semibold text-white tracking-tight">
              Settings
            </h2>
            <p className="text-xs text-zinc-500">SKY LAUNCHER Configuration</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          {/* Navigation Rail (horizontal scroll on mobile, vertical sidebar on md+) */}
          <nav
            aria-label="Settings sections"
            className="flex md:flex-col gap-1 px-3 py-2.5 md:py-4 md:w-60 border-b md:border-b-0 md:border-r border-white/10 overflow-x-auto md:overflow-y-auto no-scrollbar shrink-0 bg-black/40"
          >
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const active = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors min-h-[42px] ${
                    active
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Content Panel */}
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-5 sm:p-7 space-y-6">
            {activeSection === 'home' && (
              <div className="space-y-6">
                <SectionHeading
                  title="Home Screen"
                  subtitle="Configure the minimalist clock, weather, and vertical favorites feed."
                />

                {/* Live Clock Preview */}
                <div className="p-4 sm:p-5 rounded-2xl bg-black border border-white/15 space-y-2">
                  <p className="text-[10px] font-mono-tabular uppercase tracking-widest text-zinc-500">
                    Clock Preview
                  </p>
                  <DigitalClock
                    clockStyle={settings.clockStyle}
                    use24Hour={settings.use24Hour}
                    showSeconds={settings.showSeconds}
                    fontScale="compact"
                  />
                </div>

                <SettingGroup label="Clock Style">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(
                      [
                        { id: 'architectural', label: 'Architectural', desc: 'Clean thin digits' },
                        { id: 'editorial', label: 'Editorial', desc: 'Soft contrast colon' },
                        { id: 'chronos', label: 'Chronos', desc: 'Stacked vertical' },
                        { id: 'horizon', label: 'Horizon', desc: 'Mono + rule line' },
                        { id: 'analog-dial', label: 'Analog Dial', desc: 'Swiss sweep hands' },
                        { id: 'orbital-ring', label: 'Orbital Ring', desc: 'HUD progress arc' },
                        { id: 'split-flap', label: 'Split-Flap', desc: 'Mechanical tiles' },
                        { id: 'minimal-dot', label: 'Framed', desc: 'Silver bezel badge' },
                      ] as Array<{ id: ClockStyle; label: string; desc: string }>
                    ).map((opt) => {
                      const active = settings.clockStyle === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => onUpdateSettings({ clockStyle: opt.id })}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            active
                              ? 'border-white bg-white/10'
                              : 'border-white/10 bg-zinc-900/50 hover:border-white/25'
                          }`}
                        >
                          <p className="text-xs sm:text-sm font-medium text-white truncate">
                            {opt.label}
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{opt.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </SettingGroup>

                <ToggleRow
                  label="24-Hour Clock"
                  description="Display time in 24-hour format without AM/PM."
                  checked={settings.use24Hour}
                  onChange={(v) => onUpdateSettings({ use24Hour: v })}
                />

                <ToggleRow
                  label="Show Seconds"
                  description="Display live tabular seconds beside the clock."
                  checked={settings.showSeconds}
                  onChange={(v) => onUpdateSettings({ showSeconds: v })}
                />

                <ToggleRow
                  label="Minimal Weather Widget"
                  description="Display live monochrome weather conditions beneath the date."
                  checked={settings.showWeather}
                  onChange={(v) => onUpdateSettings({ showWeather: v })}
                />

                {settings.showWeather && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <SettingGroup label="Temperature Unit">
                      <SegmentedOptions<'C' | 'F'>
                        value={settings.weatherUnit}
                        options={[
                          { value: 'C', label: 'Celsius (°C)' },
                          { value: 'F', label: 'Fahrenheit (°F)' },
                        ]}
                        onChange={(v) => onUpdateSettings({ weatherUnit: v })}
                      />
                    </SettingGroup>

                    <SettingGroup label="Weather Location">
                      <select
                        value={settings.weatherCity}
                        onChange={(e) => onUpdateSettings({ weatherCity: e.target.value })}
                        className="w-full min-h-[44px] px-3.5 rounded-xl bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-white/40"
                      >
                        {WEATHER_CITY_OPTIONS.map((city) => (
                          <option key={city} value={city} className="bg-zinc-950 text-white">
                            {city === 'Auto' ? 'Auto (Device Location Only)' : city}
                          </option>
                        ))}
                      </select>
                    </SettingGroup>
                  </div>
                )}

                <ToggleRow
                  label="Show Recently Used Apps"
                  description="Display up to 3 recently launched non-favorite apps below favorites."
                  checked={settings.showRecentOnHome}
                  onChange={(v) => onUpdateSettings({ showRecentOnHome: v })}
                />

                <SliderRow
                  label="Selected Home Apps"
                  value={Math.min(settings.maxFavoritesOnHome, 8)}
                  min={1}
                  max={8}
                  step={1}
                  displayValue={`${Math.min(settings.maxFavoritesOnHome, 8)} apps`}
                  onChange={(v) => onUpdateSettings({ maxFavoritesOnHome: v })}
                />

                {onOpenHomeSelector && (
                  <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">Home Screen Apps</p>
                      <p className="text-xs text-zinc-400">
                        Choose up to 8 applications displayed on your home screen ({favorites.length}/8 selected).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenHomeSelector();
                      }}
                      className="min-h-[40px] px-4 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                    >
                      Select Apps
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'wheel' && (
              <div className="space-y-6">
                <SectionHeading
                  title="3D App Wheel"
                  subtitle="Customize 3D wheel geometry, style, speed, reflections, depth, physics, and custom app positions."
                />

                {/* Wheel Style */}
                <SettingGroup label="Wheel Style">
                  <div className="grid grid-cols-2 gap-2.5">
                    {(
                      [
                        {
                          id: 'carousel',
                          label: 'Circular 3D Carousel',
                          desc: 'Alpha orbital ring & central hub',
                        },
                        {
                          id: 'sphere',
                          label: 'Rotating Sphere',
                          desc: '3D multi-latitude orbital sphere',
                        },
                        {
                          id: 'horizontal',
                          label: 'Horizontal Carousel',
                          desc: 'Curved coverflow arc track',
                        },
                        {
                          id: 'vertical',
                          label: 'Vertical Wheel',
                          desc: 'Vertical 3D drum carousel',
                        },
                      ] as const
                    ).map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => onUpdateSettings({ wheelStyle: style.id as WheelStyle })}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          settings.wheelStyle === style.id
                            ? 'border-white bg-white/12 text-white'
                            : 'border-white/10 bg-zinc-900/50 text-zinc-300 hover:border-white/25'
                        }`}
                      >
                        <p className="text-xs sm:text-sm font-medium">{style.label}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{style.desc}</p>
                      </button>
                    ))}
                  </div>
                </SettingGroup>

                {/* Adjustable Wheel Size */}
                <SettingGroup label="Wheel Size">
                  <SegmentedOptions<WheelSize>
                    value={settings.wheelSize}
                    options={[
                      { value: 'compact', label: 'Small' },
                      { value: 'standard', label: 'Medium' },
                      { value: 'expanded', label: 'Large' },
                    ]}
                    onChange={(v) => onUpdateSettings({ wheelSize: v })}
                  />
                </SettingGroup>

                {/* Rotation Speed Presets + Custom Speed Slider */}
                <div className="space-y-3">
                  <SettingGroup label="Rotation Speed Presets">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Slow (0.6×)', val: 0.6 },
                        { label: 'Normal (1.0×)', val: 1.0 },
                        { label: 'Fast (1.6×)', val: 1.6 },
                      ].map((preset) => {
                        const isMatch = Math.abs(settings.wheelSpeed - preset.val) < 0.05;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => onUpdateSettings({ wheelSpeed: preset.val })}
                            className={`min-h-[38px] px-3.5 rounded-xl text-xs font-medium transition-colors ${
                              isMatch
                                ? 'bg-white text-black'
                                : 'bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:border-white/25'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </SettingGroup>

                  <SliderRow
                    label="Custom Rotation Speed"
                    value={settings.wheelSpeed}
                    min={0.4}
                    max={2.5}
                    step={0.1}
                    displayValue={`${settings.wheelSpeed.toFixed(1)}×`}
                    onChange={(v) => onUpdateSettings({ wheelSpeed: v })}
                  />
                </div>

                {/* Rotation Direction */}
                <SettingGroup label="Rotation Direction">
                  <SegmentedOptions<WheelRotationDirection>
                    value={settings.wheelRotationDirection}
                    options={[
                      { value: 'normal', label: 'Standard (Clockwise)' },
                      { value: 'inverted', label: 'Inverted (Anticlockwise)' },
                    ]}
                    onChange={(v) => onUpdateSettings({ wheelRotationDirection: v })}
                  />
                </SettingGroup>

                {/* 3D Depth & Tilt */}
                <SliderRow
                  label="3D Depth Perspective"
                  value={settings.wheelPerspective}
                  min={0.5}
                  max={1.6}
                  step={0.1}
                  displayValue={`${settings.wheelPerspective.toFixed(1)}×`}
                  onChange={(v) => onUpdateSettings({ wheelPerspective: v })}
                />

                <SliderRow
                  label="Orbital Ring Tilt"
                  value={settings.wheelTiltDegrees}
                  min={-12}
                  max={18}
                  step={1}
                  displayValue={`${settings.wheelTiltDegrees}°`}
                  onChange={(v) => onUpdateSettings({ wheelTiltDegrees: v })}
                />

                {/* Reflection Effects & Labels */}
                <ToggleRow
                  label="App Icon Reflections"
                  description="Render realistic monochrome mirror reflections and silver lighting beneath front icons."
                  checked={settings.wheelReflections}
                  onChange={(v) => onUpdateSettings({ wheelReflections: v })}
                />

                <ToggleRow
                  label="Show App Names Around Wheel"
                  description="Display application titles underneath front-facing wheel icons."
                  checked={settings.showWheelLabels}
                  onChange={(v) => onUpdateSettings({ showWheelLabels: v })}
                />

                <ToggleRow
                  label="Rotary Detent Click & Haptics"
                  description="Subtle mechanical audio tick and haptic pulse as apps pass the focal detent."
                  checked={settings.wheelSoundHaptics}
                  onChange={(v) => onUpdateSettings({ wheelSoundHaptics: v })}
                />

                {/* Animation Controls */}
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/10 space-y-4">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Animation & Physics Controls
                  </p>

                  <SettingGroup label="Motion Response">
                    <SegmentedOptions<AnimationPreset>
                      value={settings.animationPreset}
                      options={[
                        { value: 'fluid', label: 'Fluid 3D' },
                        { value: 'crisp', label: 'Crisp Snap' },
                        { value: 'reduced', label: 'Reduced Motion' },
                      ]}
                      onChange={(v) => onUpdateSettings({ animationPreset: v })}
                    />
                  </SettingGroup>

                  <SliderRow
                    label="Rotational Inertia (Coast Decay)"
                    value={settings.wheelInertia}
                    min={0.85}
                    max={0.965}
                    step={0.005}
                    displayValue={`${Math.round(((settings.wheelInertia - 0.85) / 0.115) * 100)}%`}
                    onChange={(v) => onUpdateSettings({ wheelInertia: v })}
                  />
                </div>

                {/* Favourite App Management */}
                <div className="space-y-2.5">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Favourite App Pinning & Order ({favorites.length})
                  </p>
                  {favorites.length > 0 && (
                    <div className="rounded-2xl border border-white/10 divide-y divide-white/[0.06] bg-black/40 max-h-56 overflow-y-auto no-scrollbar">
                      {favorites.map((favId, idx) => {
                        const app = installedApps.find((a) => a.id === favId);
                        if (!app || hiddenSet.has(app.id)) return null;
                        return (
                          <div
                            key={app.id}
                            className="flex items-center justify-between gap-2 px-3.5 py-2"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-mono-tabular text-[11px] text-zinc-500 w-4">
                                {idx + 1}
                              </span>
                              <AppIconGlyph
                                app={app}
                                size="small"
                                shape={settings.iconShape}
                                monochrome={settings.iconMonochrome}
                              />
                              <span className="text-sm text-zinc-100 truncate">
                                {app.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => onMoveFavorite(app.id, 'up')}
                                aria-label={`Move ${app.name} up`}
                                className="min-w-[34px] min-h-[34px] rounded-lg border border-white/10 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-30 flex items-center justify-center"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === favorites.length - 1}
                                onClick={() => onMoveFavorite(app.id, 'down')}
                                aria-label={`Move ${app.name} down`}
                                className="min-w-[34px] min-h-[34px] rounded-lg border border-white/10 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-30 flex items-center justify-center"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onToggleFavorite(app.id)}
                                className="px-2.5 min-h-[34px] rounded-lg bg-white text-black text-xs font-medium"
                              >
                                Unpin
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Custom Wheel App Positions */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Custom Wheel App Positions ({wheelApps.length})
                    </p>
                    {hasCustomWheelOrder && (
                      <button
                        type="button"
                        onClick={onResetWheelOrder}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/15 text-[11px] text-zinc-300 hover:text-white inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset A–Z</span>
                      </button>
                    )}
                  </div>
                  <div className="rounded-2xl border border-white/10 divide-y divide-white/[0.06] bg-black/40 max-h-60 overflow-y-auto no-scrollbar">
                    {wheelApps.map((app, idx) => {
                      const isFav = favSet.has(app.id);
                      return (
                        <div
                          key={app.id}
                          className="flex items-center justify-between gap-2 px-3.5 py-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono-tabular text-[11px] text-zinc-500 w-5">
                              #{idx + 1}
                            </span>
                            <AppIconGlyph
                              app={app}
                              size="small"
                              shape={settings.iconShape}
                              monochrome={settings.iconMonochrome}
                            />
                            <span className="text-sm text-zinc-100 truncate">{app.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => onToggleFavorite(app.id)}
                              className={`px-2 min-h-[32px] rounded-lg text-[11px] font-medium transition-colors ${
                                isFav
                                  ? 'bg-white text-black'
                                  : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {isFav ? 'Pinned' : 'Pin'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onMoveWheelApp(app.id, 'prev')}
                              aria-label={`Move ${app.name} earlier on wheel`}
                              className="min-w-[32px] min-h-[32px] rounded-lg border border-white/10 bg-zinc-900 text-zinc-300 hover:text-white flex items-center justify-center"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onMoveWheelApp(app.id, 'next')}
                              aria-label={`Move ${app.name} later on wheel`}
                              className="min-w-[32px] min-h-[32px] rounded-lg border border-white/10 bg-zinc-900 text-zinc-300 hover:text-white flex items-center justify-center"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'gestures' && (
              <div className="space-y-6">
                <SectionHeading
                  title="Gestures"
                  subtitle="Customize touch and pointer gestures across the Home canvas."
                />

                <GestureSelectRow
                  label="Swipe Up"
                  value={settings.swipeUpAction}
                  onChange={(v) => onUpdateSettings({ swipeUpAction: v })}
                />

                <GestureSelectRow
                  label="Swipe Down"
                  value={settings.swipeDownAction}
                  onChange={(v) => onUpdateSettings({ swipeDownAction: v })}
                />

                <GestureSelectRow
                  label="Double Tap"
                  value={settings.doubleTapAction}
                  onChange={(v) => onUpdateSettings({ doubleTapAction: v })}
                />

                <SettingGroup label="Long Press on Home Background">
                  <SegmentedOptions<'customize' | 'settings' | 'none'>
                    value={settings.longPressHomeAction}
                    options={[
                      { value: 'customize', label: 'Wallpaper & Theme' },
                      { value: 'settings', label: 'Open Settings' },
                      { value: 'none', label: 'Disabled' },
                    ]}
                    onChange={(v) => onUpdateSettings({ longPressHomeAction: v })}
                  />
                </SettingGroup>

                <ToggleRow
                  label="Horizontal Swipe Wheel Rotation"
                  description="Allow dragging left or right anywhere on the 3D wheel to spin apps."
                  checked={settings.enableWheelHorizontalSwipe}
                  onChange={(v) => onUpdateSettings({ enableWheelHorizontalSwipe: v })}
                />
              </div>
            )}

            {activeSection === 'fonts' && (
              <div className="space-y-6">
                <SectionHeading
                  title="Font Settings"
                  subtitle="Customize typeface family, size, weight, tracking, and app label styling across Home and Wheel."
                />

                {/* Live Typography Preview */}
                <div className="p-4 sm:p-5 rounded-2xl bg-black border border-white/15 space-y-2">
                  <p className="text-[10px] font-mono-tabular uppercase tracking-widest text-zinc-500">
                    Live Preview
                  </p>
                  <p className="font-display sky-clock-digits text-3xl sm:text-4xl text-white tabular-nums leading-none">
                    09:42
                  </p>
                  <p
                    className={`sky-app-label text-zinc-200 pt-1 ${
                      settings.fontScale === 'compact'
                        ? 'text-sm'
                        : settings.fontScale === 'large'
                        ? 'text-[17px]'
                        : settings.fontScale === 'xlarge'
                        ? 'text-lg'
                        : 'text-[15px] sm:text-base'
                    }`}
                  >
                    Phone · Messages · Browser · Camera
                  </p>
                </div>

                <SettingGroup label="Font Family">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(
                      [
                        {
                          id: 'sky-modern',
                          name: 'Sky Modern',
                          desc: 'Outfit Display + Plus Jakarta Sans',
                          sampleFont: "'Plus Jakarta Sans', system-ui, sans-serif",
                        },
                        {
                          id: 'futuristic-grotesk',
                          name: 'Futuristic Grotesk',
                          desc: 'Space Grotesk architectural UI',
                          sampleFont: "'Space Grotesk', system-ui, sans-serif",
                        },
                        {
                          id: 'swiss-minimal',
                          name: 'Swiss Minimal',
                          desc: 'Inter geometric precision',
                          sampleFont: "'Inter', system-ui, sans-serif",
                        },
                        {
                          id: 'editorial-serif',
                          name: 'Editorial Serif',
                          desc: 'Cormorant Garamond high-contrast serif',
                          sampleFont: "'Cormorant Garamond', Georgia, serif",
                        },
                        {
                          id: 'mono-tech',
                          name: 'Mono Technical',
                          desc: 'JetBrains Mono uniform monospace',
                          sampleFont: "'JetBrains Mono', monospace",
                        },
                        {
                          id: 'innuendo',
                          name: 'Innuendo',
                          desc: 'Tall slender expressive display',
                          sampleFont: "'Innuendo', 'DK Innuendo', 'Pompiere', system-ui, sans-serif",
                        },
                      ] as Array<{
                        id: FontFamilyId;
                        name: string;
                        desc: string;
                        sampleFont: string;
                      }>
                    ).map((f) => {
                      const active = settings.fontFamily === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => onUpdateSettings({ fontFamily: f.id })}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${
                            active
                              ? 'border-white bg-white/10'
                              : 'border-white/10 bg-zinc-900/50 hover:border-white/25'
                          }`}
                        >
                          <p
                            style={{ fontFamily: f.sampleFont }}
                            className="text-base font-medium text-white"
                          >
                            {f.name}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">{f.desc}</p>
                        </button>
                      );
                    })}
                  </div>

                  {settings.fontFamily === 'innuendo' && (
                    <div className="mt-3 p-3.5 rounded-2xl border border-white/15 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white">
                          {settings.customFontName
                            ? `Loaded file: ${settings.customFontName}`
                            : 'Innuendo Display Active'}
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Optionally load a local .ttf, .otf, or .woff2 Innuendo font file.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          ref={fontInputRef}
                          type="file"
                          accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
                          onChange={handleFontFileChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fontInputRef.current?.click()}
                          className="min-h-[36px] px-3 rounded-xl bg-zinc-900 border border-white/20 text-xs font-medium text-white hover:border-white/40 inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{settings.customFontDataUrl ? 'Replace File' : 'Load Font File'}</span>
                        </button>
                        {settings.customFontDataUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateSettings({ customFontDataUrl: null, customFontName: null });
                              onShowNotice('Reverted to built-in Innuendo display');
                            }}
                            className="min-h-[36px] px-2.5 rounded-xl bg-zinc-900 border border-white/15 text-xs text-zinc-300 hover:text-white hover:border-white/30 inline-flex items-center gap-1 transition-colors"
                            aria-label="Clear custom font file"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Clear</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </SettingGroup>

                <SettingGroup label="Font Size">
                  <SegmentedOptions<FontScale>
                    value={settings.fontScale}
                    options={[
                      { value: 'compact', label: 'Compact' },
                      { value: 'balanced', label: 'Balanced' },
                      { value: 'large', label: 'Large' },
                      { value: 'xlarge', label: 'Extra Large' },
                    ]}
                    onChange={(v) => onUpdateSettings({ fontScale: v })}
                  />
                </SettingGroup>

                <SettingGroup label="Font Weight">
                  <SegmentedOptions<FontWeightPreset>
                    value={settings.fontWeight}
                    options={[
                      { value: 'light', label: 'Light' },
                      { value: 'regular', label: 'Regular' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'bold', label: 'Bold' },
                    ]}
                    onChange={(v) => onUpdateSettings({ fontWeight: v })}
                  />
                </SettingGroup>

                <SettingGroup label="Letter Spacing">
                  <SegmentedOptions<FontTrackingPreset>
                    value={settings.fontTracking}
                    options={[
                      { value: 'tight', label: 'Tight' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'wide', label: 'Wide' },
                    ]}
                    onChange={(v) => onUpdateSettings({ fontTracking: v })}
                  />
                </SettingGroup>

                <ToggleRow
                  label="Uppercase App Labels"
                  description="Display application names in crisp monochrome uppercase."
                  checked={settings.uppercaseLabels}
                  onChange={(v) => onUpdateSettings({ uppercaseLabels: v })}
                />

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({
                        fontFamily: 'sky-modern',
                        fontScale: 'balanced',
                        fontWeight: 'regular',
                        fontTracking: 'normal',
                        uppercaseLabels: false,
                        customFontDataUrl: null,
                        customFontName: null,
                      });
                      onShowNotice('Font settings reset to default');
                    }}
                    className="min-h-[42px] px-4 rounded-xl bg-zinc-900 border border-white/15 text-xs font-medium text-zinc-200 hover:text-white hover:border-white/35 inline-flex items-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Font Defaults</span>
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <SectionHeading
                  title="Appearance & Themes"
                  subtitle="Choose illustrated cartoon worlds, vibrant color themes, crisp daylight surfaces, or AMOLED black."
                />

                <SettingGroup label="Cartoon & Illustrated Themes">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {LAUNCHER_THEMES.filter((t) => t.category === 'cartoon').map((t) => {
                      const isSelected = settings.theme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onUpdateSettings({ theme: t.id })}
                          className={`group overflow-hidden rounded-2xl border text-left transition-all flex flex-col ${
                            isSelected
                              ? 'border-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                              : 'border-white/10 bg-zinc-900/50 hover:border-white/25'
                          }`}
                        >
                          <div
                            className="relative w-full h-28 overflow-hidden"
                            style={{ background: t.canvasBackground }}
                          >
                            {t.backgroundImage && (
                              <img
                                src={t.backgroundImage}
                                alt={t.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                            <div
                              aria-hidden="true"
                              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent"
                            />
                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                              {isSelected && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-sm"
                                  style={{
                                    backgroundColor: t.accentHex,
                                    color: t.accentFgHex,
                                  }}
                                >
                                  Active
                                </span>
                              )}
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm"
                                style={{ backgroundColor: t.accentHex }}
                              />
                            </div>
                          </div>
                          <div className="p-3.5">
                            <p className="text-sm font-medium text-white">{t.name}</p>
                            <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
                              {t.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </SettingGroup>

                {(
                  [
                    { key: 'color', label: 'Color Themes' },
                    { key: 'light', label: 'Light & Paper Themes' },
                    { key: 'monochrome', label: 'Monochrome & AMOLED' },
                  ] as const
                ).map((group) => {
                  const groupThemes = LAUNCHER_THEMES.filter((t) => t.category === group.key);
                  return (
                    <SettingGroup key={group.key} label={group.label}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {groupThemes.map((t) => {
                          const isSelected = settings.theme === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => onUpdateSettings({ theme: t.id })}
                              className={`p-3.5 rounded-2xl border text-left transition-all ${
                                isSelected
                                  ? 'border-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)]'
                                  : 'border-white/10 bg-zinc-900/50 hover:border-white/25'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div
                                  className="w-9 h-9 rounded-full border border-white/25 flex items-center justify-center shadow-inner"
                                  style={{ background: t.swatchBg }}
                                >
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-black/25 shadow-sm"
                                    style={{ backgroundColor: t.swatchAccent }}
                                  />
                                </div>
                                {isSelected && (
                                  <span
                                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                    style={{
                                      backgroundColor: t.accentHex,
                                      color: t.accentFgHex,
                                    }}
                                  >
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-white">{t.name}</p>
                              <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
                                {t.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </SettingGroup>
                  );
                })}

                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-white/10">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-100">Font Family, Size & Weight</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Customize typeface, weight, letter spacing, and scale in Font Settings.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('fonts')}
                    className="min-h-[40px] px-3.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors whitespace-nowrap shrink-0"
                  >
                    Open Font Settings
                  </button>
                </div>

                <SettingGroup label="Animation Style">
                  <SegmentedOptions<AnimationPreset>
                    value={settings.animationPreset}
                    options={[
                      { value: 'fluid', label: 'Fluid 3D' },
                      { value: 'crisp', label: 'Crisp Snap' },
                      { value: 'reduced', label: 'Reduced Motion' },
                    ]}
                    onChange={(v) => onUpdateSettings({ animationPreset: v })}
                  />
                </SettingGroup>
              </div>
            )}

            {activeSection === 'wallpaper' && (
              <div className="space-y-6">
                <SectionHeading
                  title="Wallpaper"
                  subtitle="Use a pure AMOLED black canvas or upload a custom image from your gallery."
                />

                <div className="flex flex-wrap gap-3">
                  <input
                    ref={wallpaperInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleWallpaperUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => wallpaperInputRef.current?.click()}
                    className="min-h-[44px] px-5 rounded-xl bg-white text-black text-sm font-semibold flex items-center gap-2 hover:bg-zinc-200 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choose from Gallery</span>
                  </button>

                  {settings.wallpaperDataUrl && (
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ wallpaperDataUrl: null })}
                      className="min-h-[44px] px-4 rounded-xl bg-zinc-900 border border-white/15 text-zinc-200 text-sm hover:bg-zinc-800"
                    >
                      Remove Custom Image
                    </button>
                  )}
                </div>

                <SettingGroup label="Built-in Monochrome Backdrops">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(
                      [
                        { id: 'pure-black', label: 'Pure Black' },
                        { id: 'obsidian-radial', label: 'Obsidian Glow' },
                        { id: 'silver-horizon', label: 'Silver Horizon' },
                        { id: 'monolith-grid', label: 'Monolith Hairline' },
                      ] as const
                    ).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            wallpaperPreset: preset.id,
                            wallpaperDataUrl: null,
                          })
                        }
                        className={`p-3 rounded-2xl border text-xs font-medium text-left transition-all ${
                          !settings.wallpaperDataUrl && settings.wallpaperPreset === preset.id
                            ? 'border-white bg-white/10 text-white'
                            : 'border-white/10 bg-zinc-900/50 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </SettingGroup>

                <ToggleRow
                  label="Monochrome Wallpaper Filter"
                  description="Convert uploaded gallery wallpapers to pure black-and-white contrast."
                  checked={settings.wallpaperMonochrome}
                  onChange={(v) => onUpdateSettings({ wallpaperMonochrome: v })}
                />

                <SliderRow
                  label="Wallpaper Dimming"
                  value={settings.wallpaperDim}
                  min={0}
                  max={95}
                  step={5}
                  displayValue={`${settings.wallpaperDim}%`}
                  onChange={(v) => onUpdateSettings({ wallpaperDim: v })}
                />

                <SliderRow
                  label="Wallpaper Blur"
                  value={settings.wallpaperBlur}
                  min={0}
                  max={24}
                  step={2}
                  displayValue={`${settings.wallpaperBlur}px`}
                  onChange={(v) => onUpdateSettings({ wallpaperBlur: v })}
                />
              </div>
            )}

            {activeSection === 'icons' && (
              <div className="space-y-6">
                <SectionHeading
                  title="Icon Customization"
                  subtitle="Hide icons for words-only mode or adjust icon geometry and monochrome rendering."
                />

                <ToggleRow
                  label="Words Only Mode (Turn Off App Icons)"
                  description="Hide all app icons across Home, 3D Wheel, Folders, and Search so only app words appear."
                  checked={!settings.showAppIcons}
                  onChange={(v) => onUpdateSettings({ showAppIcons: !v })}
                />

                <SettingGroup label="Icon Size">
                  <SegmentedOptions<IconSize>
                    value={settings.iconSize}
                    options={[
                      { value: 'small', label: 'Small' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'large', label: 'Large' },
                    ]}
                    onChange={(v) => onUpdateSettings({ iconSize: v })}
                  />
                </SettingGroup>

                <SettingGroup label="Icon Container Shape">
                  <SegmentedOptions<IconShape>
                    value={settings.iconShape}
                    options={[
                      { value: 'squircle', label: 'Squircle' },
                      { value: 'circle', label: 'Circle' },
                      { value: 'sharp', label: 'Architectural' },
                    ]}
                    onChange={(v) => onUpdateSettings({ iconShape: v })}
                  />
                </SettingGroup>

                <ToggleRow
                  label="Enforce Monochrome Icon Tint"
                  description="Desaturate native Android app icons into unified silver and charcoal tones."
                  checked={settings.iconMonochrome}
                  onChange={(v) => onUpdateSettings({ iconMonochrome: v })}
                />

                <ToggleRow
                  label="Uniform Monochrome Mask"
                  description="Apply unified high-contrast silver/obsidian framing across all third-party app icons."
                  checked={settings.iconUniformMask}
                  onChange={(v) => onUpdateSettings({ iconUniformMask: v, iconMonochrome: true })}
                />
              </div>
            )}

            {activeSection === 'apps' && (
              <div className="space-y-6">
                <SectionHeading
                  title="App Management"
                  subtitle="Organize sorting, hidden applications, pinned favorites, and custom intents."
                />

                <SettingGroup label="Default App Sorting">
                  <SegmentedOptions<SortOrder>
                    value={settings.sortOrder}
                    options={[
                      { value: 'alphabetical', label: 'A–Z' },
                      { value: 'reverse', label: 'Z–A' },
                      { value: 'most-used', label: 'Most Used' },
                      { value: 'recent', label: 'Recent' },
                    ]}
                    onChange={(v) => onUpdateSettings({ sortOrder: v })}
                  />
                </SettingGroup>

                {/* Add Custom App / Web Shortcut */}
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3">
                  <p className="text-sm font-medium text-white">
                    Add Custom App or Web Shortcut
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="App name (e.g. Linear)"
                      className="px-3 py-2.5 rounded-xl bg-black border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
                    />
                    <input
                      type="text"
                      value={customTarget}
                      onChange={(e) => setCustomTarget(e.target.value)}
                      placeholder="URL or package name"
                      className="px-3 py-2.5 rounded-xl bg-black border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Category"
                        className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-black border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!customName.trim() || !customTarget.trim()) return;
                          onAddCustomApp({
                            name: customName,
                            packageOrUrl: customTarget,
                            category: customCategory,
                          });
                          setCustomName('');
                          setCustomTarget('');
                        }}
                        className="min-w-[44px] min-h-[44px] px-3 rounded-xl bg-white text-black font-medium text-sm flex items-center justify-center hover:bg-zinc-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Manage & Reorder Favorites */}
                <div className="space-y-2.5">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Pinned Favorites ({favorites.length})
                  </p>
                  {favorites.length > 0 && (
                    <div className="rounded-2xl border border-white/10 divide-y divide-white/[0.06] bg-black/40">
                      {favorites.map((favId, idx) => {
                        const app = installedApps.find((a) => a.id === favId);
                        if (!app || hiddenSet.has(app.id)) return null;
                        const hideIcon = !settings.showAppIcons || textOnlySet.has(app.id);
                        const isDisabled = disabledSet.has(app.id);
                        return (
                          <div
                            key={app.id}
                            className={`flex items-center justify-between gap-2 px-3.5 py-2 ${
                              isDisabled ? 'opacity-60' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-mono-tabular text-[11px] text-zinc-500 w-4 shrink-0">
                                {idx + 1}
                              </span>
                              {!hideIcon && (
                                <AppIconGlyph
                                  app={app}
                                  size="small"
                                  shape={settings.iconShape}
                                  monochrome={settings.iconMonochrome}
                                />
                              )}
                              <span className="text-sm text-zinc-100 truncate">
                                {app.name}
                              </span>
                              {isDisabled && (
                                <span className="font-mono-tabular text-[10px] uppercase px-1.5 py-0.5 rounded border border-white/15 text-zinc-400 shrink-0">
                                  Off
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => onMoveFavorite(app.id, 'up')}
                                aria-label={`Move ${app.name} up`}
                                className="min-w-[36px] min-h-[36px] rounded-lg border border-white/10 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-30 flex items-center justify-center"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === favorites.length - 1}
                                onClick={() => onMoveFavorite(app.id, 'down')}
                                aria-label={`Move ${app.name} down`}
                                className="min-w-[36px] min-h-[36px] rounded-lg border border-white/10 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-30 flex items-center justify-center"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onToggleFavorite(app.id)}
                                className="px-2.5 min-h-[36px] rounded-lg bg-white text-black text-xs font-medium"
                              >
                                Unpin
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Edit, Words Only & Turn Off Apps
                    </p>
                    <span className="text-[11px] font-mono-tabular text-zinc-500">
                      {disabledApps.length} off · {textOnlyApps.length} words only
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto no-scrollbar rounded-2xl border border-white/10 divide-y divide-white/[0.06] bg-black/40">
                    {installedApps
                      .filter((a) => !hiddenSet.has(a.id))
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((app) => {
                        const isTextOnly = textOnlySet.has(app.id);
                        const isDisabled = disabledSet.has(app.id);
                        const hideIcon = !settings.showAppIcons || isTextOnly;
                        return (
                          <div
                            key={app.id}
                            className={`flex items-center justify-between gap-2 px-3.5 py-2.5 ${
                              isDisabled ? 'opacity-65' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {!hideIcon && (
                                <div className={isDisabled ? 'grayscale opacity-50' : ''}>
                                  <AppIconGlyph
                                    app={app}
                                    size="small"
                                    shape={settings.iconShape}
                                    monochrome={settings.iconMonochrome}
                                  />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm text-zinc-100 truncate">
                                  {app.name}
                                </p>
                                <p className="text-[11px] font-mono-tabular text-zinc-500 truncate">
                                  {app.category}
                                  {isDisabled ? ' · Turned Off' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {onEditApp && (
                                <button
                                  type="button"
                                  onClick={() => onEditApp(app)}
                                  className="px-2.5 min-h-[34px] rounded-lg border border-white/15 bg-zinc-900 text-zinc-200 hover:text-white hover:border-white/35 text-xs font-medium whitespace-nowrap"
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onToggleTextOnlyApp(app.id)}
                                title="Show only words for this app"
                                className={`px-2.5 min-h-[34px] rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
                                  isTextOnly
                                    ? 'bg-white text-black border-white'
                                    : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                                }`}
                              >
                                Words
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onToggleDisableApp(app.id);
                                  onShowNotice(
                                    isDisabled ? `${app.name} turned on` : `${app.name} turned off`
                                  );
                                }}
                                className={`px-2.5 min-h-[34px] rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
                                  isDisabled
                                    ? 'bg-white text-black border-white'
                                    : 'bg-zinc-900 text-zinc-300 border-white/10 hover:text-white'
                                }`}
                              >
                                {isDisabled ? 'Off' : 'On'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Hidden Apps */}
                <div className="space-y-2.5">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Hidden Applications ({hiddenAppItems.length})
                  </p>
                  {hiddenPassword ? (
                    <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-zinc-950 border border-white/20 flex items-center justify-center shrink-0">
                          <Lock className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-white">
                            Passcode Protected
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            Hidden applications are locked. Open Hidden Space to view or manage.
                          </p>
                        </div>
                      </div>
                      {onOpenHiddenManager && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenHiddenManager();
                          }}
                          className="min-h-[36px] px-3.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                        >
                          Unlock Hidden Space
                        </button>
                      )}
                    </div>
                  ) : hiddenAppItems.length === 0 ? (
                    <p className="text-xs text-zinc-500">
                      No applications are currently hidden.
                    </p>
                  ) : (
                    <div className="rounded-2xl border border-white/10 divide-y divide-white/[0.06]">
                      {hiddenAppItems.map((app) => (
                        <div
                          key={app.id}
                          className="flex items-center justify-between px-3.5 py-2.5"
                        >
                          <span className="text-sm text-zinc-200">{app.name}</span>
                          <button
                            type="button"
                            onClick={() => onToggleHideApp(app.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/15 text-xs text-zinc-200 hover:bg-zinc-800"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Unhide</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onClearUsage}
                    className="min-h-[44px] px-4 rounded-xl bg-zinc-900 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800"
                  >
                    Clear App Usage History
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'mindful' && (
              <div className="space-y-6">
                <SectionHeading
                  title="Focus & Digital Wellbeing"
                  subtitle="Configure Focus Mode, mindful launch pauses, daily open limits, and per-app passcode locks."
                />

                <ToggleRow
                  label="Focus Mode"
                  description="Temporarily hide selected distracting apps from Home, Wheel, and Search."
                  checked={settings.focusModeEnabled}
                  onChange={(v) => onUpdateSettings({ focusModeEnabled: v })}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Focus Profile Name
                    </p>
                    <input
                      type="text"
                      maxLength={20}
                      value={settings.focusModeLabel}
                      onChange={(e) => onUpdateSettings({ focusModeLabel: e.target.value })}
                      placeholder="Focus"
                      className="w-full min-h-[42px] px-3.5 rounded-xl bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="w-full">
                      <ToggleRow
                        label="Silence Badges in Focus"
                        description="Mute home notification dots while Focus Mode is on."
                        checked={settings.focusSilenceNotifications}
                        onChange={(v) => onUpdateSettings({ focusSilenceNotifications: v })}
                      />
                    </div>
                  </div>
                </div>

                <SettingGroup label="Mindful Launch Pause Duration">
                  <SegmentedOptions<string>
                    value={String(settings.launchPauseSeconds)}
                    options={[
                      { value: '3', label: '3 Seconds' },
                      { value: '4', label: '4 Seconds' },
                      { value: '5', label: '5 Seconds' },
                      { value: '8', label: '8 Seconds' },
                    ]}
                    onChange={(v) => onUpdateSettings({ launchPauseSeconds: Number(v) })}
                  />
                </SettingGroup>

                {/* Per-App Controls Matrix */}
                <div className="space-y-2.5">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    App Protection, Pause, Limits & Focus Rules
                  </p>
                  <div className="max-h-80 overflow-y-auto no-scrollbar rounded-2xl border border-white/10 divide-y divide-white/[0.06] bg-black/40">
                    {installedApps
                      .filter((a) => !hiddenSet.has(a.id))
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((app) => {
                        const isLocked = lockedApps.includes(app.id);
                        const isPaused = pausedApps.includes(app.id);
                        const isBlocked = focusBlockedApps.includes(app.id);
                        const limit = appDailyLimits[app.id];
                        const usedToday = dailyUsage[app.id]?.count || 0;

                        return (
                          <div
                            key={`mindful-${app.id}`}
                            className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <AppIconGlyph
                                app={app}
                                size="small"
                                shape={settings.iconShape}
                                monochrome={settings.iconMonochrome}
                                uniformMask={settings.iconUniformMask}
                              />
                              <div className="min-w-0">
                                <p className="text-sm text-zinc-100 truncate">{app.name}</p>
                                <p className="text-[11px] font-mono-tabular text-zinc-500">
                                  {usedToday} opens today{limit ? ` · limit ${limit}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => onToggleFocusBlockedApp(app.id)}
                                className={`min-h-[32px] px-2.5 rounded-lg text-[11px] font-medium transition-colors ${
                                  isBlocked
                                    ? 'bg-white text-black'
                                    : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
                                }`}
                              >
                                Focus Hide
                              </button>
                              <button
                                type="button"
                                onClick={() => onTogglePauseApp(app.id)}
                                className={`min-h-[32px] px-2.5 rounded-lg text-[11px] font-medium transition-colors ${
                                  isPaused
                                    ? 'bg-white text-black'
                                    : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
                                }`}
                              >
                                Pause
                              </button>
                              <button
                                type="button"
                                onClick={() => onToggleLockApp(app.id)}
                                className={`min-h-[32px] px-2.5 rounded-lg text-[11px] font-medium transition-colors ${
                                  isLocked
                                    ? 'bg-white text-black'
                                    : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
                                }`}
                              >
                                Lock
                              </button>
                              <select
                                aria-label={`Daily open limit for ${app.name}`}
                                value={limit ? String(limit) : '0'}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  onSetAppDailyLimit(app.id, val > 0 ? val : null);
                                }}
                                className="min-h-[32px] px-2 rounded-lg bg-zinc-900 border border-white/10 text-[11px] font-mono-tabular text-zinc-200 focus:outline-none"
                              >
                                <option value="0" className="bg-zinc-950">No limit</option>
                                <option value="3" className="bg-zinc-950">3 / day</option>
                                <option value="5" className="bg-zinc-950">5 / day</option>
                                <option value="10" className="bg-zinc-950">10 / day</option>
                                <option value="15" className="bg-zinc-950">15 / day</option>
                                <option value="20" className="bg-zinc-950">20 / day</option>
                              </select>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <SectionHeading
                  title="Notifications"
                  subtitle="Android notification access is strictly opt-in and only activates with your explicit permission."
                />

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Android NotificationListenerService
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {capabilities.isNativeAndroid
                          ? capabilities.hasNotificationAccess
                            ? 'System permission granted by user.'
                            : 'Permission not yet granted in Android Settings.'
                          : 'Active when running inside the compiled Android APK.'}
                      </p>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-zinc-300 shrink-0" />
                  </div>

                  {capabilities.isNativeAndroid && (
                    <button
                      type="button"
                      onClick={() => window.SkyAndroid?.openNotificationSettings()}
                      className="min-h-[44px] px-4 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200"
                    >
                      Open Android Notification Access Settings
                    </button>
                  )}
                </div>

                <ToggleRow
                  label="Enable Launcher Notification Dots"
                  description="Only read active notifications when system permission is granted."
                  checked={settings.notificationsEnabled}
                  onChange={(v) => onUpdateSettings({ notificationsEnabled: v })}
                />

                <ToggleRow
                  label="Show Numeric Badges"
                  description="Display minimal monochrome unread counts next to apps."
                  checked={settings.showNotificationBadges}
                  onChange={(v) => onUpdateSettings({ showNotificationBadges: v })}
                />

                <ToggleRow
                  label="Show Inline Notification Preview"
                  description="Display a quiet one-line notification summary under favorite apps."
                  checked={settings.showNotificationPreview}
                  onChange={(v) => onUpdateSettings({ showNotificationPreview: v })}
                />

                <SettingGroup label="Custom Notification Filter">
                  <SegmentedOptions<NotificationFilterMode>
                    value={settings.notificationFilterMode}
                    options={[
                      { value: 'all', label: 'All Apps' },
                      { value: 'allowlist', label: 'Allow Only Selected' },
                      { value: 'blocklist', label: 'Mute Selected' },
                    ]}
                    onChange={(v) => onUpdateSettings({ notificationFilterMode: v })}
                  />
                </SettingGroup>

                {settings.notificationFilterMode !== 'all' && (
                  <div className="max-h-56 overflow-y-auto no-scrollbar rounded-2xl border border-white/10 divide-y divide-white/[0.06] bg-black/40">
                    {installedApps
                      .filter((a) => !hiddenSet.has(a.id))
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((app) => {
                        const checked = settings.notificationFilterApps.includes(app.id);
                        return (
                          <button
                            key={`notif-filter-${app.id}`}
                            type="button"
                            onClick={() => {
                              const next = checked
                                ? settings.notificationFilterApps.filter((id) => id !== app.id)
                                : [...settings.notificationFilterApps, app.id];
                              onUpdateSettings({ notificationFilterApps: next });
                            }}
                            className="w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-white/[0.04]"
                          >
                            <span className="text-sm text-zinc-200 truncate">{app.name}</span>
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${
                                checked
                                  ? 'bg-white text-black'
                                  : 'bg-zinc-900 border border-white/10 text-zinc-400'
                              }`}
                            >
                              {checked
                                ? settings.notificationFilterMode === 'allowlist'
                                  ? 'Allowed'
                                  : 'Muted'
                                : 'Default'}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'backup' && (
              <div className="space-y-6">
                <SectionHeading
                  title="Backup & Restore"
                  subtitle="Export your layout, favorites, hidden apps, and preferences locally as JSON."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="min-h-[52px] px-4 rounded-2xl bg-white text-black text-sm font-semibold flex items-center justify-center gap-2 hover:bg-zinc-200"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Backup JSON</span>
                  </button>

                  <input
                    ref={backupInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={handleImportBackupFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => backupInputRef.current?.click()}
                    className="min-h-[52px] px-4 rounded-2xl bg-zinc-900 border border-white/15 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-zinc-800"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Restore from Backup</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={onResetDefaults}
                    className="min-h-[44px] px-4 rounded-xl bg-zinc-900 border border-white/15 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 inline-flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset All Settings to Defaults</span>
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'about' && (
              <div className="space-y-6">
                <SectionHeading
                  title="Phone & Home Launcher Setup"
                  subtitle="Use SKY LAUNCHER as your phone's full-screen or default Android Home screen."
                />

                <PhoneLauncherSetupPanel
                  capabilities={capabilities}
                  onRefreshBridge={onRefreshBridge}
                  onShowNotice={onShowNotice}
                />

                <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/10 space-y-3 text-sm">
                  <div className="space-y-2 font-mono-tabular text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Runtime Bridge</span>
                      <span className="text-zinc-200">
                        {capabilities.isNativeAndroid ? 'Native Android APK' : 'Phone Web + Android APK'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Default Home Intent</span>
                      <span className="text-zinc-200">
                        {capabilities.isDefaultLauncher ? 'SKY LAUNCHER Active' : 'CATEGORY_HOME Ready'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Package Visibility</span>
                      <span className="text-zinc-200">QUERY_ALL_PACKAGES + Launcher Queries</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Local Storage</span>
                      <span className="text-zinc-200">On-Device Persistent Preferences</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionHeading: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="pb-2 border-b border-white/10">
    <h3 className="font-display text-xl font-semibold text-white tracking-tight">{title}</h3>
    <p className="text-xs sm:text-sm text-zinc-400 mt-1">{subtitle}</p>
  </div>
);

const SettingGroup: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="space-y-2.5">
    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</p>
    {children}
  </div>
);

function SegmentedOptions<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (val: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
              active
                ? 'bg-white text-black'
                : 'bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:border-white/25'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const ToggleRow: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4 py-1">
    <div className="min-w-0">
      <p className="text-sm font-medium text-zinc-100">{label}</p>
      <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-colors shrink-0 border ${
        checked
          ? 'bg-white border-white'
          : 'bg-zinc-900 border-white/20'
      }`}
    >
      <span
        className={`block w-5 h-5 rounded-full transition-transform ${
          checked
            ? 'translate-x-6 bg-black'
            : 'translate-x-1 bg-zinc-400'
        }`}
      />
    </button>
  </div>
);

const SliderRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (val: number) => void;
}> = ({ label, value, min, max, step, displayValue, onChange }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium text-zinc-200">{label}</span>
      <span className="font-mono-tabular text-xs text-zinc-300">{displayValue}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full sky-slider"
    />
  </div>
);

const GestureSelectRow: React.FC<{
  label: string;
  value: GestureAction;
  onChange: (val: GestureAction) => void;
}> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between gap-4 py-1">
    <span className="text-sm font-medium text-zinc-100">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as GestureAction)}
      className="min-h-[42px] px-3 rounded-xl bg-zinc-900 border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-white/40"
    >
      <option value="open-wheel" className="bg-zinc-950">Open 3D App Wheel</option>
      <option value="open-search" className="bg-zinc-950">Open Search</option>
      <option value="open-quick-toggles" className="bg-zinc-950">Open Quick Controls</option>
      <option value="toggle-focus" className="bg-zinc-950">Toggle Focus Mode</option>
      <option value="open-settings" className="bg-zinc-950">Open Settings</option>
      <option value="return-home" className="bg-zinc-950">Return Home</option>
      <option value="none" className="bg-zinc-950">Disabled</option>
    </select>
  </div>
);

import React, { useState } from 'react';
import {
  Battery,
  BellOff,
  Bluetooth,
  Eye,
  Flashlight,
  Focus,
  Layers,
  Monitor,
  Palette,
  Settings,
  Smartphone,
  Type,
  Volume2,
  Wifi,
  X,
} from 'lucide-react';
import { AndroidBridgeCapabilities, LauncherSettings } from '../types/launcher';

interface QuickTogglesSheetProps {
  isOpen: boolean;
  settings: LauncherSettings;
  capabilities: AndroidBridgeCapabilities;
  focusBlockedCount: number;
  onClose: () => void;
  onUpdateSettings: (patch: Partial<LauncherSettings>) => void;
  onOpenMindfulSettings: () => void;
  onOpenPhoneSetup?: () => void;
  onShowNotice: (msg: string) => void;
}

export const QuickTogglesSheet: React.FC<QuickTogglesSheetProps> = ({
  isOpen,
  settings,
  capabilities,
  focusBlockedCount,
  onClose,
  onUpdateSettings,
  onOpenMindfulSettings,
  onOpenPhoneSetup,
  onShowNotice,
}) => {
  const [torchActive, setTorchActive] = useState(false);
  const [webScreenTorch, setWebScreenTorch] = useState(false);

  if (!isOpen) return null;

  const handleFlashlight = () => {
    if (capabilities.isNativeAndroid && window.SkyAndroid?.toggleFlashlight) {
      const next = window.SkyAndroid.toggleFlashlight();
      setTorchActive(Boolean(next));
      onShowNotice(next ? 'Flashlight on' : 'Flashlight off');
    } else {
      setWebScreenTorch(true);
    }
  };

  const handleSystemPanel = (
    label: string,
    nativeFn?: () => void
  ) => {
    if (capabilities.isNativeAndroid && nativeFn) {
      nativeFn();
      onClose();
    } else {
      onShowNotice(`${label} opens device settings on Android APK`);
    }
  };

  if (webScreenTorch) {
    return (
      <div
        onClick={() => setWebScreenTorch(false)}
        role="dialog"
        aria-modal="true"
        aria-label="Screen Torch Active"
        className="fixed inset-0 z-[90] bg-white text-black flex flex-col items-center justify-center gap-4 cursor-pointer p-6"
      >
        <Flashlight className="w-10 h-10" />
        <p className="text-sm font-semibold">Screen Torch Active</p>
        <p className="text-xs text-zinc-600">Tap anywhere to turn off</p>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quick System Toggles"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/82 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-zinc-950 border border-white/20 p-5 sm:p-6 shadow-2xl space-y-5"
      >
        <div className="sm:hidden w-10 h-1 rounded-full bg-zinc-700 mx-auto -mt-1 mb-1" />

        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base sm:text-lg font-semibold text-white">
              Quick Controls
            </h3>
            <p className="text-xs font-mono-tabular text-zinc-400">
              {capabilities.batteryLevel !== null
                ? `Battery ${capabilities.batteryLevel}%${capabilities.isCharging ? ' · Charging' : ''}`
                : 'Monochrome System & Focus Deck'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick controls"
            className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Focus & Launcher Toggles */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              const next = !settings.focusModeEnabled;
              onUpdateSettings({ focusModeEnabled: next });
              onShowNotice(
                next
                  ? `${settings.focusModeLabel || 'Focus'} Mode enabled`
                  : `${settings.focusModeLabel || 'Focus'} Mode off`
              );
            }}
            className={`min-h-[68px] p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-colors ${
              settings.focusModeEnabled
                ? 'bg-white text-black border-white'
                : 'bg-zinc-900/70 text-zinc-200 border-white/10 hover:border-white/25'
            }`}
          >
            <div className="flex items-center justify-between">
              <Focus className="w-4 h-4" />
              <span className="text-[10px] font-mono-tabular uppercase">
                {settings.focusModeEnabled ? 'On' : 'Off'}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold truncate">
                {settings.focusModeLabel || 'Focus'} Mode
              </p>
              <p
                className={`text-[10px] font-mono-tabular truncate ${
                  settings.focusModeEnabled ? 'text-zinc-700' : 'text-zinc-500'
                }`}
              >
                {focusBlockedCount} paused apps
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              const nextShowIcons = !settings.showAppIcons;
              onUpdateSettings({ showAppIcons: nextShowIcons });
              onShowNotice(nextShowIcons ? 'App icons shown' : 'Words only mode on');
            }}
            className={`min-h-[68px] p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-colors ${
              !settings.showAppIcons
                ? 'bg-white text-black border-white'
                : 'bg-zinc-900/70 text-zinc-200 border-white/10 hover:border-white/25'
            }`}
          >
            <div className="flex items-center justify-between">
              <Type className="w-4 h-4" />
              <span className="text-[10px] font-mono-tabular uppercase">
                {!settings.showAppIcons ? 'On' : 'Off'}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold truncate">Words Only</p>
              <p
                className={`text-[10px] font-mono-tabular truncate ${
                  !settings.showAppIcons ? 'text-zinc-700' : 'text-zinc-500'
                }`}
              >
                Hide all app icons
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !settings.iconMonochrome;
              onUpdateSettings({
                iconMonochrome: next,
                iconUniformMask: next ? settings.iconUniformMask : false,
              });
              onShowNotice(next ? 'Monochrome icons on' : 'Original icon colors on');
            }}
            className={`min-h-[68px] p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-colors ${
              settings.iconMonochrome
                ? 'bg-white text-black border-white'
                : 'bg-zinc-900/70 text-zinc-200 border-white/10 hover:border-white/25'
            }`}
          >
            <div className="flex items-center justify-between">
              <Palette className="w-4 h-4" />
              <span className="text-[10px] font-mono-tabular uppercase">
                {settings.iconMonochrome ? 'Mono' : 'Color'}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold truncate">Monochrome Icons</p>
              <p
                className={`text-[10px] font-mono-tabular truncate ${
                  settings.iconMonochrome ? 'text-zinc-700' : 'text-zinc-500'
                }`}
              >
                Silver icon tint
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleFlashlight}
            className={`min-h-[68px] p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-colors ${
              torchActive
                ? 'bg-white text-black border-white'
                : 'bg-zinc-900/70 text-zinc-200 border-white/10 hover:border-white/25'
            }`}
          >
            <div className="flex items-center justify-between">
              <Flashlight className="w-4 h-4" />
              <span className="text-[10px] font-mono-tabular uppercase">
                {capabilities.isNativeAndroid ? (torchActive ? 'On' : 'Off') : 'Screen'}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold truncate">Flashlight</p>
              <p
                className={`text-[10px] font-mono-tabular truncate ${
                  torchActive ? 'text-zinc-700' : 'text-zinc-500'
                }`}
              >
                {capabilities.isNativeAndroid ? 'Camera torch' : 'Screen light'}
              </p>
            </div>
          </button>
        </div>

        {/* System Settings Shortcuts */}
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            System Panels
          </p>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleSystemPanel('Wi-Fi', window.SkyAndroid?.openWifiSettings)}
              className="min-h-[56px] rounded-2xl bg-zinc-900 border border-white/10 hover:border-white/25 flex flex-col items-center justify-center gap-1 text-zinc-200 hover:text-white transition-colors"
            >
              <Wifi className="w-4 h-4" />
              <span className="text-[10px]">Wi-Fi</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleSystemPanel('Bluetooth', window.SkyAndroid?.openBluetoothSettings)
              }
              className="min-h-[56px] rounded-2xl bg-zinc-900 border border-white/10 hover:border-white/25 flex flex-col items-center justify-center gap-1 text-zinc-200 hover:text-white transition-colors"
            >
              <Bluetooth className="w-4 h-4" />
              <span className="text-[10px]">Bluetooth</span>
            </button>
            <button
              type="button"
              onClick={() => handleSystemPanel('Display', window.SkyAndroid?.openDisplaySettings)}
              className="min-h-[56px] rounded-2xl bg-zinc-900 border border-white/10 hover:border-white/25 flex flex-col items-center justify-center gap-1 text-zinc-200 hover:text-white transition-colors"
            >
              <Monitor className="w-4 h-4" />
              <span className="text-[10px]">Display</span>
            </button>
            <button
              type="button"
              onClick={() => handleSystemPanel('Sound', window.SkyAndroid?.openSoundSettings)}
              className="min-h-[56px] rounded-2xl bg-zinc-900 border border-white/10 hover:border-white/25 flex flex-col items-center justify-center gap-1 text-zinc-200 hover:text-white transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span className="text-[10px]">Sound</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({
                  showNotificationBadges: !settings.showNotificationBadges,
                })
              }
              className="min-h-[40px] px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-300 hover:text-white inline-flex items-center gap-1.5"
            >
              {settings.showNotificationBadges ? (
                <BellOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              <span>{settings.showNotificationBadges ? 'Hide Badges' : 'Show Badges'}</span>
            </button>

            {onOpenPhoneSetup && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPhoneSetup();
                }}
                className="min-h-[40px] px-3 rounded-xl bg-zinc-900 border border-white/15 text-xs text-zinc-200 hover:text-white inline-flex items-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{capabilities.isNativeAndroid ? 'Default Home' : 'Use on Phone'}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenMindfulSettings();
            }}
            className="min-h-[40px] px-4 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 inline-flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configure Focus</span>
          </button>
        </div>

        {capabilities.batteryLevel !== null && (
          <div className="flex items-center justify-between text-[11px] font-mono-tabular text-zinc-500 pt-1">
            <span className="inline-flex items-center gap-1.5">
              <Battery className="w-3.5 h-3.5" />
              <span>Device Power</span>
            </span>
            <span>
              {capabilities.batteryLevel}% {capabilities.isCharging ? '· Charging' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

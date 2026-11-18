import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Home,
  RefreshCw,
  Share,
  Smartphone,
  Terminal,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AndroidBridgeCapabilities } from '../types/launcher';

interface PhoneLauncherPanelProps {
  capabilities: AndroidBridgeCapabilities;
  onRefreshBridge?: () => void;
  onShowNotice?: (msg: string) => void;
}

const ANDROID_BUILD_COMMANDS = `npm install
npm run android:sync
# Open /android in Android Studio -> Build & Install APK
# Or via CLI with Android SDK installed:
cd android && ./gradlew assembleDebug`;

export const PhoneLauncherSetupPanel: React.FC<PhoneLauncherPanelProps> = ({
  capabilities,
  onRefreshBridge,
  onShowNotice,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroidBrowser, install } = usePWAInstall();
  const [copiedCommands, setCopiedCommands] = useState(false);

  const handleInstallPWA = async () => {
    const result = await install();
    if (result === 'accepted') {
      onShowNotice?.('SKY LAUNCHER installed on your phone');
    } else if (result === 'dismissed') {
      onShowNotice?.('Installation cancelled');
    }
  };

  const handleCopyCommands = async () => {
    try {
      await navigator.clipboard.writeText(ANDROID_BUILD_COMMANDS);
      setCopiedCommands(true);
      onShowNotice?.('Build commands copied');
      window.setTimeout(() => setCopiedCommands(false), 2200);
    } catch {
      onShowNotice?.('Copy unavailable in this browser');
    }
  };

  if (capabilities.isNativeAndroid) {
    return (
      <div className="space-y-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/70 border border-white/15 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shrink-0">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Android Default Home Launcher
                </p>
                <p className="text-xs text-zinc-400">
                  {capabilities.isDefaultLauncher
                    ? 'SKY LAUNCHER is active whenever you press Home.'
                    : 'Set SKY LAUNCHER as your default Home app to replace your stock launcher.'}
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono-tabular uppercase shrink-0 ${
                capabilities.isDefaultLauncher
                  ? 'bg-white text-black font-semibold'
                  : 'bg-zinc-950 border border-white/15 text-zinc-300'
              }`}
            >
              {capabilities.isDefaultLauncher ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => window.SkyAndroid?.openHomeSettings()}
              className="min-h-[44px] px-4 rounded-xl bg-white text-black text-xs sm:text-sm font-semibold inline-flex items-center gap-2 hover:bg-zinc-200 transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              <span>
                {capabilities.isDefaultLauncher
                  ? 'Manage Default Home App'
                  : 'Set SKY LAUNCHER as Default Home'}
              </span>
            </button>

            {onRefreshBridge && (
              <button
                type="button"
                onClick={() => {
                  onRefreshBridge();
                  onShowNotice?.('Launcher status refreshed');
                }}
                className="min-h-[44px] px-3.5 rounded-xl bg-zinc-950 border border-white/15 text-xs font-medium text-zinc-200 hover:text-white inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Bell className="w-4 h-4 text-zinc-300 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-white">
                Notification Badges Access
              </p>
              <p className="text-[11px] text-zinc-400">
                {capabilities.hasNotificationAccess
                  ? 'Granted — live notification counts enabled'
                  : 'Optional — allow SKY LAUNCHER to show unread counts on apps'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.SkyAndroid?.openNotificationSettings()}
            className="min-h-[38px] px-3.5 rounded-xl bg-zinc-950 border border-white/15 text-xs font-medium text-zinc-200 hover:text-white whitespace-nowrap shrink-0"
          >
            {capabilities.hasNotificationAccess ? 'Granted' : 'Enable'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Option 1: Install as Phone Web App (PWA) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/70 border border-white/15 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                1. Install on Your Phone Now (Full-Screen App)
              </p>
              <p className="text-xs text-zinc-400">
                {isInstalled
                  ? 'Running in standalone full-screen phone mode with offline support.'
                  : 'Add SKY LAUNCHER directly to your phone screen for instant full-screen offline use.'}
              </p>
            </div>
          </div>
          {isInstalled && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-black text-[11px] font-semibold shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              <span>Installed</span>
            </span>
          )}
        </div>

        {!isInstalled && (
          <>
            {isInstallable ? (
              <button
                type="button"
                onClick={handleInstallPWA}
                className="w-full min-h-[46px] px-4 rounded-xl bg-white text-black text-sm font-semibold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Install SKY LAUNCHER on Phone</span>
              </button>
            ) : isIOS ? (
              <div className="p-3.5 rounded-xl bg-black/70 border border-white/10 text-xs text-zinc-300 space-y-1.5">
                <p className="font-medium text-white inline-flex items-center gap-1.5">
                  <Share className="w-3.5 h-3.5" />
                  <span>Install on iPhone / iPad (Safari):</span>
                </p>
                <p>1. Tap the <span className="text-white font-medium">Share</span> button in Safari&apos;s toolbar.</p>
                <p>2. Scroll down and tap <span className="text-white font-medium">Add to Home Screen</span>.</p>
                <p>3. Open SKY from your home screen for full-screen launcher mode.</p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-black/70 border border-white/10 text-xs text-zinc-300 space-y-1.5">
                <p className="font-medium text-white">
                  {isAndroidBrowser ? 'Install via Android Chrome:' : 'Open on your phone browser:'}
                </p>
                <p>
                  Open this page in Chrome on Android, tap the <span className="text-white font-medium">⋮ menu</span>, and choose{' '}
                  <span className="text-white font-medium">Install app</span> (or <span className="text-white font-medium">Add to Home screen</span>).
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Option 2: True Android Default Home Button Launcher (Native APK) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-black/75 border border-white/15 space-y-3.5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-white/20 text-white flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              2. Use as Real Android Home Button Launcher (APK)
            </p>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              Web browsers do not allow websites to replace the phone&apos;s hardware Home button or read all installed device apps.
              Install the included native Android APK from <span className="font-mono-tabular text-zinc-200">/android</span> to replace your phone&apos;s default home screen.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-tabular">
          {[
            'CATEGORY_HOME Intent',
            'RoleManager Home Prompt',
            'All Installed Apps Bridge',
            'Notification Count Service',
          ].map((item) => (
            <div
              key={item}
              className="px-2.5 py-2 rounded-xl bg-zinc-900/70 border border-white/10 text-zinc-200 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="truncate">{item}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-zinc-950 border border-white/10 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono-tabular uppercase tracking-wider text-zinc-400 inline-flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>How to Get the APK (No PC or With PC)</span>
            </span>
            <button
              type="button"
              onClick={handleCopyCommands}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/15 text-[11px] text-zinc-200 hover:text-white inline-flex items-center gap-1"
            >
              {copiedCommands ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCommands ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <ol className="text-xs text-zinc-300 space-y-1.5 list-decimal list-inside">
            <li>
              <span className="text-white font-medium">Without a computer:</span> Sync this project to GitHub, open the{' '}
              <span className="text-white font-medium">Actions</span> tab →{' '}
              <span className="text-white font-medium">set up a workflow yourself</span>, paste{' '}
              <code className="font-mono-tabular text-white">android/github-workflow-template.yml</code>, commit, and download{' '}
              <code className="font-mono-tabular text-white">sky-launcher-debug-apk</code>.
            </li>
            <li>
              <span className="text-white font-medium">With a computer:</span> Run{' '}
              <code className="font-mono-tabular text-white">npm run android:sync</code> and open{' '}
              <code className="font-mono-tabular text-white">/android</code> in Android Studio to build the APK.
            </li>
            <li>
              Tap the downloaded <code className="font-mono-tabular text-white">.apk</code> on your phone to install, then press{' '}
              <span className="text-white font-medium">Home → SKY LAUNCHER → Always</span>.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

interface PhoneLauncherModalProps {
  isOpen: boolean;
  capabilities: AndroidBridgeCapabilities;
  onRefreshBridge?: () => void;
  onShowNotice?: (msg: string) => void;
  onClose: () => void;
}

export const PhoneLauncherModal: React.FC<PhoneLauncherModalProps> = ({
  isOpen,
  capabilities,
  onRefreshBridge,
  onShowNotice,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Use SKY LAUNCHER on Phone"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-zinc-950 border border-white/20 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto no-scrollbar"
      >
        <div className="sm:hidden w-10 h-1 rounded-full bg-zinc-700 mx-auto -mt-1 mb-1" />

        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base sm:text-lg font-semibold text-white">
              Use SKY LAUNCHER on Phone
            </h3>
            <p className="text-xs text-zinc-400">
              {capabilities.isNativeAndroid
                ? 'Set SKY LAUNCHER as your Android default home screen'
                : 'Install on your phone or build the native Android Home APK'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close phone setup"
            className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <PhoneLauncherSetupPanel
          capabilities={capabilities}
          onRefreshBridge={onRefreshBridge}
          onShowNotice={onShowNotice}
        />

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-4 rounded-xl bg-zinc-900 border border-white/15 text-xs font-medium text-zinc-200 hover:text-white inline-flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 hidden" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};

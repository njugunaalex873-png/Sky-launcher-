import React, { useEffect, useState } from 'react';
import {
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Focus,
  Info,
  Lock,
  Plus,
  Power,
  RotateCcw,
  ShieldAlert,
  Trash2,
  Type,
  Unlock,
  X,
  Zap,
} from 'lucide-react';
import { getDefaultQuickActions, launchQuickActionTarget } from '../services/androidBridge';
import { AppItem, AppQuickAction, AppUsageRecord, IconShape } from '../types/launcher';
import { AppIconGlyph } from './AppIconGlyph';

interface AppOptionsSheetProps {
  app: AppItem | null;
  isHidden: boolean;
  isLocked?: boolean;
  isPaused?: boolean;
  isFocusBlocked?: boolean;
  isTextOnly?: boolean;
  isDisabled?: boolean;
  showAppIcons?: boolean;
  dailyLimit?: number;
  usedToday?: number;
  customQuickActions?: AppQuickAction[];
  usageRecord?: AppUsageRecord;
  isNativeAndroid: boolean;
  iconShape: IconShape;
  iconMonochrome: boolean;
  iconUniformMask?: boolean;
  onClose: () => void;
  onLaunch: (app: AppItem) => void;
  onToggleHide: (appId: string) => void;
  onToggleLock?: (appId: string) => void;
  onTogglePause?: (appId: string) => void;
  onToggleFocusBlock?: (appId: string) => void;
  onToggleTextOnly?: (appId: string) => void;
  onToggleDisable?: (appId: string) => void;
  onSetDailyLimit?: (appId: string, limit: number | null) => void;
  onRenameApp?: (appId: string, newName: string | null) => void;
  onUpdateCategory?: (appId: string, category: string | null) => void;
  onUpdateCustomUrl?: (appId: string, packageOrUrl: string) => void;
  onAddQuickAction?: (appId: string, label: string, targetUrl: string) => void;
  onRemoveQuickAction?: (appId: string, actionId: string) => void;
  onRemoveCustom: (appId: string) => void;
  onShowNotice?: (msg: string) => void;
}

export const AppOptionsSheet: React.FC<AppOptionsSheetProps> = ({
  app,
  isHidden,
  isLocked = false,
  isPaused = false,
  isFocusBlocked = false,
  isTextOnly = false,
  isDisabled = false,
  showAppIcons = true,
  dailyLimit,
  usedToday = 0,
  customQuickActions = [],
  usageRecord,
  isNativeAndroid,
  iconShape,
  iconMonochrome,
  iconUniformMask = false,
  onClose,
  onLaunch,
  onToggleHide,
  onToggleLock,
  onTogglePause,
  onToggleFocusBlock,
  onToggleTextOnly,
  onToggleDisable,
  onSetDailyLimit,
  onRenameApp,
  onUpdateCategory,
  onUpdateCustomUrl,
  onAddQuickAction,
  onRemoveQuickAction,
  onRemoveCustom,
  onShowNotice,
}) => {
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [categoryDraft, setCategoryDraft] = useState('');
  const [urlDraft, setUrlDraft] = useState('');
  const [showQuickSection, setShowQuickSection] = useState(false);
  const [qaLabel, setQaLabel] = useState('');
  const [qaTarget, setQaTarget] = useState('');

  useEffect(() => {
    if (app) {
      setEditing(false);
      setNameDraft(app.name);
      setCategoryDraft(app.category);
      setUrlDraft(app.launchUrl || app.packageName);
      setShowQuickSection(false);
      setQaLabel('');
      setQaTarget('');
    }
  }, [app]);

  if (!app) return null;

  const lastUsedText = usageRecord?.lastUsed
    ? new Date(usageRecord.lastUsed).toLocaleString()
    : 'Never';

  const builtInQuickActions = getDefaultQuickActions(app);
  const hasCustomName = Boolean(app.originalName && app.originalName !== app.name);
  const hasCustomCategory = Boolean(app.originalCategory && app.originalCategory !== app.category);
  const hideIcon = !showAppIcons || isTextOnly;

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = nameDraft.trim();
    const trimmedCategory = categoryDraft.trim();
    if (onRenameApp && trimmedName && trimmedName !== app.name) {
      onRenameApp(app.id, trimmedName);
    }
    if (onUpdateCategory && trimmedCategory && trimmedCategory !== app.category) {
      onUpdateCategory(app.id, trimmedCategory);
    }
    if (app.isCustom && onUpdateCustomUrl && urlDraft.trim() && urlDraft.trim() !== (app.launchUrl || app.packageName)) {
      onUpdateCustomUrl(app.id, urlDraft.trim());
    }
    setEditing(false);
  };

  const handleAddQuickAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddQuickAction || !qaLabel.trim() || !qaTarget.trim()) return;
    onAddQuickAction(app.id, qaLabel.trim(), qaTarget.trim());
    setQaLabel('');
    setQaTarget('');
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${app.name}`}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-zinc-950 border border-white/15 p-5 sm:p-6 space-y-4 shadow-2xl max-h-[88vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle on mobile */}
        <div className="sm:hidden w-10 h-1 rounded-full bg-zinc-700 mx-auto -mt-1 mb-1" />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {!hideIcon && (
              <div className={isDisabled ? 'grayscale opacity-50' : ''}>
                <AppIconGlyph
                  app={app}
                  size="medium"
                  shape={iconShape}
                  monochrome={iconMonochrome}
                  uniformMask={iconUniformMask}
                  highlighted={!isDisabled}
                />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white truncate">
                  {app.name}
                </h3>
                {isDisabled && (
                  <span className="font-mono-tabular text-[10px] uppercase px-1.5 py-0.5 rounded border border-white/20 text-zinc-300 shrink-0">
                    Off
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-mono-tabular truncate">
                {app.packageName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close app editor"
            className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metadata line */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400 border-y border-white/[0.08] py-2.5 font-mono-tabular">
          <span>{app.category}</span>
          <span className="text-zinc-600" aria-hidden="true">·</span>
          <span>{usedToday} today</span>
          <span className="text-zinc-600" aria-hidden="true">·</span>
          <span>{usageRecord?.count || 0} total</span>
          <span className="text-zinc-600" aria-hidden="true">·</span>
          <span>Last: {lastUsedText}</span>
        </div>

        {/* Inline Edit App Form (Name, Category, Custom URL) */}
        {editing && (onRenameApp || onUpdateCategory) && (
          <form
            onSubmit={handleEditSubmit}
            className="p-3.5 rounded-2xl bg-zinc-900/70 border border-white/15 space-y-2.5"
          >
            <div className="space-y-1">
              <label className="text-[11px] font-mono-tabular uppercase tracking-wider text-zinc-400">
                App Name
              </label>
              <input
                type="text"
                autoFocus
                maxLength={32}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Custom app name..."
                className="w-full px-3 py-2 rounded-xl bg-black border border-white/20 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white"
              />
            </div>

            {onUpdateCategory && (
              <div className="space-y-1">
                <label className="text-[11px] font-mono-tabular uppercase tracking-wider text-zinc-400">
                  Category
                </label>
                <input
                  type="text"
                  maxLength={24}
                  value={categoryDraft}
                  onChange={(e) => setCategoryDraft(e.target.value)}
                  placeholder="Category (e.g. Productivity)"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/20 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white"
                />
              </div>
            )}

            {app.isCustom && onUpdateCustomUrl && (
              <div className="space-y-1">
                <label className="text-[11px] font-mono-tabular uppercase tracking-wider text-zinc-400">
                  Shortcut URL / Target
                </label>
                <input
                  type="text"
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/20 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              {(hasCustomName || hasCustomCategory) ? (
                <button
                  type="button"
                  onClick={() => {
                    if (hasCustomName && onRenameApp) onRenameApp(app.id, null);
                    if (hasCustomCategory && onUpdateCategory) onUpdateCategory(app.id, null);
                    setEditing(false);
                  }}
                  className="min-h-[36px] px-3 rounded-xl bg-zinc-950 border border-white/10 text-xs text-zinc-300 hover:text-white inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="min-h-[36px] px-3 rounded-xl bg-zinc-950 border border-white/10 text-xs text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[36px] px-4 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Primary Launch or Turn Back On */}
        <div className="space-y-2">
          {isDisabled && onToggleDisable ? (
            <button
              type="button"
              onClick={() => {
                onToggleDisable(app.id);
                onShowNotice?.(`${app.name} turned on`);
              }}
              className="w-full min-h-[48px] px-4 rounded-2xl bg-white text-black font-semibold text-sm flex items-center justify-between hover:bg-zinc-200 transition-colors"
            >
              <span>App Turned Off — Tap to Turn On</span>
              <Power className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onLaunch(app);
                onClose();
              }}
              className="w-full min-h-[48px] px-4 rounded-2xl bg-white text-black font-medium text-sm flex items-center justify-between hover:bg-zinc-200 transition-colors"
            >
              <span>Launch Application</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            {(onRenameApp || onUpdateCategory) && (
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="min-h-[44px] px-3.5 rounded-2xl bg-zinc-900 border border-white/10 text-zinc-200 text-xs font-medium flex items-center justify-between hover:bg-zinc-800 transition-colors"
              >
                <span>Edit App</span>
                <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowQuickSection((v) => !v)}
              className="min-h-[44px] px-3.5 rounded-2xl bg-zinc-900 border border-white/10 text-zinc-200 text-xs font-medium flex items-center justify-between hover:bg-zinc-800 transition-colors"
            >
              <span>Quick Actions ({builtInQuickActions.length + customQuickActions.length})</span>
              <Zap className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Quick Actions Drawer */}
        {showQuickSection && (
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              Quick Actions
            </p>
            {(builtInQuickActions.length > 0 || customQuickActions.length > 0) && (
              <div className="space-y-1.5">
                {builtInQuickActions.map((qa) => (
                  <button
                    key={qa.id}
                    type="button"
                    onClick={() => {
                      const ok = launchQuickActionTarget(qa.targetUrl);
                      if (!ok) onShowNotice?.(`Unable to open ${qa.label}`);
                      onClose();
                    }}
                    className="w-full min-h-[38px] px-3 rounded-xl bg-black border border-white/10 text-xs text-zinc-200 hover:border-white/30 flex items-center justify-between"
                  >
                    <span>{qa.label}</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </button>
                ))}
                {customQuickActions.map((qa) => (
                  <div key={qa.id} className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const ok = launchQuickActionTarget(qa.targetUrl);
                        if (!ok) onShowNotice?.(`Unable to open ${qa.label}`);
                        onClose();
                      }}
                      className="flex-1 min-h-[38px] px-3 rounded-xl bg-black border border-white/15 text-xs text-white flex items-center justify-between"
                    >
                      <span className="truncate">{qa.label}</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0" />
                    </button>
                    {onRemoveQuickAction && (
                      <button
                        type="button"
                        onClick={() => onRemoveQuickAction(app.id, qa.id)}
                        aria-label={`Remove ${qa.label}`}
                        className="min-w-[38px] min-h-[38px] rounded-xl bg-black border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {onAddQuickAction && (
              <form onSubmit={handleAddQuickAction} className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={qaLabel}
                    onChange={(e) => setQaLabel(e.target.value)}
                    placeholder="Action label"
                    className="px-2.5 py-2 rounded-xl bg-black border border-white/15 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
                  />
                  <input
                    type="text"
                    value={qaTarget}
                    onChange={(e) => setQaTarget(e.target.value)}
                    placeholder="URL / tel: / mailto:"
                    className="px-2.5 py-2 rounded-xl bg-black border border-white/15 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full min-h-[36px] rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Quick Action</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* App Power, Words Only & Mindful Controls */}
        <div className="space-y-2">
          {onToggleDisable && (
            <button
              type="button"
              onClick={() => {
                const nextOff = !isDisabled;
                onToggleDisable(app.id);
                onShowNotice?.(nextOff ? `${app.name} turned off` : `${app.name} turned on`);
              }}
              className={`w-full min-h-[44px] px-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between transition-colors ${
                isDisabled
                  ? 'bg-white text-black border-white font-medium'
                  : 'bg-zinc-900 border-white/10 text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <div className="text-left">
                <span>{isDisabled ? 'App is Turned Off' : 'Turn Off App'}</span>
                <p className={`text-[11px] ${isDisabled ? 'text-zinc-600' : 'text-zinc-500'}`}>
                  {isDisabled ? 'Tap to turn back on and allow launching' : 'Disable opening this application'}
                </p>
              </div>
              <Power className={`w-4 h-4 shrink-0 ${isDisabled ? 'text-black' : 'text-zinc-400'}`} />
            </button>
          )}

          {onToggleTextOnly && (
            <button
              type="button"
              onClick={() => {
                const nextTextOnly = !isTextOnly;
                onToggleTextOnly(app.id);
                onShowNotice?.(nextTextOnly ? `${app.name}: Words only` : `${app.name}: Icon restored`);
              }}
              className={`w-full min-h-[44px] px-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between transition-colors ${
                isTextOnly || !showAppIcons
                  ? 'bg-white text-black border-white font-medium'
                  : 'bg-zinc-900 border-white/10 text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <div className="text-left">
                <span>{isTextOnly ? 'Only Words Appear (Icon Off)' : 'Show Only Words (Turn Off Icon)'}</span>
                {!showAppIcons && (
                  <p className="text-[11px] text-zinc-600">
                    Global Words Only mode is active
                  </p>
                )}
              </div>
              <Type className={`w-4 h-4 shrink-0 ${isTextOnly || !showAppIcons ? 'text-black' : 'text-zinc-400'}`} />
            </button>
          )}

          {onToggleLock && (
            <button
              type="button"
              onClick={() => onToggleLock(app.id)}
              className={`w-full min-h-[44px] px-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between transition-colors ${
                isLocked
                  ? 'bg-white text-black border-white font-medium'
                  : 'bg-zinc-900 border-white/10 text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <span>{isLocked ? 'Passcode Lock Active' : 'Lock App with Passcode'}</span>
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4 text-zinc-400" />}
            </button>
          )}

          {onTogglePause && (
            <button
              type="button"
              onClick={() => onTogglePause(app.id)}
              className={`w-full min-h-[44px] px-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between transition-colors ${
                isPaused
                  ? 'bg-white text-black border-white font-medium'
                  : 'bg-zinc-900 border-white/10 text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <span>{isPaused ? 'Mindful Launch Pause Enabled' : 'Enable Mindful Launch Pause'}</span>
              <Clock className={`w-4 h-4 ${isPaused ? 'text-black' : 'text-zinc-400'}`} />
            </button>
          )}

          {onToggleFocusBlock && (
            <button
              type="button"
              onClick={() => onToggleFocusBlock(app.id)}
              className={`w-full min-h-[44px] px-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between transition-colors ${
                isFocusBlocked
                  ? 'bg-white text-black border-white font-medium'
                  : 'bg-zinc-900 border-white/10 text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <span>{isFocusBlocked ? 'Hidden During Focus Mode' : 'Hide During Focus Mode'}</span>
              <Focus className={`w-4 h-4 ${isFocusBlocked ? 'text-black' : 'text-zinc-400'}`} />
            </button>
          )}

          {onSetDailyLimit && (
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-200 font-medium inline-flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Daily Open Limit</span>
                </span>
                <span className="font-mono-tabular text-zinc-400">
                  {dailyLimit ? `${usedToday}/${dailyLimit} today` : 'No limit'}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[null, 3, 5, 10, 15, 20].map((val) => {
                  const active = (dailyLimit || null) === val;
                  return (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => onSetDailyLimit(app.id, val)}
                      className={`min-h-[34px] rounded-xl text-xs font-mono-tabular transition-colors ${
                        active
                          ? 'bg-white text-black font-semibold'
                          : 'bg-black border border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {val === null ? 'Off' : val}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onToggleHide(app.id);
              onClose();
            }}
            className="w-full min-h-[44px] px-4 rounded-2xl bg-zinc-900 border border-white/10 text-zinc-200 text-sm flex items-center justify-between hover:bg-zinc-800 transition-colors"
          >
            <span>{isHidden ? 'Unhide Application' : 'Hide Application'}</span>
            {isHidden ? <Eye className="w-4 h-4 text-zinc-400" /> : <EyeOff className="w-4 h-4 text-zinc-400" />}
          </button>

          {isNativeAndroid && (
            <button
              type="button"
              onClick={() => {
                window.SkyAndroid?.openAppInfo(app.packageName);
                onClose();
              }}
              className="w-full min-h-[44px] px-4 rounded-2xl bg-zinc-900 border border-white/10 text-zinc-200 text-sm flex items-center justify-between hover:bg-zinc-800 transition-colors"
            >
              <span>Android App Info</span>
              <Info className="w-4 h-4 text-zinc-400" />
            </button>
          )}

          {(app.isCustom || isNativeAndroid) && !app.isSystem && (
            <button
              type="button"
              onClick={() => {
                if (app.isCustom) {
                  onRemoveCustom(app.id);
                } else if (isNativeAndroid) {
                  window.SkyAndroid?.uninstallApp(app.packageName);
                }
                onClose();
              }}
              className="w-full min-h-[44px] px-4 rounded-2xl bg-zinc-900 border border-white/10 text-zinc-300 text-sm flex items-center justify-between hover:bg-zinc-800 transition-colors"
            >
              <span>{app.isCustom ? 'Remove Shortcut' : 'Uninstall from Device'}</span>
              <Trash2 className="w-4 h-4 text-zinc-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

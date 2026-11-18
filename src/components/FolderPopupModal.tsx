import React from 'react';
import { Folder, MoreHorizontal, X } from 'lucide-react';
import { AppItem, HomeFolder, IconShape } from '../types/launcher';
import { AppIconGlyph } from './AppIconGlyph';

interface FolderPopupModalProps {
  folder: HomeFolder | null;
  apps: AppItem[];
  showAppIcons?: boolean;
  textOnlySet?: Set<string>;
  disabledSet?: Set<string>;
  iconShape: IconShape;
  iconMonochrome: boolean;
  iconUniformMask?: boolean;
  onClose: () => void;
  onLaunchApp: (app: AppItem) => void;
  onOpenOptions: (app: AppItem) => void;
  onEditFolder?: () => void;
}

export const FolderPopupModal: React.FC<FolderPopupModalProps> = ({
  folder,
  apps,
  showAppIcons = true,
  textOnlySet,
  disabledSet,
  iconShape,
  iconMonochrome,
  iconUniformMask = false,
  onClose,
  onLaunchApp,
  onOpenOptions,
  onEditFolder,
}) => {
  if (!folder) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${folder.name} folder`}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-zinc-950 border border-white/20 p-5 sm:p-6 shadow-2xl space-y-4"
      >
        <div className="sm:hidden w-10 h-1 rounded-full bg-zinc-700 mx-auto -mt-1 mb-1" />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {showAppIcons && (
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-white/15 flex items-center justify-center text-white shrink-0">
                <Folder className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-display text-base font-semibold text-white truncate">
                {folder.name}
              </h3>
              <p className="text-xs font-mono-tabular text-zinc-400">
                {apps.length} {apps.length === 1 ? 'app' : 'apps'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onEditFolder && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditFolder();
                }}
                className="min-h-[36px] px-3 rounded-xl bg-zinc-900 border border-white/15 text-xs font-medium text-zinc-200 hover:text-white"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close folder"
              className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {apps.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-400 rounded-2xl bg-zinc-900/50 border border-white/10">
            No visible applications in this folder.
          </div>
        ) : (
          <div className="rounded-2xl bg-zinc-900/50 border border-white/10 divide-y divide-white/[0.06] max-h-[55vh] overflow-y-auto no-scrollbar">
            {apps.map((app) => {
              const hideIcon = !showAppIcons || (textOnlySet?.has(app.id) ?? false);
              const isDisabled = disabledSet?.has(app.id) ?? false;
              return (
                <div
                  key={app.id}
                  className={`flex items-center justify-between gap-2 px-3 py-2 hover:bg-white/[0.04] transition-colors ${
                    isDisabled ? 'opacity-60' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchApp(app);
                    }}
                    className={`flex-1 min-w-0 flex items-center text-left min-h-[44px] ${
                      hideIcon ? 'gap-2 px-1' : 'gap-3'
                    }`}
                  >
                    {!hideIcon && (
                      <div className={isDisabled ? 'grayscale opacity-50' : ''}>
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
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-zinc-100 truncate sky-app-label">
                          {app.name}
                        </p>
                        {isDisabled && (
                          <span className="font-mono-tabular text-[10px] uppercase px-1.5 py-0.5 rounded border border-white/15 text-zinc-400 shrink-0">
                            Off
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono-tabular text-zinc-500 truncate">
                        {app.category}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenOptions(app);
                    }}
                    aria-label={`Options for ${app.name}`}
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center text-zinc-500 hover:text-white rounded-xl"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

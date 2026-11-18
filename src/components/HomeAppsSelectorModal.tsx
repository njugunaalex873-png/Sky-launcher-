import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Folder, FolderPlus, Trash2, X } from 'lucide-react';
import { AppItem, HomeFolder, IconShape } from '../types/launcher';
import { AppIconGlyph } from './AppIconGlyph';

interface HomeAppsSelectorModalProps {
  isOpen: boolean;
  installedApps: AppItem[];
  hiddenSet: Set<string>;
  favorites: string[];
  homeFolders: HomeFolder[];
  iconShape: IconShape;
  iconMonochrome: boolean;
  iconUniformMask?: boolean;
  onClose: () => void;
  onUpdateFavorites: (favorites: string[]) => void;
  onCreateFolder: (name: string, appIds: string[]) => HomeFolder | null;
  onUpdateFolder: (folderId: string, name: string, appIds: string[]) => void;
  onDeleteFolder: (folderId: string) => void;
  onShowNotice: (msg: string) => void;
}

type SelectorTab = 'pick' | 'order' | 'folders';

export const HomeAppsSelectorModal: React.FC<HomeAppsSelectorModalProps> = ({
  isOpen,
  installedApps,
  hiddenSet,
  favorites,
  homeFolders,
  iconShape,
  iconMonochrome,
  iconUniformMask = false,
  onClose,
  onUpdateFavorites,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onShowNotice,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(favorites);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SelectorTab>('pick');

  // Folder builder state
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderAppIds, setFolderAppIds] = useState<string[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedIds(favorites);
      setQuery('');
      setActiveTab('pick');
      setEditingFolderId(null);
      setFolderName('');
      setFolderAppIds([]);
    }
  }, [isOpen, favorites]);

  const availableApps = useMemo(() => {
    return installedApps
      .filter((app) => !hiddenSet.has(app.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [installedApps, hiddenSet]);

  const appById = useMemo(() => {
    const map = new Map<string, AppItem>();
    for (const app of availableApps) map.set(app.id, app);
    return map;
  }, [availableApps]);

  const folderById = useMemo(() => {
    const map = new Map<string, HomeFolder>();
    for (const folder of homeFolders) map.set(folder.id, folder);
    return map;
  }, [homeFolders]);

  const filteredApps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableApps;
    return availableApps.filter(
      (app) =>
        app.name.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q) ||
        app.packageName.toLowerCase().includes(q)
    );
  }, [availableApps, query]);

  if (!isOpen) return null;

  const handleToggleSelect = (slotId: string) => {
    if (selectedIds.includes(slotId)) {
      setSelectedIds((prev) => prev.filter((id) => id !== slotId));
    } else {
      if (selectedIds.length >= 8) {
        onShowNotice('Maximum 8 items allowed on the home screen');
        return;
      }
      setSelectedIds((prev) => [...prev, slotId]);
    }
  };

  const handleMoveSlot = (idx: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= selectedIds.length) return;
    setSelectedIds((prev) => {
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const handleSaveFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) {
      onShowNotice('Enter a folder name');
      return;
    }
    if (folderAppIds.length === 0) {
      onShowNotice('Select at least 1 app for the folder');
      return;
    }
    if (editingFolderId) {
      onUpdateFolder(editingFolderId, folderName.trim(), folderAppIds);
      onShowNotice(`Updated folder ${folderName.trim()}`);
      setEditingFolderId(null);
      setFolderName('');
      setFolderAppIds([]);
    } else {
      const created = onCreateFolder(folderName.trim(), folderAppIds);
      if (created) {
        const slotId = `folder:${created.id}`;
        if (selectedIds.length < 8 && !selectedIds.includes(slotId)) {
          setSelectedIds((prev) => [...prev, slotId]);
        }
      }
      setFolderName('');
      setFolderAppIds([]);
    }
  };

  const handleSave = () => {
    onUpdateFavorites(selectedIds);
    onShowNotice(`Home screen updated with ${selectedIds.length} items`);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-zinc-950 border border-white/20 p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[88vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-display text-base sm:text-lg font-semibold text-white tracking-tight">
              Home Screen Slots (Up to 8)
            </h3>
            <p className="text-xs font-mono-tabular text-zinc-400 mt-0.5">
              {selectedIds.length} of 8 selected · Apps & Folders
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-zinc-900 border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('pick')}
            className={`min-h-[36px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'pick'
                ? 'bg-white text-black font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Pick ({selectedIds.length}/8)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('order')}
            className={`min-h-[36px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'order'
                ? 'bg-white text-black font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Reorder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('folders')}
            className={`min-h-[36px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'folders'
                ? 'bg-white text-black font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Folders ({homeFolders.length})
          </button>
        </div>

        {activeTab === 'pick' && (
          <>
            <div className="shrink-0">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search applications..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar rounded-2xl bg-zinc-900/60 border border-white/10 divide-y divide-white/[0.06]">
              {/* Home Folders selectable as slots */}
              {!query.trim() &&
                homeFolders.map((folder) => {
                  const slotId = `folder:${folder.id}`;
                  const isSelected = selectedIds.includes(slotId);
                  return (
                    <button
                      key={slotId}
                      type="button"
                      onClick={() => handleToggleSelect(slotId)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.04] ${
                        isSelected ? 'bg-white/[0.06]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-white/25 flex items-center justify-center text-white shrink-0">
                          <Folder className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-100 truncate">
                            {folder.name}
                          </p>
                          <p className="text-[11px] font-mono-tabular text-zinc-500 truncate">
                            Folder · {folder.appIds.length} apps
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                          isSelected
                            ? 'bg-white border-white text-black'
                            : 'border-white/20 bg-zinc-950 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </button>
                  );
                })}

              {filteredApps.length === 0 ? (
                <div className="p-6 text-center text-zinc-400 text-xs">
                  No matching applications found.
                </div>
              ) : (
                filteredApps.map((app) => {
                  const isSelected = selectedIds.includes(app.id);
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => handleToggleSelect(app.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.04] ${
                        isSelected ? 'bg-white/[0.06]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AppIconGlyph
                          app={app}
                          size="small"
                          shape={iconShape}
                          monochrome={iconMonochrome}
                          uniformMask={iconUniformMask}
                          highlighted={isSelected}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-100 truncate">
                            {app.name}
                          </p>
                          <p className="text-[11px] font-mono-tabular text-zinc-500 truncate">
                            {app.category}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                          isSelected
                            ? 'bg-white border-white text-black'
                            : 'border-white/20 bg-zinc-950 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}

        {activeTab === 'order' && (
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar rounded-2xl bg-zinc-900/60 border border-white/10 divide-y divide-white/[0.06]">
            {selectedIds.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 text-xs">
                No Home slots selected yet. Pick apps or folders first.
              </div>
            ) : (
              selectedIds.map((slotId, idx) => {
                const isFolder = slotId.startsWith('folder:');
                const folder = isFolder ? folderById.get(slotId.slice('folder:'.length)) : null;
                const app = !isFolder ? appById.get(slotId) : null;
                if (!folder && !app) return null;

                return (
                  <div
                    key={slotId}
                    className="flex items-center justify-between gap-2 px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono-tabular text-xs text-zinc-500 w-4">
                        {idx + 1}
                      </span>
                      {folder ? (
                        <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-white/25 flex items-center justify-center text-white shrink-0">
                          <Folder className="w-4 h-4" />
                        </div>
                      ) : app ? (
                        <AppIconGlyph
                          app={app}
                          size="small"
                          shape={iconShape}
                          monochrome={iconMonochrome}
                          uniformMask={iconUniformMask}
                        />
                      ) : null}
                      <span className="text-sm font-medium text-zinc-100 truncate">
                        {folder ? folder.name : app?.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveSlot(idx, 'up')}
                        aria-label="Move up"
                        className="min-w-[36px] min-h-[36px] rounded-lg bg-zinc-950 border border-white/15 text-zinc-300 hover:text-white disabled:opacity-30 flex items-center justify-center"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === selectedIds.length - 1}
                        onClick={() => handleMoveSlot(idx, 'down')}
                        aria-label="Move down"
                        className="min-w-[36px] min-h-[36px] rounded-lg bg-zinc-950 border border-white/15 text-zinc-300 hover:text-white disabled:opacity-30 flex items-center justify-center"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'folders' && (
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-4">
            {/* Existing folders */}
            {homeFolders.length > 0 && (
              <div className="rounded-2xl bg-zinc-900/60 border border-white/10 divide-y divide-white/[0.06]">
                {homeFolders.map((folder) => {
                  const slotId = `folder:${folder.id}`;
                  const onHome = selectedIds.includes(slotId);
                  return (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between gap-2 px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Folder className="w-4 h-4 text-zinc-300 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {folder.name}
                          </p>
                          <p className="text-[11px] font-mono-tabular text-zinc-500">
                            {folder.appIds.length} apps
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(slotId)}
                          className={`min-h-[34px] px-2.5 rounded-lg text-xs font-medium transition-colors ${
                            onHome
                              ? 'bg-white text-black'
                              : 'bg-zinc-950 border border-white/15 text-zinc-300 hover:text-white'
                          }`}
                        >
                          {onHome ? 'On Home' : 'Add'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFolderId(folder.id);
                            setFolderName(folder.name);
                            setFolderAppIds(folder.appIds);
                          }}
                          className="min-h-[34px] px-2.5 rounded-lg bg-zinc-950 border border-white/15 text-xs text-zinc-300 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteFolder(folder.id);
                            setSelectedIds((prev) => prev.filter((id) => id !== slotId));
                          }}
                          aria-label={`Delete folder ${folder.name}`}
                          className="min-w-[34px] min-h-[34px] rounded-lg bg-zinc-950 border border-white/15 text-zinc-400 hover:text-white flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Create / Edit folder form */}
            <form
              onSubmit={handleSaveFolder}
              className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/15 space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>{editingFolderId ? 'Edit Folder' : 'New Home Folder'}</span>
                </p>
                {editingFolderId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFolderId(null);
                      setFolderName('');
                      setFolderAppIds([]);
                    }}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Cancel edit
                  </button>
                )}
              </div>

              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                maxLength={24}
                placeholder="Folder name (e.g. Work, Media)"
                className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white"
              />

              <div className="max-h-40 overflow-y-auto no-scrollbar rounded-xl bg-black border border-white/10 divide-y divide-white/[0.06]">
                {availableApps.map((app) => {
                  const picked = folderAppIds.includes(app.id);
                  return (
                    <button
                      key={`fld-pick-${app.id}`}
                      type="button"
                      onClick={() =>
                        setFolderAppIds((prev) =>
                          prev.includes(app.id)
                            ? prev.filter((id) => id !== app.id)
                            : [...prev, app.id]
                        )
                      }
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/[0.04]"
                    >
                      <span className="text-xs text-zinc-200 truncate">{app.name}</span>
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          picked
                            ? 'bg-white border-white text-black'
                            : 'border-white/20 text-transparent'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="submit"
                className="w-full min-h-[40px] rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold"
              >
                {editingFolderId
                  ? `Update Folder (${folderAppIds.length} apps)`
                  : `Create Folder (${folderAppIds.length} apps)`}
              </button>
            </form>
          </div>
        )}

        {/* Footer Actions */}
        <div className="shrink-0 pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="min-h-[40px] px-3.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white"
          >
            Clear All
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-3.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="min-h-[40px] px-5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Home Apps ({selectedIds.length}/8)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

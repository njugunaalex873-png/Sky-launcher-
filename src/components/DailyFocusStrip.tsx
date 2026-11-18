import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { FocusItem } from '../types/launcher';

interface DailyFocusStripProps {
  items: FocusItem[];
  onAddItem: (text: string) => void;
  onToggleItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClearCompleted: () => void;
}

export const DailyFocusStrip: React.FC<DailyFocusStripProps> = ({
  items,
  onAddItem,
  onToggleItem,
  onRemoveItem,
  onClearCompleted,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState('');

  const completedCount = items.filter((i) => i.done).length;
  const remainingCount = items.length - completedCount;
  const nextPending = items.find((i) => !i.done);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onAddItem(draft.trim());
    setDraft('');
  };

  return (
    <div className="rounded-2xl bg-zinc-950/75 border border-white/10 backdrop-blur-md transition-colors">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full min-h-[42px] px-3.5 py-2 flex items-center justify-between gap-3 text-left hover:bg-white/[0.03] rounded-2xl transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400 shrink-0">
            Focus
          </span>
          <span className="text-zinc-600" aria-hidden="true">
            ·
          </span>
          {items.length === 0 ? (
            <span className="text-xs text-zinc-400 truncate">
              Set up to 3 daily priorities
            </span>
          ) : nextPending ? (
            <span className="text-xs text-zinc-200 truncate">{nextPending.text}</span>
          ) : (
            <span className="text-xs text-zinc-400 truncate">
              All {items.length} priorities complete
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono-tabular text-zinc-400">
          {items.length > 0 && (
            <span>
              {completedCount}/{items.length}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3.5 pb-3 pt-1 border-t border-white/[0.06] space-y-2.5">
          {items.length > 0 && (
            <div className="divide-y divide-white/[0.06]">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 py-1.5"
                >
                  <button
                    type="button"
                    onClick={() => onToggleItem(item.id)}
                    className="flex-1 min-w-0 flex items-center gap-2.5 text-left min-h-[36px]"
                  >
                    <span
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        item.done
                          ? 'bg-white border-white text-black'
                          : 'border-white/25 bg-black text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span
                      className={`text-xs sm:text-sm truncate ${
                        item.done ? 'line-through text-zinc-500' : 'text-zinc-100'
                      }`}
                    >
                      {item.text}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    aria-label={`Remove ${item.text}`}
                    className="min-w-[32px] min-h-[32px] flex items-center justify-center text-zinc-500 hover:text-white rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {remainingCount < 3 || items.length < 3 ? (
            <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-0.5">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={64}
                placeholder="Add a daily priority..."
                className="flex-1 min-w-0 min-h-[38px] px-3 rounded-xl bg-black border border-white/15 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
              />
              <button
                type="submit"
                aria-label="Add focus item"
                className="min-w-[38px] min-h-[38px] rounded-xl bg-white text-black hover:bg-zinc-200 flex items-center justify-center shrink-0 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          ) : null}

          {completedCount > 0 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClearCompleted}
                className="text-[11px] text-zinc-400 hover:text-white transition-colors"
              >
                Clear completed
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

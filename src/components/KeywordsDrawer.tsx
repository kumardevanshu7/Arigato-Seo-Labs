import React, { useState } from 'react';
import type { KeywordItem, SeoCategory } from '../types/seo';
import { X, Plus, Trash2, CheckCircle2, Pin, Globe, Tag } from 'lucide-react';

interface KeywordsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: SeoCategory;
  pinterestKeywords: KeywordItem[];
  siteKeywords: KeywordItem[];
  onUpdatePinterestKeywords: (kws: KeywordItem[]) => void;
  onUpdateSiteKeywords: (kws: KeywordItem[]) => void;
  isFirestoreConnected?: boolean;
}

export const KeywordsDrawer: React.FC<KeywordsDrawerProps> = ({
  isOpen,
  onClose,
  activeCategory,
  pinterestKeywords,
  siteKeywords,
  onUpdatePinterestKeywords,
  onUpdateSiteKeywords,
  isFirestoreConnected = true,
}) => {
  const [selectedTab, setSelectedTab] = useState<SeoCategory>(activeCategory);
  const [singleInput, setSingleInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  if (!isOpen) return null;

  const currentList = selectedTab === 'pinterest' ? pinterestKeywords : siteKeywords;
  const updateCurrentList = (newList: KeywordItem[]) => {
    if (selectedTab === 'pinterest') {
      onUpdatePinterestKeywords(newList);
    } else {
      onUpdateSiteKeywords(newList);
    }
  };

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = singleInput.trim();
    if (!trimmed) return;

    if (currentList.some((k) => k.text.toLowerCase() === trimmed.toLowerCase())) {
      alert('This keyword is already in your repository.');
      return;
    }

    const newItem: KeywordItem = {
      id: `${selectedTab}-${Date.now()}`,
      text: trimmed,
      category: 'primary',
      active: true,
    };

    updateCurrentList([newItem, ...currentList]);
    setSingleInput('');
  };

  const handleBulkAdd = () => {
    if (!bulkInput.trim()) return;
    const splitKeywords = bulkInput
      .split(/[\n,]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const existingLower = new Set(currentList.map((k) => k.text.toLowerCase()));
    const newItems: KeywordItem[] = [];

    splitKeywords.forEach((text, i) => {
      if (!existingLower.has(text.toLowerCase())) {
        newItems.push({
          id: `${selectedTab}-bulk-${Date.now()}-${i}`,
          text,
          category: 'trending',
          active: true,
        });
        existingLower.add(text.toLowerCase());
      }
    });

    updateCurrentList([...newItems, ...currentList]);
    setBulkInput('');
    setShowBulkAdd(false);
  };

  const toggleKeywordActive = (id: string) => {
    const updated = currentList.map((k) => (k.id === id ? { ...k, active: !k.active } : k));
    updateCurrentList(updated);
  };

  const toggleKeywordPin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = currentList.map((k) => {
      if (k.id === id) {
        const nextPinned = !k.isPinned;
        return {
          ...k,
          isPinned: nextPinned,
          active: nextPinned ? true : k.active, // auto-activate when pinned
        };
      }
      return k;
    });
    updateCurrentList(updated);
  };

  const deleteKeyword = (id: string) => {
    const updated = currentList.filter((k) => k.id !== id);
    updateCurrentList(updated);
  };

  const toggleAll = (activate: boolean) => {
    const updated = currentList.map((k) => ({ ...k, active: activate }));
    updateCurrentList(updated);
  };

  const activeCount = currentList.filter((k) => k.active).length;
  const pinnedCount = currentList.filter((k) => k.isPinned).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in">
      {/* Drawer Panel: Full width on mobile, max-w-lg on tablet/desktop */}
      <div className="w-full sm:max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-[#e5e3df]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e5e3df] bg-[#fafaf9] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-semibold text-[#1a1a1a]">
                Keywords Repository
              </h2>
              <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-[#5645d4] text-white font-medium">
                Active: {activeCount}/{currentList.length}
              </span>
              <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-[#fef3c7] border border-[#fde047] text-[#92400e] font-semibold flex items-center gap-1">
                📌 Pinned: {pinnedCount}
              </span>
              <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-[#e0f2fe] border border-[#bae6fd] text-[#0369a1] font-semibold flex items-center gap-1">
                ☁️ Firestore {isFirestoreConnected ? 'Live' : 'Syncing'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#787671] mt-0.5">
              Configured terms injected into generated outputs.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-[#787671] hover:text-[#1a1a1a] hover:bg-[#ede9e4] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 border-b border-[#e5e3df] bg-white px-3 sm:px-5 pt-2">
          <button
            onClick={() => setSelectedTab('pinterest')}
            className={`flex items-center justify-center gap-1.5 pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              selectedTab === 'pinterest'
                ? 'border-[#e60023] text-[#e60023]'
                : 'border-transparent text-[#787671] hover:text-[#1a1a1a]'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            <span>Pinterest ({pinterestKeywords.length})</span>
          </button>

          <button
            onClick={() => setSelectedTab('site')}
            className={`flex items-center justify-center gap-1.5 pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              selectedTab === 'site'
                ? 'border-[#5645d4] text-[#5645d4]'
                : 'border-transparent text-[#787671] hover:text-[#1a1a1a]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Arigato Site ({siteKeywords.length})</span>
          </button>
        </div>

        {/* Add Keywords Section */}
        <div className="p-3.5 sm:p-5 border-b border-[#ede9e4] bg-[#fafaf9]">
          <form onSubmit={handleAddSingle} className="flex gap-2 mb-2">
            <input
              type="text"
              value={singleInput}
              onChange={(e) => setSingleInput(e.target.value)}
              placeholder={`Add ${selectedTab === 'pinterest' ? 'Pinterest' : 'Site'} keyword...`}
              className="flex-1 px-3 py-2 text-sm sm:text-xs bg-white border border-[#c8c4be] rounded-md focus:outline-none focus:border-[#5645d4] text-[#1a1a1a]"
            />
            <button
              type="submit"
              className="flex items-center gap-1 px-3.5 py-2 bg-[#5645d4] text-white text-xs font-semibold rounded-md hover:bg-[#4534b3] transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => setShowBulkAdd(!showBulkAdd)}
              className="text-[#5645d4] hover:underline font-medium text-[11px] sm:text-xs cursor-pointer"
            >
              {showBulkAdd ? 'Hide Bulk Paste' : '+ Bulk Paste Keywords'}
            </button>
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-[#787671]">
              <button
                type="button"
                onClick={() => toggleAll(true)}
                className="hover:text-[#1a1a1a] cursor-pointer"
              >
                Select All
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => toggleAll(false)}
                className="hover:text-[#1a1a1a] cursor-pointer"
              >
                Deselect
              </button>
              {currentList.length > 0 && (
                <>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => updateCurrentList([])}
                    className="text-red-500 hover:text-red-700 cursor-pointer font-medium"
                    title="Delete all keywords from Cloud Firestore"
                  >
                    Clear All
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bulk Paste Textarea */}
          {showBulkAdd && (
            <div className="mt-2.5 p-2.5 sm:p-3 bg-white border border-[#c8c4be] rounded-md animate-in fade-in">
              <label className="block text-[10px] sm:text-[11px] font-medium text-[#5d5b54] mb-1">
                Paste keywords separated by comma or new lines:
              </label>
              <textarea
                rows={3}
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="aesthetic wallpaper, moody lighting, 4k prompt..."
                className="w-full text-xs p-2 border border-[#e5e3df] rounded font-mono focus:outline-none focus:border-[#5645d4]"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkAdd(false)}
                  className="px-2.5 py-1 text-xs text-[#787671] hover:bg-[#f6f5f4] rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkAdd}
                  className="px-3 py-1 text-xs bg-[#0a1530] text-white rounded font-medium hover:bg-[#1a2a52]"
                >
                  Import
                </button>
              </div>
            </div>
          )}

          {/* Pin Feature Guidance Banner */}
          <div className="mt-2.5 p-2.5 bg-[#fef9c3]/80 border border-[#fde047] rounded-lg text-[11px] text-[#854d0e] flex items-start gap-2">
            <span className="text-sm shrink-0 leading-none mt-0.5">📌</span>
            <div className="leading-snug">
              <span className="font-bold">Pin Keyword Rule:</span> Jis keyword par aap <strong>Pin (Must Include)</strong> lagayenge, system use <strong>har halat mein SEO description mein include karega</strong>. Baaki terms context ke mutabik intelligently match honge.
            </div>
          </div>
        </div>

        {/* Keywords List */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-2">
          {currentList.length === 0 ? (
            <div className="text-center py-12 px-4 text-[#787671] bg-white rounded-xl border border-dashed border-[#d8d5cf] my-4">
              <Tag className="w-8 h-8 mx-auto mb-2 text-[#a4a097]" />
              <p className="text-sm font-semibold text-[#1a1a1a]">No keywords in Cloud Firestore</p>
              <p className="text-xs text-[#787671] mt-1 max-w-xs mx-auto">
                Add your target keywords above or use Bulk Paste. All entries are saved directly to your Cloud Firestore database.
              </p>
            </div>
          ) : (
            currentList.map((kw) => (
              <div
                key={kw.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  kw.isPinned
                    ? 'bg-[#fffbeb] border-[#fde047] shadow-xs ring-1 ring-[#fef08a]'
                    : kw.active
                    ? 'bg-white border-[#c8c4be] shadow-2xs'
                    : 'bg-[#f6f5f4] border-[#e5e3df] opacity-60'
                }`}
              >
                <div
                  onClick={() => toggleKeywordActive(kw.id)}
                  className="flex items-center gap-2.5 flex-1 cursor-pointer select-none min-w-0 pr-2"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      kw.active
                        ? selectedTab === 'pinterest'
                          ? 'bg-[#e60023] border-[#e60023] text-white'
                          : 'bg-[#5645d4] border-[#5645d4] text-white'
                        : 'border-[#c8c4be] bg-white'
                    }`}
                  >
                    {kw.active && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span
                    className={`text-xs font-medium truncate ${
                      kw.active ? 'text-[#1a1a1a]' : 'text-[#787671] line-through'
                    }`}
                  >
                    {kw.text}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Pin Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => toggleKeywordPin(kw.id, e)}
                    className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      kw.isPinned
                        ? 'bg-[#fef3c7] text-[#92400e] border border-[#f59e0b] shadow-2xs hover:bg-[#fde68a]'
                        : 'text-[#787671] hover:text-[#92400e] hover:bg-[#fef3c7]/60 border border-transparent'
                    }`}
                    title={
                      kw.isPinned
                        ? '📌 Pinned: Always included in SEO description. Click to unpin.'
                        : 'Click to Pin: Force mandatory inclusion in SEO descriptions'
                    }
                  >
                    <span>📌</span>
                    <span>{kw.isPinned ? 'Must Include' : 'Pin'}</span>
                  </button>

                  {kw.category && (
                    <span
                      className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                        kw.category === 'primary'
                          ? 'bg-[#ffe8d4] text-[#793400]'
                          : kw.category === 'trending'
                          ? 'bg-[#d9f3e1] text-[#1aae39]'
                          : kw.category === 'niche'
                          ? 'bg-[#dcecfa] text-[#005bab]'
                          : 'bg-[#e6e0f5] text-[#391c57]'
                      }`}
                    >
                      {kw.category}
                    </span>
                  )}
                  <button
                    onClick={() => deleteKeyword(kw.id)}
                    className="p-1.5 text-[#a4a097] hover:text-[#e03131] rounded transition-colors cursor-pointer"
                    title="Delete keyword"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#e5e3df] bg-[#fafaf9] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[#5d5b54]">
            <span className="w-2 h-2 rounded-full bg-[#1aae39] shrink-0 animate-pulse"></span>
            <span>Persists automatically in Cloud Firestore.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#5645d4] text-white text-xs font-semibold rounded-md hover:bg-[#4534b3] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

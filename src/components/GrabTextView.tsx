import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Sparkles,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Trash2,
  Database,
  Hash,
} from 'lucide-react';
import type { GrabTextResult } from '../types/seo';
import { extractTextFromImages } from '../services/seoService';

interface GrabTextViewProps {
  onAddKeywordsToFirestore?: (keywords: string[]) => void;
  onOpenKeywordsDrawer?: () => void;
}

interface UploadedImageItem {
  id: string;
  name: string;
  size: string;
  dataUrl: string;
}

export const GrabTextView: React.FC<GrabTextViewProps> = ({
  onAddKeywordsToFirestore,
}) => {
  const [images, setImages] = useState<UploadedImageItem[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState({ step: 0, message: '' });
  const [result, setResult] = useState<GrabTextResult | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedChip, setCopiedChip] = useState<string | null>(null);
  const [savedToDb, setSavedToDb] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle files selection
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = 10 - images.length;
    const toProcess = Array.from(files).slice(0, remainingSlots);

    toProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const sizeKb = (file.size / 1024).toFixed(1) + ' KB';
        setImages((prev) => [
          ...prev,
          {
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            size: sizeKb,
            dataUrl,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const clearAllImages = () => {
    setImages([]);
    setResult(null);
  };

  const runExtraction = async () => {
    if (images.length === 0 || isExtracting) return;
    setIsExtracting(true);
    setExtractionProgress({ step: 1, message: 'Reading visual assets...' });
    setResult(null);
    setSavedToDb(false);

    try {
      const res = await extractTextFromImages(
        images.map((img) => ({ dataUrl: img.dataUrl, name: img.name })),
        (step, message) => setExtractionProgress({ step, message })
      );
      setResult(res);
    } catch (err) {
      console.error('Extraction failed:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const copyToClipboard = (text: string, type: 'all' | 'chip' | number) => {
    navigator.clipboard.writeText(text);
    if (type === 'all') {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } else if (type === 'chip') {
      setCopiedChip(text);
      setTimeout(() => setCopiedChip(null), 1800);
    } else if (typeof type === 'number') {
      setCopiedIndex(type);
      setTimeout(() => setCopiedIndex(null), 1800);
    }
  };

  const handleSaveToFirestore = () => {
    if (!result || !onAddKeywordsToFirestore) return;
    onAddKeywordsToFirestore(result.items);
    setSavedToDb(true);
    setTimeout(() => setSavedToDb(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Tool Header Card */}
      <div className="bg-white rounded-xl border border-[#e5e3df] p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e6e0f5] text-[#5645d4] flex items-center justify-center shrink-0 border border-[#d6b6f6]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#1a1a1a]">
                  Grab Text & Visual Keywords
                </h2>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#e6e0f5] text-[#5645d4]">
                  Multi-OCR
                </span>
              </div>
              <p className="text-xs text-[#787671] mt-0.5">
                Upload 1 to 5+ screenshots, reference cards, or prompt graphics to automatically extract and format all text keywords.
              </p>
            </div>
          </div>

          {images.length > 0 && (
            <button
              onClick={clearAllImages}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#e03e3e] hover:bg-[#ffebe6] rounded-md transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Upload Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          className="mt-5 border-2 border-dashed border-[#c8c4be] hover:border-[#5645d4] bg-[#fafaf9] hover:bg-[#f6f5f4] rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all group"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="w-12 h-12 mx-auto rounded-full bg-white shadow-xs border border-[#e5e3df] flex items-center justify-center text-[#787671] group-hover:text-[#5645d4] group-hover:scale-110 transition-all mb-3">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-[#1a1a1a]">
            Click or drag & drop images here
          </p>
          <p className="text-xs text-[#787671] mt-1">
            Upload 1, 2, 3, 4, 5+ pictures (PNG, JPG, WEBP)
          </p>
        </div>

        {/* Uploaded Images Gallery Preview */}
        {images.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1a1a1a] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#5645d4]" />
                <span>Uploaded Images ({images.length})</span>
              </span>
              <span className="text-[11px] text-[#787671]">Max 10 images supported</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  className="relative group bg-[#fafaf9] rounded-lg border border-[#e5e3df] p-2 overflow-hidden shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="aspect-square rounded bg-[#f0eee9] overflow-hidden mb-1.5 relative">
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono px-1 py-0.2 rounded">
                      #{idx + 1}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-[#1a1a1a] truncate" title={img.name}>
                    {img.name}
                  </p>
                  <p className="text-[9px] text-[#787671]">{img.size}</p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.id);
                    }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 hover:bg-[#e03e3e] text-[#787671] hover:text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#f0eee9]">
              <div className="text-xs text-[#787671]">
                Ready to extract keywords & prompts from {images.length} image{images.length > 1 ? 's' : ''}.
              </div>

              <button
                onClick={runExtraction}
                disabled={isExtracting}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#5645d4] hover:bg-[#4534b3] text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-[#f5d75e]" />
                <span>{isExtracting ? 'Extracting Keywords...' : 'Grab Text & Extract Keywords'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SKELETON LOADING STATE */}
      {isExtracting && (
        <div className="space-y-6 animate-pulse">
          <div className="bg-white rounded-xl border border-[#e5e3df] p-4 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#5645d4] border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="text-xs font-semibold text-[#1a1a1a]">
                {extractionProgress.message || 'Extracting keywords from images...'}
              </p>
              <p className="text-[10px] text-[#787671] font-mono">
                Multimodal OCR & Keyword Processing Step {extractionProgress.step}/3
              </p>
            </div>
          </div>

          {/* Skeleton Way 1 */}
          <div className="bg-[#181a20] rounded-xl border border-[#27272a] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#3f3f46]"></div>
                <div className="w-32 h-3.5 rounded bg-[#3f3f46]"></div>
              </div>
              <div className="w-16 h-6 rounded bg-[#3f3f46]"></div>
            </div>
            <div className="space-y-2 py-3">
              <div className="w-full h-4 rounded bg-[#27272a]"></div>
              <div className="w-5/6 h-4 rounded bg-[#27272a]"></div>
              <div className="w-4/6 h-4 rounded bg-[#27272a]"></div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-[#27272a]">
              <div className="w-20 h-6 rounded bg-[#27272a]"></div>
              <div className="w-28 h-6 rounded bg-[#27272a]"></div>
              <div className="w-24 h-6 rounded bg-[#27272a]"></div>
            </div>
          </div>

          {/* Skeleton Way 2 */}
          <div className="space-y-3">
            <div className="w-48 h-5 rounded bg-[#e5e3df]"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-[#e5e3df] p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="w-8 h-3 rounded bg-[#f0eee9]"></div>
                    <div className="w-12 h-5 rounded bg-[#f0eee9]"></div>
                  </div>
                  <div className="w-full h-9 rounded bg-[#f6f5f4]"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RESULTS DISPLAY (2 WAYS) */}
      {result && !isExtracting && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Summary Banner */}
          <div className="bg-[#f6f5f4] rounded-xl border border-[#e5e3df] p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#1aae39] text-white flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <div>
                <p className="text-xs font-bold text-[#1a1a1a]">
                  Successfully Grabbed {result.totalExtracted} Clean Keywords
                </p>
                <p className="text-[11px] text-[#787671]">
                  Extracted from {images.length} image{images.length > 1 ? 's' : ''} with OCR & deduplication.
                </p>
              </div>
            </div>

            {onAddKeywordsToFirestore && (
              <button
                onClick={handleSaveToFirestore}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#fafaf9] border border-[#c8c4be] rounded-md text-xs font-medium text-[#1a1a1a] shadow-2xs transition-colors cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-[#5645d4]" />
                <span>{savedToDb ? 'Saved to Firestore! ✓' : 'Save to Firestore Drawer'}</span>
              </button>
            )}
          </div>

          {/* WAY 1: Single Code Block (All Comma-Separated) */}
          <div className="space-y-2">
            <div>
              <h3 className="text-sm font-bold text-[#1a1a1a] flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-[#0a1530] text-white text-xs flex items-center justify-center font-mono">
                  1
                </span>
                <span>Way 1 — Single Code Block (Comma-Separated)</span>
              </h3>
              <p className="text-xs text-[#787671] mt-0.5">
                All extracted terms in one clean code container, ready for one-click copy.
              </p>
            </div>

            {/* Code Block Container */}
            <div className="bg-[#181a20] rounded-xl border border-[#27272a] overflow-hidden shadow-md">
              <div className="px-4 py-2.5 bg-[#13151d] border-b border-[#27272a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block"></span>
                  </div>
                  <span className="text-xs font-mono text-[#a1a1aa] ml-2">
                    grabbed-keywords.csv
                  </span>
                  <span className="text-[10px] font-mono text-[#4ade80] bg-[#4ade80]/10 px-1.5 py-0.5 rounded border border-[#4ade80]/20">
                    {result.totalExtracted} terms
                  </span>
                </div>

                <button
                  onClick={() => copyToClipboard(result.allCommaSeparated, 'all')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-mono transition-all cursor-pointer border border-[#3f3f46]"
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#4ade80]" />
                      <span className="text-[#4ade80]">Copied All!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#a1a1aa]" />
                      <span>Copy All</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 sm:p-5 text-xs font-mono leading-relaxed text-[#e2e8f0] select-all selection:bg-[#5645d4] selection:text-white max-h-48 overflow-y-auto">
                {result.allCommaSeparated}
              </div>

              <div className="p-3 bg-[#13151d] border-t border-[#27272a] flex flex-wrap gap-1.5">
                {result.items.map((kw, i) => (
                  <span
                    key={i}
                    onClick={() => copyToClipboard(kw, 'chip')}
                    className="text-[11px] font-mono text-[#cbd5e1] bg-[#1e2230] hover:bg-[#5645d4] hover:text-white px-2 py-1 rounded cursor-pointer transition-colors border border-[#2d3748] flex items-center gap-1"
                    title="Click to copy single keyword"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></span>
                    <span>{kw}</span>
                    {copiedChip === kw && <Check className="w-2.5 h-2.5 text-[#4ade80]" />}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* WAY 2: Individual Code Block for Every Keyword */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1a1a1a] flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-[#0a1530] text-white text-xs flex items-center justify-center font-mono">
                    2
                  </span>
                  <span>Way 2 — Individual Keyword Code Blocks</span>
                </h3>
                <p className="text-xs text-[#787671] mt-0.5">
                  Har keyword ko apna dedicated code block mila hai with instant 1-click copy.
                </p>
              </div>

              <span className="text-xs font-mono text-[#787671] hidden sm:inline">
                {result.items.length} Blocks
              </span>
            </div>

            {/* Grid of Individual Keyword Code Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {result.items.map((keyword, index) => {
                const isCopied = copiedIndex === index;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-[#e5e3df] hover:border-[#5645d4]/50 shadow-2xs hover:shadow-xs transition-all overflow-hidden flex flex-col justify-between group"
                  >
                    <div className="px-3 py-1.5 bg-[#fafaf9] border-b border-[#f0eee9] flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 font-mono text-[#787671]">
                        <Hash className="w-3 h-3 text-[#5645d4]" />
                        <span>{String(index + 1).padStart(2, '0')}</span>
                      </div>
                      <span className="text-[10px] text-[#a4a097] font-mono">
                        {keyword.length} chars
                      </span>
                    </div>

                    <div className="p-3 bg-[#181a20] m-2 rounded-lg border border-[#27272a] flex items-center justify-between gap-2">
                      <code className="text-xs font-mono text-[#e2e8f0] select-all truncate">
                        {keyword}
                      </code>

                      <button
                        onClick={() => copyToClipboard(keyword, index)}
                        className={`p-1.5 rounded transition-all cursor-pointer shrink-0 ${
                          isCopied
                            ? 'bg-[#1aae39] text-white'
                            : 'bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] hover:text-white'
                        }`}
                        title="Copy this keyword"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="px-3 py-1 bg-white text-[10px] text-[#787671] flex items-center justify-between border-t border-[#f6f5f4]">
                      <span className="capitalize">{keyword.split(' ').length} words</span>
                      {isCopied && (
                        <span className="text-[#1aae39] font-medium font-mono text-[10px]">
                          Copied!
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
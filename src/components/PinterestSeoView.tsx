import React, { useState } from 'react';
import type { KeywordItem, PinterestSeoResult } from '../types/seo';
import { ImageDropzone } from './ImageDropzone';
import { generatePinterestSeo } from '../services/seoService';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Copy,
  Check,
  Pin,
  Tag,
  Share2,
  Sliders,
  Bookmark,
  MessageSquare,
  Flame,
  Layers,
} from 'lucide-react';

interface PinterestSeoViewProps {
  pinterestKeywords: KeywordItem[];
  onOpenKeywords: () => void;
}

export const PinterestSeoView: React.FC<PinterestSeoViewProps> = ({
  pinterestKeywords,
  onOpenKeywords,
}) => {
  const [prompt, setPrompt] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult] = useState<PinterestSeoResult | null>(null);

  // Copy feedback states
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const pinnedKeywords = pinterestKeywords.filter((k) => k.active && k.isPinned).map((k) => k.text);
  const activeKeywords = pinterestKeywords.filter((k) => k.active).map((k) => k.text);

  const handleGenerate = async () => {
    if (!prompt.trim() && !imagePreview) {
      alert('Please enter a prompt/topic or upload an artwork image.');
      return;
    }

    setIsGenerating(true);
    setProgressStep(1);
    setStatusMessage('Initiating neural image & prompt analysis...');

    try {
      const seoOutput = await generatePinterestSeo(
        {
          category: 'pinterest',
          prompt: prompt.trim() || 'Aesthetic digital visual artwork with cinematic lighting',
          imageDataUrl: imagePreview || undefined,
          imageFileName: imageFileName || undefined,
          activeKeywords,
          pinnedKeywords,
        },
        (step, msg) => {
          setProgressStep(step);
          setStatusMessage(msg);
        }
      );

      setResult(seoOutput);

      // Trigger celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#e60023', '#5645d4', '#ff64c8', '#f5d75e'],
      });
    } catch (err) {
      console.error(err);
      alert('Generation encountered an issue. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2200);
  };

  const copyAll = () => {
    if (!result) return;
    const fullText = `📌 PINTEREST SEO TITLE:\n${result.title}\n\n📝 PINTEREST DESCRIPTION:\n${result.description}\n\n🏷️ PINTEREST TAGS:\n${result.tags.join(' ')}`;
    copyToClipboard(fullText, 'all');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Generator Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Input Card */}
          <div className="bg-white rounded-xl border border-[#e5e3df] p-4 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#ede9e4] mb-4 sm:mb-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#e60023] text-white flex items-center justify-center shrink-0">
                  <Pin className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1a1a1a]">Pinterest Pin Creator</h3>
                  <p className="text-[11px] text-[#787671]">Step 1: Upload visual & describe prompt</p>
                </div>
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-[#e60023] bg-[#fde0ec] px-2 py-0.5 rounded-full">
                Pinterest Engine
              </span>
            </div>

            {/* Image Upload Dropzone */}
            <div className="mb-4 sm:mb-5">
              <label className="block text-xs font-semibold text-[#37352f] mb-1.5 sm:mb-2">
                Pin Artwork / Reference Image
              </label>
              <ImageDropzone
                imagePreview={imagePreview}
                onImageSelected={(dataUrl, name) => {
                  setImagePreview(dataUrl);
                  setImageFileName(name);
                }}
                onImageRemoved={() => {
                  setImagePreview(null);
                  setImageFileName('');
                }}
                isScanning={isGenerating}
              />
            </div>

            {/* Prompt / Topic Text Area */}
            <div className="mb-4 sm:mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#37352f]">
                  Prompt / Visual Topic Description
                </label>
                <span className="text-[10px] text-[#787671]">
                  {prompt.length} chars
                </span>
              </div>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A futuristic neon cyberpunk ramen shop in rainy Tokyo, cinematic volumetric lighting, retro anime aesthetic..."
                className="w-full p-3 text-sm sm:text-xs bg-[#fafaf9] border border-[#c8c4be] rounded-md focus:outline-none focus:border-[#5645d4] focus:bg-white text-[#1a1a1a] transition-all resize-y"
              />
            </div>

            {/* Injected Pinterest Keywords Section */}
            <div className="mb-5 p-3 sm:p-3.5 bg-[#f6f5f4] rounded-lg border border-[#ede9e4]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#1a1a1a] flex items-center gap-1.5 truncate">
                  <Tag className="w-3.5 h-3.5 text-[#e60023] shrink-0" />
                  <span className="truncate">Keywords ({activeKeywords.length} active • 📌 {pinnedKeywords.length} pinned)</span>
                </span>
                <button
                  type="button"
                  onClick={onOpenKeywords}
                  className="text-[11px] font-semibold text-[#5645d4] hover:underline flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Configure</span>
                </button>
              </div>

              {activeKeywords.length === 0 ? (
                <div className="text-[11px] text-[#787671] italic">
                  No active keywords selected. Tap 'Configure' to select Pinterest SEO keywords.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {pinnedKeywords.map((kw, i) => (
                    <span
                      key={`pin-${i}`}
                      className="text-[11px] font-semibold bg-[#fef3c7] border border-[#f59e0b] text-[#92400e] px-2 py-0.5 rounded shadow-2xs flex items-center gap-1"
                      title="📌 Pinned: Mandatory in Pinterest description"
                    >
                      <span>📌</span>
                      <span>{kw}</span>
                    </span>
                  ))}
                  {activeKeywords
                    .filter((kw) => !pinnedKeywords.includes(kw))
                    .map((kw, i) => (
                      <span
                        key={`act-${i}`}
                        className="text-[11px] font-medium bg-white border border-[#e5e3df] text-[#37352f] px-2 py-0.5 rounded shadow-2xs"
                      >
                        {kw}
                      </span>
                    ))}
                </div>
              )}
              <p className="text-[10px] text-[#787671] mt-2">
                📌 Pinned keywords will strictly be woven into the pin description. Other active terms are matched contextually.
              </p>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-3 sm:py-3.5 px-4 rounded-md text-white text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isGenerating
                  ? 'bg-[#5645d4]/70 cursor-not-allowed'
                  : 'bg-[#5645d4] hover:bg-[#4534b3] hover:shadow-lg active:scale-[0.99]'
              }`}
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Generating Pinterest SEO...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#f5d75e]" />
                  <span>Generate Pinterest SEO</span>
                </>
              )}
            </button>
          </div>

          {/* Progress Scan Box */}
          {isGenerating && (
            <div className="bg-[#fafaf9] border border-[#e6e0f5] p-3.5 sm:p-4 rounded-xl shadow-xs animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-[#5645d4] mb-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#5645d4] animate-ping"></span>
                  <span>Neural Scan Phase {progressStep} of 4</span>
                </span>
                <span>{progressStep * 25}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#e5e3df] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-[#5645d4] to-[#ff64c8] transition-all duration-500 rounded-full"
                  style={{ width: `${progressStep * 25}%` }}
                ></div>
              </div>
              <p className="text-xs text-[#5d5b54] font-medium">{statusMessage}</p>
            </div>
          )}
        </div>

        {/* Right Column: Output & Live Pin Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-5 sm:space-y-6">
          {!result && !isGenerating ? (
            /* Empty State */
            <div className="bg-white rounded-xl border border-[#e5e3df] p-8 sm:p-12 text-center shadow-xs">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-[#fde0ec] text-[#e60023] flex items-center justify-center shadow-sm">
                <Pin className="w-7 h-7 sm:w-8 sm:h-8 fill-[#e60023]" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-[#1a1a1a] mb-1">
                Pinterest SEO Studio Ready
              </h3>
              <p className="text-xs text-[#787671] max-w-md mx-auto mb-5 leading-relaxed">
                Provide your prompt and artwork on the left. The engine will scan your visual composition, match it with your Pinterest keywords, and generate a viral Title, Description, and Tags with a live Pin preview.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f6f5f4] text-[11px] sm:text-xs text-[#5d5b54] border border-[#ede9e4]">
                <Layers className="w-3.5 h-3.5 text-[#5645d4]" />
                <span>High-CTR Algorithms & Dynamic Tag Matching</span>
              </div>
            </div>
          ) : result ? (
            /* Generated Results */
            <div className="space-y-5 sm:space-y-6 animate-in fade-in">
              {/* Action Bar */}
              <div className="flex items-center justify-between bg-white p-3 sm:p-3.5 rounded-xl border border-[#e5e3df] shadow-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1aae39] shrink-0"></span>
                  <span className="text-xs font-semibold text-[#1a1a1a] truncate">
                    Pinterest SEO Generated
                  </span>
                </div>
                <button
                  onClick={copyAll}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#0a1530] hover:bg-[#1a2a52] text-white text-xs font-medium rounded-md shadow-xs transition-all cursor-pointer shrink-0 ml-2"
                >
                  {copiedField === 'all' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#1aae39]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#ff64c8]" />
                      <span>Copy All</span>
                    </>
                  )}
                </button>
              </div>

              {/* 1. SEO Title Card */}
              <div className="bg-white rounded-xl border border-[#e5e3df] p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#787671] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#5645d4]" />
                    <span>SEO Pin Title</span>
                  </span>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-[10px] sm:text-[11px] text-[#787671] font-mono">
                      {result.characterCounts.title} chars
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.title, 'title')}
                      className="p-1.5 hover:bg-[#f6f5f4] rounded text-[#5d5b54] hover:text-[#5645d4] transition-colors cursor-pointer"
                      title="Copy Title"
                    >
                      {copiedField === 'title' ? (
                        <Check className="w-4 h-4 text-[#1aae39]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#1a1a1a] bg-[#fafaf9] p-3 rounded-lg border border-[#ede9e4] select-all leading-snug">
                  {result.title}
                </p>
              </div>

              {/* 2. SEO Description Card */}
              <div className="bg-white rounded-xl border border-[#e5e3df] p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#787671] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#e60023]" />
                    <span>SEO Pin Description</span>
                  </span>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-[10px] sm:text-[11px] text-[#787671] font-mono">
                      {result.characterCounts.description} chars
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.description, 'description')}
                      className="p-1.5 hover:bg-[#f6f5f4] rounded text-[#5d5b54] hover:text-[#5645d4] transition-colors cursor-pointer"
                      title="Copy Description"
                    >
                      {copiedField === 'description' ? (
                        <Check className="w-4 h-4 text-[#1aae39]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#37352f] bg-[#fafaf9] p-3 rounded-lg border border-[#ede9e4] leading-relaxed select-all">
                  {result.description}
                </p>

                {/* Keywords Matched Pill List */}
                {result.keywordsMatched.length > 0 && (
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-[#787671] font-semibold">
                      Injected:
                    </span>
                    {result.keywordsMatched.map((kw, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#d9f3e1] text-[#1aae39] font-medium"
                      >
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. SEO Tags & Hashtags Card */}
              <div className="bg-white rounded-xl border border-[#e5e3df] p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#787671] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-[#dd5b00]" />
                    <span>Pinterest Tags ({result.tags.length})</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(result.tags.join(' '), 'tags')}
                    className="flex items-center gap-1 text-xs text-[#5645d4] hover:underline font-medium cursor-pointer"
                  >
                    {copiedField === 'tags' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#1aae39]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy All Tags</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 bg-[#fafaf9] p-2.5 sm:p-3 rounded-lg border border-[#ede9e4]">
                  {result.tags.map((tag, i) => (
                    <span
                      key={i}
                      onClick={() => copyToClipboard(tag, `tag-${i}`)}
                      className="text-xs font-medium text-[#5645d4] bg-[#e6e0f5]/60 hover:bg-[#e6e0f5] px-2 py-1 rounded cursor-pointer transition-colors"
                      title="Click to copy single tag"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 4. Live Pinterest Feed Pin Mockup */}
              <div className="bg-[#fafaf9] rounded-xl border border-[#e5e3df] p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a] flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5 text-[#e60023] fill-[#e60023]" />
                    <span>Live Pinterest Feed Mockup</span>
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-[#787671]">Feed simulation</span>
                </div>

                {/* Pin Card Simulation - Scales on Mobile */}
                <div className="w-full max-w-[270px] sm:max-w-xs mx-auto bg-white rounded-2xl overflow-hidden shadow-lg border border-[#e5e3df]">
                  {/* Pin Image */}
                  <div className="relative aspect-[3/4] bg-[#f6f5f4] overflow-hidden group">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Pin preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-tr from-[#ffe8d4] to-[#fde0ec]">
                        <Pin className="w-8 h-8 text-[#e60023] mb-2" />
                        <span className="text-xs font-semibold text-[#1a1a1a]">
                          Artwork Visual
                        </span>
                      </div>
                    )}
                    {/* Hover Pin Action */}
                    <div className="absolute top-2.5 right-2.5">
                      <div className="px-3 py-1 bg-[#e60023] text-white text-xs font-bold rounded-full shadow-md">
                        Save
                      </div>
                    </div>
                  </div>

                  {/* Pin Metadata Info */}
                  <div className="p-3 text-left">
                    <h4 className="font-semibold text-xs text-[#1a1a1a] line-clamp-2 mb-1 leading-snug">
                      {result.title}
                    </h4>
                    <p className="text-[11px] text-[#787671] line-clamp-2 sm:line-clamp-3 leading-relaxed mb-2">
                      {result.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#f6f5f4]">
                      <div className="flex items-center gap-1.5">
                        <img
                          src="/apple-touch-icon.png"
                          alt="Arigato Labs"
                          className="w-5 h-5 rounded-full object-contain shadow-2xs border border-[#e5e3df]"
                        />
                        <span className="text-[11px] font-medium text-[#37352f]">
                          Arigato Labs
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[#787671]">
                        <Share2 className="w-3.5 h-3.5" />
                        <Bookmark className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

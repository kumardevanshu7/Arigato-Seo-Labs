import React, { useState } from 'react';
import type { KeywordItem, ArigatoSiteSeoResult } from '../types/seo';
import { ImageDropzone } from './ImageDropzone';
import { generateArigatoSiteSeo } from '../services/seoService';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Copy,
  Check,
  Globe,
  Sliders,
  ShieldCheck,
  Search,
  CheckCircle2,
  Tag,
  Code2,
  Terminal,
} from 'lucide-react';

interface ArigatoSiteSeoViewProps {
  siteKeywords: KeywordItem[];
  onOpenKeywords: () => void;
}

export const ArigatoSiteSeoView: React.FC<ArigatoSiteSeoViewProps> = ({
  siteKeywords,
  onOpenKeywords,
}) => {
  const [prompt, setPrompt] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult] = useState<ArigatoSiteSeoResult | null>(null);

  // Copy feedback state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const pinnedKeywords = siteKeywords.filter((k) => k.active && k.isPinned).map((k) => k.text);
  const activeKeywords = siteKeywords.filter((k) => k.active).map((k) => k.text);

  const handleGenerate = async () => {
    if (!prompt.trim() && !imagePreview) {
      alert('Please enter a prompt or upload an artwork image.');
      return;
    }

    setIsGenerating(true);
    setProgressStep(1);
    setStatusMessage('Scanning prompt parameters and aesthetic composition...');

    try {
      const output = await generateArigatoSiteSeo(
        {
          category: 'site',
          prompt: prompt.trim() || 'A high-impact visual artwork with dramatic composition and cinematic lighting',
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

      setResult(output);

      // Trigger celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#5645d4', '#2a9d99', '#ff64c8', '#f5d75e'],
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
    const fullText = `🌐 ARIGATO SITE SEO PACKAGE\n\n📌 ABOUT THIS PROMPT (${result.wordCount} words):\n${result.aboutPrompt}\n\n🔍 SEO META DESCRIPTION (${result.charCount} chars):\n${result.seoDescription}\n\n🏷️ SEO KEYWORDS (${result.keywords.length} items):\n${result.keywords.join(', ')}`;
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
                <div className="w-7 h-7 rounded-md bg-[#5645d4] text-white flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1a1a1a]">Arigato Site SEO Studio</h3>
                  <p className="text-[11px] text-[#787671]">Step 1: Upload artwork & enter prompt</p>
                </div>
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-[#5645d4] bg-[#e6e0f5] px-2 py-0.5 rounded-full">
                SERP Optimizer
              </span>
            </div>

            {/* Strict Limits Indicators - Mobile Optimized */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4 sm:mb-5">
              <div className="p-2 sm:p-2.5 rounded-lg bg-[#fafaf9] border border-[#ede9e4] text-center">
                <span className="text-[9px] sm:text-[10px] text-[#787671] block font-medium leading-tight">About Prompt</span>
                <span className="text-[11px] sm:text-xs font-bold text-[#5645d4]">&lt; 199 Words</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-lg bg-[#fafaf9] border border-[#ede9e4] text-center">
                <span className="text-[9px] sm:text-[10px] text-[#787671] block font-medium leading-tight">Meta Desc</span>
                <span className="text-[11px] sm:text-xs font-bold text-[#1aae39]">&lt; 160 Chars</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-lg bg-[#fafaf9] border border-[#ede9e4] text-center">
                <span className="text-[9px] sm:text-[10px] text-[#787671] block font-medium leading-tight">Keywords</span>
                <span className="text-[11px] sm:text-xs font-bold text-[#dd5b00]">6 to 9 Tags</span>
              </div>
            </div>

            {/* Image Upload Dropzone */}
            <div className="mb-4 sm:mb-5">
              <label className="block text-xs font-semibold text-[#37352f] mb-1.5 sm:mb-2">
                Artwork / Reference Asset Image
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

            {/* Prompt Text Area */}
            <div className="mb-4 sm:mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#37352f]">
                  Prompt Text & Creative Details
                </label>
                <span className="text-[10px] text-[#787671]">
                  {prompt.length} chars
                </span>
              </div>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A hyper-detailed isometric render of an ethereal glass greenhouse floating in clouds, lush tropical flora, golden hour ray tracing..."
                className="w-full p-3 text-sm sm:text-xs bg-[#fafaf9] border border-[#c8c4be] rounded-md focus:outline-none focus:border-[#5645d4] focus:bg-white text-[#1a1a1a] transition-all resize-y"
              />
            </div>

            {/* Injected Site Keywords Section */}
            <div className="mb-5 p-3 sm:p-3.5 bg-[#f6f5f4] rounded-lg border border-[#ede9e4]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#1a1a1a] flex items-center gap-1.5 truncate">
                  <Tag className="w-3.5 h-3.5 text-[#5645d4] shrink-0" />
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
                  No active keywords selected. Tap 'Configure' to select Site SEO keywords.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {pinnedKeywords.map((kw, i) => (
                    <span
                      key={`pin-${i}`}
                      className="text-[11px] font-semibold bg-[#fef3c7] border border-[#f59e0b] text-[#92400e] px-2 py-0.5 rounded shadow-2xs flex items-center gap-1"
                      title="📌 Pinned: Mandatory in SEO description"
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
                📌 Pinned keywords are forced into the description. System balances other active terms for &lt;199 words &amp; &lt;160 chars.
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
                  <span>Generating Site SEO Package...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#f5d75e]" />
                  <span>Generate Arigato Site SEO</span>
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
                  <span>SERP Engine Phase {progressStep} of 4</span>
                </span>
                <span>{progressStep * 25}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#e5e3df] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-[#5645d4] via-[#2a9d99] to-[#ff64c8] transition-all duration-500 rounded-full"
                  style={{ width: `${progressStep * 25}%` }}
                ></div>
              </div>
              <p className="text-xs text-[#5d5b54] font-medium">{statusMessage}</p>
            </div>
          )}
        </div>

        {/* Right Column: Output & SERP Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-5 sm:space-y-6">
          {!result && !isGenerating ? (
            /* Empty State */
            <div className="bg-white rounded-xl border border-[#e5e3df] p-8 sm:p-12 text-center shadow-xs">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-[#e6e0f5] text-[#5645d4] flex items-center justify-center shadow-sm">
                <Globe className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-[#1a1a1a] mb-1">
                Arigato Site SEO Generator Ready
              </h3>
              <p className="text-xs text-[#787671] max-w-md mx-auto mb-5 leading-relaxed">
                Provide your prompt and optional artwork on the left. The engine will generate 3 dedicated code blocks: "About this prompt" (&lt; 199 words), Google Meta description (&lt; 160 chars), and 6 to 9 search keywords.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f6f5f4] text-[11px] sm:text-xs text-[#5d5b54] border border-[#ede9e4]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1aae39]" />
                <span>Strict Length Audits &amp; 3 Code Blocks with 1-Click Copy</span>
              </div>
            </div>
          ) : result ? (
            /* Generated Results */
            <div className="space-y-5 sm:space-y-6 animate-in fade-in">
              {/* Top Banner & Copy All */}
              <div className="flex items-center justify-between bg-white p-3 sm:p-3.5 rounded-xl border border-[#e5e3df] shadow-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1aae39] shrink-0"></span>
                  <span className="text-xs font-semibold text-[#1a1a1a] truncate">
                    Site SEO Generated (3 Code Blocks)
                  </span>
                </div>
                <button
                  onClick={copyAll}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#0a1530] hover:bg-[#1a2a52] text-white text-xs font-medium rounded-md shadow-xs transition-all cursor-pointer shrink-0 ml-2"
                >
                  {copiedField === 'all' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#1aae39]" />
                      <span>Copied All!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#d6b6f6]" />
                      <span>Copy All</span>
                    </>
                  )}
                </button>
              </div>

              {/* 1. CODE BLOCK: "About this prompt" (Strictly <= 199 words) */}
              <div className="rounded-xl border border-[#27272a] overflow-hidden shadow-md bg-[#0f1117]">
                {/* Code Block Header */}
                <div className="bg-[#18181b] px-3.5 sm:px-4 py-2.5 border-b border-[#27272a] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 mr-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/80"></span>
                    </div>
                    <Terminal className="w-3.5 h-3.5 text-[#5645d4]" />
                    <span className="font-mono text-xs font-semibold text-white tracking-wide">
                      about-this-prompt.md
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Word limit compliance badge */}
                    <span
                      className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        result.wordCount <= 199
                          ? 'bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{result.wordCount} / 199 words</span>
                    </span>

                    {/* Copy Button */}
                    <button
                      onClick={() => copyToClipboard(result.aboutPrompt, 'aboutPrompt')}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-mono transition-all cursor-pointer border border-[#3f3f46]"
                      title="Copy About This Prompt"
                    >
                      {copiedField === 'aboutPrompt' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#4ade80]" />
                          <span className="text-[#4ade80]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#a1a1aa]" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Code Block Content */}
                <div className="p-4 text-xs font-mono leading-relaxed text-[#e2e8f0] whitespace-pre-wrap select-all selection:bg-[#5645d4] selection:text-white">
                  {result.aboutPrompt}
                </div>
              </div>

              {/* 2. CODE BLOCK: "SEO Meta Description" (Strictly <= 160 characters) */}
              <div className="rounded-xl border border-[#27272a] overflow-hidden shadow-md bg-[#0f1117]">
                {/* Code Block Header */}
                <div className="bg-[#18181b] px-3.5 sm:px-4 py-2.5 border-b border-[#27272a] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 mr-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/80"></span>
                    </div>
                    <Code2 className="w-3.5 h-3.5 text-[#22c55e]" />
                    <span className="font-mono text-xs font-semibold text-white tracking-wide">
                      seo-meta-description.txt
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Char limit compliance badge */}
                    <span
                      className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        result.charCount <= 160
                          ? 'bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{result.charCount} / 160 chars</span>
                    </span>

                    {/* Copy Button */}
                    <button
                      onClick={() => copyToClipboard(result.seoDescription, 'seoDesc')}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-mono transition-all cursor-pointer border border-[#3f3f46]"
                      title="Copy SEO Meta Description"
                    >
                      {copiedField === 'seoDesc' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#4ade80]" />
                          <span className="text-[#4ade80]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#a1a1aa]" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Code Block Content */}
                <div className="p-4 text-xs font-mono leading-relaxed text-[#e2e8f0] select-all selection:bg-[#5645d4] selection:text-white">
                  {result.seoDescription}
                </div>
              </div>

              {/* 3. CODE BLOCK: "SEO Keywords" (Strictly 6 to 9 keywords) */}
              <div className="rounded-xl border border-[#27272a] overflow-hidden shadow-md bg-[#0f1117]">
                {/* Code Block Header */}
                <div className="bg-[#18181b] px-3.5 sm:px-4 py-2.5 border-b border-[#27272a] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 mr-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/80"></span>
                    </div>
                    <Tag className="w-3.5 h-3.5 text-[#f59e0b]" />
                    <span className="font-mono text-xs font-semibold text-white tracking-wide">
                      seo-keywords.csv
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Count verification badge */}
                    <span
                      className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        result.keywords.length >= 6 && result.keywords.length <= 9
                          ? 'bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{result.keywords.length} tags (Rule: 6–9)</span>
                    </span>

                    {/* Copy Button */}
                    <button
                      onClick={() => copyToClipboard(result.keywords.join(', '), 'keywords')}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-mono transition-all cursor-pointer border border-[#3f3f46]"
                      title="Copy all keywords"
                    >
                      {copiedField === 'keywords' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#4ade80]" />
                          <span className="text-[#4ade80]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#a1a1aa]" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Code Block Content */}
                <div className="p-4 text-xs font-mono leading-relaxed text-[#e2e8f0] select-all selection:bg-[#5645d4] selection:text-white">
                  {result.keywords.join(', ')}
                </div>

                {/* Interactive Click-to-Copy Chips */}
                <div className="p-3 bg-[#13151d] border-t border-[#27272a] flex flex-wrap gap-1.5">
                  {result.keywords.map((kw, i) => (
                    <span
                      key={i}
                      onClick={() => copyToClipboard(kw, `kw-${i}`)}
                      className="text-[11px] font-mono text-[#cbd5e1] bg-[#1e2230] hover:bg-[#5645d4] hover:text-white px-2 py-1 rounded cursor-pointer transition-colors border border-[#2d3748] flex items-center gap-1"
                      title="Click to copy single keyword"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></span>
                      <span>{kw}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* 4. Live Google SERP Snippet Preview Mockup */}
              <div className="bg-[#fafaf9] rounded-xl border border-[#e5e3df] p-4 sm:p-5 shadow-xs text-left">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a] flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-[#4285F4]" />
                    <span>Live Google Search Snippet</span>
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-[#787671]">SERP simulation</span>
                </div>

                {/* Google Result Box */}
                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#e5e3df] shadow-xs max-w-2xl">
                  {/* Google Breadcrumb */}
                  <div className="flex items-center gap-2 mb-1 truncate">
                    <img
                      src="/favicon-32x32.png"
                      alt="favicon"
                      className="w-4 h-4 rounded-full object-contain shrink-0 border border-[#e5e3df]"
                    />
                    <span className="text-xs text-[#202124] font-medium shrink-0">Arigato Labs</span>
                    <span className="text-xs text-[#5f6368] truncate">https://arigatolabs.com › prompts</span>
                  </div>

                  {/* Google Title */}
                  <h4 className="text-sm sm:text-base text-[#1a0dab] hover:underline font-normal cursor-pointer leading-snug mb-1">
                    {result.siteMetaTitle || 'Curated Aesthetic Prompt Asset | Arigato Labs'}
                  </h4>

                  {/* Google Snippet (160 char meta desc) */}
                  <p className="text-xs text-[#4d5156] leading-relaxed">
                    {result.seoDescription}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

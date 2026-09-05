import React from 'react';
import type { SeoCategory } from '../types/seo';
import { Sparkles, Pin, Globe, ArrowDown, CheckCircle2, ShieldCheck, Zap, FileText } from 'lucide-react';

interface HeroBannerProps {
  activeCategory: SeoCategory;
  onScrollToStudio: () => void;
  onOpenKeywords: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  activeCategory,
  onScrollToStudio,
  onOpenKeywords,
}) => {
  const isPinterest = activeCategory === 'pinterest';

  return (
    <section className="relative overflow-hidden bg-[#0a1530] text-white pt-8 pb-12 sm:pt-16 sm:pb-20 px-3 sm:px-6 lg:px-8 border-b border-[#1a2a52]">
      {/* Notion Atmospheric Decorative Elements: Sticky-note dots & wire meshes */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-40 overflow-hidden">
        {/* Colorful sticky dots */}
        <div className="absolute top-6 left-[8%] w-3 h-3 rounded-full bg-[#f5d75e] shadow-[0_0_12px_#f5d75e]"></div>
        <div className="absolute top-20 left-[22%] w-2 h-2 rounded-full bg-[#ff64c8] shadow-[0_0_10px_#ff64c8]"></div>
        <div className="absolute top-10 right-[10%] w-3.5 h-3.5 rounded-full bg-[#2a9d99] shadow-[0_0_12px_#2a9d99]"></div>
        <div className="absolute bottom-10 right-[15%] w-2.5 h-2.5 rounded-full bg-[#1aae39]"></div>

        {/* Ambient glow patches */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] sm:w-[700px] h-[300px] bg-[#5645d4]/25 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-16 w-[300px] h-[300px] bg-[#2a9d99]/15 rounded-full blur-3xl"></div>

        {/* Geometric wireframe dot grid */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #5645d4 1px, transparent 0)`,
            backgroundSize: '36px 36px',
          }}
        ></div>
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Mode Indicator Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a2a52] border border-[#2a3c6e] text-[11px] sm:text-xs font-semibold text-white mb-4 sm:mb-6 shadow-sm">
          {activeCategory === 'pinterest' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#e60023] animate-ping shrink-0"></span>
              <Pin className="w-3 h-3 text-[#ff64c8] shrink-0" />
              <span className="tracking-wide">PINTEREST ALGORITHM ENGINE</span>
            </>
          ) : activeCategory === 'site' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#5645d4] animate-ping shrink-0"></span>
              <Globe className="w-3 h-3 text-[#d6b6f6] shrink-0" />
              <span className="tracking-wide">ARIGATO SITE SERP OPTIMIZER</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-[#2a9d99] animate-ping shrink-0"></span>
              <FileText className="w-3 h-3 text-[#2a9d99] shrink-0" />
              <span className="tracking-wide">MULTI-IMAGE TEXT & KEYWORD EXTRACTOR</span>
            </>
          )}
        </div>

        {/* Hero Display Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-7xl tracking-tight text-white mb-4 sm:mb-6 font-semibold leading-[1.08]">
          {activeCategory === 'pinterest' ? (
            <>
              Scan visual pins. <br />
              <span className="bg-gradient-to-r from-[#ff64c8] via-[#f5d75e] to-[#7b3ff2] bg-clip-text text-transparent">
                Command search rankings.
              </span>
            </>
          ) : activeCategory === 'site' ? (
            <>
              Engineered prompt SEO. <br />
              <span className="bg-gradient-to-r from-[#d6b6f6] via-[#2a9d99] to-[#f5d75e] bg-clip-text text-transparent">
                Rank on page one of Google.
              </span>
            </>
          ) : (
            <>
              Drop multiple pictures. <br />
              <span className="bg-gradient-to-r from-[#2a9d99] via-[#4ade80] to-[#f5d75e] bg-clip-text text-transparent">
                Extract keywords in 2 ways.
              </span>
            </>
          )}
        </h1>

        {/* Hero Subtitle */}
        <p className="text-xs sm:text-base text-[#a4a097] max-w-2xl mx-auto mb-6 sm:mb-8 font-normal leading-relaxed px-2">
          {activeCategory === 'pinterest'
            ? 'Feed your image and art prompt. Our neural scanner analyzes visual aesthetics and injects your custom Pinterest SEO keywords into click-worthy titles, descriptions, and viral tags.'
            : activeCategory === 'site'
            ? 'Generate strict SEO metadata for your prompt store: "About this prompt" strictly under 199 words, Google Meta Description under 160 characters, and exactly 6 to 9 targeted search keywords.'
            : 'Upload 1 to 5+ pictures or screenshots to automatically extract all keywords and prompts. Formatted in a unified comma-separated block and individual 1-click copy blocks.'}
        </p>

        {/* Action Buttons - Full-width on mobile for easy tapping */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3.5 mb-8 sm:mb-12 max-w-sm sm:max-w-none mx-auto">
          <button
            onClick={onScrollToStudio}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#5645d4] hover:bg-[#4534b3] text-white text-xs sm:text-sm font-semibold rounded-md shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#f5d75e]" />
            <span>Launch Generator Studio</span>
            <ArrowDown className="w-3.5 h-3.5 text-white/80" />
          </button>

          <button
            onClick={onOpenKeywords}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-medium border border-[#a4a097]/30 rounded-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>Keywords Repository</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-semibold">Settings</span>
          </button>
        </div>

        {/* Feature Pills Strip (2x2 on mobile, 4-col on desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 max-w-4xl mx-auto text-left">
          <div className="bg-[#1a2a52]/60 backdrop-blur-sm border border-[#2a3c6e] p-2.5 sm:p-3 rounded-lg flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#f5d75e] shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] sm:text-xs font-semibold text-white leading-tight">Vision & Prompt Scan</div>
              <div className="text-[10px] text-[#a4a097] leading-tight mt-0.5">Scans composition</div>
            </div>
          </div>

          <div className="bg-[#1a2a52]/60 backdrop-blur-sm border border-[#2a3c6e] p-2.5 sm:p-3 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2a9d99] shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] sm:text-xs font-semibold text-white leading-tight">
                {isPinterest ? 'Pinterest Keywords' : 'Target Keywords'}
              </div>
              <div className="text-[10px] text-[#a4a097] leading-tight mt-0.5">Seamless injection</div>
            </div>
          </div>

          <div className="bg-[#1a2a52]/60 backdrop-blur-sm border border-[#2a3c6e] p-2.5 sm:p-3 rounded-lg flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ff64c8] shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] sm:text-xs font-semibold text-white leading-tight">Strict Limits</div>
              <div className="text-[10px] text-[#a4a097] leading-tight mt-0.5">&lt;199w & &lt;160c</div>
            </div>
          </div>

          <div className="bg-[#1a2a52]/60 backdrop-blur-sm border border-[#2a3c6e] p-2.5 sm:p-3 rounded-lg flex items-start gap-2">
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d6b6f6] shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] sm:text-xs font-semibold text-white leading-tight">Live Previews</div>
              <div className="text-[10px] text-[#a4a097] leading-tight mt-0.5">
                {isPinterest ? 'Pinterest Mockup' : 'Google SERP'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

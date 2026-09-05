import React from 'react';
import type { SeoCategory } from '../types/seo';
import { Sliders, KeyRound, Globe, Pin } from 'lucide-react';

interface HeaderProps {
  activeCategory: SeoCategory;
  onSelectCategory: (cat: SeoCategory) => void;
  onOpenKeywords: () => void;
  onOpenApiModal: () => void;
  onOpenExplore: () => void;
  pinterestKwCount: number;
  siteKwCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeCategory,
  onSelectCategory,
  onOpenKeywords,
  onOpenApiModal,
  onOpenExplore,
  pinterestKwCount,
  siteKwCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#ffffff]/95 backdrop-blur-md border-b border-[#e5e3df]">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Left: Brand Logo & Wordmark (User's Blue Icon) */}
        <button
          onClick={onOpenExplore}
          className="flex items-center gap-2 sm:gap-3 shrink-0 text-left hover:opacity-90 transition-opacity cursor-pointer"
          title="Explore Arigato Labs"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white flex items-center justify-center p-0.5 shadow-xs border border-[#e5e3df] overflow-hidden">
            <img
              src="/apple-touch-icon.png"
              alt="Arigato SEO Labs"
              className="w-full h-full object-contain rounded-md"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-semibold text-sm sm:text-base tracking-tight text-[#1a1a1a]">
                Arigato<span className="hidden xs:inline"> Labs</span>
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#e6e0f5] text-[#391c57] tracking-wide">
                SEO
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-[#787671] hidden md:inline">
              Prompt & Visual Indexing Suite
            </span>
          </div>
        </button>

        {/* Desktop Center Pill Switcher (hidden on mobile, shown on sm+) */}
        <nav className="hidden sm:flex items-center bg-[#f6f5f4] p-1 rounded-full border border-[#e5e3df] shadow-inner">
          <button
            onClick={() => onSelectCategory('pinterest')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeCategory === 'pinterest'
                ? 'bg-[#e60023] text-white shadow-sm'
                : 'text-[#5d5b54] hover:text-[#1a1a1a] hover:bg-white/60'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${activeCategory === 'pinterest' ? 'fill-white' : ''}`} />
            <span>Pinterest SEO</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeCategory === 'pinterest' ? 'bg-white/20 text-white' : 'bg-[#e5e3df] text-[#5d5b54]'
              }`}
            >
              {pinterestKwCount}
            </span>
          </button>

          <button
            onClick={() => onSelectCategory('site')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeCategory === 'site'
                ? 'bg-[#5645d4] text-white shadow-sm'
                : 'text-[#5d5b54] hover:text-[#1a1a1a] hover:bg-white/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Arigato Site SEO</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeCategory === 'site' ? 'bg-white/20 text-white' : 'bg-[#e5e3df] text-[#5d5b54]'
              }`}
            >
              {siteKwCount}
            </span>
          </button>
        </nav>

        {/* Right Tools: Explore, Keywords & API Connect */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Explore Arigato Labs Button */}
          <button
            onClick={onOpenExplore}
            title="Explore Arigato Labs"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[#1a1a1a] bg-[#fafaf9] hover:bg-[#f6f5f4] border border-[#c8c4be] rounded-md transition-colors cursor-pointer"
          >
            <img
              src="/arigato-single-logo.png"
              alt="Arigato Labs"
              className="w-[17px] h-[17px] object-contain"
            />
            <span className="hidden md:inline">Explore Arigato Labs</span>
          </button>

          {/* Keyword Settings Button */}
          <button
            onClick={onOpenKeywords}
            title="Configure Target Keywords"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[#1a1a1a] bg-[#fafaf9] hover:bg-[#f6f5f4] border border-[#c8c4be] rounded-md transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#5d5b54]" />
            <span className="hidden sm:inline">Keywords Hub</span>
            <span className="text-[10px] font-semibold bg-[#5645d4] text-white px-1.5 py-0.2 rounded-full">
              {activeCategory === 'pinterest' ? pinterestKwCount : siteKwCount}
            </span>
          </button>

          {/* API Setup Button */}
          <button
            onClick={onOpenApiModal}
            title="API Integration Settings"
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-white bg-[#0a1530] hover:bg-[#1a2a52] rounded-md shadow-sm transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#ff64c8]" />
            <span className="hidden xs:inline">API</span>
          </button>
        </div>
      </div>

      {/* Mobile Dedicated Segmented Full-Width Switcher (Visible on mobile only <sm) */}
      <div className="sm:hidden px-3 pb-2.5 pt-0.5 bg-white border-t border-[#f0eeec]">
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#f6f5f4] rounded-lg border border-[#e5e3df]">
          <button
            onClick={() => onSelectCategory('pinterest')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === 'pinterest'
                ? 'bg-[#e60023] text-white shadow-xs'
                : 'text-[#5d5b54] hover:bg-white/50'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${activeCategory === 'pinterest' ? 'fill-white' : ''}`} />
            <span>Pinterest</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeCategory === 'pinterest' ? 'bg-white/25 text-white' : 'bg-[#e5e3df] text-[#5d5b54]'
              }`}
            >
              {pinterestKwCount}
            </span>
          </button>

          <button
            onClick={() => onSelectCategory('site')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === 'site'
                ? 'bg-[#5645d4] text-white shadow-xs'
                : 'text-[#5d5b54] hover:bg-white/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Arigato Site</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeCategory === 'site' ? 'bg-white/25 text-white' : 'bg-[#e5e3df] text-[#5d5b54]'
              }`}
            >
              {siteKwCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

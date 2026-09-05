import React from 'react';
import { Pin, Globe } from 'lucide-react';
import type { BrandTab } from './ArigatoBrandModal';

interface FooterProps {
  onOpenLegal: (tab: BrandTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal }) => {
  return (
    <footer className="bg-white border-t border-[#e5e3df] text-[#5d5b54] pt-12 pb-10 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
        {/* Brand Column */}
        <div className="col-span-2 space-y-3">
          <button
            onClick={() => onOpenLegal('explore')}
            className="flex items-center gap-2.5 text-left hover:opacity-90 transition-opacity cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#0a1530] flex items-center justify-center p-1 border border-[#1a2a52]">
              <img
                src="/arigato-single-logo.png"
                alt="Arigato Labs"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-semibold text-sm text-[#1a1a1a]">Arigato Labs — SEO Studio</span>
          </button>
          <p className="text-xs text-[#787671] max-w-sm leading-relaxed">
            The next-generation intelligence studio for Pinterest algorithmic visibility and high-ranking website SERP assets. Designed with the official Notion design system.
          </p>
          <div className="flex items-center gap-2 text-xs text-[#787671] pt-1">
            <span className="w-2 h-2 rounded-full bg-[#1aae39]"></span>
            <span>Cloud Firestore synced • Ready for Custom API & Vercel</span>
          </div>
        </div>

        {/* Column 1: Engines */}
        <div>
          <h4 className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider mb-3">
            Engines
          </h4>
          <ul className="space-y-2 text-xs text-[#787671]">
            <li className="hover:text-[#5645d4] transition-colors flex items-center gap-1.5">
              <Pin className="w-3 h-3 text-[#e60023]" />
              <span>Pinterest Pin SEO</span>
            </li>
            <li className="hover:text-[#5645d4] transition-colors flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-[#5645d4]" />
              <span>Arigato Site SERP</span>
            </li>
            <li>
              <span>Keywords Repository</span>
            </li>
            <li>
              <span>Neural Visual Scanner</span>
            </li>
          </ul>
        </div>

        {/* Column 2: Strict Specs */}
        <div>
          <h4 className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider mb-3">
            SEO Criteria
          </h4>
          <ul className="space-y-2 text-xs text-[#787671]">
            <li>&lt; 199 Words About Section</li>
            <li>&lt; 160 Chars Google Meta</li>
            <li>6 to 9 Search Keywords</li>
            <li>Pinterest High-CTR Titles</li>
            <li>Pinning Keywords (📌)</li>
          </ul>
        </div>

        {/* Column 3: Company & Legal */}
        <div>
          <h4 className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider mb-3">
            Arigato Labs
          </h4>
          <ul className="space-y-2 text-xs text-[#787671]">
            <li>
              <button
                onClick={() => onOpenLegal('explore')}
                className="hover:text-[#5645d4] transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Explore Arigato Labs</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal('about')}
                className="hover:text-[#5645d4] transition-colors cursor-pointer"
              >
                About Arigato Labs
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal('privacy')}
                className="hover:text-[#5645d4] transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal('terms')}
                className="hover:text-[#5645d4] transition-colors cursor-pointer"
              >
                Terms & Conditions
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal('disclaimer')}
                className="hover:text-[#5645d4] transition-colors cursor-pointer"
              >
                Disclaimer
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal('contact')}
                className="text-[#5645d4] font-medium hover:underline cursor-pointer"
              >
                Contact Founder →
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Standard Legal Footer Row */}
      <div className="max-w-7xl mx-auto pt-6 border-t border-[#ede9e4] flex flex-col md:flex-row items-center justify-between text-xs text-[#787671] gap-3">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <button onClick={() => onOpenLegal('about')} className="hover:text-[#1a1a1a] transition-colors cursor-pointer">About</button>
          <span>•</span>
          <button onClick={() => onOpenLegal('privacy')} className="hover:text-[#1a1a1a] transition-colors cursor-pointer">Privacy</button>
          <span>•</span>
          <button onClick={() => onOpenLegal('terms')} className="hover:text-[#1a1a1a] transition-colors cursor-pointer">Terms</button>
          <span>•</span>
          <button onClick={() => onOpenLegal('disclaimer')} className="hover:text-[#1a1a1a] transition-colors cursor-pointer">Disclaimer</button>
          <span>•</span>
          <button onClick={() => onOpenLegal('contact')} className="hover:text-[#1a1a1a] transition-colors cursor-pointer">Contact</button>
        </div>

        <div className="text-center md:text-right space-y-0.5">
          <p>Copyright © 2026 Arigato Labs. All Rights Reserved.</p>
          <p className="text-[11px] text-[#9c978f]">
            Built by <strong className="text-[#5d5b54]">Kumar Devanshu</strong> • Contact:{' '}
            <a href="mailto:kumardevanshu3001@gmail.com" className="hover:underline text-[#5645d4]">
              kumardevanshu3001@gmail.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

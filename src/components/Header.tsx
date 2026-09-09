import React, { useState } from 'react';
import type { SeoCategory, UserProfile } from '../types/seo';
import {
  Sliders,
  KeyRound,
  Globe,
  Pin,
  FileText,
  Download,
  WifiOff,
  LogOut,
  ChevronDown,
  Shield,
  User,
  Sparkles,
  Lock,
} from 'lucide-react';

interface HeaderProps {
  activeCategory: SeoCategory;
  onSelectCategory: (cat: SeoCategory) => void;
  onOpenKeywords: () => void;
  onOpenApiModal: () => void;
  onOpenExplore: () => void;
  onOpenSecuritySettings: () => void;
  pinterestKwCount: number;
  siteKwCount: number;
  isInstallable?: boolean;
  onInstallApp?: () => void;
  isOnline?: boolean;
  userProfile?: UserProfile | null;
  onSignOut?: () => void;
  isKeywordLockActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeCategory,
  onSelectCategory,
  onOpenKeywords,
  onOpenApiModal,
  onOpenExplore,
  onOpenSecuritySettings,
  pinterestKwCount,
  siteKwCount,
  isInstallable = false,
  onInstallApp,
  isOnline = true,
  userProfile,
  onSignOut,
  isKeywordLockActive = false,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Helper for rendering clean Lucide SVG vector icon for gender (No OS Emojis!)
  const renderGenderIcon = (gender?: string) => {
    switch (gender) {
      case 'male':
        return <User className="w-3 h-3 text-[#3b82f6]" />;
      case 'female':
        return <User className="w-3 h-3 text-[#ec4899]" />;
      case 'other':
        return <Sparkles className="w-3 h-3 text-[#a855f7]" />;
      default:
        return <Shield className="w-3 h-3 text-[#71717a]" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#e5e3df] shadow-2xs">
      {/* LAYER 1: Top Brand & Utility Header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Wordmark */}
        <button
          onClick={onOpenExplore}
          className="flex items-center gap-2 sm:gap-3 shrink-0 text-left hover:opacity-90 transition-opacity cursor-pointer"
          title="Explore Arigato Labs"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white flex items-center justify-center p-0.5 shadow-xs border border-[#e5e3df] overflow-hidden">
            <img
              src="/apple-touch-icon.png"
              alt="Arigato SEO Labs"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base tracking-tight text-[#1a1a1a]">
                Arigato<span className="text-[#5645d4]"> Labs</span>
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#e6e0f5] text-[#391c57] tracking-wider">
                SEO
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-[#787671] hidden md:inline">
              Prompt & Visual Indexing Suite
            </span>
          </div>
        </button>

        {/* Right: Actions, Install, API & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Explore Button */}
          <button
            onClick={onOpenExplore}
            title="Explore Arigato Labs Ecosystem"
            className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[#1a1a1a] bg-[#fafaf9] hover:bg-[#f6f5f4] border border-[#c8c4be] rounded-lg transition-colors cursor-pointer"
          >
            <img
              src="/arigato-single-logo.png"
              alt="Arigato Labs"
              className="w-[16px] h-[16px] object-contain"
            />
            <span className="hidden lg:inline">Explore Arigato Labs</span>
            <span className="lg:hidden">Explore</span>
          </button>

          {/* PWA Install Button (Shown when installable) */}
          {isInstallable && (
            <button
              type="button"
              onClick={onInstallApp}
              title="Install Arigato SEO as an App (PWA)"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-[#5645d4] hover:bg-[#4534b3] rounded-lg shadow-2xs transition-all cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Install App</span>
              <span className="sm:hidden">App</span>
            </button>
          )}

          {/* Offline Status Badge */}
          {!isOnline && (
            <div
              title="You are currently offline. Cached resources remain available."
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#92400e] bg-[#fef3c7] border border-[#f59e0b] rounded-lg shrink-0"
            >
              <WifiOff className="w-3 h-3 text-[#b45309]" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          )}

          {/* API Setup Button */}
          <button
            onClick={onOpenApiModal}
            title="API Integration Settings"
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-white bg-[#0a1530] hover:bg-[#1a2a52] rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#ff64c8]" />
            <span className="hidden xs:inline font-semibold">API</span>
          </button>

          {/* User Profile Chip & Dropdown */}
          {userProfile && (
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-[#e5e3df] hover:bg-[#f6f5f4] transition-colors cursor-pointer"
                title={`${userProfile.displayName} (${userProfile.email})`}
              >
                {userProfile.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName}
                    className="w-6 h-6 rounded-full object-cover border border-[#5645d4]"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#5645d4] text-white flex items-center justify-center text-[11px] font-bold">
                    {userProfile.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-[#1a1a1a] hidden md:inline max-w-[100px] truncate">
                  {userProfile.displayName}
                </span>
                <span className="p-0.5 bg-gray-100 rounded-full" title={`Gender: ${userProfile.gender || 'Not specified'}`}>
                  {renderGenderIcon(userProfile.gender)}
                </span>
                <ChevronDown className="w-3 h-3 text-[#787671]" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-[#e5e3df] py-2 z-50 animate-in fade-in">
                  <div className="px-3.5 pb-2.5 border-b border-[#f0eeec]">
                    <p className="text-xs font-bold text-[#1a1a1a] truncate">{userProfile.displayName}</p>
                    <p className="text-[10px] text-[#787671] truncate">{userProfile.email}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] bg-[#f6f5f4] text-[#5d5b54] px-2 py-0.5 rounded capitalize w-fit">
                      {renderGenderIcon(userProfile.gender)}
                      <span>{userProfile.gender ? userProfile.gender.replace(/_/g, ' ') : 'Verified'}</span>
                    </div>
                  </div>

                  {/* Security Settings Menu Item */}
                  <div className="py-1 border-b border-[#f0eeec]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenSecuritySettings();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#37352f] hover:bg-[#f6f5f4] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#5645d4]" />
                      <span>Security Q&amp;A Settings</span>
                    </button>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onSignOut?.();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#e60023] hover:bg-[#fde0ec]/50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out of Studio</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* LAYER 2: Dedicated Studio Navigation & Keywords Bar */}
      <div className="bg-[#fafaf9] border-t border-[#ede9e4] px-3 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
          {/* Studio Modes Segmented Switcher */}
          <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => onSelectCategory('pinterest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'pinterest'
                  ? 'bg-[#e60023] text-white shadow-xs'
                  : 'text-[#5d5b54] hover:text-[#1a1a1a] hover:bg-white bg-white/60 border border-[#e5e3df]'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${activeCategory === 'pinterest' ? 'fill-white' : ''}`} />
              <span>Pinterest SEO</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeCategory === 'pinterest' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {pinterestKwCount}
              </span>
            </button>

            <button
              onClick={() => onSelectCategory('site')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'site'
                  ? 'bg-[#5645d4] text-white shadow-xs'
                  : 'text-[#5d5b54] hover:text-[#1a1a1a] hover:bg-white bg-white/60 border border-[#e5e3df]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Arigato Site SEO</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeCategory === 'site' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {siteKwCount}
              </span>
            </button>

            <button
              onClick={() => onSelectCategory('grab-text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'grab-text'
                  ? 'bg-[#2a9d99] text-white shadow-xs'
                  : 'text-[#5d5b54] hover:text-[#1a1a1a] hover:bg-white bg-white/60 border border-[#e5e3df]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Grab Text</span>
              <span
                className={`text-[9px] uppercase tracking-wide font-bold px-1.5 py-0.2 rounded-full ${
                  activeCategory === 'grab-text' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                OCR
              </span>
            </button>
          </nav>

          {/* Right: Quick Keywords Hub Shortcut with Lock Status */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={onOpenKeywords}
              title="Configure Target Keywords (Protected by Security Q&A)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1a1a1a] bg-white hover:bg-[#f6f5f4] border border-[#c8c4be] rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-[#5645d4]" />
              <span>Keywords Hub</span>
              <span className="text-[10px] font-bold bg-[#5645d4] text-white px-1.5 py-0.2 rounded-full">
                {activeCategory === 'pinterest' ? pinterestKwCount : siteKwCount}
              </span>
              {isKeywordLockActive && (
                <span title="Security Q&A Lock Active" className="flex items-center text-[#1aae39]">
                  <Lock className="w-3 h-3" />
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


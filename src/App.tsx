import React, { useState, useRef, useEffect } from 'react';
import type { SeoCategory, KeywordItem, ApiConfig } from './types/seo';
import {
  getStoredKeywords,
  saveStoredKeywords,
  getStoredApiConfig,
  saveStoredApiConfig,
} from './utils/storage';
import {
  subscribeToKeywords,
  saveKeywordsToFirestore,
  fetchKeywordsFromFirestore,
} from './services/firebase';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { PinterestSeoView } from './components/PinterestSeoView';
import { ArigatoSiteSeoView } from './components/ArigatoSiteSeoView';
import { GrabTextView } from './components/GrabTextView';
import { KeywordsDrawer } from './components/KeywordsDrawer';
import { ApiIntegrationModal } from './components/ApiIntegrationModal';
import { Footer } from './components/Footer';
import { ChatAssistant } from './components/ChatAssistant';
import { ArigatoBrandModal, type BrandTab } from './components/ArigatoBrandModal';
import { usePWA } from './hooks/usePWA';

export const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<SeoCategory>('pinterest');

  // PWA & Service Worker Status
  const { isInstallable, isInstalled, isOnline, installApp } = usePWA();

  // Keywords State
  const [pinterestKeywords, setPinterestKeywords] = useState<KeywordItem[]>(() =>
    getStoredKeywords('pinterest')
  );
  const [siteKeywords, setSiteKeywords] = useState<KeywordItem[]>(() =>
    getStoredKeywords('site')
  );

  // Firestore Sync status
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);

  // API Config State
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => getStoredApiConfig());

  // Modal / Drawer States
  const [isKeywordsOpen, setIsKeywordsOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [brandModalTab, setBrandModalTab] = useState<BrandTab>('explore');

  const studioRef = useRef<HTMLDivElement>(null);

  // Listen to hash routes (#explore, #about, #privacy, #terms, #disclaimer, #contact)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase() as BrandTab;
      const validTabs: BrandTab[] = ['explore', 'about', 'privacy', 'terms', 'disclaimer', 'contact'];
      if (validTabs.includes(hash)) {
        setBrandModalTab(hash);
        setIsBrandModalOpen(true);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Real-time Cloud Firestore synchronization (Zero sample keywords)
  useEffect(() => {
    const sampleIds = [
      'pk-1', 'pk-2', 'pk-3', 'pk-4', 'pk-5', 'pk-6', 'pk-7', 'pk-8', 'pk-9',
      'sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6', 'sk-7', 'sk-8',
    ];

    // 1. Subscribe to Pinterest keywords in Cloud Firestore
    const unsubPinterest = subscribeToKeywords('pinterest', (cloudKws) => {
      if (cloudKws) {
        const cleanKws = cloudKws.filter((k) => !sampleIds.includes(k.id));
        setPinterestKeywords(cleanKws);
        saveStoredKeywords('pinterest', cleanKws);
        setIsFirestoreConnected(true);
      }
    });

    // 2. Subscribe to Site keywords in Cloud Firestore
    const unsubSite = subscribeToKeywords('site', (cloudKws) => {
      if (cloudKws) {
        const cleanKws = cloudKws.filter((k) => !sampleIds.includes(k.id));
        setSiteKeywords(cleanKws);
        saveStoredKeywords('site', cleanKws);
        setIsFirestoreConnected(true);
      }
    });

    // 3. Initial check & clean out any old sample keywords from Firestore
    fetchKeywordsFromFirestore('pinterest').then((res) => {
      if (res && res.length > 0) {
        const cleanKws = res.filter((k) => !sampleIds.includes(k.id));
        setPinterestKeywords(cleanKws);
        if (cleanKws.length !== res.length) {
          saveKeywordsToFirestore('pinterest', cleanKws).catch(console.warn);
        }
      }
      setIsFirestoreConnected(true);
    });

    fetchKeywordsFromFirestore('site').then((res) => {
      if (res && res.length > 0) {
        const cleanKws = res.filter((k) => !sampleIds.includes(k.id));
        setSiteKeywords(cleanKws);
        if (cleanKws.length !== res.length) {
          saveKeywordsToFirestore('site', cleanKws).catch(console.warn);
        }
      }
      setIsFirestoreConnected(true);
    });

    return () => {
      unsubPinterest();
      unsubSite();
    };
  }, []);

  // Synchronize keywords to localStorage AND Cloud Firestore on change
  const handleUpdatePinterestKeywords = (kws: KeywordItem[]) => {
    setPinterestKeywords(kws);
    saveStoredKeywords('pinterest', kws);
    saveKeywordsToFirestore('pinterest', kws).catch((err) => {
      console.warn('[Firestore] Background write warning for pinterest:', err);
    });
  };

  const handleUpdateSiteKeywords = (kws: KeywordItem[]) => {
    setSiteKeywords(kws);
    saveStoredKeywords('site', kws);
    saveKeywordsToFirestore('site', kws).catch((err) => {
      console.warn('[Firestore] Background write warning for site:', err);
    });
  };

  const handleSaveApiConfig = (cfg: ApiConfig) => {
    setApiConfig(cfg);
    saveStoredApiConfig(cfg);
  };

  const scrollToStudio = () => {
    studioRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddKeywordsFromGrab = (newKeywords: string[]) => {
    const targetCat = activeCategory === 'pinterest' ? 'pinterest' : 'site';
    const currentList = targetCat === 'pinterest' ? pinterestKeywords : siteKeywords;
    const existingTexts = new Set(currentList.map((k) => k.text.toLowerCase()));

    const additions: KeywordItem[] = [];
    newKeywords.forEach((kw) => {
      const clean = kw.trim();
      if (clean && !existingTexts.has(clean.toLowerCase())) {
        existingTexts.add(clean.toLowerCase());
        additions.push({
          id: `grab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text: clean,
          category: 'trending',
          active: true,
          isPinned: false,
        });
      }
    });

    if (additions.length > 0) {
      const updated = [...currentList, ...additions];
      if (targetCat === 'pinterest') {
        handleUpdatePinterestKeywords(updated);
      } else {
        handleUpdateSiteKeywords(updated);
      }
    }
  };

  const activePinterestKwCount = pinterestKeywords.filter((k) => k.active).length;
  const activeSiteKwCount = siteKeywords.filter((k) => k.active).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9] text-[#1a1a1a] selection:bg-[#e6e0f5] selection:text-[#391c57]">
      {/* Top Sticky Header with Navigation & Pill Switches */}
      <Header
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onOpenKeywords={() => setIsKeywordsOpen(true)}
        onOpenApiModal={() => setIsApiModalOpen(true)}
        onOpenExplore={() => {
          setBrandModalTab('explore');
          setIsBrandModalOpen(true);
        }}
        pinterestKwCount={activePinterestKwCount}
        siteKwCount={activeSiteKwCount}
        isInstallable={isInstallable && !isInstalled}
        onInstallApp={installApp}
        isOnline={isOnline}
      />

      {/* Notion Navy Atmospheric Hero Section */}
      <HeroBanner
        activeCategory={activeCategory}
        onScrollToStudio={scrollToStudio}
        onOpenKeywords={() => setIsKeywordsOpen(true)}
      />

      {/* Main Studio Work Area */}
      <main ref={studioRef} className="flex-1 w-full bg-[#fafaf9] py-6 sm:py-8 px-3 sm:px-6 lg:px-8">
        {activeCategory === 'pinterest' ? (
          <PinterestSeoView
            pinterestKeywords={pinterestKeywords}
            onOpenKeywords={() => setIsKeywordsOpen(true)}
          />
        ) : activeCategory === 'site' ? (
          <ArigatoSiteSeoView
            siteKeywords={siteKeywords}
            onOpenKeywords={() => setIsKeywordsOpen(true)}
          />
        ) : (
          <GrabTextView
            onAddKeywordsToFirestore={handleAddKeywordsFromGrab}
            onOpenKeywordsDrawer={() => setIsKeywordsOpen(true)}
          />
        )}
      </main>

      {/* Official Arigato Labs Footer */}
      <Footer
        onOpenLegal={(tab) => {
          setBrandModalTab(tab);
          setIsBrandModalOpen(true);
        }}
      />

      {/* Sliding Keywords Repository Drawer */}
      <KeywordsDrawer
        isOpen={isKeywordsOpen}
        onClose={() => setIsKeywordsOpen(false)}
        activeCategory={activeCategory}
        pinterestKeywords={pinterestKeywords}
        siteKeywords={siteKeywords}
        onUpdatePinterestKeywords={handleUpdatePinterestKeywords}
        onUpdateSiteKeywords={handleUpdateSiteKeywords}
        isFirestoreConnected={isFirestoreConnected}
      />

      {/* Custom API / Integration Modal */}
      <ApiIntegrationModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        config={apiConfig}
        onSaveConfig={handleSaveApiConfig}
      />

      {/* Arigato Labs Brand & Legal Modal (Explore, About, Privacy, Terms, Disclaimer, Contact) */}
      <ArigatoBrandModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        initialTab={brandModalTab}
      />

      {/* Floating Kimi-K3 Live Test Assistant */}
      <ChatAssistant />
    </div>
  );
};

export default App;

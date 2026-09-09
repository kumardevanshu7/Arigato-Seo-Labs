import React, { useState, useRef, useEffect } from 'react';
import type { SeoCategory, KeywordItem, ApiConfig, UserProfile, SecuritySettings } from './types/seo';
import type { User } from 'firebase/auth';
import {
  getStoredKeywords,
  saveStoredKeywords,
  getStoredApiConfig,
  saveStoredApiConfig,
} from './utils/storage';
import {
  subscribeToAuth,
  signOutUser,
  fetchUserProfile,
  fetchSecuritySettings,
  saveSecuritySettings,
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
import { AuthScreen } from './components/AuthScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { KeywordLockModal } from './components/KeywordLockModal';
import { usePWA } from './hooks/usePWA';

export const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<SeoCategory>('pinterest');

  // Firebase Authentication & User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Security / Passcode Lock State
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    keywordLockEnabled: false,
    keywordPasscode: '',
  });
  const [isKeywordsUnlocked, setIsKeywordsUnlocked] = useState(false);
  const [isKeywordLockModalOpen, setIsKeywordLockModalOpen] = useState(false);

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

  // 1. Listen to Firebase Authentication lifecycle
  useEffect(() => {
    const unsubAuth = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const [profile, secSettings] = await Promise.all([
            fetchUserProfile(user.uid),
            fetchSecuritySettings(user.uid),
          ]);
          setUserProfile(profile);
          if (secSettings) {
            setSecuritySettings(secSettings);
          }
        } catch (err) {
          console.error('[App] Error loading user profile & settings:', err);
        }
      } else {
        setUserProfile(null);
        setIsKeywordsUnlocked(false);
      }
      setIsAuthLoading(false);
    });

    return () => unsubAuth();
  }, []);

  // 2. Listen to hash routes (#explore, #about, #privacy, etc.)
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

  // 3. User-isolated Cloud Firestore synchronization
  useEffect(() => {
    if (!currentUser?.uid || !userProfile?.onboarded) {
      return;
    }

    const userId = currentUser.uid;

    // A. Subscribe to User's Pinterest keywords
    const unsubPinterest = subscribeToKeywords(userId, 'pinterest', (cloudKws) => {
      if (cloudKws) {
        setPinterestKeywords(cloudKws);
        saveStoredKeywords('pinterest', cloudKws, userId);
        setIsFirestoreConnected(true);
      }
    });

    // B. Subscribe to User's Site keywords
    const unsubSite = subscribeToKeywords(userId, 'site', (cloudKws) => {
      if (cloudKws) {
        setSiteKeywords(cloudKws);
        saveStoredKeywords('site', cloudKws, userId);
        setIsFirestoreConnected(true);
      }
    });

    // C. Initial fetch for user
    fetchKeywordsFromFirestore(userId, 'pinterest').then((res) => {
      if (res && res.length > 0) {
        setPinterestKeywords(res);
      }
      setIsFirestoreConnected(true);
    });

    fetchKeywordsFromFirestore(userId, 'site').then((res) => {
      if (res && res.length > 0) {
        setSiteKeywords(res);
      }
      setIsFirestoreConnected(true);
    });

    return () => {
      unsubPinterest();
      unsubSite();
    };
  }, [currentUser?.uid, userProfile?.onboarded]);

  // Synchronize keywords to localStorage AND User-isolated Cloud Firestore on change
  const handleUpdatePinterestKeywords = (kws: KeywordItem[]) => {
    setPinterestKeywords(kws);
    if (currentUser?.uid) {
      saveStoredKeywords('pinterest', kws, currentUser.uid);
      saveKeywordsToFirestore(currentUser.uid, 'pinterest', kws).catch((err) => {
        console.warn('[Firestore] Background write warning for pinterest:', err);
      });
    }
  };

  const handleUpdateSiteKeywords = (kws: KeywordItem[]) => {
    setSiteKeywords(kws);
    if (currentUser?.uid) {
      saveStoredKeywords('site', kws, currentUser.uid);
      saveKeywordsToFirestore(currentUser.uid, 'site', kws).catch((err) => {
        console.warn('[Firestore] Background write warning for site:', err);
      });
    }
  };

  // Keyword Lock Passcode Handlers
  const handleOpenKeywordsDrawer = () => {
    if (
      securitySettings.keywordLockEnabled &&
      securitySettings.keywordPasscode &&
      !isKeywordsUnlocked
    ) {
      setIsKeywordLockModalOpen(true);
    } else {
      setIsKeywordsOpen(true);
    }
  };

  const handleKeywordLockSuccess = () => {
    setIsKeywordsUnlocked(true);
    setIsKeywordLockModalOpen(false);
    setIsKeywordsOpen(true);
  };

  const handleUpdateSecuritySettings = (newSettings: SecuritySettings) => {
    setSecuritySettings(newSettings);
    if (currentUser?.uid) {
      saveSecuritySettings(currentUser.uid, newSettings).catch((err) => {
        console.error('[App] Error saving security settings:', err);
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setCurrentUser(null);
      setUserProfile(null);
      setIsKeywordsUnlocked(false);
    } catch (err) {
      console.error('[App] Sign Out error:', err);
    }
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

  // 1. Loading Screen while Firebase checks authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0a1530] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 p-2.5 flex items-center justify-center mb-3 animate-pulse shadow-xl">
          <img src="/apple-touch-icon.png" alt="Arigato SEO" className="w-full h-full object-contain" />
        </div>
        <p className="text-xs text-white/70 font-medium tracking-wide animate-pulse">
          Opening Arigato SEO Studio...
        </p>
      </div>
    );
  }

  // 2. If user is NOT logged in -> Show Google Sign-In Screen
  if (!currentUser) {
    return <AuthScreen />;
  }

  // 3. If user IS logged in but NOT onboarded yet -> Show Name & Gender Onboarding
  if (!userProfile || !userProfile.onboarded) {
    return (
      <OnboardingModal
        userUid={currentUser.uid}
        initialEmail={currentUser.email || ''}
        initialName={currentUser.displayName || ''}
        initialPhoto={currentUser.photoURL || undefined}
        onCompleted={(profile) => setUserProfile(profile)}
      />
    );
  }

  // 4. Fully Authenticated & Onboarded -> Render Studio
  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9] text-[#1a1a1a] selection:bg-[#e6e0f5] selection:text-[#391c57]">
      {/* Top Sticky Header with Navigation & Pill Switches */}
      <Header
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onOpenKeywords={handleOpenKeywordsDrawer}
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
        userProfile={userProfile}
        onSignOut={handleSignOut}
      />

      {/* Notion Navy Atmospheric Hero Section */}
      <HeroBanner
        activeCategory={activeCategory}
        onScrollToStudio={scrollToStudio}
        onOpenKeywords={handleOpenKeywordsDrawer}
      />

      {/* Main Studio Work Area */}
      <main ref={studioRef} className="flex-1 w-full bg-[#fafaf9] py-6 sm:py-8 px-3 sm:px-6 lg:px-8">
        {activeCategory === 'pinterest' ? (
          <PinterestSeoView
            pinterestKeywords={pinterestKeywords}
            onOpenKeywords={handleOpenKeywordsDrawer}
          />
        ) : activeCategory === 'site' ? (
          <ArigatoSiteSeoView
            siteKeywords={siteKeywords}
            onOpenKeywords={handleOpenKeywordsDrawer}
          />
        ) : (
          <GrabTextView
            onAddKeywordsToFirestore={handleAddKeywordsFromGrab}
            onOpenKeywordsDrawer={handleOpenKeywordsDrawer}
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
        securitySettings={securitySettings}
        onUpdateSecuritySettings={handleUpdateSecuritySettings}
      />

      {/* One-Time Passcode Security Verification Modal */}
      {securitySettings.keywordLockEnabled && securitySettings.keywordPasscode && (
        <KeywordLockModal
          isOpen={isKeywordLockModalOpen}
          onClose={() => setIsKeywordLockModalOpen(false)}
          expectedPasscode={securitySettings.keywordPasscode}
          onSuccess={handleKeywordLockSuccess}
        />
      )}

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

export type SeoCategory = 'pinterest' | 'site' | 'grab-text';

export interface GrabTextResult {
  allCommaSeparated: string;
  items: string[];
  totalExtracted: number;
}

export type KeywordCategory = 'primary' | 'secondary' | 'trending' | 'niche' | 'brand';

export interface KeywordItem {
  id: string;
  text: string;
  category?: KeywordCategory;
  active: boolean;
  isPinned?: boolean; // 📌 Pin keyword to ALWAYS force it into SEO descriptions
  searchVolumeHint?: string;
}

export interface PinterestVariation {
  id: number;
  title: string;
  description: string;
  characterCounts: {
    title: number;
    description: number;
  };
}

export interface PinterestSeoResult {
  title: string;
  description: string;
  tags: string[];
  keywordsMatched: string[];
  characterCounts: {
    title: number;
    description: number;
    tagsCount: number;
  };
  recommendedBoard?: string;
  variations?: PinterestVariation[];
}

export interface ArigatoSiteSeoResult {
  aboutPrompt: string; // Strictly <= 199 words
  wordCount: number;
  seoDescription: string; // Strictly <= 160 characters
  charCount: number;
  keywords: string[]; // Strictly 6 to 9 keywords
  keywordsMatched: string[];
  siteMetaTitle?: string;
}

export interface GenerationInput {
  category: SeoCategory;
  prompt: string;
  imageDataUrl?: string;
  imageFileName?: string;
  activeKeywords: string[];
  pinnedKeywords?: string[]; // 📌 Mandatory keywords that MUST appear in descriptions
  pinterestFormat?: 'with_link' | 'search_steps'; // Dual-mode for Pinterest: With Link CTA vs Google Search Steps
  variationCount?: number; // Desired number of pin variations (2, 3, 4, 5 - default 2)
  subjectFocus?: 'auto' | 'solo_female' | 'solo_male' | 'couple' | 'portrait'; // Subject detection override
  extraGuidance?: string; // Optional custom directives/instructions for system prompt (tone, specific details, style)
}

export interface GenerationState {
  isGenerating: boolean;
  progressStep: number;
  progressPercent?: number;
  statusMessage: string;
  error?: string;
}

export interface ApiConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  mode: 'simulated' | 'custom_api';
  tokenId?: string;
  tokenSecret?: string;
}

export type UserGender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  gender?: UserGender;
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SecuritySettings {
  keywordLockEnabled: boolean;
  keywordPasscode?: string;
  securityQuestion?: string;
  securityAnswer?: string;
}


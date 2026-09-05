export type SeoCategory = 'pinterest' | 'site';

export type KeywordCategory = 'primary' | 'secondary' | 'trending' | 'niche' | 'brand';

export interface KeywordItem {
  id: string;
  text: string;
  category?: KeywordCategory;
  active: boolean;
  isPinned?: boolean; // 📌 Pin keyword to ALWAYS force it into SEO descriptions
  searchVolumeHint?: string;
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
}

export interface GenerationState {
  isGenerating: boolean;
  progressStep: number;
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

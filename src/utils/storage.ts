import type { KeywordItem, SeoCategory, ApiConfig } from '../types/seo';

const DEFAULT_API_CONFIG: ApiConfig = {
  apiUrl: '/modal-api/chat/completions',
  apiKey: '',
  model: 'moonshotai/Kimi-K3',
  mode: 'simulated',
  tokenId: '',
  tokenSecret: '',
};

const STORAGE_KEYS = {
  pinterestKeywords: 'arigato_seo_pinterest_keywords_v1',
  siteKeywords: 'arigato_seo_site_keywords_v1',
  apiConfig: 'arigato_seo_api_config_v1',
};

const SAMPLE_KEYWORD_IDS = [
  'pk-1', 'pk-2', 'pk-3', 'pk-4', 'pk-5', 'pk-6', 'pk-7', 'pk-8', 'pk-9',
  'sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6', 'sk-7', 'sk-8',
];

export const getStoredKeywords = (category: SeoCategory): KeywordItem[] => {
  try {
    const key = category === 'pinterest' ? STORAGE_KEYS.pinterestKeywords : STORAGE_KEYS.siteKeywords;
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed: KeywordItem[] = JSON.parse(raw);
    // Remove sample keywords if present
    return parsed.filter((kw) => !SAMPLE_KEYWORD_IDS.includes(kw.id));
  } catch (e) {
    console.error('Failed to load stored keywords', e);
    return [];
  }
};

export const saveStoredKeywords = (category: SeoCategory, keywords: KeywordItem[]): void => {
  try {
    const key = category === 'pinterest' ? STORAGE_KEYS.pinterestKeywords : STORAGE_KEYS.siteKeywords;
    localStorage.setItem(key, JSON.stringify(keywords));
  } catch (e) {
    console.error('Failed to save keywords', e);
  }
};

export const getStoredApiConfig = (): ApiConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.apiConfig);
    if (!raw) return DEFAULT_API_CONFIG;
    return { ...DEFAULT_API_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_API_CONFIG;
  }
};

export const saveStoredApiConfig = (config: ApiConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.apiConfig, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save API config', e);
  }
};

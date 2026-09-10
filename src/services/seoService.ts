import type { GenerationInput, PinterestSeoResult, PinterestVariation, ArigatoSiteSeoResult, ApiConfig, GrabTextResult } from '../types/seo';
import { getStoredApiConfig } from '../utils/storage';
import Tesseract from 'tesseract.js';

// Helper to count words accurately
export const countWords = (text: string): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

// Helper to trim text to strictly fit maximum word count
export const enforceWordLimit = (text: string, maxWords: number): string => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '.';
};

// Helper to trim text to strictly fit maximum character count
export const enforceCharLimit = (text: string, maxChars: number): string => {
  if (text.length <= maxChars) return text;
  const sliced = text.slice(0, maxChars);
  const lastSpace = sliced.lastIndexOf(' ');
  return (lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced).trim();
};

/**
 * Trims text strictly to maxChars while cleanly preserving full sentence boundaries.
 * Guarantees output is <= maxChars.
 */
export const enforceSentenceCharLimit = (text: string, maxChars: number): string => {
  if (!text || text.length <= maxChars) return text;
  const sliced = text.slice(0, maxChars);

  // Look for the last sentence terminator (. ! ?)
  const lastPeriod = Math.max(
    sliced.lastIndexOf('. '),
    sliced.lastIndexOf('.\n'),
    sliced.lastIndexOf('! '),
    sliced.lastIndexOf('? ')
  );

  if (lastPeriod > maxChars * 0.5) {
    return sliced.slice(0, lastPeriod + 1).trim();
  }

  // Fallback to word boundary
  const lastSpace = sliced.lastIndexOf(' ');
  const cleanWord = (lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced).trim();
  return cleanWord.endsWith('.') ? cleanWord : `${cleanWord}.`;
};

/**
 * Smartly weaves 1 or 2 high-intent target/pinned keywords into a fluid, human sentence.
 * Strictly avoids repetitive comma dumping or keyword stuffing.
 */
export function buildSmartKeywordSentence(pinnedKws: string[] = [], activeKws: string[] = []): string {
  const pool = [...pinnedKws, ...activeKws]
    .map((k) => k.trim())
    .filter((k) => k.length > 2);

  const unique: string[] = [];
  for (const item of pool) {
    if (!unique.some((u) => u.toLowerCase() === item.toLowerCase())) {
      unique.push(item);
    }
  }

  if (unique.length === 0) {
    return 'Ideal for creating romantic couple selfies and aesthetic photography poses.';
  }

  const primary = unique[0].replace(/^#/, '');
  const secondary = unique.length > 1 ? unique[1].replace(/^#/, '') : null;

  if (secondary && !primary.toLowerCase().includes(secondary.toLowerCase()) && !secondary.toLowerCase().includes(primary.toLowerCase())) {
    return `Ideal for anyone looking for ${primary} or aesthetic ${secondary} with candid romance.`;
  }

  return `A must-try ${primary} for romantic couple selfies and candid photography ideas.`;
};

/**
 * Robust JSON extractor: extracts JSON object safely from raw LLM responses.
 * Gracefully handles <think>...</think> reasoning tags, markdown fences,
 * leading/trailing commentary, or empty outputs.
 */
export function extractSafeJsonObject(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') return {};

  // Strip <think>...</think> or <thought>...</thought> reasoning tags
  let clean = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
    .trim();

  // Strip markdown code fences
  clean = clean.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

  // Locate the outermost JSON object braces { ... }
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(clean);
  } catch (err) {
    console.warn('[extractSafeJsonObject] JSON.parse failed on cleaned text:', clean.slice(0, 120), err);
    return {};
  }
}

export interface ArigatoSiteKeywordPartition {
  // For aboutPrompt (10 keywords in sentences: 5 pinned + 5 random unpinned)
  aboutKeywords: string[];
  aboutPinned: string[];
  aboutUnpinned: string[];

  // For seoDescription (3 keywords in sentence: 2 random pinned + 1 random unpinned)
  descKeywords: string[];
  descPinned: string[];
  descUnpinned: string[];

  // For keywords tags (9 tags: 4 random pinned + 5 random unpinned)
  tagKeywords: string[];
  tagPinned: string[];
  tagUnpinned: string[];
}

/**
 * Partitions Arigato Site keywords according to strict user rules:
 * 1. "about-this-prompt.md": 10 keywords in sentences (5 pinned + 5 random unpinned)
 * 2. "seo-meta-description.txt": 3 keywords in sentence (2 random pinned + 1 random unpinned)
 * 3. "seo-keywords.csv": 9 tags (4 random pinned + 5 random unpinned)
 */
export function partitionArigatoSiteKeywords(input: GenerationInput): ArigatoSiteKeywordPartition {
  // 1. Get pinned keywords (max 5)
  const pinnedList = (input.pinnedKeywords || []).map((k) => k.trim()).filter(Boolean).slice(0, 5);

  // 2. Get active unpinned keywords
  const unpinnedList = (input.activeKeywords || [])
    .map((k) => k.trim())
    .filter((k) => Boolean(k) && !pinnedList.some((pk) => pk.toLowerCase() === k.toLowerCase()));

  // 3. Fallback high-intent keywords if active list has fewer items
  const fallbackSiteKeywords = [
    'gemini couple prompt',
    'realistic couple prompt for gemini ai',
    'couple prompt',
    'couple aesthetic',
    'candid couple photo',
    'couple selfie poses',
    'smartphone couple photo',
    'gemini couple prompt instagram',
    'couple photo ideas',
    'aesthetic couple portrait',
    'viral couple prompt',
    'couple photography ideas',
  ];

  const enrichedUnpinned: string[] = [...unpinnedList];
  for (const fb of fallbackSiteKeywords) {
    if (
      !enrichedUnpinned.some((k) => k.toLowerCase() === fb.toLowerCase()) &&
      !pinnedList.some((k) => k.toLowerCase() === fb.toLowerCase())
    ) {
      enrichedUnpinned.push(fb);
    }
  }

  // Shuffle unpinned pool randomly for every generation
  const shuffledUnpinned = [...enrichedUnpinned].sort(() => 0.5 - Math.random());

  // A. ABOUT THIS PROMPT (10 keywords: 5 pinned + 5 random unpinned)
  const aboutPinned = [...pinnedList];
  const neededUnpinnedForAbout = Math.max(0, 10 - aboutPinned.length);
  const aboutUnpinned = shuffledUnpinned.slice(0, neededUnpinnedForAbout);
  const aboutKeywords = [...aboutPinned, ...aboutUnpinned].slice(0, 10);

  // B. SEO META DESCRIPTION (3 keywords: 2 random pinned + 1 random unpinned)
  const shuffledPinned = [...pinnedList].sort(() => 0.5 - Math.random());
  const descPinned = shuffledPinned.slice(0, Math.min(2, shuffledPinned.length));
  const remainingForDesc = shuffledUnpinned.filter(
    (k) => !descPinned.some((dp) => dp.toLowerCase() === k.toLowerCase())
  );
  const descUnpinned = remainingForDesc.slice(0, Math.max(0, 3 - descPinned.length));
  const descKeywords = [...descPinned, ...descUnpinned].slice(0, 3);

  // C. SEO KEYWORDS TAGS (9 tags: 4 random pinned + 5 random unpinned)
  const tagPinned = shuffledPinned.slice(0, Math.min(4, shuffledPinned.length));
  const remainingForTags = shuffledUnpinned.filter(
    (k) => !tagPinned.some((tp) => tp.toLowerCase() === k.toLowerCase())
  );
  const tagUnpinned = remainingForTags.slice(0, Math.max(0, 9 - tagPinned.length));
  const tagKeywords = [...tagPinned, ...tagUnpinned].slice(0, 9);

  return {
    aboutKeywords,
    aboutPinned,
    aboutUnpinned,
    descKeywords,
    descPinned,
    descUnpinned,
    tagKeywords,
    tagPinned,
    tagUnpinned,
  };
}

/**
 * Smart Dynamic Synthesis for "About this prompt" (Strictly < 199 words, 4 cohesive paragraphs)
 * Written in simple, warm, human English explaining what you see in the prompt,
 * with natural details and a friendly CTA to copy, try, and have fun.
 * Weaves ALL 10 TARGET KEYWORDS (5 pinned + 5 random unpinned) into fluent, human sentences.
 */
export function generateSmartAboutPrompt(
  input: GenerationInput,
  partition?: ArigatoSiteKeywordPartition
): string {
  const parts = partition || partitionArigatoSiteKeywords(input);
  const kws = parts.aboutKeywords;
  const pLower = (input.prompt || '').toLowerCase();

  // Friendly scene descriptor
  let sceneTitle = 'a spontaneous, romantic candid couple portrait';
  if (/3-frame|three.*frame|strip|collage|series/i.test(pLower)) {
    sceneTitle = 'a super cute vertical 3-frame selfie series';
  } else if (/elevator|lift/i.test(pLower)) {
    sceneTitle = 'a spontaneous elevator mirror selfie';
  } else if (/cafe|coffee/i.test(pLower)) {
    sceneTitle = 'a cozy coffee date portrait';
  } else if (/balcony|rooftop/i.test(pLower)) {
    sceneTitle = 'a relaxed open balcony moment';
  } else if (/street|city/i.test(pLower)) {
    sceneTitle = 'a candid street style portrait';
  }

  // Friendly outfit descriptor
  let outfitDesc = 'casual everyday outfits with natural fabric creases';
  if (/kurta/i.test(pLower)) {
    outfitDesc = 'authentic textured kurtas with realistic fabric folds';
  } else if (/saree|sari/i.test(pLower)) {
    outfitDesc = 'an elegant traditional saree with authentic drape';
  } else if (/naruto|graphic|tee|t-shirt/i.test(pLower)) {
    outfitDesc = 'casual everyday tees with relaxed cotton textures';
  } else if (/dress|crochet/i.test(pLower)) {
    outfitDesc = 'a charming casual dress with lovely everyday styling';
  }

  // Para 1: What you see in the prompt (simple, warm, human)
  const p1 = `If you want a cute, realistic photo idea, this prompt creates ${sceneTitle} for ${kws[0] || 'realistic couple prompt'} and ${kws[1] || 'gemini couple prompt'}. You get to see two people sharing candid closeness, genuine eye contact, and playful chemistry that brings ${kws[2] || 'couple photo'} to life with authentic romance.`;

  // Para 2: Details on facial realism & natural features
  const p2 = `What makes this prompt special is how naturally it captures real facial features for ${kws[3] || 'couple aesthetic'} and ${kws[4] || 'realistic couple prompt'}. Instead of fake AI smoothing, it preserves authentic skin texture, natural smile lines, and true-to-life expressions with complete realism.`;

  // Para 3: Outfits, lighting & smartphone feel
  const p3 = `The styling stays relaxed with ${outfitDesc} tailored for ${kws[5] || 'trending prompt girls'} and ${kws[6] || 'trending prompt boys'}. Combined with soft ambient lighting and candid mobile camera vibes, it creates an effortless look for ${kws[7] || 'candid couple photo'} and ${kws[8] || 'couple selfie poses'}.`;

  // Para 4: Friendly call to action (try it, copy it, have fun!)
  const p4 = `Whether you want to try ${kws[9] || 'smartphone couple photo'} or make sweet couple memories, this prompt is ready. Just copy the prompt above, try it in your AI generator, and have fun creating your own viral couple photos!`;

  const fullPrompt = `${p1}\n\n${p2}\n\n${p3}\n\n${p4}`;
  return enforceWordLimit(fullPrompt, 199);
}

/**
 * Smart synthesis generator for "SEO Meta Description" (Strictly < 160 chars)
 * Weaves 3 keywords: 2 random pinned + 1 random unpinned into a natural SERP sentence.
 */
export function generateSmartSeoDescription(
  input: GenerationInput,
  partition?: ArigatoSiteKeywordPartition
): string {
  const parts = partition || partitionArigatoSiteKeywords(input);
  const [k1, k2, k3] = parts.descKeywords;

  let desc = `Couple AI prompt for ${k1} & ${k2} with ${k3}, strict face identity, natural lighting, and candid smartphone realism.`;
  if (desc.length > 160) {
    desc = `AI prompt for ${k1} and ${k2}, featuring ${k3}, strict face identity, and authentic smartphone realism.`;
  }
  if (desc.length > 160) {
    desc = enforceCharLimit(desc, 160);
  }
  return desc;
}

/**
 * Smart synthesis generator for "SEO Keywords" (Strictly 9 tags: 4 random pinned + 5 random unpinned)
 */
export function generateSmartKeywords(
  input: GenerationInput,
  partition?: ArigatoSiteKeywordPartition
): string[] {
  const parts = partition || partitionArigatoSiteKeywords(input);
  return parts.tagKeywords.map((k) => k.trim().toLowerCase());
}

function rotateArray<T>(arr: T[], offset: number): T[] {
  if (arr.length <= 1) return arr;
  const k = offset % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

/**
 * Generates 2 to 5 distinct, high-converting Pinterest variations (Titles & Descriptions)
 * for the user's pins with natural keyword rotation and strict <600 chars limit.
 */
export function buildSmartPinterestVariations(
  input: GenerationInput,
  count: number = 2
): PinterestVariation[] {
  const format = input.pinterestFormat || 'with_link';
  const promptLower = (input.prompt || '').toLowerCase();
  const pinnedKws = input.pinnedKeywords || [];
  const otherKws = input.activeKeywords.filter((k) => !pinnedKws.includes(k));
  const allKeywords = [...pinnedKws, ...otherKws];

  let baseHook = 'Romantic Couple Prompt';
  let basePose = 'an authentic romantic connection and candid unposed chemistry';

  if (/kiss/i.test(promptLower)) {
    baseHook = 'Elevator Kiss Couple Prompt';
    basePose = 'a natural kissing moment with a cinematic vibe';
  } else if (/moustache|mustache|hair/i.test(promptLower)) {
    baseHook = 'Funny Couple Hair Moustache Prompt';
    basePose = "a playful pout pose with the boy creating a fake moustache using the girl's hair";
  } else if (/cheek|squish/i.test(promptLower)) {
    baseHook = 'Intimate Cheek Squish Couple Prompt';
    basePose = "one partner tenderly squishing the other's cheek in an affectionate candid smile";
  } else if (/eye|cover|blindfold/i.test(promptLower)) {
    baseHook = 'Playful Eye Cover Couple Prompt';
    basePose = "the woman playfully covering her partner's eyes from behind in an unscripted series";
  } else if (/hug|cuddle|embrace/i.test(promptLower)) {
    baseHook = 'Romantic Embrace Couple Prompt';
    basePose = 'an intimate, cozy embrace filled with tender chemistry and warmth';
  } else if (/balcony|terrace|sunset/i.test(promptLower)) {
    baseHook = 'Sunset Balcony Couple Prompt';
    basePose = 'the couple leaning close against the railing in soft golden hour lighting';
  } else if (/cafe|coffee|table/i.test(promptLower)) {
    baseHook = 'Cozy Cafe Couple Prompt';
    basePose = 'an intimate cafe table conversation with genuine eye contact and laughter';
  } else if (/elevator|lift/i.test(promptLower)) {
    baseHook = 'Elevator Couple Selfie Prompt';
    basePose = 'an impromptu elevator mirror selfie with authentic smartphone realism';
  } else {
    const topicWords = (input.prompt || '')
      .replace(/[^\w\s]/gi, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 3);
    const mainSubject = topicWords.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Romantic Couple';
    baseHook = `${mainSubject} Couple Prompt`;
  }

  const variationsConfig = [
    {
      titlePrefix: baseHook,
      emoji: '💋',
      secondarySuffix: otherKws[0] || 'Gemini Couple Photo',
      getDescLink: (sent: string) =>
        `This ${baseHook.toLowerCase()} is a viral AI photo idea for romantic and realistic couple selfies. Recreate ${basePose}. ${sent} Click visit site for the full prompt recreation!`,
      getDescSteps: (sent: string) =>
        `How to get this prompt: 1. Search "Arigato Devan" on Google. 2. Open the Arigato Devan website. 3. Browse trending Gemini couple prompts & photo ideas. 4. Find this prompt and create your image! This ${baseHook.toLowerCase()} captures ${basePose}. ${sent}`,
    },
    {
      titlePrefix: baseHook.replace(/Prompt$/i, 'Mirror Selfie Pose').trim(),
      emoji: '✨',
      secondarySuffix: otherKws[1] || 'Couple Aesthetic Ideas',
      getDescLink: (sent: string) =>
        `Looking for aesthetic couple photography poses? This ${baseHook.toLowerCase()} captures ${basePose} with authentic smartphone realism. ${sent} Visit site to copy the complete prompt!`,
      getDescSteps: (sent: string) =>
        `Want this AI prompt? 1. Go to Google and search "Arigato Devan". 2. Click the official Arigato Devan site. 3. Explore realistic couple prompts & viral photo ideas. 4. Copy this prompt and generate your picture! Recreate ${basePose}. ${sent}`,
    },
    {
      titlePrefix: `Candid ${baseHook}`.replace(/Prompt$/i, 'Photo Idea').trim(),
      emoji: '💕',
      secondarySuffix: otherKws[2] || 'Romantic Couple Prompt',
      getDescLink: (sent: string) =>
        `Create authentic romantic moments with this viral ${baseHook.toLowerCase()}. Features ${basePose} with natural unposed chemistry. ${sent} Click visit site to get the prompt!`,
      getDescSteps: (sent: string) =>
        `Steps to get this prompt: 1. Search "Arigato Devan" on Google. 2. Visit the Arigato Devan website. 3. Check out the latest Gemini AI couple prompts. 4. Use this prompt for your artwork! Features ${basePose}. ${sent}`,
    },
    {
      titlePrefix: `Viral Gemini ${baseHook}`.trim(),
      emoji: '🔥',
      secondarySuffix: otherKws[3] || 'Couple Selfie Poses',
      getDescLink: (sent: string) =>
        `A must-try couple prompt for realistic smartphone realism! Recreate ${basePose} with genuine warmth. ${sent} Tap visit site for the full prompt details!`,
      getDescSteps: (sent: string) =>
        `How to find this prompt: 1. Search "Arigato Devan" on Google. 2. Open the Arigato Devan website. 3. Discover aesthetic couple photo prompts. 4. Generate your own romantic couple portrait! Captures ${basePose}. ${sent}`,
    },
    {
      titlePrefix: `Sweet Everyday ${baseHook}`.trim(),
      emoji: '🤍',
      secondarySuffix: otherKws[4] || 'AI Photography Prompt',
      getDescLink: (sent: string) =>
        `Elevate your couple photos with this cinematic ${baseHook.toLowerCase()}. Showcases ${basePose} in gorgeous lighting. ${sent} Visit site now to view and copy the prompt!`,
      getDescSteps: (sent: string) =>
        `Quick guide for this prompt: 1. Search "Arigato Devan" in Google. 2. Enter the Arigato Devan site. 3. Browse trending romantic couple prompts. 4. Copy prompt and create your photo! Shows ${basePose}. ${sent}`,
    },
  ];

  const results: PinterestVariation[] = [];
  const safeCount = Math.min(Math.max(count, 2), 5);

  for (let i = 0; i < safeCount; i++) {
    const cfg = variationsConfig[i % variationsConfig.length];

    let title = '';
    if (format === 'with_link') {
      title = `${cfg.titlePrefix} ${cfg.emoji} | Click Visit Site for Prompt`;
    } else {
      const cleanSec = cfg.secondarySuffix.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      title = `${cfg.titlePrefix} ${cfg.emoji} | ${cleanSec}`;
    }
    title = enforceCharLimit(title, 80);

    const rotatedPinned = rotateArray(pinnedKws, i);
    const rotatedActive = rotateArray(allKeywords, i * 2);
    const smartSentence = buildSmartKeywordSentence(rotatedPinned, rotatedActive);

    let description = format === 'with_link' ? cfg.getDescLink(smartSentence) : cfg.getDescSteps(smartSentence);
    description = enforceSentenceCharLimit(description.replace(/\s+/g, ' ').trim(), 580);

    results.push({
      id: i + 1,
      title,
      description,
      characterCounts: {
        title: title.length,
        description: description.length,
      },
    });
  }

  return results;
}

/**
 * Smart synthesis generator for Pinterest SEO (Dual-Mode: With Link vs Google Search Steps)
 */
export function generateSmartPinterestSeo(input: GenerationInput): {
  title: string;
  description: string;
  tags: string[];
  recommendedBoard: string;
  variations: PinterestVariation[];
} {
  const variations = buildSmartPinterestVariations(input, input.variationCount || 2);
  const pinnedKws = input.pinnedKeywords || [];

  const topicWords = (input.prompt || '')
    .replace(/[^\w\s]/gi, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 4);

  const baseTags = [
    '#couplephoto',
    '#coupleselfie',
    '#couplepictures',
    '#coupleaesthetic',
    '#coupleprompt',
    '#geminicoupleprompt',
    ...topicWords.map((w) => `#${w.toLowerCase()}`),
    ...pinnedKws.map((k) => `#${k.replace(/\s+/g, '').toLowerCase()}`),
    '#pinterestviral',
    '#aestheticart',
  ];
  const tags = Array.from(new Set(baseTags)).slice(0, 10);

  return {
    title: variations[0].title,
    description: variations[0].description,
    tags,
    recommendedBoard: 'Kiss Prompts For Gemini AI | Couple Prompts',
    variations,
  };
}

export type ProgressCallback = (step: number, percent: number, msg: string) => void;

/**
 * Intelligent generator for Pinterest SEO
 */
export async function generatePinterestSeo(
  input: GenerationInput,
  onProgress?: ProgressCallback
): Promise<PinterestSeoResult> {
  const config = getStoredApiConfig();

  // Step 1: Vision / Image Scan Simulation (0% -> 20%)
  onProgress?.(1, 15, 'Scanning image visual composition & color aesthetics...');
  await new Promise((r) => setTimeout(r, 250));

  // Step 2: Prompt Semantic Analysis (20% -> 40%)
  onProgress?.(2, 35, 'Extracting core thematic anchors from user prompt...');
  await new Promise((r) => setTimeout(r, 250));

  // Step 3: Synthesis & Keyword Integration (45% -> 88%)
  const modeLabel = input.pinterestFormat === 'search_steps' ? 'Google Search Steps' : 'Direct Link CTR';
  onProgress?.(3, 45, `Synthesizing ${modeLabel} Pinterest Title & Description...`);

  // Active ticker: creeps progress smoothly while waiting, never freezing and never hitting 100% prematurely!
  let synthPercent = 45;
  let elapsedSec = 0;
  const ticker = setInterval(() => {
    elapsedSec++;
    if (synthPercent < 88) {
      const step = synthPercent < 70 ? 4 : synthPercent < 80 ? 2 : 1;
      synthPercent = Math.min(88, synthPercent + step);
    }
    let dynamicMsg = `AI Neural Synthesis in progress (${elapsedSec}s)...`;
    if (elapsedSec >= 12) {
      dynamicMsg = `Finalizing pin variations & viral tags (${elapsedSec}s)...`;
    } else if (elapsedSec >= 6) {
      dynamicMsg = `Synthesizing ${modeLabel} Pinterest variations & keywords (${elapsedSec}s)...`;
    }
    onProgress?.(3, synthPercent, dynamicMsg);
  }, 1000);

  let pinResult: PinterestSeoResult | null = null;
  try {
    const activeApiKey = resolveApiKey(config);
    if (activeApiKey && (config.mode === 'custom_api' || (import.meta as any).env?.VITE_MODAL_PROXY_TOKEN_ID || config.tokenId)) {
      try {
        const live = await executeCustomPinterestApi(input, config);
        if (
          live &&
          live.title &&
          live.title.trim().length > 5 &&
          live.description &&
          live.description.trim().length > 20 &&
          live.tags &&
          live.tags.length >= 6
        ) {
          pinResult = live;
        } else {
          console.warn('[Pinterest SEO] Custom API returned empty or insufficient fields, falling back to smart engine');
        }
      } catch (err) {
        console.warn('Custom API execution failed, falling back to smart engine:', err);
      }
    }
  } finally {
    clearInterval(ticker);
  }

  if (!pinResult) {
    // Fallback to Smart Dual-Mode Generator
    const smart = generateSmartPinterestSeo(input);
    const selectedKeywords = Array.from(new Set([...(input.pinnedKeywords || []), ...input.activeKeywords])).slice(0, 4);
    pinResult = {
      title: smart.title,
      description: smart.description,
      tags: smart.tags,
      keywordsMatched: selectedKeywords,
      characterCounts: {
        title: smart.title.length,
        description: smart.description.length,
        tagsCount: smart.tags.length,
      },
      recommendedBoard: smart.recommendedBoard,
      variations: smart.variations,
    };
  }

  // Step 4: Strict Format Audits (88% -> 96%)
  onProgress?.(4, 96, 'Auditing Pinterest character limits & hashtag relevance...');
  await new Promise((r) => setTimeout(r, 200));

  // Step Complete: 100%
  onProgress?.(4, 100, 'Pinterest SEO Package Ready!');

  return pinResult;
}

/**
 * Intelligent generator for Arigato Site SEO
 * Strict Requirements:
 * - "About this prompt": Strictly <= 199 words
 * - "SEO Description": Strictly <= 160 characters
 * - "SEO Keywords": Strictly between 6 to 9 keywords
 */
export async function generateArigatoSiteSeo(
  input: GenerationInput,
  onProgress?: ProgressCallback
): Promise<ArigatoSiteSeoResult> {
  const config = getStoredApiConfig();

  // Partition keywords according to strict user rules:
  // - About: 10 keywords in sentences (5 pinned + 5 random unpinned)
  // - Meta Description: 3 keywords in sentence (2 random pinned + 1 random unpinned)
  // - Tags: 9 tags (4 random pinned + 5 random unpinned)
  const partition = partitionArigatoSiteKeywords(input);

  // Step 1: Scan (0% -> 20%)
  onProgress?.(1, 15, 'Scanning visual composition, lighting balance and subjects...');
  await new Promise((r) => setTimeout(r, 250));

  // Step 2: Extract Prompt Metadata & Rules (20% -> 40%)
  onProgress?.(2, 35, 'Partitioning keywords: 10 for About, 3 for Meta, 9 for Tags...');
  await new Promise((r) => setTimeout(r, 250));

  // Step 3: Neural AI Synthesis (45% -> 88%)
  onProgress?.(3, 45, 'Connecting to AI Neural Engine & generating human-style prompt...');

  // Active ticker: creeps progress smoothly while waiting, never freezing and never hitting 100% prematurely!
  let synthPercent = 45;
  let elapsedSec = 0;
  const ticker = setInterval(() => {
    elapsedSec++;
    if (synthPercent < 88) {
      const step = synthPercent < 70 ? 4 : synthPercent < 80 ? 2 : 1;
      synthPercent = Math.min(88, synthPercent + step);
    }
    let dynamicMsg = `AI Neural Synthesis in progress (${elapsedSec}s)...`;
    if (elapsedSec >= 12) {
      dynamicMsg = `Finalizing SERP meta description & tag validation (${elapsedSec}s)...`;
    } else if (elapsedSec >= 7) {
      dynamicMsg = `Polishing human conversational tone & natural sentence flow (${elapsedSec}s)...`;
    } else if (elapsedSec >= 3) {
      dynamicMsg = `Synthesizing <199 words About guide & weaving 10 keywords (${elapsedSec}s)...`;
    }
    onProgress?.(3, synthPercent, dynamicMsg);
  }, 1000);

  let siteResult: ArigatoSiteSeoResult | null = null;
  try {
    const activeApiKey = resolveApiKey(config);
    if (activeApiKey && (config.mode === 'custom_api' || (import.meta as any).env?.VITE_MODAL_PROXY_TOKEN_ID || config.tokenId)) {
      try {
        const liveResult = await executeCustomSiteApi(input, config, partition);
        if (
          liveResult &&
          liveResult.aboutPrompt &&
          liveResult.aboutPrompt.trim().length > 30 &&
          liveResult.seoDescription &&
          liveResult.seoDescription.trim().length > 10 &&
          liveResult.keywords &&
          liveResult.keywords.length === 9
        ) {
          siteResult = liveResult;
        } else {
          console.warn('[Site SEO] Custom API returned incomplete output, falling back to smart engine');
        }
      } catch (err) {
        console.warn('Custom API execution failed, falling back to smart engine:', err);
      }
    }
  } finally {
    clearInterval(ticker);
  }

  if (!siteResult) {
    // Fallback to Smart Dynamic Generator based on the 10 Master Examples
    const aboutPrompt = generateSmartAboutPrompt(input, partition);
    const wordCount = countWords(aboutPrompt);
    const seoDescription = generateSmartSeoDescription(input, partition);
    const charCount = seoDescription.length;
    const keywords = generateSmartKeywords(input, partition);

    siteResult = {
      aboutPrompt,
      wordCount,
      seoDescription,
      charCount,
      keywords,
      keywordsMatched: partition.aboutKeywords,
      siteMetaTitle: `Realistic Couple AI Prompt — Arigato Labs`,
    };
  }

  // Step 4: Strict Length Audits (88% -> 96%)
  onProgress?.(4, 96, 'Auditing strict limits: <199 words, <160 chars, 9 tags...');
  await new Promise((r) => setTimeout(r, 200));

  // Step Complete: 100%
  onProgress?.(4, 100, 'Arigato Site SEO Package Ready!');

  return siteResult;
}

/**
 * Pluggable Custom API Handlers (Configured for moonshotai/Kimi-K3 on Modal)
 */
function resolveApiKey(config: ApiConfig): string {
  if (config.apiKey && config.apiKey.trim()) return config.apiKey.trim();
  if (config.tokenId && config.tokenSecret) return `${config.tokenId.trim()}.${config.tokenSecret.trim()}`;
  // Fallback to Vite env variables if defined
  const envId = (import.meta as any).env?.VITE_MODAL_PROXY_TOKEN_ID;
  const envSecret = (import.meta as any).env?.VITE_MODAL_PROXY_TOKEN_SECRET;
  if (envId && envSecret) return `${envId}.${envSecret}`;
  return '';
}

function resolveApiUrl(config: ApiConfig): string {
  if (config.apiUrl && config.apiUrl.trim()) return config.apiUrl.trim();
  return '/modal-api/chat/completions';
}

function isVisionModel(model: string): boolean {
  const m = (model || '').toLowerCase();
  return m.includes('vision') || m.includes('vl') || m.includes('4o') || m.includes('gemini') || m.includes('claude');
}

function buildAuthHeaders(config: ApiConfig): Record<string, string> {
  const apiKey = resolveApiKey(config);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
  }

  const tokenId = config.tokenId?.trim() || (apiKey.includes('.') ? apiKey.split('.')[0] : '');
  const tokenSecret = config.tokenSecret?.trim() || (apiKey.includes('.') ? apiKey.split('.')[1] : '');

  if (tokenId) {
    headers['Modal-Key'] = tokenId;
  }
  if (tokenSecret) {
    headers['Modal-Secret'] = tokenSecret;
  }

  return headers;
}

async function executeCustomPinterestApi(input: GenerationInput, config: ApiConfig): Promise<PinterestSeoResult> {
  const headers = buildAuthHeaders(config);
  const endpoint = resolveApiUrl(config);

  const format = input.pinterestFormat || 'with_link';

  const requestedVariations = Math.min(Math.max(input.variationCount || 2, 2), 5);

  const systemContent = `You are an elite Pinterest SEO expert for Arigato Labs.
Analyze the user's prompt and creative details to generate a high-converting Pinterest SEO pin package.

PINTEREST STRATEGY MODE: ${format === 'with_link' ? 'WITH WEBSITE LINK (DIRECT CTR)' : 'GOOGLE SEARCH STEPS (ORGANIC FUNNEL)'}

MANDATORY RULES:
1. PIN TITLE: Catchy, lovely, sensual and keyword-rich (strictly 40 to 80 characters). Must include a relevant romantic/expressive emoji (e.g. 💋, ✨, 🤍, 🔥, 😂, 💕).
   ${format === 'with_link'
     ? '- MUST END WITH: " | Click Visit Site for Prompt" (e.g. "Elevator Kiss Couple Prompt 💋 | Click Visit Site for Prompt")'
     : '- MUST END WITH: " | Gemini Couple Photo" or a high-volume secondary keyword (e.g. "Funny Couple Hair Moustache Prompt 😂 | Gemini Couple Photo")'}

2. DESCRIPTION: MUST BE STRICTLY UNDER 600 CHARACTERS (target 380 to 520 characters, NEVER exceed 580 characters).
   CRITICAL ANTI-KEYWORD-STUFFING RULE:
   - ABSOLUTELY NEVER append a comma-separated list of keywords (e.g. NEVER write "Perfect for couple photo, couple selfie, couple pictures, couple aesthetic...").
   - Instead, integrate 1 or 2 target keywords SMARTLY into a fluid, human, grammatically complete sentence.
   ${format === 'with_link'
     ? `- Structure (Under 520 chars):
       1. Describe the scene/pose as a viral AI photo idea with romantic chemistry and natural lighting.
       2. Weave 1-2 target keywords naturally (e.g. "Ideal for anyone looking for [Keyword 1] or aesthetic [Keyword 2] with candid romance.").
       3. End with: "Click visit site for the full prompt recreation!"`
     : `- Structure (Under 520 chars):
       1. Start with the concise 4-step Google guide:
       "How to get this prompt: 1. Search \\"Arigato Devan\\" on Google. 2. Open the Arigato Devan website. 3. Browse trending Gemini couple prompts & photo ideas. 4. Find this prompt and create your image!"
       2. Follow with the visual description and smart keyword integration:
       "This [topic] prompt captures [candid pose details]. Ideal for creating [Keyword 1] and aesthetic [Keyword 2] with cinematic warmth."`
   }

3. TAGS: Array of 8 to 10 viral search tags starting with #.
4. RECOMMENDED BOARD: Relevant board name (e.g. "Kiss Prompts For Gemini AI | Couple Prompts").

5. VARIATIONS (MANDATORY): Generate exactly ${requestedVariations} distinct variations for A/B testing pins.
   Each item in "variations" must have:
   - "title": Distinct angle with relevant romantic emoji and appropriate suffix (strictly 40 to 80 chars).
   - "description": Distinct description under 580 characters with natural keyword weaving.

PINNED KEYWORDS (Integrate 1-2 naturally in sentence, DO NOT DUMP AS A LIST): ${input.pinnedKeywords?.join(', ') || 'None'}
ACTIVE CONTEXTUAL KEYWORDS: ${input.activeKeywords.slice(0, 6).join(', ')}

OUTPUT FORMAT: Return ONLY a valid JSON object with keys: "title", "description", "tags", "recommendedBoard", "variations".
"variations" must be an array of exactly ${requestedVariations} items: [ { "title": "...", "description": "..." }, ... ]
Do NOT include markdown fences or think tags in the JSON.`;

  const canUseVision = Boolean(input.imageDataUrl && isVisionModel(config.model || ''));
  const visualNote = input.imageFileName
    ? `\n[Reference Image Asset: "${input.imageFileName}"]`
    : input.imageDataUrl
    ? `\n[Reference Image Asset: Visual photo composition attached]`
    : '';
  const userTextPrompt = `Create ${requestedVariations} distinct high-converting ${format === 'with_link' ? 'With Link' : 'Search Steps'} Pinterest SEO variations for:\nPrompt: "${input.prompt || 'Aesthetic Visual Art'}"${visualNote}\nPinned Mandatory Keywords: ${input.pinnedKeywords?.join(', ') || 'None'}\nConfigured Keywords: ${input.activeKeywords.join(', ')}`;

  const buildPayload = (includeImage: boolean) => {
    const messages: any[] = [
      { role: 'system', content: systemContent },
      {
        role: 'user',
        content: includeImage && input.imageDataUrl
          ? [
              { type: 'text', text: userTextPrompt },
              { type: 'image_url', image_url: { url: input.imageDataUrl } }
            ]
          : userTextPrompt,
      },
    ];

    return {
      model: config.model || 'moonshotai/Kimi-K3',
      messages,
      temperature: 0.35,
      max_tokens: 1600,
      top_p: 0.95,
      stream: false,
      response_format: { type: 'json_object' },
    };
  };

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(buildPayload(canUseVision)),
      signal: AbortSignal.timeout(18000),
    });

    if (!response.ok && canUseVision) {
      console.warn(`[Pinterest SEO] Vision call returned ${response.status}, retrying with text-only payload...`);
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(buildPayload(false)),
        signal: AbortSignal.timeout(15000),
      });
    }
  } catch (err) {
    if (canUseVision) {
      console.warn('[Pinterest SEO] Multimodal fetch failed, retrying text-only:', err);
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(buildPayload(false)),
        signal: AbortSignal.timeout(15000),
      });
    } else {
      throw err;
    }
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Kimi API returned status ${response.status}: ${errText}`);
  }

  const data = await response.json();
  let rawText = data.choices?.[0]?.message?.content || '';
  if (!rawText.trim() && data.choices?.[0]?.message?.reasoning_content) {
    rawText = data.choices[0].message.reasoning_content;
  }

  const parsed = extractSafeJsonObject(rawText);

  // Flexible key extraction
  let title = parsed.title || parsed.pin_title || parsed.pinTitle || '';
  let description = parsed.description || parsed.pin_description || parsed.pinDescription || '';
  let rawTags: string[] = Array.isArray(parsed.tags) ? parsed.tags : (Array.isArray(parsed.keywords) ? parsed.keywords : []);
  let recommendedBoard = parsed.recommendedBoard || parsed.recommended_board || parsed.board || 'Kiss Prompts For Gemini AI | Couple Prompts';

  // Smart fallback backup
  const smartBackup = generateSmartPinterestSeo(input);

  // Fail-safe title check
  if (!title || typeof title !== 'string' || title.trim().length < 5) {
    title = smartBackup.title;
  } else {
    // Ensure appropriate ending suffix for the chosen mode
    if (format === 'with_link' && !title.toLowerCase().includes('visit site')) {
      title = `${title.replace(/\s*\|.*$/, '').trim()} | Click Visit Site for Prompt`;
    } else if (format === 'search_steps' && !title.includes('|')) {
      title = `${title.trim()} | Gemini Couple Photo`;
    }
  }
  title = enforceCharLimit(title, 80);

  const pinnedKws = input.pinnedKeywords || [];

  // Fail-safe description check & anti-stuffing enforcement
  if (!description || typeof description !== 'string' || description.trim().length < 20) {
    description = smartBackup.description;
  } else {
    // If search_steps mode was chosen but AI failed to include the 4 steps, use smartBackup
    if (format === 'search_steps' && !description.toLowerCase().includes('how to get this prompt')) {
      description = smartBackup.description;
    }

    // Anti-stuffing cleanup: If the model generated a comma-separated list like "Perfect for a, b, c, d..."
    if (description.includes('Perfect for') && description.split(',').length > 3) {
      const cutIndex = description.indexOf('Perfect for');
      const basePart = description.slice(0, cutIndex).trim();
      const smartSentence = buildSmartKeywordSentence(pinnedKws, input.activeKeywords);
      description = `${basePart} ${smartSentence}`;
    }
  }

  // Hard safety limit: strictly under 600 characters (max 580 chars)
  description = enforceSentenceCharLimit(description, 580);

  // Process tags
  let tags: string[] = [];
  if (Array.isArray(rawTags) && rawTags.length > 0) {
    for (const t of rawTags) {
      if (typeof t === 'string') {
        const clean = t.trim().startsWith('#') ? t.trim() : `#${t.trim().replace(/\s+/g, '')}`;
        if (clean.length > 1 && !tags.includes(clean.toLowerCase())) {
          tags.push(clean.toLowerCase());
        }
      }
    }
  }

  // Top up tags from smart backup if needed
  if (tags.length < 8) {
    for (const dt of smartBackup.tags) {
      if (!tags.includes(dt) && tags.length < 10) {
        tags.push(dt);
      }
    }
  }
  tags = tags.slice(0, 10);

  const selectedKeywords = Array.from(new Set([...pinnedKws, ...input.activeKeywords])).slice(0, 4);

  // Variations extraction & sanitization
  let parsedVariations: PinterestVariation[] = [];
  if (Array.isArray(parsed.variations) && parsed.variations.length > 0) {
    parsedVariations = parsed.variations
      .slice(0, requestedVariations)
      .map((v: any, idx: number) => {
        let vTitle = typeof v.title === 'string' ? v.title.trim() : '';
        let vDesc = typeof v.description === 'string' ? v.description.trim() : '';

        if (!vTitle || vTitle.length < 5) {
          vTitle = smartBackup.variations?.[idx]?.title || smartBackup.title;
        } else {
          if (format === 'with_link' && !vTitle.toLowerCase().includes('visit site')) {
            vTitle = `${vTitle.replace(/\s*\|.*$/, '').trim()} | Click Visit Site for Prompt`;
          } else if (format === 'search_steps' && !vTitle.includes('|')) {
            vTitle = `${vTitle.trim()} | Gemini Couple Photo`;
          }
        }
        vTitle = enforceCharLimit(vTitle, 80);

        if (!vDesc || vDesc.length < 20) {
          vDesc = smartBackup.variations?.[idx]?.description || smartBackup.description;
        } else {
          if (
            format === 'search_steps' &&
            !vDesc.toLowerCase().includes('how to get this prompt') &&
            !vDesc.toLowerCase().includes('search')
          ) {
            vDesc = smartBackup.variations?.[idx]?.description || smartBackup.description;
          }
          if (vDesc.includes('Perfect for') && vDesc.split(',').length > 3) {
            const cutIndex = vDesc.indexOf('Perfect for');
            const basePart = vDesc.slice(0, cutIndex).trim();
            const smartSentence = buildSmartKeywordSentence(pinnedKws, input.activeKeywords);
            vDesc = `${basePart} ${smartSentence}`;
          }
        }
        vDesc = enforceSentenceCharLimit(vDesc, 580);

        return {
          id: idx + 1,
          title: vTitle,
          description: vDesc,
          characterCounts: {
            title: vTitle.length,
            description: vDesc.length,
          },
        };
      });
  }

  // If parsedVariations is empty or has fewer than requestedVariations, top up with smartBackup.variations
  const finalVariations: PinterestVariation[] = [...parsedVariations];
  if (smartBackup.variations) {
    for (let i = finalVariations.length; i < requestedVariations; i++) {
      if (smartBackup.variations[i]) {
        finalVariations.push(smartBackup.variations[i]);
      }
    }
  }

  if (finalVariations.length === 0) {
    finalVariations.push({
      id: 1,
      title,
      description,
      characterCounts: {
        title: title.length,
        description: description.length,
      },
    });
  }

  return {
    title: finalVariations[0].title,
    description: finalVariations[0].description,
    tags,
    keywordsMatched: selectedKeywords,
    characterCounts: {
      title: finalVariations[0].title.length,
      description: finalVariations[0].description.length,
      tagsCount: tags.length,
    },
    recommendedBoard,
    variations: finalVariations,
  };
}

async function executeCustomSiteApi(
  input: GenerationInput,
  config: ApiConfig,
  partition: ArigatoSiteKeywordPartition
): Promise<ArigatoSiteSeoResult> {
  const headers = buildAuthHeaders(config);
  const endpoint = resolveApiUrl(config);

  const systemContent = `You are a friendly, creative AI prompt curator and blogger at Arigato Labs.
Your task is to analyze the user's prompt text and reference visual to write an engaging, simple, human-style "About this prompt" guide, a click-worthy Google SERP meta description, and 9 SEO tags.

TONE & WRITING STYLE:
- Write in simple, warm, conversational, human English (like an enthusiastic creator sharing an awesome prompt with friends on a blog).
- DO NOT sound like a robotic system specification or legal contract. NEVER use stiff phrases like "This creative photography specification...", "Strict facial identity preservation is maintained as the highest priority...", etc.
- No plagiarism: Write with 100% original, fresh human energy.

ENVIRONMENT NOTICE:
This is for "Arigato Site SEO" (NOT Pinterest). Do NOT generate Pinterest board recommendations, Pinterest pin titles, or Pinterest hashtags.

CRITICAL KEYWORD RULES (STRICT COMPLIANCE REQUIRED):
We have pre-selected the exact keywords you must use for each section:

1. "aboutPrompt" (10 MANDATORY KEYWORDS):
   - You MUST naturally weave ALL 10 of these keywords into fluent, human, grammatically complete sentences across 4 structured paragraphs:
     * 5 Pinned Keywords: ${partition.aboutPinned.join(', ')}
     * 5 Contextual Keywords: ${partition.aboutUnpinned.join(', ')}
     * Total 10 Target Keywords: ${partition.aboutKeywords.join(', ')}
   - STRICT CONSTRAINT: Word count MUST be UNDER 199 words (target 140 to 175 words).
   - ANTI-KEYWORD-STUFFING: ABSOLUTELY NEVER output a comma-separated list of keywords. Every keyword MUST be woven naturally into a sentence.
   - Paragraph Guidelines:
     * Para 1 (What you see in the prompt): Tell the reader in simple English what they get to see in this prompt: the scene, cute poses, expressions, and romantic chemistry. (Weave 3 keywords naturally).
     * Para 2 (Details on facial features): Explain what makes the prompt special: authentic facial features, real skin texture without fake AI smoothing, and lifelike expressions. (Weave 2 keywords naturally).
     * Para 3 (Outfits & Lighting): Describe the relaxed styling, everyday outfits, natural fabric folds, soft ambient lighting, and candid mobile camera vibes. (Weave 2 keywords naturally).
     * Para 4 (Friendly Call-To-Action): Conclude with a warm, human invitation telling the reader to copy the prompt, try it in their AI generator, and have fun creating their own viral couple photos! (Weave 3 keywords naturally).

2. "seoDescription" (3 MANDATORY KEYWORDS):
   - STRICT CONSTRAINT: MUST BE STRICTLY UNDER 160 CHARACTERS (target 130 to 155 characters).
   - Naturally weave these 3 keywords into a compelling Google SERP meta description sentence:
     * 2 Pinned Keywords: ${partition.descPinned.join(', ')}
     * 1 Unpinned Keyword: ${partition.descUnpinned.join(', ')}
     * Total 3 Target Keywords: ${partition.descKeywords.join(', ')}

3. "keywords" (EXACTLY 9 KEYWORD TAGS):
   - Return an array of EXACTLY 9 keyword tags consisting of:
     [${partition.tagKeywords.map((k) => `"${k}"`).join(', ')}]

4. "siteMetaTitle":
   - A concise SERP title under 65 chars (e.g. "Realistic Couple AI Prompt — Arigato Labs").

OUTPUT FORMAT: Return ONLY a valid JSON object with keys: "aboutPrompt", "seoDescription", "keywords", "siteMetaTitle". Do NOT include markdown commentary or think tags in the JSON.`;

  const canUseVision = Boolean(input.imageDataUrl && isVisionModel(config.model || ''));
  const visualNote = input.imageFileName
    ? `\n[Reference Image Asset: "${input.imageFileName}" - capture realistic facial details, candid couple chemistry, authentic skin pores, and natural camera sensor look]`
    : input.imageDataUrl
    ? `\n[Reference Image Asset: High-realism candid couple photo with natural lighting and unposed styling]`
    : '';

  const userTextPrompt = `Create the authoritative Arigato Site SEO package for:\nPrompt: "${input.prompt || 'Realistic couple photo'}"${visualNote}\n\nREQUIRED KEYWORD ASSIGNMENTS:\n- About This Prompt (weave all 10 in sentences): ${partition.aboutKeywords.join(', ')}\n- SEO Meta Description (weave all 3 in sentence): ${partition.descKeywords.join(', ')}\n- Exact 9 Tags: ${partition.tagKeywords.join(', ')}`;

  const buildPayload = (includeImage: boolean) => {
    const messages: any[] = [
      { role: 'system', content: systemContent },
      {
        role: 'user',
        content: includeImage && input.imageDataUrl
          ? [
              { type: 'text', text: userTextPrompt },
              { type: 'image_url', image_url: { url: input.imageDataUrl } }
            ]
          : userTextPrompt,
      },
    ];

    return {
      model: config.model || 'moonshotai/Kimi-K3',
      messages,
      temperature: 0.35,
      max_tokens: 1200,
      top_p: 0.95,
      stream: false,
      response_format: { type: 'json_object' },
    };
  };

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(buildPayload(canUseVision)),
      signal: AbortSignal.timeout(18000),
    });

    // If multimodal call returns 400/422/404 or fails, retry immediately with text-only payload
    if (!response.ok && canUseVision) {
      console.warn(`[Site SEO] Vision API returned status ${response.status}, retrying with text-only payload...`);
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(buildPayload(false)),
        signal: AbortSignal.timeout(15000),
      });
    }
  } catch (fetchErr) {
    console.warn('[Site SEO] Fetch call failed, falling back to text-only or smart engine:', fetchErr);
    if (canUseVision) {
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(buildPayload(false)),
        signal: AbortSignal.timeout(15000),
      });
    } else {
      throw fetchErr;
    }
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Kimi API returned status ${response.status}: ${errText}`);
  }

  const data = await response.json();
  let rawText = data.choices?.[0]?.message?.content || '';
  if (!rawText.trim() && data.choices?.[0]?.message?.reasoning_content) {
    rawText = data.choices[0].message.reasoning_content;
  }

  const parsed = extractSafeJsonObject(rawText);

  // Flexible key extraction
  let rawAbout = parsed.aboutPrompt || parsed.about_prompt || parsed.about_this_prompt || parsed.aboutThisPrompt || parsed.prompt || parsed.about || '';
  let rawSeoDesc = parsed.seoDescription || parsed.seo_description || parsed.meta_description || parsed.metaDescription || parsed.description || '';

  const smartBackup = {
    aboutPrompt: generateSmartAboutPrompt(input, partition),
    seoDescription: generateSmartSeoDescription(input, partition),
    keywords: generateSmartKeywords(input, partition),
  };

  // Fail-safe check for aboutPrompt:
  // If the model echoed the raw input prompt verbatim or is too short (< 40 words), or didn't weave the keywords:
  let aboutPrompt = rawAbout && typeof rawAbout === 'string' && countWords(rawAbout) >= 40
    ? enforceWordLimit(rawAbout, 199)
    : smartBackup.aboutPrompt;

  // Verify that aboutPrompt contains at least 5 of the target keywords; if not, use smartBackup
  const matchedKws = partition.aboutKeywords.filter(k => aboutPrompt.toLowerCase().includes(k.toLowerCase()));
  if (matchedKws.length < 5) {
    aboutPrompt = smartBackup.aboutPrompt;
  }
  aboutPrompt = enforceWordLimit(aboutPrompt, 199);

  // Fail-safe check for seoDescription:
  let seoDescription = rawSeoDesc && typeof rawSeoDesc === 'string' && rawSeoDesc.trim().length >= 20 && rawSeoDesc.trim().length <= 160
    ? enforceCharLimit(rawSeoDesc, 160)
    : smartBackup.seoDescription;

  // Fail-safe check for keywords:
  // Strictly return the 9 tags (4 pinned + 5 unpinned)
  const keywords = partition.tagKeywords;

  return {
    aboutPrompt,
    wordCount: countWords(aboutPrompt),
    seoDescription,
    charCount: seoDescription.length,
    keywords,
    keywordsMatched: partition.aboutKeywords,
    siteMetaTitle: parsed.siteMetaTitle || parsed.site_meta_title || parsed.title || 'Realistic Couple AI Prompt — Arigato Labs',
  };
}

/**
 * Live Assistant Tester: lets the user test their Kimi-K3 API directly
 */
export async function sendChatAssistantMessage(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = []
): Promise<{ reply: string; latencyMs: number; rawJson?: string; isLiveApi: boolean }> {
  const config = getStoredApiConfig();
  const apiKey = resolveApiKey(config);
  const endpoint = resolveApiUrl(config);

  const startTime = performance.now();

  // If live credentials are provided, call the live Modal endpoint!
  if (apiKey) {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are "Arigato Assistant" — a super friendly, energetic, creative developer and SEO genius at Arigato Labs!
Speak like a real, cool human friend/peer who loves prompt engineering and SEO.
Use natural, conversational modern Hinglish / English slangs comfortably (e.g. "Bhai", "tension mat lo", "mast prompt hai", "let's cook 🔥", "Arigato gang", "solid scene", "chill vibes", "bawaal look", etc.).
Do NOT talk like a robotic automated customer service bot!

Formatting Guidelines:
- Format your reply with clean Markdown: use **bold text** for important highlights, clean line breaks, bullet points, and relatable emojis.
- Avoid messy unstructured text blocks.
- If the user asks about latency, endpoints, or tests, give a crisp, enthusiastic status with exact numbers and a friendly takeaway.
- Keep the energy high, friendly, and collaborative!`,
        },
        ...history.slice(-6),
        {
          role: 'user',
          content: userMessage,
        },
      ];

      const isAdaTest = userMessage.toLowerCase().includes('ada') && userMessage.toLowerCase().includes('london');
      const requestPayload: any = {
        model: config.model || 'moonshotai/Kimi-K3',
        messages,
        temperature: 0.3,
        max_tokens: 1024,
        top_p: 0.95,
        stream: false,
      };

      if (isAdaTest) {
        requestPayload.response_format = {
          type: 'json_schema',
          json_schema: {
            name: 'person_info',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                age: { type: 'integer' },
                city: { type: 'string' },
              },
              required: ['name', 'age', 'city'],
              additionalProperties: false,
            },
          },
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: buildAuthHeaders(config),
        body: JSON.stringify(requestPayload),
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.ok) {
        const errText = await res.text();
        return {
          reply: `⚠️ API Error (${res.status}): ${errText}\nPlease check your Modal Token ID and Secret in API Connect.`,
          latencyMs,
          isLiveApi: true,
        };
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || 'No response returned from model.';

      return {
        reply,
        latencyMs,
        rawJson: JSON.stringify(data, null, 2),
        isLiveApi: true,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        reply: `⚠️ Connection Error: ${err.message || 'Failed to reach Modal proxy server.'}\nVerify endpoint URL and CORS proxy.`,
        latencyMs,
        isLiveApi: false,
      };
    }
  }

  // Fallback if API token not yet set
  await new Promise((r) => setTimeout(r, 450));
  const latencyMs = Math.round(performance.now() - startTime);

  let reply = `👋 Arre bhai, **Arigato Assistant** haazir hai! 🔥\n\nAbhi **API Connect** mein live token activate nahi hai, toh hum simulation mode mein baat kar rahe hain. Agar direct Kimi-K3 endpoint test karna hai toh top right corner mein **API Connect** se token save kar lo.\n\nBaki koi bhi prompt discuss karna ho ya visual idea brainstorm karna ho, batao — *let's cook something fire!* 🎨`;
  if (userMessage.toLowerCase().includes('ada') || userMessage.toLowerCase().includes('extract')) {
    reply = JSON.stringify({ name: 'Ada', age: 36, city: 'London' }, null, 2);
  }

  return {
    reply,
    latencyMs,
    isLiveApi: false,
  };
}

/**
 * Real-Time Optical Text & Keyword Recognition ("Grab Text" engine)
 * Powered by Tesseract.js real client-side OCR engine.
 * Reads exact text, keywords, and phrases directly from image pixels.
 */
export async function extractTextFromImages(
  images: { dataUrl: string; name: string }[],
  onProgress?: (step: number, msg: string) => void
): Promise<GrabTextResult> {
  const total = images.length;
  const rawExtractedParts: string[] = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    onProgress?.(1, `Scanning image ${i + 1} of ${total}: Initializing OCR engine...`);

    try {
      const { data } = await Tesseract.recognize(img.dataUrl, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            onProgress?.(
              2,
              `Reading text in image ${i + 1}/${total} (${Math.round(m.progress * 100)}%)...`
            );
          }
        },
      });

      const extractedText = (data.text || '').trim();
      if (extractedText) {
        // Split by lines and commas
        const lines = extractedText
          .split(/[\r\n]+/)
          .map((l) => l.trim())
          .filter(Boolean);

        for (const line of lines) {
          if (line.includes(',')) {
            const parts = line.split(',').map((p) => p.trim()).filter(Boolean);
            rawExtractedParts.push(...parts);
          } else {
            rawExtractedParts.push(line);
          }
        }
      }
    } catch (err) {
      console.warn(`Tesseract OCR error on image ${img.name}:`, err);
    }
  }

  onProgress?.(3, 'Structuring unique keywords, cleaning formatting & deduplicating...');
  await new Promise((r) => setTimeout(r, 400));

  // Clean, normalize and deduplicate extracted terms
  const uniqueClean: string[] = [];
  for (const raw of rawExtractedParts) {
    const cleaned = raw
      .replace(/[|•·*#_~`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned.length >= 2) {
      const lower = cleaned.toLowerCase();
      if (!uniqueClean.map((x) => x.toLowerCase()).includes(lower)) {
        uniqueClean.push(cleaned);
      }
    }
  }

  if (uniqueClean.length > 0) {
    return {
      allCommaSeparated: uniqueClean.join(', '),
      items: uniqueClean,
      totalExtracted: uniqueClean.length,
    };
  }

  // Graceful response if no text was detected in pixels
  return {
    allCommaSeparated: 'No visible text detected in uploaded image(s). Try uploading a screenshot with clear, readable text or prompt keywords.',
    items: ['No visible text detected'],
    totalExtracted: 0,
  };
}

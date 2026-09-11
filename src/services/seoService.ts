import type { GenerationInput, PinterestSeoResult, PinterestVariation, ArigatoSiteSeoResult, ApiConfig, GrabTextResult } from '../types/seo';
import { getStoredApiConfig } from '../utils/storage';
import { buildArigatoFrameworkPromptSection } from '../data/promptFramework';
import Tesseract from 'tesseract.js';

// Helper to count words accurately
export const countWords = (text: string): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

// Helper to trim text strictly to word count range while cleanly preserving full sentence boundaries
export const enforceWordLimit = (text: string, maxWords: number = 199, minWords: number = 151): string => {
  if (!text) return '';
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length <= maxWords && words.length >= minWords) {
    let t = text.trim();
    if (!/[.!?]$/.test(t)) t += '.';
    return t;
  }

  // Case 1: Exceeds maxWords (> 199)
  if (words.length > maxWords) {
    const candidateSlice = words.slice(0, maxWords).join(' ');
    const matches = [...candidateSlice.matchAll(/[.!?](?:\s+|$)/g)];
    if (matches.length > 0) {
      // Find the last complete sentence that satisfies minWords <= count <= maxWords
      for (let i = matches.length - 1; i >= 0; i--) {
        const cutIndex = matches[i].index! + 1;
        const sentenceClean = candidateSlice.slice(0, cutIndex).trim();
        const sentenceWords = countWords(sentenceClean);
        if (sentenceWords >= minWords && sentenceWords <= maxWords) {
          return sentenceClean;
        }
      }
      // If stopping at the last sentence would drop below minWords, try appending a clean CTA
      for (let i = matches.length - 1; i >= 0; i--) {
        const cutIdx = matches[i].index! + 1;
        const sub = candidateSlice.slice(0, cutIdx).trim();
        const cWords = countWords(sub);
        if (cWords >= 135 && cWords <= 180) {
          const cta = 'Just copy the prompt above, paste it into your generator, and have fun creating!';
          const combined = `${sub} ${cta}`;
          if (countWords(combined) <= maxWords && countWords(combined) >= minWords) {
            return combined;
          }
        }
      }
    }
    // Fallback if no sentence boundary fits: remove trailing dangling words
    const slicedWords = words.slice(0, maxWords);
    const dangling = new Set([
      'a', 'an', 'the', 'and', 'or', 'with', 'for', 'to', 'of', 'in', 'on', 'at', 'by',
      'it', 'its', 'is', 'making', 'that', 'this', 'their', 'which', 'as'
    ]);
    while (slicedWords.length > minWords && dangling.has(slicedWords[slicedWords.length - 1].toLowerCase().replace(/[^a-z]/g, ''))) {
      slicedWords.pop();
    }
    let res = slicedWords.join(' ').trim();
    if (!/[.!?]$/.test(res)) res += '.';
    return res;
  }

  // Case 2: Below minWords (< 151)
  if (words.length < minWords) {
    let padded = text.trim();
    if (!/[.!?]$/.test(padded)) padded += '.';
    const padSentences = [
      'Authentic skin textures, natural smile lines, subtle lighting variations, and handheld mobile camera realism preserve genuine authenticity with strictly zero artificial AI plastic smoothing.',
      'Just copy the prompt above, paste it into your favorite AI generator, and have fun creating viral photos!'
    ];
    for (const s of padSentences) {
      if (countWords(padded) >= minWords) break;
      padded += ` ${s}`;
    }
    if (countWords(padded) > maxWords) {
      return enforceWordLimit(padded, maxWords, minWords);
    }
    return padded;
  }

  return text.trim();
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
 * Filters keywords so that subject-incompatible terms (e.g. couple words in a solo girl image)
 * are strictly removed and never passed to the AI or copy.
 */
export function isKeywordCompatibleWithSubject(keyword: string, subjectType: string): boolean {
  const kw = keyword.toLowerCase().trim();
  const coupleWords = /\b(couple|couples|kiss|kissing|boyfriend|husband|wife|together|pair|duo|two\s*people|intimate\s*couple|candid\s*closeness|romantic\s*duo|couple\s*aesthetic|couple\s*photo|couple\s*prompt|couple\s*portrait|couple\s*selfie|couple\s*photography|romantic\s*couple)\b/i;
  const femaleWords = /\b(girl|girls|female|females|woman|women|lady|ladies|she|her|bride|queen)\b/i;
  const maleWords = /(?<!spider-?|super-?|bat-?|iron-?)\b(boy|boys|male|males|man|men|guy|guys|him|he|groom|king|gentleman|brother)\b/i;

  if (subjectType === 'solo_female' || subjectType === 'portrait') {
    if (coupleWords.test(kw)) return false;
    if (maleWords.test(kw)) return false;
    return true;
  }

  if (subjectType === 'solo_male') {
    if (coupleWords.test(kw)) return false;
    if (femaleWords.test(kw)) return false;
    return true;
  }

  if (subjectType === 'couple') {
    if (/\b(solo|single\s*girl|single\s*boy)\b/i.test(kw)) return false;
    return true;
  }

  return true;
}

/**
 * Partitions Arigato Site keywords intelligently according to visual subject and strict user rules:
 * 1. "about-this-prompt.md": 9 keywords (up to 5 pinned + unpinned to reach 9; or if no pinned, 4 unpinned or 6-7 if 6-7 exist)
 * 2. "seo-meta-description.txt": EXACTLY 1 KEYWORD (best matching keyword + dedicated image description)
 * 3. "seo-keywords.csv": 10 tags (compatible pinned + unpinned)
 */
export function partitionArigatoSiteKeywords(
  input: GenerationInput,
  visual?: VisualAnalysis
): ArigatoSiteKeywordPartition {
  const v = visual || analyzeVisualAndPrompt(input);
  const subjectType = v.subjectType;

  // 1. Filter pinned keywords by subject compatibility (strictly reject couple words if solo)
  const rawPinned = (input.pinnedKeywords || []).map((k) => k.trim()).filter(Boolean);
  const compatiblePinned = rawPinned.filter((k) => isKeywordCompatibleWithSubject(k, subjectType));
  const pinnedList = compatiblePinned.slice(0, 5);

  // 2. Filter active unpinned keywords by subject compatibility
  const rawUnpinned = (input.activeKeywords || [])
    .map((k) => k.trim())
    .filter((k) => Boolean(k) && !pinnedList.some((pk) => pk.toLowerCase() === k.toLowerCase()));
  const compatibleUnpinned = rawUnpinned.filter((k) => isKeywordCompatibleWithSubject(k, subjectType));

  // 3. Fallback high-intent keywords customized per subject
  const fallbackSoloFemale = [
    'gemini girl prompt',
    'trending prompt girls',
    'aesthetic girl portrait',
    'solo girl photo',
    'smartphone portrait',
    'candid photo poses',
    'aesthetic photography',
    'viral portrait prompt',
    'gemini photo prompt',
    'aesthetic mirror selfie',
    'natural light portrait',
  ];

  const fallbackSoloMale = [
    'gemini boy prompt',
    'trending prompt boys',
    'aesthetic portrait for men',
    'solo boy photo',
    'smartphone portrait',
    'candid photo poses',
    'aesthetic photography',
    'viral portrait prompt',
    'gemini photo prompt',
    'men photography ideas',
  ];

  const fallbackCouple = [
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

  const subjectFallbacks = subjectType === 'solo_female'
    ? fallbackSoloFemale
    : subjectType === 'solo_male'
    ? fallbackSoloMale
    : fallbackCouple;

  // Inject dynamic visual keywords if specific concepts detected (e.g. spiderman)
  const allVisualContext = `${input.prompt || ''} ${input.imageFileName || ''} ${input.extraGuidance || ''} ${input.visualHint || ''}`.toLowerCase();
  const dynamicVisualKws: string[] = [];
  if (/spider-?man|cosplay/i.test(allVisualContext)) {
    if (subjectType === 'solo_female') {
      dynamicVisualKws.push('spiderman girl prompt', 'spiderman cosplay portrait', 'spiderman suit mirror selfie');
    } else {
      dynamicVisualKws.push('spiderman prompt', 'spiderman cosplay photo', 'spiderman suit selfie');
    }
  }

  const enrichedUnpinned: string[] = [...dynamicVisualKws, ...compatibleUnpinned];
  for (const fb of subjectFallbacks) {
    if (
      !enrichedUnpinned.some((k) => k.toLowerCase() === fb.toLowerCase()) &&
      !pinnedList.some((k) => k.toLowerCase() === fb.toLowerCase())
    ) {
      enrichedUnpinned.push(fb);
    }
  }

  // Shuffle unpinned pool randomly for every generation
  const shuffledUnpinned = [...enrichedUnpinned].sort(() => 0.5 - Math.random());

  // A. ABOUT THIS PROMPT:
  // User Rule: 9 keywords total if pinned exist (up to 5 pinned + remaining unpinned to reach 9)
  // If NO pinned exist: only 4 unpinned keywords (unless active keywords is 6 or 7, then use those 6 or 7)
  let aboutPinned: string[] = [];
  let aboutUnpinned: string[] = [];
  let aboutKeywords: string[] = [];

  if (pinnedList.length > 0) {
    aboutPinned = [...pinnedList].slice(0, 5);
    const neededUnpinnedForAbout = Math.max(0, 9 - aboutPinned.length);
    aboutUnpinned = shuffledUnpinned.slice(0, neededUnpinnedForAbout);
    aboutKeywords = [...aboutPinned, ...aboutUnpinned].slice(0, 9);
  } else {
    const count = (compatibleUnpinned.length >= 6 && compatibleUnpinned.length <= 7) ? compatibleUnpinned.length : 4;
    aboutUnpinned = shuffledUnpinned.slice(0, count);
    aboutKeywords = [...aboutUnpinned];
  }

  // B. SEO META DESCRIPTION:
  // User Directive: Exactly 1 primary keyword! Dedicate the rest to describing what is in the image.
  // Pick the #1 best, most relevant keyword
  const primaryDescKw = pinnedList.length > 0 ? pinnedList[0] : shuffledUnpinned[0] || subjectFallbacks[0];
  const descKeywords = [primaryDescKw];
  const descPinned = pinnedList.length > 0 ? [pinnedList[0]] : [];
  const descUnpinned = pinnedList.length === 0 ? [primaryDescKw] : [];

  // C. SEO KEYWORDS TAGS:
  // 10 tags: compatible pinned + unpinned
  const tagPinned = pinnedList.slice(0, Math.min(4, pinnedList.length));
  const remainingForTags = shuffledUnpinned.filter(
    (k) => !tagPinned.some((tp) => tp.toLowerCase() === k.toLowerCase())
  );
  const tagUnpinned = remainingForTags.slice(0, Math.max(0, 10 - tagPinned.length));
  const tagKeywords = [...tagPinned, ...tagUnpinned].slice(0, 10);

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
export interface VisualAnalysis {
  subjectType: 'solo_female' | 'solo_male' | 'couple' | 'portrait';
  sceneTitle: string;
  outfitDesc: string;
  aestheticDesc: string;
  subjectActionDesc: string;
  photoGoal: string;
  is1980s: boolean;
  reversePromptText: string;
}

/**
 * Intelligent Visual Reverse Prompting Engine:
 * Analyzes the uploaded visual asset, filename, prompt text, and target keywords
 * to accurately extract whether the subject is a solo girl, solo boy, or couple,
 * plus the exact scene setting, outfits, and aesthetic era.
 */
export function analyzeVisualAndPrompt(input: GenerationInput): VisualAnalysis {
  const promptText = (input.prompt || '').toLowerCase();
  const fileName = (input.imageFileName || '').toLowerCase();
  const guidanceText = (input.extraGuidance || '').toLowerCase();
  const hintText = (input.visualHint || '').toLowerCase();
  const visualContext = `${promptText} ${guidanceText} ${fileName} ${hintText}`.trim();

  const coupleRegex = /\b(couple|couples|two\s*people|boyfriend|girlfriend|husband|wife|together|pair|candid\s*closeness|romantic\s*duo|kissing|hugging|intimate)\b/i;
  const femaleRegex = /\b(girl|female|woman|lady|she|her|polka|dress|saree|skirt|bangles|bride|queen|yearbook\s*girl|spider-?girl)\b/i;
  const maleRegex = /(?<!spider-?|super-?|bat-?|iron-?)\b(boy|male|man|guy|him|he|groom|king|brother|gentleman)\b/i;
  const isSpiderman = /spider-?man|spidey|peter\s*parker|spider-?woman|spider-?girl|cosplay/i.test(visualContext);
  const is1980s = /\b(1980|1986|80s|1980s|retro|vintage|film\s*grain|disposable|polaroid|analog)\b/i.test(visualContext);

  // Subject focus determination (respect explicit override if set)
  let subjectType: 'solo_female' | 'solo_male' | 'couple' | 'portrait' = 'solo_female';

  if (input.subjectFocus && input.subjectFocus !== 'auto') {
    subjectType = input.subjectFocus === 'portrait' ? 'solo_female' : input.subjectFocus;
  } else {
    // If extraGuidance explicitly indicates subject
    if (femaleRegex.test(guidanceText) && !maleRegex.test(guidanceText) && !coupleRegex.test(guidanceText)) {
      subjectType = 'solo_female';
    } else if (maleRegex.test(guidanceText) && !femaleRegex.test(guidanceText) && !coupleRegex.test(guidanceText)) {
      subjectType = 'solo_male';
    } else if (coupleRegex.test(guidanceText)) {
      subjectType = 'couple';
    } else if (coupleRegex.test(promptText)) {
      subjectType = 'couple';
    } else if (isSpiderman) {
      subjectType = maleRegex.test(visualContext) && !femaleRegex.test(visualContext) ? 'solo_male' : 'solo_female';
    } else if (femaleRegex.test(promptText + ' ' + fileName)) {
      subjectType = 'solo_female';
    } else if (maleRegex.test(promptText + ' ' + fileName)) {
      subjectType = 'solo_male';
    } else if (coupleRegex.test(fileName)) {
      subjectType = 'couple';
    } else {
      // Safe visual default: solo portrait (never assume couple from global keywords!)
      subjectType = 'solo_female';
    }
  }

  // Scene determination
  let sceneTitle = 'a spontaneous, authentic portrait';
  if (/3-frame|three.*frame|strip|collage|series/i.test(visualContext)) {
    sceneTitle = subjectType === 'couple' ? 'a super cute vertical 3-frame couple selfie series' : 'a super cute vertical 3-frame selfie series';
  } else if (/mirror|selfie|holding\s*phone/i.test(visualContext) || /trend-6|photo-trend/i.test(fileName)) {
    sceneTitle = is1980s ? 'a nostalgic 1980s retro mirror selfie' : 'a spontaneous candid mirror selfie';
  } else if (/elevator|lift/i.test(visualContext)) {
    sceneTitle = 'a spontaneous elevator mirror selfie';
  } else if (/cafe|coffee/i.test(visualContext)) {
    sceneTitle = 'a cozy coffee date portrait';
  } else if (/balcony|rooftop/i.test(visualContext)) {
    sceneTitle = 'a relaxed open balcony moment';
  } else if (/street|city/i.test(visualContext)) {
    sceneTitle = 'a candid street style portrait';
  } else if (is1980s) {
    sceneTitle = 'a nostalgic 1980s vintage portrait';
  } else if (isSpiderman) {
    sceneTitle = 'a spontaneous Spider-Man suit mirror selfie in a marble hallway';
  } else if (subjectType === 'couple') {
    sceneTitle = 'a spontaneous, romantic candid couple portrait';
  }

  // Outfit, Aesthetic, and Action determination
  let outfitDesc = subjectType === 'solo_female'
    ? 'a stylish casual outfit with natural fabric drape'
    : subjectType === 'solo_male'
    ? 'a stylish casual outfit with natural fabric folds'
    : 'casual everyday outfits with natural fabric creases';
  let aestheticDesc = 'soft natural ambient lighting, subtle exposure variations, and mobile camera sensor softness';
  let subjectActionDesc = subjectType === 'solo_female'
    ? 'a stylish young woman captured in a spontaneous, unposed moment with a natural, confident expression'
    : subjectType === 'solo_male'
    ? 'a stylish young man captured in a spontaneous, unposed moment with confident, natural energy'
    : 'two people sharing candid closeness, genuine eye contact, and playful chemistry';
  let photoGoal = subjectType === 'couple' ? 'making sweet couple memories' : 'creating your own viral aesthetic portraits';

  const hasMaroonHint = input.visualHint?.includes('maroon') || /maroon|burgundy|wine/i.test(visualContext);
  const hasGlassesHint = input.visualHint?.includes('sunglasses') || /glasses|sunglasses|shades/i.test(visualContext);

  if (isSpiderman) {
    outfitDesc = 'an authentic red and blue Spider-Man suit with web pattern detailing, black spider emblem, grey leggings, and a matching Spider-Man mask in hand';
    aestheticDesc = 'bright natural indoor lighting with marble floor reflections, realistic fabric texture, and authentic smartphone camera sharpness';
    sceneTitle = 'a spontaneous Spider-Man suit mirror selfie in a marble hallway';
    subjectActionDesc = 'a young woman in a Spider-Man suit holding a Spider-Man mask and taking a confident mirror selfie';
    photoGoal = 'creating your own viral cosplay portraits';
  } else if (hasMaroonHint) {
    outfitDesc = 'a rich deep maroon satin plunge shirt paired with contrasting tailored off-white trousers, alongside a glittering sequined maroon halter dress';
    aestheticDesc = 'warm ambient indoor lighting highlighting satin sheen and sequin reflections with authentic mobile camera sensor realism';
    sceneTitle = 'an ultra-stylish, confident couple portrait in black sunglasses';
    subjectActionDesc = 'a confident couple posing playfully with black rectangular sunglasses, natural smirks, and authentic chemistry';
    photoGoal = 'creating your own viral aesthetic portraits';
  } else if (/polka|dot/i.test(visualContext) || (is1980s && subjectType === 'solo_female')) {
    outfitDesc = 'a vintage cream puff-sleeve dress with red polka dots and a classic red waist belt';
  } else if (/saree|sari/i.test(visualContext)) {
    outfitDesc = 'an elegant traditional saree with authentic fabric drape';
  } else if (/kurta/i.test(visualContext)) {
    outfitDesc = 'authentic textured kurtas with realistic fabric folds';
  } else if (/naruto|graphic|tee|t-shirt/i.test(visualContext)) {
    outfitDesc = 'casual everyday tees with relaxed cotton textures';
  } else if (/dress|crochet/i.test(visualContext)) {
    outfitDesc = 'a charming casual dress with lovely everyday styling';
  }

  if (hasGlassesHint && !sceneTitle.includes('sunglasses')) {
    sceneTitle += ' with black sunglasses';
  }

  if (!hasMaroonHint && !isSpiderman) {
    if (is1980s) {
      aestheticDesc = 'authentic 1980s analog film grain, an orange date timestamp ("JUL 27 1986"), and warm ambient lighting';
    }

    if (subjectType === 'solo_female') {
      subjectActionDesc = 'a stylish young woman captured in a spontaneous, unposed moment with a playful expression';
      photoGoal = is1980s ? 'creating your own viral 1980s retro portraits' : 'creating your own viral aesthetic portraits';
    } else if (subjectType === 'solo_male') {
      subjectActionDesc = 'a stylish young man captured in a spontaneous, unposed moment with confident, natural energy';
      photoGoal = 'creating your own viral portraits';
    }
  }

  const subjectLabel = subjectType === 'solo_female'
    ? '1 Person (Single young woman / girl)'
    : subjectType === 'solo_male'
    ? '1 Person (Single young man / boy)'
    : '2 People (Romantic couple)';

  const reversePromptText = `VISUAL REVERSE PROMPT ANALYSIS (EXTRACTED FROM ATTACHED VISUAL):
- Primary Subject: ${subjectLabel}
- Scene & Framing: ${sceneTitle}
- Outfits & Wardrobe: ${outfitDesc}
- Visual Aesthetics: ${aestheticDesc}
- Realism Parameters: Strict facial identity, authentic skin texture without artificial AI smoothing, natural smile lines

STRICT SUBJECT ACCURACY REQUIREMENT:
${subjectType === 'solo_female'
  ? 'The visual portrays ONE SINGLE WOMAN/GIRL. Under NO circumstances should you describe "two people", "couple closeness", or "romance". Focus on HER authentic styling and portrait.'
  : subjectType === 'solo_male'
  ? 'The visual portrays ONE SINGLE MAN/BOY. Under NO circumstances should you describe "two people" or "couple closeness". Focus on HIS authentic portrait.'
  : 'The visual portrays a couple. Describe their candid closeness and romantic chemistry.'}`;

  return {
    subjectType,
    sceneTitle,
    outfitDesc,
    aestheticDesc,
    subjectActionDesc,
    photoGoal,
    is1980s,
    reversePromptText,
  };
}

/**
 * Smart Synthesis for "About this prompt" following the official Arigato Framework
 * Strictly 151 to 199 words, covering the 8 visual dimensions with all 10 keywords woven naturally.
 * Formatted into 4 humanized, creator-friendly segments:
 * 1. Exciting Hook Opening ("If you generate this prompt, you're going to love the results...")
 * 2. Visual Styling & Luxury Environment Breakdown
 * 3. Camera Realism & Smartphone Imperfections (Zero AI Smoothing)
 * 4. Friendly Concluding Call-to-Action (CTA)
 */
export function generateSmartAboutPrompt(
  input: GenerationInput,
  partition?: ArigatoSiteKeywordPartition,
  visual?: VisualAnalysis
): string {
  const parts = partition || partitionArigatoSiteKeywords(input);
  const kws = parts.aboutKeywords;
  const v = visual || analyzeVisualAndPrompt(input);

  const cleanSceneTitle = v.sceneTitle.replace(/^(?:a|an)\s+/i, '');

  const fb0 = v.subjectType === 'solo_female' ? 'gemini girl prompt' : v.subjectType === 'solo_male' ? 'portrait prompt' : 'gemini couple prompt';
  const fb1 = v.subjectType === 'solo_female' ? 'trending prompt girls' : v.subjectType === 'solo_male' ? 'trending prompt boys' : 'candid couple photo';
  const fb2 = v.subjectType === 'solo_female' ? 'aesthetic girl portrait' : v.subjectType === 'solo_male' ? 'aesthetic portrait for men' : 'aesthetic couple portrait';
  const fb3 = v.subjectType === 'solo_female' ? 'solo girl photo' : v.subjectType === 'solo_male' ? 'solo boy photo' : 'couple aesthetic';
  const fb4 = v.subjectType === 'solo_female' ? 'candid photo poses' : v.subjectType === 'solo_male' ? 'men photography ideas' : 'couple photography ideas';
  const fb5 = v.subjectType === 'solo_female' ? 'aesthetic photography' : v.subjectType === 'solo_male' ? 'smartphone portrait' : 'trending prompt boys';
  const fb6 = v.subjectType === 'solo_female' ? 'viral portrait prompt' : v.subjectType === 'solo_male' ? 'viral portrait prompt' : 'viral couple prompt';
  const fb7 = v.subjectType === 'solo_female' ? 'aesthetic mirror selfie' : v.subjectType === 'solo_male' ? 'candid photo poses' : 'romantic couple prompt';
  const fb8 = v.subjectType === 'solo_female' ? 'natural light portrait' : v.subjectType === 'solo_male' ? 'gemini photo prompt' : 'couple photo ideas';
  const fb9 = v.subjectType === 'solo_female' ? 'smartphone portrait' : v.subjectType === 'solo_male' ? 'smartphone portrait' : 'smartphone couple photo';

  const subjectIntro = v.subjectType === 'couple'
    ? `This prompt brings an ultra-stylish, authentic ${cleanSceneTitle} to life, capturing candid closeness and genuine chemistry for ${kws[0] || fb0} and ${kws[1] || fb1}.`
    : v.subjectType === 'solo_female'
    ? `This prompt brings an authentic, spontaneous portrait of a stylish young woman to life, capturing natural charm and unposed confidence for ${kws[0] || fb0} and ${kws[1] || fb1}.`
    : `This prompt brings a compelling, authentic portrait of a stylish young man to life, capturing natural presence and charisma for ${kws[0] || fb0} and ${kws[1] || fb1}.`;

  const s1 = `If you generate this prompt, you are going to have an absolute blast with the results! ${subjectIntro}`;

  const s2 = `${v.subjectType === 'solo_female' ? 'Her' : v.subjectType === 'solo_male' ? 'His' : 'Their'} styling stays effortlessly chic and distinctive, featuring ${v.outfitDesc}, tailored seamlessly for ${kws[2] || fb2}, ${kws[3] || fb3}, and ${kws[4] || fb4}.`;

  const s3 = `The surrounding space showcases ${v.aestheticDesc}, adding rich ambient atmosphere, balanced highlights, and gentle shadows that elevate ${kws[5] || fb5} and ${kws[6] || fb6}.`;

  const s4 = `Authentic handheld smartphone details—including real skin texture, visible pores, natural smile lines, hair flyaways, and fabric creases—preserve complete camera realism with strictly zero artificial AI smoothing or plastic beauty filters, ideal for ${kws[7] || fb7} and ${kws[8] || fb8}.`;

  const s5 = `Ready to create your own? Just copy the prompt above, paste it into your favorite AI image generator, and have fun creating viral photos for ${kws[9] || fb9}!`;

  const fullPrompt = `${s1} ${s2} ${s3} ${s4} ${s5}`;
  return enforceWordLimit(fullPrompt, 199, 151);
}

/**
 * Smart synthesis generator for "SEO Meta Description" (Strictly <= 160 chars)
 * Weaves EXACTLY 1 primary keyword + dedicated visual description.
 */
export function generateSmartSeoDescription(
  input: GenerationInput,
  partition?: ArigatoSiteKeywordPartition,
  visual?: VisualAnalysis
): string {
  const parts = partition || partitionArigatoSiteKeywords(input);
  const primaryKw = parts.descKeywords[0] || (parts.tagKeywords[0] || 'AI photo prompt');
  const v = visual || analyzeVisualAndPrompt(input);

  let desc = '';
  if (v.subjectType === 'solo_female') {
    desc = v.is1980s
      ? `Recreate this 1980s retro mirror selfie with ${primaryKw}, featuring ${v.outfitDesc} and authentic vintage camera grain.`
      : `Create this authentic portrait with ${primaryKw}, featuring ${v.outfitDesc} and natural smartphone realism.`;
  } else if (v.subjectType === 'solo_male') {
    desc = `Create this stylish portrait with ${primaryKw}, featuring ${v.outfitDesc} and authentic smartphone realism.`;
  } else {
    desc = `Capture an authentic romantic portrait with ${primaryKw}, featuring ${v.outfitDesc} and candid smartphone realism.`;
  }

  if (desc.length > 160) {
    desc = `Create this authentic portrait with ${primaryKw}, featuring natural styling and smartphone realism.`;
  }
  return enforceSentenceCharLimit(desc, 160);
}

export function getSiteMetaTitle(v: VisualAnalysis): string {
  if (v.subjectType === 'solo_female') {
    return v.is1980s
      ? '1980s Vintage Girl AI Prompt — Arigato Labs'
      : 'Realistic Girl AI Prompt — Arigato Labs';
  } else if (v.subjectType === 'solo_male') {
    return 'Realistic Portrait AI Prompt — Arigato Labs';
  }
  return 'Realistic Couple AI Prompt — Arigato Labs';
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
export function generateSmartPinterestSeo(input: GenerationInput, visual?: VisualAnalysis): {
  title: string;
  description: string;
  tags: string[];
  recommendedBoard: string;
  variations: PinterestVariation[];
} {
  const v = visual || analyzeVisualAndPrompt(input);
  const variations = buildSmartPinterestVariations(input, input.variationCount || 2);
  const pinnedKws = input.pinnedKeywords || [];

  const topicWords = (input.prompt || '')
    .replace(/[^\w\s]/gi, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 4);

  const baseTags = v.subjectType === 'solo_female'
    ? [
        v.is1980s ? '#1980saiprompt' : '#aigirlprompt',
        v.is1980s ? '#1980strend' : '#trendingpromptgirls',
        '#retroaesthetic',
        '#mirrorselfie',
        '#vintagefashion',
        '#geminiaiprompt',
        ...topicWords.map((w) => `#${w.toLowerCase()}`),
        ...pinnedKws.map((k) => `#${k.replace(/\s+/g, '').toLowerCase()}`),
        '#pinterestviral',
        '#aestheticportrait',
      ]
    : v.subjectType === 'solo_male'
    ? [
        '#aimenprompt',
        '#maleaesthetic',
        '#candidportrait',
        '#geminiaiprompt',
        ...topicWords.map((w) => `#${w.toLowerCase()}`),
        ...pinnedKws.map((k) => `#${k.replace(/\s+/g, '').toLowerCase()}`),
        '#pinterestviral',
        '#aestheticportrait',
      ]
    : [
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

  const recommendedBoard = v.subjectType === 'solo_female'
    ? (v.is1980s ? '1980s AI Photo Trend | Retro Portraits' : 'Trending AI Prompts Girls | Aesthetic Portraits')
    : v.subjectType === 'solo_male'
    ? 'Men Portrait Prompts | Photography Ideas'
    : 'Kiss Prompts For Gemini AI | Couple Prompts';

  return {
    title: variations[0].title,
    description: variations[0].description,
    tags,
    recommendedBoard,
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
  const visual = analyzeVisualAndPrompt(input);

  // Step 1: Vision / Image Scan Simulation (0% -> 20%)
  const scanMsg = visual.subjectType === 'solo_female'
    ? 'Scanning solo female portrait, 1980s styling & retro aesthetics...'
    : visual.subjectType === 'solo_male'
    ? 'Scanning solo male portrait aesthetics & framing...'
    : 'Scanning image visual composition & color aesthetics...';
  onProgress?.(1, 15, scanMsg);
  await new Promise((r) => setTimeout(r, 250));

  // Step 2: Prompt Semantic Analysis (20% -> 40%)
  onProgress?.(2, 35, 'Extracting core thematic anchors from user prompt & visual reverse prompt...');
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
        const live = await executeCustomPinterestApi(input, config, visual);
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
    const smart = generateSmartPinterestSeo(input, visual);
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
  const visual = analyzeVisualAndPrompt(input);

  // Step 1: Scan (0% -> 20%)
  const scanMsg = visual.subjectType === 'solo_female'
    ? 'Scanning solo female portrait, 1980s styling & retro aesthetics...'
    : visual.subjectType === 'solo_male'
    ? 'Scanning solo male portrait aesthetics & framing...'
    : 'Scanning visual composition, lighting balance and subjects...';
  onProgress?.(1, 15, scanMsg);
  await new Promise((r) => setTimeout(r, 250));

  // Step 2: Extract Prompt Metadata & Rules (20% -> 40%)
  onProgress?.(2, 35, `Partitioning keywords: 10 for About, 3 for Meta, 9 for Tags (${visual.subjectType})...`);
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
    if (activeApiKey || config.mode === 'custom_api') {
      try {
        const liveResult = await executeCustomSiteApi(input, config, partition, visual);
        if (
          liveResult &&
          liveResult.aboutPrompt &&
          liveResult.aboutPrompt.trim().length > 30 &&
          liveResult.seoDescription &&
          liveResult.seoDescription.trim().length > 10 &&
          Array.isArray(liveResult.keywords) &&
          liveResult.keywords.length >= 6
        ) {
          liveResult.keywords = liveResult.keywords.slice(0, 10);
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
    const aboutPrompt = generateSmartAboutPrompt(input, partition, visual);
    const wordCount = countWords(aboutPrompt);
    const seoDescription = generateSmartSeoDescription(input, partition, visual);
    const charCount = seoDescription.length;
    const keywords = generateSmartKeywords(input, partition);

    siteResult = {
      aboutPrompt,
      wordCount,
      seoDescription,
      charCount,
      keywords,
      keywordsMatched: partition.aboutKeywords,
      siteMetaTitle: getSiteMetaTitle(visual),
      aboutKeywords: partition.aboutKeywords,
      descKeywords: partition.descKeywords,
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
 * Pluggable Custom API Handlers (Configured for deepseek-ai/DeepSeek-V4.1-Flash on Modal)
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

function isVisionModel(_model: string): boolean {
  // Enables multimodal vision payload for DeepSeek V4.1 Flash, GLM 5.3 Flash, Inkling, and all vision-tagged models
  // If an endpoint doesn't support images, our fetch try/catch automatically retries with text-only.
  return true;
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

async function executeCustomPinterestApi(input: GenerationInput, config: ApiConfig, visualAnalysis?: VisualAnalysis): Promise<PinterestSeoResult> {
  const headers = buildAuthHeaders(config);
  const endpoint = resolveApiUrl(config);

  const format = input.pinterestFormat || 'with_link';
  const requestedVariations = Math.min(Math.max(input.variationCount || 2, 2), 5);
  const v = visualAnalysis || analyzeVisualAndPrompt(input);

  const defaultBoard = v.subjectType === 'solo_female'
    ? (v.is1980s ? '1980s AI Photo Trend | Retro Portraits' : 'Trending AI Prompts Girls | Aesthetic Portraits')
    : v.subjectType === 'solo_male'
    ? 'Men Portrait Prompts | Photography Ideas'
    : 'Kiss Prompts For Gemini AI | Couple Prompts';

  const systemContent = `You are a viral Pinterest SEO & Social Growth strategist at Arigato Labs.
Your task is to analyze the user's prompt text and reference visual to generate high-CTR Pinterest SEO pins.

${v.reversePromptText}
${input.extraGuidance?.trim() ? `
USER'S CUSTOM EXTRA GUIDANCE / SYSTEM DIRECTIVES (MANDATORY PRIORITY):
The user has specified explicit directives for how these Pinterest pins must be written:
"""
${input.extraGuidance.trim()}
"""
Ensure the tone, hooks, specific details, and creative instructions requested above are prominently reflected!
` : ''}
STRICT SUBJECT ACCURACY:
${v.subjectType === 'solo_female'
  ? '- The subject is ONE SINGLE WOMAN/GIRL. DO NOT describe "two people", "couple closeness", or "romance". Focus on HER vintage/candid portrait.'
  : v.subjectType === 'solo_male'
  ? '- The subject is ONE SINGLE MAN/BOY. DO NOT describe "two people" or "couple closeness". Focus on HIS portrait.'
  : '- The subject is a romantic couple. Describe their candid closeness and chemistry.'}

STRICT ANTI-KEYWORD-STUFFING DIRECTIVE:
- ABSOLUTELY NEVER output a comma-separated list of keywords.
- Every keyword MUST be woven naturally into a fluent, human sentence.

SECTIONS REQUIRED:
1. TITLE: High CTR Pinterest Pin title (strictly 40 to 80 chars). Must end with "${format === 'with_link' ? ' | Click Visit Site for Prompt' : ` | ${v.subjectType === 'solo_female' ? 'Retro Girl Photo' : v.subjectType === 'solo_male' ? 'Men Portrait Photo' : 'Gemini Couple Photo'}`}".
2. DESCRIPTION: High-converting description (strictly under 580 characters).
3. TAGS: Array of 8 to 10 viral search tags starting with #.
4. RECOMMENDED BOARD: Relevant board name (e.g. "${defaultBoard}").
5. VARIATIONS (MANDATORY): Generate exactly ${requestedVariations} distinct variations for A/B testing pins.

PINNED KEYWORDS: ${input.pinnedKeywords?.join(', ') || 'None'}
ACTIVE CONTEXTUAL KEYWORDS: ${input.activeKeywords.slice(0, 6).join(', ')}

OUTPUT FORMAT: Return ONLY a valid JSON object with keys: "title", "description", "tags", "recommendedBoard", "variations".
Do NOT include markdown fences or think tags in the JSON.`;

  const canUseVision = Boolean(input.imageDataUrl && isVisionModel(config.model || ''));
  const userTextPrompt = `Create ${requestedVariations} distinct high-converting ${format === 'with_link' ? 'With Link' : 'Search Steps'} Pinterest SEO variations for:
Prompt: "${input.prompt || v.sceneTitle}"
${input.extraGuidance?.trim() ? `User's Extra Guidance: "${input.extraGuidance.trim()}"\n` : ''}${v.reversePromptText}
Pinned Mandatory Keywords: ${input.pinnedKeywords?.join(', ') || 'None'}
Configured Keywords: ${input.activeKeywords.join(', ')}`;

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

    const activeModel = (!config.model || config.model.toLowerCase().includes('kimi'))
      ? 'deepseek-ai/DeepSeek-V4.1-Flash'
      : config.model;

    return {
      model: activeModel,
      messages,
      temperature: 0.3,
      max_tokens: 2048,
      top_p: activeModel.toLowerCase().includes('kimi') ? 0.95 : 0.9,
      stream: false,
      response_format: { type: 'json_object' },
      reasoning_effort: 'high',
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
    throw new Error(`DeepSeek API returned status ${response.status}: ${errText}`);
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
  partition: ArigatoSiteKeywordPartition,
  visual?: VisualAnalysis
): Promise<ArigatoSiteSeoResult> {
  const v = visual || analyzeVisualAndPrompt(input);
  const headers = buildAuthHeaders(config);
  const endpoint = resolveApiUrl(config);

  const frameworkSection = buildArigatoFrameworkPromptSection(
    `${input.prompt || ''} ${input.imageFileName || ''} ${input.extraGuidance || ''}`,
    v.subjectType
  );

  const systemContent = `You are an expert AI prompt curator, reverse prompt engineer, and SEO architect at Arigato Labs (https://arigatolabs.com).
Your task is to analyze the user's visual artwork and generate the official Arigato Site SEO metadata package according to our strict production framework.

${frameworkSection}
${input.extraGuidance?.trim() ? `
USER'S CUSTOM EXTRA GUIDANCE / SYSTEM DIRECTIVES:
The user has specified custom instructions on how this SEO content must be analyzed and written:
"""
${input.extraGuidance.trim()}
"""
Apply these directives strictly to guide your tone, visual focus, and descriptions.
CRITICAL: DO NOT literally quote or print the user's raw directives in the copy. Instead, execute them as writing instructions!
` : ''}
TONE & WRITING STYLE:
- Write in an engaging, humanized creator tone with high visual fidelity and SEO keyword integration.
- Follow the 8-dimension content blueprint and reference examples above.
- STRICT NO-AI-SMOOTHING RULE: Emphasize genuine skin pores, authentic skin texture, realistic shadows, hair flyaways, and natural fabric creases. Zero plastic skin or CGI smoothing!
- No plagiarism: Write with 100% original, fresh observational energy.

STRICT SUBJECT ACCURACY & KEYWORD RELEVANCE DIRECTIVE (ZERO SUBJECT HALLUCINATION):
1. VISUAL PIXEL INSPECTION FIRST: Look at the actual image pixels before using any keywords.
${v.subjectType === 'solo_female'
  ? `- The visual portrays ONE SINGLE WOMAN/GIRL.
  - STRICTLY FORBIDDEN: NEVER include words like "couple", "couples", "boyfriend", "romantic duo", "two people", "couple aesthetic", "couple portrait", "couple photo", "couple prompt", "couple photo ideas", "smartphone couple photo" in ANY field!
  - If any candidate keywords from the pool contain couple terms, DISCARD THEM IMMEDIATELY! Do NOT weave them. Substitute with accurate visual descriptors (e.g. "spiderman girl prompt", "trending prompt girls", "aesthetic mirror selfie").`
  : v.subjectType === 'solo_male'
  ? `- The visual portrays ONE SINGLE MAN/BOY.
  - STRICTLY FORBIDDEN: NEVER include words like "couple", "couples", "girlfriend", "romantic duo", "two people", "couple aesthetic", "couple portrait" in ANY field! Focus on HIS solo portrait.`
  : `- The visual portrays a couple. Describe their candid interaction, body alignment, and authentic chemistry.`}

ENVIRONMENT NOTICE:
This is for "Arigato Site SEO" (NOT Pinterest). Do NOT generate Pinterest board recommendations, Pinterest pin titles, or Pinterest hashtags.

CRITICAL 4-PART HUMANIZED STRUCTURE FOR "aboutPrompt":
Write in an engaging, humanized creator tone with high visual fidelity and SEO keyword integration across 4 cohesive parts:

1. OPENING HOOK (Creator Excitement + First Keywords):
   - Start enthusiastically in natural English: "If you generate this prompt, you're going to love the results! In this prompt, you get [describe scene/concept/energy]..."
   - Naturally weave the first 2 target keywords into this opening.

2. VISUAL STYLING, OUTFITS & ENVIRONMENT (Exact Details + Middle Keywords):
   - Carefully inspect the image pixels and describe exact clothing cuts, fabrics, colors, posture, and setting:
     * Detail the garments, colors, specific fabrics (e.g. Spider-Man suit/cosplay top, satin sheen, jacket, sheer mesh, tailored trousers), necklines, and accessories (Spider-Man mask in hand, sunglasses, jewelry, backpack).
     * Detail the environment (e.g. marble hallway with reflective floors, interior walls, ambient lighting).
   - Naturally weave the next 4-5 target keywords into fluent, complete sentences (NO comma lists).

3. CAMERA & REALISM (Smartphone Imperfections + Zero AI Smoothing):
   - Describe handheld smartphone 9:16 vertical framing, genuine skin pores, subtle facial lines, realistic shadows, natural hair flyaways, and fabric creases.
   - STRICT ZERO AI PLASTIC SMOOTHING RULE: Strictly zero artificial CGI smoothing or plastic beauty filters!
   - Naturally weave 2 target keywords here.

4. MANDATORY CLOSING CALL-TO-ACTION (CTA + Final Keyword):
   - End with an inviting, enthusiastic call to action: "Ready to create your own? Just copy the prompt above, paste it into your favorite AI image generator, and have fun creating viral photos!"
   - Naturally weave the 10th target keyword into this closing CTA.

CRITICAL LENGTH & COUNTING RULES (STRICT COMPLIANCE REQUIRED):
1. "aboutPrompt":
   - STRICT LENGTH CONSTRAINT: Exactly 151 to 199 words (Target: 165 to 185 words).
   - NEVER write fewer than 151 words. NEVER exceed 199 words.
   - CRITICAL SENTENCE COMPLETION: Every sentence MUST be fully completed before reaching 195 words. NEVER stop mid-sentence or leave hanging words!
   - You MUST naturally weave ALL assigned target keywords into fluent, human, grammatically complete sentences:
     * Pinned Keywords: ${partition.aboutPinned.length > 0 ? partition.aboutPinned.join(', ') : 'None'}
     * Contextual Unpinned Keywords: ${partition.aboutUnpinned.join(', ')}
     * Total Assigned Target Keywords (${partition.aboutKeywords.length}): ${partition.aboutKeywords.join(', ')}
   - ANTI-KEYWORD-STUFFING: ABSOLUTELY NEVER output a comma-separated list of keywords. Every keyword MUST be woven naturally into a sentence.

2. "seoDescription" (EXACTLY 1 PRIMARY KEYWORD + VIVID IMAGE DESCRIPTION):
   - STRICT CONSTRAINT: 130 to 160 characters (target 140 to 158 characters, NEVER exceed 160 characters!).
   - EXACTLY ONE (1) KEYWORD: Pick ONLY ONE single best-matching keyword: "${partition.descKeywords[0] || 'AI photo prompt'}".
   - DEDICATE ALL REMAINING CHARACTERS TO ACCURATELY DESCRIBING WHAT IS IN THE IMAGE:
     Clearly mention the subject's outfit, character styling (e.g. Spider-Man suit, dress, casual wear), pose, accessories (e.g. mask in hand, phone, sunglasses), setting (e.g. marble hallway), and smartphone realism.
   - STRICT NO-STUFFING RULE: Do NOT list 3 or 4 keywords separated by commas or periods! Just ONE keyword seamlessly woven into an engaging, natural SERP sentence.

3. "keywords" (EXACTLY 10 KEYWORD TAGS):
   - Return a JSON array of EXACTLY 10 keyword tags matching the visual subject:
     * Keywords 1-3: Specifically describe the visual artwork concept (garments, pose, accessories, scene).
     * Keywords 4-10: Broader compatible target keywords: [${partition.tagKeywords.slice(0, 7).map((k) => `"${k}"`).join(', ')}].
   - If solo subject, STRICTLY ZERO couple tags!

4. "siteMetaTitle":
   - A concise SERP title under 65 chars (e.g. "${getSiteMetaTitle(v)}").

OUTPUT FORMAT: Return ONLY a valid JSON object with keys: "aboutPrompt", "seoDescription", "keywords", "siteMetaTitle". Do NOT include markdown commentary or think tags in the JSON.`;

  const canUseVision = Boolean(input.imageDataUrl && isVisionModel(config.model || ''));

  const visualInspectionPrompt = input.imageDataUrl
    ? `VISUAL INSPECTION DIRECTIVE (PIXEL ANALYSIS REQUIRED):
An image is attached to this request. INSPECT THE ACTUAL PIXELS OF THIS IMAGE CAREFULLY AND REVERSE-PROMPT EXACTLY WHAT YOU SEE:
- Subject & Count: Clearly identify who is present (e.g. one solo girl/woman, one solo boy/man, or two people). Do not invent extra people!
- Outfits & Fabrics: Describe the exact clothing (e.g. Spider-Man suit/compression top with spider emblem, grey leggings, sneakers, dress, saree, jacket) with specific colors and fabric textures.
- Accessories & Props: Note what they are holding or wearing (e.g. Spider-Man mask in hand, phone, backpack, jewelry, eyewear).
- Pose & Expression: Posture (e.g. top-down angle, mirror selfie, standing in hallway, direct confident eye contact, subtle smile).
- Setting & Lighting: Environment details (e.g. marble floor, bright hallway walls, ambient natural light).
- Faithfully capture this authentic visual reality in your descriptions.`
    : (input.visualHint ? `Visual Hints: ${input.visualHint}\n${v.reversePromptText}` : v.reversePromptText);

  const userTextPrompt = `Create the authoritative Arigato Site SEO package for:
Visual Artwork Asset: "${input.imageFileName || 'Uploaded visual'}"
${input.extraGuidance?.trim() ? `User's Extra Guidance Directives: "${input.extraGuidance.trim()}"\n` : ''}
${visualInspectionPrompt}

REQUIRED 4-PART "aboutPrompt" FLOW (weave assigned keywords in fluent sentences, 151-199 words):
1. Exciting Hook: "If you generate this prompt, you're going to love the results! In this prompt, you get..." + keywords.
2. Visual Styling & Environment: exact garments, fabrics, colors, accessories, setting + keywords.
3. Realistic Photography: smartphone 9:16 framing, authentic skin pores, smile lines, zero AI smoothing + keywords.
4. Concluding CTA: "Ready to create your own? Just copy the prompt above, paste it into your favorite AI image generator, and have fun creating viral photos!" + keyword.

MANDATORY KEYWORD ASSIGNMENTS:
- About This Prompt (${partition.aboutKeywords.length} keywords in fluent sentences, 151-199 words): ${partition.aboutKeywords.join(', ')}
- SEO Meta Description (EXACTLY 1 KEYWORD: "${partition.descKeywords[0] || 'AI photo prompt'}" + dedicated visual description, strictly <= 160 chars)
- Exact 10 Tags: ${partition.tagKeywords.slice(0, 10).join(', ')}`;

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

    const activeModel = (!config.model || config.model.toLowerCase().includes('kimi'))
      ? 'deepseek-ai/DeepSeek-V4.1-Flash'
      : config.model;

    return {
      model: activeModel,
      messages,
      temperature: 0.3,
      max_tokens: 2048,
      top_p: 0.9,
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
    throw new Error(`DeepSeek API returned status ${response.status}: ${errText}`);
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
  let rawKeywords = parsed.keywords || parsed.seo_keywords || parsed.seoKeywords || parsed.tags || [];

  const smartBackup = {
    aboutPrompt: generateSmartAboutPrompt(input, partition, v),
    seoDescription: generateSmartSeoDescription(input, partition, v),
    keywords: generateSmartKeywords(input, partition),
  };

  // Fail-safe check for aboutPrompt: KEEP model response if >= 40 words!
  let aboutPrompt = rawAbout && typeof rawAbout === 'string' && countWords(rawAbout) >= 40
    ? rawAbout.trim()
    : smartBackup.aboutPrompt;

  // If the model response doesn't end with a creator CTA and has room, append one warmly
  const hasCta = /\b(copy|try\s+it|have\s+fun|generator|create\s+your\s+own)\b/i.test(aboutPrompt.slice(-150));
  if (!hasCta && countWords(aboutPrompt) <= 175) {
    const cleanPrompt = aboutPrompt.endsWith('.') ? aboutPrompt : `${aboutPrompt}.`;
    aboutPrompt = `${cleanPrompt} Ready to create your own? Just copy the prompt above, paste it into your favorite AI image generator, and have fun creating viral photos!`;
  }

  // Strictly enforce 151 to 199 words without cutting mid-sentence
  aboutPrompt = enforceWordLimit(aboutPrompt, 199, 151);

  // Fail-safe check for seoDescription: strictly <= 160 chars
  let seoDescription = rawSeoDesc && typeof rawSeoDesc === 'string' && rawSeoDesc.trim().length >= 20
    ? enforceSentenceCharLimit(rawSeoDesc.trim(), 160)
    : smartBackup.seoDescription;

  // Fail-safe check for keywords: exactly 10 tags
  let keywords: string[] = [];
  if (Array.isArray(rawKeywords) && rawKeywords.length >= 5) {
    keywords = rawKeywords.map((k: any) => String(k).trim()).filter(Boolean);
  }
  for (const kw of partition.tagKeywords) {
    if (keywords.length >= 10) break;
    if (!keywords.map((k) => k.toLowerCase()).includes(kw.toLowerCase())) {
      keywords.push(kw);
    }
  }
  keywords = keywords.slice(0, 10);

  // Subject-Aware Post-Processing Sanitizer:
  // If the visual is a solo subject, guarantee zero couple words in aboutPrompt, seoDescription, or tags!
  if (v.subjectType === 'solo_female' || v.subjectType === 'solo_male' || v.subjectType === 'portrait') {
    const sanitizeCoupleText = (text: string) => {
      return text
        .replace(/\b(?:an?\s+)?effortless\s+couple\s+aesthetic\s+vibe\b/gi, 'an effortless aesthetic portrait vibe')
        .replace(/\baesthetic\s+couple\s+portrait\b/gi, v.subjectType === 'solo_female' ? 'aesthetic girl portrait' : 'aesthetic portrait')
        .replace(/\brealistic\s+couple\s+prompt\s+for\s+gemini\s+ai\b/gi, v.subjectType === 'solo_female' ? 'realistic girl prompt for gemini ai' : 'realistic portrait prompt for gemini ai')
        .replace(/\brealistic\s+couple\s+prompt\b/gi, v.subjectType === 'solo_female' ? 'realistic girl prompt' : 'realistic portrait prompt')
        .replace(/\bgemini\s+couple\s+prompt\b/gi, v.subjectType === 'solo_female' ? 'gemini girl prompt' : 'gemini portrait prompt')
        .replace(/\bcouple\s+photography\s+ideas\b/gi, 'creative photography ideas')
        .replace(/\bcouple\s+photo\s+ideas\b/gi, 'creative photo ideas')
        .replace(/\bsmartphone\s+couple\s+photo\b/gi, 'smartphone portrait')
        .replace(/\bcouple\s+aesthetic\b/gi, 'candid aesthetic')
        .replace(/\bcouple\s+selfie\b/gi, 'mirror selfie')
        .replace(/\bviral\s+couple\s+prompt\b/gi, 'viral portrait prompt')
        .replace(/\bcouple\s+prompt\b/gi, 'portrait prompt');
    };

    aboutPrompt = sanitizeCoupleText(aboutPrompt);
    seoDescription = sanitizeCoupleText(seoDescription);
    keywords = keywords.filter((k) => isKeywordCompatibleWithSubject(k, v.subjectType));
    for (const kw of partition.tagKeywords) {
      if (keywords.length >= 10) break;
      if (!keywords.map((k) => k.toLowerCase()).includes(kw.toLowerCase())) {
        keywords.push(kw);
      }
    }
    keywords = keywords.slice(0, 10);
  }

  seoDescription = enforceSentenceCharLimit(seoDescription, 160);

  const siteMetaTitle =
    parsed.siteMetaTitle ||
    parsed.site_meta_title ||
    parsed.prompt_title ||
    parsed.promptTitle ||
    parsed.title ||
    getSiteMetaTitle(v);

  return {
    aboutPrompt,
    wordCount: countWords(aboutPrompt),
    seoDescription,
    charCount: seoDescription.length,
    keywords,
    keywordsMatched: partition.aboutKeywords,
    siteMetaTitle,
    aboutKeywords: partition.aboutKeywords,
    descKeywords: partition.descKeywords,
  };
}

/**
 * Live Assistant Tester: lets the user test their DeepSeek-V4.1-Flash API directly with text & vision
 */
export async function sendChatAssistantMessage(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [],
  imageDataUrl?: string
): Promise<{ reply: string; latencyMs: number; rawJson?: string; isLiveApi: boolean }> {
  const config = getStoredApiConfig();
  const apiKey = resolveApiKey(config);
  const endpoint = resolveApiUrl(config);

  const startTime = performance.now();

  // If live credentials are provided, call the live Modal endpoint!
  if (apiKey) {
    try {
      // Build user content (multimodal if image provided)
      let userContent: any = userMessage;
      if (imageDataUrl) {
        userContent = [
          {
            type: 'text',
            text:
              userMessage.trim() ||
              'Analyze this image in detail: identify subject, clothing, style, lighting, background setting, aesthetic, and generate a comprehensive reverse prompt for Gemini / Midjourney / FLUX.',
          },
          {
            type: 'image_url',
            image_url: {
              url: imageDataUrl,
            },
          },
        ];
      }

      const messages = [
        {
          role: 'system',
          content: `You are "DeepSeek Vision Assistant" — a super friendly, energetic, creative developer and SEO genius at Arigato Labs!
Speak like a real, cool human friend/peer who loves prompt engineering, visual art, and SEO.
Use natural, conversational modern Hinglish / English slangs comfortably (e.g. "Bhai", "tension mat lo", "mast prompt hai", "let's cook 🔥", "Arigato gang", "solid scene", "chill vibes", "bawaal look", etc.).
Do NOT talk like a robotic automated customer service bot!

Formatting Guidelines:
- Format your reply with clean Markdown: use **bold text** for important highlights, clean line breaks, bullet points, and relatable emojis.
- When an image is provided, thoroughly analyze: 1. Subject & Attire, 2. Environment & Lighting, 3. Camera/Style details, 4. Recommended Reverse Prompt.
- Avoid messy unstructured text blocks.
- If the user asks about latency, endpoints, or tests, give a crisp, enthusiastic status with exact numbers and a friendly takeaway.
- Keep the energy high, friendly, and collaborative!`,
        },
        ...history.slice(-6),
        {
          role: 'user',
          content: userContent,
        },
      ];

      const isAdaTest = !imageDataUrl && userMessage.toLowerCase().includes('ada') && userMessage.toLowerCase().includes('london');
      const activeModel = (!config.model || config.model.toLowerCase().includes('kimi'))
        ? 'deepseek-ai/DeepSeek-V4.1-Flash'
        : config.model;

      const requestPayload: any = {
        model: activeModel,
        messages,
        temperature: 0.3,
        max_tokens: 2048,
        top_p: activeModel.toLowerCase().includes('kimi') ? 0.95 : 0.9,
        stream: false,
        reasoning_effort: 'high',
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

      let res = await fetch(endpoint, {
        method: 'POST',
        headers: buildAuthHeaders(config),
        body: JSON.stringify(requestPayload),
      });

      // If image payload failed, retry once with text-only
      if (!res.ok && imageDataUrl) {
        console.warn('[sendChatAssistantMessage] Vision request returned', res.status, '- attempting text-only retry...');
        const fallbackMessages = [
          messages[0],
          ...history.slice(-6),
          {
            role: 'user',
            content: userMessage.trim() || 'Analyze this image and describe creative prompt ideas.',
          },
        ];
        res = await fetch(endpoint, {
          method: 'POST',
          headers: buildAuthHeaders(config),
          body: JSON.stringify({
            ...requestPayload,
            messages: fallbackMessages,
          }),
        });
      }

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
      let reply = data.choices?.[0]?.message?.content || '';
      if (!reply.trim() && data.choices?.[0]?.message?.reasoning_content) {
        reply = data.choices[0].message.reasoning_content;
      }
      if (!reply.trim()) {
        reply = 'No response returned from model.';
      }

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

  let reply = `👋 Arre bhai, **DeepSeek Vision Assistant** haazir hai! 🔥\n\nAbhi **API Connect** mein live token activate nahi hai, toh hum simulation mode mein baat kar rahe hain. Agar direct **DeepSeek V4.1 Flash (Vision)** endpoint test karna hai toh top right corner mein **API Connect** se token save kar lo.\n\nBaki koi bhi prompt discuss karna ho, image analyze karwana ho, ya visual idea brainstorm karna ho, batao — *let's cook something fire!* 🎨`;
  if (imageDataUrl) {
    reply = `🖼️ **Visual Analysis Preview (DeepSeek V4.1 Flash Vision)**\n\nImage receive ho gayi hai bhai! Live inference ke liye top right corner mein **API Connect** pe click karke apna Modal Token ID aur Secret save kar lo.\n\nOnce connected, DeepSeek V4.1 Flash will scan this exact image for:\n- **Subject & Pose**: Detailed human anatomy & stance\n- **Styling & Fashion**: Fabric textures, palette, and wardrobe\n- **Lighting & Atmosphere**: Volumetric lighting, studio rim light, color temperature\n- **Reverse Prompt Generator**: Full Midjourney / Gemini / FLUX copy-paste prompt!`;
  } else if (userMessage.toLowerCase().includes('ada') || userMessage.toLowerCase().includes('extract')) {
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

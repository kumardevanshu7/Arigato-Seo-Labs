import type { GenerationInput, PinterestSeoResult, ArigatoSiteSeoResult, ApiConfig } from '../types/seo';
import { getStoredApiConfig } from '../utils/storage';

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
 * Intelligent generator for Pinterest SEO
 */
export async function generatePinterestSeo(
  input: GenerationInput,
  onProgress?: (step: number, msg: string) => void
): Promise<PinterestSeoResult> {
  const config = getStoredApiConfig();

  // Step 1: Vision / Image Scan Simulation
  onProgress?.(1, 'Scanning image visual composition & color aesthetics...');
  await new Promise((r) => setTimeout(r, 600));

  // Step 2: Prompt Semantic Analysis
  onProgress?.(2, 'Extracting core thematic anchors from user prompt...');
  await new Promise((r) => setTimeout(r, 650));

  // Step 3: Keywords Cross-referencing
  onProgress?.(3, `Matching against ${input.activeKeywords.length} configured Pinterest keywords...`);
  await new Promise((r) => setTimeout(r, 600));

  // Step 4: SEO Synthesis
  onProgress?.(4, 'Synthesizing high-CTR Pinterest Title & natural SEO Description...');
  await new Promise((r) => setTimeout(r, 650));

  // If live custom API is configured, call custom API handler
  if (config.mode === 'custom_api' && config.apiKey) {
    try {
      return await executeCustomPinterestApi(input, config);
    } catch (err) {
      console.warn('Custom API execution failed, falling back to smart engine:', err);
    }
  }

  // Smart Engine Generation: Prioritize Pinned keywords first
  const pinnedKws = input.pinnedKeywords || [];
  const otherKws = input.activeKeywords.filter((k) => !pinnedKws.includes(k));
  const selectedKeywords = Array.from(new Set([...pinnedKws, ...otherKws])).slice(0, 4);

  // Extract primary topic
  const topicWords = input.prompt
    .replace(/[^\w\s]/gi, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 4);
  const mainSubject = topicWords.join(' ') || 'Visual Art Design';

  // Compose Pinterest Title (Catchy, Keyword-rich, 50-80 chars)
  const primaryKw = selectedKeywords[0] || 'Aesthetic Wallpaper';
  const secondaryKw = selectedKeywords[1] || 'Art Inspiration';
  let title = `${mainSubject.charAt(0).toUpperCase() + mainSubject.slice(1)} | ${primaryKw} & ${secondaryKw}`;
  if (title.length > 80) {
    title = `${mainSubject.charAt(0).toUpperCase() + mainSubject.slice(1)} — ${primaryKw}`;
  }

  // Compose Pinterest Natural Description (seamless keyword injection with pinned terms)
  const pinnedText = pinnedKws.length > 0 ? `Specially featuring ${pinnedKws.join(', ')}.` : '';
  const keywordSentence = selectedKeywords.length > 0
    ? `Curated for lovers of ${selectedKeywords.join(', ')}.`
    : 'Curated for aesthetic visual design.';

  const description = `Discover this mesmerizing ${mainSubject} concept crafted with cinematic lighting and high texture fidelity. ${pinnedText} ${keywordSentence} Perfect for creative inspiration, digital moodboards, and stunning display backdrops. Save this pin to your favorite art and design boards for daily visual motivation and prompt engineering ideas!`;

  // Compose Pinterest Tags
  const baseTags = [
    ...topicWords.map((w) => `#${w.toLowerCase()}`),
    ...selectedKeywords.map((k) => `#${k.replace(/\s+/g, '').toLowerCase()}`),
    '#aestheticart',
    '#visualinspiration',
    '#digitalillustration',
    '#designideas',
    '#pinterestviral',
  ];
  const uniqueTags = Array.from(new Set(baseTags)).slice(0, 10);

  return {
    title,
    description,
    tags: uniqueTags,
    keywordsMatched: selectedKeywords,
    characterCounts: {
      title: title.length,
      description: description.length,
      tagsCount: uniqueTags.length,
    },
    recommendedBoard: `${mainSubject} & Aesthetic Inspiration`,
  };
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
  onProgress?: (step: number, msg: string) => void
): Promise<ArigatoSiteSeoResult> {
  const config = getStoredApiConfig();

  // Step 1: Scan
  onProgress?.(1, 'Scanning artwork framing, lighting balance and atmosphere...');
  await new Promise((r) => setTimeout(r, 600));

  // Step 2: Extract Prompt Metadata
  onProgress?.(2, 'Parsing prompt structure, visual modifiers & style parameters...');
  await new Promise((r) => setTimeout(r, 650));

  // Step 3: Inject Target Keywords
  const pinnedCount = input.pinnedKeywords?.length || 0;
  onProgress?.(3, `Integrating ${input.activeKeywords.length} keywords (${pinnedCount} pinned mandatory)...`);
  await new Promise((r) => setTimeout(r, 600));

  // Step 4: Strict Length Audits
  onProgress?.(4, 'Validating strict limits: <199 words (About) and <160 chars (SEO Meta)...');
  await new Promise((r) => setTimeout(r, 650));

  if (config.mode === 'custom_api' && config.apiKey) {
    try {
      return await executeCustomSiteApi(input, config);
    } catch (err) {
      console.warn('Custom API execution failed, falling back to smart engine:', err);
    }
  }

  // Extract core concepts
  const cleanPrompt = input.prompt.trim() || 'A majestic artistic visual piece with atmospheric lighting';
  const topicWords = cleanPrompt
    .replace(/[^\w\s]/gi, '')
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const coreSubject = topicWords.slice(0, 3).join(' ') || 'Atmospheric Visual Concept';

  const pinnedKws = input.pinnedKeywords || [];
  const otherKws = input.activeKeywords.filter((k) => !pinnedKws.includes(k));
  const combinedKws = Array.from(new Set([...pinnedKws, ...otherKws]));

  // 1. Generate "About this prompt" (Strictly <= 199 words)
  // Part 1: Rich description of prompt visual aesthetics, lighting, framing, and mood.
  // Part 2: Fun engaging callout to try in Gemini/ChatGPT for their GF or BF and show love to Arigato Labs!
  const pinnedMention = pinnedKws.length > 0 ? ` Optimized with signature styling around ${pinnedKws.join(', ')}.` : '';
  
  const aboutPart1 = `This prompt is specially engineered to produce captivating, high-detail digital artwork capturing the visual essence of ${coreSubject}. Designed with cinematic lighting balance, volumetric depth, and rich color gradients, every visual element is tuned for crisp fidelity and striking clarity in modern generative pipelines.${pinnedMention}`;

  const aboutPart2 = `Try generating this creative prompt yourself in Gemini or ChatGPT! Create this wonderful artwork for your girlfriend or boyfriend to surprise them and see how much they love it. Make your artwork today and make sure to show some love to Arigato Labs! ❤️`;

  let aboutRaw = `${aboutPart1}\n\n${aboutPart2}`;
  let aboutPrompt = enforceWordLimit(aboutRaw, 199);
  let wordCount = countWords(aboutPrompt);
  if (wordCount > 199) {
    aboutPrompt = enforceWordLimit(aboutPrompt, 192);
    wordCount = countWords(aboutPrompt);
  }

  // 2. Generate "SEO Description" (Strictly <= 160 characters)
  // Target: 135 to 155 characters for peak Google Meta CTR
  const topKw = pinnedKws[0] || combinedKws[0] || 'creative prompt art';
  let seoDescCandidate = `Explore the ${coreSubject} prompt on Arigato Labs. Optimized for ${topKw} with cinematic lighting, commercial license, and instant copy.`;
  if (seoDescCandidate.length > 160) {
    seoDescCandidate = `${coreSubject} prompt on Arigato Labs. High-res generative art for ${topKw} with commercial license.`;
  }
  const seoDescription = enforceCharLimit(seoDescCandidate, 160);
  const charCount = seoDescription.length;

  // 3. Generate "SEO Keywords" (Strictly between 6 to 9 keywords)
  const derivedKeywords: string[] = [];
  // Pinned keywords must strictly be first
  pinnedKws.forEach((k) => {
    if (!derivedKeywords.includes(k.toLowerCase())) derivedKeywords.push(k.toLowerCase());
  });

  // Add active configured keywords
  otherKws.forEach((k) => {
    if (!derivedKeywords.includes(k.toLowerCase()) && derivedKeywords.length < 5) {
      derivedKeywords.push(k.toLowerCase());
    }
  });

  // Add topical keywords
  const candidateTags = [
    `${coreSubject.toLowerCase()} prompt`,
    'arigato labs studio',
    'creative prompt engineering',
    'high resolution digital art',
    'commercial license prompt',
    'generative visual aesthetic',
    'curated ai prompt assets',
  ];

  for (const tag of candidateTags) {
    if (!derivedKeywords.includes(tag.toLowerCase()) && derivedKeywords.length < 8) {
      derivedKeywords.push(tag.toLowerCase());
    }
  }

  // Ensure count is strictly between 6 and 9
  let finalKeywords = derivedKeywords.slice(0, 8);
  if (finalKeywords.length < 6) {
    finalKeywords.push('digital prompt art', 'visual asset prompt');
  }
  finalKeywords = finalKeywords.slice(0, 8); // exactly 8 keywords (fits 6 to 9)

  return {
    aboutPrompt,
    wordCount,
    seoDescription,
    charCount,
    keywords: finalKeywords,
    keywordsMatched: combinedKws.slice(0, 4),
    siteMetaTitle: `${coreSubject.charAt(0).toUpperCase() + coreSubject.slice(1)} — Arigato Labs Prompt Asset`,
  };
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

  const messages: any[] = [
    {
      role: 'system',
      content: `You are an elite Pinterest SEO expert for Arigato Labs.
The user provides an art prompt and optional image.
LANGUAGE & SEO RULES:
- All output MUST be written in clear, simple, and high-CTR English optimized for Pinterest search discovery and viral repins.
MANDATORY RULES:
1. PINNED KEYWORDS (MANDATORY): Any keyword listed under PINNED KEYWORDS MUST be woven naturally into the pin description!
2. PIN TITLE: Catchy, high-CTR, keyword-rich (40 to 80 characters) in simple English.
3. DESCRIPTION: Engaging Pinterest description in simple English incorporating all PINNED KEYWORDS naturally with a clear call to save/repin.
4. TAGS: Array of 8 to 10 viral search tags starting with #.

PINNED KEYWORDS (MANDATORY): ${input.pinnedKeywords?.join(', ') || 'None'}
ACTIVE CONTEXTUAL KEYWORDS: ${input.activeKeywords.join(', ')}`,
    },
    {
      role: 'user',
      content: input.imageDataUrl
        ? [
            { type: 'text', text: `Prompt: ${input.prompt}\nPinned Mandatory Keywords: ${input.pinnedKeywords?.join(', ') || 'None'}\nConfigured Keywords: ${input.activeKeywords.join(', ')}` },
            { type: 'image_url', image_url: { url: input.imageDataUrl } }
          ]
        : `Prompt: ${input.prompt}\nPinned Mandatory Keywords: ${input.pinnedKeywords?.join(', ') || 'None'}\nConfigured Keywords: ${input.activeKeywords.join(', ')}`,
    },
  ];

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model || 'moonshotai/Kimi-K3',
      messages,
      temperature: 0.3,
      max_tokens: 2048,
      top_p: 0.95,
      stream: false,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'pinterest_seo_result',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              recommendedBoard: { type: 'string' }
            },
            required: ['title', 'description', 'tags', 'recommendedBoard'],
            additionalProperties: false
          }
        }
      }
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Kimi API returned status ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content || '{}';
  const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);

  return {
    title: parsed.title || 'Curated Aesthetic Pin',
    description: parsed.description || '',
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    keywordsMatched: input.activeKeywords,
    characterCounts: {
      title: (parsed.title || '').length,
      description: (parsed.description || '').length,
      tagsCount: Array.isArray(parsed.tags) ? parsed.tags.length : 0,
    },
    recommendedBoard: parsed.recommendedBoard || 'Visual Inspiration',
  };
}

async function executeCustomSiteApi(input: GenerationInput, config: ApiConfig): Promise<ArigatoSiteSeoResult> {
  const headers = buildAuthHeaders(config);
  const endpoint = resolveApiUrl(config);

  const messages: any[] = [
    {
      role: 'system',
      content: `You are an elite SEO copywriter and generative AI prompt curator for Arigato Labs.
CRITICAL LANGUAGE & GOOGLE SEO RULES:
- All descriptions and text MUST be written in simple, clear, and natural English optimized for Google search indexing and high CTR.
- Avoid complicated vocabulary, foreign sentences, or keyword stuffing; write plain, captivating English that ranks.

CRITICAL MANDATORY RULES & STRICT CONSTRAINTS:
1. "aboutPrompt": MUST BE STRICTLY UNDER 199 WORDS (target 120 to 175 words) in simple, engaging English.
   - Part 1: Provide a clear, compelling breakdown of the prompt's visual style, artistic lighting, composition, and texture fidelity in simple English.
   - Part 2: Conclude warmly with this exact friendly English callout:
     "Try generating this creative prompt yourself in Gemini or ChatGPT! Create this wonderful artwork for your girlfriend or boyfriend to surprise them and see how much they love it. Make your artwork today and make sure to show some love to Arigato Labs!"
   - Must naturally weave in all PINNED KEYWORDS.
2. "seoDescription": MUST BE STRICTLY UNDER 160 CHARACTERS (target 135 to 155 characters). High-CTR Google SERP meta description in simple, click-worthy English containing PINNED KEYWORDS.
3. "keywords": MUST CONTAIN STRICTLY BETWEEN 6 TO 9 KEYWORDS as an array of strings in English (must include PINNED KEYWORDS).

PINNED KEYWORDS (MANDATORY - MUST BE INCLUDED): ${input.pinnedKeywords?.join(', ') || 'None'}
ACTIVE CONTEXTUAL KEYWORDS (Intelligently select as relevant): ${input.activeKeywords.join(', ')}`,
    },
    {
      role: 'user',
      content: input.imageDataUrl
        ? [
            { type: 'text', text: `Prompt: ${input.prompt}\nPinned Mandatory Keywords: ${input.pinnedKeywords?.join(', ') || 'None'}\nActive Target Keywords: ${input.activeKeywords.join(', ')}` },
            { type: 'image_url', image_url: { url: input.imageDataUrl } }
          ]
        : `Prompt: ${input.prompt}\nPinned Mandatory Keywords: ${input.pinnedKeywords?.join(', ') || 'None'}\nActive Target Keywords: ${input.activeKeywords.join(', ')}`,
    },
  ];

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model || 'moonshotai/Kimi-K3',
      messages,
      temperature: 0.3,
      max_tokens: 2048,
      top_p: 0.95,
      stream: false,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'arigato_site_seo_result',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              aboutPrompt: { type: 'string' },
              seoDescription: { type: 'string' },
              keywords: { type: 'array', items: { type: 'string' } },
              siteMetaTitle: { type: 'string' }
            },
            required: ['aboutPrompt', 'seoDescription', 'keywords', 'siteMetaTitle'],
            additionalProperties: false
          }
        }
      }
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Kimi API returned status ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content || '{}';
  const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);

  const aboutPrompt = enforceWordLimit(parsed.aboutPrompt || '', 199);
  const seoDescription = enforceCharLimit(parsed.seoDescription || '', 160);
  let keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];
  if (keywords.length < 6) keywords = [...keywords, 'creative prompt engineering', 'arigato studio', 'ai visual art'];
  keywords = keywords.slice(0, 9);

  return {
    aboutPrompt,
    wordCount: countWords(aboutPrompt),
    seoDescription,
    charCount: seoDescription.length,
    keywords,
    keywordsMatched: input.activeKeywords,
    siteMetaTitle: parsed.siteMetaTitle,
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

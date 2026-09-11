import frameworkData from './prompt_metadata_framework.json';

export interface FrameworkExample {
  id: string;
  reference_type: string;
  input_concept: string;
  output: {
    about_this_prompt: string;
    seo_description: string;
    seo_keywords: string[];
    prompt_title: string;
    counts?: {
      about_word_count?: number;
      seo_description_character_count?: number;
      seo_keyword_count?: number;
    };
  };
}

export const FRAMEWORK_METADATA = {
  name: frameworkData.name,
  version: frameworkData.version,
  purpose: frameworkData.purpose,
  hard_constraints: frameworkData.hard_constraints,
  validation: frameworkData.validation_before_final_answer,
  user_preferences: frameworkData.user_preferences,
};

export const ALL_FRAMEWORK_EXAMPLES: FrameworkExample[] =
  (frameworkData.example_library?.examples as FrameworkExample[]) || [];

/**
 * Dynamically select the most relevant 3-4 golden few-shot examples from the 22-example library
 * based on input prompt keywords, subject type, and visual ambiance.
 */
export function selectFewShotExamples(
  conceptQuery: string = '',
  subjectType: string = 'couple',
  maxCount: number = 3
): FrameworkExample[] {
  const query = conceptQuery.toLowerCase();

  // Keyword-based relevancy scoring
  const scored = ALL_FRAMEWORK_EXAMPLES.map((ex) => {
    let score = 0;
    const ref = ex.reference_type.toLowerCase();
    const concept = ex.input_concept.toLowerCase();
    const about = ex.output.about_this_prompt.toLowerCase();

    // 1980s / Retro / Vintage
    if (query.includes('80s') || query.includes('1980') || query.includes('retro') || query.includes('vintage') || query.includes('enfield') || query.includes('disposable')) {
      if (ref.includes('1980') || ref.includes('retro') || ref.includes('vintage') || ref.includes('disposable')) score += 10;
    }

    // Three-frame / Collage
    if (query.includes('three') || query.includes('frame') || query.includes('collage') || query.includes('stacked') || query.includes('panel')) {
      if (ref.includes('three-frame') || ref.includes('collage')) score += 10;
    }

    // Mirror Selfie
    if (query.includes('mirror') || query.includes('reflection') || query.includes('saree') || query.includes('bathroom')) {
      if (ref.includes('mirror')) score += 10;
    }

    // Night / Fairy lights / Bedroom / Dim
    if (query.includes('night') || query.includes('dark') || query.includes('fairy') || query.includes('bedroom') || query.includes('dim')) {
      if (ref.includes('night') || ref.includes('dim') || ref.includes('fairy') || ref.includes('bedroom')) score += 8;
    }

    // Kiss / Romantic intimate
    if (query.includes('kiss') || query.includes('hug') || query.includes('embrace') || query.includes('cheek')) {
      if (ref.includes('kiss') || ref.includes('hug') || ref.includes('embrace')) score += 8;
    }

    // Café / Restaurant / Indoor
    if (query.includes('cafe') || query.includes('café') || query.includes('coffee') || query.includes('restaurant')) {
      if (ref.includes('café') || ref.includes('restaurant')) score += 10;
    }

    // Sunlight / Golden hour / Outdoor
    if (query.includes('sunlight') || query.includes('golden') || query.includes('outdoor') || query.includes('grass')) {
      if (ref.includes('sunlight') || ref.includes('grass') || ref.includes('golden')) score += 8;
    }

    // Solo gender matching
    if (subjectType === 'solo_female') {
      if (ref.includes('mirror selfie') || ref.includes('portrait')) score += 3;
    } else if (subjectType === 'solo_male') {
      if (ref.includes('male') || ref.includes('enfield') || ref.includes('party portrait')) score += 6;
    }

    // General token overlap
    const words = query.split(/\s+/).filter((w) => w.length > 3);
    for (const w of words) {
      if (concept.includes(w) || ref.includes(w) || about.includes(w)) {
        score += 2;
      }
    }

    return { ex, score };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // If no specific match, default to a balanced set of top diverse examples (EX01 collage, EX02 intimate, EX03 cafe)
  const defaultIds = ['EX01', 'EX02', 'EX03', 'EX19'];
  const topMatches = scored.filter((s) => s.score > 2).map((s) => s.ex);

  const selected: FrameworkExample[] = [];
  for (const m of topMatches) {
    if (selected.length >= maxCount) break;
    if (!selected.some((s) => s.id === m.id)) selected.push(m);
  }

  // Fill up with defaults if needed
  for (const id of defaultIds) {
    if (selected.length >= maxCount) break;
    const found = ALL_FRAMEWORK_EXAMPLES.find((e) => e.id === id);
    if (found && !selected.some((s) => s.id === found.id)) {
      selected.push(found);
    }
  }

  return selected;
}

/**
 * Builds the framework injection prompt section for Arigato Site SEO.
 */
export function buildArigatoFrameworkPromptSection(
  conceptQuery: string = '',
  subjectType: string = 'couple'
): string {
  const examples = selectFewShotExamples(conceptQuery, subjectType, 3);

  const examplesMarkdown = examples
    .map(
      (ex, i) => `### Example ${i + 1} (${ex.reference_type} — ID: ${ex.id}):
**Input Concept**:
"${ex.input_concept}"

**Expected Structured JSON Output**:
\`\`\`json
{
  "aboutPrompt": "${ex.output.about_this_prompt.replace(/"/g, '\\"')}",
  "seoDescription": "${ex.output.seo_description.replace(/"/g, '\\"')}",
  "keywords": ${JSON.stringify(ex.output.seo_keywords)},
  "siteMetaTitle": "${ex.output.prompt_title.replace(/"/g, '\\"')}"
}
\`\`\`
*(Word count: ${ex.output.about_this_prompt.split(/\s+/).length}/199 words • SEO Description: ${ex.output.seo_description.length}/160 chars • Exactly 10 keywords)*`
    )
    .join('\n\n');

  return `
=======================================================
ARIGATO SITE SEO — OFFICIAL METADATA SPECIFICATION FRAMEWORK
=======================================================
Convert the visual artwork and prompt concept into exactly FOUR authoritative, copy-ready metadata fields while strictly honoring counting limits:

CORE 8-DIMENSION CONTENT BLUEPRINT (FOR "aboutPrompt"):
Every "aboutPrompt" MUST cover these 8 vital dimensions in natural, fluent sentences:
1. Main Visual Concept: Core composition, scene type (e.g. 3-frame collage, close selfie, mirror portrait, aesthetic setting).
2. Facial Identity Preservation: Strict preservation of facial bone structure, natural asymmetry, authentic skin tone, eye contact, and expression.
3. Pose & Physical Interaction: Body alignment, contact pressure, hand placement, touch, and authentic chemistry without stiffness.
4. Outfits & Wardrobe: Specific garments, fabrics, textures, colors, and accessories.
5. Environment & Background: Specific location details (indoor walls, foliage, lights, cafe, street) with natural depth.
6. Lighting & Atmosphere: Directional light, window illumination, warm lamp glow, soft bokeh, or ambient falloff.
7. Camera & Composition: Smartphone perspective (24-28mm lens), vertical 9:16 framing, close framing.
8. Authentic Realism & Smartphone Imperfections: Visible skin pores, subtle blemishes, flyaway hair, fabric wrinkles, natural exposure, minor noise/grain. STRICTLY AVOID artificial AI beauty smoothing, plastic skin, or CGI renders!

STRICT LENGTH & COUNTING RULES:
1. "aboutPrompt":
   - STRICT LIMIT: Exactly 151 to 199 words (Preferred target: 175 to 195 words).
   - NEVER exceed 199 words.
   - Weave the pre-assigned target keywords naturally into fluent sentences across the 8 dimensions.
2. "seoDescription":
   - STRICT LIMIT: 140 to 160 characters (Never exceed 160 characters).
   - A compelling, click-worthy Google SERP meta description sentence highlighting the core prompt idea.
3. "keywords":
   - Exactly 9 to 10 keyword tags.
   - Keywords 1-3 describe the specific visual artwork/concept.
   - Remaining keywords cover the assigned broader target/pinned keywords.
4. "siteMetaTitle":
   - A short, distinctive, click-worthy title (under 65 chars).

-------------------------------------------------------
GOLDEN PRODUCTION FEW-SHOT EXAMPLES (STUDY THESE CAREFULLY):
-------------------------------------------------------
${examplesMarkdown}
=======================================================
`;
}

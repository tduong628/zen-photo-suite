
import { GoogleGenAI, GenerateContentResponse, Part, Modality, Type } from "@google/genai";


// ─── Gemini Proxy ────────────────────────────────────────────────────────
// All generateContent calls route through a private Apps Script proxy so the
// API key never ships in this (public) bundle. Google auto-revokes any key it
// finds in public code — the proxy is the permanent fix.
const GEMINI_PROXY_URL = 'https://script.google.com/macros/s/AKfycbwJjnu2i1lZvVdawRUf_A81Er-9rZzyqlJd8rMGZ8JuUazdW7YqHhZg8lLQTjBjHsga9Q/exec';

interface ProxyRequest {
    model: string;
    contents: unknown;
    config?: Record<string, unknown>;
}

const proxyGenerateContent = async (req: ProxyRequest): Promise<GenerateContentResponse> => {
    const { systemInstruction, tools, ...generation } = (req.config || {}) as Record<string, unknown>;

    let contents: unknown = req.contents;
    if (typeof contents === 'string') {
        contents = [{ role: 'user', parts: [{ text: contents }] }];
    } else if (contents && !Array.isArray(contents)) {
        contents = [{ role: 'user', ...(contents as object) }];
    }

    const body: Record<string, unknown> = { contents };
    if (systemInstruction) body.systemInstruction = systemInstruction;
    if (tools) body.tools = tools;
    if ((generation as Record<string, unknown>).imageConfig) {
        (generation as Record<string, unknown>).responseModalities = ['TEXT', 'IMAGE'];
    }
    if (Object.keys(generation).length > 0) body.generationConfig = generation;

    const res = await fetch(GEMINI_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ model: req.model, body }),
    });
    if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'Gemini proxy error');
    return data as GenerateContentResponse;
};

const fileToGenerativePart = (base64: string, mimeType: string): Part => {
    return {
        inlineData: {
            data: base64,
            mimeType,
        },
    };
};

/**
 * SHARED INTERFACES
 */
interface SceneVariation {
  label: string;
  environmentTexture: string;
  compositionRule: string;
  seasons?: number[]; // Added Seasonality Support (0-11 for months)
}

export interface StyleDefinition {
  id: string;
  name: string;
  cameraLens: string;
  lightingSetup: string;
  colorGrade: string;
  scenes: SceneVariation[];
}

/**
 * CLASSIC & CHIC - STYLE CONFIGURATION
 */
export const classicChicStyles: Record<string, StyleDefinition> = {
  elegant_studio: {
    id: 'elegant_studio',
    name: 'Elegant Studio',
    cameraLens: "Shot on 100mm Macro Lens, Aperture f/8. Crystal sharp focus on nail details. Minimal depth of field blur.",
    lightingSetup: "High-Key Commercial Lighting. Butterfly lighting setup (light from top-front) to create a distinct glossy reflection line (catchlight) on the nail curvature. No harsh shadows.",
    colorGrade: "Clean, cool-neutral white balance. Desaturated shadows. High brightness.",
    scenes: [
      {
        label: "Standard Marble",
        environmentTexture: "Pristine White Carrara Marble surface with faint, soft grey veining. Background is a clean, white infinity curve.",
        compositionRule: "Minimalist composition. The hand is the sole focus. Negative space is pure white/light grey."
      }
    ]
  },
  modern_neutrals: {
    id: 'modern_neutrals',
    name: 'Modern Neutrals',
    cameraLens: "Shot on 50mm Portrait Lens, Aperture f/2.8. Soft focus background (bokeh). Sharp focus ONLY on the fingernails.",
    lightingSetup: "Soft North-Facing Window Light. Diffused, cloudy-day illumination. Shadows are extremely soft and organic.",
    colorGrade: "Matte finish. Low contrast. Earthy palette: Sage, Sand, Taupe, Cream.",
    scenes: [
      {
        label: "Stone & Linen",
        environmentTexture: "Textured Beige Travertine stone surface paired with a swatch of raw, washed linen fabric in cream.",
        compositionRule: "Organic placement. Hand resting naturally. Background elements (dried pampas grass) are out of focus."
      },
      {
        label: "Plaster & Shadow",
        environmentTexture: "Smooth, matte Venetian plaster surface in warm white. Subtle geometric shadows from a window blind cast across the surface.",
        compositionRule: "Artistic flat-lay. Hand relaxed on the surface. Minimal props."
      },
      {
        label: "Ceramics & Wood",
        environmentTexture: "Light Oak wood surface, very desaturated. In the background, blurry shapes of handmade beige ceramics.",
        compositionRule: "Depth composition. Hand is in the foreground, ceramics create a soft backdrop."
      },
      {
        label: "Silk Sheets",
        environmentTexture: "Messy, unmade silk or high-thread-count cotton bedsheets in white. Soft folds and fabric ripples.",
        compositionRule: "Morning light vibe. Hand resting gently on the soft fabric folds."
      },
      {
        label: "Dried Florals",
        environmentTexture: "Matte beige paper texture. A blurred arrangement of dried bunny tails and eucalyptus in the background.",
        compositionRule: "Top-down view. Hand centered, surrounded by negative space and soft botanical shadows."
      },
      {
        label: "White Sand",
        environmentTexture: "Fine grain white sand, raked in a zen garden pattern. Very clean and textural.",
        compositionRule: "Nature vibe. Hand resting gently on the textured sand surface."
      },
      {
        label: "Woven Rattan",
        environmentTexture: "Natural light wicker or rattan furniture texture. Organic woven pattern visible in close-up.",
        compositionRule: "Summer aesthetic. Hand resting on the arm of a wicker chair."
      },
      {
        label: "Spa Water",
        environmentTexture: "Smooth, polished grey river stones next to calm water. No splashing, just serenity.",
        compositionRule: "Spa vibe. Hand resting on a dry stone, water ripples blurred in background."
      }
    ]
  },
  mocha_mood: {
    id: 'mocha_mood',
    name: 'Mocha Mood',
    cameraLens: "Shot on 35mm Wide Angle, Aperture f/1.8. Heavy background blur to emphasize atmospheric depth.",
    lightingSetup: "Cinematic Golden Hour. Warm amber side-lighting. A subtle rim-light on the fingers to separate them from the dark background.",
    colorGrade: "Warm color temperature (3500K). Rich blacks, golden highlights, cozy atmosphere.",
    scenes: [
      {
        label: "Cafe Walnut",
        environmentTexture: "Polished Dark Walnut wood table with visible wood grain. Reflections of warm cafe lights on the surface.",
        compositionRule: "Lifestyle framing. Hand interacting with a white ceramic cup (latte art visible but blurred)."
      },
      {
        label: "Bistro Marble",
        environmentTexture: "Round white bistro table with gold rim. Background is a dark, busy cafe interior but heavily blurred.",
        compositionRule: "Casual elegance. Hand resting near a gold spoon or pastry plate (blurred)."
      },
      {
        label: "Cozy Knit",
        environmentTexture: "Soft, chunky knit blanket texture in oatmeal or cocoa color. No hard surfaces visible.",
        compositionRule: "Intimate close-up. Hand resting on the soft fabric texture, evoking warmth and comfort."
      },
      {
        label: "Vintage Leather",
        environmentTexture: "Tufted brown leather armchair texture. Deep, rich leather grain visible.",
        compositionRule: "Relaxed pose. Hand resting on the arm of a leather chair. Dark, moody library vibe."
      },
      {
        label: "Rainy Window",
        environmentTexture: "Wooden window sill. Background is a window pane with rain droplets and city lights blurred (bokeh) outside.",
        compositionRule: "Atmospheric. Hand holding a warm mug or resting near the glass. Blue/Orange contrast."
      },
      {
        label: "Literary Vibe",
        environmentTexture: "An open book with yellowed pages. Text is blurry and illegible.",
        compositionRule: "Intellectual aesthetic. Hand resting on the open pages of a vintage book. Soft focus."
      }
    ]
  }
};

/**
 * VIBRANT & BOLD - STYLE CONFIGURATION
 * ------------------------------------------------
 */
export const vibrantBoldStyles: Record<string, StyleDefinition> = {
  vibrant_pop: {
    id: 'vibrant_pop',
    name: 'Vibrant Pop',
    cameraLens: "Shot on 100mm Macro Lens, Aperture f/5.6. Razor-sharp focus on the nail art. High-gloss finish.",
    lightingSetup: "High-Contrast Studio Lighting. Colored gel rim-lights (Cyan and Magenta) outlining the hand. Deep, rich shadows. Specular highlights on the nails.",
    colorGrade: "Vivid, Saturated, 'Cyber-Fashion' aesthetic. Punchy primaries. High contrast blacks.",
    scenes: [
      {
        label: "Liquid Chrome",
        environmentTexture: "Surreal, melting liquid metal texture (silver/mercury) with distorted reflections of the hand. (Like a T-1000 effect).",
        compositionRule: "Futuristic vibe. Hand interacting with the fluid shapes. High reflectivity."
      },
      {
        label: "Neon Noir",
        environmentTexture: "Dark, glossy black acrylic surface. In the background, out-of-focus neon tube lights (Pink and Electric Blue) forming geometric lines.",
        compositionRule: "Cyberpunk aesthetic. Hand resting on the reflective black surface."
      },
      {
        label: "Dichroic Glass",
        environmentTexture: "Faceted glass background that shifts colors (iridescent) like a prism. Sharp, angular light refractions.",
        compositionRule: "Abstract luxury. Hand floating in front of the prismatic glass."
      },
      {
        label: "Velvet & Laser",
        environmentTexture: "Deep black velvet fabric (light absorbing) contrasted with a single, sharp red laser beam cutting across the background.",
        compositionRule: "High drama. The hand is illuminated by the beam. Very dark mood."
      },
      {
        label: "Color Block Studio",
        environmentTexture: "A seamless paper background split diagonally into two bold, matte colors (e.g., Hot Pink and Canary Yellow).",
        compositionRule: "Fashion editorial. Hand placement follows the diagonal line of the color split."
      },
      {
        label: "Disco Inferno",
        environmentTexture: "Macro close-up of a disco ball or mirrored mosaic tiles. Hundreds of tiny light reflections.",
        compositionRule: "Party vibe. High energy. Sparkles everywhere."
      },
      {
        label: "Tropical Punch",
        environmentTexture: "Bright, saturated yellow wall. Sharp, hard shadows of Monstera leaves cast across the hand.",
        compositionRule: "Summer pop art. Hard shadows create a graphic pattern."
      },
      {
        label: "Ultraviolet Garden",
        environmentTexture: "Exotic plants under UV (Blacklight). The plants glow neon purple and green.",
        compositionRule: "Avatar/Sci-fi nature vibe. Glowing bioluminescence."
      }
    ]
  },

  seasonal_glow: {
    id: 'seasonal_glow',
    name: 'Seasonal Glow',
    cameraLens: "Shot on 85mm Prime Portrait Lens. Aperture f/1.2. Extremely creamy bokeh (background blur).",
    lightingSetup: "Natural Backlight (Golden Hour). Sun flare entering the lens. Soft, warm fill light on the hand.",
    colorGrade: "Warm, gold-tinted, nostalgic. Soft contrast. Dreamy atmosphere.",
    scenes: [
      {
        label: "Autumn Forest",
        environmentTexture: "Blurred background of vibrant orange and red maple leaves backlit by the sun.",
        compositionRule: "Nature portrait. Hand resting on a rustic wooden fence."
      },
      {
        label: "Spring Bloom",
        environmentTexture: "Soft focus background of pink cherry blossoms or white magnolia flowers.",
        compositionRule: "Ethereal. Hand reaching towards a blurred flower branch."
      },
      {
        label: "Summer Poolside",
        environmentTexture: "Sparkling blue water texture in the background. Bright, high-key sunlight. White stone edge.",
        compositionRule: "Vacation vibe. Hand resting on the cool white stone."
      },
      {
        label: "Winter Frost",
        environmentTexture: "Background of soft white fairy lights (bokeh) and a hint of frosted glass or ice.",
        compositionRule: "Cozy winter. Hand resting on a soft white fur texture."
      },
      {
        label: "Golden Field",
        environmentTexture: "Tall wheat grass at sunset. The background is a wash of gold and amber light.",
        compositionRule: "Romantic. Silhouette of wheat stalks in the foreground."
      },
      {
        label: "Morning Dew",
        environmentTexture: "Fresh green grass with morning dew droplets, heavily blurred in the background.",
        compositionRule: "Fresh start. Low angle shot."
      }
    ]
  }
};

/**
 * LIFESTYLE & COZY - STYLE CONFIGURATION
 * ------------------------------------------------
 */
export const lifestyleCozyStyles: Record<string, StyleDefinition> = {
  lifestyle_luxury: {
    id: 'lifestyle_luxury',
    name: 'Lifestyle Luxury',
    cameraLens: "Shot on 35mm Prime Lens, Aperture f/1.8. Environmental portrait style. Background is discernible but artistically blurred (bokeh).",
    lightingSetup: "Soft, Natural Window Light. Mimics high-end influencer photography. Flattering, even illumination on the skin.",
    colorGrade: "Clean, Modern, 'Instagram Aesthetic'. Slightly desaturated backgrounds, true-to-life skin tones, bright whites.",
    scenes: [
      {
        label: "Luxury Car",
        environmentTexture: "Leather steering wheel texture (bare unmarked hub) and dashboard. Soft daylight coming through the windshield.",
        compositionRule: "POV (Point of View) shot. Hand resting on the wheel or adjusting a vent."
      },
      {
        label: "Designer Bag",
        environmentTexture: "Texture of a high-end leather handbag (quilted or pebbled leather). Gold hardware accents visible.",
        compositionRule: "Hand resting casually on the bag strap or clasp."
      },
      {
        label: "Coffee Date",
        environmentTexture: "White marble cafe table with a blurred latte art cup in the background. Fine china saucer.",
        compositionRule: "Relaxed social vibe. Hand resting near the coffee cup."
      },
      {
        label: "Shopping Spree",
        environmentTexture: "Blurred background of a luxury shopping district or boutique interior. Glass and polished metal surfaces.",
        compositionRule: "Motion suggestion. Hand holding shopping bag handles (straps)."
      },
      {
        label: "Vanity Table",
        environmentTexture: "Reflective glass surface with blurred crystal perfume bottles and jewelry in the background.",
        compositionRule: "Getting ready. Hand resting amongst beauty products."
      }
    ]
  },

  cozy_knit: {
    id: 'cozy_knit',
    name: 'Cozy Knit',
    cameraLens: "Shot on 50mm Portrait Lens, Aperture f/2.0. Soft focus. Intimate close-up.",
    lightingSetup: "Warm Indoor Ambience. Soft tungsten glow mixed with natural light. Gentle shadows.",
    colorGrade: "Warm, Muted, 'Hygge' aesthetic. Beige, Cream, Oatmeal, Soft Grey tones. Low contrast.",
    scenes: [
      {
        label: "Oversized Sleeve",
        environmentTexture: "Chunky knit sweater texture covering the wrist and palm. Only fingers and nails visible.",
        compositionRule: "Texture contrast. Smooth nails against rough wool."
      },
      {
        label: "Warm Mug",
        environmentTexture: "Ceramic mug with steam rising. Background is out of focus cozy living room.",
        compositionRule: "Two hands (or one) wrapping around the warm mug."
      },
      {
        label: "Soft Blanket",
        environmentTexture: "Fuzzy fleece or faux fur blanket texture in soft white or grey.",
        compositionRule: "Relaxed hand buried slightly in the soft pile."
      },
      {
        label: "Book & Bed",
        environmentTexture: "White duvet cover and an open paperback book. Reading glasses blurred in background.",
        compositionRule: "Lazy Sunday vibe. Hand resting on the book page."
      },
      {
        label: "Candlelight",
        environmentTexture: "Darker wood surface with warm candlelight bokeh in the background.",
        compositionRule: "Atmospheric. Hand resting near the glow."
      }
    ]
  },

  golden_spring: {
    id: 'golden_spring',
    name: 'Golden Spring',
    cameraLens: "Shot on 85mm f/1.4. Dreamy foreground and background blur.",
    lightingSetup: "Backlit by soft, golden sunrise. Lens flare elements.",
    colorGrade: "Pastel and Gold. Soft pinks, greens, and warm sunlight.",
    scenes: [
      { label: "Cherry Blossom", environmentTexture: "Pink floral bokeh. Soft petals floating.", compositionRule: "Hand reaching toward flowers." },
      { label: "Fresh Grass", environmentTexture: "Soft green grass with dew. Sunlight catching the droplets.", compositionRule: "Low angle, hand touching grass." },
      { label: "Tulip Field", environmentTexture: "Blurred rows of colorful tulips (yellow/red).", compositionRule: "Vibrant nature background." }
    ]
  },

  golden_summer: {
    id: 'golden_summer',
    name: 'Golden Summer',
    cameraLens: "Shot on 24mm Wide f/2.8. Bright and sharp.",
    lightingSetup: "Hard, direct golden hour sunlight. Defined shadows.",
    colorGrade: "Vibrant Gold and Turquoise. Sun-drenched.",
    scenes: [
      { label: "Poolside", environmentTexture: "Blue pool water refraction. White stone coping.", compositionRule: "Hand on pool edge." },
      { label: "Sand", environmentTexture: "Golden sand texture. Beach vibe.", compositionRule: "Hand resting on sand." },
      { label: "Yacht Deck", environmentTexture: "Teak wood decking. Ocean horizon blurred in distance.", compositionRule: "Luxury travel." }
    ]
  },

  golden_fall: {
    id: 'golden_fall',
    name: 'Golden Fall',
    cameraLens: "Shot on 50mm f/1.8.",
    lightingSetup: "Warm, diffused afternoon light.",
    colorGrade: "Amber, Orange, Rust. Rich and warm.",
    scenes: [
      { label: "Leaves", environmentTexture: "Carpet of fallen maple leaves.", compositionRule: "Hand holding a leaf." },
      { label: "Pumpkin", environmentTexture: "Blurry pumpkin patch background.", compositionRule: "Hand resting on a pumpkin." },
      { label: "Wheat Field", environmentTexture: "Tall dry grass/wheat. Golden hour backlight.", compositionRule: "Rustic beauty." }
    ]
  },

  golden_winter: {
    id: 'golden_winter',
    name: 'Golden Winter',
    cameraLens: "Shot on 100mm Macro f/2.8.",
    lightingSetup: "Crisp, cold sunlight reflecting off snow.",
    colorGrade: "Cool Blues and Bright White Gold highlights.",
    scenes: [
      { label: "Snow", environmentTexture: "Sparkling fresh snow.", compositionRule: "Hand creating a shape in snow (or hovering)." },
      { label: "Icicles", environmentTexture: "Frozen glass texture. Frost patterns.", compositionRule: "Hand against a frosty window." },
      { label: "Fur Coat", environmentTexture: "Rich white or grey fur coat texture.", compositionRule: "Luxury winter fashion." }
    ]
  },

  golden_xmas: {
    id: 'golden_xmas',
    name: 'Golden Christmas',
    cameraLens: "Shot on 50mm f/1.2 (Bokeh Monster).",
    lightingSetup: "Dim ambient light + Fairy lights.",
    colorGrade: "Rich Red, Green, and Gold. Festive and dark.",
    scenes: [
      { label: "Tree Lights", environmentTexture: "Bokeh balls of Christmas tree lights.", compositionRule: "Hand holding an ornament." },
      { label: "Gift", environmentTexture: "Wrapping paper texture. Gold ribbon.", compositionRule: "Hand resting on a gift box." },
      { label: "Hot Cocoa", environmentTexture: "Mug with marshmallows. Candy cane blurred.", compositionRule: "Festive treat." }
    ]
  },

  golden_ny: {
    id: 'golden_ny',
    name: 'Golden New Year',
    cameraLens: "Shot on 35mm f/1.8. Motion feel.",
    lightingSetup: "Sparkler light source. Dynamic and shifting.",
    colorGrade: "Black, Silver, and Gold. High contrast party vibe.",
    scenes: [
      { label: "Champagne", environmentTexture: "Bubbles in a glass. Gold rim.", compositionRule: "Hand holding a champagne flute." },
      { label: "Sparkler", environmentTexture: "Trailing light sparks. Dark background.", compositionRule: "Hand holding a sparkler." },
      { label: "Confetti", environmentTexture: "Gold and Silver confetti on a black table.", compositionRule: "Party aftermath." }
    ]
  }
};

/**
 * HOLIDAY & EVENTS - STYLE CONFIGURATION
 * ------------------------------------------------
 */
export const holidayStyles: Record<string, StyleDefinition> = {
  holiday_valentines: {
    id: 'holiday_valentines',
    name: 'Valentine\'s Romance',
    cameraLens: "Shot on 85mm f/1.2. Soft, romantic focus. Dreamy bokeh.",
    lightingSetup: "Soft Candlelight. Warm, flickering glow with deep shadows.",
    colorGrade: "Romantic Red and Pink. Soft contrast. Rose-gold tint.",
    scenes: [
      {
        label: "Red Silk",
        environmentTexture: "Cascading folds of deep red satin fabric. High sheen.",
        compositionRule: "Luxury drapery. Hand resting gently on the fabric curves."
      },
      {
        label: "Rose Petals",
        environmentTexture: "White marble surface scattered with fresh red rose petals.",
        compositionRule: "Classic romance. Hand resting amongst the petals."
      },
      {
        label: "Dinner Date",
        environmentTexture: "Blurred background of a romantic restaurant. Wine glass reflection.",
        compositionRule: "Social framing. Hand holding the stem of a glass (or resting near it)."
      },
      {
        label: "Pink Tulle",
        environmentTexture: "Layers of soft pink tulle or chiffon. Very ethereal and airy.",
        compositionRule: "Soft & Sweet. Hand floating in the fabric layers."
      }
    ]
  },

  holiday_christmas: {
    id: 'holiday_christmas',
    name: 'Classic Christmas',
    cameraLens: "Shot on 50mm f/1.4. Sparkle bokeh effect.",
    lightingSetup: "Warm String Lights. Glowing ambient light.",
    colorGrade: "Rich Green, Red, and Gold. Festive and cozy.",
    scenes: [
      {
        label: "Frosted Pine",
        environmentTexture: "Close up of evergreen pine needles with a dusting of faux snow.",
        compositionRule: "Nature texture. Hand resting near the greenery."
      },
      {
        label: "Gold Ornaments",
        environmentTexture: "Background full of out-of-focus gold and red glass ornaments.",
        compositionRule: "Reflective luxury. Hand resting on a wrapped gift."
      },
      {
        label: "Velvet Ribbon",
        environmentTexture: "Deep emerald green velvet ribbon texture.",
        compositionRule: "Textural contrast. Hand interacting with the ribbon."
      }
    ]
  },

  holiday_newyear: {
    id: 'holiday_newyear',
    name: 'New Year\'s Eve',
    cameraLens: "Shot on 35mm f/1.8. Dynamic and sharp.",
    lightingSetup: "Flash Photography Style. High contrast, sparkling highlights.",
    colorGrade: "Black, Silver, and Gold. High glamour party vibe.",
    scenes: [
      {
        label: "Confetti",
        environmentTexture: "Black surface covered in gold and silver metallic confetti.",
        compositionRule: "Party aftermath. High energy composition."
      },
      {
        label: "Sparklers",
        environmentTexture: "Dark background with trails of golden light (sparklers).",
        compositionRule: "Motion blur background. Hand sharp in foreground."
      },
      {
        label: "Champagne Tower",
        environmentTexture: "Crystal glass texture with bubbles. Golden liquid.",
        compositionRule: "Luxury celebration. Hand holding a crystal flute."
      }
    ]
  },

  holiday_halloween: {
    id: 'holiday_halloween',
    name: 'Chic Halloween',
    cameraLens: "Shot on 50mm f/1.8. Moody and dark.",
    lightingSetup: "Low-key lighting. Rim lighting in purple or orange.",
    colorGrade: "Dark, Moody, 'Witchy-Vibe'. Desaturated blacks and rich purples.",
    scenes: [
      {
        label: "Black Lace",
        environmentTexture: "Intricate black lace fabric over a dark surface.",
        compositionRule: "Gothic elegance. Hand resting on the lace."
      },
      {
        label: "Moody Smoke",
        environmentTexture: "Dark background with swirling dry ice fog/smoke.",
        compositionRule: "Mysterious. Hand emerging from the shadows."
      },
      {
        label: "Dried Roses",
        environmentTexture: "Bouquet of dried, dark red/black roses. Gothic aesthetic.",
        compositionRule: "Dark romance. Hand touching a dried flower."
      }
    ]
  },

  holiday_thanksgiving: {
    id: 'holiday_thanksgiving',
    name: 'Harvest Chic',
    cameraLens: "Shot on 50mm f/2.0. Natural and crisp.",
    lightingSetup: "Warm Afternoon Sun. Golden hour shadows.",
    colorGrade: "Earthy Oranges, Browns, and Cream. Warm white balance.",
    scenes: [
      {
        label: "Rustic Table",
        environmentTexture: "Reclaimed wood table with a linen runner.",
        compositionRule: "Family gathering vibe. Hand resting on the wood."
      },
      {
        label: "White Pumpkins",
        environmentTexture: "Elegant small white pumpkins and dried wheat.",
        compositionRule: "Modern farmhouse. Minimalist harvest decor."
      }
    ]
  },

  holiday_mothersday: {
    id: 'holiday_mothersday',
    name: 'Mother\'s Day',
    cameraLens: "Shot on 85mm f/1.8. Soft and bright.",
    lightingSetup: "Diffused Morning Light. Very clean and airy.",
    colorGrade: "Pastels. Soft Pink, Lilac, and White. High key.",
    scenes: [
      {
        label: "Tea Garden",
        environmentTexture: "Floral porcelain tea cup and saucer. White tablecloth.",
        compositionRule: "Elegant tea time. Hand resting near the cup."
      },
      {
        label: "Fresh Tulips",
        environmentTexture: "Blurry background of pink and white tulips.",
        compositionRule: "Spring garden. Fresh and joyful."
      }
    ]
  }
};

/**
 * MODEL & EDITORIAL - STYLE CONFIGURATION
 * ------------------------------------------------
 * High-Fashion, Object-Centric themes.
 * CRITICAL STRATEGY: We NEVER generate a human face, chin, neck, shoulder, or hair.
 * The uploaded hand is the ONLY human element in frame — every scene pairs it with
 * inanimate props, fabric laid flat or draped over furniture, and backdrops only.
 */
export const modelStyles: Record<string, StyleDefinition> = {
  model_luxury: {
    id: 'model_luxury',
    name: 'Luxury Living',
    cameraLens: "Shot on 85mm Prime f/1.4. Beauty Editorial style. Shallow depth of field. Sharp focus on nails, soft focus on the background props.",
    lightingSetup: "Cinematic Penthouse Lighting. Mixed color temperatures (Cool city lights in background, Warm flattering key light on the hand).",
    colorGrade: "Rich, Expensive, 'Old Money' aesthetic. Deep blacks, champagne highlights, low saturation.",
    scenes: [
      {
        label: "The Clutch",
        environmentTexture: "Texture of a quilted luxury leather bag (black or beige). Gold hardware details.",
        compositionRule: "Fashion Accessory. Hand clutching the bag. No face or body visible."
      },
      {
        label: "Jewelry Adjustment",
        environmentTexture: "A diamond necklace or pearl strand draped over a velvet jewelry stand.",
        compositionRule: "Beauty Product Shot. Hand adjusting the necklace on the stand. No face or body visible."
      },
      {
        label: "Evening Toast",
        environmentTexture: "Crystal champagne flute. Background is a bokeh-heavy city skyline at night.",
        compositionRule: "Socialite vibe. Hand holding the glass stem. City lights in background."
      },
      {
        label: "Silk Robe",
        environmentTexture: "High-sheen silk or satin fabric (champagne or emerald), laid out with soft folds.",
        compositionRule: "Getting Ready flat lay. Hand resting on the folded silk fabric. No face or body visible."
      },
      {
        label: "The Balcony",
        environmentTexture: "Glass railing reflection. Dark blurred city background.",
        compositionRule: "Atmospheric. Hand resting on a glass railing."
      }
    ]
  },

  model_urban: {
    id: 'model_urban',
    name: 'Urban Chic',
    cameraLens: "Shot on 50mm f/1.8. Street photography style. Bokeh background.",
    lightingSetup: "Natural City Light. Overcast day (soft box effect) or Golden Hour sun flare.",
    colorGrade: "Modern, slightly desaturated, high contrast. 'Street Style' blog aesthetic.",
    scenes: [
      {
        label: "Sunglasses",
        environmentTexture: "Reflective dark sunglasses resting on a ledge or held up to the light. City street reflection visible in the lens.",
        compositionRule: "Cool Factor. Hand holding the sunglasses up to the light. No face visible."
      },
      {
        label: "Leather Jacket",
        environmentTexture: "Black leather biker jacket with silver zippers, draped over a chair.",
        compositionRule: "Edgy fashion. Hand resting on the draped leather lapel. No body visible."
      },
      {
        label: "Coffee Run",
        environmentTexture: "Minimalist 'to-go' coffee cup (white paper). Blurred busy street background.",
        compositionRule: "Lifestyle movement. Hand holding the cup."
      },
      {
        label: "Denim & Diamonds",
        environmentTexture: "High-quality blue denim fabric, folded on a surface.",
        compositionRule: "Casual Luxury. Hand resting on the folded denim fabric."
      }
    ]
  },

  // UPGRADED: "Smart Seasonal"
  // Logic: Replaced generic "Office" with High-Fashion Seasonal Professional looks.
  model_smart: {
    id: 'model_smart',
    name: 'Smart Seasonal',
    cameraLens: "Shot on 50mm Portrait Lens, Aperture f/2.0. Clean, sharp, catalog quality.",
    lightingSetup: "Seasonally Appropriate Natural Light. (Warm/Golden for Summer/Fall, Cool/Crisp for Winter/Spring).",
    colorGrade: "Polished Editorial. True-to-life colors, clean whites, seasonal color palette.",
    scenes: [
      // --- WINTER (Dec, Jan, Feb) ---
      {
        label: "Winter Wool",
        seasons: [11, 0, 1],
        environmentTexture: "Texture of a high-end grey wool coat, draped over a chair, or a cashmere scarf laid flat. Background is out-of-focus snowy city window.",
        compositionRule: "Winter Commute. Hand resting on the draped coat or holding leather gloves. No body visible."
      },
      {
        label: "The Agenda",
        seasons: [11, 0, 1, 2], // Winter into early Spring
        environmentTexture: "Leather-bound black planner on a dark wood desk. Warm indoor lighting contrast.",
        compositionRule: "Organized. Hand resting on the open planner. Professional focus."
      },

      // --- SPRING (Mar, Apr, May) ---
      {
        label: "Spring Pastel",
        seasons: [2, 3, 4],
        environmentTexture: "Soft pastel blazer (blush pink or mint), draped over a chair. Background is bright and airy window light.",
        compositionRule: "Fresh start. Hand resting on the draped blazer or a white desk. No body visible."
      },
      {
        label: "Outdoor Cafe",
        seasons: [2, 3, 4, 5],
        environmentTexture: "White bistro table. Background of blurred greenery/flowers.",
        compositionRule: "Lunch break. Hand resting near a glass of water/lemon."
      },

      // --- SUMMER (Jun, Jul, Aug) ---
      {
        label: "Linen Suit",
        seasons: [5, 6, 7],
        environmentTexture: "Texture of a crisp white or beige linen jacket, draped over a chair. Bright, harsh sunlight (fashion style).",
        compositionRule: "Summer Business. Hand resting on the draped fabric. High contrast shadows. No body visible."
      },
      {
        label: "Iced Coffee",
        seasons: [5, 6, 7, 8],
        environmentTexture: "Condensation on a clear iced coffee cup. City street background.",
        compositionRule: "On the go. Hand holding the cold drink. Refreshed vibe."
      },

      // --- FALL (Sep, Oct, Nov) ---
      {
        label: "The Trench",
        seasons: [8, 9, 10],
        environmentTexture: "Classic beige trench coat (Burberry style), draped over a coat rack.",
        compositionRule: "Autumn Fashion. Hand resting on the coat's belt or fabric. No body visible."
      },
      {
        label: "Tortoise Shell",
        seasons: [8, 9, 10, 11],
        environmentTexture: "Warm wood table surface. Pair of tortoise-shell reading glasses in background.",
        compositionRule: "Studious. Hand resting near the glasses. Intellectual vibe."
      }
    ]
  }
};

/**
 * PORTRAIT & BEAUTY - STYLE CONFIGURATION
 * ------------------------------------------------
 * "Vanity Editorial" styles — mirrors, jewelry stands, cosmetics, fabric, and light.
 * CRITICAL: NEVER generate a face, chin, cheek, neck, shoulder, or hair attached to
 * a person. The uploaded hand is the only human element in frame; everything else
 * is an inanimate prop, mirror, or surface that implies the beauty-editorial mood
 * without fabricating a person who doesn't exist.
 */
export const portraitStyles: Record<string, StyleDefinition> = {
  portrait_glam: {
    id: 'portrait_glam',
    name: 'Glamour Editorial',
    cameraLens: "Shot on 85mm Portrait Lens f/1.8. Classic Beauty Photography. Sharp focus on nails, soft-focus background props.",
    lightingSetup: "Butterfly Lighting (Paramount). Flattering, high-fashion studio lighting. Highlights on the nails and surrounding props.",
    colorGrade: "High-Gloss Magazine Retouch. Saturated, polished, expensive textures. Rich blacks.",
    scenes: [
      {
        label: "Red Lip Interaction",
        environmentTexture: "An open red lipstick tube and gold compact mirror on a vanity.",
        compositionRule: "Classic Beauty. Hand posed beside the lipstick and mirror. No face or body visible."
      },
      {
        label: "The Earring",
        environmentTexture: "A diamond earring resting on a velvet jewelry tray.",
        compositionRule: "Jewelry focus. Hand placing the earring on the tray. No face or body visible."
      },
      {
        label: "Hollywood Waves",
        environmentTexture: "A vintage hairbrush beside loose waves of hair resting on a vanity table (a prop, not attached to a person).",
        compositionRule: "Vanity styling. Hand resting near the hairbrush. No face or body visible."
      },
      {
        label: "Necklace Touch",
        environmentTexture: "A diamond necklace draped over a velvet jewelry bust (an object, not a person).",
        compositionRule: "Elegant. Hand touching the necklace pendant on the stand. No face or body visible."
      }
    ]
  },

  portrait_soft: {
    id: 'portrait_soft',
    name: 'Soft Beauty',
    cameraLens: "Shot on 100mm Macro f/2.8. Dreamy, ethereal, soft focus. Background is a soft-focus vanity setting.",
    lightingSetup: "Softbox diffused lighting. No harsh shadows. 'Cloudy day' studio light. Very flattering.",
    colorGrade: "Pastel, Airy, Rose-tinted. Skincare advertisement aesthetic. Fresh and clean.",
    scenes: [
      {
        label: "Vanity Mirror",
        environmentTexture: "A soft-focus vanity mirror reflecting warm bokeh light.",
        compositionRule: "Sweet pose. Hand resting gently on the edge of the mirror frame. No face or body visible."
      },
      {
        label: "Cashmere Throw",
        environmentTexture: "A soft folded cashmere throw on a vanity stool.",
        compositionRule: "Thoughtful. Hand resting lightly on the folded throw. No face or body visible."
      },
      {
        label: "Silk Scarf",
        environmentTexture: "A silk scarf draped over the back of a chair, soft focus.",
        compositionRule: "Elegant. Hand resting on the draped silk scarf. No face or body visible."
      },
      {
        label: "White Robe",
        environmentTexture: "A soft white spa robe, folded on a spa bench beside a candle.",
        compositionRule: "Spa Day. Hand resting on the folded robe. No body visible."
      }
    ]
  },

  portrait_edgy: {
    id: 'portrait_edgy',
    name: 'Edgy Vogue',
    cameraLens: "Shot on 35mm f/1.4. Slightly wide, dynamic perspective. High contrast.",
    lightingSetup: "Hard Light/Split Lighting. Strong contrast between light and shadow. Dramatic shadows across the scene.",
    colorGrade: "Desaturated, cool tones, high structure. Grunge/Rock chic. BW or High Contrast Color.",
    scenes: [
      {
        label: "Shadow Frame",
        environmentTexture: "Dramatic shadow pattern (venetian blind or grille) cast across a plain dark wall.",
        compositionRule: "The Frame. Hand catching the shadow pattern like a mask gesture. No face or body visible."
      },
      {
        label: "Leather Choker",
        environmentTexture: "A black leather choker or collar resting on a dark surface.",
        compositionRule: "Power pose. Hand resting beside the leather choker. No face or body visible."
      },
      {
        label: "Wall Shadow",
        environmentTexture: "Dramatic shadow patterns cast across a dark textured wall.",
        compositionRule: "Mystery. Hand casting a shadow shape against the wall. No face or body visible."
      },
      {
        label: "Leather Collar",
        environmentTexture: "A black leather jacket, draped over a chair, collar visible.",
        compositionRule: "Attitude. Hand pulling at the draped jacket's collar. No body visible."
      }
    ]
  }
};


// 2026-07-24: a live-generation test proved that simply telling the model
// elsewhere in the prompt to "ignore the scene text if it says no face" is
// not reliable — the concrete, nearby scene composition text apparently
// outweighs an earlier abstract meta-instruction. Fix: physically strip the
// stale phrase from the scene text used for Model/Portrait, and inject a
// positive, concrete face-inclusion clause right next to the composition
// rule instead of relying on the model to recall a rule from elsewhere.
const STALE_NO_FACE_PHRASES = [
  'No face or body visible.',
  'No face visible.',
  'No body visible.',
];

// 2026-07-25: SECOND live defect — Model/Portrait output came back with the
// prop (a latte cup) covering the model's ENTIRE face, i.e. a faceless
// "beauty portrait". Root cause was two-part: (1) the personRuleText below
// literally suggested "holding an object close to her face" as a pose, and
// (2) these scenes' own composition text says "Hand holding the cup" /
// "up to the light" / "like a mask gesture" — all of which put the prop in
// the face region once a face actually exists in frame. That wording was
// written when these scenes were hand-only, where it was harmless.
// Fix: rewrite the face-conflicting composition phrases for Model/Portrait
// only; the hand-only collections keep the original wording (still correct).
const FACE_SAFE_SCENE_REWRITES: Record<string, string> = {
  'Hand holding the cup.':
    'Hand cradling the cup at chest height, well below the chin, fingers relaxed and softly extended along the cup rather than clenched around it — the cup never rises into or in front of the face.',
  'Hand holding the cold drink.':
    'Hand cradling the cold drink at chest height, well below the chin, fingers relaxed and softly extended rather than clenched around it — the drink never rises into or in front of the face.',
  'Hand holding the glass stem.':
    'Fingers resting lightly against the glass stem at chest height, off to one side of the face, relaxed and softly extended rather than gripping — the glass never rises into or in front of the face.',
  'Hand holding the sunglasses up to the light.':
    'Sunglasses resting on the surface catching the light, with the hand relaxed beside them, fingers softly extended and nails facing the camera — the hand does not clench around the sunglasses, and nothing covers the eyes or face.',
  'Hand catching the shadow pattern like a mask gesture.':
    'Hand held open and relaxed beside the face, clear of it, catching the shadow pattern on its skin — the hand never covers or masks the face; the shadow may fall across the background and shoulders, never across the eyes.',
};

// 2026-07-25 pass 2 — the impossible-hand defect. STEP 3's nail identity lock
// makes "all nail plates flat and visible" non-negotiable; a GRIPPING pose
// curls the fingers, which physically rotates the nails away from camera.
// Facing that unsatisfiable pair, the generator keeps the nails camera-facing
// and breaks the hand instead — pasting flat nail plates onto curled fingers
// and dropping the thumb because a thumb in a grip would occlude them.
// The durable fix is removing the conflict at source: don't ask for a tight
// grip. Applies to EVERY collection — nail visibility is the product in all
// six, so the conflict is universal. Only genuinely closed grips are rewritten;
// light-touch scenes already pose safely and are left alone.
const GRIP_SOFTENING_REWRITES: Record<string, string> = {
  'Hand holding a warm mug or resting near the glass.':
    'Hand resting beside the warm mug, fingers relaxed and softly extended with the nails facing the camera, rather than wrapped around it.',
  'Hand holding shopping bag handles (straps).':
    'Hand draped over the shopping bag straps, fingers relaxed and softly extended rather than clenched around them.',
  'Hand holding a leaf.':
    'A leaf balanced on relaxed, softly extended fingers, nails facing the camera — not pinched or gripped.',
  'Hand holding an ornament.':
    'An ornament balanced on relaxed, softly extended fingers, nails facing the camera — not pinched or gripped.',
  'Hand holding a champagne flute.':
    "Fingers resting lightly along the champagne flute's stem, relaxed and softly extended with the nails facing the camera, rather than gripping.",
  'Hand holding a sparkler.':
    'A sparkler cradled between relaxed, softly extended fingers, nails facing the camera — not clenched in a fist.',
  'Hand holding the stem of a glass (or resting near it).':
    'Fingers resting lightly against the stem of the glass, relaxed and softly extended with the nails facing the camera, rather than gripping.',
  'Hand holding a crystal flute.':
    "Fingers resting lightly along the crystal flute's stem, relaxed and softly extended with the nails facing the camera, rather than gripping.",
  'Hand clutching the bag.':
    'Hand resting on the bag, fingers relaxed and softly extended across it with the nails facing the camera, rather than clenched around it.',
  'Hand adjusting the necklace on the stand.':
    'Hand resting beside the necklace on the stand, fingers relaxed and softly extended with the nails facing the camera.',
  'Hand resting on the draped coat or holding leather gloves.':
    'Hand resting on the draped coat beside a pair of leather gloves, fingers relaxed and softly extended with the nails facing the camera.',
  'Hand placing the earring on the tray.':
    'Hand resting beside the earring on the tray, fingers relaxed and softly extended with the nails facing the camera.',
  "Hand pulling at the draped jacket's collar.":
    "Hand resting against the draped jacket's collar, fingers relaxed and softly extended with the nails facing the camera, rather than pulling or clenching.",
};

// Appended to EVERY collection's composition text. The literal rewrites cover
// today's scene list; this is the safety net for any scene added later, and it
// states the priority order explicitly so the generator resolves the conflict
// by changing the POSE rather than by breaking the hand.
const POSE_SAFETY_CLAUSE = 'Pose priority: the hand must stay anatomically possible AND the nail art must read clearly — if those two would conflict, change the POSE (relax and extend the fingers, tilt or rotate the whole hand, rest it rather than grip) until both are true at once. Never resolve the conflict by rotating nail plates independently of the fingers they sit on, and never drop or hide the thumb to make the nails easier to show. Thumb staging: strongly prefer a hand angle where the THUMB and its nail are visible in frame alongside the fingers — five visible nails read as real and show more of the manicure. If the pose you first imagined would tuck the thumb out of sight, rotate the hand slightly toward the camera so it comes into view. (If the hand is closed around an object, a visible thumb is not a preference but a hard requirement — see clause 2.)';

// 2026-08-09: ported from TrueFrame Studio's HARD RULE 8 anti-trademark fix
// (~/.claude/skills/trueframe-studio/scripts/build_prompt.py
// NO_REAL_WORLD_BRANDING_CLAUSE). Root cause closed: every prior branding rule
// in this pipeline only ever suppressed the salon's OWN logo/text overlay —
// nothing stopped the model inventing a REAL trademark (a Gucci-style GG, a
// car maker's badge, a printed boutique bag) on an object inside the photo.
// That is a legal exposure in commercial salon marketing. Kept in sync with
// TrueFrame and the Deluxe sibling file (deluxe photo editor/services/
// geminiService.ts) — do not diverge the wording.
const NO_REAL_WORLD_BRANDING = `### STEP 3B: NO REAL-WORLD BRANDING (mandatory, global)
        - Every object, prop, garment, accessory, packaging item, vehicle part, and surface visible in the frame must be GENERIC and UNBRANDED. No visible logo, wordmark, brand name, monogram or repeating-initials pattern, interlocking-letter emblem, maker's mark, hallmark, badge, crest, or any trademark-recognizable design cue belonging to a real company, fashion house, or manufacturer may appear anywhere.
        - HIGH-RISK OBJECTS: this specifically covers handbags and clutches (including quilted leather with gold turnlock hardware), sunglasses and sunglasses cases (including temple logos), perfume bottles, cosmetics tubes and compacts (labels, caps, engraved names), wine and champagne bottles (labels and foil), shopping bags, boxes, tissue and ribbon, book covers and spines (titles and publisher marks), scarves and coats (signature check or plaid patterns), jewelry (signature motifs, and signature-colored boxes or pouches), cups, mugs and coffee sleeves (café logos), garment tags and labels, and vehicle steering-wheel hubs, dashboards and wheels (manufacturer badges and emblems).
        - RENDER INSTEAD: plain unmarked leather with plain unmarked hardware, blank untitled book covers, unlabeled bottles with plain caps, solid or abstract non-signature fabric patterns, a bare wheel hub with no emblem, and plain unprinted bags. If a real object would normally carry a mark, leave that area blank, plain, or softly out of focus.
        - VOCABULARY: words like "designer", "luxury", "high-end", "couture", and "premium" anywhere in this brief describe MATERIAL QUALITY, CRAFTSMANSHIP, and PRICE TIER — never a nameable maker. Do not resolve them by rendering an actual brand.
        - FAILURE STANDARD: any recognizable real-world brand mark, or a design distinctive enough to identify a specific maker, is a FAILED generation — even if it is small, blurred, or partially cropped.
        - This image must contain NO text, lettering, or logo of any kind at all, including "Zen Nail Spa"'s own name and contact details — see STEP 3's NO AI-DRAWN BRANDING clause above. The salon's branding is composited later in post-production from the real logo file, never drawn by the model.`;

// Appended to STEP 5's variation seed, right next to the rolled prop/surface/
// accent — nearby concrete wording binds better than a distant abstract rule.
// Mirrors TrueFrame's UNBRANDED_PROPS_CLAUSE.
const UNBRANDED_PROPS_REMINDER = '- UNBRANDED PROPS (mandatory): the prop, surface, and accent above are generic unbranded objects — no logo, wordmark, monogram, or maker\'s emblem on any of them (see STEP 3B).';

function softenGripPoses(text: string): string {
  let result = text;
  for (const [phrase, replacement] of Object.entries(GRIP_SOFTENING_REWRITES)) {
    result = result.split(phrase).join(replacement);
  }
  return result;
}

function sanitizeSceneTextForModel(text: string): string {
  let result = text;
  for (const phrase of STALE_NO_FACE_PHRASES) {
    result = result.split(` ${phrase}`).join('').split(phrase).join('');
  }
  for (const [phrase, replacement] of Object.entries(FACE_SAFE_SCENE_REWRITES)) {
    result = result.split(phrase).join(replacement);
  }
  return result.trim();
}

export function getStylePrompt(styleKey: string, collection: 'classic' | 'vibrant' | 'lifestyle' | 'holiday' | 'model' | 'portrait'): string {
  let styles: Record<string, StyleDefinition>;
  if (collection === 'classic') styles = classicChicStyles;
  else if (collection === 'vibrant') styles = vibrantBoldStyles;
  else if (collection === 'lifestyle') styles = lifestyleCozyStyles;
  else if (collection === 'holiday') styles = holidayStyles;
  else if (collection === 'model') styles = modelStyles;
  else styles = portraitStyles;

  const style = styles[styleKey];

  if (!style) return "";

  let eligibleScenes = style.scenes;

  // TIME-AWARE LOGIC for Smart Seasonal
  if (styleKey === 'model_smart') {
    const currentMonth = new Date().getMonth(); // 0 = Jan, 11 = Dec

    // Filter scenes that include the current month
    const seasonalScenes = style.scenes.filter(scene =>
      scene.seasons && scene.seasons.includes(currentMonth)
    );

    // Use seasonal scenes if available, otherwise default to all (fallback)
    if (seasonalScenes.length > 0) {
      eligibleScenes = seasonalScenes;
    }
  }

  const randomScene = eligibleScenes[Math.floor(Math.random() * eligibleScenes.length)];

  const generatesModel = collection === 'model' || collection === 'portrait';
  const environmentText = generatesModel
    ? sanitizeSceneTextForModel(randomScene.environmentTexture)
    : randomScene.environmentTexture;
  const baseComposition = generatesModel
    ? `${sanitizeSceneTextForModel(randomScene.compositionRule)} The model's face is fully visible and in focus, with a natural expression suited to this scene's mood — this is a beauty/editorial portrait, not a hand-only product shot.`
    : randomScene.compositionRule;
  // Grip-softening + pose-priority apply to EVERY collection: the
  // curled-fingers-vs-flat-nails conflict is driven by the nail identity lock,
  // which every collection carries.
  const compositionText = `${softenGripPoses(baseComposition)} ${POSE_SAFETY_CLAUSE}`;

  return `
    [VISUAL STYLE SETTINGS]
    - SCENE VARIATION: ${randomScene.label}
    - ENVIRONMENT: ${environmentText}
    - LIGHTING: ${style.lightingSetup}
    - LENS OPTICS: ${style.cameraLens}
    - COLOR GRADING: ${style.colorGrade}
    - COMPOSITION: ${compositionText}
  `;
}

// ─── Variation Engine ────────────────────────────────────────────────────
// Each generation rolls a random combination from these pools so clicking
// the same style twice never produces the same scene.

const pickOne = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

const VARIATION_POOLS = {
    cameraAngle: [
        'top-down flat lay, camera directly overhead',
        'low 30-degree hero angle, shallow perspective',
        'eye-level straight-on with strong foreground bokeh',
        '45-degree editorial three-quarter angle',
        'close-up macro crop, nails filling 70% of frame',
        'over-the-shoulder candid framing',
        'dutch tilt of 10 degrees for editorial energy',
    ],
    lightingMood: [
        'golden-hour warm sidelight streaming from a window',
        'soft overcast diffused daylight, no hard shadows',
        'dramatic single-source spotlight with deep falloff',
        'bright airy high-key lighting, almost shadowless',
        'moody low-key lighting with warm candlelight accents',
        'cool morning blue-hour light mixed with warm interior lamps',
        'dappled light through foliage casting soft leaf shadows',
        'neon-tinged ambient glow from out-of-frame signage',
    ],
    prop: [
        'a ceramic espresso cup with latte art',
        'a glass of sparkling rosé',
        'a silk ribbon loosely draped between the fingers',
        'a fresh peony bloom',
        'a plain unbranded sunglasses case',
        'a hardcover art book with gilded page edges and a blank, untitled cover',
        'a delicate gold chain necklace pooled nearby',
        'an unlabeled frosted glass perfume bottle',
        'a matcha latte in a stoneware mug',
        'fairy lights softly blurred in the grip',
        'a vintage hand mirror',
        'a fresh citrus slice on a small plate',
    ],
    surface: [
        'white Carrara marble with grey veining',
        'warm walnut wood with visible grain',
        'brushed concrete in soft grey',
        'ivory linen tablecloth with natural creases',
        'smoked glass tabletop with reflections',
        'travertine stone in cream tones',
        'velvet fabric in a deep jewel tone',
        'rattan tray with woven texture',
        'terrazzo with playful chips of color',
    ],
    accent: [
        'a single accent of fresh greenery (eucalyptus sprig)',
        'scattered rose petals at the frame edge',
        'a thin wisp of steam rising from a drink',
        'soft out-of-focus string lights in the background',
        'a subtle water droplet sheen on the surface',
        'a slice of directional shadow cutting across the corner',
        'delicate gold confetti flecks, very sparse',
        'an out-of-focus window with city light in the distance',
    ],
    composition: [
        'rule-of-thirds with the hand entering from the left',
        'rule-of-thirds with the hand entering from the right',
        'centered symmetrical composition with generous breathing room',
        'diagonal leading line from bottom-left to top-right',
        'layered foreground-midground-background depth stack',
        'tight asymmetric crop with bold negative space on one side',
    ],
} as const;

// `faceSafe` (Model/Portrait) qualifies the prop line so a drink-type prop can
// never be staged over the model's face — the 2026-07-25 defect, where the
// rolled prop (espresso cup / matcha latte) ended up covering the whole face.
// The prop pool itself is unchanged; only its placement is constrained.
const buildVariationSeed = (faceSafe: boolean = false): string => {
    // "gripping" was itself part of the impossible-hand defect — it invited the
    // closed grip that forces curled fingers. Prop is now staged NEAR the hand.
    const propLine = faceSafe
        ? `- Prop (stage it beside or under the hand, or cradle it with relaxed, softly extended fingers — do not clench the hand around it; keep it at chest height or below the chin, and NEVER in front of the model's face): ${pickOne(VARIATION_POOLS.prop)}`
        : `- Prop (stage it beside or under the hand, or cradle it with relaxed, softly extended fingers — do not clench the hand around it): ${pickOne(VARIATION_POOLS.prop)}`;
    return [
        `- Camera: ${pickOne(VARIATION_POOLS.cameraAngle)}`,
        `- Lighting: ${pickOne(VARIATION_POOLS.lightingMood)}`,
        propLine,
        `- Surface: ${pickOne(VARIATION_POOLS.surface)}`,
        `- Scene accent: ${pickOne(VARIATION_POOLS.accent)}`,
        `- Composition: ${pickOne(VARIATION_POOLS.composition)}`,
        UNBRANDED_PROPS_REMINDER,
        `- Uniqueness token: ${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)} (ignore visually — anti-duplication marker)`,
    ].join('\n        ');
};

export const generateDynamicThemePrompt = async (themeKeyOrDescription: string, imageBase64?: string, mimeType?: string): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); 
    try {
        const imagePart = imageBase64 && mimeType ? fileToGenerativePart(imageBase64, mimeType) : null;
        
        let specificStyleInstructions = themeKeyOrDescription;
        let matchedCollection: 'classic' | 'vibrant' | 'lifestyle' | 'holiday' | 'model' | 'portrait' | null = null;

        // Check Classic Collection
        if (classicChicStyles[themeKeyOrDescription]) {
            matchedCollection = 'classic';
            specificStyleInstructions = getStylePrompt(themeKeyOrDescription, 'classic');
        }
        // Check Vibrant Collection
        else if (vibrantBoldStyles[themeKeyOrDescription]) {
            matchedCollection = 'vibrant';
            specificStyleInstructions = getStylePrompt(themeKeyOrDescription, 'vibrant');
        }
        // Check Lifestyle Collection
        else if (lifestyleCozyStyles[themeKeyOrDescription]) {
            matchedCollection = 'lifestyle';
            specificStyleInstructions = getStylePrompt(themeKeyOrDescription, 'lifestyle');
        }
        // Check Holiday Collection
        else if (holidayStyles[themeKeyOrDescription]) {
            matchedCollection = 'holiday';
            specificStyleInstructions = getStylePrompt(themeKeyOrDescription, 'holiday');
        }
        // Check Model Collection
        else if (modelStyles[themeKeyOrDescription]) {
            matchedCollection = 'model';
            specificStyleInstructions = getStylePrompt(themeKeyOrDescription, 'model');
        }
        // Check Portrait Collection
        else if (portraitStyles[themeKeyOrDescription]) {
            matchedCollection = 'portrait';
            specificStyleInstructions = getStylePrompt(themeKeyOrDescription, 'portrait');
        }

        // 2026-07-24: John asked for Model/Portrait to generate a real (fabricated,
        // non-identifiable) model's face + hand together, opposite of every other
        // collection. Scoped to exactly these two — Classic/Vibrant/Lifestyle/Holiday
        // must stay hand-only, that rule is still correct there. Each style's stored
        // compositionRule text still says "No face or body visible" (stale) — that phrase
        // is physically stripped by getStylePrompt()'s sanitizeSceneTextForModel() for
        // these two collections (a live test proved just telling the model to "ignore"
        // the phrase elsewhere in the prompt was not reliable enough).
        const generatesModel = matchedCollection === 'model' || matchedCollection === 'portrait';
        const identityLockText = generatesModel
            ? `MANDATORY NAIL IDENTITY LOCK: "The input image shows the salon's actual nail art — preserve that exact nail art, shape, length, and color pattern 100% faithfully and apply it onto the hand of the generated model created in this scene. Do not alter, simplify, recolor, or otherwise reinterpret the nail design in any way."`
            : `MANDATORY IDENTITY LOCK: "Preserve exact nail art, length, shape, and design from the input image 100%. Do not alter the nail art. Keep exact nail shape and design. Match skin tone and hand features 100%."`;
        const personRuleText = generatesModel
            ? `MANDATORY GENERATED MODEL: This collection is an intentional full beauty/editorial shot, not a hand-only product shot. The final image MUST show a realistic, camera-ready professional model's face, hair, and upper body together with her hand in frame — a hand-only crop with no face is a failed generation for this collection. Pose her naturally to fit the scene's mood, for example her hand raised beside her jawline, fingertips resting lightly against her collarbone or touching her hair at the temple, or held out toward camera at chest height. The model must be an entirely fabricated, stock-photography-style person — never a depiction of any real, identifiable individual (no celebrity, no influencer, no specific real person's likeness), and her face should look different each generation, not reused.`
            : `MANDATORY NO FABRICATED PERSON: "The hand from the input image is the ONLY human element allowed in the frame. Never add a face, chin, cheek, neck, shoulder, hair, or any other body part that is not already visible in the input image — even if the style below mentions a 'model' or 'beauty' mood, that mood comes from props, fabric, and lighting only, never from inventing a person. If the style text below conflicts with this rule, this rule wins."`;

        // 2026-07-25 fix 1 of 2 — face occlusion. Two live Deluxe beauty portraits
        // came back with a latte cup covering the model's whole face. This clause
        // has to be a hard, positive, overriding mandate: the earlier abstract
        // "face is fully visible" wording lost to the concrete prop instruction.
        const faceUnobstructedText = generatesModel
            ? `MANDATORY FACE MUST BE UNOBSTRUCTED (overrides any scene, prop, or variation-seed instruction that conflicts with it): The model's entire face — both eyes, nose, mouth, and chin — must be fully visible, in focus, unobstructed, and well lit. NOTHING may cover, overlap, or pass in front of her face: no cup, mug, glass, bottle, phone, fan, book, sunglasses, flower, or any other prop; no hand, fingers, or nails; no hair falling across the eyes; no heavy shadow across the eyes. Any prop she is holding stays at chest height or lower, BELOW the chin line, or off to one side clear of the head — never raised into the face region, never between the camera and her face. If a prop and the face would occupy the same area of the frame, the PROP moves, never the face. Her hand must be positioned beside, below, or clear of the face so that both the nail art AND the full face are simultaneously and completely visible. An image where the face is covered, cropped out, or hidden behind an object is a FAILED generation.`
            : '';

        // 2026-07-25 fix 2 of 2 — hand anatomy. The same bad generations produced a
        // malformed stubby thumb whose nail plate looked melted/wrapped around the
        // fingertip. Nothing in this pipeline had EVER constrained hand anatomy —
        // the S24 realism signature only covers skin texture. The hand is the actual
        // product in every collection, so this is unconditional, not Model-only.
        const handAnatomyText = `MANDATORY HAND ANATOMY CONTRACT (the hand is the product being sold; an impossible hand ruins the photo no matter how good the rest is). Every clause must be simultaneously true: (1) DIGIT COUNT: exactly five digits on each visible hand — four fingers plus exactly one thumb. No extra, missing, duplicated, merged, fused, or floating digits. Exactly one nail per digit. (2) THUMB: the thumb must be present and clearly visible whenever the hand GRIPS, HOLDS, WRAPS AROUND, PINCHES, or otherwise closes on an object — a hand holding something with no thumb at all is anatomically impossible and is an automatic failure. In open, relaxed, resting, or draped poses the thumb may fall behind the hand if that is genuinely how the pose reads, but STRONGLY PREFER a hand angle that keeps the thumb and its nail in view, because five visible nails show more of the manicure. Whenever the thumb is visible it must be shorter and thicker than the fingers, set lower on the side of the palm at a natural opposed angle, on the correct side for the hand shown (left vs right) — never a stubby stump, never rendered as a fifth finger in the row. (3) FINGER LENGTHS: middle finger longest; index and ring roughly equal and slightly shorter; pinky clearly the shortest by an obvious margin. The pinky must never be drawn longer than, or extending past, the ring finger. (4) NAIL-PLATE ORIENTATION — THE CRITICAL ONE: each nail plate must face the same direction its own finger actually points. Nail orientation follows the fingers; the fingers never twist to follow the nails. If the back of the hand faces the camera and the fingers curl toward the palm, their nails necessarily rotate AWAY from camera — in that pose you would see the fingertips and the edges of the nails, NOT flat full-face nail plates. It is FORBIDDEN to show the back of the hand and flat camera-facing nail plates on curled fingers at the same time; that requires the fingertips to bend backward over the hand and is impossible. If the pose you have chosen would hide the nail art, CHANGE THE POSE — relax and extend the fingers, tilt or rotate the whole hand, or show the palm side — until the nails are naturally camera-facing. Never rotate, paste, or re-orient a nail plate independently of the finger it sits on. (5) JOINT LIMITS: no finger or thumb bends backward past a natural joint limit. No hyperextension of the fingertips over the back of the hand. Knuckles, joints, and creases sit where real anatomy puts them. (6) NAIL GEOMETRY: each nail plate sits flat on its own nail bed, following that fingertip's natural curve, with a clean crisp edge — never melting, smearing, wrapping, or bending around the side or under the tip of a finger, never extending past the flesh outline, never merging into the adjacent finger. (7) PROP OCCLUSION: the hand and any prop must have ONE coherent depth relationship. Every finger of a given hand is consistently either in front of or behind the prop as the pose dictates — the prop must never appear to pass through the hand, and fingers must not alternate in front of and behind the same rigid object. (8) POSE PREFERENCE: prefer a relaxed, open, resting, draped, or lightly cradling hand over a tight closed grip. A clenched grip is what forces the impossible curled-fingers-with-flat-nails compromise — avoid it unless the scene truly requires it, and even then keep the fingers loose and the thumb visible.`;

        const dateStr = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
        const variationSeed = buildVariationSeed(generatesModel);
        const systemInstruction = `You are an expert AI Prompt Engineer and High-End Fashion Editor for the premium brand "Zen Nail Spa."
        Your goal is to generate a highly technical image generation prompt following a strict 4-Step Pipeline:

        ### GLOBAL CONTEXT
        Current Date: ${dateStr}
        Seasonality: Ensure background elements, lighting, and mood align with the current season defined by the date above.

        ### STEP 1: THE LIGHTING & ANATOMY ANALYST
        Analyze the uploaded photo for:
        - Light Source Detection (Direction and temperature).
        - Pose Class (Gripping object, relaxed fingers, or flat lay).
        Match the target scene's lighting to this source.

        ### STEP 2: THE HARDWARE SIGNATURE (S24 Ultra Look)
        Include: "Shot on Samsung S24 Ultra, 200MP sensor, 23mm wide-angle lens, f/1.7 aperture. Macro photography settings with Micro-contrast enabled. High-frequency texture rendering (subsurface scattering on skin, distinct cuticle details, visible pores). No smoothing filters, no plastic skin effect."

        ### STEP 3: THE COMPOSITION & BRANDING RULES
        - Mandate "Negative Space" in the top-right 20% (Soft bokeh or clean wall texture).
        - ${identityLockText}
        - ${personRuleText}
        - ${faceUnobstructedText}
        - ${handAnatomyText}
        - NO AI-DRAWN BRANDING (mandatory): leave the bottom 30% of the frame as clean, low-detail negative space — softly darkened or slightly out-of-focus is fine, but do NOT draw, write, letter, stamp, or render any text, logo, wordmark, signage, or lettering of any kind anywhere in this image, including the salon's own name or contact details. The frame must be completely free of text. The real logo and contact text are composited afterward in post-production, pixel-for-pixel from the salon's actual logo file — this step's only job is to leave that space clean. (This 30% figure is coupled to SCRIM_HEIGHT_FRACTION in services/brandingOverlay.ts — do not change one without the other.)

        ${NO_REAL_WORLD_BRANDING}

        ### STEP 4: DYNAMIC SCENE GENERATION
        Here are the specific style instructions for this image:
        ${specificStyleInstructions}

        Combine the instructions above with the detected Pose Class to ensure physical accuracy.
        - If gripping: suggest holding a relevant luxury prop compatible with the defined Environment.
        - If flat: suggest a premium surface interaction compatible with the defined Environment.
        - ALWAYS generate a NEW pose, different from the original, but physically compatible with the hand's anatomy.

        ### STEP 5: THE VARIATION DIRECTIVE (MANDATORY — makes every generation unique)
        This generation MUST follow this randomly-assigned creative seed. Weave ALL of these into the scene
        while staying true to the style defined in Step 4:
        ${variationSeed}
        Do NOT default to the most obvious interpretation of the style — the seed above defines THIS image's
        unique take. Two generations of the same style must never look alike.

        Respond with ONLY the final optimized prompt string.`;

        const response: GenerateContentResponse = await proxyGenerateContent({
            model: 'gemini-3.5-flash', 
            contents: { 
                parts: [
                    ...(imagePart ? [imagePart] : []),
                    { text: "Generate the technical prompt based on the provided style settings and image analysis." }
                ] 
            },
            config: {
                systemInstruction: { parts: [{ text: systemInstruction }] },
                temperature: 1.1,
            }
        });

        return response.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
        console.error("Error generating dynamic prompt:", error);
        return null;
    }
};

export const generateBrandedImageService = async (prompt: string, imageBase64: string, mimeType: string, imageSize: "1K" | "2K" | "4K" = "1K"): Promise<string[] | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const imagePart = fileToGenerativePart(imageBase64, mimeType);
        const textPart = { text: prompt };

        const count = imageSize === "2K" ? 2 : 1;

        const generateSingleImage = async (): Promise<string | null> => {
            const response = await proxyGenerateContent({
                model: 'gemini-3-pro-image-preview',
                contents: {
                    parts: [imagePart, textPart],
                },
                config: {
                    imageConfig: {
                        aspectRatio: "1:1",
                        imageSize: imageSize as any
                    },
                    tools: [{googleSearch: {}}],
                },
            });
            
            if (response.candidates && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        return part.inlineData.data;
                    }
                }
            }
            return null;
        };
        
        const promises = Array.from({ length: count }, () => generateSingleImage());
        const results = await Promise.all(promises);
        const validResults = results.filter((r): r is string => r !== null);

        if (validResults.length > 0) {
            return validResults;
        }

        return null;
    } catch (error) {
        console.error("Error generating branded image:", error);
        throw error;
    }
};

export const generateSocialCaptionService = async (prompt: string, imageBase64: string, mimeType: string): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const imagePart = fileToGenerativePart(imageBase64, mimeType);
        const textPart = { text: prompt };

        const response: GenerateContentResponse = await proxyGenerateContent({
            model: 'gemini-3.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return response.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
        console.error("Error generating social caption:", error);
        throw error;
    }
};

export const analyzeSocialImage = async (imageBase64: string, mimeType: string): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const imagePart = fileToGenerativePart(imageBase64, mimeType);
        const prompt = `Analyze this nail salon photo for social media context.
        Return a JSON object with these fields:
        1. "serviceType": The likely service.
        2. "colors": An array of dominant colors.
        3. "mood": The aesthetic mood.
        4. "suggestedSeason": The season this style fits best.
        
        Return ONLY valid JSON.`;

        const response: GenerateContentResponse = await proxyGenerateContent({
            model: 'gemini-3.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: 'application/json'
            }
        });

        return response.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
        console.error("Error analyzing image:", error);
        throw error;
    }
};

export const generateOmniSocialContent = async (analysis: any, tone: string, userNotes: string): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const prompt = `You are a social media expert for "Zen Nail Spa". Based on the following image analysis and user preferences, generate a complete content strategy.
        
        **Image Analysis:**
        - Service: ${analysis.serviceType}
        - Mood: ${analysis.mood}
        - Colors: ${analysis.colors.join(', ')}
        
        **User Preferences:**
        - Tone: ${tone}
        - Notes: ${userNotes || "None"}
        
        Return ONLY valid JSON matching this schema:
        {
            "instagram": "string",
            "facebook": "string",
            "tiktokScript": "string",
            "veoPrompts": {
                "cinematic": "string",
                "motion": "string",
                "creative": "string"
            },
            "hooks": ["string", "string", "string"],
            "comments": ["string", "string", "string", "string", "string", "string", "string"],
            "hashtags": {
                "niche": ["string"],
                "local": ["string"],
                "trending": ["string"]
            },
            "viralityScore": number,
            "improvementTip": "string"
        }`;

        const response: GenerateContentResponse = await proxyGenerateContent({
            model: 'gemini-3.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: 'application/json'
            }
        });

        return response.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
        console.error("Error generating omni content:", error);
        throw error;
    }
};

export const generatePromoGraphicService = async (prompt: string, imageSize: "1K" | "2K" | "4K" = "1K"): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await proxyGenerateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "1:1",
                    imageSize: imageSize as any
                },
                tools: [{googleSearch: {}}],
            },
        });

        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Error generating promo graphic:", error);
        throw error;
    }
};

export const generatePromoCaptionService = async (prompt: string): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response: GenerateContentResponse = await proxyGenerateContent({
            model: 'gemini-3.5-flash',
            contents: { parts: [{ text: prompt }] },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
        console.error("Error generating promo caption:", error);
        throw error;
    }
};

export const generatePromoIdeasService = async (prompt: string): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await proxyGenerateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            offer: { type: Type.STRING },
                            description: { type: Type.STRING },
                            marketingAngle: { type: Type.STRING },
                            whyItWorks: { type: Type.STRING },
                        }
                    }
                }
            }
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
        console.error("Error generating promo ideas:", error);
        throw error;
    }
};

export const generateVideoService = async (prompt: string, imageBase64: string, mimeType: string, aspectRatio: string): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: {
                imageBytes: imageBase64,
                mimeType: mimeType,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio as any
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
            return `${videoUri}&key=${process.env.API_KEY}`;
        }
        return null;
    } catch (error) {
        console.error("Error generating video:", error);
        throw error;
    }
};

export const generateBrochureService = async (prompt: string, imageSize: "1K" | "2K" | "4K" = "1K"): Promise<string[] | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const generateSingleImage = async (): Promise<string | null> => {
            const response = await proxyGenerateContent({
                model: 'gemini-3-pro-image-preview',
                contents: { parts: [{ text: prompt }] },
                config: {
                    imageConfig: {
                        aspectRatio: "3:4",
                        imageSize: imageSize as any
                    },
                    tools: [{googleSearch: {}}],
                },
            });
            if (response.candidates && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        return part.inlineData.data;
                    }
                }
            }
            return null;
        };

        const count = imageSize === "2K" ? 2 : 1;
        const promises = Array.from({ length: count }, () => generateSingleImage());
        
        const results = await Promise.all(promises);
        const validResults = results.filter((r): r is string => r !== null);

        if (validResults.length > 0) {
            return validResults;
        }
        return null;
    } catch (error) {
        console.error("Error generating brochure background:", error);
        throw error;
    }
};

export const describeImageService = async (base64: string, mimeType: string): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const imagePart = fileToGenerativePart(base64, mimeType);
        const textPart = { text: "Describe this image in detail, focusing on colors, composition, and mood." };
        const response = await proxyGenerateContent({
            model: 'gemini-3.5-flash',
            contents: { parts: [imagePart, textPart] },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
        console.error("Error describing image:", error);
        throw error;
    }
};

export const generateLandingPageService = async (prompt: string): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await proxyGenerateContent({
            model: 'gemini-3.5-flash',
            contents: { parts: [{ text: prompt }] },
        });
        let text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        text = text.replace(/```html/g, '').replace(/```/g, '');
        return text;
    } catch (error) {
        console.error("Error generating landing page:", error);
        throw error;
    }
};

/**
 * Deterministic post-production branding overlay for Zen Nail Spa's Photo
 * Suite — a browser/Canvas port of TrueFrame Studio's
 * apply_branding_overlay.py (HARD RULE 3c in trueframe-studio/SKILL.md).
 *
 * WHY THIS EXISTS: geminiService.ts used to tell the image model to freehand
 * "Zen Nail Spa" in gold script calligraphy directly onto the photo. That
 * produced an invented interpretation of the brand every time — the AI has
 * no access to the real logo file, so it drew its own version, which does
 * not match the real circular "Zen" cursive mark swept by an incomplete
 * gold ring with tracked-out "NAIL SPA" caps beneath. This overlay pastes
 * the REAL logo PNG (public/logo.png) pixel-for-pixel instead — never
 * re-drawn, never reinterpreted — and typesets the contact line in a real
 * font, on top of a photo the AI was told to leave clean (see the "leave
 * clean space" no-AI-branding instruction in geminiService.ts STEP 3).
 *
 * SCRIM_HEIGHT_FRACTION below is coupled to the "bottom 30%" clean-space
 * instruction in geminiService.ts STEP 3 — changing one without the other
 * desyncs where the AI leaves room and where this overlay draws into it.
 */

const SCRIM_HEIGHT_FRACTION = 0.30;
const SCRIM_BASE_ALPHA = 75 / 255;
const SCRIM_MAX_ALPHA = 195 / 255;
const SCRIM_EASE = 1.4;
// Fraction of the scrim's OWN height, top-down, over which alpha ramps from
// 0 up to the SCRIM_BASE_ALPHA/SCRIM_EASE curve, instead of jumping straight
// to SCRIM_BASE_ALPHA at the scrim's very top edge. Without this the band's
// top edge jumps to ~29% opacity in a single row -- measured on a flat
// bright test image as a 35.9-unit mean-row-luminance step (287x the ~0.125
// typical row-to-row delta), which reads as a hard horizontal line across
// the photo, especially over bright backgrounds like marble or wicker. 8%
// keeps the ramp entirely inside the LOGO_TOP_PADDING_FRACTION gap above the
// logo -- that gap is always LOGO_TOP_PADDING_FRACTION / SCRIM_HEIGHT_FRACTION
// =~ 11.7% of the scrim's height regardless of image size -- so the logo/
// phone/address rows below it keep exactly the alpha they had before this
// fix. Matches apply_branding_overlay.py's SCRIM_FEATHER_FRACTION.
const SCRIM_FEATHER_FRACTION = 0.08;

// Taller wordmark + circular flourish (672x487) — matches
// apply_branding_overlay.py's LOGO_WIDTH_FRACTION['zen-nail-spa'].
const LOGO_WIDTH_FRACTION = 0.30;

const LOGO_TOP_PADDING_FRACTION = 0.035;
const LOGO_TEXT_GAP_FRACTION = 0.020;
const LINE_GAP_FRACTION = 0.010;
const CONTACT_FONT_SIZE_FRACTION = 0.026;
const SHADOW_OFFSET_FRACTION = 0.0022;

// These fractions were tuned against TrueFrame's portrait 1024x1536 DALL-E
// output. The Photo Suite generates square 2048x2048 ("2K"), where the same
// width-driven sizing produces a block taller than the height-driven scrim
// has room for — see computeBrandingLayout, which fits the block to
// whatever space is actually available instead of assuming it fits.
const MIN_CONTACT_FONT_SIZE_PX = 10;

const BRAND_PHONE = '(919) 316-7856';
const BRAND_ADDRESS = '105 NC-54 Hwy, Ste 277A, Durham, NC 27713';

const TEXT_COLOR = '#FFFFFF';
const SHADOW_COLOR = 'rgba(0, 0, 0, 0.588)'; // 150/255, matches SHADOW_COLOR_ALPHA
const CONTACT_FONT_STACK = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export class BrandingOverlayError extends Error {}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new BrandingOverlayError(`failed to load image: ${src}`));
    img.src = src;
  });
}

function toImageSrc(imageDataUrlOrBase64: string): string {
  if (imageDataUrlOrBase64.startsWith('data:')) return imageDataUrlOrBase64;
  return `data:image/png;base64,${imageDataUrlOrBase64}`;
}

/** Alpha at fraction t (0 = scrim top, 1 = scrim bottom): the eased
 * base->max curve, feathered down to 0 near t=0 -- see SCRIM_FEATHER_FRACTION. */
function scrimAlphaAt(t: number): number {
  const curveAlpha = SCRIM_BASE_ALPHA + (SCRIM_MAX_ALPHA - SCRIM_BASE_ALPHA) * Math.pow(t, SCRIM_EASE);
  const feather = Math.min(1, t / SCRIM_FEATHER_FRACTION);
  return curveAlpha * feather;
}

function drawScrim(ctx: CanvasRenderingContext2D, width: number, height: number, scrimHeight: number): void {
  const top = height - scrimHeight;
  const gradient = ctx.createLinearGradient(0, top, 0, height);

  // Densely sample the feather zone on its own so the ramp from 0 renders
  // smoothly instead of as 2-3 coarse canvas gradient stops.
  const featherSteps = 12;
  for (let i = 0; i <= featherSteps; i++) {
    const t = (i / featherSteps) * SCRIM_FEATHER_FRACTION;
    gradient.addColorStop(t, `rgba(8, 6, 5, ${scrimAlphaAt(t)})`);
  }

  const curveSteps = 32;
  for (let i = 1; i <= curveSteps; i++) {
    const t = SCRIM_FEATHER_FRACTION + (i / curveSteps) * (1 - SCRIM_FEATHER_FRACTION);
    gradient.addColorStop(t, `rgba(8, 6, 5, ${scrimAlphaAt(t)})`);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, top, width, scrimHeight);
}

function drawCenteredTextWithShadow(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  shadowOffset: number,
): void {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = SHADOW_COLOR;
  ctx.fillText(text, centerX + shadowOffset, centerY + shadowOffset);
  ctx.fillStyle = TEXT_COLOR;
  ctx.fillText(text, centerX, centerY);
}

export interface BrandingLayout {
  scrimHeight: number;
  logoX: number;
  logoY: number;
  logoWidth: number;
  logoHeight: number;
  contactFontSize: number;
  lineHeight: number;
  shadowOffset: number;
  phoneY: number;
  addressY: number;
  blockBottom: number;
  /** 1 = designed size kept as-is; <1 = block was shrunk to fit the band. */
  scale: number;
}

/**
 * Pure geometry — no canvas/DOM — so it can fit the branding block to
 * whatever vertical space is actually available in the scrim, at any image
 * aspect ratio, instead of assuming the width-driven block fits a
 * height-driven scrim (the bug that made this throw on every square 2048x2048
 * Photo Suite generation while working fine on TrueFrame's portrait
 * 1024x1536 DALL-E output). Exported as a standalone, dependency-free
 * function so its output can be checked numerically outside a browser: feed
 * it real width/height/logo dimensions and assert `blockBottom <= height`.
 *
 * Top and bottom padding inside the scrim stay fixed (reserved space, so the
 * block never sits flush against the frame edges); the block itself — logo,
 * inter-element gaps, and contact font size — scales down uniformly to fit
 * whatever room is left, then is centered in that space. The contact font
 * size has a hard floor so it can never shrink to unreadable; the final
 * overflow throw stays as a last-resort guard for the case where even a
 * floored, fully-shrunk block still doesn't fit — reachable in principle,
 * but not for any normal square/portrait/landscape image.
 *
 * Every intermediate size/position is kept as a float and rounded exactly
 * once, at the point each value is returned — rounding the logo, gaps, and
 * font size independently up front and then summing those already-rounded
 * numbers would let up to five separate +/-0.5px roundings compound into a
 * multi-px drift against `availableBand`, which is exactly the invariant
 * the fixed top/bottom padding above is supposed to guarantee.
 */
export function computeBrandingLayout(
  width: number,
  height: number,
  logoNaturalWidth: number,
  logoNaturalHeight: number,
): BrandingLayout {
  if (
    !Number.isFinite(width) || width <= 0 ||
    !Number.isFinite(height) || height <= 0 ||
    !Number.isFinite(logoNaturalWidth) || logoNaturalWidth <= 0 ||
    !Number.isFinite(logoNaturalHeight) || logoNaturalHeight <= 0
  ) {
    throw new BrandingOverlayError(
      `invalid branding layout input: width=${width} height=${height} logoNaturalWidth=${logoNaturalWidth} logoNaturalHeight=${logoNaturalHeight}`,
    );
  }

  const scrimHeight = Math.round(height * SCRIM_HEIGHT_FRACTION);
  const topPadding = Math.round(height * LOGO_TOP_PADDING_FRACTION);
  const bottomMargin = topPadding;
  const availableBand = scrimHeight - topPadding - bottomMargin;

  const baseLogoWidth = width * LOGO_WIDTH_FRACTION;
  const baseLogoHeight = logoNaturalHeight * (baseLogoWidth / logoNaturalWidth);
  const baseTextGap = height * LOGO_TEXT_GAP_FRACTION;
  const baseLineGap = height * LINE_GAP_FRACTION;
  const baseContactFontSize = width * CONTACT_FONT_SIZE_FRACTION;
  const baseLineHeight = baseContactFontSize * 1.3;

  const desiredBlockHeight = baseLogoHeight + baseTextGap + 2 * baseLineHeight + baseLineGap;

  // Only ever shrink — a block that already fits keeps its designed size.
  const scale = desiredBlockHeight > availableBand ? availableBand / desiredBlockHeight : 1;

  const scaledLogoWidth = baseLogoWidth * scale;
  const scaledLogoHeight = baseLogoHeight * scale;
  const scaledTextGap = baseTextGap * scale;
  const scaledLineGap = baseLineGap * scale;
  // The floor guards readability but must never OVERRIDE the shrink — on an
  // image tiny enough that even the unscaled design font is already under
  // the floor, `Math.max(floor, scaled)` would enlarge the block past its
  // own unscaled size, defeating "only ever shrink." Clamping to
  // baseContactFontSize keeps the floor purely a lower bound within the
  // shrink, never a promotion above the original design.
  const scaledContactFontSize = Math.min(
    baseContactFontSize,
    Math.max(MIN_CONTACT_FONT_SIZE_PX, baseContactFontSize * scale),
  );
  const scaledLineHeight = scaledContactFontSize * 1.3;

  const actualBlockHeight = scaledLogoHeight + scaledTextGap + 2 * scaledLineHeight + scaledLineGap;

  const bandTop = height - scrimHeight + topPadding;
  const centeredOffset = Math.max(0, (availableBand - actualBlockHeight) / 2);
  const blockTop = bandTop + centeredOffset;

  const logoX = Math.round((width - scaledLogoWidth) / 2);
  const logoY = Math.round(blockTop);
  const logoWidth = Math.round(scaledLogoWidth);
  const logoHeight = Math.round(scaledLogoHeight);
  const contactFontSize = Math.round(scaledContactFontSize);
  const lineHeight = Math.round(scaledLineHeight);

  const phoneY = Math.round(blockTop + scaledLogoHeight + scaledTextGap + scaledLineHeight / 2);
  const addressY = Math.round(
    blockTop + scaledLogoHeight + scaledTextGap + scaledLineHeight * 1.5 + scaledLineGap,
  );
  const blockBottom = Math.round(blockTop + actualBlockHeight);

  if (blockBottom > height) {
    throw new BrandingOverlayError(
      `branding block (${blockBottom}px) overflows image height (${height}px) even after fitting to the available ${availableBand}px band — this image's aspect ratio is too extreme for readable branding.`,
    );
  }

  const shadowOffset = Math.max(1, Math.round(width * SHADOW_OFFSET_FRACTION));

  return { scrimHeight, logoX, logoY, logoWidth, logoHeight, contactFontSize, lineHeight, shadowOffset, phoneY, addressY, blockBottom, scale };
}

/**
 * Composites the real Zen Nail Spa logo + contact text onto a generated
 * photo and returns a branded PNG data URL.
 *
 * The logo is ALWAYS a pure `drawImage` scale of the real PNG at
 * `public/logo.png` — it is never re-drawn, and there is no code path here
 * that can substitute canvas-rendered text for the logo image. If the logo
 * fails to load, this THROWS rather than silently falling back to drawing
 * the salon name as text — a silent text fallback would recreate the exact
 * AI-hallucinated-branding bug this overlay exists to fix.
 */
export async function applyBrandingOverlay(imageDataUrlOrBase64: string): Promise<string> {
  const [sourceImage, logoImage] = await Promise.all([
    loadImage(toImageSrc(imageDataUrlOrBase64)),
    loadImage(`${import.meta.env.BASE_URL}logo.png`),
  ]);

  const width = sourceImage.naturalWidth;
  const height = sourceImage.naturalHeight;
  if (!width || !height) {
    throw new BrandingOverlayError('source image has no natural dimensions');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new BrandingOverlayError('failed to acquire 2D canvas context');
  }

  ctx.drawImage(sourceImage, 0, 0, width, height);

  const layout = computeBrandingLayout(width, height, logoImage.naturalWidth, logoImage.naturalHeight);

  drawScrim(ctx, width, height, layout.scrimHeight);
  ctx.drawImage(logoImage, layout.logoX, layout.logoY, layout.logoWidth, layout.logoHeight);

  ctx.font = `500 ${layout.contactFontSize}px ${CONTACT_FONT_STACK}`;
  drawCenteredTextWithShadow(ctx, BRAND_PHONE, width / 2, layout.phoneY, layout.shadowOffset);
  drawCenteredTextWithShadow(ctx, BRAND_ADDRESS, width / 2, layout.addressY, layout.shadowOffset);

  return canvas.toDataURL('image/png');
}

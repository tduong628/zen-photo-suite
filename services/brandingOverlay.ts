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

// Taller wordmark + circular flourish (672x487) — matches
// apply_branding_overlay.py's LOGO_WIDTH_FRACTION['zen-nail-spa'].
const LOGO_WIDTH_FRACTION = 0.30;

const LOGO_TOP_PADDING_FRACTION = 0.035;
const LOGO_TEXT_GAP_FRACTION = 0.020;
const LINE_GAP_FRACTION = 0.010;
const CONTACT_FONT_SIZE_FRACTION = 0.026;
const SHADOW_OFFSET_FRACTION = 0.0022;

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

function drawScrim(ctx: CanvasRenderingContext2D, width: number, height: number, scrimHeight: number): void {
  const top = height - scrimHeight;
  const gradient = ctx.createLinearGradient(0, top, 0, height);
  const steps = 32;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const alpha = SCRIM_BASE_ALPHA + (SCRIM_MAX_ALPHA - SCRIM_BASE_ALPHA) * Math.pow(t, SCRIM_EASE);
    gradient.addColorStop(t, `rgba(8, 6, 5, ${alpha})`);
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

  const scrimHeight = Math.round(height * SCRIM_HEIGHT_FRACTION);
  drawScrim(ctx, width, height, scrimHeight);

  let cursorY = height - scrimHeight + Math.round(height * LOGO_TOP_PADDING_FRACTION);

  const targetLogoWidth = Math.round(width * LOGO_WIDTH_FRACTION);
  const logoScale = targetLogoWidth / logoImage.naturalWidth;
  const targetLogoHeight = Math.round(logoImage.naturalHeight * logoScale);
  const logoX = Math.round((width - targetLogoWidth) / 2);
  ctx.drawImage(logoImage, logoX, cursorY, targetLogoWidth, targetLogoHeight);
  cursorY += targetLogoHeight + Math.round(height * LOGO_TEXT_GAP_FRACTION);

  const contactFontSize = Math.round(width * CONTACT_FONT_SIZE_FRACTION);
  ctx.font = `500 ${contactFontSize}px ${CONTACT_FONT_STACK}`;
  const shadowOffset = Math.max(1, Math.round(width * SHADOW_OFFSET_FRACTION));
  const lineHeight = Math.round(contactFontSize * 1.3);

  const phoneY = cursorY + Math.round(lineHeight / 2);
  drawCenteredTextWithShadow(ctx, BRAND_PHONE, width / 2, phoneY, shadowOffset);

  const addressY = phoneY + lineHeight + Math.round(height * LINE_GAP_FRACTION);
  drawCenteredTextWithShadow(ctx, BRAND_ADDRESS, width / 2, addressY, shadowOffset);

  const bottomUsed = addressY + Math.round(lineHeight / 2);
  if (bottomUsed > height) {
    throw new BrandingOverlayError(
      `branding block (${bottomUsed}px) overflows image height (${height}px) — logo/font sizing needs tuning for this image's aspect ratio.`,
    );
  }

  return canvas.toDataURL('image/png');
}

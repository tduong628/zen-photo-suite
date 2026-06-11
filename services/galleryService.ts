// Google Sheets gallery backend — same pattern as the Financial App.
// Images are saved to a Drive folder; the sheet stores metadata + links.

// Set after deploying apps-script/Code.gs as a web app:
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby3OYycP8TMqo95AhOvJL0fqM3jMng9Y8XHK2sgodam8I129K0nZbfZChH2JtGy3_Nl/exec';

export interface GalleryItem {
  timestamp: string;
  tool: string;
  style: string;
  prompt: string;
  caption: string;
  fileId: string;
  imageUrl: string;
  thumbnailUrl: string;
}

export interface SaveGalleryPayload {
  tool: string;
  style?: string;
  prompt?: string;
  caption?: string;
  imageBase64: string;
  mimeType?: string;
}

export const isGalleryConfigured = (): boolean => WEB_APP_URL.startsWith('http');

/** Fire-and-forget save of a generated image to the gallery sheet + Drive. */
export const saveToGallery = async (payload: SaveGalleryPayload): Promise<void> => {
  if (!isGalleryConfigured()) return;
  try {
    await fetch(WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({
        tool: payload.tool,
        style: payload.style || '',
        prompt: payload.prompt || '',
        caption: payload.caption || '',
        imageBase64: payload.imageBase64,
        mimeType: payload.mimeType || 'image/png',
      }),
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.warn('[Gallery] Save failed:', error);
  }
};

/** Loads all gallery items (newest first). */
export const fetchGallery = async (): Promise<GalleryItem[]> => {
  if (!isGalleryConfigured()) return [];
  try {
    const separator = WEB_APP_URL.includes('?') ? '&' : '?';
    const response = await fetch(`${WEB_APP_URL}${separator}t=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data && data.status === 'error') {
      console.warn('[Gallery] Apps Script error:', data.message);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('[Gallery] Fetch failed:', error);
    return [];
  }
};

/** Deletes an item from sheet + trashes the Drive file. */
export const deleteFromGallery = async (fileId: string): Promise<void> => {
  if (!isGalleryConfigured()) return;
  try {
    await fetch(WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', fileId }),
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.warn('[Gallery] Delete failed:', error);
  }
};

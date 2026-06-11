// Staff Uploads backend — staff submit photos via the Apps Script form;
// this service lets the Photo Suite list them and pull images for branding.

// Set after deploying apps-script/StaffUploads.gs as a web app:
const STAFF_UPLOADS_URL = 'https://script.google.com/macros/s/AKfycby5b1_h8aYZtFbV99Qyoib1EBbENkeyOsw7X5qxz9zCLx82lxwHk1PkkOW4NUEqugEb-w/exec';

export interface StaffUpload {
  timestamp: string;
  staffName: string;
  salon: string;
  serviceType: string;
  note: string;
  status: 'PENDING' | 'PROCESSED' | 'SKIPPED';
  fileId: string;
  thumbnailUrl: string;
}

export const isInboxConfigured = (): boolean => STAFF_UPLOADS_URL.startsWith('http');

export const getStaffUploadFormUrl = (): string => STAFF_UPLOADS_URL;

export const fetchStaffUploads = async (): Promise<StaffUpload[]> => {
  if (!isInboxConfigured()) return [];
  try {
    const res = await fetch(`${STAFF_UPLOADS_URL}?list=1&t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('[StaffInbox] Fetch failed:', error);
    return [];
  }
};

/** Pulls the full-resolution image of an upload as base64 (CORS-safe via Apps Script). */
export const fetchUploadImage = async (
  fileId: string,
): Promise<{ base64: string; mimeType: string } | null> => {
  if (!isInboxConfigured()) return null;
  try {
    const res = await fetch(`${STAFF_UPLOADS_URL}?fileId=${encodeURIComponent(fileId)}&t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.base64) throw new Error(data.message || 'No image data');
    return { base64: data.base64, mimeType: data.mimeType || 'image/jpeg' };
  } catch (error) {
    console.warn('[StaffInbox] Image fetch failed:', error);
    return null;
  }
};

export const markUploadStatus = async (
  fileId: string,
  status: 'PROCESSED' | 'SKIPPED',
): Promise<void> => {
  if (!isInboxConfigured()) return;
  try {
    await fetch(STAFF_UPLOADS_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'status', fileId, status }),
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.warn('[StaffInbox] Status update failed:', error);
  }
};

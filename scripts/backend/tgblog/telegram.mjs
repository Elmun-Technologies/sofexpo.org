/**
 * Minimal Bot API client for the sync pipeline: getChat/getFile + file download.
 *
 * SECURITY: `https://api.telegram.org/file/bot<TOKEN>/...` URLs embed the bot token —
 * they are used ONLY as a fetch source in this process and are NEVER returned to the
 * caller, written to the DB, the repo, or logs.
 */
const API_ROOT = 'https://api.telegram.org';

export class TelegramApiError extends Error {
  constructor(message, { code, method } = {}) {
    super(message);
    this.name = 'TelegramApiError';
    this.code = code;
    this.method = method;
  }
}

export class TelegramClient {
  /**
   * @param {string} token bot token
   * @param {object} deps  { fetchImpl } — test seam, defaults to global fetch
   */
  constructor(token, { fetchImpl } = {}) {
    if (!token) throw new Error('TelegramClient: bot token is required');
    this.token = token;
    this.fetch = fetchImpl ?? ((...args) => fetch(...args));
    this.timeoutMs = 30_000;
  }

  async apiGet(method, params = {}) {
    const url = new URL(`${API_ROOT}/bot${this.token}/${method}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const response = await this.fetch(url, { signal: AbortSignal.timeout(this.timeoutMs) });
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new TelegramApiError(`Bot API ${method}: ${response.status} javot qaytardi (JSON emas)`, { code: response.status, method });
    }
    if (!payload.ok) {
      throw new TelegramApiError(`Bot API ${method}: ${payload.description || 'noma’lum xato'}`, { code: payload.error_code ?? response.status, method });
    }
    return payload.result;
  }

  getChat(username) {
    return this.apiGet('getChat', { chat_id: username.startsWith('@') ? username : `@${username}` });
  }

  /** { file_id, file_unique_id, file_size?, file_path? } — file_path lemons after ~1h. */
  getFile(fileId) {
    return this.apiGet('getFile', { file_id: fileId });
  }

  /**
   * Download a file by its Bot API file_path. Returns { bytes, contentType }.
   * The size is verified twice: against the declared file_size (skipped before any
   * download happens by the caller) and against the actual payload length.
   */
  async download(filePath, { maxBytes }) {
    return this.resolveUrl(`${API_ROOT}/file/bot${this.token}/${encodeURI(filePath)}`, { maxBytes });
  }

  /** Download bytes from an absolute https URL (used by backfill for the public CDN). */
  async resolveUrl(url, { maxBytes } = {}) {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') throw new TelegramApiError('faqat https URL ruxsat etiladi', { method: 'resolveUrl' });
    const response = await this.fetch(url, { signal: AbortSignal.timeout(Math.max(this.timeoutMs, 60_000)) });
    if (!response.ok) throw new TelegramApiError(`fayl yuklab olinmadi: HTTP ${response.status}`, { code: response.status, method: 'download' });
    const buffer = Buffer.from(await response.arrayBuffer());
    if (maxBytes && buffer.length > maxBytes) {
      throw new TelegramApiError(`fayl limitdan katta (${buffer.length} > ${maxBytes} bayt)`, { code: 413, method: 'download' });
    }
    return { bytes: buffer, contentType: response.headers.get('content-type') || '' };
  }
}

/** Largest variant of a photo[] array (by pixel area, file_size tiebreak). */
export function largestPhoto(photos) {
  if (!Array.isArray(photos) || !photos.length) return null;
  return photos.reduce((best, p) => {
    const area = (p.width || 0) * (p.height || 0);
    const bestArea = (best.width || 0) * (best.height || 0);
    if (area !== bestArea) return area > bestArea ? p : best;
    return (p.file_size || 0) > (best.file_size || 0) ? p : best;
  });
}

const EXT_BY_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'video/mp4': '.mp4' };

/** File extension for a downloaded file: Bot API path first, mime fallback. */
export function fileExt(filePath, mime = '') {
  const fromPath = /\.([a-z0-9]{2,5})$/i.exec(filePath || '')?.[0]?.toLowerCase();
  if (fromPath && fromPath.length <= 5) return fromPath;
  return EXT_BY_MIME[mime] || '.bin';
}

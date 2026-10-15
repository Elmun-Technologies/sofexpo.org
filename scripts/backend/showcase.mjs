/**
 * Exhibitor company page ("Kompaniya sahifasi") — the shape an exhibitor edits in the
 * cabinet and that, once a moderator publishes it, feeds the public exhibitor directory.
 *
 * Everything here is pure: input normalization and upload sniffing. Storage lives in
 * db.mjs (`exhibitor_showcases`, `portal_files`), HTTP in server.mjs.
 */
import { findShow, validEdition } from './shows.mjs';

export const SOCIAL_NETWORKS = ['instagram', 'telegram', 'facebook', 'linkedin', 'youtube', 'tiktok'];

export const SHOWCASE_LIMITS = {
  name: 120,
  tagline: 120,
  about: 1000,
  category: 80,
  country: 80,
  city: 80,
  website: 200,
  phone: 40,
  email: 160,
  social: 200,
  stand: 20,
  participation: 12,
  fileTitle: 120,
};

export const UPLOAD_LIMITS = {
  pdfBytes: 20 * 1024 * 1024,
  imageBytes: 5 * 1024 * 1024,
  filesPerAccount: 30,
};

const clean = (value, max) => String(value ?? '')
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
  .replace(/[ \t]+/g, ' ')
  .trim()
  .slice(0, max);

const singleLine = (value, max) => clean(String(value ?? '').replace(/[\r\n]+/g, ' '), max);

function normalizeUrl(value, max) {
  const raw = singleLine(value, max);
  if (!raw) return '';
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) return null;
    return url.toString().slice(0, max);
  } catch {
    return null;
  }
}

/* "@brand", "brand", "t.me/brand" or a full link — all become a link */
const SOCIAL_BASES = {
  instagram: 'https://instagram.com/',
  telegram: 'https://t.me/',
  facebook: 'https://facebook.com/',
  linkedin: 'https://www.linkedin.com/company/',
  youtube: 'https://youtube.com/@',
  tiktok: 'https://www.tiktok.com/@',
};

function normalizeSocial(network, value) {
  const raw = singleLine(value, SHOWCASE_LIMITS.social);
  if (!raw) return '';
  if (/^@?[\w.]{2,64}$/.test(raw)) return `${SOCIAL_BASES[network]}${raw.replace(/^@/, '')}`;
  return normalizeUrl(raw, SHOWCASE_LIMITS.social);
}

/**
 * @returns {{ value: object, errors: Record<string, string> }}
 * errors carry field keys (`website`, `social.instagram`, `participation.0`) → error codes
 * the cabinet translates.
 */
export function normalizeShowcase(input = {}) {
  const errors = {};
  const value = {
    name: singleLine(input.name, SHOWCASE_LIMITS.name),
    tagline: singleLine(input.tagline, SHOWCASE_LIMITS.tagline),
    about: clean(String(input.about ?? '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n'), SHOWCASE_LIMITS.about),
    category: singleLine(input.category, SHOWCASE_LIMITS.category),
    country: singleLine(input.country, SHOWCASE_LIMITS.country),
    city: singleLine(input.city, SHOWCASE_LIMITS.city),
    website: '',
    phone: singleLine(input.phone, SHOWCASE_LIMITS.phone),
    email: singleLine(input.email, SHOWCASE_LIMITS.email).toLowerCase(),
    socials: {},
    logoFileId: singleLine(input.logoFileId, 64),
    participation: [],
  };
  const website = normalizeUrl(input.website, SHOWCASE_LIMITS.website);
  if (website === null) errors.website = 'url';
  else value.website = website;
  if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) errors.email = 'email';
  if (value.phone && !/^[+\d][\d\s()-]{5,}$/.test(value.phone)) errors.phone = 'phone';
  const socials = input.socials && typeof input.socials === 'object' ? input.socials : {};
  for (const network of SOCIAL_NETWORKS) {
    const link = normalizeSocial(network, socials[network]);
    if (link === null) errors[`social.${network}`] = 'url';
    else if (link) value.socials[network] = link;
  }
  const seen = new Set();
  const participation = Array.isArray(input.participation) ? input.participation.slice(0, SHOWCASE_LIMITS.participation) : [];
  participation.forEach((item, index) => {
    const event = singleLine(item?.event, 60);
    const year = Number(item?.year);
    if (!validEdition(event, year)) {
      errors[`participation.${index}`] = 'edition';
      return;
    }
    const key = `${event}:${year}`;
    if (seen.has(key)) return;
    seen.add(key);
    value.participation.push({ event, year, stand: singleLine(item?.stand, SHOWCASE_LIMITS.stand) });
  });
  value.participation.sort((a, b) => b.year - a.year || a.event.localeCompare(b.event));
  return { value, errors };
}

/** what must be there before a page can go to moderation */
export function submitErrors(showcase) {
  const errors = {};
  if (!showcase.name) errors.name = 'required';
  if (!showcase.about && !showcase.tagline) errors.about = 'required';
  if (!showcase.participation.length) errors.participation = 'required';
  return errors;
}

export function editionLabel(event, year) {
  const show = findShow(event);
  return show ? `${show.name} ${year}` : `${event} ${year}`;
}

/**
 * Trust the bytes, not the client's Content-Type: only PDF and raster images are accepted.
 * SVG is refused on purpose (it can carry script).
 */
export function sniffUpload(buffer) {
  if (!buffer || buffer.length < 12) return null;
  const ascii = (start, end) => buffer.subarray(start, end).toString('latin1');
  if (ascii(0, 5) === '%PDF-') return { mime: 'application/pdf', ext: 'pdf', image: false };
  if (buffer[0] === 0x89 && ascii(1, 4) === 'PNG') return { mime: 'image/png', ext: 'png', image: true };
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg', image: true };
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { mime: 'image/webp', ext: 'webp', image: true };
  return null;
}

export function fileTitleFromName(name) {
  const base = singleLine(String(name || '').replace(/\.[a-z0-9]{1,5}$/i, '').replace(/[_]+/g, ' '), SHOWCASE_LIMITS.fileTitle);
  return base || 'Material';
}

export function cleanFileTitle(value) {
  return singleLine(value, SHOWCASE_LIMITS.fileTitle);
}

export function cleanFileName(value) {
  return singleLine(String(value || '').replace(/[\\/]/g, '_'), 160);
}

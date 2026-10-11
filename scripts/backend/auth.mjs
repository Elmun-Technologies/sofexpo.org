import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;

export function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase().slice(0, 254);
}

export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const normalized = String(password ?? '');
  const hash = scryptSync(normalized, salt, KEY_LENGTH, { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, expectedHash) {
  if (!salt || !expectedHash) return false;
  const actual = scryptSync(String(password ?? ''), salt, KEY_LENGTH, {
    N: 16_384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  let expected;
  try {
    expected = Buffer.from(expectedHash, 'hex');
  } catch {
    return false;
  }
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

export function hashToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

export function createSecret(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export function validEmail(value) {
  const email = normalizeEmail(value);
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validPassword(value) {
  return typeof value === 'string' && value.length >= 12 && value.length <= 128;
}

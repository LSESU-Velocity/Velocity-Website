import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.IDEA_ENCRYPTION_KEY;
  if (!hex) throw new Error('IDEA_ENCRYPTION_KEY environment variable is not set');
  const buf = Buffer.from(hex, 'hex');
  if (buf.length !== 32) throw new Error('IDEA_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  return buf;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a combined string: base64(iv):base64(authTag):base64(ciphertext)
 */
export function encryptIdea(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypts a string produced by encryptIdea.
 * Returns the original plaintext, or the raw value if it doesn't look encrypted
 * (for backwards compatibility with pre-encryption records).
 */
export function decryptIdea(stored: string): string {
  // Pre-encryption records are plain text — they won't contain exactly 2 colons
  // separating three base64 segments.
  const parts = stored.split(':');
  if (parts.length !== 3) return stored;

  try {
    const key = getKey();
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const ciphertext = Buffer.from(parts[2], 'base64');

    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) return stored;

    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    // If decryption fails, assume it's a legacy unencrypted value
    return stored;
  }
}

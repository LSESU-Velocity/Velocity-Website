import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(envVarName: string): Buffer {
  const hex = process.env[envVarName];
  if (!hex) throw new Error(`${envVarName} environment variable is not set`);
  const buf = Buffer.from(hex, 'hex');
  if (buf.length !== 32) throw new Error(`${envVarName} must be 64 hex characters (32 bytes)`);
  return buf;
}

/**
 * Encrypts a plaintext string using AES-256-GCM with a key from the named env var.
 * Returns a combined string: base64(iv):base64(authTag):base64(ciphertext)
 */
export function encryptText(plaintext: string, envVarName: string): string {
  const key = getKey(envVarName);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypts a string produced by encryptText with the same env var.
 * Returns the raw stored value unchanged if it does not match the encrypted layout
 * (backwards compatibility with pre-encryption records).
 */
export function decryptText(stored: string, envVarName: string): string {
  const parts = stored.split(':');
  if (parts.length !== 3) return stored;

  try {
    const key = getKey(envVarName);
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const ciphertext = Buffer.from(parts[2], 'base64');

    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) return stored;

    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return stored;
  }
}

// ----- Legacy wrappers preserved for backwards compatibility -----
// Used by api/analyses.ts for the Launchpad idea column.

const LEGACY_IDEA_KEY = 'IDEA_ENCRYPTION_KEY';

export function encryptIdea(plaintext: string): string {
  return encryptText(plaintext, LEGACY_IDEA_KEY);
}

export function decryptIdea(stored: string): string {
  return decryptText(stored, LEGACY_IDEA_KEY);
}

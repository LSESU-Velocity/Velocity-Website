import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomBytes } from 'crypto';
import { decryptText, encryptText } from '../lib/encryption.js';

const ENV_VAR = 'TEST_ENCRYPTION_KEY';
let previous: string | undefined;

beforeAll(() => {
  previous = process.env[ENV_VAR];
  process.env[ENV_VAR] = randomBytes(32).toString('hex');
});

afterAll(() => {
  if (previous === undefined) delete process.env[ENV_VAR];
  else process.env[ENV_VAR] = previous;
});

describe('encryptText / decryptText', () => {
  it('round-trips utf8 payloads', () => {
    const plaintext = JSON.stringify({ name: 'Ünïcode ✓', nested: { a: 1 } });
    const stored = encryptText(plaintext, ENV_VAR);
    expect(stored).not.toContain(plaintext);
    expect(stored.split(':')).toHaveLength(3);
    expect(decryptText(stored, ENV_VAR)).toBe(plaintext);
  });

  it('produces a fresh IV per encryption', () => {
    const a = encryptText('same input', ENV_VAR);
    const b = encryptText('same input', ENV_VAR);
    expect(a).not.toBe(b);
  });

  it('passes through legacy plaintext records unchanged', () => {
    expect(decryptText('plain legacy value', ENV_VAR)).toBe('plain legacy value');
  });

  it('returns the stored string when the auth tag fails (documented legacy behavior)', () => {
    const stored = encryptText('secret', ENV_VAR);
    const [iv, tag, ciphertext] = stored.split(':');
    const flipped = Buffer.from(ciphertext, 'base64');
    flipped[0] ^= 0xff;
    const tampered = `${iv}:${tag}:${flipped.toString('base64')}`;
    expect(decryptText(tampered, ENV_VAR)).toBe(tampered);
  });

  it('rejects missing or malformed keys loudly on encryption', () => {
    expect(() => encryptText('x', 'DOES_NOT_EXIST_VAR')).toThrow(/not set/);
  });
});

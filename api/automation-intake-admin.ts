import type { VercelRequest, VercelResponse } from '@vercel/node';
import { timingSafeEqual } from 'crypto';
import type { Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { decryptText } from '../lib/encryption.js';
import { initFirebaseAdmin } from '../lib/firebaseAdmin.js';
import { firstHeaderValue, handleCors } from '../lib/serverSecurity.js';

const COLLECTION = 'automationIntakes';
const ENCRYPTION_ENV_VAR = 'AUTOMATION_INTAKE_ENCRYPTION_KEY';
const ADMIN_TOKEN_ENV_VAR = 'AUTOMATION_INTAKE_ADMIN_TOKEN';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function isProductionDeployment(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

function getQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function parseLimit(value: string | string[] | undefined): number {
  const parsed = Number(getQueryValue(value));
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(parsed), MAX_LIMIT);
}

function getBearerToken(req: VercelRequest): string {
  const authorization = firstHeaderValue(req.headers.authorization).trim();
  if (authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice('bearer '.length).trim();
  }

  return firstHeaderValue(req.headers['x-admin-token']).trim();
}

function tokensMatch(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

function requireAdmin(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env[ADMIN_TOKEN_ENV_VAR]?.trim();

  if (!expected) {
    res.status(503).json({ error: `${ADMIN_TOKEN_ENV_VAR} is not configured.` });
    return false;
  }

  const provided = getBearerToken(req);
  if (!provided || !tokensMatch(provided, expected)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }

  return true;
}

function initFirestore(): Firestore {
  return initFirebaseAdmin();
}

function serializeFirestoreValue(value: unknown): unknown {
  if (!value) return value;

  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeFirestoreValue);
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        serializeFirestoreValue(entry),
      ]),
    );
  }

  return value;
}

function pickIndexFields(id: string, data: Record<string, unknown>): Record<string, unknown> {
  return {
    id,
    businessName: data.businessName ?? null,
    website: data.website ?? null,
    sector: data.sector ?? null,
    teamSizeBand: data.teamSizeBand ?? null,
    // Contact PII now lives only in the encrypted blobs; the index carries a
    // correlation hash. Legacy records may still have the plaintext fields.
    contactName: data.contactName ?? null,
    contactEmail: data.contactEmail ?? null,
    contactEmailHash: data.contactEmailHash ?? null,
    submissionMode: data.submissionMode ?? null,
    workflowTitles: data.workflowTitles ?? [],
    status: data.status ?? null,
    schemaVersion: data.schemaVersion ?? null,
    ipHash: data.ipHash ?? null,
    createdAt: serializeFirestoreValue(data.createdAt) ?? null,
    updatedAt: serializeFirestoreValue(data.updatedAt) ?? null,
  };
}

function parseEncryptedJson<T>(data: Record<string, unknown>, key: string, label: string): T {
  const encrypted = data[key];
  if (typeof encrypted !== 'string' || !encrypted.trim()) {
    throw new Error(`${label} is missing or not a string.`);
  }

  const decrypted = decryptText(encrypted, ENCRYPTION_ENV_VAR);

  try {
    return JSON.parse(decrypted) as T;
  } catch {
    throw new Error(`${label} did not decrypt into valid JSON.`);
  }
}

function parseOptionalEncryptedJson<T>(data: Record<string, unknown>, key: string): T | null {
  const encrypted = data[key];
  if (typeof encrypted !== 'string' || !encrypted.trim()) return null;

  const decrypted = decryptText(encrypted, ENCRYPTION_ENV_VAR);

  try {
    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
}

function buildSummary(doc: QueryDocumentSnapshot): Record<string, unknown> {
  return pickIndexFields(doc.id, doc.data() as Record<string, unknown>);
}

function buildRecord(doc: QueryDocumentSnapshot): Record<string, unknown> {
  const data = doc.data() as Record<string, unknown>;
  return {
    id: doc.id,
    index: pickIndexFields(doc.id, data),
    draft: parseEncryptedJson<unknown>(data, 'draftEncrypted', 'draftEncrypted'),
    transcript: parseEncryptedJson<unknown>(data, 'transcriptEncrypted', 'transcriptEncrypted'),
    rawTranscript: parseOptionalEncryptedJson<unknown>(data, 'rawTranscriptEncrypted'),
    rawUserMessages: parseOptionalEncryptedJson<unknown>(data, 'rawUserMessagesEncrypted'),
    finalBrief: parseEncryptedJson<unknown>(data, 'finalBriefEncrypted', 'finalBriefEncrypted'),
  };
}

async function loadDoc(db: Firestore, req: VercelRequest): Promise<QueryDocumentSnapshot> {
  const docId = getQueryValue(req.query.docId).trim();

  if (docId) {
    const snapshot = await db.collection(COLLECTION).doc(docId).get();
    if (!snapshot.exists) throw new Error(`Document not found: ${docId}`);
    return snapshot as QueryDocumentSnapshot;
  }

  const latest = await db.collection(COLLECTION).orderBy('createdAt', 'desc').limit(1).get();
  const doc = latest.docs[0];
  if (!doc) throw new Error(`No documents found in ${COLLECTION}.`);
  return doc;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (isProductionDeployment()) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!requireAdmin(req, res)) return;

  try {
    if (!process.env[ENCRYPTION_ENV_VAR]) {
      return res.status(503).json({ error: `${ENCRYPTION_ENV_VAR} is not configured.` });
    }

    const db = initFirestore();
    const mode = getQueryValue(req.query.mode).trim();

    if (mode === 'list') {
      const limit = parseLimit(req.query.limit);
      const snapshot = await db.collection(COLLECTION).orderBy('createdAt', 'desc').limit(limit).get();
      return res.status(200).json({
        records: snapshot.docs.map(buildSummary),
      });
    }

    const doc = await loadDoc(db, req);
    return res.status(200).json(buildRecord(doc));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load intake records.';
    const status = message.startsWith('Document not found') ? 404 : 500;
    return res.status(status).json({ error: message });
  }
}

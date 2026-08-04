import dotenv from 'dotenv';
import type { Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { decryptText } from '../lib/encryption.js';
import { initFirebaseAdmin } from '../lib/firebaseAdmin.js';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const COLLECTION = 'automationIntakes';
const ENCRYPTION_ENV_VAR = 'AUTOMATION_INTAKE_ENCRYPTION_KEY';

type FieldSelection = 'all' | 'draft' | 'transcript' | 'brief';

interface ParsedArgs {
  docId?: string;
  latest: boolean;
  field: FieldSelection;
}

function printUsage(): void {
  console.log(
    [
      'Usage:',
      '  npm run decrypt:intake -- <docId> [--field draft|transcript|brief|all]',
      '  npm run decrypt:intake -- --latest [--field draft|transcript|brief|all]',
      '',
      'Examples:',
      '  npm run decrypt:intake -- abc123',
      '  npm run decrypt:intake -- abc123 --field transcript',
      '  npm run decrypt:intake -- --latest',
    ].join('\n'),
  );
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    latest: false,
    field: 'all',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg) continue;

    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }

    if (arg === '--latest') {
      parsed.latest = true;
      continue;
    }

    if (arg === '--field') {
      const next = argv[index + 1];
      if (!next) {
        throw new Error('Missing value for --field');
      }
      parsed.field = parseField(next);
      index += 1;
      continue;
    }

    if (arg.startsWith('--field=')) {
      parsed.field = parseField(arg.slice('--field='.length));
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(`Unknown flag: ${arg}`);
    }

    if (parsed.docId) {
      throw new Error(`Unexpected extra argument: ${arg}`);
    }

    parsed.docId = arg;
  }

  if (parsed.latest && parsed.docId) {
    throw new Error('Pass either a document id or --latest, not both.');
  }

  if (!parsed.latest && !parsed.docId) {
    throw new Error('Pass a document id or --latest.');
  }

  return parsed;
}

function parseField(value: string): FieldSelection {
  if (value === 'all' || value === 'draft' || value === 'transcript' || value === 'brief') {
    return value;
  }
  throw new Error(`Invalid --field value: ${value}`);
}

function initFirestore(): Firestore {
  return initFirebaseAdmin();
}

async function loadDoc(
  db: Firestore,
  args: ParsedArgs,
): Promise<QueryDocumentSnapshot> {
  if (args.latest) {
    const latest = await db
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    const doc = latest.docs[0];
    if (!doc) {
      throw new Error(`No documents found in ${COLLECTION}.`);
    }

    return doc;
  }

  const snapshot = await db.collection(COLLECTION).doc(args.docId!).get();
  if (!snapshot.exists) {
    throw new Error(`Document not found: ${args.docId}`);
  }

  return snapshot as QueryDocumentSnapshot;
}

function parseEncryptedJson<T>(encrypted: unknown, label: string): T {
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

function pickIndexFields(data: Record<string, unknown>): Record<string, unknown> {
  return {
    businessName: data.businessName ?? null,
    website: data.website ?? null,
    sector: data.sector ?? null,
    teamSizeBand: data.teamSizeBand ?? null,
    contactName: data.contactName ?? null,
    contactEmail: data.contactEmail ?? null,
    submissionMode: data.submissionMode ?? null,
    workflowTitles: data.workflowTitles ?? [],
    status: data.status ?? null,
    schemaVersion: data.schemaVersion ?? null,
    ipHash: data.ipHash ?? null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const db = initFirestore();
  const doc = await loadDoc(db, args);
  const data = doc.data() as Record<string, unknown>;

  const draft = parseEncryptedJson<unknown>(data.draftEncrypted, 'draftEncrypted');
  const transcript = parseEncryptedJson<unknown>(data.transcriptEncrypted, 'transcriptEncrypted');
  const finalBrief = parseEncryptedJson<unknown>(data.finalBriefEncrypted, 'finalBriefEncrypted');

  const base = {
    id: doc.id,
    index: pickIndexFields(data),
  };

  if (args.field === 'draft') {
    console.log(JSON.stringify({ ...base, draft }, null, 2));
    return;
  }

  if (args.field === 'transcript') {
    console.log(JSON.stringify({ ...base, transcript }, null, 2));
    return;
  }

  if (args.field === 'brief') {
    console.log(JSON.stringify({ ...base, finalBrief }, null, 2));
    return;
  }

  console.log(
    JSON.stringify(
      {
        ...base,
        draft,
        transcript,
        finalBrief,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`decrypt-intake: ${message}`);
  printUsage();
  process.exit(1);
});

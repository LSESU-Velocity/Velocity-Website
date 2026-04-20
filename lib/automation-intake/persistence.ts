/**
 * Firestore persistence for the Automation Intake feature.
 *
 * Plaintext index fields are kept queryable for operational work.
 * Sensitive payloads (full draft, transcript, final brief) are AES-256-GCM encrypted
 * using AUTOMATION_INTAKE_ENCRYPTION_KEY.
 */
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, type Firestore } from 'firebase-admin/firestore';

import { encryptText } from '../encryption.js';
import type {
  AutomationIntakeDraft,
  FinalBrief,
  SubmissionMode,
} from './schemas.js';

const COLLECTION = 'automationIntakes';
const ENCRYPTION_ENV_VAR = 'AUTOMATION_INTAKE_ENCRYPTION_KEY';

function initFirebaseForIntake(): Firestore {
  if (getApps().length === 0) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey) throw new Error('FIREBASE_PRIVATE_KEY is not set');
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
  return getFirestore();
}

export interface SaveIntakeArgs {
  draft: AutomationIntakeDraft;
  finalBrief: FinalBrief;
  submissionMode: SubmissionMode;
  ipHash?: string;
}

export interface SaveIntakeResult {
  savedId: string;
}

export async function saveIntakeSubmission(args: SaveIntakeArgs): Promise<SaveIntakeResult> {
  // Fail-closed if the encryption key isn't configured.
  if (!process.env[ENCRYPTION_ENV_VAR]) {
    throw new Error(`${ENCRYPTION_ENV_VAR} is not set`);
  }

  const db = initFirebaseForIntake();

  const { draft, finalBrief, submissionMode, ipHash } = args;

  // Plaintext index fields only. Everything sensitive lives in the encrypted blobs.
  const plaintextIndex = {
    businessName: draft.business.businessName ?? null,
    website: draft.business.website ?? null,
    sector: draft.business.sector ?? null,
    teamSizeBand: draft.business.teamSizeBand ?? null,
    contactName: draft.contact.name ?? null,
    contactEmail: draft.contact.email ?? null,
    submissionMode,
    workflowTitles: draft.workflows.map((w) => w.name).filter(Boolean),
    status: 'new' as const,
    schemaVersion: draft.schemaVersion,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    ipHash: ipHash ?? null,
  };

  const draftPayload = { ...draft, finalBrief };

  const docPayload = {
    ...plaintextIndex,
    draftEncrypted: encryptText(JSON.stringify(draftPayload), ENCRYPTION_ENV_VAR),
    transcriptEncrypted: encryptText(JSON.stringify(draft.transcript), ENCRYPTION_ENV_VAR),
    finalBriefEncrypted: encryptText(JSON.stringify(finalBrief), ENCRYPTION_ENV_VAR),
  };

  const ref = await db.collection(COLLECTION).add(docPayload);

  return { savedId: ref.id };
}

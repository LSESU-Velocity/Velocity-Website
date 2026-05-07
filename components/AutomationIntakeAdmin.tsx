import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardPaste,
  Download,
  FileText,
  KeyRound,
  ListChecks,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  Workflow,
} from 'lucide-react';

import type {
  AutomationIntakeDraft,
  ChatMessage,
  FinalBrief,
  RecommendedProject,
  Workflow as IntakeWorkflow,
} from '../lib/automation-intake/schemas';

type AdminMode = 'firestore' | 'offline';
type AdminTab = 'brief' | 'workflows' | 'transcript' | 'raw';

interface IntakeIndex {
  id?: string;
  businessName?: string | null;
  website?: string | null;
  sector?: string | null;
  teamSizeBand?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  submissionMode?: string | null;
  workflowTitles?: string[];
  status?: string | null;
  schemaVersion?: number | null;
  ipHash?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface IntakeRecord {
  id: string;
  index: IntakeIndex;
  draft: AutomationIntakeDraft;
  transcript: ChatMessage[];
  rawTranscript?: ChatMessage[] | null;
  rawUserMessages?: ChatMessage[] | null;
  finalBrief: FinalBrief;
}

type ListRecord = IntakeIndex & { id: string };

interface AdminApiError extends Error {
  status?: number;
}

const tokenStorageKey = 'velocity-intake-admin-token';
const MAX_TRANSCRIPT_MESSAGES = 80;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function formatDate(value: unknown): string {
  if (typeof value !== 'string' || !value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function truncate(value: string, max = 84): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}...`;
}

function listText(items?: string[] | null, fallback = 'None recorded'): string {
  if (!items || items.length === 0) return fallback;
  return items.filter(Boolean).join(', ') || fallback;
}

function formatKey(value: string): string {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'automation-intake';
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function metricTone(value: string | undefined): 'green' | 'amber' | 'red' | 'zinc' {
  if (value === 'high') return 'green';
  if (value === 'medium') return 'amber';
  if (value === 'low') return 'red';
  return 'zinc';
}

function sensitivityTone(value: string | undefined): 'green' | 'amber' | 'red' | 'zinc' {
  if (value === 'low') return 'green';
  if (value === 'medium') return 'amber';
  if (value === 'high') return 'red';
  return 'zinc';
}

function priorityTone(value: string | undefined): 'green' | 'amber' | 'red' | 'zinc' {
  if (value === 'high') return 'red';
  if (value === 'medium') return 'amber';
  if (value === 'low') return 'green';
  return 'zinc';
}

function getTranscript(record: IntakeRecord): ChatMessage[] {
  return record.rawTranscript && record.rawTranscript.length > 0
    ? record.rawTranscript
    : record.transcript || [];
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const text = await response.text();
    if (!text) return fallback;
    const json = JSON.parse(text) as { error?: unknown };
    if (typeof json.error === 'string' && json.error.trim()) return json.error;
  } catch {
    // ignore and use fallback
  }
  return fallback;
}

async function fetchAdminJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = new Error(await parseErrorMessage(response, 'Unable to load intake data.')) as AdminApiError;
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  if (!/^[a-fA-F0-9]{64}$/.test(clean)) {
    throw new Error('Encryption key must be 64 hex characters.');
  }

  const bytes = new Uint8Array(clean.length / 2);
  for (let index = 0; index < clean.length; index += 2) {
    bytes[index / 2] = Number.parseInt(clean.slice(index, index + 2), 16);
  }
  return bytes;
}

function base64ToBytes(value: string): Uint8Array {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function decryptStoredText(stored: string, keyHex: string): Promise<string> {
  const parts = stored.split(':');
  if (parts.length !== 3) return stored;

  const [ivPart, tagPart, ciphertextPart] = parts;
  const iv = base64ToBytes(ivPart);
  const authTag = base64ToBytes(tagPart);
  const ciphertext = base64ToBytes(ciphertextPart);

  if (iv.length !== 12 || authTag.length !== 16) {
    throw new Error('Encrypted field has an unexpected format.');
  }

  const key = await window.crypto.subtle.importKey(
    'raw',
    bytesToArrayBuffer(hexToBytes(keyHex)),
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );
  const payload = new Uint8Array(ciphertext.length + authTag.length);
  payload.set(ciphertext, 0);
  payload.set(authTag, ciphertext.length);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytesToArrayBuffer(iv), tagLength: 128 },
    key,
    bytesToArrayBuffer(payload),
  );

  return new TextDecoder().decode(decrypted);
}

async function decryptJsonField<T>(
  source: Record<string, unknown>,
  fieldName: string,
  keyHex: string,
  required = true,
): Promise<T | null> {
  const encrypted = source[fieldName];
  if (typeof encrypted !== 'string' || !encrypted.trim()) {
    if (!required) return null;
    throw new Error(`${fieldName} is missing.`);
  }

  const text = await decryptStoredText(encrypted, keyHex);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`${fieldName} did not decrypt into JSON.`);
  }
}

function buildIndexFromPlainFields(id: string, source: Record<string, unknown>): IntakeIndex {
  return {
    id,
    businessName: asString(source.businessName) || null,
    website: asString(source.website) || null,
    sector: asString(source.sector) || null,
    teamSizeBand: asString(source.teamSizeBand) || null,
    contactName: asString(source.contactName) || null,
    contactEmail: asString(source.contactEmail) || null,
    submissionMode: asString(source.submissionMode) || null,
    workflowTitles: Array.isArray(source.workflowTitles)
      ? source.workflowTitles.filter((item): item is string => typeof item === 'string')
      : [],
    status: asString(source.status) || null,
    schemaVersion: typeof source.schemaVersion === 'number' ? source.schemaVersion : null,
    ipHash: asString(source.ipHash) || null,
    createdAt: asString(source.createdAt) || null,
    updatedAt: asString(source.updatedAt) || null,
  };
}

async function decryptPastedRecord(args: {
  input: string;
  keyHex: string;
  fallbackDocId: string;
}): Promise<IntakeRecord> {
  const parsed = JSON.parse(args.input) as unknown;
  if (!isRecord(parsed)) throw new Error('Paste a Firestore document JSON object.');

  const id =
    asString(parsed.id) ||
    asString(parsed.docId) ||
    asString(parsed.name) ||
    args.fallbackDocId.trim() ||
    'offline-record';

  const draft = await decryptJsonField<AutomationIntakeDraft>(parsed, 'draftEncrypted', args.keyHex);
  const transcript = await decryptJsonField<ChatMessage[]>(parsed, 'transcriptEncrypted', args.keyHex);
  const rawTranscript = await decryptJsonField<ChatMessage[]>(parsed, 'rawTranscriptEncrypted', args.keyHex, false);
  const rawUserMessages = await decryptJsonField<ChatMessage[]>(parsed, 'rawUserMessagesEncrypted', args.keyHex, false);
  const finalBrief = await decryptJsonField<FinalBrief>(parsed, 'finalBriefEncrypted', args.keyHex);

  if (!draft || !transcript || !finalBrief) {
    throw new Error('Pasted record is missing required encrypted fields.');
  }

  return {
    id,
    index: buildIndexFromPlainFields(id, parsed),
    draft,
    transcript,
    rawTranscript,
    rawUserMessages,
    finalBrief,
  };
}

function renderDocList(items?: string[] | null): string {
  if (!items || items.length === 0) return '<p class="muted">None recorded</p>';
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function renderDocWorkflow(workflow: IntakeWorkflow): string {
  return `
    <section>
      <h3>${escapeHtml(workflow.name || 'Untitled workflow')}</h3>
      <p class="meta">
        Owner: ${escapeHtml(workflow.owner || 'Not recorded')} | Frequency: ${escapeHtml(workflow.frequency || 'Not recorded')} | Priority: ${escapeHtml(workflow.priority || 'Not recorded')}
      </p>
      <h4>Tools</h4>
      ${renderDocList(workflow.tools)}
      <h4>Current steps</h4>
      ${renderDocList(workflow.currentSteps)}
      <h4>Pain points</h4>
      ${renderDocList(workflow.painPoints)}
    </section>
  `;
}

function renderDocProject(project: RecommendedProject): string {
  return `
    <section>
      <h3>${escapeHtml(project.title)}</h3>
      <p class="meta">
        Workflow: ${escapeHtml(project.targetWorkflow)} | Feasibility: ${escapeHtml(project.feasibility)} | Sensitivity: ${escapeHtml(project.dataSensitivity)}
      </p>
      <h4>Problem</h4>
      <p>${escapeHtml(project.problemSummary)}</p>
      <h4>Proposed automation</h4>
      <p>${escapeHtml(project.proposedAutomation)}</p>
      <h4>Expected impact</h4>
      <p>${escapeHtml(project.expectedImpact)}</p>
      <h4>Student delivery fit</h4>
      <p>${escapeHtml(project.studentDeliveryFit)}</p>
    </section>
  `;
}

function exportRecordAsDoc(record: IntakeRecord): void {
  const businessName =
    record.draft.business.businessName ||
    record.index.businessName ||
    record.id;
  const transcript = getTranscript(record).filter((message) => message.role !== 'system');
  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(businessName)} Automation Intake</title>
  <style>
    body { font-family: Aptos, Calibri, Arial, sans-serif; color: #171717; line-height: 1.45; }
    h1 { font-size: 28px; margin: 0 0 6px; }
    h2 { font-size: 20px; margin: 28px 0 8px; border-bottom: 1px solid #d4d4d4; padding-bottom: 4px; }
    h3 { font-size: 16px; margin: 18px 0 4px; }
    h4 { font-size: 12px; margin: 12px 0 2px; text-transform: uppercase; letter-spacing: .05em; color: #525252; }
    p { margin: 4px 0 10px; }
    ul { margin: 4px 0 12px 20px; padding: 0; }
    li { margin: 2px 0; }
    .meta, .muted { color: #525252; }
    .summary { background: #f5f5f5; padding: 12px; border-left: 4px solid #d71920; margin: 14px 0; }
    .message { margin: 8px 0; padding: 8px 10px; border-left: 3px solid #d4d4d4; }
  </style>
</head>
<body>
  <h1>${escapeHtml(businessName)} Automation Intake</h1>
  <p class="meta">Document ID: ${escapeHtml(record.id)} | Created: ${escapeHtml(formatDate(record.index.createdAt))}</p>
  <div class="summary">
    <p><strong>Contact:</strong> ${escapeHtml(record.draft.contact.name || record.index.contactName || 'Not recorded')} &lt;${escapeHtml(record.draft.contact.email || record.index.contactEmail || 'Not recorded')}&gt;</p>
    <p><strong>Sector:</strong> ${escapeHtml(record.draft.business.sector || record.index.sector || 'Not recorded')}</p>
    <p><strong>Website:</strong> ${escapeHtml(record.draft.business.website || record.index.website || 'Not recorded')}</p>
  </div>

  <h2>Client Summary</h2>
  <p>${escapeHtml(record.finalBrief.clientSummary)}</p>

  <h2>Internal Summary</h2>
  <p>${escapeHtml(record.finalBrief.internalSummary)}</p>

  <h2>Recommended Projects</h2>
  ${record.finalBrief.recommendedProjects.map(renderDocProject).join('')}

  <h2>Open Questions</h2>
  ${renderDocList(record.finalBrief.openQuestions)}

  <h2>Business Context</h2>
  <p><strong>What they do:</strong> ${escapeHtml(record.draft.business.whatTheyDo || 'Not recorded')}</p>
  <p><strong>Who they serve:</strong> ${escapeHtml(record.draft.business.whoTheyServe || 'Not recorded')}</p>
  <p><strong>Primary systems:</strong> ${escapeHtml(listText(record.draft.business.primarySystems))}</p>

  <h2>Workflows</h2>
  ${record.draft.workflows.map(renderDocWorkflow).join('')}

  <h2>Goals</h2>
  <h4>Desired outcomes</h4>
  ${renderDocList(record.draft.goals.desiredOutcomes)}
  <h4>Success metrics</h4>
  ${renderDocList(record.draft.goals.successMetrics)}
  <p><strong>Timeline:</strong> ${escapeHtml(record.draft.goals.timeline || 'Not recorded')}</p>

  <h2>Constraints</h2>
  <p><strong>Sensitive data:</strong> ${record.draft.constraints.sensitiveData ? 'Yes' : 'No or not recorded'}</p>
  <p>${escapeHtml(record.draft.constraints.sensitiveDataNotes || '')}</p>
  <h4>Approval requirements</h4>
  ${renderDocList(record.draft.constraints.approvalRequirements)}
  <h4>Compliance notes</h4>
  ${renderDocList(record.draft.constraints.complianceNotes)}

  <h2>Transcript</h2>
  ${transcript.map((message) => `
    <div class="message">
      <p class="meta">${escapeHtml(message.role)} | ${escapeHtml(formatDate(message.createdAt))}</p>
      <p>${escapeHtml(message.content)}</p>
    </div>
  `).join('')}
</body>
</html>`;

  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${slugify(businessName)}-automation-intake.doc`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const toneClasses = {
  green: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  amber: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  red: 'border-velocity-red/40 bg-velocity-red/10 text-red-100',
  zinc: 'border-white/10 bg-white/[0.04] text-zinc-300',
};

const tabLabels: Record<AdminTab, string> = {
  brief: 'Brief',
  workflows: 'Workflows',
  transcript: 'Transcript',
  raw: 'Raw',
};

export const AutomationIntakeAdmin: React.FC = () => {
  const [mode, setMode] = useState<AdminMode>('firestore');
  const [activeTab, setActiveTab] = useState<AdminTab>('brief');
  const [token, setToken] = useState(() => window.sessionStorage.getItem(tokenStorageKey) || '');
  const [docId, setDocId] = useState('');
  const [records, setRecords] = useState<ListRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<IntakeRecord | null>(null);
  const [offlineDocId, setOfflineDocId] = useState('');
  const [offlineKey, setOfflineKey] = useState('');
  const [offlineJson, setOfflineJson] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedTranscript = useMemo(
    () => (selectedRecord ? getTranscript(selectedRecord) : []),
    [selectedRecord],
  );

  const businessName = selectedRecord
    ? selectedRecord.draft.business.businessName || selectedRecord.index.businessName || 'Unnamed intake'
    : 'No intake selected';

  const saveToken = useCallback((value: string) => {
    setToken(value);
    if (value.trim()) {
      window.sessionStorage.setItem(tokenStorageKey, value.trim());
    } else {
      window.sessionStorage.removeItem(tokenStorageKey);
    }
  }, []);

  const runRequest = useCallback(async <T,>(task: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    setError('');
    try {
      return await task();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unexpected admin panel error.';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadRecent = useCallback(async () => {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setError('Enter the admin token first.');
      return;
    }

    const response = await runRequest(() =>
      fetchAdminJson<{ records: ListRecord[] }>('/api/automation-intake-admin?mode=list&limit=20', trimmedToken),
    );
    if (response) setRecords(response.records);
  }, [runRequest, token]);

  const loadLatest = useCallback(async () => {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setError('Enter the admin token first.');
      return;
    }

    const response = await runRequest(() =>
      fetchAdminJson<IntakeRecord>('/api/automation-intake-admin', trimmedToken),
    );
    if (response) {
      setSelectedRecord(response);
      setDocId(response.id);
      setActiveTab('brief');
    }
  }, [runRequest, token]);

  const loadRecord = useCallback(async (id?: string) => {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setError('Enter the admin token first.');
      return;
    }

    const targetDocId = (id || docId).trim();
    const url = targetDocId
      ? `/api/automation-intake-admin?docId=${encodeURIComponent(targetDocId)}`
      : '/api/automation-intake-admin';

    const response = await runRequest(() => fetchAdminJson<IntakeRecord>(url, trimmedToken));
    if (response) {
      setSelectedRecord(response);
      setDocId(response.id);
      setActiveTab('brief');
    }
  }, [docId, runRequest, token]);

  const decryptOffline = useCallback(async () => {
    if (!offlineJson.trim()) {
      setError('Paste a Firestore document JSON object first.');
      return;
    }
    if (!offlineKey.trim()) {
      setError('Enter the automation intake encryption key first.');
      return;
    }

    const response = await runRequest(() =>
      decryptPastedRecord({
        input: offlineJson,
        keyHex: offlineKey,
        fallbackDocId: offlineDocId,
      }),
    );
    if (response) {
      setSelectedRecord(response);
      setDocId(response.id);
      setActiveTab('brief');
    }
  }, [offlineDocId, offlineJson, offlineKey, runRequest]);

  useEffect(() => {
    if (token.trim()) void loadRecent();
  }, []);

  return (
    <section className="min-h-screen px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <div className="mb-3 inline-flex items-center gap-2 border border-velocity-red/30 bg-velocity-red/10 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-red-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Intake Admin
            </div>
            <h1 className="max-w-4xl font-sans text-4xl font-semibold tracking-normal text-white sm:text-5xl">
              Automation intake review console
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['firestore', 'offline'] as AdminMode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setError('');
                }}
                className={`inline-flex h-10 items-center gap-2 border px-4 text-sm transition-colors ${
                  mode === item
                    ? 'border-white bg-white text-black'
                    : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/30 hover:text-white'
                }`}
              >
                {item === 'firestore' ? <LockKeyhole className="h-4 w-4" /> : <ClipboardPaste className="h-4 w-4" />}
                {item === 'firestore' ? 'Firestore' : 'Offline paste'}
              </button>
            ))}
          </div>
        </motion.div>

        {error && (
          <div className="mb-5 flex items-start gap-3 border border-velocity-red/30 bg-velocity-red/10 p-4 text-sm text-red-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-5">
            {mode === 'firestore' ? (
              <FirestoreControls
                docId={docId}
                isLoading={isLoading}
                records={records}
                token={token}
                onDocIdChange={setDocId}
                onLoadLatest={loadLatest}
                onLoadRecent={loadRecent}
                onLoadRecord={loadRecord}
                onTokenChange={saveToken}
              />
            ) : (
              <OfflineControls
                docId={offlineDocId}
                encryptionKey={offlineKey}
                isLoading={isLoading}
                json={offlineJson}
                onDecrypt={decryptOffline}
                onDocIdChange={setOfflineDocId}
                onEncryptionKeyChange={setOfflineKey}
                onJsonChange={setOfflineJson}
              />
            )}
          </aside>

          <main className="min-w-0">
            {!selectedRecord ? (
              <EmptyState mode={mode} />
            ) : (
              <div className="space-y-5">
                <RecordHeader
                  record={selectedRecord}
                  businessName={businessName}
                  onExport={() => exportRecordAsDoc(selectedRecord)}
                />

                <MetricStrip record={selectedRecord} transcriptCount={selectedTranscript.length} />

                <div className="border border-white/10 bg-black/50">
                  <div className="flex min-h-[56px] flex-wrap items-center justify-between gap-3 border-b border-white/10 px-3 py-3 sm:px-4">
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(tabLabels) as AdminTab[]).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActiveTab(tab)}
                          className={`h-9 border px-3 text-sm transition-colors ${
                            activeTab === tab
                              ? 'border-white bg-white text-black'
                              : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white'
                          }`}
                        >
                          {tabLabels[tab]}
                        </button>
                      ))}
                    </div>
                    <p className="font-mono text-xs text-zinc-500">{selectedRecord.id}</p>
                  </div>

                  <div className="p-4 sm:p-5">
                    {activeTab === 'brief' && <BriefView record={selectedRecord} />}
                    {activeTab === 'workflows' && <WorkflowView record={selectedRecord} />}
                    {activeTab === 'transcript' && <TranscriptView messages={selectedTranscript} />}
                    {activeTab === 'raw' && <RawView record={selectedRecord} />}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  );
};

interface FirestoreControlsProps {
  docId: string;
  isLoading: boolean;
  records: ListRecord[];
  token: string;
  onDocIdChange: (value: string) => void;
  onLoadLatest: () => void;
  onLoadRecent: () => void;
  onLoadRecord: (id?: string) => void;
  onTokenChange: (value: string) => void;
}

const FirestoreControls: React.FC<FirestoreControlsProps> = ({
  docId,
  isLoading,
  records,
  token,
  onDocIdChange,
  onLoadLatest,
  onLoadRecent,
  onLoadRecord,
  onTokenChange,
}) => (
  <div className="border border-white/10 bg-black/60 p-4">
    <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
      <KeyRound className="h-4 w-4 text-velocity-red" />
      Secure fetch
    </div>

    <label className="mb-3 block">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-zinc-500">Admin token</span>
      <input
        type="password"
        value={token}
        onChange={(event) => onTokenChange(event.target.value)}
        className="h-11 w-full border border-white/10 bg-white/[0.03] px-3 font-mono text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-velocity-red/60"
        placeholder="AUTOMATION_INTAKE_ADMIN_TOKEN"
      />
    </label>

    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-zinc-500">Document ID</span>
      <div className="flex gap-2">
        <input
          type="text"
          value={docId}
          onChange={(event) => onDocIdChange(event.target.value)}
          className="h-11 min-w-0 flex-1 border border-white/10 bg-white/[0.03] px-3 font-mono text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-velocity-red/60"
          placeholder="5Uu1HFJDZFoQe6Se9qte"
        />
        <IconButton
          label="Load document"
          disabled={isLoading}
          onClick={() => onLoadRecord()}
          icon={<Search className="h-4 w-4" />}
        />
      </div>
    </label>

    <div className="mt-3 grid grid-cols-2 gap-2">
      <TextButton disabled={isLoading} onClick={onLoadLatest} icon={<FileText className="h-4 w-4" />}>
        Latest
      </TextButton>
      <TextButton disabled={isLoading} onClick={onLoadRecent} icon={<RefreshCw className="h-4 w-4" />}>
        Recent
      </TextButton>
    </div>

    <div className="mt-5 border-t border-white/10 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Recent intakes</p>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
      </div>
      <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
        {records.length === 0 ? (
          <p className="border border-dashed border-white/10 p-3 text-sm text-zinc-500">No records loaded.</p>
        ) : (
          records.map((record) => (
            <button
              key={record.id}
              type="button"
              onClick={() => onLoadRecord(record.id)}
              className="group block w-full border border-white/10 bg-white/[0.02] p-3 text-left transition-colors hover:border-velocity-red/40 hover:bg-velocity-red/10"
            >
              <p className="truncate text-sm font-medium text-white">
                {record.businessName || 'Unnamed intake'}
              </p>
              <p className="mt-1 truncate text-xs text-zinc-500">{record.contactEmail || record.id}</p>
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.14em] text-zinc-600">
                <span>{record.status || 'new'}</span>
                <span>{formatDate(record.createdAt)}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  </div>
);

interface OfflineControlsProps {
  docId: string;
  encryptionKey: string;
  isLoading: boolean;
  json: string;
  onDecrypt: () => void;
  onDocIdChange: (value: string) => void;
  onEncryptionKeyChange: (value: string) => void;
  onJsonChange: (value: string) => void;
}

const OfflineControls: React.FC<OfflineControlsProps> = ({
  docId,
  encryptionKey,
  isLoading,
  json,
  onDecrypt,
  onDocIdChange,
  onEncryptionKeyChange,
  onJsonChange,
}) => (
  <div className="border border-white/10 bg-black/60 p-4">
    <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
      <ClipboardPaste className="h-4 w-4 text-velocity-red" />
      Browser decrypt
    </div>

    <label className="mb-3 block">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-zinc-500">Document ID</span>
      <input
        type="text"
        value={docId}
        onChange={(event) => onDocIdChange(event.target.value)}
        className="h-11 w-full border border-white/10 bg-white/[0.03] px-3 font-mono text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-velocity-red/60"
        placeholder="Optional"
      />
    </label>

    <label className="mb-3 block">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-zinc-500">Encryption key</span>
      <input
        type="password"
        value={encryptionKey}
        onChange={(event) => onEncryptionKeyChange(event.target.value)}
        className="h-11 w-full border border-white/10 bg-white/[0.03] px-3 font-mono text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-velocity-red/60"
        placeholder="64 hex characters"
      />
    </label>

    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-zinc-500">Firestore document JSON</span>
      <textarea
        value={json}
        onChange={(event) => onJsonChange(event.target.value)}
        className="min-h-[320px] w-full resize-y border border-white/10 bg-white/[0.03] p-3 font-mono text-xs leading-relaxed text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-velocity-red/60"
        placeholder='{"businessName":"LedgerLane","draftEncrypted":"...","transcriptEncrypted":"...","finalBriefEncrypted":"..."}'
      />
    </label>

    <div className="mt-3">
      <TextButton disabled={isLoading} onClick={onDecrypt} icon={<LockKeyhole className="h-4 w-4" />}>
        Decrypt
      </TextButton>
    </div>
  </div>
);

const EmptyState: React.FC<{ mode: AdminMode }> = ({ mode }) => (
  <div className="flex min-h-[560px] items-center justify-center border border-dashed border-white/15 bg-black/35 p-8 text-center">
    <div className="max-w-md">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border border-white/10 bg-white/[0.03]">
        {mode === 'firestore' ? (
          <LockKeyhole className="h-6 w-6 text-zinc-400" />
        ) : (
          <ClipboardPaste className="h-6 w-6 text-zinc-400" />
        )}
      </div>
      <h2 className="text-xl font-semibold text-white">Select an intake</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
        {mode === 'firestore'
          ? 'Load the latest record, fetch by document ID, or choose a recent submission.'
          : 'Paste a Firestore document JSON object and decrypt it locally in this browser.'}
      </p>
    </div>
  </div>
);

const RecordHeader: React.FC<{
  record: IntakeRecord;
  businessName: string;
  onExport: () => void;
}> = ({ record, businessName, onExport }) => (
  <div className="border border-white/10 bg-black/60 p-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
          {record.index.status || 'new'} / schema {record.index.schemaVersion || record.draft.schemaVersion}
        </p>
        <h2 className="truncate text-3xl font-semibold tracking-normal text-white">{businessName}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <InfoPill icon={<BriefcaseBusiness className="h-3.5 w-3.5" />}>
            {record.draft.business.sector || record.index.sector || 'Sector not recorded'}
          </InfoPill>
          <InfoPill icon={<MessageSquareText className="h-3.5 w-3.5" />}>
            {record.index.submissionMode || 'mode unknown'}
          </InfoPill>
          <InfoPill icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
            {formatDate(record.index.createdAt)}
          </InfoPill>
        </div>
      </div>

      <button
        type="button"
        onClick={onExport}
        className="inline-flex h-11 items-center justify-center gap-2 border border-velocity-red/50 bg-velocity-red/15 px-4 text-sm font-medium text-white transition-colors hover:bg-velocity-red"
      >
        <Download className="h-4 w-4" />
        Export doc
      </button>
    </div>

    <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 md:grid-cols-3">
      <HeaderField label="Contact" value={`${record.draft.contact.name || record.index.contactName || 'Not recorded'} / ${record.draft.contact.email || record.index.contactEmail || 'No email'}`} />
      <HeaderField label="Website" value={record.draft.business.website || record.index.website || 'Not recorded'} />
      <HeaderField label="Team size" value={record.draft.business.teamSizeBand || record.index.teamSizeBand || 'Not recorded'} />
    </div>
  </div>
);

const MetricStrip: React.FC<{ record: IntakeRecord; transcriptCount: number }> = ({ record, transcriptCount }) => {
  const primaryProject = record.finalBrief.recommendedProjects[0];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={<Workflow className="h-4 w-4" />} label="Workflows" value={String(record.draft.workflows.length)} tone="zinc" />
      <Metric icon={<MessageSquareText className="h-4 w-4" />} label="Messages" value={String(transcriptCount)} tone="zinc" />
      <Metric icon={<ListChecks className="h-4 w-4" />} label="Feasibility" value={primaryProject?.feasibility || 'Unknown'} tone={metricTone(primaryProject?.feasibility)} />
      <Metric icon={<ShieldCheck className="h-4 w-4" />} label="Data sensitivity" value={primaryProject?.dataSensitivity || 'Unknown'} tone={sensitivityTone(primaryProject?.dataSensitivity)} />
    </div>
  );
};

const BriefView: React.FC<{ record: IntakeRecord }> = ({ record }) => (
  <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
    <div className="space-y-5">
      <Section title="Client summary">
        <p className="text-sm leading-7 text-zinc-300">{record.finalBrief.clientSummary}</p>
      </Section>

      <Section title="Internal summary">
        <p className="text-sm leading-7 text-zinc-300">{record.finalBrief.internalSummary}</p>
      </Section>

      <Section title="Business context">
        <div className="grid gap-3 md:grid-cols-2">
          <Detail label="What they do" value={record.draft.business.whatTheyDo} />
          <Detail label="Who they serve" value={record.draft.business.whoTheyServe} />
          <Detail label="Primary systems" value={listText(record.draft.business.primarySystems)} />
          <Detail label="AI maturity" value={record.draft.aiUsage.maturity || 'Not recorded'} />
        </div>
      </Section>
    </div>

    <div className="space-y-4">
      <Section title="Recommended projects">
        <div className="space-y-3">
          {record.finalBrief.recommendedProjects.map((project) => (
            <ProjectCard key={`${project.title}-${project.targetWorkflow}`} project={project} />
          ))}
        </div>
      </Section>

      <Section title="Open questions">
        <BulletList items={record.finalBrief.openQuestions} />
      </Section>
    </div>
  </div>
);

const WorkflowView: React.FC<{ record: IntakeRecord }> = ({ record }) => (
  <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
    <div className="space-y-4">
      {record.draft.workflows.length === 0 ? (
        <p className="text-sm text-zinc-500">No workflows recorded.</p>
      ) : (
        record.draft.workflows.map((workflow) => (
          <WorkflowCard key={workflow.id || workflow.name} workflow={workflow} />
        ))
      )}
    </div>

    <div className="space-y-4">
      <Section title="Goals">
        <Detail label="Timeline" value={record.draft.goals.timeline || 'Not recorded'} />
        <Detail label="Project shape" value={record.draft.goals.preferredProjectShape || 'Not recorded'} />
        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Desired outcomes</p>
          <BulletList items={record.draft.goals.desiredOutcomes} />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Success metrics</p>
          <BulletList items={record.draft.goals.successMetrics} />
        </div>
      </Section>

      <Section title="Constraints">
        <div className="mb-4 flex items-center justify-between border border-white/10 bg-white/[0.02] px-3 py-2">
          <span className="text-sm text-zinc-400">Sensitive data</span>
          <span className={record.draft.constraints.sensitiveData ? 'text-red-200' : 'text-emerald-200'}>
            {record.draft.constraints.sensitiveData ? 'Yes' : 'No'}
          </span>
        </div>
        <Detail label="Notes" value={record.draft.constraints.sensitiveDataNotes || 'Not recorded'} />
        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Approval requirements</p>
          <BulletList items={record.draft.constraints.approvalRequirements} />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Compliance notes</p>
          <BulletList items={record.draft.constraints.complianceNotes} />
        </div>
      </Section>
    </div>
  </div>
);

const TranscriptView: React.FC<{ messages: ChatMessage[] }> = ({ messages }) => {
  const visibleMessages = messages.filter((message) => message.role !== 'system').slice(-MAX_TRANSCRIPT_MESSAGES);

  return (
    <div className="space-y-3">
      {visibleMessages.length === 0 ? (
        <p className="text-sm text-zinc-500">No transcript recorded.</p>
      ) : (
        visibleMessages.map((message) => (
          <div
            key={message.id}
            className={`border p-4 ${
              message.role === 'user'
                ? 'border-velocity-red/30 bg-velocity-red/10'
                : 'border-white/10 bg-white/[0.03]'
            }`}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-[0.18em] text-white">{message.role}</span>
              {message.stepId && (
                <span className="border border-white/10 px-2 py-0.5 text-xs text-zinc-400">
                  {formatKey(message.stepId)}
                </span>
              )}
              <span className="text-xs text-zinc-600">{formatDate(message.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">{message.content}</p>
          </div>
        ))
      )}
    </div>
  );
};

const RawView: React.FC<{ record: IntakeRecord }> = ({ record }) => (
  <pre className="max-h-[760px] overflow-auto border border-white/10 bg-black/60 p-4 font-mono text-xs leading-relaxed text-zinc-300">
    {JSON.stringify(record, null, 2)}
  </pre>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h3 className="mb-3 border-b border-white/10 pb-2 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
      {title}
    </h3>
    {children}
  </section>
);

const ProjectCard: React.FC<{ project: RecommendedProject }> = ({ project }) => (
  <article className="border border-white/10 bg-white/[0.025] p-4">
    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h4 className="text-lg font-semibold text-white">{project.title}</h4>
        <p className="mt-1 text-sm text-zinc-500">{project.targetWorkflow}</p>
      </div>
      <div className="flex gap-2">
        <Badge tone={metricTone(project.feasibility)}>{project.feasibility}</Badge>
        <Badge tone={sensitivityTone(project.dataSensitivity)}>{project.dataSensitivity}</Badge>
      </div>
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      <Detail label="Problem" value={project.problemSummary} />
      <Detail label="Automation" value={project.proposedAutomation} />
      <Detail label="Impact" value={project.expectedImpact} />
      <Detail label="Student delivery fit" value={project.studentDeliveryFit} />
    </div>
  </article>
);

const WorkflowCard: React.FC<{ workflow: IntakeWorkflow }> = ({ workflow }) => (
  <article className="border border-white/10 bg-white/[0.025] p-4">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h4 className="text-xl font-semibold text-white">{workflow.name || 'Untitled workflow'}</h4>
        <p className="mt-1 text-sm text-zinc-500">
          {workflow.owner || 'No owner'} / {workflow.frequency || 'No frequency'}
        </p>
      </div>
      <Badge tone={priorityTone(workflow.priority)}>{workflow.priority || 'priority unknown'}</Badge>
    </div>
    <div className="mb-4 flex flex-wrap gap-2">
      {(workflow.tools || []).length > 0 ? (
        workflow.tools.map((tool) => <Chip key={tool}>{tool}</Chip>)
      ) : (
        <span className="text-sm text-zinc-600">No tools recorded.</span>
      )}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Current steps</p>
        <BulletList items={workflow.currentSteps} />
      </div>
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Pain points</p>
        <BulletList items={workflow.painPoints} />
      </div>
    </div>
  </article>
);

const Detail: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="border border-white/10 bg-white/[0.02] p-3">
    <p className="mb-1 text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</p>
    <p className="text-sm leading-6 text-zinc-300">{value && value.trim() ? value : 'Not recorded'}</p>
  </div>
);

const BulletList: React.FC<{ items?: string[] | null }> = ({ items }) => {
  const cleaned = (items || []).filter(Boolean);
  if (cleaned.length === 0) return <p className="text-sm text-zinc-600">None recorded.</p>;
  return (
    <ul className="space-y-2">
      {cleaned.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-6 text-zinc-300">
          <span className="mt-2 h-1.5 w-1.5 flex-none bg-velocity-red" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

const Metric: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: keyof typeof toneClasses;
}> = ({ icon, label, value, tone }) => (
  <div className={`border p-4 ${toneClasses[tone]}`}>
    <div className="mb-3 flex items-center justify-between gap-3">
      <span className="text-current">{icon}</span>
      <span className="text-xs uppercase tracking-[0.18em] opacity-70">{label}</span>
    </div>
    <p className="text-2xl font-semibold capitalize tracking-normal">{value}</p>
  </div>
);

const HeaderField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-600">{label}</p>
    <p className="truncate text-sm text-zinc-300">{value}</p>
  </div>
);

const InfoPill: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <span className="inline-flex h-8 max-w-full items-center gap-2 border border-white/10 bg-white/[0.03] px-3 text-sm text-zinc-300">
    {icon}
    <span className="truncate">{children}</span>
  </span>
);

const Badge: React.FC<{ tone: keyof typeof toneClasses; children: React.ReactNode }> = ({ tone, children }) => (
  <span className={`inline-flex h-7 items-center border px-2.5 text-xs font-medium uppercase tracking-[0.14em] ${toneClasses[tone]}`}>
    {children}
  </span>
);

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex min-h-7 items-center border border-white/10 bg-black/40 px-2.5 text-xs text-zinc-300">
    {children}
  </span>
);

const TextButton: React.FC<{
  children: React.ReactNode;
  disabled?: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ children, disabled, icon, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="inline-flex h-11 w-full items-center justify-center gap-2 border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-white transition-colors hover:border-velocity-red/40 hover:bg-velocity-red/15 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {icon}
    {children}
  </button>
);

const IconButton: React.FC<{
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ disabled, icon, label, onClick }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={onClick}
    className="flex h-11 w-11 flex-none items-center justify-center border border-white/10 bg-white/[0.04] text-white transition-colors hover:border-velocity-red/40 hover:bg-velocity-red/15 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {icon}
  </button>
);

export default AutomationIntakeAdmin;

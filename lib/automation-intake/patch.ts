/**
 * Safe merge helpers for Automation Intake.
 * Model-produced patches are treated as untrusted — every merge clamps lengths,
 * dedupes arrays, and ignores unknown keys.
 */
import {
  CONTACT_EMAIL_PATTERN,
  TOOL_STACK_CATEGORIES,
  type AutomationIntakeDraft,
  type ToolStack,
  type ToolStackCategory,
  type Workflow,
  type StepId,
} from './schemas.js';

const MAX_ARRAY_APPEND = 40;
const GENERIC_TOOL_TOKENS = new Set([
  'app',
  'apps',
  'application',
  'applications',
  'platform',
  'platforms',
  'program',
  'programs',
  'also',
  'google',
  'microsoft',
  'noise',
  'power',
  'random',
  'try',
  'same',
  'software',
  'stuff',
  'core',
  'system',
  'systems',
  'the',
  'thing',
  'things',
  'tool',
  'tools',
  'various',
]);
const GENERIC_WORKFLOW_NAMES = new Set([
  'anything',
  'it',
  'process',
  'processes',
  'same',
  'same stuff',
  'something',
  'stuff',
  'task',
  'tasks',
  'that',
  'the process',
  'the workflow',
  'thing',
  'things',
  'this',
  'workflow',
  'workflows',
]);
const KNOWN_TOOL_LABELS: Record<string, string> = {
  airtable: 'Airtable',
  asana: 'Asana',
  calendar: 'Calendar',
  crm: 'CRM',
  docs: 'Google Docs',
  dentally: 'Dentally',
  'dentally pms': 'Dentally PMS',
  dropbox: 'Dropbox',
  email: 'Email',
  erp: 'ERP',
  excel: 'Excel',
  gmail: 'Gmail',
  'google calendar': 'Google Calendar',
  'google docs': 'Google Docs',
  'google drive': 'Google Drive',
  'google workspace': 'Google Workspace',
  'google sheets': 'Google Sheets',
  'help desk': 'Support Desk',
  bamboohr: 'BambooHR',
  canva: 'Canva',
  cliniko: 'Cliniko',
  clickup: 'ClickUp',
  docusign: 'DocuSign',
  figma: 'Figma',
  hibob: 'HiBob',
  hubspot: 'HubSpot',
  intercom: 'Intercom',
  jira: 'Jira',
  linear: 'Linear',
  'looker studio': 'Looker Studio',
  'make.com': 'Make',
  'microsoft teams': 'Microsoft Teams',
  'microsoft 365': 'Microsoft 365',
  monday: 'Monday.com',
  'monday.com': 'Monday.com',
  make: 'Make',
  netsuite: 'NetSuite',
  n8n: 'n8n',
  notion: 'Notion',
  odoo: 'Odoo',
  onedrive: 'OneDrive',
  outlook: 'Outlook',
  pipedrive: 'Pipedrive',
  pos: 'POS',
  'power bi': 'Power BI',
  tableau: 'Tableau',
  quickbooks: 'QuickBooks',
  salesforce: 'Salesforce',
  semble: 'Semble',
  shipbob: 'ShipBob',
  sharepoint: 'SharePoint',
  sheets: 'Google Sheets',
  shopify: 'Shopify',
  slack: 'Slack',
  spreadsheet: 'Spreadsheets',
  spreadsheets: 'Spreadsheets',
  stripe: 'Stripe',
  'support desk': 'Support Desk',
  teams: 'Microsoft Teams',
  ticketing: 'Support Desk',
  trello: 'Trello',
  whatsapp: 'WhatsApp',
  'whatsapp business': 'WhatsApp Business',
  xero: 'Xero',
  zapier: 'Zapier',
  zendesk: 'Zendesk',
};

const TOOL_CATEGORY_BY_LABEL: Record<string, ToolStackCategory> = {
  calendar: 'emailAndCalendar',
  email: 'emailAndCalendar',
  gmail: 'emailAndCalendar',
  'google calendar': 'emailAndCalendar',
  'google workspace': 'emailAndCalendar',
  'microsoft 365': 'emailAndCalendar',
  outlook: 'emailAndCalendar',
  slack: 'communication',
  'microsoft teams': 'communication',
  teams: 'communication',
  whatsapp: 'communication',
  'whatsapp business': 'communication',
  'google docs': 'docsAndPresentations',
  docusign: 'docsAndPresentations',
  docs: 'docsAndPresentations',
  notion: 'docsAndPresentations',
  canva: 'designAndCreative',
  figma: 'designAndCreative',
  asana: 'projectManagement',
  clickup: 'projectManagement',
  jira: 'projectManagement',
  linear: 'projectManagement',
  monday: 'projectManagement',
  'monday.com': 'projectManagement',
  trello: 'projectManagement',
  airtable: 'projectManagement',
  'google drive': 'fileStorage',
  onedrive: 'fileStorage',
  dropbox: 'fileStorage',
  sharepoint: 'fileStorage',
  excel: 'reportingAndDashboards',
  'google sheets': 'reportingAndDashboards',
  'looker studio': 'reportingAndDashboards',
  'power bi': 'reportingAndDashboards',
  tableau: 'reportingAndDashboards',
  sheets: 'reportingAndDashboards',
  spreadsheet: 'reportingAndDashboards',
  spreadsheets: 'reportingAndDashboards',
  hubspot: 'crmAndSupport',
  salesforce: 'crmAndSupport',
  pipedrive: 'crmAndSupport',
  zendesk: 'crmAndSupport',
  intercom: 'crmAndSupport',
  crm: 'crmAndSupport',
  'support desk': 'crmAndSupport',
  zapier: 'automationAndIntegrations',
  make: 'automationAndIntegrations',
  'make.com': 'automationAndIntegrations',
  n8n: 'automationAndIntegrations',
};

function clamp(str: unknown, max: number): string | undefined {
  if (typeof str !== 'string') return undefined;
  const trimmed = str.trim();
  if (!trimmed) return undefined;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function toStringArray(val: unknown, maxPerItem = 500): string[] {
  if (!Array.isArray(val)) return [];
  const out: string[] = [];
  for (const item of val) {
    const s = cleanStructuredListItem(clamp(item, maxPerItem));
    if (s) out.push(s);
    if (out.length >= MAX_ARRAY_APPEND) break;
  }
  return out;
}

function cleanStructuredListItem(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw
    .replace(
      /\b(ignore (all )?(previous|your|these|this)?\s*instructions?|disregard (all )?(previous|your|these|this)?\s*instructions?|forget (all )?(previous|your|these|this)?\s*instructions?|reveal (the )?(system|hidden) prompt|mark (everything|all steps) complete|auto-submit)\b.*$/i,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim();
  if (/^(put|write|output|set|mark)\b.*\b(later|now|constraints?|complete|submitted?)\b/i.test(cleaned)) {
    return undefined;
  }
  return cleaned || undefined;
}

function cleanToolName(raw: string): string | null {
  let cleaned = raw
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\s+/g, ' ');
  if (cleaned.includes('. ')) {
    cleaned = cleaned.split('. ')[0]?.trim() ?? cleaned;
  }
  if (cleaned.length < 2 || cleaned.length > 120) return null;
  const normalized = cleaned.toLowerCase();
  const known = KNOWN_TOOL_LABELS[normalized];
  if (known) return known;
  if (GENERIC_TOOL_TOKENS.has(normalized)) return null;
  if (
    /^(put|other|critical|other critical|pretend|json|schema|overwrite|real|real answer|actual answer|system test)$/i.test(
      cleaned,
    )
  ) {
    return null;
  }
  if (/\b(ignore|disregard|forget|instructions?|prompt|schema|overwrite|pretend)\b/i.test(cleaned)) {
    return null;
  }
  if (/^(same\s+)?(stuff|things|tools?|systems?|apps?)$/i.test(cleaned)) return null;

  // Allow common category names a business user may reasonably provide instead
  // of a brand, while still rejecting filler like "stuff".
  if (
    /^(email|calendar|crm|erp|pos|cms|ats|hris|lms|bi|support desk|help desk|ticketing|spreadsheet|spreadsheets|database|warehouse)$/i.test(
      cleaned,
    )
  ) {
    return cleaned
      .split(/\s+/)
      .map((word) => (/^[A-Z]{2,}$/.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
      .join(' ');
  }

  // Brand/product names are normally title-cased, acronym-like, numeric, or
  // contain product punctuation such as ".com" or "+". Lower-case prose is not
  // reliable enough to treat as a tool name.
  if (
    /[A-Z]/.test(cleaned) ||
    /^[A-Z0-9]{2,}$/.test(cleaned) ||
    /[.+/]/.test(cleaned) ||
    /\d/.test(cleaned)
  ) {
    return cleaned;
  }

  return null;
}

function cleanToolNames(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const cleaned = cleanToolName(value);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
  }
  const hasSpecificCalendar = out.some((item) => item.toLowerCase() === 'google calendar');
  return hasSpecificCalendar ? out.filter((item) => item.toLowerCase() !== 'calendar') : out;
}

function categoryForTool(tool: string): ToolStackCategory | null {
  return TOOL_CATEGORY_BY_LABEL[tool.toLowerCase()] ?? null;
}

function appendToolsToStack(
  stack: ToolStack,
  preferredCategory: ToolStackCategory,
  tools: string[],
): void {
  for (const tool of tools) {
    const category = categoryForTool(tool) ?? preferredCategory;
    stack[category] = dedupeAppend(stack[category], [tool], 20);
  }
}

function emptyToolStack(): ToolStack {
  return {
    emailAndCalendar: [],
    communication: [],
    docsAndPresentations: [],
    designAndCreative: [],
    projectManagement: [],
    fileStorage: [],
    reportingAndDashboards: [],
    crmAndSupport: [],
    automationAndIntegrations: [],
    other: [],
  };
}

function normalizeToolStack(stack: ToolStack): ToolStack {
  const normalized = emptyToolStack();
  for (const category of TOOL_STACK_CATEGORIES) {
    appendToolsToStack(normalized, category, cleanToolNames(stack[category] ?? []));
  }
  return normalized;
}

function cleanWorkflowName(raw: unknown): string | undefined {
  let name = clamp(raw, 400);
  if (!name) return undefined;
  name = (name.split(/\r?\n/)[0] ?? name)
    .replace(/^(primary\s+)?workflow\s*(to\s+scope)?\s*:\s*/i, '')
    .replace(/^(workflow|process)\s*:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const colonTitle = name.split(':')[0]?.trim();
  if (colonTitle && colonTitle.length >= 4) name = colonTitle;
  if (name.includes('. ')) name = name.split('. ')[0]?.trim() ?? name;
  if (name.length > 120) name = name.slice(0, 120).trim();
  name = name.replace(/[.。]+$/g, '').trim();
  const normalized = name.toLowerCase().replace(/\s+/g, ' ').trim();
  if (normalized.length < 4) return undefined;
  if (GENERIC_WORKFLOW_NAMES.has(normalized)) return undefined;
  if (/^(the|a|an|our|my)\s+(thing|stuff|process|workflow|task)$/i.test(normalized)) {
    return undefined;
  }
  return name;
}

function normalizeContactEmail(raw: unknown): string | undefined {
  const candidate = clamp(raw, 120)?.replace(/[),.;:]+$/g, '').trim();
  if (!candidate) return undefined;
  return CONTACT_EMAIL_PATTERN.test(candidate) ? candidate : undefined;
}

function dedupeAppend(existing: string[] | undefined, next: string[], maxTotal = 40): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of [...(existing ?? []), ...next]) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= maxTotal) break;
  }
  return result;
}

// ----- Step-specific patch shapes coming from the model -----

export interface BusinessPatch {
  businessName?: string;
  website?: string;
  sector?: string;
  teamSizeBand?: string;
  whatTheyDo?: string;
  whoTheyServe?: string;
}

export interface SystemsPatch {
  toolStack?: Partial<Record<keyof ToolStack, string[]>>;
}

export interface WorkflowNamePatch {
  name?: string;
}

export interface WorkflowOwnershipPatch {
  owner?: string;
  frequency?: string;
}

export interface WorkflowToolsPatch {
  tools?: string[];
}

export interface WorkflowStepsPatch {
  currentSteps?: string[];
}

export interface PainPointsPatch {
  painPoints?: string[];
}

export interface AiUsagePatch {
  currentTools?: string[];
  currentUseCases?: string[];
  maturity?: 'none' | 'experimental' | 'active';
}

export interface AiNonUsePatch {
  nonUseAreas?: string[];
  blockers?: string[];
}

export interface ConstraintsPatch {
  sensitiveData?: boolean;
  sensitiveDataNotes?: string;
  approvalRequirements?: string[];
  complianceNotes?: string[];
  integrationLimits?: string[];
}

export interface GoalsPatch {
  desiredOutcomes?: string[];
  successMetrics?: string[];
  timeline?: string;
  preferredProjectShape?: string;
}

export interface ContactPatch {
  name?: string;
  role?: string;
  email?: string;
  consent?: boolean;
}

export type StepPatch =
  | { stepId: 'business'; data: BusinessPatch; followUpQuestion?: string }
  | { stepId: 'systems'; data: SystemsPatch; followUpQuestion?: string }
  | { stepId: 'workflow-name'; data: WorkflowNamePatch; followUpQuestion?: string }
  | { stepId: 'workflow-ownership'; data: WorkflowOwnershipPatch; followUpQuestion?: string }
  | { stepId: 'workflow-tools'; data: WorkflowToolsPatch; followUpQuestion?: string }
  | { stepId: 'workflow-steps'; data: WorkflowStepsPatch; followUpQuestion?: string }
  | { stepId: 'pain-points'; data: PainPointsPatch; followUpQuestion?: string }
  | { stepId: 'ai-usage'; data: AiUsagePatch; followUpQuestion?: string }
  | { stepId: 'ai-non-use'; data: AiNonUsePatch; followUpQuestion?: string }
  | { stepId: 'constraints'; data: ConstraintsPatch; followUpQuestion?: string }
  | { stepId: 'goals'; data: GoalsPatch; followUpQuestion?: string }
  | { stepId: 'contact'; data: ContactPatch; followUpQuestion?: string };

// ----- Apply a patch to a draft (pure function, returns new draft) -----

export function applyPatch(draft: AutomationIntakeDraft, patch: StepPatch): AutomationIntakeDraft {
  const next: AutomationIntakeDraft = {
    ...draft,
    business: { ...draft.business, toolStack: { ...draft.business.toolStack } },
    workflows: draft.workflows.map((w) => ({ ...w })),
    aiUsage: { ...draft.aiUsage },
    constraints: { ...draft.constraints },
    goals: { ...draft.goals },
    contact: { ...draft.contact },
    transcript: [...draft.transcript],
  };

  switch (patch.stepId) {
    case 'business': {
      const p = patch.data;
      next.business.businessName = clamp(p.businessName, 120) ?? next.business.businessName;
      next.business.website = clamp(p.website, 120) ?? next.business.website;
      next.business.sector = clamp(p.sector, 120) ?? next.business.sector;
      next.business.teamSizeBand = clamp(p.teamSizeBand, 120) ?? next.business.teamSizeBand;
      next.business.whatTheyDo = clamp(p.whatTheyDo, 2000) ?? next.business.whatTheyDo;
      next.business.whoTheyServe = clamp(p.whoTheyServe, 2000) ?? next.business.whoTheyServe;
      break;
    }
    case 'systems': {
      const stack = patch.data.toolStack ?? {};
      for (const category of TOOL_STACK_CATEGORIES) {
        const incoming = cleanToolNames(toStringArray(stack[category], 120));
        if (incoming.length) {
          appendToolsToStack(next.business.toolStack, category, incoming);
        }
      }
      break;
    }
    case 'workflow-name': {
      const name = cleanWorkflowName(patch.data.name);
      if (name) {
        if (next.workflows.length === 0) {
          next.workflows.push(createWorkflow(name));
        } else {
          next.workflows[0] = { ...next.workflows[0], name };
        }
      }
      break;
    }
    case 'workflow-ownership': {
      if (next.workflows.length === 0) next.workflows.push(createWorkflow(''));
      const w = next.workflows[0];
      if (patch.data.owner) w.owner = clamp(patch.data.owner, 120) ?? w.owner;
      if (patch.data.frequency) w.frequency = clamp(patch.data.frequency, 120) ?? w.frequency;
      break;
    }
    case 'workflow-tools': {
      if (next.workflows.length === 0) next.workflows.push(createWorkflow(''));
      const w = next.workflows[0];
      if (patch.data.tools?.length) {
        const tools = cleanToolNames(toStringArray(patch.data.tools, 120));
        if (tools.length) w.tools = dedupeAppend(w.tools, tools, 20);
      }
      break;
    }
    case 'workflow-steps': {
      if (next.workflows.length === 0) next.workflows.push(createWorkflow(''));
      const w = next.workflows[0];
      if (patch.data.currentSteps?.length) {
        w.currentSteps = dedupeAppend(w.currentSteps, toStringArray(patch.data.currentSteps, 500), 20);
      }
      break;
    }
    case 'pain-points': {
      if (next.workflows.length === 0) {
        next.workflows.push(createWorkflow(''));
      }
      const w = next.workflows[0];
      if (patch.data.painPoints?.length) {
        w.painPoints = dedupeAppend(w.painPoints, toStringArray(patch.data.painPoints, 500), 20);
      }
      break;
    }
    case 'ai-usage': {
      const p = patch.data;
      if (p.currentTools?.length) {
        const currentTools = cleanToolNames(toStringArray(p.currentTools, 120));
        next.aiUsage.currentTools = dedupeAppend(
          next.aiUsage.currentTools,
          currentTools,
          20,
        );
      }
      if (p.currentUseCases?.length) {
        next.aiUsage.currentUseCases = dedupeAppend(
          next.aiUsage.currentUseCases,
          toStringArray(p.currentUseCases, 500),
          20,
        );
      }
      if (p.maturity) next.aiUsage.maturity = p.maturity;
      break;
    }
    case 'ai-non-use': {
      const p = patch.data;
      if (p.nonUseAreas?.length) {
        next.aiUsage.nonUseAreas = dedupeAppend(
          next.aiUsage.nonUseAreas,
          toStringArray(p.nonUseAreas, 500),
          20,
        );
      }
      if (p.blockers?.length) {
        next.aiUsage.blockers = dedupeAppend(
          next.aiUsage.blockers,
          toStringArray(p.blockers, 500),
          20,
        );
      }
      break;
    }
    case 'constraints': {
      const p = patch.data;
      if (typeof p.sensitiveData === 'boolean') {
        next.constraints.sensitiveData = Boolean(next.constraints.sensitiveData || p.sensitiveData);
      }
      if (p.sensitiveDataNotes)
        next.constraints.sensitiveDataNotes =
          clamp(p.sensitiveDataNotes, 500) ?? next.constraints.sensitiveDataNotes;
      if (p.approvalRequirements?.length) {
        next.constraints.approvalRequirements = dedupeAppend(
          next.constraints.approvalRequirements,
          toStringArray(p.approvalRequirements, 500),
          20,
        );
      }
      if (p.complianceNotes?.length) {
        next.constraints.complianceNotes = dedupeAppend(
          next.constraints.complianceNotes,
          toStringArray(p.complianceNotes, 500),
          20,
        );
      }
      if (p.integrationLimits?.length) {
        next.constraints.integrationLimits = dedupeAppend(
          next.constraints.integrationLimits,
          toStringArray(p.integrationLimits, 500),
          20,
        );
      }
      break;
    }
    case 'goals': {
      const p = patch.data;
      if (p.desiredOutcomes?.length) {
        next.goals.desiredOutcomes = dedupeAppend(
          next.goals.desiredOutcomes,
          toStringArray(p.desiredOutcomes, 500),
          20,
        );
      }
      if (p.successMetrics?.length) {
        next.goals.successMetrics = dedupeAppend(
          next.goals.successMetrics,
          toStringArray(p.successMetrics, 500),
          20,
        );
      }
      if (p.timeline) next.goals.timeline = clamp(p.timeline, 120) ?? next.goals.timeline;
      if (p.preferredProjectShape)
        next.goals.preferredProjectShape =
          clamp(p.preferredProjectShape, 500) ?? next.goals.preferredProjectShape;
      break;
    }
    case 'contact': {
      const p = patch.data;
      if (p.name) next.contact.name = clamp(p.name, 120) ?? next.contact.name;
      if (p.role) next.contact.role = clamp(p.role, 120) ?? next.contact.role;
      if (p.email) {
        next.contact.email = normalizeContactEmail(p.email) ?? next.contact.email;
      }
      if (typeof p.consent === 'boolean') next.contact.consent = p.consent;
      break;
    }
  }

  next.business.toolStack = normalizeToolStack(next.business.toolStack);
  return next;
}

function createWorkflow(name: string): Workflow {
  return {
    id: makeId(),
    name,
    tools: [],
    currentSteps: [],
    painPoints: [],
  };
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ----- Follow-up gating -----

export function shouldEmitFollowUp(
  stepId: StepId,
  draft: AutomationIntakeDraft,
  followUpQuestion: string | undefined,
): boolean {
  if (!followUpQuestion || !followUpQuestion.trim()) return false;

  // Follow up on workflow-steps when we failed to capture any steps at all.
  if (stepId === 'workflow-steps') {
    const w = draft.workflows[0];
    return (w?.currentSteps?.length ?? 0) === 0;
  }

  if (stepId === 'pain-points') {
    const w = draft.workflows[0];
    return (w?.painPoints?.length ?? 0) < 2;
  }

  if (stepId === 'systems') {
    const stack = draft.business.toolStack;
    const total = Object.values(stack).reduce((a, b) => a + b.length, 0);
    return total < 3;
  }

  return false;
}

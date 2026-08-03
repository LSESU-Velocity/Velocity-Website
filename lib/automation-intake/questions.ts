/**
 * Canonical step definitions for the Automation Intake conversation.
 * Fixed order, fixed copy: the engine walks this list; the AI does not choose the path.
 */
import type { StepId } from './schemas.js';

export interface StepDefinition {
  id: StepId;
  order: number;
  /** Title shown in progress UI and form section headers. */
  title: string;
  /** Short human explanation of what we're about to ask. */
  intro: string;
  /** The primary assistant question for chat mode. Injected as plain text, never as HTML. */
  assistantPrompt: string;
  /** Short helper string for form mode. */
  formHelper: string;
  /** Whether this step is allowed to emit a follow-up. */
  allowsFollowUp: boolean;
}

export const STEP_DEFINITIONS: readonly StepDefinition[] = [
  {
    id: 'business',
    order: 1,
    title: 'Business overview',
    intro: 'A quick snapshot of what the business does and who it serves.',
    assistantPrompt:
      "Let's start with the basics. What does your business do, and who do you serve? A few sentences is plenty. Include the company name and your website if you can.",
    formHelper: 'Company name, website, sector, team size, what you do, who you serve.',
    allowsFollowUp: true,
  },
  {
    id: 'systems',
    order: 2,
    title: 'Core systems & tools',
    intro: 'The tools people already use every day. This is how we find quick automation wins.',
    assistantPrompt:
      'Which tools do your team rely on day to day? Think email and calendar, chat, documents, project management, file storage, reporting, and any CRM or support system. Just list the ones that matter.',
    formHelper: 'Pick or type the tools your team uses across each category.',
    allowsFollowUp: true,
  },
  {
    id: 'workflow-name',
    order: 3,
    title: 'Workflow to scope',
    intro: "The one workflow we'll turn into a student project brief.",
    assistantPrompt:
      "What's one recurring workflow you'd most like help with? A short name is fine. We'll dig into the details next.",
    formHelper: 'Name the primary workflow you want to scope.',
    allowsFollowUp: true,
  },
  {
    id: 'workflow-ownership',
    order: 4,
    title: 'Owner & cadence',
    intro: 'Who runs it and how often.',
    assistantPrompt:
      'Who owns that workflow day-to-day, and how often does it run?',
    formHelper: 'Role or person + rough frequency.',
    allowsFollowUp: true,
  },
  {
    id: 'workflow-tools',
    order: 5,
    title: 'Tools involved',
    intro: 'The apps that touch the workflow.',
    assistantPrompt:
      'Which tools does it touch? Could be anything from Gmail and Sheets to a CRM or an internal system.',
    formHelper: 'Every app involved, even if only once.',
    allowsFollowUp: true,
  },
  {
    id: 'workflow-steps',
    order: 6,
    title: 'Current steps',
    intro: 'A walkthrough of how the workflow runs today.',
    assistantPrompt:
      'Walk me through the main steps in plain English: what happens first, next, and so on.',
    formHelper: 'Short imperative steps in order.',
    allowsFollowUp: true,
  },
  {
    id: 'pain-points',
    order: 7,
    title: 'Pain points & manual handoffs',
    intro: 'Where the workflow breaks, slows, or makes people copy/paste.',
    assistantPrompt:
      "What's painful about it today? I'm especially curious about manual handoffs, re-typing the same information across tools, delays, or errors that keep coming back.",
    formHelper: 'List the frustrations, delays, or places where people copy/paste between tools.',
    allowsFollowUp: true,
  },
  {
    id: 'ai-usage',
    order: 8,
    title: 'Current AI usage',
    intro: 'What AI (if any) is already working for the team.',
    assistantPrompt:
      "Are you using any AI tools today (ChatGPT, Copilot, Gemini, a writing assistant)? Where have they genuinely helped?",
    formHelper: 'Tools you use, where they help, rough maturity level.',
    allowsFollowUp: true,
  },
  {
    id: 'ai-non-use',
    order: 9,
    title: 'Gaps & blockers',
    intro: 'Where AI could help but something is stopping you.',
    assistantPrompt:
      "Where would AI obviously help but you haven't adopted it yet? What's blocking it: data sensitivity, approvals, integration pain, cost, or just time?",
    formHelper: "Areas you'd want AI to help with, and the blockers in the way.",
    allowsFollowUp: true,
  },
  {
    id: 'constraints',
    order: 10,
    title: 'Constraints & boundaries',
    intro: 'Hard limits we should respect: sensitive data, compliance, approvals.',
    assistantPrompt:
      'Any constraints we should know about? Sensitive data categories, compliance rules, required approvals, or integrations that are off-limits.',
    formHelper: 'Sensitive data, approval needs, compliance notes, integration limits.',
    allowsFollowUp: true,
  },
  {
    id: 'goals',
    order: 11,
    title: 'Desired outcomes',
    intro: "The change you want and how you'd measure it working.",
    assistantPrompt:
      'If this goes well, what changes for your team in the next quarter? Concrete metrics are great, but anything directional is fine too.',
    formHelper: 'Outcomes, success metrics, timeline, preferred project shape.',
    allowsFollowUp: true,
  },
  {
    id: 'contact',
    order: 12,
    title: 'Contact & consent',
    intro: 'Who we should reach out to, and your agreement to proceed.',
    assistantPrompt:
      "Last step: who should we get back to? Share your name, role, and a work email, then type 'I consent' if you're happy for Velocity to store this intake and contact you about it.",
    formHelper: "Name, role, email, and type 'I consent' or tick the box to let Velocity store the intake and follow up.",
    allowsFollowUp: false,
  },
] as const;

export const FIRST_STEP: StepId = STEP_DEFINITIONS[0].id;
export const LAST_STEP: StepId = STEP_DEFINITIONS[STEP_DEFINITIONS.length - 1].id;

export const MAX_FOLLOW_UPS = 2;

export function getStep(id: StepId): StepDefinition {
  const found = STEP_DEFINITIONS.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown step id: ${id}`);
  return found;
}

export function getNextStep(id: StepId): StepId | null {
  const step = getStep(id);
  const next = STEP_DEFINITIONS[step.order];
  return next ? next.id : null;
}

/** Tool-stack category metadata shown in both form mode and chat follow-ups. */
export interface ToolCategoryMeta {
  key:
    | 'emailAndCalendar'
    | 'communication'
    | 'docsAndPresentations'
    | 'designAndCreative'
    | 'projectManagement'
    | 'fileStorage'
    | 'reportingAndDashboards'
    | 'crmAndSupport'
    | 'automationAndIntegrations'
    | 'other';
  label: string;
  question: string;
  examples: string[];
}

export const TOOL_CATEGORIES: readonly ToolCategoryMeta[] = [
  {
    key: 'emailAndCalendar',
    label: 'Email & calendar',
    question: 'What do you use for email and calendar?',
    examples: ['Gmail / Google Workspace', 'Outlook / Microsoft 365', 'Other'],
  },
  {
    key: 'communication',
    label: 'Internal communication',
    question: 'How does the team communicate internally?',
    examples: ['Slack', 'Microsoft Teams', 'WhatsApp', 'Email'],
  },
  {
    key: 'docsAndPresentations',
    label: 'Docs & presentations',
    question: 'Where do you write documents, notes, and slides?',
    examples: ['Google Workspace', 'Microsoft 365', 'Notion'],
  },
  {
    key: 'designAndCreative',
    label: 'Design & creative',
    question: 'Any dedicated design or creative tools?',
    examples: ['Canva', 'Figma', 'Adobe', 'None'],
  },
  {
    key: 'projectManagement',
    label: 'Project & task management',
    question: 'How do you track projects and tasks?',
    examples: ['Asana', 'Trello', 'Monday', 'ClickUp', 'Jira', 'Spreadsheets'],
  },
  {
    key: 'fileStorage',
    label: 'File storage',
    question: 'Where do files and shared folders live?',
    examples: ['Google Drive', 'OneDrive', 'SharePoint', 'Dropbox'],
  },
  {
    key: 'reportingAndDashboards',
    label: 'Reporting & dashboards',
    question: 'Reporting, dashboards, or KPI tracking?',
    examples: ['Excel', 'Google Sheets', 'Power BI', 'Looker Studio', 'Tableau'],
  },
  {
    key: 'crmAndSupport',
    label: 'CRM, support & customer ops',
    question: 'CRM, support, or customer ops tools?',
    examples: ['HubSpot', 'Salesforce', 'Zendesk', 'Intercom'],
  },
  {
    key: 'automationAndIntegrations',
    label: 'Automation & integrations',
    question: 'Any automation or integration tools already in place?',
    examples: ['Zapier', 'Make', 'n8n', 'Custom scripts', 'None'],
  },
  {
    key: 'other',
    label: 'Other critical tools',
    question: 'Anything else that matters for day-to-day operations?',
    examples: ['Industry-specific software', 'Accounting / finance', 'HR / payroll'],
  },
] as const;

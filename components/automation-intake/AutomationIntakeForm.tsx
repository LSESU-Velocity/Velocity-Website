import React, { useCallback, useMemo, useState } from 'react';
import { Plus, X, ArrowRight } from 'lucide-react';

import {
  STEP_DEFINITIONS,
  TOOL_CATEGORIES,
} from '../../lib/automation-intake/questions';
import {
  checkMinimumCompleteness,
  formatMissingRequirements,
  type AutomationIntakeDraft,
  type ToolStack,
  type ToolStackCategory,
  type Workflow,
} from '../../lib/automation-intake/schemas';

interface Props {
  draft: AutomationIntakeDraft;
  honeypot: string;
  onDraftChange: (next: AutomationIntakeDraft) => void;
  onHoneypotChange: (value: string) => void;
  onReviewRequested: () => void;
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

const sectionClass =
  'bg-white/[0.02] border border-white/10 backdrop-blur-sm p-6 md:p-8 space-y-4 mb-5';
const labelClass = 'block text-[11px] uppercase tracking-[0.22em] text-white/50 mb-1.5';
const inputClass =
  'w-full bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-velocity-red/60 transition-colors';
const helperClass = 'text-xs text-white/40 mt-1';

interface FieldProps {
  label: string;
  children: React.ReactNode;
  helper?: string;
}
const Field: React.FC<FieldProps> = ({ label, children, helper }) => (
  <div>
    <label className={labelClass}>{label}</label>
    {children}
    {helper && <div className={helperClass}>{helper}</div>}
  </div>
);

const SectionHeader: React.FC<{ id: string; title: string; intro: string }> = ({
  id,
  title,
  intro,
}) => (
  <div data-intake-section={id} className="mb-2">
    <div className="text-[11px] uppercase tracking-[0.25em] text-velocity-red/70 mb-1">
      {id.replace(/-/g, ' ')}
    </div>
    <h2 className="text-xl text-white font-light">{title}</h2>
    <p className="text-sm text-white/60 mt-1">{intro}</p>
  </div>
);

interface TagInputProps {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  maxLength?: number;
}
const TagInput: React.FC<TagInputProps> = ({
  values,
  onChange,
  placeholder,
  maxItems = 15,
  maxLength = 160,
}) => {
  const [input, setInput] = useState('');

  const commit = () => {
    const v = input.trim();
    if (!v) return;
    if (values.length >= maxItems) return;
    const cleaned = v.slice(0, maxLength);
    if (values.some((x) => x.toLowerCase() === cleaned.toLowerCase())) {
      setInput('');
      return;
    }
    onChange([...values, cleaned]);
    setInput('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && !input && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div>
      <div className={`${inputClass} flex flex-wrap items-center gap-1.5 min-h-[44px]`}>
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-velocity-red/15 border border-velocity-red/40 text-xs text-white"
          >
            {v}
            <button
              type="button"
              className="text-white/60 hover:text-white"
              onClick={() => onChange(values.filter((x) => x !== v))}
              aria-label={`Remove ${v}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          placeholder={values.length === 0 ? placeholder : ''}
          maxLength={maxLength}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
        />
      </div>
    </div>
  );
};

export const AutomationIntakeForm: React.FC<Props> = ({
  draft,
  honeypot,
  onDraftChange,
  onHoneypotChange,
  onReviewRequested,
}) => {
  const missing = useMemo(() => checkMinimumCompleteness(draft), [draft]);
  const readyToReview = missing.length === 0;

  const update = useCallback(
    (updater: (d: AutomationIntakeDraft) => AutomationIntakeDraft) => {
      onDraftChange(updater(draft));
    },
    [draft, onDraftChange],
  );

  const setBusiness = (patch: Partial<AutomationIntakeDraft['business']>) =>
    update((d) => ({ ...d, business: { ...d.business, ...patch } }));

  const setToolStack = (key: ToolStackCategory, values: string[]) =>
    update((d) => ({
      ...d,
      business: { ...d.business, toolStack: { ...d.business.toolStack, [key]: values } as ToolStack },
    }));

  const setWorkflow = (index: number, patch: Partial<Workflow>) =>
    update((d) => {
      const workflows = [...d.workflows];
      if (!workflows[index]) {
        workflows[index] = {
          id: makeId(),
          name: '',
          tools: [],
          currentSteps: [],
          painPoints: [],
        };
      }
      workflows[index] = { ...workflows[index], ...patch };
      return { ...d, workflows };
    });

  const addWorkflow = () =>
    update((d) => {
      if (d.workflows.length >= 3) return d;
      return {
        ...d,
        workflows: [
          ...d.workflows,
          { id: makeId(), name: '', tools: [], currentSteps: [], painPoints: [] },
        ],
      };
    });

  const removeWorkflow = (index: number) =>
    update((d) => ({ ...d, workflows: d.workflows.filter((_, i) => i !== index) }));

  const getStepIntro = (id: string) =>
    STEP_DEFINITIONS.find((s) => s.id === id)?.intro ?? '';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (readyToReview) onReviewRequested();
      }}
      className="space-y-0"
    >
      {/* Honeypot — visually hidden, aria-hidden. Real users never fill this. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
        <label>
          Website (do not fill)
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => onHoneypotChange(e.target.value)}
          />
        </label>
      </div>

      {/* Business */}
      <section className={sectionClass} data-intake-section="business">
        <SectionHeader id="business" title="Business overview" intro={getStepIntro('business')} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Business name">
            <input
              className={inputClass}
              value={draft.business.businessName ?? ''}
              onChange={(e) => setBusiness({ businessName: e.target.value })}
              maxLength={120}
              placeholder="Acme Co."
            />
          </Field>
          <Field label="Website">
            <input
              className={inputClass}
              value={draft.business.website ?? ''}
              onChange={(e) => setBusiness({ website: e.target.value })}
              maxLength={120}
              placeholder="acme.com"
            />
          </Field>
          <Field label="Sector">
            <input
              className={inputClass}
              value={draft.business.sector ?? ''}
              onChange={(e) => setBusiness({ sector: e.target.value })}
              maxLength={120}
              placeholder="e.g. B2B SaaS, professional services"
            />
          </Field>
          <Field label="Team size">
            <select
              className={inputClass}
              value={draft.business.teamSizeBand ?? ''}
              onChange={(e) => setBusiness({ teamSizeBand: e.target.value || undefined })}
            >
              <option value="">Select…</option>
              <option value="1-5">1–5</option>
              <option value="6-20">6–20</option>
              <option value="21-50">21–50</option>
              <option value="51-200">51–200</option>
              <option value="201+">201+</option>
            </select>
          </Field>
        </div>
        <Field label="What does the business do?">
          <textarea
            className={`${inputClass} min-h-[90px] leading-relaxed`}
            value={draft.business.whatTheyDo ?? ''}
            onChange={(e) => setBusiness({ whatTheyDo: e.target.value })}
            maxLength={2000}
            placeholder="A sentence or two — no marketing copy needed."
          />
        </Field>
        <Field label="Who do you serve?">
          <textarea
            className={`${inputClass} min-h-[70px] leading-relaxed`}
            value={draft.business.whoTheyServe ?? ''}
            onChange={(e) => setBusiness({ whoTheyServe: e.target.value })}
            maxLength={2000}
            placeholder="Your primary customers or users."
          />
        </Field>
      </section>

      {/* Tool stack */}
      <section className={sectionClass} data-intake-section="systems">
        <SectionHeader id="systems" title="Core systems & tools" intro={getStepIntro('systems')} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TOOL_CATEGORIES.map((cat) => (
            <Field key={cat.key} label={cat.label} helper={`e.g. ${cat.examples.join(', ')}`}>
              <TagInput
                values={draft.business.toolStack[cat.key] ?? []}
                onChange={(vals) => setToolStack(cat.key, vals)}
                placeholder="Type a tool name, press Enter"
              />
            </Field>
          ))}
        </div>
      </section>

      {/* Workflows */}
      <section className={sectionClass} data-intake-section="workflows">
        <SectionHeader
          id="workflows"
          title="Workflows to scope"
          intro="The primary workflow we'll turn into a student project brief. Add more only if they're worth mentioning."
        />
        <div className="space-y-4">
          {draft.workflows.length === 0 && (
            <div className="text-sm text-white/50 italic">
              Add at least one workflow. The first workflow you add is treated as the primary one to scope.
            </div>
          )}
          {draft.workflows.map((w, idx) => (
            <div
              key={w.id}
              className="p-4 bg-white/[0.02] border border-white/10 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/50">
                  {idx === 0 ? 'Primary workflow' : `Workflow ${idx + 1}`}
                </div>
                {draft.workflows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeWorkflow(idx)}
                    className="text-white/40 hover:text-velocity-red transition-colors"
                    aria-label="Remove workflow"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Field label="Name">
                <input
                  className={inputClass}
                  value={w.name}
                  onChange={(e) => setWorkflow(idx, { name: e.target.value })}
                  maxLength={120}
                  placeholder="e.g. Monthly client reporting"
                />
              </Field>
              {idx === 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Owner">
                      <input
                        className={inputClass}
                        value={w.owner ?? ''}
                        onChange={(e) => setWorkflow(idx, { owner: e.target.value })}
                        maxLength={120}
                        placeholder="Role or person"
                      />
                    </Field>
                    <Field label="Frequency">
                      <input
                        className={inputClass}
                        value={w.frequency ?? ''}
                        onChange={(e) => setWorkflow(idx, { frequency: e.target.value })}
                        maxLength={120}
                        placeholder="daily / weekly / monthly"
                      />
                    </Field>
                  </div>
                  <Field label="Tools involved">
                    <TagInput
                      values={w.tools ?? []}
                      onChange={(vals) => setWorkflow(idx, { tools: vals })}
                      placeholder="Type a tool, press Enter"
                    />
                  </Field>
                  <Field label="Current steps">
                    <TagInput
                      values={w.currentSteps ?? []}
                      onChange={(vals) => setWorkflow(idx, { currentSteps: vals })}
                      placeholder="Short step descriptions"
                      maxLength={500}
                    />
                  </Field>
                  <Field label="Pain points & manual handoffs">
                    <TagInput
                      values={w.painPoints ?? []}
                      onChange={(vals) => setWorkflow(idx, { painPoints: vals })}
                      placeholder="Each friction in its own tag"
                      maxLength={500}
                    />
                  </Field>
                </>
              )}
            </div>
          ))}
          {draft.workflows.length < 3 && (() => {
            const lastEmpty =
              draft.workflows.length > 0 && !draft.workflows[draft.workflows.length - 1].name.trim();
            return (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={addWorkflow}
                  disabled={lastEmpty}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 hover:text-white disabled:text-white/20 disabled:cursor-not-allowed border border-white/10 hover:border-velocity-red/50 disabled:hover:border-white/10 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add workflow
                </button>
                {lastEmpty && (
                  <span className="text-xs text-white/40">
                    Name the current workflow first.
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      </section>

      {/* AI usage */}
      <section className={sectionClass} data-intake-section="ai-usage">
        <SectionHeader id="ai-usage" title="Current AI usage" intro={getStepIntro('ai-usage')} />
        <Field label="Tools in use">
          <TagInput
            values={draft.aiUsage.currentTools ?? []}
            onChange={(vals) => update((d) => ({ ...d, aiUsage: { ...d.aiUsage, currentTools: vals } }))}
            placeholder="e.g. ChatGPT, Copilot, Gemini"
          />
        </Field>
        <Field label="Where AI helps today">
          <TagInput
            values={draft.aiUsage.currentUseCases ?? []}
            onChange={(vals) => update((d) => ({ ...d, aiUsage: { ...d.aiUsage, currentUseCases: vals } }))}
            placeholder="Short use-case descriptions"
            maxLength={500}
          />
        </Field>
        <Field label="Maturity">
          <select
            className={inputClass}
            value={draft.aiUsage.maturity ?? ''}
            onChange={(e) =>
              update((d) => ({
                ...d,
                aiUsage: { ...d.aiUsage, maturity: (e.target.value || undefined) as typeof d.aiUsage.maturity },
              }))
            }
          >
            <option value="">Select…</option>
            <option value="none">Not using AI yet</option>
            <option value="experimental">Experimenting informally</option>
            <option value="active">Actively embedded in workflows</option>
          </select>
        </Field>
        <Field label="Where AI could help but isn't used yet">
          <TagInput
            values={draft.aiUsage.nonUseAreas ?? []}
            onChange={(vals) => update((d) => ({ ...d, aiUsage: { ...d.aiUsage, nonUseAreas: vals } }))}
            placeholder="One gap per tag"
            maxLength={500}
          />
        </Field>
        <Field label="Blockers to AI adoption">
          <TagInput
            values={draft.aiUsage.blockers ?? []}
            onChange={(vals) => update((d) => ({ ...d, aiUsage: { ...d.aiUsage, blockers: vals } }))}
            placeholder="e.g. data sensitivity, approvals, cost"
            maxLength={500}
          />
        </Field>
      </section>

      {/* Constraints */}
      <section className={sectionClass} data-intake-section="constraints">
        <SectionHeader id="constraints" title="Constraints & boundaries" intro={getStepIntro('constraints')} />
        <Field label="Sensitive data involved?">
          <div className="flex items-center gap-6 text-sm text-white/80">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="sensitive"
                checked={draft.constraints.sensitiveData === true}
                onChange={() => update((d) => ({ ...d, constraints: { ...d.constraints, sensitiveData: true } }))}
              />
              Yes
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="sensitive"
                checked={draft.constraints.sensitiveData === false}
                onChange={() => update((d) => ({ ...d, constraints: { ...d.constraints, sensitiveData: false } }))}
              />
              No
            </label>
          </div>
        </Field>
        <Field label="Notes on sensitive data (optional)" helper="Describe the category only — never paste actual records.">
          <textarea
            className={`${inputClass} min-h-[70px]`}
            value={draft.constraints.sensitiveDataNotes ?? ''}
            onChange={(e) =>
              update((d) => ({ ...d, constraints: { ...d.constraints, sensitiveDataNotes: e.target.value } }))
            }
            maxLength={500}
          />
        </Field>
        <Field label="Approval requirements">
          <TagInput
            values={draft.constraints.approvalRequirements ?? []}
            onChange={(vals) =>
              update((d) => ({ ...d, constraints: { ...d.constraints, approvalRequirements: vals } }))
            }
            maxLength={500}
          />
        </Field>
        <Field label="Compliance notes">
          <TagInput
            values={draft.constraints.complianceNotes ?? []}
            onChange={(vals) =>
              update((d) => ({ ...d, constraints: { ...d.constraints, complianceNotes: vals } }))
            }
            maxLength={500}
          />
        </Field>
        <Field label="Integration limits">
          <TagInput
            values={draft.constraints.integrationLimits ?? []}
            onChange={(vals) =>
              update((d) => ({ ...d, constraints: { ...d.constraints, integrationLimits: vals } }))
            }
            maxLength={500}
          />
        </Field>
      </section>

      {/* Goals */}
      <section className={sectionClass} data-intake-section="goals">
        <SectionHeader id="goals" title="Desired outcomes" intro={getStepIntro('goals')} />
        <Field label="Desired outcomes">
          <TagInput
            values={draft.goals.desiredOutcomes ?? []}
            onChange={(vals) => update((d) => ({ ...d, goals: { ...d.goals, desiredOutcomes: vals } }))}
            maxLength={500}
          />
        </Field>
        <Field label="Success metrics">
          <TagInput
            values={draft.goals.successMetrics ?? []}
            onChange={(vals) => update((d) => ({ ...d, goals: { ...d.goals, successMetrics: vals } }))}
            maxLength={500}
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Timeline">
            <input
              className={inputClass}
              value={draft.goals.timeline ?? ''}
              onChange={(e) => update((d) => ({ ...d, goals: { ...d.goals, timeline: e.target.value } }))}
              maxLength={120}
              placeholder="e.g. this quarter"
            />
          </Field>
          <Field label="Preferred project shape">
            <input
              className={inputClass}
              value={draft.goals.preferredProjectShape ?? ''}
              onChange={(e) =>
                update((d) => ({ ...d, goals: { ...d.goals, preferredProjectShape: e.target.value } }))
              }
              maxLength={500}
              placeholder="e.g. lightweight Zapier workflow"
            />
          </Field>
        </div>
      </section>

      {/* Contact */}
      <section className={sectionClass} data-intake-section="contact">
        <SectionHeader id="contact" title="Contact & consent" intro={getStepIntro('contact')} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name">
            <input
              className={inputClass}
              value={draft.contact.name ?? ''}
              onChange={(e) => update((d) => ({ ...d, contact: { ...d.contact, name: e.target.value } }))}
              maxLength={120}
            />
          </Field>
          <Field label="Role">
            <input
              className={inputClass}
              value={draft.contact.role ?? ''}
              onChange={(e) => update((d) => ({ ...d, contact: { ...d.contact, role: e.target.value } }))}
              maxLength={120}
            />
          </Field>
        </div>
        <Field label="Work email">
          <input
            type="email"
            className={inputClass}
            value={draft.contact.email ?? ''}
            onChange={(e) => update((d) => ({ ...d, contact: { ...d.contact, email: e.target.value } }))}
            maxLength={120}
            placeholder="you@company.com"
          />
        </Field>
        <label className="flex items-start gap-3 text-sm text-white/80 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={draft.contact.consent}
            onChange={(e) =>
              update((d) => ({ ...d, contact: { ...d.contact, consent: e.target.checked } }))
            }
          />
          <span>
            I agree that Velocity can store this submission and contact me about this intake.
          </span>
        </label>
      </section>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 flex-wrap p-5 bg-white/[0.02] border border-white/10 backdrop-blur-sm">
        <div className="text-sm text-white/60">
          {readyToReview
            ? 'Looks good — ready to review.'
            : `Still needed: ${formatMissingRequirements(missing)}.`}
        </div>
        <button
          type="submit"
          disabled={!readyToReview}
          className="inline-flex items-center gap-2 px-5 py-3 bg-velocity-red disabled:bg-white/10 disabled:text-white/30 text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-velocity-red/80 transition-colors"
          style={{ borderRadius: '0' }}
        >
          Review submission <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  );
};

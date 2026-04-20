import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertTriangle, Pencil } from 'lucide-react';

import {
  checkMinimumCompleteness,
  formatMissingRequirements,
  TOOL_STACK_CATEGORIES,
  type AutomationIntakeDraft,
  type FinalBrief,
  type ToolStackCategory,
} from '../../lib/automation-intake/schemas';
import { TOOL_CATEGORIES } from '../../lib/automation-intake/questions';
import { postIntakeSubmit, IntakeApiError } from '../../lib/automation-intake/client';
import type { IntakeViewMode } from './AutomationIntakeToggle';

interface Props {
  draft: AutomationIntakeDraft;
  honeypot: string;
  submissionMode: IntakeViewMode;
  onEdit: (section: string) => void;
  onSubmitted: (brief: FinalBrief, savedId: string) => void;
}

interface CardProps {
  title: string;
  sectionId: string;
  onEdit: (section: string) => void;
  children: React.ReactNode;
}
const Card: React.FC<CardProps> = ({ title, sectionId, onEdit, children }) => (
  <section className="bg-white/[0.02] border border-white/10 backdrop-blur-sm p-6 md:p-7 space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="text-[11px] uppercase tracking-[0.25em] text-velocity-red/70">{title}</h3>
      <button
        type="button"
        onClick={() => onEdit(sectionId)}
        className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
      >
        <Pencil className="w-3 h-3" /> Edit
      </button>
    </div>
    <div className="text-sm text-white/90 leading-relaxed">{children}</div>
  </section>
);

const KV: React.FC<{ k: string; v?: string | null }> = ({ k, v }) =>
  v ? (
    <div className="flex gap-3">
      <span className="text-white/40 w-28 shrink-0">{k}</span>
      <span className="text-white/90">{v}</span>
    </div>
  ) : null;

const TagList: React.FC<{ items: string[]; empty?: string }> = ({ items, empty }) =>
  items.length === 0 ? (
    <span className="text-white/40 italic">{empty ?? 'Not provided'}</span>
  ) : (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="inline-block px-2 py-0.5 bg-white/5 border border-white/10 text-xs text-white/80"
        >
          {item}
        </span>
      ))}
    </div>
  );

export const AutomationIntakeReview: React.FC<Props> = ({
  draft,
  honeypot,
  submissionMode,
  onEdit,
  onSubmitted,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missing = useMemo(() => checkMinimumCompleteness(draft), [draft]);
  const canSubmit = missing.length === 0;

  const namedWorkflows = draft.workflows.filter((w) => w.name?.trim());
  const primary = namedWorkflows[0];

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await postIntakeSubmit({
        draft,
        honeypot,
        submissionMode,
      });
      onSubmitted(result.finalBrief, result.savedId);
    } catch (err) {
      const message = err instanceof IntakeApiError ? err.message : 'Unable to submit right now.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <button
          type="button"
          onClick={() => onEdit('business')}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to editing
        </button>
        <div className="text-xs text-white/40 uppercase tracking-[0.22em]">Review</div>
      </div>

      <Card title="Business" sectionId="business" onEdit={onEdit}>
        <KV k="Name" v={draft.business.businessName} />
        <KV k="Website" v={draft.business.website} />
        <KV k="Sector" v={draft.business.sector} />
        <KV k="Team size" v={draft.business.teamSizeBand} />
        <div className="mt-2">
          <div className="text-white/40 text-xs mb-1">What they do</div>
          <div>{draft.business.whatTheyDo || <span className="text-white/40 italic">Not provided</span>}</div>
        </div>
        {draft.business.whoTheyServe && (
          <div className="mt-2">
            <div className="text-white/40 text-xs mb-1">Who they serve</div>
            <div>{draft.business.whoTheyServe}</div>
          </div>
        )}
      </Card>

      <Card title="Tool stack" sectionId="systems" onEdit={onEdit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TOOL_STACK_CATEGORIES.map((cat: ToolStackCategory) => {
            const meta = TOOL_CATEGORIES.find((c) => c.key === cat);
            const items = draft.business.toolStack[cat] ?? [];
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <div className="text-white/40 text-xs mb-1">{meta?.label ?? cat}</div>
                <TagList items={items} />
              </div>
            );
          })}
          {TOOL_STACK_CATEGORIES.every((c) => (draft.business.toolStack[c] ?? []).length === 0) && (
            <span className="text-white/40 italic">No tools listed yet.</span>
          )}
        </div>
      </Card>

      <Card title="Primary workflow" sectionId="workflows" onEdit={onEdit}>
        {primary ? (
          <div className="space-y-3">
            <div className="text-white font-medium">{primary.name || 'Untitled workflow'}</div>
            <KV k="Owner" v={primary.owner} />
            <KV k="Frequency" v={primary.frequency} />
            <div>
              <div className="text-white/40 text-xs mb-1">Tools</div>
              <TagList items={primary.tools ?? []} empty="—" />
            </div>
            <div>
              <div className="text-white/40 text-xs mb-1">Current steps</div>
              <TagList items={primary.currentSteps ?? []} empty="—" />
            </div>
            <div>
              <div className="text-white/40 text-xs mb-1">Pain points</div>
              <TagList items={primary.painPoints ?? []} empty="—" />
            </div>
          </div>
        ) : (
          <span className="text-white/40 italic">No workflow captured yet.</span>
        )}
        {namedWorkflows.length > 1 && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="text-white/40 text-xs mb-2">Other workflows on your list</div>
            <TagList items={namedWorkflows.slice(1).map((w) => w.name)} />
          </div>
        )}
      </Card>

      <Card title="AI usage" sectionId="ai-usage" onEdit={onEdit}>
        <KV k="Maturity" v={draft.aiUsage.maturity} />
        <div>
          <div className="text-white/40 text-xs mb-1 mt-2">Tools in use</div>
          <TagList items={draft.aiUsage.currentTools ?? []} empty="—" />
        </div>
        <div>
          <div className="text-white/40 text-xs mb-1 mt-2">Where AI helps today</div>
          <TagList items={draft.aiUsage.currentUseCases ?? []} empty="—" />
        </div>
        <div>
          <div className="text-white/40 text-xs mb-1 mt-2">Gaps</div>
          <TagList items={draft.aiUsage.nonUseAreas ?? []} empty="—" />
        </div>
        <div>
          <div className="text-white/40 text-xs mb-1 mt-2">Blockers</div>
          <TagList items={draft.aiUsage.blockers ?? []} empty="—" />
        </div>
      </Card>

      <Card title="Constraints" sectionId="constraints" onEdit={onEdit}>
        <KV
          k="Sensitive data"
          v={
            typeof draft.constraints.sensitiveData === 'boolean'
              ? draft.constraints.sensitiveData
                ? 'Yes'
                : 'No'
              : undefined
          }
        />
        {draft.constraints.sensitiveDataNotes && (
          <div>
            <div className="text-white/40 text-xs mb-1 mt-2">Notes</div>
            <div>{draft.constraints.sensitiveDataNotes}</div>
          </div>
        )}
        <div>
          <div className="text-white/40 text-xs mb-1 mt-2">Approvals</div>
          <TagList items={draft.constraints.approvalRequirements ?? []} empty="—" />
        </div>
        <div>
          <div className="text-white/40 text-xs mb-1 mt-2">Compliance</div>
          <TagList items={draft.constraints.complianceNotes ?? []} empty="—" />
        </div>
        <div>
          <div className="text-white/40 text-xs mb-1 mt-2">Integration limits</div>
          <TagList items={draft.constraints.integrationLimits ?? []} empty="—" />
        </div>
      </Card>

      <Card title="Goals" sectionId="goals" onEdit={onEdit}>
        <div>
          <div className="text-white/40 text-xs mb-1">Desired outcomes</div>
          <TagList items={draft.goals.desiredOutcomes ?? []} empty="—" />
        </div>
        <div>
          <div className="text-white/40 text-xs mb-1 mt-2">Success metrics</div>
          <TagList items={draft.goals.successMetrics ?? []} empty="—" />
        </div>
        <KV k="Timeline" v={draft.goals.timeline} />
        <KV k="Preferred project" v={draft.goals.preferredProjectShape} />
      </Card>

      <Card title="Contact" sectionId="contact" onEdit={onEdit}>
        <KV k="Name" v={draft.contact.name} />
        <KV k="Role" v={draft.contact.role} />
        <KV k="Email" v={draft.contact.email} />
        <KV
          k="Consent"
          v={
            draft.contact.consent
              ? 'Given'
              : "Missing — tick the checkbox in form mode or type 'I consent' in chat."
          }
        />
      </Card>

      {error && (
        <div className="flex items-start gap-2 text-sm text-velocity-red bg-velocity-red/10 border border-velocity-red/30 px-4 py-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 p-5 bg-white/[0.02] border border-white/10 backdrop-blur-sm">
        <div className="text-sm text-white/60">
          {canSubmit
            ? 'All required fields are filled. You can submit when ready.'
            : `Still needed: ${formatMissingRequirements(missing)}.`}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="inline-flex items-center gap-2 px-6 py-3 bg-velocity-red disabled:bg-white/10 disabled:text-white/30 text-white text-xs uppercase tracking-[0.22em] font-medium hover:bg-velocity-red/80 transition-colors"
          style={{ borderRadius: '0' }}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
            </>
          ) : (
            'Submit intake'
          )}
        </button>
      </div>
    </motion.div>
  );
};

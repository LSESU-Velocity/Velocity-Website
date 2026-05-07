import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, ListTodo } from 'lucide-react';
import {
  FINAL_BRIEF_OPEN_QUESTIONS_MAX,
  type FinalBrief,
} from '../../lib/automation-intake/schemas';

interface Props {
  brief: FinalBrief;
}

export const AutomationIntakeComplete: React.FC<Props> = ({ brief }) => {
  const openQuestions = brief.openQuestions.slice(0, FINAL_BRIEF_OPEN_QUESTIONS_MAX);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-5"
    >
      <div className="flex items-start gap-4 p-6 md:p-8 bg-velocity-red/10 border border-velocity-red/40">
        <div className="shrink-0 w-10 h-10 rounded-full bg-velocity-red/20 border border-velocity-red/50 inline-flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-velocity-red" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-velocity-red/80 mb-1">
            Submitted
          </div>
          <h2 className="text-2xl md:text-3xl text-white font-light leading-tight">
            Thanks — Velocity has your intake.
          </h2>
        </div>
      </div>

      <section className="bg-white/[0.02] border border-white/10 backdrop-blur-sm p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-velocity-red/70">
          <Sparkles className="w-3.5 h-3.5" />
          Where we think this could go
        </div>
        <div className="space-y-4">
          {brief.recommendedProjects.map((project, idx) => (
            <div
              key={`${project.title}-${idx}`}
              className="p-4 md:p-5 bg-black/30 border border-white/5"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                <div>
                  <div className="text-white font-medium text-base md:text-lg">{project.title}</div>
                  <div className="text-xs text-white/50 mt-0.5">
                    Target: {project.targetWorkflow}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
                  <span className="px-2 py-0.5 border border-white/10 text-white/60">
                    Feasibility: {project.feasibility}
                  </span>
                  <span className="px-2 py-0.5 border border-white/10 text-white/60">
                    Data: {project.dataSensitivity}
                  </span>
                </div>
              </div>
              <div className="text-sm text-white/80 leading-relaxed space-y-2">
                <div>
                  <span className="text-white/40 mr-1">Problem:</span>
                  {project.problemSummary}
                </div>
                <div>
                  <span className="text-white/40 mr-1">Approach:</span>
                  {project.proposedAutomation}
                </div>
                <div>
                  <span className="text-white/40 mr-1">Expected impact:</span>
                  {project.expectedImpact}
                </div>
                <div>
                  <span className="text-white/40 mr-1">Student fit:</span>
                  {project.studentDeliveryFit}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {openQuestions.length > 0 && (
        <section className="bg-white/[0.02] border border-white/10 backdrop-blur-sm p-6 md:p-8 space-y-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-velocity-red/70">
            <ListTodo className="w-3.5 h-3.5" />
            Things we might follow up on
          </div>
          <ul className="space-y-2 text-sm text-white/80">
            {openQuestions.map((q, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-velocity-red/70 shrink-0">—</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="text-center text-xs text-white/40 pt-2">
        You can close this tab. We'll reach out at the email you provided.
      </div>
    </motion.div>
  );
};

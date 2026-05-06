import React from 'react';
import { motion } from 'framer-motion';
import { Lock, MessageCircle, ListChecks } from 'lucide-react';

export type IntakeViewMode = 'chat' | 'form';

interface Props {
  value: IntakeViewMode;
  onChange: (mode: IntakeViewMode) => void;
  disabled?: boolean;
  chatLocked?: boolean;
  onLockedChatClick?: () => void;
}

export const AutomationIntakeToggle: React.FC<Props> = ({
  value,
  onChange,
  disabled,
  chatLocked = false,
  onLockedChatClick,
}) => {
  return (
    <div
      role="tablist"
      aria-label="Intake view mode"
      className="inline-flex p-1 border border-white/10 bg-black/40 backdrop-blur-sm"
      style={{ borderRadius: '999px' }}
    >
      {(
        [
          { id: 'chat', label: 'Chat with AI', icon: MessageCircle },
          { id: 'form', label: 'Form', icon: ListChecks },
        ] as const
      ).map((option) => {
        const active = value === option.id;
        const locked = option.id === 'chat' && chatLocked;
        const Icon = locked ? Lock : option.icon;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-disabled={disabled ? true : undefined}
            aria-label={locked ? 'Chat with AI, email verification required' : undefined}
            disabled={disabled}
            onClick={() => {
              onChange(option.id);
              if (locked) onLockedChatClick?.();
            }}
            className={[
              'relative inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 text-xs uppercase tracking-[0.16em] font-medium transition-colors md:px-5 md:tracking-[0.2em]',
              active ? 'text-white' : 'text-white/50 hover:text-white/80',
              locked && !active ? 'text-white/45 hover:text-white/75' : '',
              disabled ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
            style={{ borderRadius: '999px' }}
          >
            {active && (
              <motion.span
                layoutId="intakeToggleActive"
                className="absolute inset-0 bg-velocity-red/20 border border-velocity-red/50"
                style={{ borderRadius: '999px' }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-2">
              <Icon className="w-3.5 h-3.5" />
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

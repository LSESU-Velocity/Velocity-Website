/**
 * The Launchpad console cell: a square, hairline-free panel that sits inside a
 * cell grid (`grid gap-px border border-white/10 bg-white/10`) so the grid gap
 * draws the hairlines instead of each cell carrying its own border.
 */
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface WidgetProps {
    /** Mono kicker shown at the top of the cell. */
    title: string;
    icon?: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    /** Seconds of entrance delay, ignored under reduced motion. */
    delay?: number;
    className?: string;
    /** Right-aligned controls in the kicker row (carousel arrows, counters). */
    action?: React.ReactNode;
    visible?: boolean;
    /** Tighter padding for cells that sit three-across. */
    dense?: boolean;
}

export const Widget: React.FC<WidgetProps> = ({
    title,
    icon: Icon,
    children,
    delay = 0,
    className = '',
    action,
    visible = true,
    dense = false,
}) => {
    const prefersReducedMotion = useReducedMotion();
    const still = Boolean(prefersReducedMotion);

    return (
        <motion.div
            initial={still ? false : { opacity: 0, y: 12 }}
            whileInView={visible || still ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: still ? 0 : delay, ease: 'easeOut' }}
            className={`flex h-full min-w-0 flex-col bg-velocity-black ${dense ? 'p-5' : 'p-6'} ${className}`}
        >
            <div className={`flex min-w-0 items-center justify-between gap-3 ${dense ? 'mb-4' : 'mb-5'}`}>
                <p className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
                    {Icon ? <Icon className="h-3 w-3 flex-shrink-0 text-velocity-red" /> : null}
                    <span className="truncate">{title}</span>
                </p>
                {action}
            </div>
            <div className="min-w-0 flex-1">{children}</div>
        </motion.div>
    );
};

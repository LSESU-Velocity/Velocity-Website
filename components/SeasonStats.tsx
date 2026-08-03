import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { seasonStats, type SeasonStat } from '../lib/eventsCatalog';

interface StripStat extends SeasonStat {
  note?: string;
}

const STATS: StripStat[] = [
  seasonStats.packsAnnounced,
  seasonStats.universitiesConfirmed,
  seasonStats.builderPlaces,
  { value: '00', label: 'Coworking agendas', note: 'just show up.' },
];

export const SeasonStats: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative px-6 pb-24 md:pb-32">
      <div className="mx-auto max-w-5xl">
        <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 md:text-[11px]">
          By the numbers <span className="text-velocity-red">2026&ndash;27</span>
        </p>

        <div className="grid grid-cols-2 gap-px border border-white/10 bg-white/10 md:grid-cols-4">
          {STATS.map((stat, index) => (
            <div key={stat.label} className="bg-velocity-black px-5 py-7 md:px-6 md:py-8">
              {/* Shutter: the numeral line is exactly as tall as its window,
                  so a 100% translate parks it fully out of sight. */}
              <div className="h-[2.5rem] overflow-hidden md:h-[3.25rem]">
                <motion.p
                  initial={prefersReducedMotion ? { y: 0 } : { y: '100%' }}
                  whileInView={{ y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{
                    duration: 0.65,
                    delay: prefersReducedMotion ? 0 : index * 0.09,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="font-mono text-[2.1rem] leading-[2.5rem] tracking-tight text-velocity-red md:text-[2.75rem] md:leading-[3.25rem]"
                >
                  {stat.value}
                </motion.p>
              </div>

              <p className="mt-3 font-sans text-[10px] uppercase leading-relaxed tracking-[0.22em] text-zinc-400">
                {stat.label}
              </p>
              {stat.note && (
                <p className="mt-1.5 font-mono text-[10px] tracking-[0.08em] text-zinc-400">
                  {stat.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

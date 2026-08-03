import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { eventsCatalog, weeklyFixture, type VelocityEventPack } from '../lib/eventsCatalog';

/* Node positions on the season spine: the centre of each of the three cards. */
const SPINE_STOPS = [100 / 6, 50, 500 / 6];

export const SeasonProgramme: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const still = Boolean(prefersReducedMotion);

  return (
    <section id="programme" className="relative px-6 pb-28 md:pb-36">
      <div className="mx-auto max-w-5xl">
        <motion.header
          initial={still ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 md:text-[11px]">
            Events <span className="text-velocity-red">2026&ndash;27 season</span>
          </p>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <h2 className="font-sans text-[2rem] font-bold leading-[1.05] tracking-tight text-white sm:text-4xl md:text-5xl">
              On the calendar<span className="text-velocity-red">.</span>
            </h2>
            <Link
              to="/events"
              className="group inline-flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-[0.24em] text-zinc-400 transition-colors hover:text-white"
            >
              Full programme
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:transform-none" />
            </Link>
          </div>
          <p className="mt-5 max-w-xl font-sans text-sm leading-relaxed text-zinc-400">
            Three packs announced so far: the rest of the season lands on the events
            page first.
          </p>
        </motion.header>

        <div className="mt-14">
          {/* Season spine: horizontal above the cards, with a stub dropping
              into each. Goes vertical below md. */}
          <div aria-hidden className="relative mb-8 hidden h-px md:block">
            <div className="absolute inset-0 bg-white/10" />
            <motion.div
              className="absolute inset-0 origin-left bg-velocity-red"
              initial={{ scaleX: still ? 1 : 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
            {SPINE_STOPS.map((left, index) => (
              <React.Fragment key={left}>
                <motion.span
                  className="absolute top-0 h-6 w-px origin-top bg-white/15"
                  style={{ left: `${left}%`, x: '-50%' }}
                  initial={{ scaleY: still ? 1 : 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.4, delay: still ? 0 : 0.4 + index * 0.12 }}
                />
                <motion.span
                  className="absolute top-0 h-1.5 w-1.5 bg-velocity-red shadow-[0_0_12px_rgba(255,31,31,0.6)]"
                  style={{ left: `${left}%`, x: '-50%', y: '-50%' }}
                  initial={{ opacity: still ? 1 : 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.3, delay: still ? 0 : 0.35 + index * 0.12 }}
                />
              </React.Fragment>
            ))}
          </div>

          <div className="relative pl-9 md:pl-0">
            {/* Mobile spine */}
            <div
              aria-hidden
              className="absolute bottom-0 left-[3px] top-0 w-px bg-white/10 md:hidden"
            >
              <motion.div
                className="h-full w-full origin-top bg-gradient-to-b from-velocity-red to-velocity-red/25"
                initial={{ scaleY: still ? 1 : 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 md:grid-cols-3">
              {eventsCatalog.map((event, index) => (
                <ProgrammeCard key={event.id} event={event} index={index} still={still} />
              ))}
            </div>
          </div>
        </div>

        {/* Standing weekly fixture, quieter than the packs, shown once. */}
        <motion.div
          initial={still ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mt-4 flex flex-col gap-4 border border-white/10 border-l-2 border-l-velocity-red bg-velocity-black px-6 py-5 md:flex-row md:items-center"
        >
          <span className="flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] text-velocity-red">
            {weeklyFixture.tag}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-sans text-sm font-bold text-white">{weeklyFixture.title}</p>
            <p className="mt-1 font-sans text-xs leading-relaxed text-zinc-400">
              {weeklyFixture.copy}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

interface ProgrammeCardProps {
  event: VelocityEventPack;
  index: number;
  still: boolean;
}

const ProgrammeCard: React.FC<ProgrammeCardProps> = ({ event, index, still }) => (
  <motion.div
    initial={{ opacity: still ? 1 : 0, y: still ? 0 : 22 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.55, delay: still ? 0 : index * 0.1, ease: 'easeOut' }}
    className="relative"
  >
    <span
      aria-hidden
      className="absolute left-[-37.5px] top-[26px] h-2 w-2 rotate-45 bg-velocity-red shadow-[0_0_12px_rgba(255,31,31,0.55)] md:hidden"
    />
    <Link
      to={`/events?event=${event.id}`}
      className="group relative flex h-full flex-col overflow-hidden bg-velocity-black p-7 transition-colors duration-300 hover:bg-white/[0.02]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,rgba(255,31,31,0.1),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex flex-1 flex-col">
        {/* Date plate */}
        <div className="flex items-end gap-3">
          <span className="font-mono text-[1.75rem] leading-none tracking-tight text-white">
            {event.dayLabel}
          </span>
          <div className="pb-0.5">
            <p className="font-mono text-[10px] uppercase leading-tight tracking-[0.26em] text-velocity-red">
              {event.monthLabel}
            </p>
            <p className="font-mono text-[10px] uppercase leading-tight tracking-[0.26em] text-zinc-400">
              {event.yearLabel}
            </p>
          </div>
        </div>

        <h3 className="mt-7 font-sans text-2xl font-bold uppercase leading-none tracking-tight text-white">
          {event.name} <span className="text-velocity-red">{event.year}</span>
        </h3>
        <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-400">
          {event.kicker}
        </p>
        <p className="mt-4 flex-1 font-sans text-[13px] leading-relaxed text-zinc-400">
          {event.tagline}
        </p>

        {event.provisional && (
          <span className="mt-5 self-start border border-white/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
            Provisional
          </span>
        )}

        <span className="mt-6 inline-flex items-center gap-1.5 border-t border-white/10 pt-5 font-sans text-[11px] uppercase tracking-[0.24em] text-zinc-300 transition-colors group-hover:text-velocity-red">
          View brief
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:transform-none" />
        </span>
      </div>
    </Link>
  </motion.div>
);

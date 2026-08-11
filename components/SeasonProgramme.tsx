import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { eventsCatalog, weeklyFixture, type VelocityEventPack } from '../lib/eventsCatalog';

export const SeasonProgramme: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const still = Boolean(prefersReducedMotion);

  return (
    <section
      id="programme"
      className="relative flex min-h-[100svh] items-center px-6 py-32 md:py-44 lg:py-48"
    >
      <div className="mx-auto w-full max-w-5xl">
        <motion.header
          initial={still ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-center"
        >
          <div className="flex flex-col items-center justify-center gap-5">
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
        </motion.header>

        <div className="mt-14">
          <div>
            <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 md:grid-cols-3">
              {eventsCatalog.map((event, index) => (
                <ProgrammeCard key={event.id} event={event} index={index} still={still} />
              ))}
            </div>
          </div>
        </div>

        {/* Compact weekly fixture, quieter than the event packs. */}
        <motion.div
          initial={still ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mt-3 flex items-center justify-center gap-3 border border-white/10 bg-white/[0.015] px-4 py-3 text-center md:px-5"
        >
          <span aria-hidden className="h-5 w-px flex-shrink-0 bg-velocity-red" />
          <div className="min-w-0 sm:flex sm:items-baseline sm:justify-center sm:gap-3">
            <p className="font-sans text-[13px] font-semibold text-white">
              {weeklyFixture.title}
            </p>
            <p className="mt-0.5 font-sans text-[11px] leading-relaxed text-zinc-400 sm:mt-0">
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
    <Link
      to={`/events?event=${event.id}`}
      className="group relative flex h-full flex-col overflow-hidden bg-velocity-black p-7 text-center transition-colors duration-300 hover:bg-white/[0.02]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,rgba(255,31,31,0.1),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex flex-1 flex-col">
        {/* Date plate */}
        <div className="flex items-end justify-center gap-2.5">
          <span className="font-mono text-xl font-medium leading-none tracking-tight text-zinc-300 transition-colors duration-300 group-hover:text-white">
            {event.dayLabel}
          </span>
          <div className="pb-0.5">
            <p className="font-mono text-[9px] uppercase leading-tight tracking-[0.22em] text-velocity-red/80">
              {event.monthLabel}
            </p>
            <p className="font-mono text-[9px] uppercase leading-tight tracking-[0.22em] text-zinc-600">
              {event.yearLabel}
            </p>
          </div>
        </div>

        <h3 className="mt-7 font-sans text-2xl font-bold uppercase leading-none tracking-tight text-white">
          {event.name} <span className="text-velocity-red">{event.year}</span>
        </h3>
        <p className="mt-3 self-center font-mono text-[9px] uppercase leading-[1.7] tracking-[0.24em] text-zinc-500">
          {event.kicker}
        </p>
        <p className="mx-auto mt-5 max-w-[17rem] flex-1 font-sans text-xs leading-[1.65] text-zinc-400">
          {event.tagline}
        </p>

        {event.provisional && (
          <span className="mt-6 self-center border border-white/10 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.24em] text-zinc-500">
            Provisional
          </span>
        )}

        <span className="mt-7 inline-flex items-center justify-center gap-1.5 border-t border-white/10 pt-5 font-mono text-[9px] uppercase tracking-[0.26em] text-zinc-500 transition-colors group-hover:text-velocity-red">
          View brief
          <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:transform-none" />
        </span>
      </div>
    </Link>
  </motion.div>
);

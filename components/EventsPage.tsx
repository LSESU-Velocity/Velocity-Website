import React, { useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Clock, Mail, MapPin, Users, X } from 'lucide-react';
import {
  eventsCatalog,
  eventsForTerm,
  seasonLabel,
  seasonStats,
  seasonTerms,
  weeklyFixture,
  type TermPlaceholder,
  type VelocityEventPack,
} from '../lib/eventsCatalog';

const CONTACT_EMAIL = 'velocity@lsesu.org';
const INSTAGRAM_URL = 'https://www.instagram.com/lsesu.velocity';

const mailto = (subject: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;

/* Spine geometry: the timeline line sits in the gap between the date
   column (md:7rem) and the cards. Keep these three in sync. */
const SPINE_LEFT = 'left-[5px] md:left-[8.25rem]';
const ROW_GRID = 'md:grid md:grid-cols-[7rem_1fr] md:gap-x-14';
const ROW_PAD = 'pl-9 md:pl-0';

export const EventsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const activeEvent = useMemo(() => {
    const id = searchParams.get('event');
    return eventsCatalog.find((event) => event.id === id) ?? null;
  }, [searchParams]);

  const openEvent = useCallback(
    (id: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('event', id);
        return next;
      });
    },
    [setSearchParams]
  );

  const closeEvent = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('event');
      return next;
    });
  }, [setSearchParams]);

  const stats = [
    seasonStats.packsAnnounced,
    seasonStats.universitiesConfirmed,
    seasonStats.builderPlaces,
    seasonStats.championsCrowned,
  ];

  return (
    <section className="relative z-10 min-h-screen bg-velocity-black px-6 py-32">
      <div className="mx-auto max-w-5xl">
        {/* Masthead */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.35em] text-zinc-500">
            Events <span className="text-velocity-red">{seasonLabel}</span>
          </p>
          <h1 className="max-w-3xl font-sans text-4xl font-bold tracking-tight text-white md:text-6xl">
            The season ahead<span className="text-velocity-red">.</span>
          </h1>
          <p className="mt-5 max-w-2xl font-sans text-sm leading-relaxed text-zinc-400 md:text-base">
            Buildathons, competitions and hands-on workshops across the 2026–27
            academic year, announced here first, from September onwards. Click any
            event to open the full brief.
          </p>
        </motion.header>

        {/* Stat strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="mt-12 grid grid-cols-2 gap-px border border-white/10 bg-white/10 md:grid-cols-4"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="bg-velocity-black px-5 py-5">
              <p className="font-mono text-2xl text-velocity-red md:text-3xl">{stat.value}</p>
              <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Standing weekly fixture, deliberately quieter than the packs,
            shown once instead of repeating down the timeline. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: 'easeOut' }}
          className="mt-4 flex flex-col gap-4 border border-white/10 border-l-2 border-l-velocity-red bg-velocity-black/40 px-6 py-5 md:flex-row md:items-center"
        >
          <span className="flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] text-velocity-red">
            {weeklyFixture.tag}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-sans text-sm font-bold text-white">{weeklyFixture.title}</p>
            <p className="mt-1 font-sans text-xs leading-relaxed text-zinc-500">
              {weeklyFixture.copy}
            </p>
          </div>
          <a
            href={weeklyFixture.linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-shrink-0 items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.24em] text-zinc-400 transition-colors hover:text-white"
          >
            {weeklyFixture.linkLabel}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </motion.div>

        {/* Timeline */}
        <div className="relative mt-20">
          {/* Spine */}
          <div
            aria-hidden
            className={`absolute bottom-8 top-0 w-px bg-gradient-to-b from-velocity-red/60 via-white/10 to-transparent ${SPINE_LEFT}`}
          />

          {/* Season origin marker */}
          <div className={`relative pb-14 ${ROW_GRID} ${ROW_PAD}`}>
            <SpineNode variant="origin" />
            <div className="hidden md:block" />
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">
              Season opens <span className="text-zinc-300">· September 2026</span>
            </p>
          </div>

          {seasonTerms.map((term) => {
            const termEvents = eventsForTerm(term.id);
            return (
              <div key={term.id} className="pb-4">
                {/* Term header */}
                <div className={`relative pb-10 ${ROW_GRID} ${ROW_PAD}`}>
                  <div className="hidden pt-0.5 text-right font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600 md:block">
                    {term.index}
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-4">
                    <h2 className="font-sans text-sm font-bold uppercase tracking-[0.3em] text-white">
                      {term.name}
                    </h2>
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                      {term.range}
                    </span>
                  </div>
                </div>

                {termEvents.map((event) => (
                  <TimelineEventRow
                    key={event.id}
                    event={event}
                    onOpen={() => openEvent(event.id)}
                  />
                ))}

                {(term.placeholders ?? []).map((placeholder) => (
                  <TimelinePlaceholderRow key={placeholder.id} placeholder={placeholder} />
                ))}
              </div>
            );
          })}
        </div>

        {/* More packs strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative mt-16 overflow-hidden border border-white/10 bg-velocity-black/40"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(216,45,45,0.1),transparent_55%)]" />
          <div className="relative flex flex-col gap-6 px-8 py-9 md:flex-row md:items-center md:justify-between md:px-10">
            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.3em] text-velocity-red">
                More packs coming soon
              </p>
              <p className="max-w-xl font-sans text-sm leading-relaxed text-zinc-400">
                The 2026–27 programme is still being written. New event packs land on
                this timeline first, before anywhere else.
              </p>
            </div>
            <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
              <a
                href={mailto('Event alerts: Velocity 2026–27 season')}
                className="inline-flex items-center gap-2 bg-velocity-red px-5 py-3 font-sans text-xs uppercase tracking-[0.24em] text-white transition-colors hover:bg-velocity-red/90"
              >
                <Mail className="h-4 w-4" />
                Get event alerts
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/15 px-5 py-3 font-sans text-xs uppercase tracking-[0.24em] text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
              >
                Follow announcements
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Event brief overlay: entry animation only; unmount must be
          instant so the fixed layer can never linger over the page. */}
      {activeEvent && <EventBrief event={activeEvent} onClose={closeEvent} />}
    </section>
  );
};

/* ---------------------------------- Spine ---------------------------------- */

const SpineNode: React.FC<{ variant: 'origin' | 'event' | 'ghost' }> = ({ variant }) => (
  <span
    aria-hidden
    className={`absolute top-[7px] h-2 w-2 -translate-x-1/2 rotate-45 ${SPINE_LEFT} ${
      variant === 'event'
        ? 'bg-velocity-red shadow-[0_0_12px_rgba(255,31,31,0.55)]'
        : variant === 'origin'
          ? 'bg-velocity-red'
          : 'border border-white/25 bg-velocity-black'
    }`}
  />
);

interface DatePlateProps {
  top: string;
  main: string;
  bottom: string;
  ghost?: boolean;
}

const DatePlate: React.FC<DatePlateProps> = ({ top, main, bottom, ghost }) => (
  <div className="hidden select-none flex-col items-end text-right md:flex">
    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">{top}</span>
    <span
      className={`mt-1 font-mono text-2xl leading-none tracking-tight ${
        ghost ? 'text-zinc-600' : 'text-white'
      }`}
    >
      {main}
    </span>
    <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-600">
      {bottom}
    </span>
  </div>
);

/* ------------------------------- Timeline rows ------------------------------ */

const TimelineEventRow: React.FC<{ event: VelocityEventPack; onOpen: () => void }> = ({
  event,
  onOpen,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.55, ease: 'easeOut' }}
    className={`relative pb-14 ${ROW_GRID} ${ROW_PAD}`}
  >
    <SpineNode variant="event" />
    <DatePlate top={event.monthLabel} main={event.dayLabel} bottom={event.yearLabel} />

    <article
      onClick={onOpen}
      className="group relative cursor-pointer overflow-hidden border border-white/10 bg-velocity-black/50 transition-colors duration-300 hover:border-velocity-red/40"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,rgba(255,31,31,0.09),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative p-7 md:p-9">
        <div className="mb-6 flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-2 border border-velocity-red/40 bg-velocity-black/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-velocity-red">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-velocity-red" />
            {event.registration.statusLabel}
          </span>
          <span className="inline-flex items-center border border-white/10 bg-velocity-black/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
            {event.badge}
          </span>
          <span className="inline-flex items-center border border-white/10 bg-velocity-black/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400 md:hidden">
            {event.dateSummary}
          </span>
        </div>

        <h3 className="font-sans text-3xl font-bold uppercase tracking-tight text-white md:text-[2.6rem] md:leading-none">
          {event.name} <span className="text-velocity-red">{event.year}</span>
        </h3>
        <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-zinc-400 md:text-base">
          {event.tagline}
        </p>

        <div className="mt-6 flex flex-wrap gap-x-7 gap-y-2.5 font-sans text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-velocity-red" />
            {event.locationShort}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-velocity-red" />
            {event.durationShort}
          </span>
          <span className="inline-flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-velocity-red" />
            {event.eligibilityShort}
          </span>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            {event.cardStats.join('  ·  ')}
          </p>
          <span className="inline-flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-[0.24em] text-zinc-300 transition-colors group-hover:text-velocity-red">
            View brief
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  </motion.div>
);

const TimelinePlaceholderRow: React.FC<{ placeholder: TermPlaceholder }> = ({ placeholder }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.55, ease: 'easeOut' }}
    className={`relative pb-14 ${ROW_GRID} ${ROW_PAD}`}
  >
    <SpineNode variant="ghost" />
    <DatePlate
      top={placeholder.plateTop}
      main={placeholder.plateMain}
      bottom={placeholder.plateBottom}
      ghost
    />

    <div className="border border-dashed border-white/15 px-7 py-7 transition-colors duration-300 hover:border-white/25 md:px-8">
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          Announcing soon
        </span>
        <span className="inline-flex items-center border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600 md:hidden">
          {placeholder.dateSummary}
        </span>
      </div>
      <h3 className="font-sans text-lg font-bold text-zinc-300">{placeholder.title}</h3>
      <p className="mt-2 max-w-xl font-sans text-sm leading-relaxed text-zinc-500">
        {placeholder.copy}
      </p>
    </div>
  </motion.div>
);

/* -------------------------------- Event brief ------------------------------- */

const EventBrief: React.FC<{ event: VelocityEventPack; onClose: () => void }> = ({
  event,
  onClose,
}) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[70] overflow-y-auto bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="mx-auto my-6 w-[min(100%-1.5rem,64rem)] border border-white/10 bg-velocity-black md:my-14"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky brief bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-velocity-black/95 px-6 py-4 backdrop-blur-md md:px-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
            Event brief <span className="text-velocity-red">{event.no}</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close event brief"
            className="border border-white/10 p-2 text-zinc-400 transition-colors hover:border-white/25 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Masthead */}
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(216,45,45,0.16),transparent_58%)] px-6 py-10 md:px-10 md:py-14">
          <div className="mb-6 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 border border-velocity-red/40 bg-velocity-black/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-velocity-red">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-velocity-red" />
              {event.registration.statusLabel}
            </span>
            <span className="inline-flex items-center border border-white/10 bg-velocity-black/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
              {event.badge}
            </span>
          </div>

          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">
            {event.kicker}
          </p>
          <h2 className="font-sans text-4xl font-bold uppercase tracking-tight text-white md:text-6xl">
            {event.name} <span className="text-velocity-red">{event.year}</span>
          </h2>
          <p className="mt-4 max-w-2xl font-sans text-base leading-relaxed text-zinc-300 md:text-lg">
            {event.tagline}
          </p>

          {/* Fact grid */}
          <div className="mt-9 grid grid-cols-2 gap-px border border-white/10 bg-white/10 md:grid-cols-3">
            {event.facts.map((fact) => (
              <div key={fact.label} className="bg-velocity-black px-4 py-3.5">
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-500">
                  {fact.label}
                </p>
                <p className="mt-1.5 font-sans text-[13px] leading-snug text-white">{fact.value}</p>
              </div>
            ))}
          </div>
          {event.provisional && (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">
              Dates provisional, details being finalised
            </p>
          )}
        </div>

        {/* Body */}
        <div className="grid gap-12 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-[1fr_19rem]">
          {/* Main column */}
          <div className="min-w-0 space-y-12">
            <BriefSection title="About">
              <div className="space-y-4">
                {event.about.map((paragraph, idx) => (
                  <p key={idx} className="font-sans text-sm leading-relaxed text-zinc-400">
                    {paragraph}
                  </p>
                ))}
              </div>
            </BriefSection>

            <BriefSection title={event.scheduleTitle}>
              <div className="space-y-px border border-white/10 bg-white/10">
                {event.schedule.map((day) => (
                  <div
                    key={day.day}
                    className="grid grid-cols-[4.5rem_1fr] gap-4 bg-velocity-black px-5 py-4 md:grid-cols-[5.5rem_1fr]"
                  >
                    <span className="pt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-velocity-red">
                      {day.day}
                    </span>
                    <div>
                      <p className="font-sans text-sm font-bold text-white">{day.title}</p>
                      <p className="mt-1 font-sans text-[13px] leading-relaxed text-zinc-500">
                        {day.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {event.scheduleNote && <FootNote>{event.scheduleNote}</FootNote>}
            </BriefSection>

            {(event.tracks || event.tracksNote) && (
              <BriefSection title="Tracks">
                {event.tracks && (
                  <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
                    {event.tracks.map((track) => (
                      <div
                        key={track.no}
                        className={`bg-velocity-black px-5 py-4 ${
                          event.tracks!.length % 2 === 1 &&
                          track.no === event.tracks![event.tracks!.length - 1].no
                            ? 'sm:col-span-2'
                            : ''
                        }`}
                      >
                        <p className="font-mono text-[10px] tracking-[0.25em] text-zinc-600">
                          Track {track.no}
                        </p>
                        <p className="mt-1.5 font-sans text-sm font-bold text-white">
                          {track.title}
                        </p>
                        <p className="mt-1 font-sans text-[13px] leading-relaxed text-zinc-500">
                          {track.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {event.tracksNote && <FootNote>{event.tracksNote}</FootNote>}
              </BriefSection>
            )}

            {event.rubric && (
              <BriefSection title="Judging · scored out of 100">
                <div className="space-y-3.5">
                  {event.rubric.map((row) => (
                    <div key={row.criterion}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-4">
                        <span className="font-sans text-[13px] text-zinc-300">{row.criterion}</span>
                        <span className="font-mono text-[11px] text-zinc-500">
                          {row.points}
                          <span className="text-zinc-700"> / 100</span>
                        </span>
                      </div>
                      <div className="h-[3px] w-full bg-white/[0.07]">
                        <div
                          className="h-full bg-velocity-red/80"
                          style={{ width: `${(row.points / 25) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {event.judgingNote && <FootNote>{event.judgingNote}</FootNote>}
                {event.deliverables && (
                  <div className="mt-5 border-l-2 border-velocity-red bg-white/[0.03] px-5 py-4">
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-velocity-red">
                      Submissions
                    </p>
                    <p className="font-sans text-[13px] leading-relaxed text-zinc-400">
                      {event.deliverables}
                    </p>
                  </div>
                )}
              </BriefSection>
            )}

            {event.prizes && (
              <BriefSection title="Prizes">
                <div className="space-y-px border border-white/10 bg-white/10">
                  {event.prizes.map((prize) => (
                    <div
                      key={prize.title}
                      className="grid grid-cols-[4.5rem_1fr] gap-4 bg-velocity-black px-5 py-4 md:grid-cols-[5.5rem_1fr]"
                    >
                      <span className="pt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-velocity-red">
                        {prize.tag}
                      </span>
                      <div>
                        <p className="font-sans text-sm font-bold text-white">{prize.title}</p>
                        <p className="mt-1 font-sans text-[13px] leading-relaxed text-zinc-500">
                          {prize.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {event.prizesNote && <FootNote>{event.prizesNote}</FootNote>}
              </BriefSection>
            )}

            <BriefSection title="Who it's for">
              <div className="flex flex-wrap gap-2">
                {event.audience.map((tag) => (
                  <span
                    key={tag}
                    className="border border-white/10 bg-white/[0.03] px-3 py-1.5 font-sans text-[11px] uppercase tracking-[0.16em] text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </BriefSection>
          </div>

          {/* Rail */}
          <aside className="space-y-6 self-start lg:sticky lg:top-20">
            <RegisterCard event={event} />

            <div className="border border-white/10 bg-velocity-black/60">
              <p className="border-b border-white/10 px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
                Key dates
              </p>
              <div className="px-5 py-4">
                {event.keyDates.map((keyDate) => (
                  <div
                    key={`${keyDate.when}-${keyDate.what}`}
                    className="grid grid-cols-[5.5rem_1fr] gap-3 border-b border-white/5 py-2.5 last:border-b-0"
                  >
                    <span className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-velocity-red">
                      {keyDate.when}
                    </span>
                    <span className="font-sans text-xs leading-relaxed text-zinc-400">
                      {keyDate.what}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-white/10 bg-velocity-black/60 px-5 py-5">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
                Partner with us
              </p>
              <p className="font-sans text-xs leading-relaxed text-zinc-500">
                Partnerships are open for this event: funding, speakers, workshops,
                prizes and in-kind support. Sponsor brief available on request.
              </p>
              <a
                href={mailto(`Partnering on ${event.name} ${event.year}`)}
                className="mt-4 inline-flex items-center gap-2 border border-white/15 px-4 py-2.5 font-sans text-[10px] uppercase tracking-[0.24em] text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
              >
                <Mail className="h-3.5 w-3.5" />
                Get in touch
              </a>
            </div>
          </aside>
        </div>
      </motion.div>
    </motion.div>
  );
};

const BriefSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section>
    <div className="mb-5 flex items-center gap-4">
      <h3 className="flex-shrink-0 font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">
        {title}
      </h3>
      <div className="h-px flex-1 bg-white/10" />
    </div>
    {children}
  </section>
);

const FootNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mt-4 font-sans text-xs leading-relaxed text-zinc-600">{children}</p>
);

/* ------------------------------ Luma registration --------------------------- */

const RegisterCard: React.FC<{ event: VelocityEventPack }> = ({ event }) => {
  const { lumaEventId, lumaUrl, statusLabel, opensDetail } = event.registration;

  return (
    <div className="border border-velocity-red/30 bg-velocity-black/60">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white">Register</p>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-velocity-red" />
      </div>
      <div className="border-b border-white/10 bg-velocity-red/[0.06] px-5 py-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-velocity-red">
          {statusLabel}
        </p>
      </div>

      {lumaEventId ? (
        <div>
          <iframe
            src={`https://lu.ma/embed/event/${lumaEventId}/simple`}
            title={`Register for ${event.name} ${event.year}`}
            className="h-[26rem] w-full border-0 bg-white/[0.02]"
            allow="fullscreen; payment"
          />
          <p className="border-t border-white/10 px-5 py-3 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600">
            Secure checkout · powered by Luma
          </p>
        </div>
      ) : (
        <div className="px-5 py-5">
          <p className="font-sans text-xs leading-relaxed text-zinc-400">{opensDetail}</p>
          <div className="mt-4 flex flex-col gap-2.5">
            <a
              href={mailto(`Notify me: ${event.name} ${event.year}`)}
              className="inline-flex items-center justify-center gap-2 bg-velocity-red px-4 py-3 font-sans text-[10px] uppercase tracking-[0.24em] text-white transition-colors hover:bg-velocity-red/90"
            >
              <Mail className="h-3.5 w-3.5" />
              Notify me when live
            </a>
            {lumaUrl && (
              <a
                href={lumaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-white/15 px-4 py-3 font-sans text-[10px] uppercase tracking-[0.24em] text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
              >
                View on Luma
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

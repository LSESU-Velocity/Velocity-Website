import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Mic2,
  Sparkles,
  Trophy,
  Users,
  X,
} from 'lucide-react';

type EventStatus = 'upcoming' | 'past';

interface VelocityEvent {
  id: string;
  title: string;
  tagline: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'Workshop' | 'Speaker Session' | 'Hackathon' | 'Social' | 'Demo Day';
  status: EventStatus;
  image: string;
  rsvpUrl?: string;
  attendees?: number;
  speakers?: { name: string; role: string }[];
  highlights?: string[];
  recap?: string;
}

const events: VelocityEvent[] = [
  {
    id: 'sprint-demo-day-2026',
    title: 'Spring Demo Day 2026',
    tagline: 'Ten student teams. Ten live products. One night.',
    description:
      "Our flagship demo night where Launchpad teams ship their MVPs in front of founders, investors, and peers. Expect live walkthroughs, quick-fire Q&A, and a room full of people who build. Pitches are strictly three minutes - the countdown is visible on the screen.",
    date: 'May 8, 2026',
    time: '6:30 PM - 9:30 PM',
    location: 'Marshall Building, LSE',
    type: 'Demo Day',
    status: 'upcoming',
    image:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80',
    rsvpUrl: 'https://www.lsesu.com/communities/societies/group/Velocity/',
    speakers: [
      { name: 'Maya Chen', role: 'Partner, Seedcamp' },
      { name: 'Rohan Patel', role: 'Founder, Flint AI' },
      { name: 'Priya Desai', role: 'Director, LSE Generate' },
    ],
    highlights: [
      '10 live product demos from Launchpad cohort',
      'Audience vote for Build of the Night',
      'Angel office hours after the showcase',
    ],
  },
  {
    id: 'vibe-coding-workshop-april',
    title: 'Vibe Coding Workshop: Ship in 90 Minutes',
    tagline: 'Hands-on. Laptops open. Prompts ready.',
    description:
      'Bring an idea and leave with a working demo. We pair you with a Velocity builder and walk through the vibe coding loop - prompt, generate, test, refine. Food and caffeine are on us.',
    date: 'April 24, 2026',
    time: '5:00 PM - 7:30 PM',
    location: 'Centre Building, CBG.2.02',
    type: 'Workshop',
    status: 'upcoming',
    image:
      'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&w=1600&q=80',
    rsvpUrl: 'https://www.lsesu.com/communities/societies/group/Velocity/',
    highlights: [
      'Walkthrough of Cursor, Lovable, and Claude workflows',
      '1:1 pairing with a Velocity builder',
      'Demo your MVP at the end of the night',
    ],
  },
  {
    id: 'founders-fireside-may',
    title: 'Founders Fireside: From Dorm Room to Series A',
    tagline: 'Three founders. Zero filters.',
    description:
      'A candid conversation with founders who built from student bedrooms. Expect honest answers on co-founder drama, burnout, cold emails that worked, and the unit economics nobody posts on LinkedIn.',
    date: 'May 21, 2026',
    time: '7:00 PM - 8:30 PM',
    location: 'Old Building, OLD 3.21',
    type: 'Speaker Session',
    status: 'upcoming',
    image:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80',
    rsvpUrl: 'https://www.lsesu.com/communities/societies/group/Velocity/',
    speakers: [
      { name: 'Ade Okonkwo', role: 'Co-founder, Relay (YC W23)' },
      { name: 'Hana Yoshida', role: 'CEO, Orbit Labs' },
    ],
  },
  {
    id: 'lent-hackathon-2026',
    title: 'Lent Term Hackathon',
    tagline: '48 hours. 60 builders. One theme: agents that do real work.',
    description:
      'Our biggest build weekend of the year. Teams formed on Friday evening, judging on Sunday night. Winners took home credits from our partner stack and a fast-track interview with Launchpad.',
    date: 'Feb 14-16, 2026',
    time: '48-hour build',
    location: 'Marshall Building, LSE',
    type: 'Hackathon',
    status: 'past',
    image:
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1600&q=80',
    attendees: 62,
    highlights: [
      '18 teams shipped working prototypes',
      'Winner: Ledger, an AI-first study-group scheduler',
      'Runner-up: Parser, a receipt-to-expense-report agent',
    ],
    recap:
      "Lent Hackathon was our most-attended build weekend yet. Sixty-two students, eighteen teams, and an after-hours room that didn't empty before 2am. The winning team, Ledger, shipped a group-scheduling agent that reads everyone's calendar and proposes times in chat - it's already being used by two Velocity project groups.",
  },
  {
    id: 'welcome-week-mixer',
    title: 'Welcome Week Mixer',
    tagline: 'Freshers, founders, and free pizza.',
    description:
      'Our start-of-term mixer for new members. We introduced the Launchpad programme, the build nights calendar, and paired first-years with upper-year mentors over slices and sparkling water.',
    date: 'Oct 3, 2025',
    time: '6:00 PM - 9:00 PM',
    location: 'Saw Swee Hock, Venue',
    type: 'Social',
    status: 'past',
    image:
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
    attendees: 180,
    recap:
      'Kicked off the year with 180 new faces and a lot of half-finished elevator pitches. The mentorship pairings from this mixer became the backbone of this year\'s project squads.',
  },
  {
    id: 'a16z-partner-talk',
    title: 'Fireside with Andreessen Horowitz',
    tagline: 'What a16z looks for in student founders.',
    description:
      'A closed-door session with a partner from a16z on what separates a student side project from a fundable company. Members asked questions for 90 minutes. The answers were unusually direct.',
    date: 'Nov 18, 2025',
    time: '7:00 PM - 8:30 PM',
    location: 'Centre Building, CBG.1.04',
    type: 'Speaker Session',
    status: 'past',
    image:
      'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80',
    attendees: 95,
    speakers: [{ name: 'Jordan Ellis', role: 'Partner, Andreessen Horowitz' }],
    recap:
      'Standing room only. The headline takeaway: ship something real before you pitch anyone - even a bad prototype tells an investor more than a good deck.',
  },
  {
    id: 'winter-demo-night',
    title: 'Winter Demo Night',
    tagline: 'Six teams. Six demos. One judge panel.',
    description:
      'End-of-Michaelmas showcase where our autumn cohort demoed what they had built. Products ranged from a social-accountability app to an AI-first essay feedback tool used by three LSE classes.',
    date: 'Dec 6, 2025',
    time: '6:00 PM - 9:00 PM',
    location: 'Marshall Building, LSE',
    type: 'Demo Day',
    status: 'past',
    image:
      'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80',
    attendees: 140,
    highlights: [
      'Six live demos, judged by LSE Generate and two alumni founders',
      'Build of the Night: Margin, an AI feedback tool for essays',
    ],
  },
  {
    id: 'vibe-coding-101',
    title: 'Vibe Coding 101',
    tagline: 'Our first-ever workshop. Where it all started.',
    description:
      'The workshop that started the year. We walked 40 students through their first prompt-to-product loop using Cursor and Claude. Half of the room had never written code before.',
    date: 'Oct 17, 2025',
    time: '5:30 PM - 8:00 PM',
    location: 'Old Building, OLD 3.21',
    type: 'Workshop',
    status: 'past',
    image:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    attendees: 42,
    recap:
      'Forty students, three hours, and a new habit. Several of the builds started that night made it into Launchpad applications.',
  },
];

const statusCopy: Record<EventStatus, { label: string; color: string }> = {
  upcoming: { label: 'Upcoming', color: 'text-velocity-red' },
  past: { label: 'Past', color: 'text-zinc-500' },
};

const typeIcon = (type: VelocityEvent['type']) => {
  switch (type) {
    case 'Hackathon':
      return Trophy;
    case 'Speaker Session':
      return Mic2;
    case 'Workshop':
      return Sparkles;
    case 'Social':
      return Users;
    case 'Demo Day':
    default:
      return CheckCircle2;
  }
};

export const Events: React.FC = () => {
  const [activeEvent, setActiveEvent] = useState<VelocityEvent | null>(null);
  const [filter, setFilter] = useState<'all' | EventStatus>('all');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { upcoming, past, feature } = useMemo(() => {
    const up = events.filter((e) => e.status === 'upcoming');
    const pa = events.filter((e) => e.status === 'past');
    return { upcoming: up, past: pa, feature: up[0] ?? null };
  }, []);

  const stats = useMemo(
    () => ({
      hosted: events.filter((e) => e.status === 'past').length,
      attendees: events
        .filter((e) => e.status === 'past')
        .reduce((sum, e) => sum + (e.attendees ?? 0), 0),
      speakers: events
        .filter((e) => e.status === 'past')
        .reduce((sum, e) => sum + (e.speakers?.length ?? 0), 0),
    }),
    []
  );

  const visibleUpcoming = filter === 'past' ? [] : upcoming.filter((e) => e.id !== feature?.id);
  const visiblePast = filter === 'upcoming' ? [] : past;

  return (
    <section className="relative z-10 min-h-screen bg-velocity-black px-6 py-32">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto mb-14 max-w-3xl md:text-center">
          <div className="mb-4 inline-flex items-center gap-2 border border-white/10 bg-velocity-black/40 px-3 py-1 font-sans text-xs uppercase tracking-widest text-zinc-400">
            <Calendar className="h-3.5 w-3.5 text-velocity-red" />
            What's on at Velocity
          </div>
          <h1 className="mb-3 font-sans text-3xl font-bold tracking-tight text-white md:text-5xl">
            <span className="text-velocity-red">Events</span>
          </h1>
          <p className="font-sans text-sm leading-relaxed text-gray-500 md:text-base">
            Workshops, hackathons, demo nights, and speaker sessions - where the LSE
            builder community ships together.
          </p>
        </div>

        {/* Featured next event */}
        {feature && (
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setActiveEvent(feature)}
            className="group relative mb-16 grid cursor-pointer grid-cols-1 overflow-hidden border border-white/10 bg-velocity-black/40 transition-colors duration-300 hover:border-velocity-red/40 lg:grid-cols-[1.2fr_1fr]"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden lg:aspect-auto">
              <img
                src={feature.image}
                alt={feature.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-velocity-black via-velocity-black/30 to-transparent lg:bg-gradient-to-r" />
              <div className="absolute left-5 top-5 flex items-center gap-2 border border-velocity-red/40 bg-velocity-black/70 px-3 py-1.5 font-sans text-[11px] uppercase tracking-widest text-velocity-red backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-velocity-red" />
                Next up
              </div>
            </div>

            <div className="flex flex-col justify-between gap-6 p-8 md:p-10">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-3 font-sans text-xs uppercase tracking-widest text-zinc-500">
                  <span className="text-velocity-red">{feature.type}</span>
                  <span className="text-zinc-700">•</span>
                  <span>{feature.date}</span>
                </div>
                <h2 className="mb-3 font-sans text-2xl font-bold leading-tight text-white md:text-3xl">
                  {feature.title}
                </h2>
                <p className="mb-6 font-sans text-sm italic leading-relaxed text-zinc-400">
                  {feature.tagline}
                </p>
                <div className="grid grid-cols-1 gap-3 font-sans text-sm text-zinc-400 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-velocity-red" />
                    {feature.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-velocity-red" />
                    {feature.location}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {feature.rsvpUrl && (
                  <a
                    href={feature.rsvpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 bg-velocity-red px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-white transition-colors hover:bg-velocity-red/90"
                  >
                    RSVP
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveEvent(feature);
                  }}
                  className="inline-flex items-center gap-2 border border-white/20 px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-zinc-300 transition-colors hover:border-white/40 hover:text-white"
                >
                  Event details
                </button>
              </div>
            </div>
          </motion.article>
        )}

        {/* Filter */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 border border-white/10 bg-velocity-black/40 p-1">
            {(['all', 'upcoming', 'past'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`relative px-4 py-1.5 font-sans text-xs uppercase tracking-widest transition-colors ${
                  filter === key ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {filter === key && (
                  <motion.span
                    layoutId="eventFilter"
                    className="absolute inset-0 bg-velocity-red/15 ring-1 ring-inset ring-velocity-red/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{key === 'all' ? 'All' : key === 'upcoming' ? 'Upcoming' : 'Past'}</span>
              </button>
            ))}
          </div>
          <div className="hidden font-sans text-xs uppercase tracking-widest text-zinc-600 md:block">
            {upcoming.length} upcoming · {past.length} past
          </div>
        </div>

        {/* Upcoming grid */}
        {visibleUpcoming.length > 0 && (
          <div className="mb-16">
            <h3 className="mb-5 font-sans text-xs uppercase tracking-widest text-zinc-500">
              Coming up
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visibleUpcoming.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => setActiveEvent(event)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stats strip */}
        {filter !== 'upcoming' && (
          <div className="mb-16 grid grid-cols-1 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3">
            <StatCell value={stats.hosted.toString()} label="Events hosted this year" />
            <StatCell value={stats.attendees.toString()} label="Builders through the door" />
            <StatCell value={stats.speakers.toString()} label="Speakers, founders, investors" />
          </div>
        )}

        {/* Past grid */}
        {visiblePast.length > 0 && (
          <div>
            <h3 className="mb-5 font-sans text-xs uppercase tracking-widest text-zinc-500">
              Archive
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visiblePast.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => setActiveEvent(event)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {activeEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-28 backdrop-blur-sm"
            onClick={() => setActiveEvent(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="max-h-[calc(100vh-8rem)] w-full max-w-3xl overflow-y-auto border border-white/10 bg-velocity-black"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-[16/8] w-full overflow-hidden">
                <img
                  src={activeEvent.image}
                  alt={activeEvent.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-velocity-black via-velocity-black/40 to-transparent" />
                <div
                  className={`absolute left-5 top-5 inline-flex items-center gap-2 border px-3 py-1.5 font-sans text-[11px] uppercase tracking-widest backdrop-blur-sm ${
                    activeEvent.status === 'upcoming'
                      ? 'border-velocity-red/40 bg-velocity-black/70 text-velocity-red'
                      : 'border-white/20 bg-velocity-black/70 text-zinc-300'
                  }`}
                >
                  {activeEvent.status === 'upcoming' ? (
                    <>
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-velocity-red" />
                      Upcoming
                    </>
                  ) : (
                    <>Past event</>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveEvent(null)}
                  className="absolute right-4 top-4 rounded bg-velocity-black/70 p-2 text-zinc-300 backdrop-blur-sm transition-colors hover:bg-velocity-black hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-8">
                <div className="mb-3 flex flex-wrap items-center gap-3 font-sans text-xs uppercase tracking-widest text-zinc-500">
                  <span className="text-velocity-red">{activeEvent.type}</span>
                  <span className="text-zinc-700">•</span>
                  <span>{activeEvent.date}</span>
                </div>
                <h2 className="mb-2 font-sans text-3xl font-bold text-white">
                  {activeEvent.title}
                </h2>
                <p className="mb-6 font-sans text-sm italic leading-relaxed text-zinc-400">
                  {activeEvent.tagline}
                </p>

                <div className="mb-6 grid grid-cols-1 gap-3 border-y border-white/10 py-5 font-sans text-sm text-zinc-300 sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-velocity-red" />
                    {activeEvent.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-velocity-red" />
                    {activeEvent.location}
                  </div>
                  {typeof activeEvent.attendees === 'number' && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-velocity-red" />
                      {activeEvent.attendees} attended
                    </div>
                  )}
                </div>

                <p className="mb-6 font-sans text-sm leading-relaxed text-zinc-400">
                  {activeEvent.description}
                </p>

                {activeEvent.speakers && activeEvent.speakers.length > 0 && (
                  <div className="mb-6">
                    <h4 className="mb-3 font-sans text-xs uppercase tracking-widest text-zinc-500">
                      Speakers
                    </h4>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {activeEvent.speakers.map((speaker) => (
                        <div
                          key={speaker.name}
                          className="border border-white/10 bg-white/5 px-4 py-3"
                        >
                          <p className="font-sans text-sm text-white">{speaker.name}</p>
                          <p className="font-sans text-xs text-zinc-500">{speaker.role}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeEvent.highlights && activeEvent.highlights.length > 0 && (
                  <div className="mb-6">
                    <h4 className="mb-3 font-sans text-xs uppercase tracking-widest text-zinc-500">
                      {activeEvent.status === 'upcoming' ? 'What to expect' : 'Highlights'}
                    </h4>
                    <ul className="space-y-2">
                      {activeEvent.highlights.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 font-sans text-sm leading-relaxed text-zinc-400"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 bg-velocity-red" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeEvent.recap && (
                  <div className="mb-6 border-l-2 border-velocity-red bg-white/5 px-5 py-4">
                    <p className="mb-1 font-sans text-[11px] uppercase tracking-widest text-velocity-red">
                      Recap
                    </p>
                    <p className="font-sans text-sm leading-relaxed text-zinc-300">
                      {activeEvent.recap}
                    </p>
                  </div>
                )}

                {activeEvent.rsvpUrl && activeEvent.status === 'upcoming' && (
                  <a
                    href={activeEvent.rsvpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-velocity-red px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-white transition-colors hover:bg-velocity-red/90"
                  >
                    RSVP on LSESU
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

interface EventCardProps {
  event: VelocityEvent;
  onClick: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  const Icon = typeIcon(event.type);
  const isUpcoming = event.status === 'upcoming';

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      onClick={onClick}
      className="group flex cursor-pointer flex-col overflow-hidden border border-white/10 bg-velocity-black/40 transition-colors duration-300 hover:border-white/25"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-velocity-black/80 via-transparent to-transparent" />
        <div
          className={`absolute left-4 top-4 inline-flex items-center gap-1.5 border px-2.5 py-1 font-sans text-[10px] uppercase tracking-widest backdrop-blur-sm ${
            isUpcoming
              ? 'border-velocity-red/40 bg-velocity-black/70 text-velocity-red'
              : 'border-white/20 bg-velocity-black/70 text-zinc-300'
          }`}
        >
          <Icon className="h-3 w-3" />
          {event.type}
        </div>
        <div className="absolute bottom-4 left-4 font-sans text-xs uppercase tracking-widest text-white">
          {event.date}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h4 className="mb-2 font-sans font-bold text-white transition-colors group-hover:text-velocity-red">
          {event.title}
        </h4>
        <p className="mb-4 flex-1 font-sans text-sm leading-relaxed text-zinc-500">
          {event.tagline}
        </p>
        <div className="flex items-center justify-between font-sans text-[11px] uppercase tracking-widest text-zinc-500">
          <span className={statusCopy[event.status].color}>
            {statusCopy[event.status].label}
          </span>
          <span className="inline-flex items-center gap-1 transition-colors group-hover:text-white">
            {isUpcoming ? 'RSVP' : 'Read recap'}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </motion.article>
  );
};

interface StatCellProps {
  value: string;
  label: string;
}

const StatCell: React.FC<StatCellProps> = ({ value, label }) => (
  <div className="bg-velocity-black/60 px-6 py-8 text-center">
    <p className="mb-2 font-sans text-4xl font-bold text-white md:text-5xl">
      <span className="text-velocity-red">{value}</span>
    </p>
    <p className="font-sans text-xs uppercase tracking-widest text-zinc-500">{label}</p>
  </div>
);

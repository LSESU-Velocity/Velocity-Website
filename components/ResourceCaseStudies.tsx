import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  Calendar,
  Compass,
  ExternalLink,
  Lightbulb,
  TrendingUp,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { Breadcrumb } from './ResourceDiscounts';

interface Metric {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CaseStudySection {
  heading: string;
  body: string;
}

interface CaseStudy {
  id: string;
  product: string;
  tagline: string;
  builders: string;
  cohort: string;
  stage: 'Launched' | 'Shipped MVP' | 'Funded';
  oneLiner: string;
  image: string;
  metrics: Metric[];
  stack: string[];
  challenge: CaseStudySection;
  approach: CaseStudySection;
  outcome: CaseStudySection;
  quote?: string;
  quoteBy?: string;
  productUrl?: string;
  featured?: boolean;
}

const caseStudies: CaseStudy[] = [
  {
    id: 'ledger',
    product: 'Ledger',
    tagline: 'An AI-first study-group scheduler for busy students.',
    builders: 'Ade Okonkwo & Priya Desai',
    cohort: 'Launchpad · Michaelmas 2025',
    stage: 'Launched',
    oneLiner:
      'Won Velocity Lent Hackathon then shipped to 600 LSE students in six weeks.',
    image:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80',
    metrics: [
      { label: 'Active users', value: '600+', icon: Users },
      { label: 'Time to MVP', value: '48 hrs', icon: Zap },
      { label: 'Time to launch', value: '6 weeks', icon: Calendar },
    ],
    stack: ['Next.js', 'Supabase', 'Claude', 'Vercel'],
    challenge: {
      heading: 'The challenge',
      body: 'Four classmates could not find a time to meet for group projects. Calendars were scattered across Google, Outlook, and iCal, and copy-pasting availability into a chat was wasting 30 minutes per meeting.',
    },
    approach: {
      heading: 'The approach',
      body: 'Ade and Priya shipped a thin MVP in a 48-hour hackathon using the Velocity Vibe Coding Starter. They wired up Google Calendar ingestion, a Claude agent that proposes three optimal slots, and a one-click confirmation flow.',
    },
    outcome: {
      heading: 'The outcome',
      body: 'Ledger spread across project groups via word of mouth. Within six weeks it was scheduling over 120 meetings a week and is now on the LSE100 student tools list.',
    },
    quote:
      'We had 40 users by the Monday after the hackathon. The vibe coding stack made the difference: we skipped setup and went straight to shipping.',
    quoteBy: 'Ade Okonkwo, co-founder',
    productUrl: 'https://ledger.app',
    featured: true,
  },
  {
    id: 'margin',
    product: 'Margin',
    tagline: 'AI essay feedback trained on LSE marking criteria.',
    builders: 'Elena Park & Hana Yoshida',
    cohort: 'Launchpad · Michaelmas 2025',
    stage: 'Shipped MVP',
    oneLiner:
      'Three LSE classes adopted Margin for draft feedback in a single term.',
    image:
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
    metrics: [
      { label: 'Essays reviewed', value: '2,400', icon: TrendingUp },
      { label: 'Classes using it', value: '3', icon: Users },
      { label: 'Build time', value: '4 weeks', icon: Calendar },
    ],
    stack: ['Next.js', 'Claude', 'pgvector', 'Stripe'],
    challenge: {
      heading: 'The challenge',
      body: 'Students wanted faster feedback on essay drafts but TAs had limited office hours. Existing AI tools gave generic feedback that ignored the specific rubric each course used.',
    },
    approach: {
      heading: 'The approach',
      body: 'Elena and Hana ingested public LSE marking rubrics, built a Claude agent with rubric-aware prompts, and paired it with a margin-note UI that mirrored Word.',
    },
    outcome: {
      heading: 'The outcome',
      body: 'Three professors opted in to trial Margin as a draft-feedback tool. Students reported faster turnaround and more specific feedback than generic LLM chats.',
    },
    quote:
      'The margin-note UI was the unlock. Students got feedback where they were reading, not in a separate chat window.',
    quoteBy: 'Elena Park, co-founder',
    productUrl: 'https://margin.study',
  },
  {
    id: 'parser',
    product: 'Parser',
    tagline: 'Receipt photo in, expense report out, no typing.',
    builders: 'Rohan Patel (solo)',
    cohort: 'Launchpad · Lent 2026',
    stage: 'Funded',
    oneLiner:
      'Closed a £40k pre-seed from Seedcamp four months after winning Lent Hackathon.',
    image:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
    metrics: [
      { label: 'Pre-seed', value: '£40k', icon: Wallet },
      { label: 'Paying teams', value: '12', icon: Users },
      { label: 'Build to raise', value: '4 months', icon: Calendar },
    ],
    stack: ['Next.js', 'Claude', 'Stripe', 'AWS Textract'],
    challenge: {
      heading: 'The challenge',
      body: 'Rohan was freelancing and losing hours per week on expense reports. Existing tools required manual entry and had poor UK receipt support.',
    },
    approach: {
      heading: 'The approach',
      body: 'Parser combines AWS Textract OCR with a Claude agent that classifies line items, assigns categories, and generates a submittable PDF. Every flow started as a prompt, then hardened into a deterministic pipeline.',
    },
    outcome: {
      heading: 'The outcome',
      body: 'Rohan demoed Parser at the a16z fireside, signed up three paying small businesses in the room, and closed £40k from Seedcamp the following month.',
    },
    quote:
      'I did not set out to raise. But when a dozen people want to pay you before launch, the conversation changes.',
    quoteBy: 'Rohan Patel, founder',
    productUrl: 'https://parser.finance',
  },
  {
    id: 'compass',
    product: 'Compass',
    tagline: 'Career-path simulator for LSE students.',
    builders: 'Talia Chen & David Kline',
    cohort: 'Velocity Hack Weekend · Feb 2026',
    stage: 'Shipped MVP',
    oneLiner: '800 LSE students ran simulations in the first two weeks.',
    image:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    metrics: [
      { label: 'Simulations run', value: '800', icon: TrendingUp },
      { label: 'Time to MVP', value: '1 week', icon: Zap },
      { label: 'Active users', value: '350', icon: Users },
    ],
    stack: ['Next.js', 'Supabase', 'Claude', 'Recharts'],
    challenge: {
      heading: 'The challenge',
      body: 'Students were overwhelmed by career options. Advice from LSE Careers was slow to get and often generic. There was no way to compare graduate programmes against each other.',
    },
    approach: {
      heading: 'The approach',
      body: 'Compass takes your degree, year, and interests and simulates 24-month career paths with salary, skills, and lifestyle projections. The backend is one agent orchestrating three smaller ones.',
    },
    outcome: {
      heading: 'The outcome',
      body: 'Launched to 800 simulations in two weeks. LSE Careers reached out about a pilot integration. Building a premium tier for Year-2 students now.',
    },
    productUrl: 'https://compass.lse',
  },
  {
    id: 'nook',
    product: 'Nook',
    tagline: 'Real-time quiet-study-spot finder across LSE.',
    builders: 'Noah Harper & Jonas Reid',
    cohort: 'Velocity Build Nights',
    stage: 'Shipped MVP',
    oneLiner: 'A crowdsourced map that killed the "is the library full?" group chat.',
    image:
      'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=1200&q=80',
    metrics: [
      { label: 'Daily active', value: '280', icon: Users },
      { label: 'Check-ins', value: '1.8k', icon: TrendingUp },
      { label: 'Build time', value: '2 weeks', icon: Calendar },
    ],
    stack: ['Expo', 'Supabase', 'Mapbox'],
    challenge: {
      heading: 'The challenge',
      body: 'LSE has 11 study locations, none of which publish live occupancy. Students were losing 20 minutes a day hunting for seats.',
    },
    approach: {
      heading: 'The approach',
      body: 'Nook is a mobile app where students check in with one tap and report how full a space feels. The crowdsourced signal is displayed on a live map. Built over two weekends in Expo.',
    },
    outcome: {
      heading: 'The outcome',
      body: 'After a launch post on the LSE subreddit, Nook hit 280 daily actives in a week. Now in talks with LSE Estates about integrating real sensor data.',
    },
    productUrl: 'https://nook.study',
  },
  {
    id: 'citeology',
    product: 'Citeology',
    tagline: 'Citation-accurate AI research assistant for essays.',
    builders: 'Aliyah Gomez (solo)',
    cohort: 'Launchpad · Lent 2026',
    stage: 'Shipped MVP',
    oneLiner:
      'The first AI tool LSE100 explicitly permitted in its 2026 guidelines.',
    image:
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
    metrics: [
      { label: 'Citations generated', value: '18k', icon: TrendingUp },
      { label: 'Users', value: '450', icon: Users },
      { label: 'Accuracy', value: '96%', icon: Compass },
    ],
    stack: ['Next.js', 'Claude', 'CrossRef API', 'pgvector'],
    challenge: {
      heading: 'The challenge',
      body: 'AI tools hallucinate citations. Students wanted LLM help but kept getting caught with fake references in essay feedback.',
    },
    approach: {
      heading: 'The approach',
      body: 'Citeology grounds every citation in the CrossRef API before returning an answer. Claude drafts the paragraph, the tool layer verifies each reference, and unverified claims are flagged in red.',
    },
    outcome: {
      heading: 'The outcome',
      body: 'LSE100 updated its 2026 AI guidelines to explicitly permit verifiable citation tools. Citeology was named. Running at 96% citation accuracy on a 500-essay eval set.',
    },
    quote:
      'The eval harness is what made this work. I built the evals before the product: once I had 500 essays to test against, everything else fell into place.',
    quoteBy: 'Aliyah Gomez, founder',
    productUrl: 'https://citeology.app',
  },
  {
    id: 'echo',
    product: 'Echo',
    tagline: 'Your lectures, as a personalised podcast.',
    builders: 'Maya Chen & Rhea Malik',
    cohort: 'Velocity Build Nights',
    stage: 'Shipped MVP',
    oneLiner: 'Turns Moodle recordings into 15-minute NotebookLM-style briefings.',
    image:
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80',
    metrics: [
      { label: 'Lectures processed', value: '3.2k', icon: TrendingUp },
      { label: 'Waitlist', value: '1.1k', icon: Users },
      { label: 'Build time', value: '3 weeks', icon: Calendar },
    ],
    stack: ['Next.js', 'Gemini 2.0', 'ElevenLabs', 'Supabase'],
    challenge: {
      heading: 'The challenge',
      body: 'Lecture recordings are 50 minutes long and students rarely rewatch them. Students wanted a faster way to revise without losing the nuance.',
    },
    approach: {
      heading: 'The approach',
      body: 'Echo uses Gemini 2.0 to summarise a lecture into a conversational script, then ElevenLabs to voice it in a two-host podcast format. Users can scrub, bookmark, and ask follow-up questions.',
    },
    outcome: {
      heading: 'The outcome',
      body: 'Launched to a closed beta of 50, hit a 1,100-student waitlist in 10 days. Working with LSE Digital to explore a Moodle integration.',
    },
    productUrl: 'https://echo.lectures',
  },
];

const stageStyle: Record<CaseStudy['stage'], string> = {
  Launched: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  'Shipped MVP': 'border-white/20 bg-white/5 text-zinc-300',
  Funded: 'border-velocity-red/40 bg-velocity-red/10 text-velocity-red',
};

export const ResourceCaseStudies: React.FC = () => {
  const [active, setActive] = useState<CaseStudy | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const featured = caseStudies.find((c) => c.featured) ?? caseStudies[0];
  const rest = caseStudies.filter((c) => c.id !== featured.id);

  return (
    <section className="relative z-10 min-h-screen bg-velocity-black px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <Breadcrumb current="Case Studies" />

        <div className="mx-auto mb-14 max-w-3xl md:text-center">
          <div className="mb-4 inline-flex items-center gap-2 border border-white/10 bg-velocity-black/40 px-3 py-1 font-sans text-xs uppercase tracking-widest text-zinc-400">
            <Lightbulb className="h-3.5 w-3.5 text-velocity-red" />
            Student builds that shipped
          </div>
          <h1 className="mb-3 font-sans text-3xl font-bold tracking-tight text-white md:text-5xl">
            Case <span className="text-velocity-red">Studies</span>
          </h1>
          <p className="font-sans text-sm leading-relaxed text-gray-500 md:text-base">
            Real teardowns of products built by Velocity members: wins, failures, and
            the lessons behind the metrics.
          </p>
        </div>

        {/* Featured case study */}
        <FeaturedCaseStudy study={featured} onOpen={() => setActive(featured)} />

        {/* Grid */}
        <div className="mt-16">
          <h3 className="mb-5 font-sans text-xs uppercase tracking-widest text-zinc-500">
            More stories
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((study) => (
              <CaseStudyCard
                key={study.id}
                study={study}
                onClick={() => setActive(study)}
              />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 border border-white/10 bg-velocity-black/40 p-8 md:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="mb-2 font-sans text-xs uppercase tracking-widest text-velocity-red">
                Your turn
              </p>
              <h3 className="mb-1 font-sans text-xl font-bold text-white md:text-2xl">
                Built something worth a case study?
              </h3>
              <p className="max-w-xl font-sans text-sm leading-relaxed text-zinc-500">
                We interview every featured builder and publish the full story: process,
                decisions, and mistakes included.
              </p>
            </div>
            <a
              href="mailto:velocity@lsesu.org?subject=Case study submission"
              className="inline-flex items-center gap-2 bg-velocity-red px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-white transition-colors hover:bg-velocity-red/90"
            >
              Pitch your story
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {active && <CaseStudyModal study={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </section>
  );
};

interface FeaturedCaseStudyProps {
  study: CaseStudy;
  onOpen: () => void;
}

const FeaturedCaseStudy: React.FC<FeaturedCaseStudyProps> = ({ study, onOpen }) => (
  <motion.article
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    onClick={onOpen}
    className="group relative grid cursor-pointer grid-cols-1 overflow-hidden border border-white/10 bg-velocity-black/40 transition-colors duration-300 hover:border-velocity-red/40 lg:grid-cols-[1.2fr_1fr]"
  >
    <div className="relative aspect-[16/10] w-full overflow-hidden lg:aspect-auto">
      <img
        src={study.image}
        alt={study.product}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-velocity-black via-velocity-black/20 to-transparent lg:bg-gradient-to-r" />
      <div
        className={`absolute left-5 top-5 inline-flex items-center gap-2 border px-3 py-1.5 font-sans text-[11px] uppercase tracking-widest backdrop-blur-sm ${
          stageStyle[study.stage]
        }`}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
        {study.stage}
      </div>
    </div>

    <div className="flex flex-col justify-between gap-6 p-8 md:p-10">
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-3 font-sans text-xs uppercase tracking-widest text-zinc-500">
          <span className="text-velocity-red">{study.cohort}</span>
        </div>
        <h2 className="mb-3 font-sans text-2xl font-bold leading-tight text-white md:text-3xl">
          {study.product}
        </h2>
        <p className="mb-4 font-sans text-sm italic leading-relaxed text-zinc-400">
          {study.tagline}
        </p>
        <p className="mb-6 font-sans text-sm leading-relaxed text-zinc-500">
          {study.oneLiner}
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-px overflow-hidden border border-white/10 bg-white/10">
          {study.metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="flex flex-col items-start bg-velocity-black/60 p-4"
              >
                <Icon className="mb-2 h-4 w-4 text-velocity-red" />
                <p className="font-sans text-lg font-bold text-white">{metric.value}</p>
                <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-500">
                  {metric.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-sans text-xs uppercase tracking-widest text-zinc-500">
          Built by {study.builders}
        </p>
        <span className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-zinc-300 transition-colors group-hover:text-white">
          Read teardown
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  </motion.article>
);

interface CaseStudyCardProps {
  study: CaseStudy;
  onClick: () => void;
}

const CaseStudyCard: React.FC<CaseStudyCardProps> = ({ study, onClick }) => (
  <motion.article
    whileHover={{ y: -3 }}
    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
    onClick={onClick}
    className="group relative flex h-full cursor-pointer flex-col overflow-hidden border border-white/10 bg-velocity-black/40 transition-colors duration-300 hover:border-white/25"
  >
    <div className="relative aspect-[4/3] w-full overflow-hidden">
      <img
        src={study.image}
        alt={study.product}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-velocity-black/90 via-transparent to-transparent" />
      <div
        className={`absolute left-4 top-4 inline-flex items-center gap-1.5 border px-2.5 py-1 font-sans text-[10px] uppercase tracking-widest backdrop-blur-sm ${
          stageStyle[study.stage]
        }`}
      >
        {study.stage}
      </div>

      {/* Top-line metric on image */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
        <div>
          <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-400">
            {study.metrics[0].label}
          </p>
          <p className="font-sans text-2xl font-bold text-white">
            {study.metrics[0].value}
          </p>
        </div>
      </div>
    </div>

    <div className="flex flex-1 flex-col p-5">
      <h4 className="mb-2 font-sans text-base font-bold text-white transition-colors group-hover:text-velocity-red">
        {study.product}
      </h4>
      <p className="mb-3 font-sans text-sm italic leading-relaxed text-zinc-400">
        {study.tagline}
      </p>
      <p className="mb-4 flex-1 font-sans text-sm leading-relaxed text-zinc-500">
        {study.oneLiner}
      </p>

      <div className="flex items-center justify-between border-t border-white/5 pt-4 font-sans text-[11px] uppercase tracking-widest text-zinc-500">
        <span className="truncate">{study.builders.split(' &')[0]}</span>
        <span className="inline-flex items-center gap-1 transition-colors group-hover:text-white">
          Read story
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  </motion.article>
);

interface CaseStudyModalProps {
  study: CaseStudy;
  onClose: () => void;
}

const CaseStudyModal: React.FC<CaseStudyModalProps> = ({ study, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-28 backdrop-blur-sm"
    onClick={onClose}
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
          src={study.image}
          alt={study.product}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-velocity-black via-velocity-black/40 to-transparent" />
        <div
          className={`absolute left-5 top-5 inline-flex items-center gap-2 border px-3 py-1.5 font-sans text-[11px] uppercase tracking-widest backdrop-blur-sm ${
            stageStyle[study.stage]
          }`}
        >
          {study.stage}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded bg-velocity-black/70 p-2 text-zinc-300 backdrop-blur-sm transition-colors hover:bg-velocity-black hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-8">
        <p className="mb-3 font-sans text-xs uppercase tracking-widest text-velocity-red">
          {study.cohort}
        </p>
        <h2 className="mb-2 font-sans text-3xl font-bold text-white">{study.product}</h2>
        <p className="mb-6 font-sans text-sm italic leading-relaxed text-zinc-400">
          {study.tagline}
        </p>

        <div className="mb-6 grid grid-cols-3 gap-px overflow-hidden border border-white/10 bg-white/10">
          {study.metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="bg-velocity-black/60 p-4">
                <Icon className="mb-2 h-4 w-4 text-velocity-red" />
                <p className="font-sans text-lg font-bold text-white">{metric.value}</p>
                <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-500">
                  {metric.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Builders + stack */}
        <div className="mb-6 grid grid-cols-1 gap-4 border-y border-white/10 py-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 font-sans text-[10px] uppercase tracking-widest text-zinc-500">
              Builders
            </p>
            <p className="font-sans text-sm text-white">{study.builders}</p>
          </div>
          <div>
            <p className="mb-2 font-sans text-[10px] uppercase tracking-widest text-zinc-500">
              Stack
            </p>
            <div className="flex flex-wrap gap-1.5">
              {study.stack.map((tech) => (
                <span
                  key={tech}
                  className="border border-white/10 bg-white/5 px-2 py-0.5 font-sans text-[10px] uppercase tracking-widest text-zinc-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sections */}
        {[study.challenge, study.approach, study.outcome].map((section) => (
          <div key={section.heading} className="mb-6">
            <h4 className="mb-2 font-sans text-xs uppercase tracking-widest text-velocity-red">
              {section.heading}
            </h4>
            <p className="font-sans text-sm leading-relaxed text-zinc-300">
              {section.body}
            </p>
          </div>
        ))}

        {study.quote && (
          <div className="mb-6 border-l-2 border-velocity-red bg-white/5 px-5 py-4">
            <p className="mb-2 font-sans text-sm italic leading-relaxed text-zinc-200">
              "{study.quote}"
            </p>
            {study.quoteBy && (
              <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-500">
                {study.quoteBy}
              </p>
            )}
          </div>
        )}

        {study.productUrl && (
          <a
            href={study.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-velocity-red px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-white transition-colors hover:bg-velocity-red/90"
          >
            <ExternalLink className="h-4 w-4" />
            Visit {study.product}
          </a>
        )}
      </div>
    </motion.div>
  </motion.div>
);

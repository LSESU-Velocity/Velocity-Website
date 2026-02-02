import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Clipboard, Rocket, Copy, Check, ChevronRight, X, ArrowRight } from 'lucide-react';

const CATEGORIES = [
  'All',
  'FinTech',
  'Policy & GovTech',
  'EdTech',
  'ESG & Sustainability',
  'Healthcare',
  'Other',
] as const;

type Category = (typeof CATEGORIES)[number];

export interface ConceptPrompt {
  id: number;
  category: Exclude<Category, 'All'>;
  title: string;
  description: string;
  prompt: string;
  difficulty: string;
  buildTime: string;
}

const prompts: ConceptPrompt[] = [
  {
    id: 1,
    category: 'FinTech',
    title: 'Student Micro-Pension Simulator',
    description: 'Build an app that helps students understand compound growth by simulating small weekly contributions.',
    prompt: 'Act as a No-Code architect. Design a mobile-friendly calculator app that lets users input weekly savings (£5-50), expected return rate, and retirement age. Show projected growth with interactive charts. Recommend: Glide + Google Sheets.',
    difficulty: 'Beginner',
    buildTime: '2-4 hours',
  },
  {
    id: 2,
    category: 'FinTech',
    title: 'Expense Splitter for Student Houses',
    description: 'A shared expense tracker for housemates with automated balance calculations.',
    prompt: 'Act as a No-Code architect. Design an app where users can log shared expenses, split by percentage or equally, and track who owes whom. Include monthly summaries and payment reminders. Recommend: Airtable + Softr.',
    difficulty: 'Beginner',
    buildTime: '3-5 hours',
  },
  {
    id: 3,
    category: 'Policy & GovTech',
    title: 'UK Bill Tracker',
    description: 'Track legislation through Parliament with alerts for topics you care about.',
    prompt: 'Act as a No-Code architect. Design an app that pulls data from the UK Parliament API, lets users follow specific bills or topics, and sends weekly digest emails. Recommend: Make.com + Airtable + Mailchimp.',
    difficulty: 'Intermediate',
    buildTime: '4-6 hours',
  },
  {
    id: 4,
    category: 'Policy & GovTech',
    title: 'Local Council Meeting Summariser',
    description: 'AI-powered summaries of public council meetings for citizen engagement.',
    prompt: 'Act as a No-Code architect. Design an app that takes council meeting transcripts or YouTube links, uses AI to summarise key decisions, and displays them in a searchable directory by borough. Recommend: Bubble + OpenAI API.',
    difficulty: 'Intermediate',
    buildTime: '6-8 hours',
  },
  {
    id: 5,
    category: 'EdTech',
    title: 'Reading List Organiser',
    description: 'Help students manage module reading lists with progress tracking.',
    prompt: 'Act as a No-Code architect. Design an app where students paste their reading list, mark items as complete, add notes, and see progress by week. Include a focus timer. Recommend: Notion API + Glide.',
    difficulty: 'Beginner',
    buildTime: '2-3 hours',
  },
  {
    id: 6,
    category: 'EdTech',
    title: 'Society Event Manager',
    description: 'All-in-one tool for student societies to manage events, RSVPs, and communications.',
    prompt: 'Act as a No-Code architect. Design an internal tool for society committees: event creation, RSVP tracking, email/SMS reminders, attendance check-in via QR code. Recommend: Airtable + Softr + Make.com.',
    difficulty: 'Intermediate',
    buildTime: '5-7 hours',
  },
  {
    id: 7,
    category: 'ESG & Sustainability',
    title: 'Personal Carbon Footprint Tracker',
    description: 'Track daily choices and see your environmental impact over time.',
    prompt: 'Act as a No-Code architect. Design an app where users log transport, food, and energy usage. Calculate estimated CO2 and show trends over time with tips to reduce impact. Recommend: Glide + Google Sheets.',
    difficulty: 'Beginner',
    buildTime: '3-4 hours',
  },
  {
    id: 8,
    category: 'ESG & Sustainability',
    title: 'ESG Portfolio Screener',
    description: 'Screen stocks and funds by ESG ratings for conscious investors.',
    prompt: 'Act as a No-Code architect. Design an app that lets users search stocks/ETFs and see ESG scores pulled from public APIs. Allow saving to a watchlist and comparing funds. Recommend: Retool + Yahoo Finance API.',
    difficulty: 'Advanced',
    buildTime: '8-10 hours',
  },
  {
    id: 9,
    category: 'Healthcare',
    title: 'Medication Reminder App',
    description: 'Simple reminders for daily medications with refill tracking.',
    prompt: 'Act as a No-Code architect. Design an app where users add medications, set reminder times, log when taken, and get alerts when running low. Include a history view for doctor visits. Recommend: Adalo + OneSignal.',
    difficulty: 'Beginner',
    buildTime: '3-5 hours',
  },
  {
    id: 10,
    category: 'Other',
    title: 'Freelancer Invoice Generator',
    description: 'Create professional invoices and track payments for side hustles.',
    prompt: 'Act as a No-Code architect. Design an app where freelancers add clients, create invoices from templates, send via email, and track paid/unpaid status. Recommend: Airtable + Softr + Make.com.',
    difficulty: 'Intermediate',
    buildTime: '4-6 hours',
  },
];

const CATEGORY_BADGE_STYLES: Record<Exclude<Category, 'All'>, string> = {
  'FinTech': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  'Policy & GovTech': 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  'EdTech': 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  'ESG & Sustainability': 'bg-green-500/20 text-green-400 border-green-500/40',
  'Healthcare': 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  'Other': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/40',
};

const DIFFICULTY_BADGE_STYLES: Record<string, string> = {
  Beginner: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  Intermediate: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  Advanced: 'bg-velocity-red/20 text-velocity-red border-velocity-red/40',
};

function parseRecommendedTools(prompt: string): string[] {
  const match = prompt.match(/Recommend:\s*([^.]+)/i);
  if (!match) return [];
  return match[1]
    .split(/\+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const steps = [
  {
    step: '01',
    title: 'Pick Your Industry',
    description:
      'Browse prompts organised by sector: FinTech, Policy, EdTech, and more.',
    icon: LayoutGrid,
  },
  {
    step: '02',
    title: 'Copy the Prompt',
    description:
      'Each prompt is designed to paste directly into ChatGPT or Claude to generate your app logic.',
    icon: Clipboard,
  },
  {
    step: '03',
    title: 'Build in Launchpad',
    description:
      'Take your generated blueprint to Launchpad to start building with our No-Code guides.',
    icon: Rocket,
  },
];

const TOAST_DURATION_MS = 2000;
const COPIED_RESET_MS = 2000;

export const Concepts: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [detailPrompt, setDetailPrompt] = useState<ConceptPrompt | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | 'modal' | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (copiedId === null) return;
    const t = setTimeout(() => setCopiedId(null), COPIED_RESET_MS);
    return () => clearTimeout(t);
  }, [copiedId]);

  const filteredPrompts = useMemo(() => {
    if (activeCategory === 'All') return prompts;
    return prompts.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  const copyToClipboard = (text: string, sourceId: number | 'modal') => {
    navigator.clipboard.writeText(text);
    setCopiedId(sourceId);
    setToast('Copied to clipboard');
  };

  return (
    <section className="relative z-10 py-32 px-6 bg-velocity-black min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 md:text-center max-w-3xl mx-auto">
          <h1 className="font-sans font-bold text-3xl md:text-4xl tracking-tight text-white mb-2">
            <span className="text-velocity-red">Concept Lab</span>
          </h1>
          <p className="font-sans text-gray-500 text-sm md:text-base leading-relaxed">
            Turn your domain expertise into build-ready app ideas. Browse prompts by industry, copy them into Cursor or Lovable, and start building.
          </p>
        </div>

        {/* How It Works */}
        <div className="border border-white/5 bg-white/[0.02] p-8 md:p-10">
          <h2 className="font-sans font-bold text-xl md:text-2xl text-white mb-8 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map(({ step, title, description, icon: Icon }) => (
              <div
                key={step}
                className="flex flex-col bg-velocity-black/40 border border-white/5 p-6 md:p-8 h-full transition-colors duration-300 hover:border-white/10"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 bg-white/5 border border-white/10">
                    <Icon className="w-5 h-5 text-zinc-400" />
                  </div>
                  <span className="font-sans text-xs uppercase tracking-widest text-zinc-500">
                    Step {step}
                  </span>
                </div>
                <h3 className="font-sans font-bold text-lg text-white mb-3">
                  {title}
                </h3>
                <p className="font-sans text-sm leading-relaxed text-zinc-500 flex-1">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Category tabs — horizontal scroll on mobile, full width on desktop */}
        <div className="mt-12 mb-8 -mx-6 px-6 md:mx-0 md:px-0 overflow-hidden">
          <div className="flex overflow-x-auto gap-1 border-b border-white/10 pb-px md:flex-wrap md:overflow-visible">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 font-sans text-sm uppercase tracking-widest px-4 py-3 border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-velocity-red/50 focus-visible:ring-offset-2 focus-visible:ring-offset-velocity-black ${
                  activeCategory === cat
                    ? 'border-velocity-red text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt cards — 3 cols desktop, 1 mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((item) => (
            <div
              key={item.id}
              className="flex flex-col border border-white/5 bg-velocity-black/40 p-6 transition-colors duration-300 hover:border-white/10"
            >
              <span
                className={`font-sans text-xs uppercase tracking-widest px-2.5 py-1 border w-fit mb-4 ${CATEGORY_BADGE_STYLES[item.category]}`}
              >
                {item.category}
              </span>
              <h3 className="font-sans font-bold text-lg text-white mb-2">
                {item.title}
              </h3>
              <p className="font-sans text-sm text-zinc-500 leading-relaxed line-clamp-2 mb-5 flex-1 min-h-[2.5rem]">
                {item.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDetailPrompt(item)}
                  className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest px-4 py-2.5 border border-white/30 text-zinc-400 hover:text-white hover:border-white/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-velocity-black"
                >
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {filteredPrompts.length === 0 && (
          <p className="font-sans text-sm text-zinc-500 py-8 text-center">
            No prompts in this category yet.
          </p>
        )}

        {/* CTA section */}
        <div className="mt-16 border border-white/10 bg-white/[0.02] p-10 md:p-12 text-center">
          <h2 className="font-sans font-bold text-2xl md:text-3xl text-white mb-3">
            Ready to build?
          </h2>
          <p className="font-sans text-sm text-zinc-500 max-w-xl mx-auto mb-8 leading-relaxed">
            Take your idea to Launchpad for step-by-step guides, tools, and resources.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/launchpad"
              className="inline-flex items-center gap-2 font-sans font-medium text-sm uppercase tracking-widest px-6 py-3 bg-velocity-red text-white border-2 border-velocity-red hover:bg-velocity-red/90 hover:border-velocity-red/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-velocity-red/50 focus-visible:ring-offset-2 focus-visible:ring-offset-velocity-black w-full sm:w-auto justify-center"
            >
              Go to Launchpad
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/connect"
              className="inline-flex items-center gap-2 font-sans font-medium text-sm uppercase tracking-widest px-6 py-3 bg-transparent text-white border-2 border-white/30 hover:border-white hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-velocity-black w-full sm:w-auto justify-center"
            >
              Find a Co-founder
            </Link>
          </div>
        </div>

        {/* Details modal */}
        <AnimatePresence>
          {detailPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setDetailPrompt(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 bg-velocity-black p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <span
                      className={`font-sans text-xs uppercase tracking-widest px-2.5 py-1 border w-fit inline-block mb-2 ${CATEGORY_BADGE_STYLES[detailPrompt.category]}`}
                    >
                      {detailPrompt.category}
                    </span>
                    <h2 className="font-sans font-bold text-xl text-white">
                      {detailPrompt.title}
                    </h2>
                    <p className="font-sans text-sm text-zinc-500 mt-2">
                      {detailPrompt.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailPrompt(null)}
                    className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-velocity-red/50 rounded shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Difficulty + build time */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span
                    className={`font-sans text-xs uppercase tracking-widest px-2.5 py-1 border w-fit ${DIFFICULTY_BADGE_STYLES[detailPrompt.difficulty] ?? 'bg-zinc-500/20 text-zinc-400 border-zinc-500/40'}`}
                  >
                    {detailPrompt.difficulty}
                  </span>
                  <span className="font-sans text-xs text-zinc-500">
                    Est. {detailPrompt.buildTime}
                  </span>
                </div>

                {/* Recommended tools */}
                {parseRecommendedTools(detailPrompt.prompt).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="font-sans text-xs text-zinc-500 mr-1 self-center">Tools:</span>
                    {parseRecommendedTools(detailPrompt.prompt).map((tool) => (
                      <span
                        key={tool}
                        className="font-sans text-xs px-2.5 py-1 border border-white/20 text-zinc-400 bg-white/5"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}

                {/* Prompt code block with copy */}
                <div className="border border-white/10 bg-[#0d0d0d] mb-6">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                    <span className="font-sans text-xs uppercase tracking-widest text-zinc-500">
                      Prompt
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(detailPrompt.prompt, 'modal')}
                      className="inline-flex items-center gap-1.5 font-sans text-xs uppercase tracking-widest text-zinc-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-velocity-red/50 rounded"
                    >
                      {copiedId === 'modal' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto text-left">
                    <code className="font-mono text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">
                      {detailPrompt.prompt}
                    </code>
                  </pre>
                </div>

                {/* Start Building CTA */}
                <Link
                  to="/launchpad"
                  className="inline-flex items-center gap-2 font-sans text-sm uppercase tracking-widest px-6 py-3 bg-velocity-red text-white border-2 border-velocity-red hover:bg-velocity-red/90 hover:border-velocity-red/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-velocity-red/50 focus-visible:ring-offset-2 focus-visible:ring-offset-velocity-black"
                >
                  Start Building
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 border border-velocity-red/50 bg-velocity-darkRed/30 text-white font-sans text-xs uppercase tracking-widest"
            >
              {toast}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

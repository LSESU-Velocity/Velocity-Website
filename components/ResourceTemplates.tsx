import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Download,
  ExternalLink,
  FileCode2,
  Github,
  GitFork,
  Star,
  Terminal,
} from 'lucide-react';
import { Breadcrumb } from './ResourceDiscounts';

type TemplateCategory = 'Full-stack' | 'Agent' | 'Frontend' | 'Mobile';

interface Template {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: TemplateCategory;
  stack: string[];
  stars: string;
  forks: string;
  updated: string;
  cloneCmd: string;
  repoUrl: string;
  deployUrl?: string;
  featured?: boolean;
  accent: string;
}

const templates: Template[] = [
  {
    id: 'vibe-starter',
    name: 'Vibe Coding Starter',
    tagline: 'The Velocity default — ship an MVP in 30 minutes.',
    description:
      'Next.js 15 + Tailwind + shadcn/ui with Claude API and Vercel AI SDK wired up. Cursor rules and prompts included.',
    category: 'Full-stack',
    stack: ['Next.js', 'Tailwind', 'shadcn/ui', 'Claude', 'Vercel'],
    stars: '1.2k',
    forks: '184',
    updated: 'Updated 3 days ago',
    cloneCmd: 'npx create-velocity-app@latest',
    repoUrl: 'https://github.com/lsesu-velocity/vibe-starter',
    deployUrl: 'https://vercel.com/new/velocity',
    featured: true,
    accent: 'from-velocity-red/30 via-velocity-red/10 to-transparent',
  },
  {
    id: 'saas-kit',
    name: 'SaaS Starter Kit',
    tagline: 'Auth, billing, and dashboard scaffolded end-to-end.',
    description:
      'Next.js + Supabase auth + Stripe subscriptions + Resend emails. Drop-in starter for any paid product.',
    category: 'Full-stack',
    stack: ['Next.js', 'Supabase', 'Stripe', 'Resend'],
    stars: '980',
    forks: '142',
    updated: 'Updated 1 week ago',
    cloneCmd: 'git clone lsesu-velocity/saas-kit',
    repoUrl: 'https://github.com/lsesu-velocity/saas-kit',
    deployUrl: 'https://vercel.com/new/velocity/saas-kit',
    accent: 'from-emerald-500/25 via-emerald-500/5 to-transparent',
  },
  {
    id: 'agent-boilerplate',
    name: 'Agent Boilerplate',
    tagline: 'Autonomous agents with memory, tools, and evals.',
    description:
      'Python + LangGraph + Claude. Includes a toolkit of common tool calls, persistence layer, and an evals harness.',
    category: 'Agent',
    stack: ['Python', 'LangGraph', 'Claude', 'Postgres'],
    stars: '740',
    forks: '96',
    updated: 'Updated 5 days ago',
    cloneCmd: 'git clone lsesu-velocity/agent-boilerplate',
    repoUrl: 'https://github.com/lsesu-velocity/agent-boilerplate',
    accent: 'from-violet-500/25 via-violet-500/5 to-transparent',
  },
  {
    id: 'rag-starter',
    name: 'RAG Starter',
    tagline: 'Retrieval-augmented chat over your own documents.',
    description:
      'Next.js + Supabase pgvector + Claude. Upload PDFs, index them, chat with citations. Ready for students building research tools.',
    category: 'Agent',
    stack: ['Next.js', 'pgvector', 'Claude', 'Supabase'],
    stars: '620',
    forks: '71',
    updated: 'Updated 2 weeks ago',
    cloneCmd: 'git clone lsesu-velocity/rag-starter',
    repoUrl: 'https://github.com/lsesu-velocity/rag-starter',
    deployUrl: 'https://vercel.com/new/velocity/rag-starter',
    accent: 'from-amber-500/25 via-amber-500/5 to-transparent',
  },
  {
    id: 'chatbot-template',
    name: 'Chatbot Template',
    tagline: 'Streaming chat UI with tool calls and citations.',
    description:
      'Vercel AI SDK v5 with streaming, tool-calling, and a clean message UI. Swap between Claude, GPT, and Gemini.',
    category: 'Full-stack',
    stack: ['Next.js', 'AI SDK', 'Tailwind', 'Claude'],
    stars: '530',
    forks: '68',
    updated: 'Updated 4 days ago',
    cloneCmd: 'npx create-velocity-chat@latest',
    repoUrl: 'https://github.com/lsesu-velocity/chatbot-template',
    deployUrl: 'https://vercel.com/new/velocity/chatbot',
    accent: 'from-sky-500/25 via-sky-500/5 to-transparent',
  },
  {
    id: 'landing-kit',
    name: 'Landing Page Kit',
    tagline: '10 premium sections, dropped into your site in minutes.',
    description:
      'Hero, features, pricing, testimonials, FAQ, footer, and more. Inspired by the Velocity brand system.',
    category: 'Frontend',
    stack: ['React', 'Tailwind', 'Framer Motion'],
    stars: '1.4k',
    forks: '210',
    updated: 'Updated yesterday',
    cloneCmd: 'git clone lsesu-velocity/landing-kit',
    repoUrl: 'https://github.com/lsesu-velocity/landing-kit',
    accent: 'from-rose-500/25 via-rose-500/5 to-transparent',
  },
  {
    id: 'dashboard',
    name: 'Dashboard Template',
    tagline: 'Admin dashboard with charts, tables, and auth.',
    description:
      'Next.js + shadcn/ui + Tremor charts + Clerk auth. The dashboard most Velocity SaaS teams end up building anyway.',
    category: 'Frontend',
    stack: ['Next.js', 'shadcn/ui', 'Tremor', 'Clerk'],
    stars: '810',
    forks: '103',
    updated: 'Updated 1 week ago',
    cloneCmd: 'git clone lsesu-velocity/dashboard',
    repoUrl: 'https://github.com/lsesu-velocity/dashboard',
    deployUrl: 'https://vercel.com/new/velocity/dashboard',
    accent: 'from-cyan-500/25 via-cyan-500/5 to-transparent',
  },
  {
    id: 'waitlist-kit',
    name: 'Waitlist Kit',
    tagline: 'Collect 1,000 signups before you ship.',
    description:
      'Animated hero, form validation, double opt-in, Resend emails, Supabase storage. Deployable in under 10 minutes.',
    category: 'Frontend',
    stack: ['Next.js', 'Supabase', 'Resend'],
    stars: '920',
    forks: '157',
    updated: 'Updated 2 days ago',
    cloneCmd: 'npx create-velocity-waitlist@latest',
    repoUrl: 'https://github.com/lsesu-velocity/waitlist-kit',
    deployUrl: 'https://vercel.com/new/velocity/waitlist',
    accent: 'from-indigo-500/25 via-indigo-500/5 to-transparent',
  },
  {
    id: 'mobile-starter',
    name: 'Mobile App Starter',
    tagline: 'Cross-platform mobile app, live in a weekend.',
    description:
      'Expo + Supabase + NativeWind. Includes auth, onboarding, tab navigation, and a theme system.',
    category: 'Mobile',
    stack: ['Expo', 'React Native', 'Supabase', 'NativeWind'],
    stars: '420',
    forks: '52',
    updated: 'Updated 6 days ago',
    cloneCmd: 'npx create-velocity-mobile@latest',
    repoUrl: 'https://github.com/lsesu-velocity/mobile-starter',
    accent: 'from-teal-500/25 via-teal-500/5 to-transparent',
  },
];

const categoryOrder: TemplateCategory[] = ['Full-stack', 'Agent', 'Frontend', 'Mobile'];

export const ResourceTemplates: React.FC = () => {
  const [filter, setFilter] = useState<'All' | TemplateCategory>('All');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const featured = templates.find((t) => t.featured) ?? templates[0];

  const visible = useMemo(() => {
    const rest = templates.filter((t) => !t.featured);
    return filter === 'All' ? rest : rest.filter((t) => t.category === filter);
  }, [filter]);

  return (
    <section className="relative z-10 min-h-screen bg-velocity-black px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <Breadcrumb current="Starter Templates" />

        <div className="mx-auto mb-14 max-w-3xl md:text-center">
          <div className="mb-4 inline-flex items-center gap-2 border border-white/10 bg-velocity-black/40 px-3 py-1 font-sans text-xs uppercase tracking-widest text-zinc-400">
            <FileCode2 className="h-3.5 w-3.5 text-velocity-red" />
            Skip the setup
          </div>
          <h1 className="mb-3 font-sans text-3xl font-bold tracking-tight text-white md:text-5xl">
            Starter <span className="text-velocity-red">Templates</span>
          </h1>
          <p className="font-sans text-sm leading-relaxed text-gray-500 md:text-base">
            Boilerplates tuned for student builders — clone, configure, ship. Each one
            is battle-tested by Launchpad teams.
          </p>
        </div>

        {/* Featured template */}
        <FeaturedTemplate template={featured} />

        {/* Filter */}
        <div className="mt-14 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['All', ...categoryOrder] as const).map((key) => {
              const active = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`border px-4 py-1.5 font-sans text-xs uppercase tracking-widest transition-colors ${
                    active
                      ? 'border-velocity-red/40 bg-velocity-red/10 text-velocity-red'
                      : 'border-white/10 bg-velocity-black/40 text-zinc-400 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {key}
                </button>
              );
            })}
          </div>
          <p className="font-sans text-xs uppercase tracking-widest text-zinc-500">
            {templates.length} templates · all MIT licensed
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>

        {/* Contribution strip */}
        <div className="mt-20 border border-white/10 bg-velocity-black/40 p-8 md:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="mb-2 font-sans text-xs uppercase tracking-widest text-velocity-red">
                Open source
              </p>
              <h3 className="mb-1 font-sans text-xl font-bold text-white md:text-2xl">
                Contribute a template.
              </h3>
              <p className="max-w-xl font-sans text-sm leading-relaxed text-zinc-500">
                Built something reusable? Open a PR on the Velocity GitHub and we'll
                review it. Accepted templates get a feature spot.
              </p>
            </div>
            <a
              href="https://github.com/lsesu-velocity"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/20 px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-zinc-300 transition-colors hover:border-white/40 hover:text-white"
            >
              <Github className="h-4 w-4" />
              Open on GitHub
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

interface FeaturedTemplateProps {
  template: Template;
}

const FeaturedTemplate: React.FC<FeaturedTemplateProps> = ({ template }) => (
  <motion.article
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="group relative grid grid-cols-1 overflow-hidden border border-white/10 bg-velocity-black/40 lg:grid-cols-[1.2fr_1fr]"
  >
    {/* Left visual */}
    <div
      className={`relative min-h-[280px] overflow-hidden bg-gradient-to-br ${template.accent} p-10`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="inline-flex w-fit items-center gap-2 border border-velocity-red/40 bg-velocity-black/70 px-3 py-1 font-sans text-[10px] uppercase tracking-widest text-velocity-red backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-pulse bg-velocity-red" />
          Featured
        </div>

        {/* Terminal mockup */}
        <div className="mt-8 border border-white/10 bg-velocity-black/70 backdrop-blur-sm">
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-velocity-red/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
            <span className="ml-2 font-sans text-[10px] uppercase tracking-widest text-zinc-600">
              ~ / velocity
            </span>
          </div>
          <div className="px-4 py-5 font-mono text-sm text-zinc-300">
            <p className="mb-1 flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-velocity-red" />
              <span className="text-velocity-red">$</span> {template.cloneCmd}
            </p>
            <p className="mb-1 text-zinc-500">
              <span className="text-emerald-400">✓</span> Scaffolding {template.name}…
            </p>
            <p className="text-zinc-500">
              <span className="text-emerald-400">✓</span> Installing dependencies…
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Right text */}
    <div className="flex flex-col justify-between gap-6 p-8 md:p-10">
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-3 font-sans text-xs uppercase tracking-widest text-zinc-500">
          <span className="text-velocity-red">{template.category}</span>
          <span className="text-zinc-700">•</span>
          <span>{template.updated}</span>
        </div>
        <h2 className="mb-3 font-sans text-2xl font-bold leading-tight text-white md:text-3xl">
          {template.name}
        </h2>
        <p className="mb-5 font-sans text-sm italic leading-relaxed text-zinc-400">
          {template.tagline}
        </p>
        <p className="mb-5 font-sans text-sm leading-relaxed text-zinc-500">
          {template.description}
        </p>

        <div className="mb-6 flex flex-wrap gap-1.5">
          {template.stack.map((tech) => (
            <span
              key={tech}
              className="border border-white/10 bg-white/5 px-2.5 py-1 font-sans text-[10px] uppercase tracking-widest text-zinc-300"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-5 font-sans text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-velocity-red" /> {template.stars}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <GitFork className="h-3.5 w-3.5 text-velocity-red" /> {template.forks}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={template.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-velocity-red px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-white transition-colors hover:bg-velocity-red/90"
        >
          <Github className="h-4 w-4" />
          Clone repo
          <ArrowUpRight className="h-4 w-4" />
        </a>
        {template.deployUrl && (
          <a
            href={template.deployUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-white/20 px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-zinc-300 transition-colors hover:border-white/40 hover:text-white"
          >
            <Download className="h-4 w-4" />
            Deploy
          </a>
        )}
      </div>
    </div>
  </motion.article>
);

interface TemplateCardProps {
  template: Template;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template }) => (
  <motion.article
    whileHover={{ y: -3 }}
    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
    className="group relative flex h-full flex-col overflow-hidden border border-white/10 bg-velocity-black/40 transition-colors duration-300 hover:border-white/25"
  >
    {/* Preview area */}
    <div
      className={`relative h-36 overflow-hidden bg-gradient-to-br ${template.accent}`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="w-full max-w-[220px] border border-white/10 bg-velocity-black/70 p-3 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-velocity-red/60" />
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500/60" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
          </div>
          <p className="font-mono text-[10px] leading-relaxed text-zinc-400">
            <span className="text-velocity-red">$</span> {template.cloneCmd}
          </p>
        </div>
      </div>
      <div className="absolute right-3 top-3 border border-white/10 bg-velocity-black/70 px-2 py-0.5 font-sans text-[10px] uppercase tracking-widest text-zinc-400 backdrop-blur-sm">
        {template.category}
      </div>
    </div>

    <div className="flex flex-1 flex-col p-5">
      <h3 className="mb-2 font-sans text-base font-bold text-white transition-colors group-hover:text-velocity-red">
        {template.name}
      </h3>
      <p className="mb-3 font-sans text-sm italic leading-relaxed text-zinc-400">
        {template.tagline}
      </p>
      <p className="mb-4 flex-1 font-sans text-sm leading-relaxed text-zinc-500">
        {template.description}
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {template.stack.slice(0, 4).map((tech) => (
          <span
            key={tech}
            className="border border-white/10 bg-white/5 px-2 py-0.5 font-sans text-[10px] uppercase tracking-widest text-zinc-400"
          >
            {tech}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-4 font-sans text-[11px] uppercase tracking-widest text-zinc-500">
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3 w-3" /> {template.stars}
          </span>
          <span className="inline-flex items-center gap-1">
            <GitFork className="h-3 w-3" /> {template.forks}
          </span>
        </span>
        <a
          href={template.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 transition-colors hover:text-white"
        >
          Clone
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  </motion.article>
);

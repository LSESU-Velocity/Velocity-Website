import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  ExternalLink,
  Flame,
  Search,
  Wrench,
} from 'lucide-react';
import { Breadcrumb } from './ResourceDiscounts';

type ToolCategory =
  | 'AI Coding'
  | 'AI Assistants'
  | 'Design'
  | 'Deploy & Backend'
  | 'Automation'
  | 'Project & Docs';

type Pricing = 'Free' | 'Freemium' | 'Paid' | 'BYO API';

interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  oneLiner: string;
  verdict: string;
  bestFor: string;
  pricing: Pricing;
  url: string;
  hot?: boolean;
}

const tools: Tool[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    category: 'AI Coding',
    oneLiner: 'The AI-first code editor built on VS Code.',
    verdict:
      'Our default. Composer mode + agent workflows do 80% of Launchpad coding sessions.',
    bestFor: 'Multi-file refactors, fast MVPs',
    pricing: 'Freemium',
    url: 'https://cursor.com',
    hot: true,
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    category: 'AI Coding',
    oneLiner: "Anthropic's terminal coding agent.",
    verdict:
      'Best when you want an agent that thinks before it edits. Great for gnarly backend work.',
    bestFor: 'Long-running refactors, agent work',
    pricing: 'Paid',
    url: 'https://www.anthropic.com/claude-code',
    hot: true,
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    category: 'AI Coding',
    oneLiner: 'Codeium\'s agent IDE with flow state.',
    verdict: 'Smooth autocomplete and strong in-editor chat. A worthy Cursor alternative.',
    bestFor: 'Pair-programming with an agent',
    pricing: 'Freemium',
    url: 'https://windsurf.com',
  },
  {
    id: 'cline',
    name: 'Cline',
    category: 'AI Coding',
    oneLiner: 'Open-source autonomous coding agent for VS Code.',
    verdict:
      'Open-source and transparent. Bring your own key, so the extension is free but model usage still costs money.',
    bestFor: 'Learning how agents actually work',
    pricing: 'BYO API',
    url: 'https://cline.bot',
  },
  {
    id: 'v0',
    name: 'v0',
    category: 'AI Coding',
    oneLiner: 'Generate shadcn/Tailwind UI from a prompt.',
    verdict:
      'Start every marketing page or dashboard here. Export, drop into your codebase, done.',
    bestFor: 'Landing pages, dashboards',
    pricing: 'Freemium',
    url: 'https://v0.dev',
    hot: true,
  },
  {
    id: 'lovable',
    name: 'Lovable',
    category: 'AI Coding',
    oneLiner: 'Full-stack app generator with Supabase baked in.',
    verdict:
      'Ships a working app in minutes. Great for prototypes — you will outgrow it past PMF.',
    bestFor: 'End-to-end MVPs',
    pricing: 'Freemium',
    url: 'https://lovable.dev',
  },
  {
    id: 'bolt',
    name: 'Bolt.new',
    category: 'AI Coding',
    oneLiner: 'Prompt to full-stack web app, running in the browser.',
    verdict: 'Fastest zero-to-demo we have tried. Deploys with one click.',
    bestFor: 'Hackathons, 30-minute demos',
    pricing: 'Freemium',
    url: 'https://bolt.new',
  },
  {
    id: 'replit-agent',
    name: 'Replit Agent',
    category: 'AI Coding',
    oneLiner: 'Describe an app, Replit builds and hosts it.',
    verdict: 'Friendly for non-technical founders. Shipping on Replit infra is painless.',
    bestFor: 'Non-technical co-founders',
    pricing: 'Freemium',
    url: 'https://replit.com',
  },
  {
    id: 'claude',
    name: 'Claude',
    category: 'AI Assistants',
    oneLiner: "Anthropic's reasoning-first chat model.",
    verdict:
      'Our pick for complex writing and architecture planning. Long context handles entire repos.',
    bestFor: 'System design, long documents',
    pricing: 'Freemium',
    url: 'https://claude.ai',
    hot: true,
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    category: 'AI Assistants',
    oneLiner: 'The most versatile general-purpose model.',
    verdict:
      'Still unbeaten for quick reasoning, image gen, and voice. Plus tier is worth it.',
    bestFor: 'Daily driver, brainstorming',
    pricing: 'Freemium',
    url: 'https://chatgpt.com',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    category: 'AI Assistants',
    oneLiner: 'AI search engine with sources and Pages.',
    verdict:
      'Replaces 90% of Google for research. Still strong for competitive analysis, but the current student plan is discounted rather than free.',
    bestFor: 'Research, competitive analysis',
    pricing: 'Freemium',
    url: 'https://perplexity.ai',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    category: 'AI Assistants',
    oneLiner: "Google's multimodal assistant for text, docs, audio, and video.",
    verdict: 'Huge context, strong video and audio. Best in class for document Q&A.',
    bestFor: 'Long PDFs, video analysis',
    pricing: 'Freemium',
    url: 'https://gemini.google.com',
  },
  {
    id: 'figma',
    name: 'Figma',
    category: 'Design',
    oneLiner: 'The design tool the whole industry uses.',
    verdict:
      'Students can still get Figma Education access. Dev Mode is underrated and pairs well with Cursor.',
    bestFor: 'Product design, handoff',
    pricing: 'Freemium',
    url: 'https://figma.com',
  },
  {
    id: 'framer',
    name: 'Framer',
    category: 'Design',
    oneLiner: 'Visual site builder with AI layouts.',
    verdict: 'What most Velocity founders use for their first landing page.',
    bestFor: 'Launch pages, portfolios',
    pricing: 'Freemium',
    url: 'https://framer.com',
  },
  {
    id: 'webflow',
    name: 'Webflow',
    category: 'Design',
    oneLiner: 'Professional site builder with a CMS.',
    verdict: 'More powerful than Framer, steeper curve. Great once you need a CMS.',
    bestFor: 'Content-heavy marketing sites',
    pricing: 'Freemium',
    url: 'https://webflow.com',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'Deploy & Backend',
    oneLiner: 'Frontend deploys with preview URLs per PR.',
    verdict:
      'Push to Git, see it live. Pairs with v0. The Hobby plan is excellent for student projects, but there is no general student-credit program.',
    bestFor: 'Next.js, React apps',
    pricing: 'Freemium',
    url: 'https://vercel.com',
  },
  {
    id: 'railway',
    name: 'Railway',
    category: 'Deploy & Backend',
    oneLiner: 'One-command deploys for backends and databases.',
    verdict: 'Simplest way to host a Node or Python backend with a Postgres attached.',
    bestFor: 'APIs, workers, databases',
    pricing: 'Freemium',
    url: 'https://railway.app',
  },
  {
    id: 'supabase',
    name: 'Supabase',
    category: 'Deploy & Backend',
    oneLiner: 'Open-source Firebase — Postgres, auth, storage, vectors.',
    verdict: 'Our default for anything with a database. Vector search works well for RAG.',
    bestFor: 'Auth, database, pgvector',
    pricing: 'Freemium',
    url: 'https://supabase.com',
    hot: true,
  },
  {
    id: 'firebase',
    name: 'Firebase',
    category: 'Deploy & Backend',
    oneLiner: "Google's mobile-first BaaS.",
    verdict: 'Still the fastest way to ship a mobile app. Generous free tier.',
    bestFor: 'Mobile apps, realtime data',
    pricing: 'Freemium',
    url: 'https://firebase.google.com',
  },
  {
    id: 'n8n',
    name: 'n8n',
    category: 'Automation',
    oneLiner: 'Self-hostable workflow automation with native LLM nodes.',
    verdict: 'Where we prototype agent workflows before writing real code.',
    bestFor: 'Agent prototyping, cron jobs',
    pricing: 'Freemium',
    url: 'https://n8n.io',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'Automation',
    oneLiner: 'No-code automation across 7,000 apps.',
    verdict: 'Perfect for connecting SaaS tools. AI Actions bring prompts into workflows.',
    bestFor: 'Ops automation, growth hacks',
    pricing: 'Freemium',
    url: 'https://zapier.com',
  },
  {
    id: 'linear',
    name: 'Linear',
    category: 'Project & Docs',
    oneLiner: 'The issue tracker founders actually use.',
    verdict:
      'Fast, opinionated, keyboard-driven. Great if your team wants less process overhead than Jira or Notion.',
    bestFor: 'Sprint planning, triage',
    pricing: 'Freemium',
    url: 'https://linear.app',
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'Project & Docs',
    oneLiner: 'Docs, wikis, and lightweight project tracking.',
    verdict: 'Where every Velocity team writes their spec. Notion AI is actually useful.',
    bestFor: 'Specs, wikis, CRM',
    pricing: 'Freemium',
    url: 'https://notion.com',
  },
  {
    id: 'typeform',
    name: 'Typeform',
    category: 'Project & Docs',
    oneLiner: 'Conversational forms and surveys.',
    verdict: 'Best-looking forms in the market. Use for waitlists and user interviews.',
    bestFor: 'Waitlists, user research',
    pricing: 'Freemium',
    url: 'https://typeform.com',
  },
];

const categoryOrder: ToolCategory[] = [
  'AI Coding',
  'AI Assistants',
  'Design',
  'Deploy & Backend',
  'Automation',
  'Project & Docs',
];

const pricingStyle: Record<Pricing, string> = {
  Free: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  Freemium: 'border-white/15 bg-white/5 text-zinc-300',
  Paid: 'border-velocity-red/30 bg-velocity-red/10 text-velocity-red',
  'BYO API': 'border-sky-500/30 bg-sky-500/10 text-sky-300',
};

export const ResourceTools: React.FC = () => {
  const [filter, setFilter] = useState<'All' | ToolCategory>('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const visible = useMemo(() => {
    const byCategory = filter === 'All' ? tools : tools.filter((t) => t.category === filter);
    const q = query.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter((t) =>
      `${t.name} ${t.oneLiner} ${t.verdict} ${t.bestFor}`.toLowerCase().includes(q)
    );
  }, [filter, query]);

  return (
    <section className="relative z-10 min-h-screen bg-velocity-black px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <Breadcrumb current="Tool Directory" />

        <div className="mx-auto mb-14 max-w-3xl md:text-center">
          <div className="mb-4 inline-flex items-center gap-2 border border-white/10 bg-velocity-black/40 px-3 py-1 font-sans text-xs uppercase tracking-widest text-zinc-400">
            <Wrench className="h-3.5 w-3.5 text-velocity-red" />
            The vibe coding stack
          </div>
          <h1 className="mb-3 font-sans text-3xl font-bold tracking-tight text-white md:text-5xl">
            Tool <span className="text-velocity-red">Directory</span>
          </h1>
          <p className="font-sans text-sm leading-relaxed text-gray-500 md:text-base">
            Every tool on this list is one we use. Pricing and student-perk claims were
            fact-checked in April 2026, so the list stays useful instead of drifting into
            startup folklore.
          </p>
        </div>

        {/* Search + filter bar */}
        <div className="mb-8 flex flex-col gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools, use cases, or categories…"
              className="w-full border border-white/10 bg-velocity-black/40 py-3 pl-11 pr-4 font-sans text-sm text-white placeholder:text-zinc-600 focus:border-velocity-red/40 focus:outline-none"
            />
          </div>

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
        </div>

        {/* Tool grid */}
        {visible.length === 0 ? (
          <div className="border border-white/10 bg-velocity-black/40 p-10 text-center font-sans text-sm text-zinc-500">
            No tools match that search — try a different category or keyword.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        {/* Bottom strip */}
        <div className="mt-20 border border-white/10 bg-velocity-black/40 p-8 md:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="mb-2 font-sans text-xs uppercase tracking-widest text-velocity-red">
                Missing something?
              </p>
              <h3 className="mb-1 font-sans text-xl font-bold text-white md:text-2xl">
                Nominate a tool for the directory.
              </h3>
              <p className="max-w-xl font-sans text-sm leading-relaxed text-zinc-500">
                Tell us what you use, what you shipped with it, and why it beat the
                alternatives. We add reviews every two weeks.
              </p>
            </div>
            <a
              href="mailto:velocity@lsesu.org?subject=Tool nomination"
              className="inline-flex items-center gap-2 border border-white/20 px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-zinc-300 transition-colors hover:border-white/40 hover:text-white"
            >
              Nominate a tool
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

interface ToolCardProps {
  tool: Tool;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const initial = tool.name.trim().charAt(0).toUpperCase();

  return (
    <motion.a
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="group relative flex h-full flex-col overflow-hidden border border-white/10 bg-velocity-black/40 p-6 transition-colors duration-300 hover:border-white/25"
    >
      {tool.hot && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-velocity-red/20 blur-3xl" />
      )}

      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center border border-white/10 bg-gradient-to-br from-white/5 to-transparent font-sans text-base font-bold text-white">
            {initial}
          </div>
          <div>
            <h3 className="flex items-center gap-2 font-sans text-base font-bold text-white transition-colors group-hover:text-velocity-red">
              {tool.name}
              {tool.hot && <Flame className="h-3.5 w-3.5 text-velocity-red" />}
            </h3>
            <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-500">
              {tool.category}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center border px-2 py-0.5 font-sans text-[10px] uppercase tracking-widest ${
            pricingStyle[tool.pricing]
          }`}
        >
          {tool.pricing}
        </span>
      </div>

      <p className="mb-4 font-sans text-sm font-medium leading-snug text-white/90">
        {tool.oneLiner}
      </p>

      <div className="mb-4 border-l-2 border-velocity-red/40 bg-white/[0.02] px-4 py-3">
        <p className="mb-1 font-sans text-[10px] uppercase tracking-widest text-velocity-red">
          Velocity verdict
        </p>
        <p className="font-sans text-sm leading-relaxed text-zinc-300">{tool.verdict}</p>
      </div>

      <div className="mb-5 flex-1 font-sans text-xs leading-relaxed text-zinc-500">
        <span className="mb-1 block text-[10px] uppercase tracking-widest text-zinc-600">
          Best for
        </span>
        {tool.bestFor}
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-4 font-sans text-[11px] uppercase tracking-widest text-zinc-500">
        <span>{tool.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/.*/, '')}</span>
        <span className="inline-flex items-center gap-1 transition-colors group-hover:text-white">
          Open
          <ExternalLink className="h-3.5 w-3.5" />
        </span>
      </div>
    </motion.a>
  );
};

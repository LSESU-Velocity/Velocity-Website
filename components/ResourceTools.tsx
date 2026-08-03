import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Cpu, Flame, Search, Sparkles } from 'lucide-react';
import {
  Breadcrumb,
  CornerTicks,
  Eyebrow,
  HeaderRule,
  MetaRow,
  ResourceFootnote,
} from './resourceUi';

type ToolCategory =
  | 'AI Coding'
  | 'AI Assistants'
  | 'Local LLM'
  | 'Agent Infra'
  | 'Design'
  | 'Deploy & Backend'
  | 'Automation'
  | 'Project & Docs';

type Pricing = 'Free' | 'Freemium' | 'Paid' | 'BYO API' | 'Open Weights';

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
  signal?: 'New' | 'Niche' | 'Local';
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
    id: 'openai-codex',
    name: 'OpenAI Codex',
    category: 'AI Coding',
    oneLiner: 'OpenAI coding agent across app, CLI, IDE, and cloud.',
    verdict:
      'The new default if you already live in ChatGPT. Best for delegated repo work, reviews, and test-fix loops.',
    bestFor: 'Cloud tasks, code review, agent work',
    pricing: 'Freemium',
    url: 'https://developers.openai.com/codex',
    hot: true,
    signal: 'New',
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
    id: 'github-copilot',
    name: 'GitHub Copilot',
    category: 'AI Coding',
    oneLiner: 'The mainstream IDE assistant with autocomplete, chat, and coding-agent workflows.',
    verdict:
      'Still the safest recommendation for students inside GitHub projects. Check Education availability before promising it to a team.',
    bestFor: 'Autocomplete, PRs, GitHub-native work',
    pricing: 'Freemium',
    url: 'https://github.com/features/copilot',
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
    id: 'google-antigravity',
    name: 'Google Antigravity',
    category: 'AI Coding',
    oneLiner: "Google's agentic development platform for Gemini-era app building.",
    verdict:
      'Worth watching if your stack already leans Google. Strongest fit for teams exploring Gemini-native dev workflows.',
    bestFor: 'Gemini workflows, agent experiments',
    pricing: 'Freemium',
    url: 'https://antigravity.google',
    signal: 'New',
  },
  {
    id: 'jules',
    name: 'Jules',
    category: 'AI Coding',
    oneLiner: "Google's asynchronous coding agent for issue-to-PR tasks.",
    verdict:
      'Good for isolated maintenance jobs where you want a background agent, not another chat window.',
    bestFor: 'Bug fixes, repo chores',
    pricing: 'Freemium',
    url: 'https://jules.google',
    signal: 'Niche',
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
    id: 'roo-code',
    name: 'Roo Code',
    category: 'AI Coding',
    oneLiner: 'Open-source VS Code agent with modes, tools, and bring-your-own-model routing.',
    verdict:
      'Use when Cline-style control matters and you want cheaper model routing or local-model experiments.',
    bestFor: 'BYO model coding agents',
    pricing: 'BYO API',
    url: 'https://roocode.com',
    signal: 'Niche',
  },
  {
    id: 'aider',
    name: 'Aider',
    category: 'AI Coding',
    oneLiner: 'Terminal pair-programmer that edits files through Git-aware patches.',
    verdict:
      'Still excellent for small, disciplined changes. Less flashy than agent IDEs, more predictable.',
    bestFor: 'CLI edits, small repos',
    pricing: 'BYO API',
    url: 'https://aider.chat',
    signal: 'Niche',
  },
  {
    id: 'amp',
    name: 'Amp',
    category: 'AI Coding',
    oneLiner: 'Sourcegraph-adjacent coding agent for serious repo navigation and changes.',
    verdict:
      'A niche pick for engineers who prefer a terse, codebase-first workflow over prompt-to-app tools.',
    bestFor: 'Large codebases, precise edits',
    pricing: 'Paid',
    url: 'https://ampcode.com',
    signal: 'Niche',
  },
  {
    id: 'devin',
    name: 'Devin',
    category: 'AI Coding',
    oneLiner: "Cognition's autonomous software engineering agent.",
    verdict:
      'Expensive for students, but useful to understand where fully delegated engineering agents are headed.',
    bestFor: 'Autonomous implementation tasks',
    pricing: 'Paid',
    url: 'https://devin.ai',
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
      'Ships a working app in minutes. Great for prototypes. You will outgrow it past PMF.',
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
    id: 'gemma-4',
    name: 'Gemma 4',
    category: 'Local LLM',
    oneLiner: "Google DeepMind's Apache 2.0 open model family for local agents.",
    verdict:
      'Start here for June 2026 local builds: E2B/E4B for edge, 26B MoE for speed, 31B Dense for quality.',
    bestFor: 'Private assistants, local coding, edge apps',
    pricing: 'Open Weights',
    url: 'https://deepmind.google/models/gemma/',
    hot: true,
    signal: 'Local',
  },
  {
    id: 'gemma-4-12b',
    name: 'Gemma 4 12B',
    category: 'Local LLM',
    oneLiner: 'June 2026 laptop-ready multimodal Gemma with native audio input.',
    verdict:
      'The sweet spot if you want current multimodal reasoning without a workstation-class GPU.',
    bestFor: 'Laptop agents, audio + vision tests',
    pricing: 'Open Weights',
    url: 'https://blog.google/innovation-and-ai/technology/developers-tools/introducing-gemma-4-12B/',
    signal: 'New',
  },
  {
    id: 'qwen3',
    name: 'Qwen3',
    category: 'Local LLM',
    oneLiner: 'Apache 2.0 dense and MoE models with switchable thinking modes.',
    verdict:
      'Run Qwen3-8B for local experiments, then graduate to 30B-A3B when you need better reasoning per token.',
    bestFor: 'Reasoning, multilingual apps',
    pricing: 'Open Weights',
    url: 'https://qwenlm.github.io/blog/qwen3/',
    hot: true,
    signal: 'Local',
  },
  {
    id: 'llama-4-scout',
    name: 'Llama 4 Scout',
    category: 'Local LLM',
    oneLiner: "Meta's open-weight multimodal MoE model with extreme context.",
    verdict:
      'Best for long-context experiments and multimodal prototypes. Check Llama licensing before commercial use.',
    bestFor: 'Long context, multimodal tests',
    pricing: 'Open Weights',
    url: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
    signal: 'Local',
  },
  {
    id: 'deepseek-r1-distill',
    name: 'DeepSeek-R1 Distill',
    category: 'Local LLM',
    oneLiner: 'Reasoning distills from DeepSeek-R1 on Qwen and Llama bases.',
    verdict:
      'Use the 7B, 14B, or 32B distills when you want local reasoning without serving the full MoE model.',
    bestFor: 'Math, coding, reasoning traces',
    pricing: 'Open Weights',
    url: 'https://github.com/deepseek-ai/DeepSeek-R1',
    signal: 'Local',
  },
  {
    id: 'phi-4-reasoning',
    name: 'Phi-4 Reasoning',
    category: 'Local LLM',
    oneLiner: "Microsoft's compact reasoning models for constrained hardware.",
    verdict:
      'Great for education, math, and edge demos where a smaller model needs to reason deliberately.',
    bestFor: 'Math tutors, edge reasoning',
    pricing: 'Open Weights',
    url: 'https://azure.microsoft.com/en-us/blog/one-year-of-phi-small-language-models-making-big-leaps-in-ai/',
    signal: 'Local',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    category: 'Local LLM',
    oneLiner: 'The fastest way to pull and run local models from the terminal.',
    verdict:
      'Use it for demos, prototypes, and local agent backends before investing in a heavier inference stack.',
    bestFor: 'Local model serving',
    pricing: 'Free',
    url: 'https://ollama.com',
    hot: true,
    signal: 'Local',
  },
  {
    id: 'lm-studio',
    name: 'LM Studio',
    category: 'Local LLM',
    oneLiner: 'Desktop app for downloading, chatting with, and serving local models.',
    verdict:
      'The easiest non-terminal path for founders who want to test Gemma, Qwen, Llama, or Phi locally.',
    bestFor: 'No-code local model testing',
    pricing: 'Free',
    url: 'https://lmstudio.ai',
    signal: 'Local',
  },
  {
    id: 'langgraph',
    name: 'LangGraph',
    category: 'Agent Infra',
    oneLiner: 'Graph-based framework for reliable long-running agents.',
    verdict:
      'Use when an agent has state, branches, retries, and human checkpoints. Chatbot glue is not enough anymore.',
    bestFor: 'Durable agent workflows',
    pricing: 'Freemium',
    url: 'https://www.langchain.com/langgraph',
    hot: true,
  },
  {
    id: 'mastra',
    name: 'Mastra',
    category: 'Agent Infra',
    oneLiner: 'TypeScript framework for agents, workflows, evals, and memory.',
    verdict:
      'A good fit for JS-first teams that want agent primitives without pulling in a Python stack.',
    bestFor: 'TypeScript agents',
    pricing: 'Free',
    url: 'https://mastra.ai',
    signal: 'Niche',
  },
  {
    id: 'composio',
    name: 'Composio',
    category: 'Agent Infra',
    oneLiner: 'Tool integrations and auth plumbing for AI agents.',
    verdict:
      'Useful when your agent needs Gmail, Slack, GitHub, Linear, or browser actions without hand-rolling OAuth.',
    bestFor: 'Agent tool integrations',
    pricing: 'Freemium',
    url: 'https://composio.dev',
    signal: 'Niche',
  },
  {
    id: 'browserbase',
    name: 'Browserbase',
    category: 'Agent Infra',
    oneLiner: 'Hosted browsers for web automation and browser-use agents.',
    verdict:
      'Reach for this once Playwright scripts need persistence, proxies, screenshots, or production reliability.',
    bestFor: 'Browser agents, scraping flows',
    pricing: 'Freemium',
    url: 'https://browserbase.com',
    signal: 'Niche',
  },
  {
    id: 'firecrawl',
    name: 'Firecrawl',
    category: 'Agent Infra',
    oneLiner: 'Turns websites into clean markdown and structured data for AI apps.',
    verdict:
      'Excellent for RAG ingestion and competitive research when raw scraping gives your model junk.',
    bestFor: 'RAG ingestion, crawling',
    pricing: 'Freemium',
    url: 'https://firecrawl.dev',
    signal: 'Niche',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    category: 'Agent Infra',
    oneLiner: 'One API for routing across frontier and open models.',
    verdict:
      'Useful for comparing models quickly and avoiding early vendor lock-in. Watch costs and privacy terms.',
    bestFor: 'Model routing, experiments',
    pricing: 'BYO API',
    url: 'https://openrouter.ai',
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
    id: 'grok',
    name: 'Grok',
    category: 'AI Assistants',
    oneLiner: "xAI's assistant with live web and X-native context.",
    verdict:
      'Useful for fast zeitgeist checks and live conversation scanning. Not our first stop for careful source work.',
    bestFor: 'Live web, social context',
    pricing: 'Freemium',
    url: 'https://grok.com',
  },
  {
    id: 'notebooklm',
    name: 'NotebookLM',
    category: 'AI Assistants',
    oneLiner: "Google's source-grounded notebook for documents, links, and study workflows.",
    verdict:
      'The best student-friendly product for turning papers, lecture notes, and docs into usable study material.',
    bestFor: 'Course notes, research packs',
    pricing: 'Freemium',
    url: 'https://notebooklm.google',
    signal: 'Niche',
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
    id: 'rive',
    name: 'Rive',
    category: 'Design',
    oneLiner: 'Interactive motion design tool with runtime-ready animations.',
    verdict:
      'Use when a static logo or Lottie animation is not enough. Great for product polish and app microinteractions.',
    bestFor: 'Interactive animation',
    pricing: 'Freemium',
    url: 'https://rive.app',
    signal: 'Niche',
  },
  {
    id: 'spline',
    name: 'Spline',
    category: 'Design',
    oneLiner: 'Browser-based 3D design and interactive scenes.',
    verdict:
      'Good for quick 3D prototypes and launch visuals when Three.js would be too slow to hand-build.',
    bestFor: '3D landing visuals',
    pricing: 'Freemium',
    url: 'https://spline.design',
    signal: 'Niche',
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
    id: 'neon',
    name: 'Neon',
    category: 'Deploy & Backend',
    oneLiner: 'Serverless Postgres with branching and scale-to-zero.',
    verdict:
      'Perfect when you want real Postgres without running infra. Branching is excellent for preview environments.',
    bestFor: 'Postgres, preview DBs',
    pricing: 'Freemium',
    url: 'https://neon.tech',
    signal: 'Niche',
  },
  {
    id: 'convex',
    name: 'Convex',
    category: 'Deploy & Backend',
    oneLiner: 'Reactive backend platform with TypeScript functions and realtime data.',
    verdict:
      'A strong Firebase alternative for student teams that want typed backend logic without managing servers.',
    bestFor: 'Realtime apps, TS backends',
    pricing: 'Freemium',
    url: 'https://convex.dev',
    signal: 'Niche',
  },
  {
    id: 'cloudflare-workers',
    name: 'Cloudflare Workers',
    category: 'Deploy & Backend',
    oneLiner: 'Edge compute, storage, queues, and AI primitives on Cloudflare.',
    verdict:
      'The pragmatic choice for low-latency APIs and durable edge glue once a Vercel function is too narrow.',
    bestFor: 'Edge APIs, queues, workers',
    pricing: 'Freemium',
    url: 'https://workers.cloudflare.com',
  },
  {
    id: 'fly-io',
    name: 'Fly.io',
    category: 'Deploy & Backend',
    oneLiner: 'Deploy app servers close to users with simple VM primitives.',
    verdict:
      'Great for full-stack apps, websockets, and background workers when serverless starts fighting you.',
    bestFor: 'Persistent servers, websockets',
    pricing: 'Freemium',
    url: 'https://fly.io',
    signal: 'Niche',
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
    oneLiner: 'Open-source Firebase: Postgres, auth, storage, vectors.',
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
    id: 'make',
    name: 'Make',
    category: 'Automation',
    oneLiner: 'Visual workflow automation with richer branching than simple zaps.',
    verdict:
      'Good middle ground for ops-heavy founders who need control without writing a queue worker.',
    bestFor: 'Ops flows, integrations',
    pricing: 'Freemium',
    url: 'https://make.com',
  },
  {
    id: 'gumloop',
    name: 'Gumloop',
    category: 'Automation',
    oneLiner: 'AI-native automation builder for research, enrichment, and repetitive ops.',
    verdict:
      'Niche but useful when a workflow is mostly scraping, classifying, summarizing, and pushing data around.',
    bestFor: 'AI ops, enrichment',
    pricing: 'Freemium',
    url: 'https://gumloop.com',
    signal: 'Niche',
  },
  {
    id: 'pipedream',
    name: 'Pipedream',
    category: 'Automation',
    oneLiner: 'Developer-first workflows with code steps and thousands of integrations.',
    verdict:
      'Best when Zapier is too constrained but a full backend worker would be overkill.',
    bestFor: 'API glue, webhooks',
    pricing: 'Freemium',
    url: 'https://pipedream.com',
    signal: 'Niche',
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
    id: 'granola',
    name: 'Granola',
    category: 'Project & Docs',
    oneLiner: 'AI meeting notes that turn rough calls into clean summaries.',
    verdict:
      'Excellent for customer discovery and investor calls. Still export key decisions into your real project system.',
    bestFor: 'User interviews, meetings',
    pricing: 'Freemium',
    url: 'https://granola.ai',
    signal: 'Niche',
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
  'Local LLM',
  'AI Assistants',
  'Agent Infra',
  'Deploy & Backend',
  'Automation',
  'Design',
  'Project & Docs',
];

const slugForCategory = (category: ToolCategory) =>
  category.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '-');

const categoryFromSlug = (value: string | null) =>
  categoryOrder.find((category) => slugForCategory(category) === value || category === value) ??
  null;

const pricingStyle: Record<Pricing, string> = {
  Free: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  Freemium: 'border-white/15 bg-white/5 text-zinc-300',
  Paid: 'border-velocity-red/30 bg-velocity-red/10 text-velocity-red',
  'BYO API': 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  'Open Weights': 'border-amber-400/30 bg-amber-400/10 text-amber-200',
};

const signalStyle: Record<NonNullable<Tool['signal']>, string> = {
  New: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  Niche: 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200',
  Local: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
};

export const ResourceTools: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedCategory = categoryFromSlug(searchParams.get('category'));
  const [filter, setFilter] = useState<'All' | ToolCategory>(requestedCategory ?? 'All');
  const [query, setQuery] = useState('');
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setFilter(requestedCategory ?? 'All');
  }, [requestedCategory]);

  const counts = useMemo(
    () =>
      categoryOrder.reduce(
        (acc, cat) => ({ ...acc, [cat]: tools.filter((tool) => tool.category === cat).length }),
        {} as Record<ToolCategory, number>
      ),
    []
  );

  const nicheCount = useMemo(
    () => tools.filter((tool) => tool.signal === 'Niche').length,
    []
  );

  const visible = useMemo(() => {
    const byCategory = filter === 'All' ? tools : tools.filter((t) => t.category === filter);
    const q = query.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter((t) =>
      `${t.name} ${t.oneLiner} ${t.verdict} ${t.bestFor}`.toLowerCase().includes(q)
    );
  }, [filter, query]);

  const handleFilterChange = (nextFilter: 'All' | ToolCategory) => {
    setFilter(nextFilter);
    const nextParams = new URLSearchParams(searchParams);

    if (nextFilter === 'All') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', slugForCategory(nextFilter));
    }

    setSearchParams(nextParams, { replace: true });
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <section className="relative z-10 min-h-screen bg-velocity-black px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <Breadcrumb current="Tool Directory" />

        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <Eyebrow>The vibe coding stack</Eyebrow>
              <h1 className="mb-5 font-sans text-4xl font-black tracking-tighter text-white md:text-6xl">
                Tool Directory<span className="text-velocity-red">.</span>
              </h1>
              <p className="max-w-xl font-sans text-sm leading-relaxed text-zinc-500 md:text-base">
                A June 2026 stack for coding agents, local LLMs, agent infra, design,
                deployment, automation, and docs. Each entry has a fast verdict so builders
                can choose without getting lost in launch-week noise.
              </p>
            </div>
            <div className="hidden w-60 flex-shrink-0 flex-col gap-2.5 pb-1 md:flex">
              <MetaRow label="Indexed" value={String(tools.length)} />
              <MetaRow
                label="Local models"
                value={String(counts['Local LLM']).padStart(2, '0')}
              />
              <MetaRow label="Niche picks" value={String(nicheCount).padStart(2, '0')} />
              <MetaRow label="Reviewed" value="Jun 2026" />
            </div>
          </div>
          <HeaderRule className="mt-10" />
        </header>

        {/* Search + filter toolbar */}
        <div className="z-30 mb-10 border-y border-white/10 bg-velocity-black/90 py-4 backdrop-blur-md md:sticky md:top-[72px]">
          <div className="flex flex-col gap-3.5">
            <div className="relative md:max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools, models, use cases…"
                aria-label="Search the tool directory"
                className="w-full border border-white/10 bg-white/[0.02] py-2.5 pl-10 pr-16 font-mono text-xs text-white caret-velocity-red placeholder:text-zinc-600 focus:border-velocity-red/50 focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[10px] tabular-nums text-zinc-600">
                {visible.length}/{tools.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(['All', ...categoryOrder] as const).map((key) => {
                const active = filter === key;
                const count = key === 'All' ? tools.length : counts[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleFilterChange(key)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors ${
                      active
                        ? 'border-velocity-red/50 bg-velocity-red/[0.08] text-white'
                        : 'border-white/10 text-zinc-500 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`h-1 w-1 ${active ? 'bg-velocity-red' : 'bg-zinc-700'}`}
                    />
                    {key}
                    <span
                      className={`tabular-nums ${active ? 'text-velocity-red' : 'text-zinc-700'}`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tool grid */}
        <div ref={resultsRef} className="scroll-mt-40">
          {visible.length === 0 ? (
            <div className="border border-white/10 bg-white/[0.02] p-12 text-center">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">
                No matches
              </p>
              <p className="mb-6 font-sans text-sm text-zinc-600">
                Nothing in the stack matches that search.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  handleFilterChange('All');
                }}
                className="border border-white/15 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:border-white/40 hover:text-white"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((tool, i) => (
                <ToolCard key={tool.id} tool={tool} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Nominate strip */}
        <div className="relative mt-20 overflow-hidden border border-white/10 bg-white/[0.02] p-8 md:p-10">
          <CornerTicks />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-velocity-red">
                Missing something?
              </p>
              <h3 className="mb-2 font-sans text-xl font-bold text-white md:text-2xl">
                Nominate a tool for the directory.
              </h3>
              <p className="max-w-xl font-sans text-sm leading-relaxed text-zinc-500">
                Tell us what you use, what you shipped with it, and why it beat the
                alternatives. We review the stack every month.
              </p>
            </div>
            <a
              href="mailto:velocity@lsesu.org?subject=Tool nomination"
              className="inline-flex flex-shrink-0 items-center gap-2 border border-white/20 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-300 transition-colors hover:border-velocity-red/60 hover:text-white"
            >
              Nominate a tool
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <ResourceFootnote label="Data disclaimer">
          Hosted AI tools can retain prompts, train on inputs, or change terms without
          notice. Don't paste confidential, personal, or proprietary data into tools you
          haven't reviewed. Velocity links these services but isn't responsible for vendor
          incidents, outputs, or policy changes.
        </ResourceFootnote>
      </div>
    </section>
  );
};

interface ToolCardProps {
  tool: Tool;
  index: number;
}

const chipClass =
  'inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]';

const ToolCard: React.FC<ToolCardProps> = ({ tool, index }) => {
  const SignalIcon = tool.signal === 'Local' ? Cpu : Sparkles;
  const domain = tool.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/.*/, '');

  return (
    <motion.a
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className="group relative flex h-full flex-col overflow-hidden border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-colors duration-300 hover:border-velocity-red/40"
    >
      {tool.hot && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-velocity-red/15 blur-3xl" />
      )}

      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="font-mono text-[11px] tabular-nums text-zinc-600 transition-colors group-hover:text-velocity-red">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex flex-shrink-0 flex-wrap justify-end gap-1.5">
          <span className={`${chipClass} ${pricingStyle[tool.pricing]}`}>{tool.pricing}</span>
          {tool.signal && (
            <span className={`${chipClass} ${signalStyle[tool.signal]}`}>
              <SignalIcon className="h-3 w-3" />
              {tool.signal}
            </span>
          )}
        </div>
      </div>

      <h3 className="mb-1 flex items-center gap-2 font-sans text-lg font-bold text-white transition-colors group-hover:text-velocity-red">
        {tool.name}
        {tool.hot && <Flame className="h-3.5 w-3.5 flex-shrink-0 text-velocity-red" />}
      </h3>
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
        {tool.category}
      </p>

      <p className="mb-4 font-sans text-sm font-medium leading-snug text-white/90">
        {tool.oneLiner}
      </p>

      <div className="mb-4 border-l-2 border-velocity-red/50 bg-white/[0.02] py-2.5 pl-3.5 pr-3">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-velocity-red">
          Verdict
        </p>
        <p className="font-sans text-[13px] leading-relaxed text-zinc-300">{tool.verdict}</p>
      </div>

      <p className="mb-5 flex-1 font-sans text-xs leading-relaxed text-zinc-500">
        <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
          Best for
        </span>
        {tool.bestFor}
      </p>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3.5 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-600">
        <span className="truncate normal-case">{domain}</span>
        <span className="inline-flex flex-shrink-0 items-center gap-1 text-zinc-500 transition-colors group-hover:text-white">
          Open
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </motion.a>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Linkedin, Twitter, Facebook } from 'lucide-react';

interface BlogArticle {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  image?: string;
  body: string[];
}

const featuredArticle: BlogArticle = {
  id: 'featured',
  title: 'The Vibe Coding Playbook: How to Ship Faster Without Burning Out',
  excerpt:
    'A practical guide to designing your vibe coding workflow, from idea clarity to weekly shipping rituals.',
  author: 'Velocity Editorial',
  date: 'Mar 12, 2026',
  image:
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80',
  body: [
    'Vibe coding is about creating momentum: short loops, clear prompts, and a stack that reduces friction. The goal is to build “shippable” prototypes quickly without drowning in setup.',
    'Below is a curated list of AI tools and how to use them effectively in a vibe coding workflow. Pair these tools with a crisp prompt and a lightweight spec, then ship a demo before you polish.',
    '1) Cursor — Use Cursor for fast codebase edits and multi-file refactors. Start with a prompt that includes your goal, constraints, and data shape. Ask for a thin MVP, then iterate on UI polish.',
    '2) Lovable — Great for rapid UI scaffolds and landing pages. Provide a brand direction, target user, and one conversion action. Generate the first version, then focus on clarity and layout.',
    '3) ChatGPT / Claude — Best for reasoning, architecture, and prompt‑level logic. Use them to outline flows, data models, and edge cases. Ask for a “happy path” first, then add guardrails.',
    '4) No‑code builders (Glide, Softr, Bubble) — Use AI to draft your schema and screens, then refine in the builder. Focus on the core user journey and automate the rest later.',
    '5) Notion + Airtable — For quick databases. Ask AI to define a minimal table structure and sample rows. Keep it small and expandable.',
    'Vibe coding works when you keep the loop tight: prompt → generate → test → refine. Aim for a demo within 60–90 minutes, then polish in daily sprints.',
  ],
};

const sidebarArticles: BlogArticle[] = [
  {
    id: 's1',
    title: 'Why Vibe Coding Works: The Psychology of Momentum',
    author: 'Rhea Malik',
    date: 'Feb 28, 2026',
    excerpt: 'Momentum beats perfection. Learn the psychology behind fast iteration.',
    body: [
      'Momentum changes how teams make decisions. When progress is visible, you build confidence and clarity.',
      'This article breaks down micro‑wins, fast feedback loops, and how to design your week for shipping.',
    ],
  },
  {
    id: 's2',
    title: 'The 30-Minute MVP: Tight Loops for High Output',
    author: 'Noah Harper',
    date: 'Feb 20, 2026',
    excerpt: 'Build micro‑MVPs in 30 minutes and stack learning fast.',
    body: [
      'A 30‑minute MVP is about ruthless scope: one screen, one action, one insight.',
      'Use prompts to generate the flow, then validate with a demo or quick user test.',
    ],
  },
  {
    id: 's3',
    title: 'Prompt Packs for Product Teams: A New Ritual',
    author: 'Talia Chen',
    date: 'Feb 6, 2026',
    excerpt: 'Create shared prompt packs that align teams and speed up builds.',
    body: [
      'Prompt packs are reusable templates for features, flows, and research tasks.',
      'They reduce decision fatigue and help teams ship consistent experiences.',
    ],
  },
  {
    id: 's4',
    title: 'From Idea to Interface: Vibe Coding for Designers',
    author: 'Elena Park',
    date: 'Jan 30, 2026',
    excerpt: 'Designers can drive the loop by prompting for UI variations and flows.',
    body: [
      'Vibe coding helps designers test UX faster with quick prototypes and AI‑assisted layouts.',
      'Start with structure and hierarchy, then iterate on polish.',
    ],
  },
  {
    id: 's5',
    title: 'Shipping With Friends: The Network Effect of Accountability',
    author: 'David Kline',
    date: 'Jan 24, 2026',
    excerpt: 'Accountability turns ideas into products. Build with your peers.',
    body: [
      'Small accountability circles keep timelines tight and feedback frequent.',
      'Pair up weekly to demo progress and unblock each other.',
    ],
  },
];

const gridArticles: BlogArticle[] = [
  {
    id: 'g1',
    title: 'Vibe Coding for Research Projects',
    excerpt:
      'Turn messy notes into structured product experiments with lightweight AI workflows.',
    author: 'Velocity Editorial',
    date: 'Feb 10, 2026',
    image:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
    body: [
      'Research projects benefit from quick prototypes. Start by summarising the problem and desired outcome.',
      'Use AI to generate possible flows, then ship a rough demo to validate assumptions.',
    ],
  },
  {
    id: 'g2',
    title: 'How to Run a Vibe Coding Sprint',
    excerpt:
      'A 5-day sprint template for student teams building real products fast.',
    author: 'Aliyah Gomez',
    date: 'Feb 3, 2026',
    image:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    body: [
      'A five‑day sprint can deliver a demo and user feedback in a single week.',
      'Day 1: prompt and plan. Day 2–3: build. Day 4: test. Day 5: polish and ship.',
    ],
  },
  {
    id: 'g3',
    title: 'Vibe Coding Stack: Tools That Keep You Shipping',
    excerpt:
      'The lean stack for fast experimentation: prompts, no-code, and lightweight analytics.',
    author: 'Jonas Reid',
    date: 'Jan 18, 2026',
    image:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
    body: [
      'Keep your stack lean: prompts, a no‑code builder, and a simple analytics layer.',
      'Add complexity only after you’ve validated the core workflow.',
    ],
  },
  {
    id: 'g4',
    title: 'How to Turn a Lecture Into an App',
    excerpt:
      'Capture a course insight, define the workflow, and ship an MVP in a weekend.',
    author: 'Velocity Editorial',
    date: 'Jan 10, 2026',
    image:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    body: [
      'Great apps start with real needs. Translate lecture insights into a concrete user problem.',
      'Build a minimal interface and validate with classmates.',
    ],
  },
  {
    id: 'g5',
    title: 'The Vibe Coding Checklist',
    excerpt:
      'Use this checklist to keep your builds focused, fast, and fun.',
    author: 'Rhea Malik',
    date: 'Jan 5, 2026',
    image:
      'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
    body: [
      'Use this checklist to keep shipping: define the outcome, choose a stack, build a demo, get feedback, iterate.',
      'Vibe coding is consistency over perfection.',
    ],
  },
  {
    id: 'g6',
    title: 'Make It Real: Demo-First Product Building',
    excerpt:
      'Why demos drive clarity, and how to build your next feature around a live walkthrough.',
    author: 'Noah Harper',
    date: 'Dec 22, 2025',
    image:
      'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1200&q=80',
    body: [
      'Demos clarify product decisions. Build the smallest demo that proves the value.',
      'Then use the demo to align your team and stakeholders.',
    ],
  },
];

export const Blog: React.FC = () => {
  const [activeArticle, setActiveArticle] = useState<BlogArticle | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const allArticles = useMemo(
    () => [featuredArticle, ...sidebarArticles, ...gridArticles],
    []
  );

  const openArticle = (article: BlogArticle) => {
    setActiveArticle(article);
  };

  const shareUrl = (article: BlogArticle) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/blog#${article.id}`;
  };

  const shareText = (article: BlogArticle) =>
    `${article.title} — Velocity Blog`;

  const openShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="relative z-10 py-32 px-6 bg-velocity-black min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 md:text-center max-w-3xl mx-auto">
          <h1 className="font-sans font-bold text-3xl md:text-4xl tracking-tight text-white mb-2">
            <span className="text-velocity-red">Blog</span>
          </h1>
          <p className="font-sans text-gray-500 text-sm md:text-base leading-relaxed">
            Stories, frameworks, and prompts to help you master vibe coding and ship faster.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8">
          {/* Featured article */}
          <article
            className="border border-white/10 bg-velocity-black/40 overflow-hidden transition-colors duration-300 hover:border-white/20 cursor-pointer"
            onClick={() => openArticle(featuredArticle)}
          >
            <div className="aspect-[16/9] w-full overflow-hidden">
              <img
                src={featuredArticle.image}
                alt={featuredArticle.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 md:p-8">
              <h2 className="font-sans font-bold text-2xl text-white mb-3">
                {featuredArticle.title}
              </h2>
              <p className="font-sans text-sm text-zinc-500 leading-relaxed mb-4">
                {featuredArticle.excerpt}
              </p>
              <div className="flex items-center gap-3 font-sans text-xs text-zinc-500 uppercase tracking-widest">
                <span>{featuredArticle.author}</span>
                <span className="text-zinc-700">•</span>
                <span>{featuredArticle.date}</span>
              </div>
            </div>
          </article>

          {/* Sidebar list */}
          <aside className="border border-white/10 bg-velocity-black/40 p-6 md:p-8">
            <h3 className="font-sans font-bold text-white mb-5">Featured Posts</h3>
            <div className="space-y-5">
              {sidebarArticles.map((item) => (
                <button
                  type="button"
                  onClick={() => openArticle(item)}
                  key={item.id}
                  className="w-full text-left border-b border-white/5 pb-4 last:border-b-0 last:pb-0 hover:text-white transition-colors"
                >
                  <p className="font-sans text-sm text-white mb-2">
                    {item.title}
                  </p>
                  <div className="flex items-center justify-between font-sans text-xs text-zinc-500">
                    <span>{item.author}</span>
                    <span>{item.date}</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </div>

        {/* Article grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gridArticles.map((article) => (
            <article
              key={article.id}
              className="border border-white/10 bg-velocity-black/40 overflow-hidden transition-colors duration-300 hover:border-white/20 cursor-pointer"
              onClick={() => openArticle(article)}
            >
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h4 className="font-sans font-bold text-white mb-2">
                  {article.title}
                </h4>
                <p className="font-sans text-sm text-zinc-500 leading-relaxed mb-4">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between font-sans text-xs text-zinc-500 uppercase tracking-widest">
                  <span>{article.author}</span>
                  <span>{article.date}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Article modal */}
      <AnimatePresence>
        {activeArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-28 bg-black/80 backdrop-blur-sm"
            onClick={() => setActiveArticle(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-3xl max-h-[calc(100vh-8rem)] overflow-y-auto border border-white/10 bg-velocity-black p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-sans font-bold text-2xl text-white mb-2">
                    {activeArticle.title}
                  </h2>
                  <div className="flex items-center gap-3 font-sans text-xs text-zinc-500 uppercase tracking-widest">
                    <span>{activeArticle.author}</span>
                    <span className="text-zinc-700">•</span>
                    <span>{activeArticle.date}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveArticle(null)}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors focus:outline-none rounded"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {activeArticle.image && (
                <div className="aspect-[16/9] w-full overflow-hidden border border-white/10 mb-6">
                  <img
                    src={activeArticle.image}
                    alt={activeArticle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-4">
                {activeArticle.body.map((paragraph, idx) => (
                  <p key={idx} className="font-sans text-sm text-zinc-400 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-8 border-t border-white/10 pt-5">
                <div className="flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-zinc-500 mb-3">
                  <Share2 className="w-4 h-4" />
                  Share
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openShare(
                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                          shareText(activeArticle)
                        )}&url=${encodeURIComponent(shareUrl(activeArticle))}`
                      )
                    }
                    className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest px-4 py-2.5 border border-white/30 text-zinc-400 hover:text-white hover:border-white/50 transition-colors focus:outline-none"
                  >
                    <Twitter className="w-4 h-4" />
                    X / Twitter
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openShare(
                        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                          shareUrl(activeArticle)
                        )}`
                      )
                    }
                    className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest px-4 py-2.5 border border-white/30 text-zinc-400 hover:text-white hover:border-white/50 transition-colors focus:outline-none"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openShare(
                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                          shareUrl(activeArticle)
                        )}`
                      )
                    }
                    className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest px-4 py-2.5 border border-white/30 text-zinc-400 hover:text-white hover:border-white/50 transition-colors focus:outline-none"
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

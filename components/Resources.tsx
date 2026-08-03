import React, { useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Cpu, Lock } from 'lucide-react';
import {
  liveResourceCatalog,
  resourceCatalog,
  type ResourceDefinition,
} from '../lib/resourceCatalog';
import {
  CornerTicks,
  Eyebrow,
  HeaderRule,
  MetaRow,
  ResourceFootnote,
  SectionLabel,
} from './resourceUi';

const lockedResources = resourceCatalog.filter((resource) => resource.status === 'locked');

export const Resources: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [featured, ...rest] = liveResourceCatalog;

  return (
    <section className="relative z-10 min-h-screen bg-velocity-black px-6 py-32">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-14">
          <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <Eyebrow>The Velocity library</Eyebrow>
              <h1 className="mb-5 font-sans text-5xl font-black tracking-tighter text-white md:text-6xl lg:text-7xl">
                Resources<span className="text-velocity-red">.</span>
              </h1>
              <p className="max-w-xl font-sans text-sm leading-relaxed text-zinc-500 md:text-base">
                June 2026 perks, AI tools, local models, and launch support for LSE students
                shipping real products.
              </p>
            </div>
            <div className="hidden w-60 flex-shrink-0 flex-col gap-2.5 pb-1 md:flex">
              <MetaRow
                label="Sections"
                value={String(resourceCatalog.length).padStart(2, '0')}
              />
              <MetaRow
                label="Live"
                value={String(liveResourceCatalog.length).padStart(2, '0')}
              />
              <MetaRow label="Reviewed" value="Jun 2026" />
            </div>
          </div>
          <HeaderRule />
        </header>

        {/* Featured entry */}
        {featured && <FeatureCard category={featured} />}

        {/* Remaining live entries as index rows */}
        {rest.length > 0 && (
          <div className="mt-5 flex flex-col gap-4">
            {rest.map((category, i) => (
              <IndexRow key={category.id} category={category} index={i + 2} />
            ))}
          </div>
        )}

        {/* Local LLM banner */}
        <Link to="/resources/tools?category=local-llm" className="group mt-10 block">
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className="relative overflow-hidden border border-amber-300/20 bg-amber-300/[0.03] p-6 transition-colors duration-300 hover:border-amber-300/40 md:p-7"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_30%,rgba(251,191,36,0.1),transparent_40%)]" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-5">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center border border-amber-300/25 bg-amber-300/10">
                  <Cpu className="h-5 w-5 text-amber-200" />
                </div>
                <div>
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-amber-200">
                    New this month
                  </p>
                  <h3 className="mb-1.5 font-sans text-lg font-bold text-white md:text-xl">
                    Local LLM tab
                  </h3>
                  <p className="max-w-2xl font-sans text-sm leading-relaxed text-zinc-500">
                    Gemma 4, Gemma 4 12B, Qwen3, Llama 4 Scout, DeepSeek-R1 distills, Phi-4
                    Reasoning, Ollama, and LM Studio in one filtered view.
                  </p>
                </div>
              </div>
              <span className="inline-flex flex-shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 transition-colors group-hover:text-amber-100">
                Open local models
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </div>
          </motion.div>
        </Link>

        {/* In-prep entries */}
        {lockedResources.length > 0 && (
          <>
            <SectionLabel className="mb-5 mt-16">In prep</SectionLabel>
            <div className="flex flex-col gap-3">
              {lockedResources.map((category, i) => (
                <IndexRow
                  key={category.id}
                  category={category}
                  index={rest.length + 2 + i}
                  locked
                />
              ))}
            </div>
          </>
        )}

        {/* Contribute strip */}
        <div className="relative mt-20 overflow-hidden border border-white/10 bg-white/[0.02] p-8 md:p-10">
          <CornerTicks />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-velocity-red">
                Contribute
              </p>
              <h3 className="mb-2 font-sans text-xl font-bold text-white md:text-2xl">
                Built something worth sharing?
              </h3>
              <p className="max-w-xl font-sans text-sm leading-relaxed text-zinc-500">
                Submit your project, a tool you swear by, or a template your team uses.
                We'll credit you and add it to the library.
              </p>
            </div>
            <a
              href="mailto:velocity@lsesu.org?subject=Resource submission"
              className="inline-flex flex-shrink-0 items-center gap-2 bg-velocity-red px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-velocity-red/90"
            >
              Submit a resource
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <ResourceFootnote>
          Velocity curates third-party tools, models, and perks but doesn't operate or audit
          them. Review each provider's terms and data practices before sharing sensitive or
          personal data: external services are used at your own risk.
        </ResourceFootnote>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  category: ResourceDefinition;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ category }) => {
  const Icon = category.icon;
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <Link to={category.path} className="group block">
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        whileHover={{ y: -3 }}
        onMouseMove={handleMouseMove}
        className="relative grid cursor-pointer grid-cols-1 overflow-hidden border border-white/10 bg-white/[0.02] transition-colors duration-300 hover:border-velocity-red/40 lg:grid-cols-[1.1fr_1fr]"
      >
        <CornerTicks />
        <motion.div
          className="pointer-events-none absolute -inset-px z-10 opacity-0 transition duration-500 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`radial-gradient(480px circle at ${mouseX}px ${mouseY}px, rgba(255,31,31,0.07), transparent 80%)`,
          }}
        />

        {/* Visual panel */}
        <div className="relative min-h-[280px] overflow-hidden p-8 md:p-10 lg:border-r lg:border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,31,31,0.14),transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:36px_36px]" />

          <div className="relative flex h-full flex-col justify-between gap-12">
            <div className="inline-flex w-fit items-center gap-2 border border-velocity-red/30 bg-velocity-black/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-velocity-red backdrop-blur-sm">
              <span className="h-1.5 w-1.5 bg-velocity-red" />
              Start here
            </div>

            <div className="flex items-end justify-between gap-6">
              <div className="relative">
                <span className="select-none font-mono text-[96px] font-bold leading-none text-white/[0.05] md:text-[120px]">
                  001
                </span>
                <div className="absolute bottom-3 left-1 flex h-14 w-14 items-center justify-center border border-white/15 bg-velocity-black/70 backdrop-blur-sm">
                  <Icon className="h-6 w-6 text-velocity-red" />
                </div>
              </div>
              <div className="hidden flex-col items-end gap-1.5 text-right font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 sm:flex">
                <span>{category.count}</span>
                <span className="text-zinc-700">Reviewed Jun 2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* Text panel */}
        <div className="relative flex flex-col justify-between gap-8 p-8 md:p-10">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em]">
              <span className="text-velocity-red">{category.eyebrow}</span>
              <span aria-hidden className="h-px w-6 bg-white/15" />
              <span className="text-zinc-500">{category.count}</span>
            </div>
            <h2 className="mb-4 font-sans text-2xl font-black tracking-tight text-white md:text-3xl">
              {category.title}
            </h2>
            <p className="mb-5 font-sans text-sm leading-relaxed text-zinc-400">
              {category.tagline}
            </p>
            <p className="font-sans text-sm leading-relaxed text-zinc-500">
              {category.description}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-300 transition-colors group-hover:text-white">
            <span className="relative">
              Open the directory
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-velocity-red transition-transform duration-300 group-hover:scale-x-100"
              />
            </span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
        </div>
      </motion.article>
    </Link>
  );
};

interface IndexRowProps {
  category: ResourceDefinition;
  index: number;
  locked?: boolean;
}

const IndexRow: React.FC<IndexRowProps> = ({ category, index, locked = false }) => {
  const Icon = category.icon;

  return (
    <Link to={category.path} className="group block">
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`grid grid-cols-[auto_1fr_auto] items-center gap-5 border bg-white/[0.02] p-5 transition-colors duration-300 md:grid-cols-[56px_44px_1fr_auto] md:gap-7 md:p-6 ${
          locked
            ? 'border-white/5 hover:border-white/20'
            : 'border-white/10 hover:border-velocity-red/40'
        }`}
      >
        <span
          className={`font-mono text-xs tabular-nums transition-colors ${
            locked ? 'text-zinc-700' : 'text-zinc-600 group-hover:text-velocity-red'
          }`}
        >
          {String(index).padStart(3, '0')}
        </span>
        <div
          className={`hidden h-11 w-11 items-center justify-center border md:flex ${
            locked ? 'border-white/5 bg-white/[0.01]' : 'border-white/10 bg-white/[0.03]'
          }`}
        >
          <Icon className={`h-[18px] w-[18px] ${locked ? 'text-zinc-600' : 'text-velocity-red'}`} />
        </div>
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3
              className={`font-sans text-lg font-bold transition-colors md:text-xl ${
                locked
                  ? 'text-zinc-400 group-hover:text-zinc-200'
                  : 'text-white group-hover:text-velocity-red'
              }`}
            >
              {category.title}
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              {category.count}
            </span>
          </div>
          <p
            className={`truncate font-sans text-sm leading-relaxed ${
              locked ? 'text-zinc-600' : 'text-zinc-500'
            }`}
          >
            {category.tagline}
          </p>
        </div>
        {locked ? (
          <span className="inline-flex flex-shrink-0 items-center gap-1.5 border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            <Lock className="h-3 w-3" />
            In prep
          </span>
        ) : (
          <span className="inline-flex flex-shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 transition-colors group-hover:text-white">
            <span className="hidden sm:inline">Open</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        )}
      </motion.article>
    </Link>
  );
};

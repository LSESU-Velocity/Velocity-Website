import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Layers } from 'lucide-react';
import { liveResourceCatalog, type ResourceDefinition } from '../lib/resourceCatalog';

export const Resources: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const categories = liveResourceCatalog;
  const [featured, ...rest] = categories;
  const primaryGrid = rest.slice(0, 2);
  const secondaryGrid = rest.slice(2);

  return (
    <section className="relative z-10 min-h-screen bg-velocity-black px-6 py-32">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto mb-14 max-w-3xl md:text-center">
          <div className="mb-4 inline-flex items-center gap-2 border border-white/10 bg-velocity-black/40 px-3 py-1 font-sans text-xs uppercase tracking-widest text-zinc-400">
            <Layers className="h-3.5 w-3.5 text-velocity-red" />
            The Velocity library
          </div>
          <h1 className="mb-3 font-sans text-3xl font-bold tracking-tight text-white md:text-5xl">
            <span className="text-velocity-red">Resources</span>
          </h1>
          <p className="font-sans text-sm leading-relaxed text-gray-500 md:text-base">
            Practical perks, tools, and launch support for LSE students shipping real
            products.
          </p>
        </div>

        {/* Featured card */}
        {featured && <FeatureCard category={featured} />}

        {/* Grid of remaining */}
        {primaryGrid.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
            {primaryGrid.map((category) => (
              <CategoryCard key={category.id} category={category} size="large" />
            ))}
          </div>
        )}

        {secondaryGrid.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {secondaryGrid.map((category) => (
              <CategoryCard key={category.id} category={category} size="large" />
            ))}
          </div>
        )}

        {/* Footer strip */}
        <div className="mt-20 border border-white/10 bg-velocity-black/40 p-8 md:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="mb-2 font-sans text-xs uppercase tracking-widest text-velocity-red">
                Contribute
              </p>
              <h3 className="mb-1 font-sans text-xl font-bold text-white md:text-2xl">
                Built something worth sharing?
              </h3>
              <p className="max-w-xl font-sans text-sm leading-relaxed text-zinc-500">
                Submit your project, a tool you swear by, or a template your team uses —
                we'll credit you and add it to the library.
              </p>
            </div>
            <a
              href="mailto:velocity@lsesu.org?subject=Resource submission"
              className="inline-flex items-center gap-2 bg-velocity-red px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-white transition-colors hover:bg-velocity-red/90"
            >
              Submit a resource
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  category: ResourceDefinition;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ category }) => {
  const Icon = category.icon;
  return (
    <Link to={category.path}>
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        whileHover={{ y: -3 }}
        className="group relative grid cursor-pointer grid-cols-1 overflow-hidden border border-white/10 bg-velocity-black/40 transition-colors duration-300 hover:border-velocity-red/40 lg:grid-cols-[1.2fr_1fr]"
      >
        {/* Left visual column */}
        <div className="relative min-h-[260px] overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(216,45,45,0.18),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.05),transparent_55%)] p-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />

          {/* Floating icon */}
          <div className="relative flex h-full flex-col justify-between">
            <div className="inline-flex w-fit items-center gap-2 border border-white/10 bg-velocity-black/70 px-3 py-1 font-sans text-[10px] uppercase tracking-widest text-velocity-red backdrop-blur-sm">
              <span className="h-1.5 w-1.5 bg-velocity-red" />
              Start here
            </div>

            <div className="mt-10 flex items-end justify-between">
              <div className="flex h-24 w-24 items-center justify-center border border-white/10 bg-velocity-black/60 backdrop-blur-sm md:h-28 md:w-28">
                <Icon className="h-10 w-10 text-velocity-red md:h-12 md:w-12" />
              </div>
              <div className="hidden flex-col items-end gap-1 text-right font-sans text-[10px] uppercase tracking-widest text-zinc-500 md:flex">
                <span>{category.count}</span>
                <span className="text-zinc-700">Updated weekly</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right text column */}
        <div className="flex flex-col justify-between gap-6 p-8 md:p-10">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3 font-sans text-xs uppercase tracking-widest text-zinc-500">
              <span className="text-velocity-red">{category.eyebrow}</span>
              <span className="text-zinc-700">•</span>
              <span>{category.count}</span>
            </div>
            <h2 className="mb-3 font-sans text-2xl font-bold leading-tight text-white md:text-3xl">
              {category.title}
            </h2>
            <p className="mb-6 font-sans text-sm italic leading-relaxed text-zinc-400">
              {category.tagline}
            </p>
            <p className="font-sans text-sm leading-relaxed text-zinc-500">
              {category.description}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-zinc-300 transition-colors group-hover:text-white">
            Open library
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </motion.article>
    </Link>
  );
};

interface CategoryCardProps {
  category: ResourceDefinition;
  size?: 'large' | 'default';
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, size = 'default' }) => {
  const Icon = category.icon;

  return (
    <Link to={category.path}>
      <motion.article
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        className="group relative flex h-full cursor-pointer flex-col overflow-hidden border border-white/10 bg-velocity-black/40 p-7 transition-colors duration-300 hover:border-white/25"
      >
        {/* Subtle grid */}
        <div className="pointer-events-none absolute inset-0 opacity-50 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* Accent corner */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-velocity-red/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="relative flex flex-1 flex-col">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center border border-white/10 bg-velocity-black/60">
              <Icon className="h-5 w-5 text-velocity-red" />
            </div>
            <span className="font-sans text-[10px] uppercase tracking-widest text-zinc-600">
              {category.count}
            </span>
          </div>

          <p className="mb-2 font-sans text-[11px] uppercase tracking-widest text-velocity-red">
            {category.eyebrow}
          </p>
          <h3
            className={`mb-2 font-sans font-bold text-white transition-colors group-hover:text-velocity-red ${
              size === 'large' ? 'text-xl md:text-2xl' : 'text-lg'
            }`}
          >
            {category.title}
          </h3>
          <p className="mb-5 font-sans text-sm italic leading-relaxed text-zinc-400">
            {category.tagline}
          </p>
          <p className="mb-6 flex-1 font-sans text-sm leading-relaxed text-zinc-500">
            {category.description}
          </p>

          <div className="flex items-center justify-between border-t border-white/5 pt-4 font-sans text-[11px] uppercase tracking-widest text-zinc-500">
            <span>Open</span>
            <span className="inline-flex items-center gap-1 transition-colors group-hover:text-white">
              View all
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
};

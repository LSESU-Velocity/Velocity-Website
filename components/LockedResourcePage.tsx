import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, LockKeyhole } from 'lucide-react';

interface LockedResourcePageProps {
  resourceLabel: string;
}

export const LockedResourcePage: React.FC<LockedResourcePageProps> = ({
  resourceLabel,
}) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="relative z-10 min-h-screen bg-velocity-black px-6 py-32">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/resources"
          className="mb-10 inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-zinc-500 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to resources
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="overflow-hidden border border-white/10 bg-velocity-black/40"
        >
          <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(216,45,45,0.16),transparent_58%)] px-8 py-10 md:px-12 md:py-14">
            <div className="mb-6 inline-flex items-center gap-2 border border-white/10 bg-velocity-black/70 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.28em] text-velocity-red">
              <LockKeyhole className="h-3.5 w-3.5" />
              Locked Resource
            </div>
            <h1 className="max-w-2xl font-sans text-3xl font-bold tracking-tight text-white md:text-5xl">
              {resourceLabel} is built, but not publicly released yet.
            </h1>
            <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-zinc-400 md:text-base">
              This page is intentionally hidden for now. The route is live in the app,
              but public access is locked until you decide to launch it.
            </p>
          </div>

          <div className="grid gap-6 px-8 py-8 md:grid-cols-[1.2fr_0.8fr] md:px-12 md:py-10">
            <div>
              <p className="mb-3 font-sans text-xs uppercase tracking-[0.24em] text-zinc-500">
                What happens now
              </p>
              <p className="font-sans text-sm leading-relaxed text-zinc-400">
                Visitors can still reach this URL directly, but they cannot access the
                unreleased content. Only currently released resources remain visible in
                the main navigation and the resources index.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to="/resources"
                className="inline-flex items-center justify-center gap-2 bg-velocity-red px-5 py-3 font-sans text-xs uppercase tracking-[0.24em] text-white transition-colors hover:bg-velocity-red/90"
              >
                Explore live resources
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 border border-white/10 px-5 py-3 font-sans text-xs uppercase tracking-[0.24em] text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
              >
                Return home
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

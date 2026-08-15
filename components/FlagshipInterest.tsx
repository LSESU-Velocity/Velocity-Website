import React, { useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight, X } from 'lucide-react';
import { FLAGSHIP_INTEREST_FORM_URL } from '../lib/eventsCatalog';

/**
 * Flagship-events interest capture: a site-wide announcement banner plus a
 * modal embedding the interest Google Form. The modal is driven by the
 * `interest=1` search param so any page (banner, event rail, external links
 * like an Instagram bio) can open it, and closing it never loses the route.
 */

export const INTEREST_PARAM = 'interest';

/** Height of the fixed banner; the navbar offsets itself by the same amount. */
export const BANNER_HEIGHT_CLASS = 'h-8';

export const useInterestModal = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const isOpen = searchParams.get(INTEREST_PARAM) === '1';

  const open = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(INTEREST_PARAM, '1');
      return next;
    });
  }, [setSearchParams]);

  const close = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(INTEREST_PARAM);
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  return { isOpen, open, close };
};

export const FlagshipInterestBanner: React.FC = () => {
  const { open } = useInterestModal();

  return (
    <button
      type="button"
      onClick={open}
      className={`fixed inset-x-0 top-0 z-[60] flex ${BANNER_HEIGHT_CLASS} items-center justify-center gap-2.5 border-b border-velocity-red/30 bg-[#160404] px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-300 transition-colors hover:bg-[#2b0909] hover:text-white`}
    >
      <span className="h-1.5 w-1.5 flex-none animate-pulse rounded-full bg-velocity-red" aria-hidden />
      <span className="hidden sm:inline">Global Build · SheBuilds 2027</span>
      <span className="hidden text-zinc-600 sm:inline" aria-hidden>
        —
      </span>
      <span className="truncate">Register your interest</span>
      <ArrowUpRight className="h-3 w-3 flex-none text-velocity-red" aria-hidden />
    </button>
  );
};

export const FlagshipInterestModal: React.FC = () => {
  const { isOpen, close } = useInterestModal();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      restoreFocusRef.current?.focus?.();
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[80] overflow-y-auto bg-black/85 backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Register your interest"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="mx-auto my-6 w-[min(100%-1.5rem,44rem)] border border-white/10 bg-velocity-black md:my-12"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
              Flagship events · 2027
            </p>
            <h2 className="mt-1 font-sans text-xl font-bold tracking-tight text-white">
              Register your <span className="text-velocity-red">interest</span>
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Close interest form"
            className="flex-none border border-white/10 p-2 text-zinc-400 transition-colors hover:border-white/25 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Inverted so the white Google Form reads as dark-on-dark with the site */}
        <iframe
          src={`${FLAGSHIP_INTEREST_FORM_URL}?embedded=true`}
          title="Register your interest — Global Build London and SheBuilds"
          className="block h-[70vh] min-h-[24rem] w-full border-0 bg-velocity-black"
          style={{ filter: 'invert(1) hue-rotate(180deg)', colorScheme: 'light' }}
        >
          Loading…
        </iframe>

        <p className="border-t border-white/10 px-6 py-3 font-sans text-[11px] leading-relaxed text-zinc-600">
          Global Build London · SheBuilds — non-binding expression of interest, takes 30
          seconds. Not event registration.
        </p>
      </motion.div>
    </motion.div>
  );
};

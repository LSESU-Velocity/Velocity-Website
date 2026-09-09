import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, X } from 'lucide-react';
import { FLAGSHIP_INTEREST_FORM_URL } from '../lib/eventsCatalog';
import { lockBodyScroll } from '../lib/bodyScrollLock';
import { GoogleInterestForm } from './GoogleInterestForm';

export const INTEREST_PARAM = 'interest';

/** Height of the fixed banner; the navbar offsets itself by the same amount. */
export const BANNER_HEIGHT_CLASS = 'h-8';

/** Preserve the underlying route, event, campaign params, hash and route state. */
export const useInterestModal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isOpen = new URLSearchParams(location.search).get(INTEREST_PARAM) === '1';

  const open = useCallback((event?: React.MouseEvent<HTMLElement>) => {
    if (isOpen) return;
    // Safari doesn't focus buttons on pointer clicks. Explicitly focus the
    // trigger so closing the dialog restores focus consistently in every engine.
    event?.currentTarget.focus({ preventScroll: true });
    const search = new URLSearchParams(location.search);
    search.set(INTEREST_PARAM, '1');
    navigate({ pathname: location.pathname, search: search.toString(), hash: location.hash }, {
      state: location.state,
      preventScrollReset: true,
    });
  }, [isOpen, location, navigate]);

  const close = useCallback(() => {
    const search = new URLSearchParams(location.search);
    search.delete(INTEREST_PARAM);
    navigate({ pathname: location.pathname, search: search.toString(), hash: location.hash }, {
      replace: true,
      state: location.state,
      preventScrollReset: true,
    });
  }, [location, navigate]);

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
      <span className="h-1.5 w-1.5 flex-none animate-pulse rounded-full bg-velocity-red motion-reduce:animate-none" aria-hidden />
      <span className="hidden sm:inline">Global Build · SheBuilds 2027</span>
      <span className="hidden text-zinc-600 sm:inline" aria-hidden>—</span>
      <span className="truncate">Register your interest</span>
      <ArrowUpRight className="h-3 w-3 flex-none text-velocity-red" aria-hidden />
    </button>
  );
};

export const FlagshipInterestModal: React.FC = () => {
  const { isOpen, close } = useInterestModal();
  return isOpen ? <InterestDialog onClose={close} /> : null;
};

const InterestDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const helpLinkRef = useRef<HTMLAnchorElement>(null);
  const backdropPressRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const unlock = lockBodyScroll();
    // Native modal focus containment also handles the cross-origin iframe.
    // Keep a working fallback for browsers/webviews without showModal.
    const nativeModal = typeof dialog.showModal === 'function';
    if (nativeModal) dialog.showModal();
    else dialog.setAttribute('open', '');

    const root = document.getElementById('root');
    const previousAriaHidden = root?.getAttribute('aria-hidden') ?? null;
    const previousInert = root?.hasAttribute('inert') ?? false;
    root?.setAttribute('inert', '');
    root?.setAttribute('aria-hidden', 'true');
    closeButtonRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.contains(event.target)) {
        closeButtonRef.current?.focus({ preventScroll: true });
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', containFocus);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', containFocus);
      if (nativeModal && dialog.open) dialog.close();
      else dialog.removeAttribute('open');
      if (!previousInert) root?.removeAttribute('inert');
      if (previousAriaHidden === null) root?.removeAttribute('aria-hidden');
      else root?.setAttribute('aria-hidden', previousAriaHidden);
      unlock();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [onClose]);

  // A body portal escapes transformed/stacking ancestors. This form must be
  // visible immediately, without an animation or the homepage loader finishing.
  return createPortal(
    <dialog
      ref={dialogRef}
      role="dialog"
      className="interest-modal fixed inset-0 z-[80] m-0 h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-black/85 p-3 text-white"
      aria-modal="true"
      aria-labelledby="interest-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onPointerDown={(event) => { backdropPressRef.current = event.target === event.currentTarget; }}
      onClick={(event) => {
        if (event.target === event.currentTarget && backdropPressRef.current) onClose();
        backdropPressRef.current = false;
      }}
    >
      <span tabIndex={0} onFocus={() => helpLinkRef.current?.focus()} className="sr-only" />
      <div className="interest-modal-panel flex w-full max-w-[44rem] flex-col overflow-hidden border border-white/10 bg-velocity-black">
        <div className="flex flex-none items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">Flagship events · 2027</p>
            <h2 id="interest-title" className="mt-1 font-sans text-xl font-bold tracking-tight text-white">
              Register your <span className="text-velocity-red">interest</span>
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close interest form"
            className="flex h-11 w-11 flex-none items-center justify-center border border-white/10 text-zinc-300 transition-colors hover:border-white/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-velocity-red"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <GoogleInterestForm url={FLAGSHIP_INTEREST_FORM_URL} title="Register your interest — Global Build London and SheBuilds" />
        <p className="flex-none border-t border-white/10 px-4 py-2 font-sans text-[11px] leading-relaxed text-zinc-400 sm:px-6 sm:py-3">
          Global Build London · SheBuilds — non-binding expression of interest. Not event registration.{' '}
          <a ref={helpLinkRef} href="mailto:velocity@lsesu.org" className="text-zinc-300 underline underline-offset-2 hover:text-white">Need help? Email us</a>
        </p>
      </div>
      <span tabIndex={0} onFocus={() => closeButtonRef.current?.focus()} className="sr-only" />
    </dialog>,
    document.body,
  );
};

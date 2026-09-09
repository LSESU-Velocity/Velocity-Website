import React, { useEffect, useState } from 'react';
import { ArrowUpRight, RotateCw } from 'lucide-react';

const LOAD_TIMEOUT_MS = 12_000;
type LoadState = 'loading' | 'settled' | 'slow' | 'error';

interface GoogleInterestFormProps {
  url: string;
  title: string;
}

/** Keep a normal link available even after `load`: browsers also fire it for
 * blocked/error iframe documents, and Google doesn't expose a readiness API.
 * Never inspect cross-origin content or automatically reload someone's answers.
 */
export const GoogleInterestForm: React.FC<GoogleInterestFormProps> = ({ url, title }) => {
  return <FormForUrl key={url} url={url} title={title} />;
};

const FormForUrl: React.FC<GoogleInterestFormProps> = ({ url, title }) => {
  const [attempt, setAttempt] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [offline, setOffline] = useState(() => navigator.onLine === false);
  const directUrl = new URL(url);
  directUrl.searchParams.delete('embedded');
  const embeddedUrl = new URL(directUrl);
  embeddedUrl.searchParams.set('embedded', 'true');

  useEffect(() => {
    if (loadState !== 'loading') return;
    const timer = window.setTimeout(() => setLoadState('slow'), LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [loadState, attempt]);

  useEffect(() => {
    const updateConnection = () => setOffline(navigator.onLine === false);
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);

  const message = offline
    ? 'You appear to be offline. Reconnect, then retry if the form is blank.'
    : loadState === 'loading'
      ? 'Loading the form… You can also open it directly.'
      : loadState === 'slow'
        ? 'The form is taking longer than expected. Retry or open it directly.'
        : loadState === 'error'
          ? 'The embedded form could not load. Retry or open it directly.'
          : 'Form blank or asking you to sign in? Open it directly.';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-none border-b border-white/10 bg-velocity-black px-4 py-3 sm:px-6">
        <p role="status" className="font-sans text-xs leading-relaxed text-zinc-300">{message}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 font-sans text-xs">
          <a
            href={directUrl.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 font-semibold text-white underline decoration-velocity-red underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-velocity-red"
          >
            Open form in new tab <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </a>
          <a href={directUrl.href} className="inline-flex min-h-9 items-center text-zinc-300 underline underline-offset-4 hover:text-white">
            Open in this tab
          </a>
          <button
            type="button"
            onClick={() => {
              setLoadState('loading');
              setAttempt((value) => value + 1);
            }}
            className="inline-flex min-h-9 items-center gap-1.5 text-zinc-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-velocity-red"
          >
            <RotateCw className="h-3 w-3" aria-hidden /> Retry form
          </button>
        </div>
        <p className="mt-1 font-sans text-[11px] leading-relaxed text-zinc-400">
          Opening or retrying starts a new form; unsent answers may not carry over.
        </p>
      </div>
      <iframe
        key={attempt}
        src={embeddedUrl.href}
        title={title}
        loading="eager"
        className="block min-h-0 w-full flex-1 border-0 bg-white [color-scheme:light]"
        onLoad={() => setLoadState('settled')}
        onError={() => setLoadState('error')}
      />
    </div>
  );
};

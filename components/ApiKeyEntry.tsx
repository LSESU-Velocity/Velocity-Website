import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, ExternalLink, Shield, X } from 'lucide-react';
import { detectKeyProvider, PROVIDER_LABELS } from '../lib/api';

interface ApiKeyEntryProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (apiKey: string, remember: boolean) => void;
}

const providers = [
    {
        name: 'Gemini',
        status: 'Keys start with AIza, includes live web research',
        keyUrl: 'https://aistudio.google.com/apikey',
        keyUrlLabel: 'Google AI Studio',
    },
    {
        name: 'OpenAI',
        status: 'Keys start with sk-',
        keyUrl: 'https://platform.openai.com/api-keys',
        keyUrlLabel: 'OpenAI Platform',
    },
    {
        name: 'Anthropic',
        status: 'Keys start with sk-ant-',
        keyUrl: 'https://console.anthropic.com/settings/keys',
        keyUrlLabel: 'Anthropic Console',
    },
];

export const ApiKeyEntry: React.FC<ApiKeyEntryProps> = ({
    isOpen,
    onClose,
    onSubmit,
}) => {
    const [apiKey, setApiKey] = useState('');
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const prefersReducedMotion = useReducedMotion();
    const still = Boolean(prefersReducedMotion);

    // The input must not autoFocus: it would steal focus during commit, before
    // this effect can record which element opened the dialog, so closing could
    // never hand focus back. Capture the opener first, then focus the input.
    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement as HTMLElement | null;
            // setTimeout rather than rAF: rAF never fires in hidden tabs, so
            // a modal opened there would mount without moving focus.
            const timer = window.setTimeout(() => (inputRef.current ?? dialogRef.current)?.focus(), 0);
            return () => window.clearTimeout(timer);
        }
        if (previousFocusRef.current) {
            previousFocusRef.current.focus();
            previousFocusRef.current = null;
        }
    }, [isOpen]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
            return;
        }
        if (e.key === 'Tab' && dialogRef.current) {
            const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmed = apiKey.trim();
        if (!trimmed) {
            setError('Please paste a Gemini, OpenAI, or Anthropic API key');
            return;
        }

        setError(null);
        onSubmit(trimmed, remember);
        setApiKey('');
    };

    const detectedProvider = apiKey.trim() ? PROVIDER_LABELS[detectKeyProvider(apiKey)] : null;

    // Rendered conditionally rather than through AnimatePresence: an exit that
    // fails to resolve leaves these two fixed overlays swallowing every click
    // on the page behind them. Closing has to be immediate and total.
    if (!isOpen) {
        return null;
    }

    return (
        <>
            <motion.div
                initial={still ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                aria-hidden
                className="fixed inset-0 z-50 bg-black/85"
            />

            <motion.div
                initial={still ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                onClick={(event) => {
                    // This wrapper sits above the backdrop, so outside clicks
                    // land here: only a direct hit (not the panel) closes.
                    if (event.target === event.currentTarget) {
                        onClose();
                    }
                }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
            >
                <div
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="api-key-dialog-title"
                    onKeyDown={handleKeyDown}
                    tabIndex={-1}
                    className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto border border-white/15 bg-velocity-black p-5 outline-none md:p-7"
                >
                    <div className="flex items-start justify-between gap-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                            Model access <span className="text-velocity-red">//</span> BYOK
                        </p>
                        <button
                            onClick={onClose}
                            aria-label="Close dialog"
                            className="flex-shrink-0 border border-white/15 p-2 text-zinc-400 transition-colors hover:border-white/35 hover:text-white"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <h2 id="api-key-dialog-title" className="mt-5 font-sans text-2xl font-bold tracking-tight text-white">
                        Connect a model<span className="text-velocity-red">.</span>
                    </h2>
                    <p className="mt-3 font-sans text-sm leading-relaxed text-zinc-400">
                        Paste a Gemini, OpenAI, or Anthropic key. Launchpad detects the provider automatically and uses your key to run the analysis.
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-px border border-white/10 bg-white/10 sm:grid-cols-3">
                        {providers.map((provider) => (
                            <a
                                key={provider.name}
                                href={provider.keyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`group min-w-0 p-3 transition-colors ${detectedProvider === provider.name
                                    ? 'bg-velocity-darkRed/30'
                                    : 'bg-velocity-black hover:bg-white/[0.03]'
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className={`font-mono text-[11px] uppercase tracking-[0.16em] ${detectedProvider === provider.name ? 'text-white' : 'text-zinc-300'}`}>
                                        {provider.name}
                                    </span>
                                    {detectedProvider === provider.name ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-velocity-red" />
                                    ) : (
                                        <ExternalLink className="h-3 w-3 flex-shrink-0 text-zinc-600 transition-colors group-hover:text-velocity-red" />
                                    )}
                                </div>
                                <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-zinc-500">{provider.status}</p>
                            </a>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="mt-5">
                        <label htmlFor="launchpad-api-key" className="sr-only">
                            AI provider API key
                        </label>
                        <input
                            id="launchpad-api-key"
                            type="password"
                            value={apiKey}
                            onChange={(e) => {
                                setApiKey(e.target.value);
                                setError(null);
                            }}
                            placeholder="Paste your API key"
                            className={`w-full border bg-black px-4 py-3 font-mono text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-velocity-red ${error ? 'border-velocity-red' : 'border-white/15'
                                }`}
                            ref={inputRef}
                            autoComplete="off"
                        />
                        {detectedProvider && (
                            <p className="mt-2 font-sans text-[11px] leading-relaxed text-zinc-500">
                                Detected provider: <span className="text-white">{detectedProvider}</span>
                                {detectedProvider !== 'Gemini' && '. Live web research runs on Gemini keys only; other providers skip it.'}
                            </p>
                        )}

                        <label className="mt-4 flex cursor-pointer items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-zinc-300">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className="h-3.5 w-3.5 flex-shrink-0 appearance-none border border-white/25 bg-black outline-none transition-colors checked:border-velocity-red checked:bg-velocity-red focus-visible:border-velocity-red"
                            />
                            Remember on this device
                        </label>

                        {error && (
                            <motion.div
                                initial={still ? false : { opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 flex items-center gap-2 font-sans text-xs text-velocity-red"
                            >
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={!apiKey.trim()}
                            className="group mt-5 flex w-full items-center justify-center gap-3 border border-velocity-red/50 bg-velocity-darkRed/20 px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.24em] text-white transition-colors duration-300 hover:border-velocity-red hover:bg-velocity-red disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-zinc-600"
                        >
                            Continue
                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:transform-none" />
                        </button>
                    </form>

                    <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
                        <div className="flex items-start gap-2 text-zinc-500">
                            <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-500" />
                            <p className="font-sans text-[11px] leading-relaxed">
                                Your key stays in this browser unless you choose device storage. It is sent to Launchpad only to run the model request and is not stored on Velocity servers.
                            </p>
                        </div>
                        <p className="font-sans text-[10px] leading-relaxed text-zinc-400">
                            Provider terms, billing, data handling, and regional rules still apply. UK, EEA, and Swiss users may need a billing-enabled Google Cloud project for Gemini keys.{' '}
                            <Link
                                to="/launchpad/privacy-security"
                                onClick={onClose}
                                className="underline transition-colors hover:text-zinc-400"
                            >
                                Privacy and security
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

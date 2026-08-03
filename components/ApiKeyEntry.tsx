import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, ExternalLink, Key, Shield, X } from 'lucide-react';
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
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement as HTMLElement | null;
            requestAnimationFrame(() => dialogRef.current?.focus());
        } else if (previousFocusRef.current) {
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

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.5 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6"
                    >
                        <div
                            ref={dialogRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="api-key-dialog-title"
                            onKeyDown={handleKeyDown}
                            tabIndex={-1}
                            className="relative w-full max-w-lg bg-white/[0.02] border border-white/10 p-6 md:p-8 shadow-2xl overflow-hidden backdrop-blur-md rounded-xl outline-none max-h-[90vh] overflow-y-auto"
                        >
                            <button
                                onClick={onClose}
                                aria-label="Close dialog"
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all z-20 rounded-md"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="relative z-10">
                                <div className="flex justify-center mb-6">
                                    <div className="p-4 border bg-velocity-red/10 border-velocity-red/30 text-velocity-red rounded-lg">
                                        <Key className="w-8 h-8" />
                                    </div>
                                </div>

                                <h2 id="api-key-dialog-title" className="font-sans font-bold text-2xl text-center text-white mb-2 tracking-tight">
                                    Connect a model provider
                                </h2>
                                <p className="font-sans text-sm text-gray-400 text-center mb-6">
                                    Paste a Gemini, OpenAI, or Anthropic key. Launchpad detects the provider automatically and uses your key to run the analysis.
                                </p>

                                <div className="mb-5 grid gap-2 sm:grid-cols-3">
                                    {providers.map((provider) => (
                                        <a
                                            key={provider.name}
                                            href={provider.keyUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`rounded-lg border p-3 transition-colors hover:border-velocity-red/50 hover:bg-velocity-red/10 ${detectedProvider === provider.name
                                                ? 'border-velocity-red/60 bg-velocity-red/10 text-white'
                                                : 'border-white/10 bg-black/20 text-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-sans text-sm font-semibold">{provider.name}</span>
                                                {detectedProvider === provider.name ? (
                                                    <CheckCircle2 className="h-4 w-4 text-velocity-red" />
                                                ) : (
                                                    <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
                                                )}
                                            </div>
                                            <p className="mt-1 font-sans text-[11px] text-gray-500">{provider.status}</p>
                                        </a>
                                    ))}
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="relative">
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
                                            className={`w-full px-4 py-3 bg-black/30 border ${error ? 'border-red-500' : 'border-white/10'
                                                } text-white placeholder-gray-500 focus:outline-none focus:border-velocity-red transition-colors font-mono text-sm rounded-md`}
                                            autoFocus
                                            autoComplete="off"
                                        />
                                        {detectedProvider && (
                                            <p className="mt-2 font-sans text-[11px] text-gray-400">
                                                Detected provider: <span className="text-white">{detectedProvider}</span>
                                                {detectedProvider !== 'Gemini' && '. Live web research runs on Gemini keys only; other providers skip it.'}
                                            </p>
                                        )}
                                    </div>

                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={remember}
                                            onChange={(e) => setRemember(e.target.checked)}
                                            className="w-4 h-4 rounded border-white/20 bg-black/30 text-velocity-red focus:ring-velocity-red/50"
                                        />
                                        <span className="font-sans text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                                            Remember on this device
                                        </span>
                                    </label>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-2 text-red-400 font-sans text-xs"
                                        >
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            {error}
                                        </motion.div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={!apiKey.trim()}
                                        className="w-full py-3 bg-velocity-darkRed/20 border-2 border-velocity-red/50 hover:bg-velocity-red hover:border-velocity-red disabled:bg-gray-800 disabled:border-gray-700 disabled:cursor-not-allowed text-white font-sans text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,31,31,0.15)] hover:shadow-[0_0_40px_rgba(255,31,31,0.4)] rounded-md"
                                    >
                                        Continue <ArrowRight className="h-4 w-4" />
                                    </button>
                                </form>

                                <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
                                    <div className="flex items-start gap-2 text-gray-500">
                                        <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500/70" />
                                        <p className="font-sans text-[11px] leading-relaxed">
                                            Your key stays in this browser unless you choose device storage. It is sent to Launchpad only to run the model request and is not stored on Velocity servers.
                                        </p>
                                    </div>
                                    <p className="font-sans text-[10px] leading-relaxed text-gray-600">
                                        Provider terms, billing, data handling, and regional rules still apply. UK, EEA, and Swiss users may need a billing-enabled Google Cloud project for Gemini keys.{' '}
                                        <Link
                                            to="/launchpad/privacy-security"
                                            onClick={onClose}
                                            className="underline hover:text-gray-400 transition-colors"
                                        >
                                            Privacy and security
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

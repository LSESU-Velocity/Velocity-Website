import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, X, AlertCircle, Shield, ExternalLink } from 'lucide-react';

interface ApiKeyEntryProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (apiKey: string, remember: boolean) => void;
}

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
            setError('Please enter your Google AI Studio API key');
            return;
        }

        setError(null);
        onSubmit(trimmed, remember);
        setApiKey('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
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
                            className="relative w-full max-w-md bg-white/[0.02] border border-white/10 p-8 shadow-2xl overflow-hidden backdrop-blur-md rounded-xl outline-none"
                        >

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                aria-label="Close dialog"
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all z-20 rounded-md"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="relative z-10">
                                {/* Icon */}
                                <div className="flex justify-center mb-6">
                                    <div className="p-4 border bg-velocity-red/10 border-velocity-red/30 text-velocity-red rounded-lg">
                                        <Key className="w-8 h-8" />
                                    </div>
                                </div>

                                {/* Title */}
                                <h2 id="api-key-dialog-title" className="font-sans font-bold text-2xl text-center text-white mb-2 tracking-tight">
                                    Enter Your Gemini API Key
                                </h2>
                                <p className="font-sans text-sm text-gray-400 text-center mb-6">
                                    Bring your own key to run Launchpad analyses.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Key Input */}
                                    <div className="relative">
                                        <label htmlFor="launchpad-api-key" className="sr-only">
                                            Google AI Studio API key
                                        </label>
                                        <input
                                            id="launchpad-api-key"
                                            type="password"
                                            value={apiKey}
                                            onChange={(e) => {
                                                setApiKey(e.target.value);
                                                setError(null);
                                            }}
                                            placeholder="Paste your Gemini API key"
                                            className={`w-full px-4 py-3 bg-black/30 border ${error ? 'border-red-500' : 'border-white/10'
                                                } text-white placeholder-gray-500 focus:outline-none focus:border-velocity-red transition-colors font-mono text-sm rounded-md`}
                                            autoFocus
                                            autoComplete="off"
                                        />
                                    </div>

                                    {/* Remember checkbox */}
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={remember}
                                            onChange={(e) => setRemember(e.target.checked)}
                                            className="w-4 h-4 rounded border-white/20 bg-black/30 text-velocity-red focus:ring-velocity-red/50"
                                        />
                                        <span className="font-sans text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                                            Remember on this device (stored in browser only)
                                        </span>
                                    </label>

                                    {/* Error Message */}
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

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={!apiKey.trim()}
                                        className="w-full py-3 bg-velocity-darkRed/20 border-2 border-velocity-red/50 hover:bg-velocity-red hover:border-velocity-red disabled:bg-gray-800 disabled:border-gray-700 disabled:cursor-not-allowed text-white font-sans text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,31,31,0.15)] hover:shadow-[0_0_40px_rgba(255,31,31,0.4)] rounded-md"
                                    >
                                        Continue
                                    </button>
                                </form>

                                {/* Trust & Transparency */}
                                <div className="mt-6 space-y-3">
                                    <div className="flex items-start gap-2 text-gray-500">
                                        <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500/70" />
                                        <p className="font-sans text-[11px] leading-relaxed">
                                            Your key is sent to Launchpad only to authorize your Gemini request. We do not persist or log the raw key, and it stays in your browser session unless you opt into device storage above.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-2 text-gray-500">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500/70" />
                                        <p className="font-sans text-[11px] leading-relaxed">
                                            Your startup idea is sent to Google Gemini for processing. Analyses are not stored on our servers.
                                        </p>
                                    </div>
                                </div>

                                {/* Get a key link */}
                                <p className="font-sans text-gray-500 text-xs text-center mt-6 leading-relaxed">
                                    Don&apos;t have a key?{' '}
                                    <a
                                        href="https://aistudio.google.com/apikey"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-gray-300 transition-colors inline-flex items-center gap-1"
                                    >
                                        Get one free from Google AI Studio <ExternalLink className="w-3 h-3 inline" />
                                    </a>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Loader2, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface InviteCodeLoginProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (key: string) => Promise<{ valid: boolean; error?: string }>;
}

export const InviteCodeLogin: React.FC<InviteCodeLoginProps> = ({
    isOpen,
    onClose,
    onLogin,
}) => {
    const [key, setKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!key.trim()) {
            setError('Please enter your access key');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await onLogin(key.trim());

            if (result.valid) {
                setSuccess(true);
                // Close after brief success animation
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setKey('');
                }, 1000);
            } else {
                setError(result.error || 'Invalid access key');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setIsLoading(false);
        }
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
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
                    >
                        <div className="relative bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl p-8 shadow-2xl">
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <motion.div
                                    animate={success ? { scale: [1, 1.2, 1] } : {}}
                                    className={`p-4 rounded-full ${success
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-velocity-red/20 text-velocity-red'
                                        }`}
                                >
                                    {success ? (
                                        <CheckCircle2 className="w-8 h-8" />
                                    ) : (
                                        <Key className="w-8 h-8" />
                                    )}
                                </motion.div>
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl font-bold text-center text-white mb-2">
                                {success ? 'Access Granted!' : 'Enter Access Key'}
                            </h2>
                            <p className="text-gray-400 text-center mb-6">
                                {success
                                    ? 'Welcome to Launchpad'
                                    : 'Enter your invite key to access Launchpad'}
                            </p>

                            {!success && (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Key Input */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={key}
                                            onChange={(e) => {
                                                setKey(e.target.value);
                                                setError(null);
                                            }}
                                            placeholder="VEL-XXXX-XXXX"
                                            disabled={isLoading}
                                            className={`w-full px-4 py-3 bg-black/50 border ${error ? 'border-red-500' : 'border-white/10'
                                                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-velocity-red transition-colors font-mono text-center text-lg tracking-wider`}
                                            autoFocus
                                        />
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-2 text-red-400 text-sm justify-center"
                                        >
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </motion.div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isLoading || !key.trim()}
                                        className="w-full py-3 bg-velocity-red hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Validating...
                                            </>
                                        ) : (
                                            'Access Launchpad'
                                        )}
                                    </button>
                                </form>
                            )}

                            {/* Footer */}
                            <p className="text-gray-500 text-xs text-center mt-6">
                                Don't have a key? Contact the Velocity team
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Package } from "lucide-react";

interface BlackMarketProps {
    isOpen: boolean;
    onClose: () => void;
    karma: number;
    onSpendKarma: (amount: number) => boolean | Promise<boolean>;
}

/**
 * Main Black Market gacha modal
 */
export function BlackMarket({ isOpen, onClose, karma }: BlackMarketProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed inset-4 z-[101] flex items-center justify-center pointer-events-none"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        {/* Soft ambient glow */}
                        <div className="absolute -inset-4 bg-cyber-danger/10 opacity-40 blur-2xl rounded-full" />
                        <div
                            className="relative w-full max-w-lg max-h-[80vh] glass-panel overflow-hidden pointer-events-auto flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/40">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold uppercase tracking-[0.2em] text-cyber-danger">
                                        Black Market
                                    </span>
                                    <div className="px-3 py-1 rounded-full bg-cyber-accent/10 border border-cyber-accent/20">
                                        <span className="text-xs text-cyber-accent font-mono">
                                            {karma} 力
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full glass-input text-white/50 hover:text-cyber-danger transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Content Placeholder */}
                            <div className="flex-1 p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
                                <Package size={48} className="text-cyber-danger mb-6 opacity-40 animate-float" />
                                <h3 className="text-lg font-bold uppercase tracking-[0.2em] text-white/90 mb-3">Encrypted Payload</h3>
                                <p className="text-sm text-white/50 max-w-[280px] leading-relaxed">
                                    The syndicate is currently decrypting exotic aesthetics. Gather more karma points in the meantime.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}



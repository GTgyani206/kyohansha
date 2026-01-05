"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Package } from "lucide-react";

import { GachaCard } from "./GachaCard";
import { Inventory } from "./Inventory";
import { useGacha, type GachaPullResult } from "@/hooks/useGacha";
import { PULL_COST, RARITY_CONFIG, type GachaItem } from "@/lib/gacha";

type ViewMode = "summon" | "inventory";

interface BlackMarketProps {
    isOpen: boolean;
    onClose: () => void;
    karma: number;
    onSpendKarma: (amount: number) => boolean;
}

/**
 * Main Black Market gacha modal
 */
export function BlackMarket({ isOpen, onClose, karma, onSpendKarma }: BlackMarketProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("summon");
    const [isPulling, setIsPulling] = useState(false);
    const [pullResult, setPullResult] = useState<GachaPullResult | null>(null);
    const [showGlitch, setShowGlitch] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const { pullGacha, getOwnedItems, equippedSkin, equipSkin } = useGacha();

    const canPull = karma >= PULL_COST && !isPulling;

    const handlePull = useCallback(() => {
        if (!canPull) return;

        // Deduct karma first
        const success = onSpendKarma(PULL_COST);
        if (!success) return;

        setIsPulling(true);
        setPullResult(null);
        setShowGlitch(true);

        // Glitch animation phase
        setTimeout(() => {
            setShowGlitch(false);
            // Perform the actual pull
            const result = pullGacha();
            setPullResult(result);
        }, 800);

        // Reset after reveal
        setTimeout(() => {
            setIsPulling(false);
        }, 2000);
    }, [canPull, onSpendKarma, pullGacha]);

    const handlePlayVoice = useCallback((item: GachaItem) => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        audioRef.current = new Audio(item.assetUrl);
        audioRef.current.play().catch(() => {
            // Audio play failed (asset doesn't exist for MVP)
            console.log("Voice preview:", item.name);
        });
    }, []);

    const handleDismissResult = useCallback(() => {
        setPullResult(null);
    }, []);

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
                        <div
                            className="w-full max-w-lg max-h-[80vh] bg-[#0a0a0a] border border-[#ff003c]/30 rounded-xl overflow-hidden pointer-events-auto flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-[#ff003c]/20">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm uppercase tracking-[0.2em] text-[#ff003c]">
                                        Black Market
                                    </span>
                                    <div className="px-2 py-1 rounded bg-[#00ff41]/10 border border-[#00ff41]/30">
                                        <span className="text-xs text-[#00ff41] font-mono">
                                            {karma} 力
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1 rounded hover:bg-white/5 transition-colors"
                                >
                                    <X size={18} className="text-gray-500" />
                                </button>
                            </div>

                            {/* View toggle */}
                            <div className="flex border-b border-[#ff003c]/20">
                                <button
                                    onClick={() => setViewMode("summon")}
                                    className={`flex-1 py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${viewMode === "summon"
                                            ? "text-[#ff003c] border-b-2 border-[#ff003c]"
                                            : "text-gray-500 hover:text-gray-300"
                                        }`}
                                >
                                    <Sparkles size={14} />
                                    Summon
                                </button>
                                <button
                                    onClick={() => setViewMode("inventory")}
                                    className={`flex-1 py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${viewMode === "inventory"
                                            ? "text-[#ff003c] border-b-2 border-[#ff003c]"
                                            : "text-gray-500 hover:text-gray-300"
                                        }`}
                                >
                                    <Package size={14} />
                                    Inventory ({getOwnedItems().length})
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-hidden p-4">
                                {viewMode === "summon" ? (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                                        {/* Glitch animation overlay */}
                                        <AnimatePresence>
                                            {showGlitch && (
                                                <motion.div
                                                    className="absolute inset-0 z-10 flex items-center justify-center"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                >
                                                    <GlitchEffect />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Pull result card */}
                                        <AnimatePresence mode="wait">
                                            {pullResult ? (
                                                <motion.div
                                                    key="result"
                                                    className="flex flex-col items-center gap-4"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                >
                                                    <GachaCard
                                                        item={pullResult.item}
                                                        isNew={pullResult.isNew}
                                                        isRevealing
                                                    />
                                                    <motion.button
                                                        onClick={handleDismissResult}
                                                        className="px-4 py-2 text-xs uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: 1.5 }}
                                                    >
                                                        Tap to continue
                                                    </motion.button>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="summon"
                                                    className="flex flex-col items-center gap-6"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                >
                                                    {/* Summon button */}
                                                    <motion.button
                                                        onClick={handlePull}
                                                        disabled={!canPull}
                                                        className={`relative px-8 py-4 rounded-lg border-2 text-sm uppercase tracking-[0.2em] font-bold transition-all ${canPull
                                                                ? "border-[#ff003c] text-[#ff003c] hover:bg-[#ff003c]/10 hover:shadow-[0_0_30px_rgba(255,0,60,0.3)]"
                                                                : "border-gray-700 text-gray-600 cursor-not-allowed"
                                                            }`}
                                                        whileHover={canPull ? { scale: 1.05 } : {}}
                                                        whileTap={canPull ? { scale: 0.98 } : {}}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <Sparkles size={16} />
                                                            Summon
                                                        </span>
                                                    </motion.button>

                                                    <div className="text-xs text-gray-500">
                                                        Cost: <span className="text-[#00ff41]">{PULL_COST} 力</span>
                                                    </div>

                                                    {karma < PULL_COST && (
                                                        <div className="text-xs text-[#ff003c]">
                                                            Not enough Karma. Send more messages to earn!
                                                        </div>
                                                    )}

                                                    {/* Drop rates info */}
                                                    <div className="mt-4 p-3 rounded border border-gray-800 bg-black/30">
                                                        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
                                                            Drop Rates
                                                        </div>
                                                        <div className="flex gap-4 text-xs">
                                                            {(["COMMON", "RARE", "LEGENDARY"] as const).map((rarity) => (
                                                                <div key={rarity} className="flex items-center gap-1">
                                                                    <div
                                                                        className="w-2 h-2 rounded-full"
                                                                        style={{ backgroundColor: RARITY_CONFIG[rarity].color }}
                                                                    />
                                                                    <span style={{ color: RARITY_CONFIG[rarity].color }}>
                                                                        {RARITY_CONFIG[rarity].label}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <Inventory
                                        items={getOwnedItems()}
                                        equippedSkin={equippedSkin}
                                        onEquipSkin={equipSkin}
                                        onPlayVoice={handlePlayVoice}
                                    />
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/**
 * Matrix-style glitch effect during pull
 */
function GlitchEffect() {
    return (
        <motion.div
            className="text-[#00ff41] font-mono text-xl opacity-80"
            animate={{
                opacity: [0.3, 1, 0.5, 1, 0.3],
                y: [0, -5, 5, -3, 0],
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
        >
            <div className="flex flex-col items-center gap-1">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.15, delay: i * 0.1, repeat: 2 }}
                        className="tracking-[0.5em]"
                    >
                        {Array(12)
                            .fill(0)
                            .map(() => (Math.random() > 0.5 ? "1" : "0"))
                            .join("")}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

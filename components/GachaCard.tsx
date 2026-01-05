"use client";

import { motion } from "framer-motion";
import { type GachaItem, RARITY_CONFIG } from "@/lib/gacha";

interface GachaCardProps {
    item: GachaItem;
    isNew?: boolean;
    isRevealing?: boolean;
    onRevealComplete?: () => void;
}

/**
 * Individual gacha card with rarity effects
 */
export function GachaCard({ item, isNew, isRevealing, onRevealComplete }: GachaCardProps) {
    const rarityStyle = RARITY_CONFIG[item.rarity];
    const isLegendary = item.rarity === "LEGENDARY";

    return (
        <motion.div
            className="relative"
            initial={isRevealing ? { rotateY: 180, scale: 0.8 } : { rotateY: 0, scale: 1 }}
            animate={{
                rotateY: 0,
                scale: 1,
                x: isLegendary && isRevealing ? [0, -10, 10, -10, 10, 0] : 0,
            }}
            transition={{
                rotateY: { duration: 0.6, ease: "easeOut" },
                scale: { duration: 0.6, ease: "easeOut" },
                x: { duration: 0.5, delay: 0.6, ease: "easeInOut" },
            }}
            onAnimationComplete={onRevealComplete}
            style={{ perspective: 1000 }}
        >
            {/* Card container */}
            <motion.div
                className="relative w-48 h-64 rounded-xl overflow-hidden"
                style={{
                    background: rarityStyle.bgGradient,
                    boxShadow: rarityStyle.glow,
                }}
                animate={
                    isRevealing
                        ? {
                            boxShadow: [
                                rarityStyle.glow,
                                `0 0 60px ${rarityStyle.color}`,
                                rarityStyle.glow,
                            ],
                        }
                        : {}
                }
                transition={{ duration: 1, repeat: isRevealing ? 2 : 0 }}
            >
                {/* Border glow */}
                <div
                    className="absolute inset-0 rounded-xl border-2"
                    style={{ borderColor: rarityStyle.color }}
                />

                {/* Card art */}
                <div className="absolute inset-3 rounded-lg overflow-hidden bg-black/50 flex items-center justify-center">
                    {item.type === "VOICE" ? (
                        <div className="text-5xl">🎵</div>
                    ) : item.type === "SCENARIO" ? (
                        <div className="text-5xl">📖</div>
                    ) : (
                        <div className="text-5xl">👗</div>
                    )}
                </div>

                {/* Rarity badge */}
                <div
                    className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs uppercase tracking-wider font-bold"
                    style={{
                        backgroundColor: `${rarityStyle.color}20`,
                        color: rarityStyle.color,
                        border: `1px solid ${rarityStyle.color}`,
                    }}
                >
                    {rarityStyle.label}
                </div>

                {/* NEW badge */}
                {isNew && (
                    <motion.div
                        className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs uppercase tracking-wider font-bold bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]"
                        initial={{ scale: 0, rotate: -12 }}
                        animate={{ scale: 1, rotate: -12 }}
                        transition={{ delay: 0.8, type: "spring" }}
                    >
                        NEW!
                    </motion.div>
                )}

                {/* Item info at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                    <div className="text-sm font-bold text-white">{item.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>
                </div>
            </motion.div>
        </motion.div>
    );
}

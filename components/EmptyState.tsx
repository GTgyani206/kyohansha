"use client";

import { motion } from "framer-motion";
import { Flame, Zap, MessageCircle, Swords, HelpCircle } from "lucide-react";

interface EmptyStateProps {
    streak: number;
    flameTier: "spark" | "kindling" | "inferno";
    onQuickPrompt: (prompt: string) => void;
}

const QUICK_PROMPTS = [
    { label: "Vent", icon: MessageCircle, prompt: "I need to vent about something..." },
    { label: "Roast Me", icon: Swords, prompt: "Roast me. Don't hold back." },
    { label: "Advice", icon: HelpCircle, prompt: "I need your honest advice about something..." },
];

const FLAME_COLORS = {
    spark: "#ff6b35",
    kindling: "#ff3c00",
    inferno: "#ff003c",
};

export function EmptyState({ streak, flameTier, onQuickPrompt }: EmptyStateProps) {
    const flameColor = FLAME_COLORS[flameTier];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-full flex-col items-center justify-center px-4"
        >
            {/* Glitching Logo */}
            <motion.div
                className="relative mb-8"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 20 }}
            >
                {/* Glitch layers */}
                <motion.span
                    className="absolute inset-0 text-center text-4xl font-bold tracking-[0.3em] text-[#00ff41] opacity-70"
                    animate={{
                        x: [0, -2, 2, 0],
                        opacity: [0.7, 0.5, 0.7],
                    }}
                    transition={{
                        duration: 0.15,
                        repeat: Infinity,
                        repeatDelay: 3,
                    }}
                    style={{ clipPath: "inset(20% 0 60% 0)" }}
                >
                    共犯者
                </motion.span>
                <motion.span
                    className="absolute inset-0 text-center text-4xl font-bold tracking-[0.3em] text-[#ff003c] opacity-70"
                    animate={{
                        x: [0, 2, -2, 0],
                        opacity: [0.7, 0.5, 0.7],
                    }}
                    transition={{
                        duration: 0.15,
                        repeat: Infinity,
                        repeatDelay: 3,
                        delay: 0.05,
                    }}
                    style={{ clipPath: "inset(60% 0 20% 0)" }}
                >
                    共犯者
                </motion.span>

                {/* Main text */}
                <h1 className="relative text-center text-4xl font-bold tracking-[0.3em] text-white">
                    共犯者
                </h1>
                <p className="mt-2 text-center text-xs uppercase tracking-[0.4em] text-gray-600">
                    Kyōhansha
                </p>
            </motion.div>

            {/* Streak Fire - Pulsing */}
            <motion.div
                className="mb-8 flex flex-col items-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
            >
                <motion.div
                    className="relative"
                    animate={{
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    {/* Glow effect */}
                    <div
                        className="absolute inset-0 blur-xl"
                        style={{
                            background: `radial-gradient(circle, ${flameColor}40 0%, transparent 70%)`,
                        }}
                    />
                    <Flame
                        size={48}
                        style={{ color: flameColor }}
                        className="relative drop-shadow-[0_0_10px_rgba(255,60,0,0.8)]"
                    />
                </motion.div>
                {streak > 0 ? (
                    <span className="mt-2 text-xl font-bold" style={{ color: flameColor }}>
                        {streak} Day{streak > 1 ? "s" : ""}
                    </span>
                ) : (
                    <span className="mt-2 text-sm text-gray-500">Start your streak</span>
                )}
            </motion.div>

            {/* System Status */}
            <motion.div
                className="mb-10 flex items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <motion.div
                    className="h-2 w-2 rounded-full bg-[#00ff41]"
                    animate={{
                        opacity: [1, 0.3, 1],
                        scale: [1, 0.9, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                <span className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    System Online. Waiting for Input...
                </span>
            </motion.div>

            {/* Quick Prompts */}
            <motion.div
                className="flex flex-wrap justify-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                {QUICK_PROMPTS.map((item, index) => (
                    <motion.button
                        key={item.label}
                        onClick={() => onQuickPrompt(item.prompt)}
                        className="group flex items-center gap-2 rounded-lg border border-gray-800 bg-black/50 px-4 py-2.5 text-xs uppercase tracking-wider text-gray-400 transition-all hover:border-[#00ff41]/50 hover:bg-[#00ff41]/5 hover:text-[#00ff41]"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <item.icon
                            size={14}
                            className="transition-transform group-hover:scale-110"
                        />
                        {item.label}
                    </motion.button>
                ))}
            </motion.div>

            {/* Decorative scanlines */}
            <div className="pointer-events-none fixed inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)] opacity-30" />
        </motion.div>
    );
}

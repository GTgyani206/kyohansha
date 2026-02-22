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
    spark: "#0891b2", // cyber-accent
    kindling: "#8b5cf6", // cyber-purple
    inferno: "#e11d48", // cyber-danger
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
                    className="absolute inset-0 text-center text-3xl sm:text-4xl font-bold tracking-[0.3em] text-cyber-accent opacity-50 blur-[1px]"
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
                    className="absolute inset-0 text-center text-3xl sm:text-4xl font-bold tracking-[0.3em] text-cyber-danger/80 opacity-50 blur-[1px]"
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
                <h1 className="relative text-center text-3xl sm:text-4xl font-bold tracking-[0.3em] text-white">
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
                    className="h-2 w-2 rounded-full bg-cyber-accent shadow-[0_0_8px_rgba(8,145,178,0.8)]"
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
                        className="group flex items-center gap-2 rounded-full border border-white/5 bg-black/40 px-4 py-2.5 sm:px-5 sm:py-3 text-[10px] sm:text-xs uppercase tracking-wider text-white/50 backdrop-blur-md transition-all hover:border-cyber-accent/30 hover:bg-cyber-accent/10 hover:text-cyber-accent shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
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

            {/* Atmospheric overlay */}
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(8,145,178,0.05),transparent_50%)]" />
        </motion.div>
    );
}

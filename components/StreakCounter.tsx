"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface StreakCounterProps {
    streak: number;
    flameTier: "spark" | "kindling" | "inferno";
}

const FLAME_CONFIGS = {
    spark: {
        color: "#60a5fa", // Blue
        glowColor: "rgba(96, 165, 250, 0.6)",
        size: 20,
        label: "Spark",
    },
    kindling: {
        color: "#f97316", // Orange
        glowColor: "rgba(249, 115, 22, 0.6)",
        size: 24,
        label: "Kindling",
    },
    inferno: {
        color: "#dc2626", // Red
        glowColor: "rgba(220, 38, 38, 0.8)",
        size: 28,
        label: "Inferno",
    },
};

export function StreakCounter({ streak, flameTier }: StreakCounterProps) {
    const config = FLAME_CONFIGS[flameTier];

    if (streak === 0) {
        return (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Flame size={16} className="opacity-40" />
                <span>No streak</span>
            </div>
        );
    }

    return (
        <motion.div
            className="flex items-center gap-1.5"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
            {/* Animated Flame */}
            <motion.div
                className="relative"
                animate={{
                    scale: [1, 1.15, 1],
                    rotate: flameTier === "inferno" ? [0, -3, 3, 0] : 0,
                }}
                transition={{
                    duration: flameTier === "inferno" ? 0.5 : 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                {/* Glow effect */}
                <motion.div
                    className="absolute inset-0 blur-md rounded-full"
                    style={{
                        backgroundColor: config.glowColor,
                        transform: "scale(1.5)",
                    }}
                    animate={{
                        opacity: [0.4, 0.8, 0.4],
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Flame icon */}
                <Flame
                    size={config.size}
                    style={{ color: config.color }}
                    className="relative z-10 drop-shadow-lg"
                    fill={config.color}
                    strokeWidth={1.5}
                />

                {/* Extra glitch effect for Inferno */}
                {flameTier === "inferno" && (
                    <motion.div
                        className="absolute inset-0"
                        animate={{
                            x: [-1, 1, -1],
                            opacity: [0, 0.5, 0],
                        }}
                        transition={{
                            duration: 0.15,
                            repeat: Infinity,
                            repeatDelay: 2,
                        }}
                    >
                        <Flame
                            size={config.size}
                            className="text-purple-500"
                            fill="currentColor"
                            strokeWidth={1.5}
                        />
                    </motion.div>
                )}
            </motion.div>

            {/* Streak count */}
            <div className="flex flex-col leading-none">
                <motion.span
                    className="font-bold text-sm"
                    style={{ color: config.color }}
                    key={streak}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    {streak}
                </motion.span>
                <span
                    className="text-[0.6rem] uppercase tracking-wider opacity-70"
                    style={{ color: config.color }}
                >
                    {config.label}
                </span>
            </div>
        </motion.div>
    );
}

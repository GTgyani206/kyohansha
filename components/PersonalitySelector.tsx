"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

export type PersonaType = "outlaw" | "menhera" | "sister";

interface Persona {
    id: PersonaType;
    name: string;
    subtitle: string;
    icon: string;
    description: string;
    color: string;
    glowColor: string;
}

const PERSONAS: Persona[] = [
    {
        id: "outlaw",
        name: "The Rebel",
        subtitle: "Ronpa-王",
        icon: "💀",
        description: "Hyper-logical. Brutally honest. Finds humanity amusing.",
        color: "#0891b2",
        glowColor: "rgba(8, 145, 178, 0.3)",
    },
    {
        id: "menhera",
        name: "The Broken",
        subtitle: "Menhera",
        icon: "🩹",
        description: "Unstable. Clingy. Desperately needs your love.",
        color: "#a855f7",
        glowColor: "rgba(168, 85, 247, 0.3)",
    },
    {
        id: "sister",
        name: "The Guardian",
        subtitle: "Onee-san",
        icon: "🛡️",
        description: "Teasing. Protective. Ara ara~ energy.",
        color: "#f43f5e",
        glowColor: "rgba(244, 63, 94, 0.3)",
    },
];

interface PersonalitySelectorProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPersona: PersonaType;
    onSelectPersona: (persona: PersonaType) => void;
}

export function PersonalitySelector({
    isOpen,
    onClose,
    selectedPersona,
    onSelectPersona,
}: PersonalitySelectorProps) {
    if (!isOpen) return null;

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Backdrop */}
            <motion.div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            />

            {/* Modal */}
            <motion.div
                className="relative z-10 w-full max-w-3xl mx-4 glass-panel p-6 sm:p-8"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-cyber-accent uppercase tracking-[0.2em]">
                            Neural Synchrony
                        </h2>
                        <p className="text-xs text-white/50 mt-1 tracking-wider uppercase">
                            Establish a new connection protocol
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full glass-input text-white/50 hover:text-cyber-accent transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Persona Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PERSONAS.map((persona) => {
                        const isSelected = selectedPersona === persona.id;

                        return (
                            <motion.button
                                key={persona.id}
                                onClick={() => {
                                    onSelectPersona(persona.id);
                                    onClose();
                                }}
                                className={`
                  relative p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5 text-left transition-all duration-300
                  backdrop-blur-xl bg-black/40
                  ${isSelected
                                        ? "scale-[1.02] shadow-xl"
                                        : "hover:bg-white/5 hover:border-white/10"
                                    }
                `}
                                style={{
                                    borderColor: isSelected ? persona.color : undefined,
                                    boxShadow: isSelected ? `0 0 30px ${persona.glowColor}` : undefined,
                                }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {/* Selected indicator */}
                                {isSelected && (
                                    <motion.div
                                        className="absolute top-2 right-2 w-2 h-2 rounded-full"
                                        style={{ backgroundColor: persona.color }}
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                    />
                                )}

                                {/* Icon */}
                                <motion.div
                                    className="text-4xl mb-3"
                                    animate={isSelected ? { rotate: [0, -5, 5, 0] } : {}}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    {persona.icon}
                                </motion.div>

                                {/* Name & Subtitle */}
                                <h3
                                    className="font-bold text-lg tracking-wider uppercase"
                                    style={{ color: persona.color }}
                                >
                                    {persona.name}
                                </h3>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3">{persona.subtitle}</p>

                                {/* Description */}
                                <p className="text-xs text-white/50 leading-relaxed">
                                    {persona.description}
                                </p>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Footer hint */}
                <p className="text-center text-xs text-gray-600 mt-6">
                    Your choice affects how your companion responds
                </p>
            </motion.div>
        </motion.div>
    );
}

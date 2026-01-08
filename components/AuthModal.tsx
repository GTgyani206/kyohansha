"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Ghost, Lock, Mail, UserPlus, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AuthModalProps {
    isOpen: boolean;
    onClose?: () => void;
    allowClose?: boolean;
}

export function AuthModal({ isOpen, onClose, allowClose = false }: AuthModalProps) {
    const { signIn, signUp, continueAsGuest } = useAuth();
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }

        if (mode === "signup" && password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);

        try {
            if (mode === "login") {
                const { error } = await signIn(email, password);
                if (error) {
                    setError(error.message);
                }
            } else {
                const { error } = await signUp(email, password);
                if (error) {
                    setError(error.message);
                } else {
                    setSuccess("Check your email for confirmation link!");
                }
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuestMode = () => {
        continueAsGuest();
        if (onClose) onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        onClick={allowClose ? onClose : undefined}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md"
                    >
                        {/* Neon border glow effect */}
                        <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-b from-[#00ff41] via-[#00ff41]/50 to-[#00ff41]/20 opacity-70 blur-sm" />

                        <div className="relative rounded-xl border border-[#00ff41]/50 bg-black/80 p-8 backdrop-blur-md">
                            {/* Close button */}
                            {allowClose && onClose && (
                                <button
                                    onClick={onClose}
                                    className="absolute right-4 top-4 p-1 text-gray-500 transition-colors hover:text-[#00ff41]"
                                >
                                    <X size={20} />
                                </button>
                            )}

                            {/* Header */}
                            <div className="mb-8 text-center">
                                <div className="mb-2 flex items-center justify-center gap-2">
                                    <Lock className="text-[#00ff41]" size={20} />
                                    <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-[#00ff41]">
                                        Access Request
                                    </h2>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {mode === "login" ? "Authenticate to sync your progress" : "Create your identity"}
                                </p>
                            </div>

                            {/* Mode Toggle */}
                            <div className="mb-6 flex rounded-lg border border-gray-800 bg-black/50 p-1">
                                <button
                                    onClick={() => setMode("login")}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-xs uppercase tracking-wider transition-all ${mode === "login"
                                            ? "bg-[#00ff41]/20 text-[#00ff41]"
                                            : "text-gray-500 hover:text-gray-300"
                                        }`}
                                >
                                    <LogIn size={14} />
                                    Login
                                </button>
                                <button
                                    onClick={() => setMode("signup")}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-xs uppercase tracking-wider transition-all ${mode === "signup"
                                            ? "bg-[#00ff41]/20 text-[#00ff41]"
                                            : "text-gray-500 hover:text-gray-300"
                                        }`}
                                >
                                    <UserPlus size={14} />
                                    Sign Up
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Email */}
                                <div className="relative">
                                    <Mail
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                                        size={16}
                                    />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email Address"
                                        className="w-full rounded-lg border border-gray-800 bg-black/50 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-[#00ff41] focus:shadow-[0_0_10px_rgba(0,255,65,0.3)]"
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Password */}
                                <div className="relative">
                                    <Lock
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                                        size={16}
                                    />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                        className="w-full rounded-lg border border-gray-800 bg-black/50 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-[#00ff41] focus:shadow-[0_0_10px_rgba(0,255,65,0.3)]"
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Confirm Password (signup only) */}
                                <AnimatePresence>
                                    {mode === "signup" && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="relative overflow-hidden"
                                        >
                                            <div className="relative">
                                                <Lock
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                                                    size={16}
                                                />
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Confirm Password"
                                                    className="w-full rounded-lg border border-gray-800 bg-black/50 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-[#00ff41] focus:shadow-[0_0_10px_rgba(0,255,65,0.3)]"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Error/Success Messages */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="rounded-md border border-[#ff003c]/50 bg-[#ff003c]/10 px-4 py-2 text-xs text-[#ff003c]"
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                    {success && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="rounded-md border border-[#00ff41]/50 bg-[#00ff41]/10 px-4 py-2 text-xs text-[#00ff41]"
                                        >
                                            {success}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full rounded-lg border border-[#00ff41] bg-[#00ff41]/10 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#00ff41] transition-all hover:bg-[#00ff41]/20 hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="animate-spin" size={16} />
                                            Processing...
                                        </span>
                                    ) : mode === "login" ? (
                                        "Authenticate"
                                    ) : (
                                        "Create Account"
                                    )}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="my-6 flex items-center gap-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
                                <span className="text-xs uppercase tracking-wider text-gray-600">or</span>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
                            </div>

                            {/* Ghost Mode Button */}
                            <button
                                onClick={handleGuestMode}
                                className="group flex w-full items-center justify-center gap-2 rounded-lg border border-gray-800 bg-transparent py-3 text-xs uppercase tracking-[0.15em] text-gray-500 transition-all hover:border-gray-600 hover:text-gray-300"
                            >
                                <Ghost size={16} className="transition-transform group-hover:scale-110" />
                                Ghost Mode
                                <span className="text-[10px] text-gray-600">(Local Only)</span>
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

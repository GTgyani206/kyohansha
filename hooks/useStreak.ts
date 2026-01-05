"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY_STREAK = "kyohansha_streak";
const STORAGE_KEY_LAST_DATE = "kyohansha_last_chat_date";

interface StreakData {
    currentStreak: number;
    lastChatDate: string | null;
}

/**
 * Custom hook to manage daily chat streak
 * - Increments streak if user chatted yesterday
 * - Resets to 1 if more than a day has passed
 * - Persists to localStorage
 */
export function useStreak() {
    const [streak, setStreak] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load streak from localStorage on mount
    useEffect(() => {
        const savedStreak = localStorage.getItem(STORAGE_KEY_STREAK);
        const savedDate = localStorage.getItem(STORAGE_KEY_LAST_DATE);

        const today = new Date().toDateString();

        if (savedDate && savedStreak) {
            const lastDate = new Date(savedDate).toDateString();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();

            if (lastDate === today) {
                // Already chatted today, keep streak
                setStreak(parseInt(savedStreak, 10));
            } else if (lastDate === yesterdayStr) {
                // Chatted yesterday, this is a continuation!
                // Don't increment here - wait for recordChat()
                setStreak(parseInt(savedStreak, 10));
            } else {
                // Streak broken - more than a day has passed
                setStreak(0);
            }
        } else {
            // First time user
            setStreak(0);
        }

        setIsLoaded(true);
    }, []);

    // Record a chat action - call this when user sends a message
    const recordChat = () => {
        const today = new Date().toDateString();
        const savedDate = localStorage.getItem(STORAGE_KEY_LAST_DATE);
        const savedStreak = localStorage.getItem(STORAGE_KEY_STREAK);

        let newStreak = 1;

        if (savedDate && savedStreak) {
            const lastDate = new Date(savedDate).toDateString();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();

            if (lastDate === today) {
                // Already recorded today, no change
                return parseInt(savedStreak, 10);
            } else if (lastDate === yesterdayStr) {
                // Continuing streak from yesterday!
                newStreak = parseInt(savedStreak, 10) + 1;
            } else {
                // Streak broken, starting fresh
                newStreak = 1;
            }
        }

        // Save to localStorage
        localStorage.setItem(STORAGE_KEY_STREAK, newStreak.toString());
        localStorage.setItem(STORAGE_KEY_LAST_DATE, new Date().toISOString());
        setStreak(newStreak);

        return newStreak;
    };

    // Get flame tier based on streak
    const getFlameTier = (): "spark" | "kindling" | "inferno" => {
        if (streak >= 7) return "inferno";
        if (streak >= 3) return "kindling";
        return "spark";
    };

    return {
        streak,
        isLoaded,
        recordChat,
        flameTier: getFlameTier(),
    };
}

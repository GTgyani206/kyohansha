"use client";

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "kyohansha_karma";

/**
 * Custom hook to manage Karma points with LocalStorage persistence
 */
export function useKarma() {
    const [karma, setKarma] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load karma from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            setKarma(parseInt(saved, 10) || 0);
        }
        setIsLoaded(true);
    }, []);

    // Save karma to localStorage whenever it changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, karma.toString());
        }
    }, [karma, isLoaded]);

    /**
     * Add karma points
     */
    const addKarma = useCallback((amount: number) => {
        setKarma((prev) => prev + amount);
    }, []);

    /**
     * Spend karma points
     * @returns true if successful, false if insufficient karma
     */
    const spendKarma = useCallback((amount: number): boolean => {
        let success = false;
        setKarma((prev) => {
            if (prev >= amount) {
                success = true;
                return prev - amount;
            }
            return prev;
        });
        return success;
    }, []);

    /**
     * Set karma to a specific value (for debug/testing)
     */
    const setKarmaValue = useCallback((value: number) => {
        setKarma(Math.max(0, value));
    }, []);

    return {
        karma,
        isLoaded,
        addKarma,
        spendKarma,
        setKarmaValue,
    };
}

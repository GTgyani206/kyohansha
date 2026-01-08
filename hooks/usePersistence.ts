"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseClient, type UserProfile, type UserStreak } from "@/lib/supabase";

// LocalStorage keys
const LS_KARMA = "kyohansha_karma";
const LS_STREAK = "kyohansha_streak";
const LS_LAST_DATE = "kyohansha_last_chat_date";
const LS_INVENTORY = "kyohansha_inventory";
const LS_EQUIPPED = "kyohansha_equipped_skin";
const LS_PERSONA = "kyohansha_persona";

export interface PersistenceData {
    karma: number;
    streak: number;
    lastChatDate: string | null;
    inventory: string[];
    equippedSkin: string | null;
    persona: string;
}

/**
 * Custom hook for data persistence
 * - Uses Supabase for logged-in users
 * - Falls back to localStorage for guests
 * - Merges data on login (higher value wins)
 */
export function usePersistence() {
    const { user, isGuest, isLoading: authLoading } = useAuth();
    const [data, setData] = useState<PersistenceData>({
        karma: 0,
        streak: 0,
        lastChatDate: null,
        inventory: [],
        equippedSkin: null,
        persona: "outlaw",
    });
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Load data from localStorage
    const loadFromLocalStorage = useCallback((): PersistenceData => {
        return {
            karma: parseInt(localStorage.getItem(LS_KARMA) || "0", 10),
            streak: parseInt(localStorage.getItem(LS_STREAK) || "0", 10),
            lastChatDate: localStorage.getItem(LS_LAST_DATE),
            inventory: JSON.parse(localStorage.getItem(LS_INVENTORY) || "[]"),
            equippedSkin: localStorage.getItem(LS_EQUIPPED),
            persona: localStorage.getItem(LS_PERSONA) || "outlaw",
        };
    }, []);

    // Save data to localStorage
    const saveToLocalStorage = useCallback((newData: Partial<PersistenceData>) => {
        if (newData.karma !== undefined) {
            localStorage.setItem(LS_KARMA, newData.karma.toString());
        }
        if (newData.streak !== undefined) {
            localStorage.setItem(LS_STREAK, newData.streak.toString());
        }
        if (newData.lastChatDate !== undefined) {
            if (newData.lastChatDate) {
                localStorage.setItem(LS_LAST_DATE, newData.lastChatDate);
            } else {
                localStorage.removeItem(LS_LAST_DATE);
            }
        }
        if (newData.inventory !== undefined) {
            localStorage.setItem(LS_INVENTORY, JSON.stringify(newData.inventory));
        }
        if (newData.equippedSkin !== undefined) {
            if (newData.equippedSkin) {
                localStorage.setItem(LS_EQUIPPED, newData.equippedSkin);
            } else {
                localStorage.removeItem(LS_EQUIPPED);
            }
        }
        if (newData.persona !== undefined) {
            localStorage.setItem(LS_PERSONA, newData.persona);
        }
    }, []);

    // Load data from Supabase
    const loadFromSupabase = useCallback(async (userId: string): Promise<PersistenceData | null> => {
        try {
            const supabase = getSupabaseClient();

            // Fetch all data in parallel
            const [profileRes, streakRes, inventoryRes, equippedRes] = await Promise.all([
                supabase.from("user_profiles").select("*").eq("id", userId).single(),
                supabase.from("user_streaks").select("*").eq("id", userId).single(),
                supabase.from("user_inventory").select("item_id").eq("user_id", userId),
                supabase.from("user_equipped").select("*").eq("id", userId).single(),
            ]);

            return {
                karma: profileRes.data?.karma ?? 0,
                streak: streakRes.data?.current_streak ?? 0,
                lastChatDate: streakRes.data?.last_chat_date ?? null,
                inventory: inventoryRes.data?.map((i: { item_id: string }) => i.item_id) ?? [],
                equippedSkin: equippedRes.data?.equipped_skin ?? null,
                persona: profileRes.data?.selected_persona ?? "outlaw",
            };
        } catch (error) {
            console.error("Error loading from Supabase:", error);
            return null;
        }
    }, []);

    // Initialize user data in Supabase
    const initializeSupabaseUser = useCallback(async (userId: string, initialData: PersistenceData) => {
        try {
            const supabase = getSupabaseClient();

            // Upsert all tables
            await Promise.all([
                supabase.from("user_profiles").upsert({
                    id: userId,
                    karma: initialData.karma,
                    selected_persona: initialData.persona,
                }),
                supabase.from("user_streaks").upsert({
                    id: userId,
                    current_streak: initialData.streak,
                    last_chat_date: initialData.lastChatDate,
                }),
                supabase.from("user_equipped").upsert({
                    id: userId,
                    equipped_skin: initialData.equippedSkin,
                }),
            ]);

            // Insert inventory items
            if (initialData.inventory.length > 0) {
                const inventoryItems = initialData.inventory.map((itemId) => ({
                    user_id: userId,
                    item_id: itemId,
                }));
                await supabase.from("user_inventory").upsert(inventoryItems, {
                    onConflict: "user_id,item_id",
                });
            }
        } catch (error) {
            console.error("Error initializing Supabase user:", error);
        }
    }, []);

    // Merge localStorage data with Supabase (higher values win)
    const mergeData = useCallback((local: PersistenceData, cloud: PersistenceData): PersistenceData => {
        // Combine inventories (union)
        const combinedInventory = [...new Set([...local.inventory, ...cloud.inventory])];

        return {
            karma: Math.max(local.karma, cloud.karma),
            streak: Math.max(local.streak, cloud.streak),
            lastChatDate: local.lastChatDate || cloud.lastChatDate,
            inventory: combinedInventory,
            equippedSkin: local.equippedSkin || cloud.equippedSkin,
            persona: local.persona || cloud.persona,
        };
    }, []);

    // Initial load
    useEffect(() => {
        if (authLoading) return;

        const loadData = async () => {
            setIsSyncing(true);

            if (isGuest || !user) {
                // Guest mode: load from localStorage
                const localData = loadFromLocalStorage();
                setData(localData);
            } else {
                // Logged in: try to load from Supabase
                const cloudData = await loadFromSupabase(user.id);
                const localData = loadFromLocalStorage();

                if (cloudData) {
                    // Merge and save back to both
                    const merged = mergeData(localData, cloudData);
                    setData(merged);
                    await initializeSupabaseUser(user.id, merged);
                    saveToLocalStorage(merged);
                } else {
                    // No cloud data yet, initialize with local data
                    setData(localData);
                    await initializeSupabaseUser(user.id, localData);
                }
            }

            setIsLoaded(true);
            setIsSyncing(false);
        };

        loadData();
    }, [authLoading, isGuest, user, loadFromLocalStorage, loadFromSupabase, initializeSupabaseUser, mergeData, saveToLocalStorage]);

    // Update functions
    const updateKarma = useCallback(
        async (newKarma: number) => {
            setData((prev) => ({ ...prev, karma: newKarma }));
            saveToLocalStorage({ karma: newKarma });

            if (user && !isGuest) {
                const supabase = getSupabaseClient();
                await supabase.from("user_profiles").update({ karma: newKarma, updated_at: new Date().toISOString() }).eq("id", user.id);
            }
        },
        [user, isGuest, saveToLocalStorage]
    );

    const addKarma = useCallback(
        async (amount: number) => {
            const newKarma = data.karma + amount;
            await updateKarma(newKarma);
        },
        [data.karma, updateKarma]
    );

    const spendKarma = useCallback(
        async (amount: number): Promise<boolean> => {
            if (data.karma >= amount) {
                await updateKarma(data.karma - amount);
                return true;
            }
            return false;
        },
        [data.karma, updateKarma]
    );

    const updateStreak = useCallback(
        async (newStreak: number, lastChatDate: string) => {
            setData((prev) => ({ ...prev, streak: newStreak, lastChatDate }));
            saveToLocalStorage({ streak: newStreak, lastChatDate });

            if (user && !isGuest) {
                const supabase = getSupabaseClient();
                await supabase.from("user_streaks").update({
                    current_streak: newStreak,
                    last_chat_date: lastChatDate,
                    updated_at: new Date().toISOString(),
                }).eq("id", user.id);
            }
        },
        [user, isGuest, saveToLocalStorage]
    );

    const recordChat = useCallback(async (): Promise<number> => {
        const today = new Date().toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        let newStreak = 1;

        if (data.lastChatDate) {
            const lastDate = new Date(data.lastChatDate).toDateString();
            if (lastDate === today) {
                // Already recorded today
                return data.streak;
            } else if (lastDate === yesterdayStr) {
                // Continuing streak
                newStreak = data.streak + 1;
            }
        }

        await updateStreak(newStreak, new Date().toISOString());
        return newStreak;
    }, [data.streak, data.lastChatDate, updateStreak]);

    const addToInventory = useCallback(
        async (itemId: string): Promise<boolean> => {
            if (data.inventory.includes(itemId)) {
                return false; // Already owned
            }

            const newInventory = [...data.inventory, itemId];
            setData((prev) => ({ ...prev, inventory: newInventory }));
            saveToLocalStorage({ inventory: newInventory });

            if (user && !isGuest) {
                const supabase = getSupabaseClient();
                await supabase.from("user_inventory").insert({
                    user_id: user.id,
                    item_id: itemId,
                });
            }

            return true;
        },
        [data.inventory, user, isGuest, saveToLocalStorage]
    );

    const equipSkin = useCallback(
        async (skinId: string | null) => {
            setData((prev) => ({ ...prev, equippedSkin: skinId }));
            saveToLocalStorage({ equippedSkin: skinId });

            if (user && !isGuest) {
                const supabase = getSupabaseClient();
                await supabase.from("user_equipped").update({
                    equipped_skin: skinId,
                    updated_at: new Date().toISOString(),
                }).eq("id", user.id);
            }
        },
        [user, isGuest, saveToLocalStorage]
    );

    const updatePersona = useCallback(
        async (persona: string) => {
            setData((prev) => ({ ...prev, persona }));
            saveToLocalStorage({ persona });

            if (user && !isGuest) {
                const supabase = getSupabaseClient();
                await supabase.from("user_profiles").update({
                    selected_persona: persona,
                    updated_at: new Date().toISOString(),
                }).eq("id", user.id);
            }
        },
        [user, isGuest, saveToLocalStorage]
    );

    // Flame tier based on streak
    const flameTier: "spark" | "kindling" | "inferno" = data.streak >= 7 ? "inferno" : data.streak >= 3 ? "kindling" : "spark";

    return {
        // Data
        karma: data.karma,
        streak: data.streak,
        lastChatDate: data.lastChatDate,
        inventory: data.inventory,
        equippedSkin: data.equippedSkin,
        persona: data.persona,
        flameTier,

        // State
        isLoaded,
        isSyncing,
        isLoggedIn: !!user && !isGuest,

        // Actions
        addKarma,
        spendKarma,
        recordChat,
        addToInventory,
        equipSkin,
        updatePersona,
        hasItem: (itemId: string) => data.inventory.includes(itemId),
    };
}

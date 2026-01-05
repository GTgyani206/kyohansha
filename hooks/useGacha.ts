"use client";

import { useEffect, useState, useCallback } from "react";
import { rollGacha, getItemById, PULL_COST, type GachaItem } from "@/lib/gacha";

const STORAGE_KEY_INVENTORY = "kyohansha_inventory";
const STORAGE_KEY_EQUIPPED = "kyohansha_equipped_skin";

export interface GachaPullResult {
    item: GachaItem;
    isNew: boolean;
}

/**
 * Custom hook to manage gacha pulls and inventory
 */
export function useGacha() {
    const [inventory, setInventory] = useState<string[]>([]);
    const [equippedSkin, setEquippedSkin] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load inventory and equipped skin from localStorage
    useEffect(() => {
        const savedInventory = localStorage.getItem(STORAGE_KEY_INVENTORY);
        const savedEquipped = localStorage.getItem(STORAGE_KEY_EQUIPPED);

        if (savedInventory) {
            try {
                setInventory(JSON.parse(savedInventory));
            } catch {
                setInventory([]);
            }
        }

        if (savedEquipped) {
            setEquippedSkin(savedEquipped);
        }

        setIsLoaded(true);
    }, []);

    // Save inventory to localStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventory));
        }
    }, [inventory, isLoaded]);

    // Save equipped skin to localStorage
    useEffect(() => {
        if (isLoaded && equippedSkin) {
            localStorage.setItem(STORAGE_KEY_EQUIPPED, equippedSkin);
        }
    }, [equippedSkin, isLoaded]);

    /**
     * Check if an item is owned
     */
    const hasItem = useCallback(
        (itemId: string): boolean => {
            return inventory.includes(itemId);
        },
        [inventory]
    );

    /**
     * Perform a gacha pull
     * Note: Caller must check and deduct karma separately
     * @returns Pull result with item and whether it's new
     */
    const pullGacha = useCallback((): GachaPullResult => {
        const item = rollGacha();
        const isNew = !inventory.includes(item.id);

        if (isNew) {
            setInventory((prev) => [...prev, item.id]);
        }

        return { item, isNew };
    }, [inventory]);

    /**
     * Equip a skin (must be owned)
     */
    const equipSkin = useCallback(
        (itemId: string): boolean => {
            const item = getItemById(itemId);
            if (item && item.type === "SKIN" && hasItem(itemId)) {
                setEquippedSkin(itemId);
                return true;
            }
            return false;
        },
        [hasItem]
    );

    /**
     * Get all owned items as GachaItem objects
     */
    const getOwnedItems = useCallback((): GachaItem[] => {
        return inventory
            .map((id) => getItemById(id))
            .filter((item): item is GachaItem => item !== undefined);
    }, [inventory]);

    /**
     * Get owned items filtered by type
     */
    const getOwnedItemsByType = useCallback(
        (type: "SKIN" | "VOICE" | "SCENARIO"): GachaItem[] => {
            return getOwnedItems().filter((item) => item.type === type);
        },
        [getOwnedItems]
    );

    return {
        inventory,
        equippedSkin,
        isLoaded,
        hasItem,
        pullGacha,
        equipSkin,
        getOwnedItems,
        getOwnedItemsByType,
        PULL_COST,
    };
}

/**
 * Gacha System - Loot Table and Types
 * "Black Market" collectible card system
 */

export type Rarity = 'COMMON' | 'RARE' | 'LEGENDARY';
export type ItemType = 'SKIN' | 'VOICE' | 'SCENARIO';

export interface GachaItem {
    id: string;
    name: string;
    type: ItemType;
    rarity: Rarity;
    dropRate: number;    // Weight for weighted random selection
    assetUrl: string;
    description?: string;
}

/** Karma cost per gacha pull */
export const PULL_COST = 100;

/** Karma earned per chat message */
export const KARMA_PER_CHAT = 10;

/** Loot table with weighted drop rates */
export const LOOT_TABLE: GachaItem[] = [
    // COMMON (~50% total weight)
    {
        id: 'skin_school',
        name: 'School Uniform',
        type: 'SKIN',
        rarity: 'COMMON',
        dropRate: 25,
        assetUrl: '/assets/cards/school.png',
        description: 'Classic schoolgirl aesthetic'
    },
    {
        id: 'skin_casual',
        name: 'Casual Hoodie',
        type: 'SKIN',
        rarity: 'COMMON',
        dropRate: 25,
        assetUrl: '/assets/cards/casual.png',
        description: 'Relaxed streetwear vibes'
    },

    // RARE (~35% total weight)
    {
        id: 'voice_baka',
        name: 'Voice: "Baka!"',
        type: 'VOICE',
        rarity: 'RARE',
        dropRate: 15,
        assetUrl: '/assets/sounds/baka.mp3',
        description: 'Classic tsundere insult'
    },
    {
        id: 'voice_ara',
        name: 'Voice: "Ara Ara~"',
        type: 'VOICE',
        rarity: 'RARE',
        dropRate: 15,
        assetUrl: '/assets/sounds/ara.mp3',
        description: 'Teasing onee-san energy'
    },
    {
        id: 'scenario_date',
        name: 'Date Night',
        type: 'SCENARIO',
        rarity: 'RARE',
        dropRate: 5,
        assetUrl: '/assets/cards/date.png',
        description: 'Unlock romantic scenarios'
    },

    // LEGENDARY (~15% total weight)
    {
        id: 'skin_gothic',
        name: 'Gothic Lolita',
        type: 'SKIN',
        rarity: 'LEGENDARY',
        dropRate: 10,
        assetUrl: '/assets/cards/gothic.png',
        description: 'Dark elegance personified'
    },
    {
        id: 'skin_cyber',
        name: 'Cyberpunk Elite',
        type: 'SKIN',
        rarity: 'LEGENDARY',
        dropRate: 5,
        assetUrl: '/assets/cards/cyber.png',
        description: 'Neon-lit street samurai'
    },
];

/** Visual config for each rarity tier */
export const RARITY_CONFIG: Record<Rarity, {
    color: string;
    glow: string;
    bgGradient: string;
    label: string
}> = {
    COMMON: {
        color: '#a0a0a0',
        glow: '0 0 20px rgba(160,160,160,0.5)',
        bgGradient: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
        label: 'Common'
    },
    RARE: {
        color: '#00d4ff',
        glow: '0 0 30px rgba(0,212,255,0.7)',
        bgGradient: 'linear-gradient(135deg, #0a2a3a 0%, #001520 100%)',
        label: 'Rare'
    },
    LEGENDARY: {
        color: '#ff003c',
        glow: '0 0 50px rgba(255,0,60,0.9)',
        bgGradient: 'linear-gradient(135deg, #3a0a15 0%, #1a0008 100%)',
        label: 'Legendary'
    },
};

/** Get total weight of all items in loot table */
export function getTotalWeight(): number {
    return LOOT_TABLE.reduce((sum, item) => sum + item.dropRate, 0);
}

/** 
 * Perform weighted random selection from loot table 
 * @returns The randomly selected GachaItem
 */
export function rollGacha(): GachaItem {
    const totalWeight = getTotalWeight();
    let random = Math.random() * totalWeight;

    for (const item of LOOT_TABLE) {
        random -= item.dropRate;
        if (random <= 0) {
            return item;
        }
    }

    // Fallback (should never happen)
    return LOOT_TABLE[0];
}

/** Get item by ID */
export function getItemById(id: string): GachaItem | undefined {
    return LOOT_TABLE.find(item => item.id === id);
}

/** Filter items by type */
export function getItemsByType(type: ItemType): GachaItem[] {
    return LOOT_TABLE.filter(item => item.type === type);
}

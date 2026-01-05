"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { type GachaItem, RARITY_CONFIG } from "@/lib/gacha";

type TabType = "ALL" | "SKIN" | "VOICE" | "SCENARIO";

interface InventoryProps {
    items: GachaItem[];
    equippedSkin: string | null;
    onEquipSkin: (id: string) => void;
    onPlayVoice: (item: GachaItem) => void;
}

const TABS: { id: TabType; label: string }[] = [
    { id: "ALL", label: "All" },
    { id: "SKIN", label: "Skins" },
    { id: "VOICE", label: "Voices" },
    { id: "SCENARIO", label: "Scenarios" },
];

/**
 * Inventory grid display for owned items
 */
export function Inventory({ items, equippedSkin, onEquipSkin, onPlayVoice }: InventoryProps) {
    const [activeTab, setActiveTab] = useState<TabType>("ALL");

    const filteredItems =
        activeTab === "ALL" ? items : items.filter((item) => item.type === activeTab);

    return (
        <div className="flex flex-col h-full">
            {/* Tab bar */}
            <div className="flex gap-2 mb-4">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded border transition-all ${activeTab === tab.id
                                ? "border-[#00ff41] text-[#00ff41] bg-[#00ff41]/10"
                                : "border-gray-700 text-gray-500 hover:border-gray-500"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Items grid */}
            {filteredItems.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
                    No items yet. Try your luck at the summon!
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto flex-1 pr-2">
                    {filteredItems.map((item) => {
                        const rarityStyle = RARITY_CONFIG[item.rarity];
                        const isEquipped = item.type === "SKIN" && equippedSkin === item.id;

                        return (
                            <motion.div
                                key={item.id}
                                className="relative rounded-lg overflow-hidden"
                                style={{
                                    background: rarityStyle.bgGradient,
                                    border: `1px solid ${rarityStyle.color}40`,
                                }}
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Item preview */}
                                <div className="aspect-square flex items-center justify-center text-3xl bg-black/30">
                                    {item.type === "VOICE" ? "🎵" : item.type === "SCENARIO" ? "📖" : "👗"}
                                </div>

                                {/* Info */}
                                <div className="p-2 bg-black/50">
                                    <div className="text-xs font-medium text-white truncate">{item.name}</div>
                                    <div
                                        className="text-[10px] uppercase tracking-wider"
                                        style={{ color: rarityStyle.color }}
                                    >
                                        {rarityStyle.label}
                                    </div>

                                    {/* Action button */}
                                    {item.type === "SKIN" && (
                                        <button
                                            onClick={() => onEquipSkin(item.id)}
                                            disabled={isEquipped}
                                            className={`w-full mt-2 py-1 text-xs rounded border transition-all ${isEquipped
                                                    ? "border-[#00ff41] text-[#00ff41] bg-[#00ff41]/10"
                                                    : "border-gray-600 text-gray-400 hover:border-[#00ff41] hover:text-[#00ff41]"
                                                }`}
                                        >
                                            {isEquipped ? "Equipped" : "Equip"}
                                        </button>
                                    )}

                                    {item.type === "VOICE" && (
                                        <button
                                            onClick={() => onPlayVoice(item)}
                                            className="w-full mt-2 py-1 text-xs rounded border border-gray-600 text-gray-400 hover:border-[#00d4ff] hover:text-[#00d4ff] transition-all"
                                        >
                                            ▶ Play
                                        </button>
                                    )}
                                </div>

                                {/* Equipped indicator */}
                                {isEquipped && (
                                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00ff41] animate-pulse" />
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

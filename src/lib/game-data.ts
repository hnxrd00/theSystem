// XP & Leveling
export const xpForLevel = (level: number): number => Math.floor(100 * Math.pow(level, 1.5));

export const TITLES = [
  { level: 1, title: "Novice" },
  { level: 5, title: "Apprentice" },
  { level: 10, title: "Journeyman" },
  { level: 20, title: "Expert" },
  { level: 35, title: "Master" },
  { level: 50, title: "Legend" },
] as const;

export const getTitleForLevel = (level: number): string => {
  for (let i = TITLES.length - 1; i >= 0; i--) {
    if (level >= TITLES[i].level) return TITLES[i].title;
  }
  return "Novice";
};

export type Difficulty = "easy" | "medium" | "hard" | "boss";
export type QuestCategory = "health" | "study" | "work" | "personal" | "creative" | "social";
export type QuestStatus = "active" | "completed";

export const DIFFICULTY_CONFIG: Record<Difficulty, { xp: number; gold: number; label: string }> = {
  easy: { xp: 25, gold: 5, label: "Easy" },
  medium: { xp: 50, gold: 15, label: "Medium" },
  hard: { xp: 100, gold: 30, label: "Hard" },
  boss: { xp: 250, gold: 75, label: "Boss" },
};

export const CATEGORY_ICONS: Record<QuestCategory, string> = {
  health: "❤️", study: "📚", work: "💼", personal: "🌟", creative: "🎨", social: "🤝",
};

export interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: QuestCategory;
  status: QuestStatus;
  createdAt: number;
  completedAt?: number;
}

export interface Habit {
  id: string;
  title: string;
  frequency: "daily" | "weekly";
  streak: number;
  lastCompleted?: number;
  completedToday: boolean;
}

export type SkillCategory = "focus" | "discipline" | "energy" | "intelligence" | "creativity";

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  cost: number;
  unlocked: boolean;
  tier: number;
  requires?: string;
}

export const SKILL_TREES: Skill[] = [
  // === FOCUS ===
  { id: "f1", name: "Deep Focus", description: "+10% XP from dungeons", category: "focus", cost: 1, unlocked: false, tier: 1 },
  { id: "f2a", name: "Flow State", description: "+25% XP from long sessions", category: "focus", cost: 2, unlocked: false, tier: 2, requires: "f1" },
  { id: "f3a", name: "Time Warp", description: "Dungeons feel 20% shorter", category: "focus", cost: 2, unlocked: false, tier: 3, requires: "f2a" },
  { id: "f4a", name: "Hyperfocus", description: "+50% XP from boss dungeons", category: "focus", cost: 3, unlocked: false, tier: 4, requires: "f3a" },
  { id: "f5a", name: "Singularity", description: "Triple XP on 3+ hour sessions", category: "focus", cost: 4, unlocked: false, tier: 5, requires: "f4a" },
  { id: "f2b", name: "Clarity", description: "+15% gold from all tasks", category: "focus", cost: 2, unlocked: false, tier: 2, requires: "f1" },
  { id: "f3b", name: "Tunnel Vision", description: "No distraction penalties", category: "focus", cost: 2, unlocked: false, tier: 3, requires: "f2b" },
  { id: "f4b", name: "Laser Mind", description: "Double dungeon gold", category: "focus", cost: 3, unlocked: false, tier: 4, requires: "f3b" },
  { id: "f5b", name: "Omnifocus", description: "+25% XP from all sources", category: "focus", cost: 4, unlocked: false, tier: 5, requires: "f4b" },
  { id: "f3c", name: "Zen Master", description: "Meditation bonus: +5 SP", category: "focus", cost: 3, unlocked: false, tier: 3, requires: "f2a" },
  { id: "f4c", name: "Inner Peace", description: "Immune to streak loss", category: "focus", cost: 3, unlocked: false, tier: 4, requires: "f3c" },
  { id: "f6a", name: "Transcendence", description: "All focus bonuses doubled", category: "focus", cost: 5, unlocked: false, tier: 6, requires: "f5a" },
  { id: "f6b", name: "Ascension", description: "Unlock legendary dungeons", category: "focus", cost: 5, unlocked: false, tier: 6, requires: "f5b" },
  // === DISCIPLINE ===
  { id: "d1", name: "Iron Will", description: "+1 streak shield/month", category: "discipline", cost: 1, unlocked: false, tier: 1 },
  { id: "d2a", name: "Consistency", description: "2x streak XP bonus", category: "discipline", cost: 2, unlocked: false, tier: 2, requires: "d1" },
  { id: "d3a", name: "Routine", description: "Auto-complete easy habits", category: "discipline", cost: 2, unlocked: false, tier: 3, requires: "d2a" },
  { id: "d4a", name: "Unbreakable", description: "3-day streak grace period", category: "discipline", cost: 3, unlocked: false, tier: 4, requires: "d3a" },
  { id: "d5a", name: "Eternal Flame", description: "Streaks never fully reset", category: "discipline", cost: 4, unlocked: false, tier: 5, requires: "d4a" },
  { id: "d2b", name: "Resilience", description: "+20% XP after streak loss", category: "discipline", cost: 2, unlocked: false, tier: 2, requires: "d1" },
  { id: "d3b", name: "Fortitude", description: "Reduce quest difficulty cost", category: "discipline", cost: 2, unlocked: false, tier: 3, requires: "d2b" },
  { id: "d4b", name: "Titan Grip", description: "+50% habit gold", category: "discipline", cost: 3, unlocked: false, tier: 4, requires: "d3b" },
  { id: "d5b", name: "Adamantine", description: "Double all streak rewards", category: "discipline", cost: 4, unlocked: false, tier: 5, requires: "d4b" },
  { id: "d3c", name: "Perseverance", description: "+10 gold per completed day", category: "discipline", cost: 3, unlocked: false, tier: 3, requires: "d2a" },
  { id: "d4c", name: "Stoic Mind", description: "No penalty for pausing", category: "discipline", cost: 3, unlocked: false, tier: 4, requires: "d3c" },
  { id: "d6a", name: "Invincible", description: "All discipline bonuses x2", category: "discipline", cost: 5, unlocked: false, tier: 6, requires: "d5a" },
  { id: "d6b", name: "Juggernaut", description: "Permanent +100 gold/week", category: "discipline", cost: 5, unlocked: false, tier: 6, requires: "d5b" },
  // === ENERGY ===
  { id: "e1", name: "Quick Start", description: "-5min dungeon warmup", category: "energy", cost: 1, unlocked: false, tier: 1 },
  { id: "e2a", name: "Endurance", description: "+10min focus capacity", category: "energy", cost: 2, unlocked: false, tier: 2, requires: "e1" },
  { id: "e3a", name: "Marathon", description: "+25min standard dungeons", category: "energy", cost: 2, unlocked: false, tier: 3, requires: "e2a" },
  { id: "e4a", name: "Perpetual", description: "No pause penalty ever", category: "energy", cost: 3, unlocked: false, tier: 4, requires: "e3a" },
  { id: "e5a", name: "Infinite Loop", description: "Chain dungeons for bonus XP", category: "energy", cost: 4, unlocked: false, tier: 5, requires: "e4a" },
  { id: "e2b", name: "Burst", description: "+30% quick dungeon rewards", category: "energy", cost: 2, unlocked: false, tier: 2, requires: "e1" },
  { id: "e3b", name: "Overdrive", description: "2x XP for first task daily", category: "energy", cost: 2, unlocked: false, tier: 3, requires: "e2b" },
  { id: "e4b", name: "Surge", description: "+50% gold from speed runs", category: "energy", cost: 3, unlocked: false, tier: 4, requires: "e3b" },
  { id: "e5b", name: "Supernova", description: "Triple rewards on perfect days", category: "energy", cost: 4, unlocked: false, tier: 5, requires: "e4b" },
  { id: "e3c", name: "Recovery", description: "Rest bonus: +20 XP/hour off", category: "energy", cost: 3, unlocked: false, tier: 3, requires: "e2a" },
  { id: "e4c", name: "Recharge", description: "Weekly full energy reset", category: "energy", cost: 3, unlocked: false, tier: 4, requires: "e3c" },
  { id: "e6a", name: "Dynamo", description: "All energy bonuses doubled", category: "energy", cost: 5, unlocked: false, tier: 6, requires: "e5a" },
  { id: "e6b", name: "Reactor", description: "Passive +50 XP/day", category: "energy", cost: 5, unlocked: false, tier: 6, requires: "e5b" },
  // === INTELLIGENCE ===
  { id: "i1", name: "Fast Learner", description: "+15% base XP", category: "intelligence", cost: 1, unlocked: false, tier: 1 },
  { id: "i2a", name: "Scholar", description: "+30% study quest XP", category: "intelligence", cost: 2, unlocked: false, tier: 2, requires: "i1" },
  { id: "i3a", name: "Polymath", description: "+XP for multi-category days", category: "intelligence", cost: 2, unlocked: false, tier: 3, requires: "i2a" },
  { id: "i4a", name: "Sage", description: "Level up 20% faster", category: "intelligence", cost: 3, unlocked: false, tier: 4, requires: "i3a" },
  { id: "i5a", name: "Oracle", description: "Predict optimal quest order", category: "intelligence", cost: 4, unlocked: false, tier: 5, requires: "i4a" },
  { id: "i2b", name: "Analyst", description: "+15% XP from work quests", category: "intelligence", cost: 2, unlocked: false, tier: 2, requires: "i1" },
  { id: "i3b", name: "Strategist", description: "Chain quest bonus +40%", category: "intelligence", cost: 2, unlocked: false, tier: 3, requires: "i2b" },
  { id: "i4b", name: "Tactician", description: "Boss quests give 2x gold", category: "intelligence", cost: 3, unlocked: false, tier: 4, requires: "i3b" },
  { id: "i5b", name: "Mastermind", description: "+1 SP every 5 levels", category: "intelligence", cost: 4, unlocked: false, tier: 5, requires: "i4b" },
  { id: "i3c", name: "Bookworm", description: "+25 XP from study habits", category: "intelligence", cost: 3, unlocked: false, tier: 3, requires: "i2a" },
  { id: "i4c", name: "Librarian", description: "Catalog bonus: +10% all XP", category: "intelligence", cost: 3, unlocked: false, tier: 4, requires: "i3c" },
  { id: "i6a", name: "Omniscient", description: "All INT bonuses doubled", category: "intelligence", cost: 5, unlocked: false, tier: 6, requires: "i5a" },
  { id: "i6b", name: "Architect", description: "Design custom quest rewards", category: "intelligence", cost: 5, unlocked: false, tier: 6, requires: "i5b" },
  // === CREATIVITY ===
  { id: "c1", name: "Inspiration", description: "Random bonus gold", category: "creativity", cost: 1, unlocked: false, tier: 1 },
  { id: "c2a", name: "Innovator", description: "+20% creative quest XP", category: "creativity", cost: 2, unlocked: false, tier: 2, requires: "c1" },
  { id: "c3a", name: "Artisan", description: "Craft unique quest styles", category: "creativity", cost: 2, unlocked: false, tier: 3, requires: "c2a" },
  { id: "c4a", name: "Visionary", description: "Unlock special quests", category: "creativity", cost: 3, unlocked: false, tier: 4, requires: "c3a" },
  { id: "c5a", name: "Muse", description: "Inspire others: +50% social XP", category: "creativity", cost: 4, unlocked: false, tier: 5, requires: "c4a" },
  { id: "c2b", name: "Dreamer", description: "+10% XP from personal quests", category: "creativity", cost: 2, unlocked: false, tier: 2, requires: "c1" },
  { id: "c3b", name: "Alchemist", description: "Convert gold to XP (100:50)", category: "creativity", cost: 2, unlocked: false, tier: 3, requires: "c2b" },
  { id: "c4b", name: "Enchanter", description: "Enchant quests for +30% gold", category: "creativity", cost: 3, unlocked: false, tier: 4, requires: "c3b" },
  { id: "c5b", name: "Sorcerer", description: "Transmute: 2x rewards chance", category: "creativity", cost: 4, unlocked: false, tier: 5, requires: "c4b" },
  { id: "c3c", name: "Bard", description: "+15 gold from streak milestones", category: "creativity", cost: 3, unlocked: false, tier: 3, requires: "c2a" },
  { id: "c4c", name: "Storyteller", description: "Narrative bonus: +20% XP", category: "creativity", cost: 3, unlocked: false, tier: 4, requires: "c3c" },
  { id: "c6a", name: "Legendary", description: "All creativity bonuses x2", category: "creativity", cost: 5, unlocked: false, tier: 6, requires: "c5a" },
  { id: "c6b", name: "Mythweaver", description: "Create mythic-tier quests", category: "creativity", cost: 5, unlocked: false, tier: 6, requires: "c5b" },
];

export type DungeonType = "quick" | "standard" | "boss";

export const DUNGEON_CONFIG: Record<DungeonType, { duration: number; xp: number; gold: number; label: string }> = {
  quick: { duration: 20 * 60, xp: 75, gold: 20, label: "Quick Dungeon" },
  standard: { duration: 45 * 60, xp: 200, gold: 50, label: "Standard Dungeon" },
  boss: { duration: 90 * 60, xp: 500, gold: 150, label: "Boss Dungeon" },
};

// === SHOP ITEMS ===
export type ShopItemCategory = "armor" | "weapon" | "avatar" | "theme" | "celebration";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ShopItemCategory;
  price: number;
  pixelIcon: string; // 8-bit style pixel art CSS
  equipValue?: string; // value to set on avatar config
}

export const SHOP_ITEMS: ShopItem[] = [
  // Armor
  { id: "armor_leather", name: "Leather Armor", description: "Basic protection for novice adventurers", category: "armor", price: 75, pixelIcon: "🛡️", equipValue: "leather" },
  { id: "armor_chainmail", name: "Chainmail", description: "Interlocked rings of steel defense", category: "armor", price: 150, pixelIcon: "⛓️", equipValue: "chainmail" },
  { id: "armor_plate", name: "Plate Armor", description: "Heavy forged steel plates", category: "armor", price: 300, pixelIcon: "🏰", equipValue: "plate" },
  { id: "armor_mage", name: "Mage Robe", description: "Enchanted robes of arcane power", category: "armor", price: 250, pixelIcon: "🧙", equipValue: "mage_robe" },
  { id: "armor_shadow", name: "Shadow Cloak", description: "Dark fabric woven from midnight", category: "armor", price: 400, pixelIcon: "🌑", equipValue: "shadow" },
  { id: "armor_dragon", name: "Dragonscale", description: "Legendary armor from dragon hide", category: "armor", price: 750, pixelIcon: "🐉", equipValue: "dragon" },
  // Weapons
  { id: "weapon_sword", name: "Iron Sword", description: "A reliable blade for any quest", category: "weapon", price: 100, pixelIcon: "⚔️", equipValue: "sword" },
  { id: "weapon_staff", name: "Arcane Staff", description: "Channels magical energy", category: "weapon", price: 125, pixelIcon: "🪄", equipValue: "staff" },
  { id: "weapon_bow", name: "Hunter's Bow", description: "Strike from a distance", category: "weapon", price: 125, pixelIcon: "🏹", equipValue: "bow" },
  { id: "weapon_axe", name: "Battle Axe", description: "Devastating cleaving power", category: "weapon", price: 200, pixelIcon: "🪓", equipValue: "axe" },
  { id: "weapon_dagger", name: "Shadow Dagger", description: "Swift and deadly strikes", category: "weapon", price: 150, pixelIcon: "🗡️", equipValue: "dagger" },
  { id: "weapon_hammer", name: "War Hammer", description: "Crushing force of justice", category: "weapon", price: 300, pixelIcon: "🔨", equipValue: "hammer" },
  // Avatar customizations
  { id: "hair_blue", name: "Blue Dye", description: "Mystic blue hair color", category: "avatar", price: 50, pixelIcon: "💎", equipValue: "blue" },
  { id: "hair_white", name: "White Dye", description: "Ancient sage white hair", category: "avatar", price: 75, pixelIcon: "⚪", equipValue: "white" },
  { id: "hair_red", name: "Red Dye", description: "Fiery crimson hair", category: "avatar", price: 50, pixelIcon: "🔴", equipValue: "red" },
  { id: "eyes_cool", name: "Crystal Eyes", description: "Piercing blue crystal gaze", category: "avatar", price: 100, pixelIcon: "👁️", equipValue: "cool" },
  // Themes
  { id: "theme_midnight", name: "Midnight", description: "Deep charcoal with blue accents", category: "theme", price: 150, pixelIcon: "🌙" },
  { id: "theme_ember", name: "Ember", description: "Dark theme with fiery highlights", category: "theme", price: 200, pixelIcon: "🔥" },
  { id: "theme_forest", name: "Forest", description: "Deep greens and earthy browns", category: "theme", price: 200, pixelIcon: "🌲" },
  // Celebrations
  { id: "cele_fireworks", name: "Fireworks", description: "Explosive level up celebration", category: "celebration", price: 175, pixelIcon: "🎆" },
  { id: "cele_lightning", name: "Lightning", description: "Thunder and lightning effect", category: "celebration", price: 200, pixelIcon: "⚡" },
  { id: "cele_sakura", name: "Sakura", description: "Cherry blossom petals rain", category: "celebration", price: 225, pixelIcon: "🌸" },
];

export const SHOP_CATEGORY_LABELS: Record<ShopItemCategory, string> = {
  armor: "Armor",
  weapon: "Weapons",
  avatar: "Cosmetics",
  theme: "Themes",
  celebration: "Celebrations",
};

// === FOCUS FOREST ===
export interface FocusTree {
  id: string;
  seedType: string;
  name: string;
  growth: number; // 0-500+
  plantedAt: number;
  lastWatered: number | null;
  xpContributed: number;
}

export interface SeedType {
  id: string;
  label: string;
  emoji: string;
  description: string;
  price: number;
  trunkColor: string;
  canopyColor: string;
  leafColor: string;
  flowerColor?: string;
}

export const SEED_TYPES: SeedType[] = [
  { id: "seed_oak", label: "Oak Seed", emoji: "🌰", description: "A sturdy oak that grows steadily", price: 0, trunkColor: "#8B6914", canopyColor: "#2d8a4e", leafColor: "#4ade80" },
  { id: "seed_cherry", label: "Cherry Blossom", emoji: "🌸", description: "Blooms with beautiful pink flowers", price: 100, trunkColor: "#6b4423", canopyColor: "#ec4899", leafColor: "#f9a8d4", flowerColor: "#fbbf24" },
  { id: "seed_pine", label: "Pine Seed", emoji: "🌲", description: "An evergreen that towers above", price: 75, trunkColor: "#5c3a1e", canopyColor: "#166534", leafColor: "#22c55e" },
  { id: "seed_willow", label: "Willow Seed", emoji: "🌿", description: "Graceful drooping branches", price: 120, trunkColor: "#7a6330", canopyColor: "#65a30d", leafColor: "#a3e635" },
  { id: "seed_crystal", label: "Crystal Seed", emoji: "💎", description: "A magical tree that glows", price: 250, trunkColor: "#6366f1", canopyColor: "#818cf8", leafColor: "#c4b5fd", flowerColor: "#e0e7ff" },
  { id: "seed_flame", label: "Flame Seed", emoji: "🔥", description: "Burns with eternal fire", price: 200, trunkColor: "#92400e", canopyColor: "#dc2626", leafColor: "#f97316", flowerColor: "#fbbf24" },
];

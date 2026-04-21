import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  Quest,
  Habit,
  Skill,
  FocusTree,
  Difficulty,
  QuestCategory,
  DIFFICULTY_CONFIG,
  SKILL_TREES,
  xpForLevel,
  getTitleForLevel,
} from "@/lib/game-data";

// Ranking system
export type Rank = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export interface Dungeon {
  id: string;
  name: string;
  description: string;
  requiredRank: Rank;
  length: number; // in minutes
  xpReward: number;
  goldReward: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  theme: string;
}

export const RANK_CONFIG: Record<Rank, { level: number; color: string; label: string }> = {
  'F': { level: 1, color: '#8B4513', label: 'F - Beginner' },
  'E': { level: 5, color: '#CD853F', label: 'E - Novice' },
  'D': { level: 10, color: '#DAA520', label: 'D - Apprentice' },
  'C': { level: 20, color: '#4169E1', label: 'C - Journeyman' },
  'B': { level: 35, color: '#32CD32', label: 'B - Expert' },
  'A': { level: 50, color: '#FFD700', label: 'A - Master' },
  'S': { level: 75, color: '#FF69B4', label: 'S - Grandmaster' },
  'SS': { level: 100, color: '#FF4500', label: 'SS - Legend' },
  'SSS': { level: 150, color: '#FF1493', label: 'SSS - Mythic' },
};

export const DUNGEONS: Dungeon[] = [
  // F Rank Dungeons
  {
    id: 'f-training-grounds',
    name: 'Training Grounds',
    description: 'Basic training facility for beginners',
    requiredRank: 'F',
    length: 5,
    xpReward: 50,
    goldReward: 25,
    difficulty: 'easy',
    theme: 'training'
  },
  {
    id: 'f-forest-trials',
    name: 'Forest Trials',
    description: 'Simple forest challenges to test basic skills',
    requiredRank: 'F',
    length: 8,
    xpReward: 80,
    goldReward: 40,
    difficulty: 'easy',
    theme: 'forest'
  },
  
  // E Rank Dungeons
  {
    id: 'e-crystal-caves',
    name: 'Crystal Caves',
    description: 'Underground caves with glowing crystals',
    requiredRank: 'E',
    length: 10,
    xpReward: 120,
    goldReward: 60,
    difficulty: 'easy',
    theme: 'cave'
  },
  {
    id: 'e-river-crossing',
    name: 'River Crossing',
    description: 'Navigate through dangerous river currents',
    requiredRank: 'E',
    length: 12,
    xpReward: 150,
    goldReward: 75,
    difficulty: 'medium',
    theme: 'water'
  },
  
  // D Rank Dungeons
  {
    id: 'd-ancient-ruins',
    name: 'Ancient Ruins',
    description: 'Explore mysterious ruins of an ancient civilization',
    requiredRank: 'D',
    length: 15,
    xpReward: 200,
    goldReward: 100,
    difficulty: 'medium',
    theme: 'ruins'
  },
  {
    id: 'd-sand-wastes',
    name: 'Sand Wastes',
    description: 'Harsh desert environment with limited resources',
    requiredRank: 'D',
    length: 18,
    xpReward: 250,
    goldReward: 125,
    difficulty: 'medium',
    theme: 'desert'
  },
  
  // C Rank Dungeons
  {
    id: 'c-mountain-pass',
    name: 'Mountain Pass',
    description: 'Treacherous mountain path with extreme weather',
    requiredRank: 'C',
    length: 20,
    xpReward: 350,
    goldReward: 175,
    difficulty: 'medium',
    theme: 'mountain'
  },
  {
    id: 'c-shadow-maze',
    name: 'Shadow Maze',
    description: 'Dark maze filled with shadow creatures',
    requiredRank: 'C',
    length: 25,
    xpReward: 450,
    goldReward: 225,
    difficulty: 'hard',
    theme: 'shadow'
  },
  
  // B Rank Dungeons
  {
    id: 'b-volcanic-fortress',
    name: 'Volcanic Fortress',
    description: 'Fortress built inside an active volcano',
    requiredRank: 'B',
    length: 30,
    xpReward: 600,
    goldReward: 300,
    difficulty: 'hard',
    theme: 'volcano'
  },
  {
    id: 'b-ice-palace',
    name: 'Ice Palace',
    description: 'Frozen palace with ice-based challenges',
    requiredRank: 'B',
    length: 35,
    xpReward: 750,
    goldReward: 375,
    difficulty: 'hard',
    theme: 'ice'
  },
  
  // A Rank Dungeons
  {
    id: 'a-dragon-lair',
    name: 'Dragon Lair',
    description: 'Face ancient dragons in their lair',
    requiredRank: 'A',
    length: 45,
    xpReward: 1200,
    goldReward: 600,
    difficulty: 'hard',
    theme: 'dragon'
  },
  {
    id: 'a-time-temple',
    name: 'Time Temple',
    description: 'Temple where time flows differently',
    requiredRank: 'A',
    length: 50,
    xpReward: 1500,
    goldReward: 750,
    difficulty: 'extreme',
    theme: 'time'
  },
  
  // S Rank Dungeons
  {
    id: 's-void-realm',
    name: 'Void Realm',
    description: 'Dimension of pure chaos and energy',
    requiredRank: 'S',
    length: 60,
    xpReward: 2500,
    goldReward: 1250,
    difficulty: 'extreme',
    theme: 'void'
  },
  {
    id: 's-cosmic-abyss',
    name: 'Cosmic Abyss',
    description: 'Journey through the depths of space',
    requiredRank: 'S',
    length: 75,
    xpReward: 3500,
    goldReward: 1750,
    difficulty: 'extreme',
    theme: 'cosmic'
  },
  
  // SS Rank Dungeons
  {
    id: 'ss-inferno',
    name: 'Inferno',
    description: 'Eternal flames of damnation and redemption',
    requiredRank: 'SS',
    length: 90,
    xpReward: 6000,
    goldReward: 3000,
    difficulty: 'extreme',
    theme: 'inferno'
  },
  {
    id: 'ss-divine-trial',
    name: 'Divine Trial',
    description: 'Face the judgment of the gods',
    requiredRank: 'SS',
    length: 120,
    xpReward: 8000,
    goldReward: 4000,
    difficulty: 'extreme',
    theme: 'divine'
  },
  
  // SSS Rank Dungeons
  {
    id: 'sss-chaos-realm',
    name: 'Chaos Realm',
    description: 'The ultimate test of strength and will',
    requiredRank: 'SSS',
    length: 150,
    xpReward: 15000,
    goldReward: 7500,
    difficulty: 'extreme',
    theme: 'chaos'
  },
  {
    id: 'sss-omega-dungeon',
    name: 'Omega Dungeon',
    description: 'The final challenge for the chosen ones',
    requiredRank: 'SSS',
    length: 180,
    xpReward: 20000,
    goldReward: 10000,
    difficulty: 'extreme',
    theme: 'omega'
  }
];

// Helper functions
export const getRankForLevel = (level: number): Rank => {
  if (level >= 150) return 'SSS';
  if (level >= 100) return 'SS';
  if (level >= 75) return 'S';
  if (level >= 50) return 'A';
  if (level >= 35) return 'B';
  if (level >= 20) return 'C';
  if (level >= 10) return 'D';
  if (level >= 5) return 'E';
  return 'F';
};

export const getAvailableDungeons = (rank: Rank): Dungeon[] => {
  return DUNGEONS.filter(dungeon => {
    const dungeonRankValue = Object.keys(RANK_CONFIG).indexOf(dungeon.requiredRank);
    const playerRankValue = Object.keys(RANK_CONFIG).indexOf(rank);
    return dungeonRankValue <= playerRankValue;
  });
};

export interface ActivityEntry {
  date: string; // YYYY-MM-DD
  xp: number;
  quests: number;
  habits: number;
}

interface GameState {
  level: number;
  xp: number;
  xpToNext: number;
  gold: number;
  skillPoints: number;
  title: string;
  rank: string;
  quests: Quest[];
  habits: Habit[];
  skills: Skill[];
  totalTasksCompleted: number;
  totalXpEarned: number;
  longestStreak: number;
  dungeonsCompleted: number;
  inventory: string[];
  activityLog: ActivityEntry[];
  forest: FocusTree[];
  currentDungeon: Dungeon | null;
  dungeonProgress: number;
}

interface GameContextType extends GameState {
  addQuest: (title: string, description: string, difficulty: Difficulty, category: QuestCategory) => void;
  completeQuest: (id: string) => void;
  deleteQuest: (id: string) => void;
  addHabit: (title: string, frequency: "daily" | "weekly") => void;
  completeHabit: (id: string) => void;
  deleteHabit: (id: string) => void;
  unlockSkill: (id: string) => void;
  addXpAndGold: (xp: number, gold: number) => void;
  purchaseItem: (id: string, price: number) => boolean;
  startDungeon: (dungeonId: string) => void;
  completeDungeon: () => void;
  updateRank: () => void;
  plantTree: (seedType: string) => void;
  waterTree: (treeId: string) => void;
  levelUpEvents: number;
}

const STORAGE_KEY = "questforge_state";

const defaultState: GameState = {
  level: 1,
  xp: 0,
  xpToNext: xpForLevel(1),
  gold: 0,
  skillPoints: 0,
  title: "Novice",
  rank: 'F',
  quests: [],
  habits: [],
  skills: [...SKILL_TREES],
  totalTasksCompleted: 0,
  totalXpEarned: 0,
  longestStreak: 0,
  dungeonsCompleted: 0,
  inventory: [],
  activityLog: [],
  forest: [],
  currentDungeon: null,
  dungeonProgress: 0,
};

const defaultContextValue: GameContextType = {
  ...defaultState,
  addQuest: () => undefined,
  completeQuest: () => undefined,
  deleteQuest: () => undefined,
  addHabit: () => undefined,
  completeHabit: () => undefined,
  deleteHabit: () => undefined,
  unlockSkill: () => undefined,
  addXpAndGold: () => undefined,
  purchaseItem: () => false,
  startDungeon: () => undefined,
  completeDungeon: () => undefined,
  updateRank: () => undefined,
  plantTree: () => undefined,
  waterTree: () => undefined,
  levelUpEvents: 0,
};

const GameContext = createContext<GameContextType>(defaultContextValue);

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const savedSkills: Skill[] = Array.isArray(parsed.skills) ? parsed.skills : [];
      const savedSkillIds = new Set(savedSkills.map((skill) => skill.id));
      const newSkills = SKILL_TREES.filter((skill) => !savedSkillIds.has(skill.id));

      return {
        ...defaultState,
        ...parsed,
        skills: [...savedSkills, ...newSkills],
      };
    }
  } catch {
    // Fallback to default state if saved data is corrupted or unavailable.
  }

  return { ...defaultState };
}

const todayStr = () => new Date().toISOString().slice(0, 10);

function logActivity(log: ActivityEntry[], xp: number, quests: number, habits: number): ActivityEntry[] {
  const today = todayStr();
  const copy = [...log];
  const idx = copy.findIndex(e => e.date === today);
  if (idx >= 0) {
    copy[idx] = { ...copy[idx], xp: copy[idx].xp + xp, quests: copy[idx].quests + quests, habits: copy[idx].habits + habits };
  } else {
    copy.push({ date: today, xp, quests, habits });
  }
  return copy.slice(-90); // keep 90 days
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(loadState);
  const [levelUpEvents, setLevelUpEvents] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addXpAndGold = useCallback((xpGain: number, goldGain: number) => {
    setState((prev) => {
      let { xp, level, xpToNext, skillPoints, title } = prev;
      xp += xpGain;

      let leveled = false;
      while (xp >= xpToNext) {
        xp -= xpToNext;
        level += 1;
        skillPoints += 1;
        xpToNext = xpForLevel(level);
        leveled = true;
      }

      if (leveled) {
        title = getTitleForLevel(level);
        setTimeout(() => setLevelUpEvents((value) => value + 1), 100);
      }

      // Grow all trees proportionally to XP gained
      const forest = prev.forest.map(tree => ({
        ...tree,
        growth: tree.growth + Math.max(1, Math.floor(xpGain / 10)),
        xpContributed: tree.xpContributed + xpGain,
      }));

      return {
        ...prev,
        xp,
        level,
        xpToNext,
        skillPoints,
        title,
        gold: prev.gold + goldGain,
        totalXpEarned: prev.totalXpEarned + xpGain,
        activityLog: logActivity(prev.activityLog, xpGain, 0, 0),
        forest,
      };
    });
  }, []);

  const addQuest = useCallback((title: string, description: string, difficulty: Difficulty, category: QuestCategory) => {
    const quest: Quest = {
      id: crypto.randomUUID(),
      title,
      description,
      difficulty,
      category,
      status: "active",
      createdAt: Date.now(),
    };

    setState((prev) => ({ ...prev, quests: [quest, ...prev.quests] }));
  }, []);

  const completeQuest = useCallback((id: string) => {
    setState((prev) => {
      const quest = prev.quests.find((item) => item.id === id);
      if (!quest || quest.status === "completed") return prev;

      const config = DIFFICULTY_CONFIG[quest.difficulty];
      const quests = prev.quests.map((item) =>
        item.id === id ? { ...item, status: "completed" as const, completedAt: Date.now() } : item,
      );

      let { xp, level, xpToNext, skillPoints, title, gold } = prev;
      xp += config.xp;
      gold += config.gold;

      let leveled = false;
      while (xp >= xpToNext) {
        xp -= xpToNext;
        level += 1;
        skillPoints += 1;
        xpToNext = xpForLevel(level);
        leveled = true;
      }

      if (leveled) {
        title = getTitleForLevel(level);
        setTimeout(() => setLevelUpEvents((value) => value + 1), 100);
      }

      const newRank = getRankForLevel(level);
      return {
        ...prev,
        quests,
        xp,
        level,
        xpToNext,
        skillPoints,
        title,
        gold,
        totalTasksCompleted: prev.totalTasksCompleted + 1,
        totalXpEarned: prev.totalXpEarned + config.xp,
        activityLog: logActivity(prev.activityLog, config.xp, 1, 0),
        rank: newRank,
      };
    });
  }, []);

  const deleteQuest = useCallback((id: string) => {
    setState((prev) => ({ ...prev, quests: prev.quests.filter((quest) => quest.id !== id) }));
  }, []);

  const addHabit = useCallback((title: string, frequency: "daily" | "weekly") => {
    const habit: Habit = {
      id: crypto.randomUUID(),
      title,
      frequency,
      streak: 0,
      completedToday: false,
    };

    setState((prev) => ({ ...prev, habits: [habit, ...prev.habits] }));
  }, []);

  const completeHabit = useCallback((id: string) => {
    setState((prev) => {
      const habits = prev.habits.map((habit) => {
        if (habit.id !== id || habit.completedToday) return habit;

        return {
          ...habit,
          streak: habit.streak + 1,
          completedToday: true,
          lastCompleted: Date.now(),
        };
      });

      const habit = habits.find((item) => item.id === id);
      const longestStreak = Math.max(prev.longestStreak, habit?.streak ?? 0);

      let { xp, level, xpToNext, skillPoints, title, gold } = prev;
      const xpGain = 15 + (habit?.streak ?? 0) * 2;
      xp += xpGain;
      gold += 5;

      let leveled = false;
      while (xp >= xpToNext) {
        xp -= xpToNext;
        level += 1;
        skillPoints += 1;
        xpToNext = xpForLevel(level);
        leveled = true;
      }

      if (leveled) {
        title = getTitleForLevel(level);
        setTimeout(() => setLevelUpEvents((value) => value + 1), 100);
      }

      return {
        ...prev,
        habits,
        longestStreak,
        xp,
        level,
        xpToNext,
        skillPoints,
        title,
        gold,
        totalXpEarned: prev.totalXpEarned + xpGain,
        activityLog: logActivity(prev.activityLog, xpGain, 0, 1),
      };
    });
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setState((prev) => ({ ...prev, habits: prev.habits.filter((habit) => habit.id !== id) }));
  }, []);

  const unlockSkill = useCallback((id: string) => {
    setState((prev) => {
      const skill = prev.skills.find((item) => item.id === id);
      if (!skill || skill.unlocked || prev.skillPoints < skill.cost) return prev;

      if (skill.requires) {
        const requiredSkill = prev.skills.find((item) => item.id === skill.requires);
        if (!requiredSkill?.unlocked) return prev;
      }

      return {
        ...prev,
        skills: prev.skills.map((item) => (item.id === id ? { ...item, unlocked: true } : item)),
        skillPoints: prev.skillPoints - skill.cost,
      };
    });
  }, []);

  const purchaseItem = useCallback((id: string, price: number) => {
    let purchased = false;

    setState((prev) => {
      if (prev.gold < price || prev.inventory.includes(id)) return prev;
      purchased = true;
      return {
        ...prev,
        gold: prev.gold - price,
        inventory: [...prev.inventory, id],
      };
    });

    return purchased;
  }, []);

  const plantTree = useCallback((seedType: string) => {
    const tree: FocusTree = {
      id: crypto.randomUUID(),
      seedType,
      name: "",
      growth: 0,
      plantedAt: Date.now(),
      lastWatered: null,
      xpContributed: 0,
    };
    setState(prev => ({ ...prev, forest: [...prev.forest, tree] }));
  }, []);

  const waterTree = useCallback((treeId: string) => {
    setState(prev => ({
      ...prev,
      forest: prev.forest.map(t =>
        t.id === treeId ? { ...t, growth: t.growth + 5, lastWatered: Date.now() } : t
      ),
    }));
  }, []);

  const updateRank = useCallback(() => {
    setState((prev) => {
      const newRank = getRankForLevel(prev.level);
      return {
        ...prev,
        rank: newRank,
      };
    });
  }, []);

  const startDungeon = useCallback((dungeonId: string) => {
    const dungeon = DUNGEONS.find(d => d.id === dungeonId);
    if (!dungeon) return;

    setState((prev) => {
      const playerRank = getRankForLevel(prev.level);
      const dungeonRankValue = Object.keys(RANK_CONFIG).indexOf(dungeon.requiredRank);
      const playerRankValue = Object.keys(RANK_CONFIG).indexOf(playerRank);
      
      if (dungeonRankValue > playerRankValue) return prev;

      return {
        ...prev,
        currentDungeon: dungeon,
        dungeonProgress: 0,
      };
    });
  }, []);

  const completeDungeon = useCallback(() => {
    setState((prev) => {
      if (!prev.currentDungeon) return prev;

      const newXp = prev.xp + prev.currentDungeon.xpReward;
      const newGold = prev.gold + prev.currentDungeon.goldReward;
      const newLevel = Math.floor((newXp + prev.totalXpEarned) / 100) + 1;
      const newRank = getRankForLevel(newLevel);

      return {
        ...prev,
        xp: newXp,
        gold: newGold,
        level: newLevel,
        rank: newRank,
        dungeonsCompleted: prev.dungeonsCompleted + 1,
        currentDungeon: null,
        dungeonProgress: 0,
        xpToNext: xpForLevel(newLevel),
        title: getTitleForLevel(newLevel),
      };
    });
  }, []);

  return (
    <GameContext.Provider
      value={{
        ...state,
        addQuest,
        completeQuest,
        deleteQuest,
        addHabit,
        completeHabit,
        deleteHabit,
        unlockSkill,
        addXpAndGold,
        purchaseItem,
        startDungeon,
        completeDungeon,
        updateRank,
        plantTree,
        waterTree,
        levelUpEvents,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}

import { useGame } from "@/context/GameContext";
import { Globe, Lock, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const WORLDS = [
  {
    id: "verdant_plains",
    name: "Verdant Plains",
    description: "Rolling green hills where every adventurer begins their journey.",
    levelReq: 1,
    color: "hsl(120, 40%, 35%)",
    icon: "🌿",
    quests: 12,
    boss: "Goblin King",
  },
  {
    id: "crystal_caves",
    name: "Crystal Caves",
    description: "Shimmering underground caverns filled with ancient minerals and lurking dangers.",
    levelReq: 5,
    color: "hsl(200, 60%, 45%)",
    icon: "💎",
    quests: 18,
    boss: "Crystal Golem",
  },
  {
    id: "ember_wastes",
    name: "Ember Wastes",
    description: "A scorched desert where only the determined survive the relentless heat.",
    levelReq: 12,
    color: "hsl(15, 70%, 45%)",
    icon: "🔥",
    quests: 24,
    boss: "Flame Wyrm",
  },
  {
    id: "shadow_realm",
    name: "Shadow Realm",
    description: "A dark dimension where shadows come alive and test your resolve.",
    levelReq: 20,
    color: "hsl(270, 40%, 30%)",
    icon: "🌑",
    quests: 30,
    boss: "Shadow Lord",
  },
  {
    id: "celestial_spire",
    name: "Celestial Spire",
    description: "A floating fortress among the stars, the ultimate test of mastery.",
    levelReq: 35,
    color: "hsl(45, 70%, 50%)",
    icon: "⭐",
    quests: 40,
    boss: "Astral Dragon",
  },
];

export default function Worlds() {
  const { level } = useGame();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Globe className="w-5 h-5" />
        <h1 className="text-2xl font-bold tracking-tight font-display">Worlds</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Explore new realms as you level up. Each world unlocks tougher challenges and greater rewards.
      </p>

      <div className="space-y-4">
        {WORLDS.map((world, i) => {
          const unlocked = level >= world.levelReq;
          return (
            <motion.div
              key={world.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`border border-border rounded-lg overflow-hidden ${
                unlocked ? "bg-card" : "bg-muted/50 opacity-60"
              }`}
            >
              <div className="flex items-stretch">
                {/* Color bar */}
                <div
                  className="w-2 shrink-0"
                  style={{ backgroundColor: unlocked ? world.color : "hsl(var(--muted))" }}
                />
                <div className="flex-1 p-4 flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl shrink-0"
                    style={{
                      backgroundColor: unlocked ? world.color + "22" : "transparent",
                      imageRendering: "pixelated",
                    }}
                  >
                    {unlocked ? world.icon : <Lock className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold font-display text-sm">{world.name}</h3>
                      {unlocked && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">
                          UNLOCKED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{world.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground font-mono">
                      <span>Lv. {world.levelReq} required</span>
                      <span>{world.quests} quests</span>
                      <span>Boss: {world.boss}</span>
                    </div>
                  </div>
                  {unlocked && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              </div>
              {/* Progress bar for current world */}
              {unlocked && i < WORLDS.length - 1 && level < WORLDS[i + 1].levelReq && (
                <div className="px-4 pb-3">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Progress to next world</span>
                    <span className="font-mono">
                      {Math.round(
                        ((level - world.levelReq) / (WORLDS[i + 1].levelReq - world.levelReq)) * 100
                      )}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${((level - world.levelReq) / (WORLDS[i + 1].levelReq - world.levelReq)) * 100}%`,
                        backgroundColor: world.color,
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

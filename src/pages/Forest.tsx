import { useGame } from "@/context/GameContext";
import { useSettings } from "@/context/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";
import { TreePine, Sprout, Leaf, X, Gamepad2 } from "lucide-react";
import { useState, useEffect } from "react";
import { playSound } from "@/lib/sounds";
import { SEED_TYPES } from "@/lib/game-data";
import ForestWorld from "./ForestWorld";

// Forest themes with Zelda-styled biomes
const FOREST_THEMES = [
  {
    id: "verdant_plains",
    name: "Verdant Plains",
    levelReq: 1,
    bg: "#1a3d1a",
    floor: "#2d5a2d",
    wall: "#0f260f",
    accent: "#4ade80",
    path: "#5a7a3d",
    description: "A peaceful starting forest with gentle paths",
  },
  {
    id: "crystal_woods",
    name: "Crystal Woods",
    levelReq: 5,
    bg: "#0f1a2e",
    floor: "#1a2d4d",
    wall: "#0a1220",
    accent: "#60a5fa",
    path: "#1a3d6d",
    description: "Enchanted woodland with magical energy",
  },
  {
    id: "golden_grove",
    name: "Golden Grove",
    levelReq: 10,
    bg: "#2d1a0a",
    floor: "#4d3a2a",
    wall: "#1a0f05",
    accent: "#f97316",
    path: "#6d4a2a",
    description: "Warm forest with golden light filtering through",
  },
  {
    id: "twilight_forest",
    name: "Twilight Forest",
    levelReq: 15,
    bg: "#1a0a2d",
    floor: "#2d1a4d",
    wall: "#0f0520",
    accent: "#a855f7",
    path: "#3d2a5d",
    description: "Mystical forest shrouded in twilight magic",
  },
];

export default function ForestPage() {
  const { forest, gold, plantTree, waterTree, purchaseItem, inventory, level } = useGame();
  const { soundEnabled } = useSettings();
  const [showShop, setShowShop] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [isExploring, setIsExploring] = useState(false);

  const totalGrowth = forest.reduce((sum, t) => sum + t.growth, 0);
  const averageGrowth = forest.length > 0 ? Math.floor(totalGrowth / forest.length) : 0;
  const matureCount = forest.filter(t => t.growth >= 100).length;

  // Auto-select first available theme
  useEffect(() => {
    const availableTheme = FOREST_THEMES.findIndex(theme => level >= theme.levelReq);
    if (availableTheme !== -1 && availableTheme !== selectedTheme) {
      setSelectedTheme(availableTheme);
    }
  }, [level, selectedTheme]);

  const handleExploreExit = () => {
    setIsExploring(false);
  };

  // Main forest exploration view
  if (isExploring) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={handleExploreExit} 
            className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <ForestWorld selectedTheme={selectedTheme} onExit={handleExploreExit} />
      </div>
    );
  }

  // Forest selection screen (similar to GameMode world selection)
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-5 h-5" />
          <h1 className="text-2xl font-bold tracking-tight font-display">Forest World</h1>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          Lv. {level}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Plant seeds to grow your forest. Move around the world with paths, water your trees, and watch them flourish in 5 seconds!
      </p>

      {/* Forest Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Trees", value: forest.length, icon: TreePine, color: "text-emerald-600" },
          { label: "Mature", value: matureCount, icon: Leaf, color: "text-green-500" },
          { label: "Total Growth", value: totalGrowth, icon: Sprout, color: "text-lime-500" },
          { label: "Balance", value: `${gold}g`, icon: null, color: "text-amber-600" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-card border border-border rounded-lg p-4 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            {stat.icon && <stat.icon className={`w-4 h-4 mx-auto mb-2 ${stat.color}`} />}
            {!stat.icon && <span className={`text-xl mx-auto mb-1 block ${stat.color}`}>💰</span>}
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setShowShop(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Sprout className="w-4 h-4" /> Seed Shop
        </button>
        <button
          onClick={() => setIsExploring(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
        >
          <Gamepad2 className="w-4 h-4" /> Enter Forest
        </button>
      </div>

      {/* Forest Biome Selection - Zelda-style grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Forest Biomes</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {FOREST_THEMES.map((theme, i) => {
            const unlocked = level >= theme.levelReq;
            const selected = i === selectedTheme;
            return (
              <motion.button
                key={theme.id}
                onClick={() => unlocked && setSelectedTheme(i)}
                disabled={!unlocked}
                whileHover={unlocked ? { scale: 1.02 } : {}}
                whileTap={unlocked ? { scale: 0.98 } : {}}
                className={`border-2 rounded-lg p-4 text-left transition-all ${
                  selected ? "border-primary bg-primary/10 ring-2 ring-primary" : 
                  unlocked ? "border-border bg-card hover:border-primary/50 cursor-pointer" : "border-muted bg-muted/30 opacity-40 cursor-not-allowed"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Theme preview square */}
                  <div
                    className="w-16 h-16 rounded-lg flex-shrink-0 border border-border/50 flex items-end justify-center p-2 overflow-hidden"
                    style={{ backgroundColor: theme.bg }}
                  >
                    {/* Pixel trees representing the biome */}
                    <div className="space-y-1 text-center">
                      <div style={{ color: theme.accent, fontSize: "12px" }}>🌲</div>
                      <div style={{ color: theme.floor, fontSize: "10px" }}>▀▄</div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-bold font-display text-base">{theme.name}</h3>
                      {selected && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{theme.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs font-mono text-muted-foreground">
                      <span>Level {theme.levelReq}</span>
                      {!unlocked && <span className="text-red-400">Locked</span>}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Seed Shop Modal */}
      <AnimatePresence>
        {showShop && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowShop(false)}
          >
            <motion.div
              className="bg-background border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between sticky top-0 bg-background pb-2 border-b border-border">
                <h2 className="text-lg font-bold font-display">Seed Shop</h2>
                <span className="text-xs font-mono bg-secondary px-2 py-1 rounded-md">{gold}g</span>
              </div>

              <div className="grid gap-3">
                {SEED_TYPES.map(seed => {
                  const owned = inventory.includes(seed.id) || seed.id === "seed_oak";
                  const canAfford = gold >= seed.price;
                  return (
                    <motion.div
                      key={seed.id}
                      className={`flex items-center gap-3 border rounded-lg p-3 transition-all ${
                        owned || canAfford ? "border-border bg-card hover:bg-accent/50" : "border-muted bg-muted/30 opacity-50"
                      }`}
                      whileHover={owned || canAfford ? { scale: 1.02 } : {}}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-lg border border-border/50"
                        style={{ backgroundColor: seed.canopyColor + "22" }}
                      >
                        {seed.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{seed.label}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{seed.description}</p>
                      </div>
                      {owned ? (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-md flex-shrink-0">Owned</span>
                      ) : (
                        <button
                          onClick={() => {
                            if (canAfford) {
                              purchaseItem(seed.id, seed.price);
                              if (soundEnabled) playSound("purchase");
                            }
                          }}
                          disabled={!canAfford}
                          className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 disabled:opacity-40 flex-shrink-0 transition-opacity"
                        >
                          {seed.price}g
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              
              <div className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg space-y-2 mt-4 border border-border/50">
                <p className="font-semibold text-foreground">How to Plant:</p>
                <ol className="space-y-1 ml-3 list-decimal">
                  <li>Buy seeds from this shop</li>
                  <li>Enter the forest world</li>
                  <li>Move with WASD or Arrow keys</li>
                  <li>Use seeds from inventory</li>
                  <li>Trees grow fully in ~5 seconds</li>
                </ol>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

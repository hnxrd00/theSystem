import { useGame } from "@/context/GameContext";
import { useSettings } from "@/context/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";
import { TreePine, Sprout, Leaf, Droplets, MapPin, Globe, Trees, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { playSound } from "@/lib/sounds";
import { SEED_TYPES, FocusTree } from "@/lib/game-data";
import { TreeVisual } from "@/components/TreeVisual";
import ForestWorld from "./ForestWorld";

// Forest themes similar to GameMode world themes
const FOREST_THEMES = [
  {
    id: "serene_grove",
    name: "Serene Grove",
    levelReq: 1,
    bg: "#1a3d1a",
    floor: "#2d5a2d",
    wall: "#0f260f",
    accent: "#4ade80",
    description: "A peaceful starting forest with gentle streams",
  },
  {
    id: "mystic_woods",
    name: "Mystic Woods",
    levelReq: 5,
    bg: "#0f1a2e",
    floor: "#1a2d4d",
    wall: "#0a1220",
    accent: "#60a5fa",
    description: "Enchanted forest with magical flora",
  },
  {
    id: "autumn_forest",
    name: "Autumn Forest",
    levelReq: 10,
    bg: "#2d1a0a",
    floor: "#4d2d1a",
    wall: "#1a0f05",
    accent: "#f97316",
    description: "Golden leaves and warm harvest vibes",
  },
  {
    id: "crystal_grove",
    name: "Crystal Grove",
    levelReq: 15,
    bg: "#1a0a2d",
    floor: "#2d1a4d",
    wall: "#0f0520",
    accent: "#a855f7",
    description: "Glowing crystalline trees and rare plants",
  },
];

export default function ForestPage() {
  const { forest, gold, plantTree, waterTree, purchaseItem, inventory, level } = useGame();
  const { soundEnabled } = useSettings();
  const [showShop, setShowShop] = useState(false);
  const [selectedTree, setSelectedTree] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [isExploring, setIsExploring] = useState(false);

  const totalGrowth = forest.reduce((sum, t) => sum + t.growth, 0);
  const forestLevel = Math.floor(totalGrowth / 100) + 1;

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
        <ForestWorld onExit={handleExploreExit} />
      </div>
    );
  }

  // Forest selection screen (similar to GameMode world selection)
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Trees className="w-5 h-5" />
        <h1 className="text-2xl font-bold tracking-tight font-display">Forest World</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Choose a forest biome to explore, plant trees, and grow your mystical forest!
      </p>

      {/* Forest Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Trees Planted", value: forest.length, icon: TreePine, color: "text-emerald-600" },
          { label: "Forest Level", value: forestLevel, icon: Sprout, color: "text-lime-500" },
          { label: "Total Growth", value: totalGrowth, icon: Leaf, color: "text-green-500" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-card border border-border rounded-lg p-4 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
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
          <Globe className="w-4 h-4" /> Explore Forest
        </button>
      </div>

      {/* Forest Theme Selection */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Forest Biomes</h2>
        <div className="grid gap-3">
          {FOREST_THEMES.map((theme, i) => {
            const unlocked = level >= theme.levelReq;
            const selected = i === selectedTheme;
            return (
              <motion.button
                key={theme.id}
                onClick={() => unlocked && setSelectedTheme(i)}
                disabled={!unlocked}
                whileHover={unlocked ? { scale: 1.01 } : {}}
                whileTap={unlocked ? { scale: 0.99 } : {}}
                className={`border border-border rounded-lg p-4 text-left transition-colors ${
                  selected ? "border-primary bg-primary/5 ring-1 ring-primary" : 
                  unlocked ? "bg-card hover:bg-accent cursor-pointer" : "bg-muted/30 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: theme.accent + "22" }}
                  >
                    {unlocked ? (
                      <span style={{ color: theme.accent }}>{"\ud83c\udf32"}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">{"\ud83d\udd12"}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold font-display text-sm">{theme.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{theme.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-mono">
                      <span>Lv. {theme.levelReq}</span>
                      {selected && <span className="text-primary">Active</span>}
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
              className="bg-background border border-border rounded-lg p-6 w-full max-w-md space-y-4"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display">Seed Shop</h2>
                <span className="text-xs font-mono bg-secondary px-2 py-1 rounded-md">{gold}g</span>
              </div>

              <div className="grid gap-3">
                {SEED_TYPES.map(seed => {
                  const owned = inventory.includes(seed.id) || seed.id === "seed_oak";
                  return (
                    <motion.div
                      key={seed.id}
                      className="flex items-center gap-3 border border-border rounded-lg p-3"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: seed.canopyColor + "33" }}
                      >
                        {seed.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{seed.label}</p>
                        <p className="text-[10px] text-muted-foreground">{seed.description}</p>
                      </div>
                      {owned ? (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-md">Owned</span>
                      ) : (
                        <button
                          onClick={() => {
                            if (gold >= seed.price) {
                              purchaseItem(seed.id, seed.price);
                              if (soundEnabled) playSound("purchase");
                            }
                          }}
                          disabled={gold < seed.price}
                          className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 disabled:opacity-40"
                        >
                          {seed.price}g
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              
              <div className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                <p className="font-medium text-foreground mb-2">How to Plant:</p>
                <div className="space-y-1">
                  <p>1. Buy seeds from the shop</p>
                  <p>2. Click "Explore Forest" to enter world</p>
                  <p>3. Move with WASD/Arrow keys</p>
                  <p>4. Click on green plots to plant</p>
                  <p>5. Trees grow automatically!</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

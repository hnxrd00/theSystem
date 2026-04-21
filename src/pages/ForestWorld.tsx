import { useState, useEffect, useRef, useCallback } from "react";
import { useGame } from "@/context/GameContext";
import { useSettings } from "@/context/SettingsContext";
import { playSound } from "@/lib/sounds";
import { motion } from "framer-motion";
import { TreePine, Sprout, X, Clock, Trees } from "lucide-react";
import { SEED_TYPES, FocusTree } from "@/lib/game-data";

// Constants matching GameMode exactly
const TILE = 16;
const GAME_W = 240;
const GAME_H = 176;

// Forest themes (similar to GameMode world themes)
const FOREST_THEMES = [
  {
    id: "peaceful_meadow",
    name: "Peaceful Meadow",
    levelReq: 1,
    bg: "#87CEEB",
    floor: "#90EE90",
    wall: "#8B7355",
    accent: "#4ade80",
    water: "#4682B4",
    description: "A calm meadow perfect for planting trees",
  },
  {
    id: "golden_field",
    name: "Golden Field",
    levelReq: 5,
    bg: "#FFF8DC",
    floor: "#F5DEB3",
    wall: "#8B4513",
    accent: "#fbbf24",
    water: "#4169E1",
    description: "Sunny fields with rich soil",
  },
  {
    id: "enchanted_grove",
    name: "Enchanted Grove",
    levelReq: 10,
    bg: "#E6E6FA",
    floor: "#98FB98",
    wall: "#6B8E23",
    accent: "#a855f7",
    water: "#20B2AA",
    description: "Magical grove with mystical energy",
  },
];

interface PlantedTree {
  x: number;
  y: number;
  seedType: string;
  plantedAt: number;
  growth: number;
  maxGrowth: number;
}

interface GameState {
  player: {
    x: number;
    y: number;
    facing: number;
  };
  map: number[][];
  plantedTrees: PlantedTree[];
  selectedSeed: string | null;
  plantingMode: boolean;
}

// Simple map generation (copied from GameMode)
function generateMap(w: number, h: number): number[][] {
  const map: number[][] = [];
  for (let y = 0; y < h; y++) {
    map[y] = [];
    for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        map[y][x] = 1; // wall
      } else {
        map[y][x] = 0; // grass
      }
    }
  }
  
  // Add some random walls for structure
  for (let i = 0; i < Math.floor(w * h * 0.1); i++) {
    const rx = Math.floor(Math.random() * (w - 4)) + 2;
    const ry = Math.floor(Math.random() * (h - 4)) + 2;
    if (rx < 4 && ry < 4) continue;
    map[ry][rx] = 1;
  }
  
  return map;
}

export default function ForestWorld({ onExit }: { onExit: () => void }) {
  const { forest, gold, plantTree, inventory, level } = useGame();
  const { soundEnabled } = useSettings();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();
  const gameStateRef = useRef<GameState>();
  const keysRef = useRef<Set<string>>(new Set());
  const lastGrowthUpdate = useRef<number>(0);
  
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [showShop, setShowShop] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState({ treesPlanted: 0, totalGrowth: 0 });

  // Initialize game state
  useEffect(() => {
    const theme = FOREST_THEMES[selectedTheme];
    if (level < theme.levelReq) {
      setSelectedTheme(0);
      return;
    }
    
    gameStateRef.current = {
      player: {
        x: 2 * TILE + TILE / 2,
        y: 2 * TILE + TILE / 2,
        facing: 0,
      },
      map: generateMap(20, 15),
      plantedTrees: [],
      selectedSeed: null,
      plantingMode: false,
    };
    
    setGameOver(false);
    setScore({ treesPlanted: 0, totalGrowth: 0 });
  }, [selectedTheme, level]);

  // Keyboard controls (copied from GameMode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === 'Escape') {
        const gs = gameStateRef.current;
        if (gs) {
          gs.plantingMode = false;
          gs.selectedSeed = null;
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle canvas click for planting
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const gs = gameStateRef.current;
    if (!canvas || !gs || !gs.plantingMode || !gs.selectedSeed) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Convert to tile coordinates
    const tileX = Math.floor(x / TILE);
    const tileY = Math.floor(y / TILE);
    
    // Check if valid planting location
    if (tileX >= 0 && tileX < gs.map[0].length && tileY >= 0 && tileY < gs.map.length) {
      if (gs.map[tileY][tileX] === 0) { // Only on grass tiles
        // Check distance from player
        const playerTileX = Math.floor(gs.player.x / TILE);
        const playerTileY = Math.floor(gs.player.y / TILE);
        const distance = Math.abs(tileX - playerTileX) + Math.abs(tileY - playerTileY);
        
        if (distance <= 3) { // Within 3 tiles
          // Check if already has a tree
          const hasTree = gs.plantedTrees.some(tree => tree.x === tileX && tree.y === tileY);
          if (!hasTree) {
            // Plant the tree
            const newTree: PlantedTree = {
              x: tileX,
              y: tileY,
              seedType: gs.selectedSeed,
              plantedAt: Date.now(),
              growth: 0,
              maxGrowth: 100,
            };
            
            gs.plantedTrees.push(newTree);
            
            // Also add to game context
            plantTree(gs.selectedSeed);
            
            // Update score
            setScore(prev => ({
              treesPlanted: prev.treesPlanted + 1,
              totalGrowth: prev.totalGrowth
            }));
            
            if (soundEnabled) playSound("skillUnlock");
            
            // Exit planting mode
            gs.plantingMode = false;
            gs.selectedSeed = null;
          }
        } else {
          if (soundEnabled) playSound("error");
        }
      }
    }
  }, [plantTree, soundEnabled]);

  // Game loop (copied from GameMode structure)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameOver) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const theme = FOREST_THEMES[selectedTheme];
    const loop = () => {
      const gs = gameStateRef.current;
      if (!gs) return;

      const { player, map, plantedTrees } = gs;
      const keys = keysRef.current;

      // Update tree growth (10 seconds to full growth)
      const now = Date.now();
      if (now - lastGrowthUpdate.current > 100) { // Update every 100ms
        lastGrowthUpdate.current = now;
        
        plantedTrees.forEach(tree => {
          if (tree.growth < tree.maxGrowth) {
            tree.growth += 1; // Grow 1% per 100ms = 10 seconds to full growth
            
            // Update total growth score
            setScore(prev => ({
              ...prev,
              totalGrowth: prev.totalGrowth + 1
            }));
          }
        });
      }

      // Player movement (copied from GameMode)
      const speed = 1.5;
      let dx = 0, dy = 0;
      if (keys.has("w") || keys.has("arrowup")) dy -= speed;
      if (keys.has("s") || keys.has("arrowdown")) dy += speed;
      if (keys.has("a") || keys.has("arrowleft")) dx -= speed;
      if (keys.has("d") || keys.has("arrowright")) dx += speed;

      if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
      }

      if (dx !== 0 || dy !== 0) {
        player.facing = Math.atan2(dy, dx);
      }

      // Collision check (copied from GameMode)
      const checkCollision = (x: number, y: number, r: number) => {
        const tx1 = Math.floor((x - r) / TILE);
        const tx2 = Math.floor((x + r) / TILE);
        const ty1 = Math.floor((y - r) / TILE);
        const ty2 = Math.floor((y + r) / TILE);
        
        for (let ty = ty1; ty <= ty2; ty++) {
          for (let tx = tx1; tx <= tx2; tx++) {
            if (ty < 0 || ty >= map.length || tx < 0 || tx >= map[0].length) return true;
            if (map[ty][tx] === 1) return true;
          }
        }
        return false;
      };

      const newX = player.x + dx;
      const newY = player.y + dy;
      if (!checkCollision(newX, player.y, 5)) player.x = newX;
      if (!checkCollision(player.x, newY, 5)) player.y = newY;

      // Clear canvas
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, GAME_W, GAME_H);

      // Calculate camera (copied from GameMode)
      const camX = Math.max(0, Math.min(map[0].length * TILE - GAME_W, player.x - GAME_W / 2));
      const camY = Math.max(0, Math.min(map.length * TILE - GAME_H, player.y - GAME_H / 2));

      // Draw map (copied from GameMode)
      const startX = Math.floor(camX / TILE);
      const startY = Math.floor(camY / TILE);
      const endX = Math.min(map[0].length, startX + Math.ceil(GAME_W / TILE) + 1);
      const endY = Math.min(map.length, startY + Math.ceil(GAME_H / TILE) + 1);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const screenX = x * TILE - camX;
          const screenY = y * TILE - camY;
          
          if (map[y][x] === 1) {
            ctx.fillStyle = theme.wall;
          } else {
            ctx.fillStyle = theme.floor;
          }
          ctx.fillRect(screenX, screenY, TILE, TILE);
        }
      }

      // Draw planted trees
      plantedTrees.forEach(tree => {
        const screenX = tree.x * TILE - camX;
        const screenY = tree.y * TILE - camY;
        
        const seed = SEED_TYPES.find(s => s.id === tree.seedType);
        if (seed) {
          const growthPercent = tree.growth / tree.maxGrowth;
          const size = 4 + growthPercent * 8; // Grows from 4px to 12px
          
          // Tree trunk
          ctx.fillStyle = "#8B4513";
          ctx.fillRect(screenX + TILE/2 - 1, screenY + TILE/2, 2, 4);
          
          // Tree canopy
          ctx.fillStyle = seed.canopyColor;
          ctx.fillRect(screenX + TILE/2 - size/2, screenY + TILE/2 - size/2, size, size);
          
          // Growth indicator
          if (growthPercent < 1) {
            ctx.fillStyle = "#fff";
            ctx.fillRect(screenX + TILE/2 - 1, screenY + TILE/2 - 1, 2, 2);
          }
        }
      });

      // Draw player (copied from GameMode style)
      const playerScreenX = player.x - camX;
      const playerScreenY = player.y - camY;
      
      ctx.fillStyle = "#FFDCB0"; // Skin color
      ctx.fillRect(playerScreenX - 3, playerScreenY - 3, 6, 6);
      ctx.fillRect(playerScreenX - 2, playerScreenY - 6, 4, 4);
      
      // Direction indicator
      ctx.fillStyle = "#fff";
      ctx.fillRect(
        playerScreenX + Math.cos(player.facing) * 6 - 1,
        playerScreenY + Math.sin(player.facing) * 6 - 1,
        2, 2
      );

      // HUD (copied from GameMode)
      ctx.fillStyle = "#00000080";
      ctx.fillRect(0, 0, GAME_W, 16);
      
      ctx.fillStyle = "#4ade80";
      ctx.font = "8px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Trees: ${plantedTrees.length}`, 4, 11);
      
      ctx.fillStyle = "#fff";
      ctx.font = "8px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`Growth: ${score.totalGrowth}`, GAME_W - 4, 11);

      // Planting mode overlay
      if (gs.plantingMode && gs.selectedSeed) {
        ctx.fillStyle = "rgba(74, 222, 128, 0.3)";
        ctx.fillRect(0, 0, GAME_W, GAME_H);
        
        const seed = SEED_TYPES.find(s => s.id === gs.selectedSeed);
        if (seed) {
          ctx.fillStyle = "#fff";
          ctx.font = "10px monospace";
          ctx.textAlign = "center";
          ctx.fillText(`Planting: ${seed.label}`, GAME_W / 2, 20);
          ctx.fillText("Click grass to plant", GAME_W / 2, 35);
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [selectedTheme, gameOver, score.totalGrowth]);

  const handlePlant = (seedType: string) => {
    const gs = gameStateRef.current;
    if (gs) {
      gs.selectedSeed = seedType;
      gs.plantingMode = true;
      setShowShop(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
      <div className="absolute top-4 right-4 z-10">
        <button onClick={onExit} className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="mb-3 flex items-center gap-3 text-sm">
        <span className="text-muted-foreground font-display">{FOREST_THEMES[selectedTheme].name}</span>
        <div className="flex items-center gap-2 text-xs font-mono">
          <Trees className="w-3.5 h-3.5" />
          {score.treesPlanted} trees
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-gold">{"\ud83d\udcb0"} {gold}g</span>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        width={GAME_W}
        height={GAME_H}
        className="border-2 border-border rounded-md"
        style={{ width: GAME_W * 3, height: GAME_H * 3, imageRendering: "pixelated" }}
        onClick={handleCanvasClick}
      />
      
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => setShowShop(true)}
          className="flex items-center gap-2 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
        >
          <Sprout className="w-3 h-3" />
          Seed Shop
        </button>
        
        <select
          value={selectedTheme}
          onChange={(e) => setSelectedTheme(Number(e.target.value))}
          className="text-xs bg-card border border-border rounded px-2 py-1"
        >
          {FOREST_THEMES.map((theme, i) => (
            <option key={theme.id} value={i} disabled={level < theme.levelReq}>
              {theme.name} {level < theme.levelReq && `(Lv.${theme.levelReq})`}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground space-y-1 text-center">
        <p>WASD / Arrow keys to move · Click to plant trees</p>
        <p>Trees grow to full size in 10 seconds</p>
        {gameStateRef.current?.plantingMode && <p className="text-primary">Planting mode active - ESC to cancel</p>}
      </div>

      {/* Seed Shop Modal */}
      {showShop && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowShop(false)}
        >
          <motion.div
            className="bg-background border border-border rounded-lg p-6 w-full max-w-md space-y-4"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
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
                  <motion.button
                    key={seed.id}
                    onClick={() => {
                      if (owned || gold >= seed.price) {
                        if (!owned) {
                          // Purchase would go here if needed
                        }
                        handlePlant(seed.id);
                      }
                    }}
                    disabled={!owned && gold < seed.price}
                    className="flex items-center gap-3 border border-border rounded-lg p-3 text-left transition-colors disabled:opacity-50"
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
                      <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-md">Plant</span>
                    ) : (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md">{seed.price}g</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

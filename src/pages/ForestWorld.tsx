import { useState, useEffect, useRef, useCallback } from "react";
import { useGame } from "@/context/GameContext";
import { useSettings } from "@/context/SettingsContext";
import { playSound } from "@/lib/sounds";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, X, Trees } from "lucide-react";
import { SEED_TYPES } from "@/lib/game-data";

// Constants matching GameMode exactly
const TILE = 16;
const GAME_W = 320;
const GAME_H = 240;
const GROWTH_TIME = 5000; // 5 seconds to full growth

// Forest themes with Zelda-styled paths
const FOREST_THEMES = [
  {
    id: "verdant_plains",
    name: "Verdant Plains",
    levelReq: 1,
    bg: "#1a3d1a",
    floor: "#2d5a2d",
    path: "#5a7a3d",
    wall: "#0f260f",
    accent: "#4ade80",
    description: "A peaceful starting forest with gentle paths",
  },
  {
    id: "crystal_woods",
    name: "Crystal Woods",
    levelReq: 5,
    bg: "#0f1a2e",
    floor: "#1a2d4d",
    path: "#1a3d6d",
    wall: "#0a1220",
    accent: "#60a5fa",
    description: "Enchanted woodland with magical energy",
  },
  {
    id: "golden_grove",
    name: "Golden Grove",
    levelReq: 10,
    bg: "#2d1a0a",
    floor: "#4d3a2a",
    path: "#6d4a2a",
    wall: "#1a0f05",
    accent: "#f97316",
    description: "Warm forest with golden light filtering through",
  },
  {
    id: "twilight_forest",
    name: "Twilight Forest",
    levelReq: 15,
    bg: "#1a0a2d",
    floor: "#2d1a4d",
    path: "#3d2a5d",
    wall: "#0f0520",
    accent: "#a855f7",
    description: "Mystical forest shrouded in twilight magic",
  },
];

interface PlantedTree {
  id: string;
  x: number;
  y: number;
  seedType: string;
  plantedAt: number;
  growth: number; // 0-100
}

interface GameState {
  player: {
    x: number;
    y: number;
    facing: number;
  };
  map: number[][];
  plantedTrees: PlantedTree[];
  frame: number;
}

// Improved map generation with winding paths (Zelda-style)
function generateMapWithPaths(w: number, h: number): number[][] {
  const map: number[][] = [];
  
  // Initialize with all grass
  for (let y = 0; y < h; y++) {
    map[y] = [];
    for (let x = 0; x < w; x++) {
      map[y][x] = 0; // grass
    }
  }

  // Add border walls
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        map[y][x] = 1; // wall
      }
    }
  }

  // Add winding paths (type 2 = path)
  // Horizontal main path
  for (let x = 2; x < w - 2; x++) {
    map[Math.floor(h / 2)][x] = 2;
  }
  
  // Vertical main path
  for (let y = 2; y < h - 2; y++) {
    map[y][Math.floor(w / 2)] = 2;
  }

  // Add crossing paths to create a cross pattern
  for (let x = 2; x < w - 2; x++) {
    map[Math.floor(h / 3)][x] = 2;
    map[Math.floor(2 * h / 3)][x] = 2;
  }

  for (let y = 2; y < h - 2; y++) {
    map[y][Math.floor(w / 3)] = 2;
    map[y][Math.floor(2 * w / 3)] = 2;
  }

  // Add some wall clusters for structure
  for (let i = 0; i < Math.floor(w * h * 0.08); i++) {
    const rx = Math.floor(Math.random() * (w - 6)) + 3;
    const ry = Math.floor(Math.random() * (h - 6)) + 3;
    
    // Don't place on paths or spawn area
    if (map[ry][rx] !== 0) continue;
    if (rx < 4 && ry < 4) continue;
    
    map[ry][rx] = 1;
    
    // Add some wall extensions
    if (Math.random() > 0.6) {
      for (let j = 1; j < 3; j++) {
        const dir = Math.random() > 0.5;
        const nx = dir ? rx + j : rx;
        const ny = dir ? ry : ry + j;
        if (nx > 1 && nx < w - 2 && ny > 1 && ny < h - 2 && map[ny][nx] === 0) {
          map[ny][nx] = 1;
        }
      }
    }
  }

  return map;
}

export default function ForestWorld({ selectedTheme, onExit }: { selectedTheme: number; onExit: () => void }) {
  const { forest, inventory, level, plantTree } = useGame();
  const { soundEnabled } = useSettings();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const gameStateRef = useRef<GameState | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const lastUpdateRef = useRef<number>(Date.now());

  const [seedInventory, setSeedInventory] = useState<Map<string, number>>(new Map());
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const [plantingMode, setPlantingMode] = useState(false);
  const [treesPlanted, setTreesPlanted] = useState(0);
  const [totalGrowth, setTotalGrowth] = useState(0);
  const [showInventory, setShowInventory] = useState(false);

  const theme = FOREST_THEMES[selectedTheme];

  // Initialize seed inventory from game inventory
  useEffect(() => {
    const newInv = new Map<string, number>();
    SEED_TYPES.forEach(seed => {
      if (inventory.includes(seed.id) || seed.id === "seed_oak") {
        newInv.set(seed.id, 5); // 5 plantings per seed owned
      }
    });
    setSeedInventory(newInv);
  }, [inventory]);

  // Initialize game state
  useEffect(() => {
    gameStateRef.current = {
      player: {
        x: TILE * 3 + TILE / 2,
        y: TILE * 3 + TILE / 2,
        facing: 0,
      },
      map: generateMapWithPaths(25, 20),
      plantedTrees: [],
      frame: 0,
    };
    setTreesPlanted(0);
    setTotalGrowth(0);
  }, [selectedTheme, level]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);
      
      if (key === "escape") {
        setPlantingMode(false);
        setSelectedSeed(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Handle canvas click for planting
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const gs = gameStateRef.current;
    if (!canvas || !gs || !plantingMode || !selectedSeed) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const tileX = Math.floor(x / TILE);
    const tileY = Math.floor(y / TILE);

    const mapW = gs.map[0].length;
    const mapH = gs.map.length;

    if (tileX >= 1 && tileX < mapW - 1 && tileY >= 1 && tileY < mapH - 1) {
      if (gs.map[tileY][tileX] === 0) {
        // Check distance from player (can plant within 4 tiles)
        const playerTileX = Math.floor(gs.player.x / TILE);
        const playerTileY = Math.floor(gs.player.y / TILE);
        const dist = Math.abs(tileX - playerTileX) + Math.abs(tileY - playerTileY);

        if (dist <= 4) {
          // Check if already has a tree
          const hasTree = gs.plantedTrees.some(t => t.x === tileX && t.y === tileY);
          if (!hasTree) {
            // Plant the tree
            const newTree: PlantedTree = {
              id: crypto.randomUUID(),
              x: tileX,
              y: tileY,
              seedType: selectedSeed,
              plantedAt: Date.now(),
              growth: 0,
            };

            gs.plantedTrees.push(newTree);
            plantTree(selectedSeed);
            setTreesPlanted(prev => prev + 1);

            // Decrease seed inventory
            setSeedInventory(prev => {
              const newMap = new Map(prev);
              const count = newMap.get(selectedSeed) || 0;
              if (count > 1) {
                newMap.set(selectedSeed, count - 1);
              } else {
                newMap.delete(selectedSeed);
              }
              return newMap;
            });

            if (soundEnabled) playSound("skillUnlock");
            setPlantingMode(false);
          } else {
            if (soundEnabled) playSound("error");
          }
        } else {
          if (soundEnabled) playSound("error");
        }
      }
    }
  }, [plantingMode, selectedSeed, plantTree, soundEnabled]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const gs = gameStateRef.current;
      if (!gs) return;
      
      gs.frame++;
      const now = Date.now();
      const deltaTime = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      const { player, map, plantedTrees } = gs;
      const keys = keysRef.current;
      const mapW = map[0].length;
      const mapH = map.length;

      // Update tree growth
      plantedTrees.forEach(tree => {
        const elapsed = now - tree.plantedAt;
        const newGrowth = Math.min(100, (elapsed / GROWTH_TIME) * 100);
        const growthDelta = newGrowth - tree.growth;
        tree.growth = newGrowth;
        setTotalGrowth(prev => prev + growthDelta);
      });

      // Player movement
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

      // Collision check
      const checkCollision = (x: number, y: number, r: number) => {
        const tx1 = Math.floor((x - r) / TILE);
        const tx2 = Math.floor((x + r) / TILE);
        const ty1 = Math.floor((y - r) / TILE);
        const ty2 = Math.floor((y + r) / TILE);

        for (let ty = ty1; ty <= ty2; ty++) {
          for (let tx = tx1; tx <= tx2; tx++) {
            if (ty < 0 || ty >= mapH || tx < 0 || tx >= mapW) return true;
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

      // Calculate camera
      const camX = Math.max(0, Math.min(mapW * TILE - GAME_W, player.x - GAME_W / 2));
      const camY = Math.max(0, Math.min(mapH * TILE - GAME_H, player.y - GAME_H / 2));

      // Draw map with paths
      const startTX = Math.floor(camX / TILE);
      const startTY = Math.floor(camY / TILE);
      const endTX = Math.min(mapW, startTX + Math.ceil(GAME_W / TILE) + 1);
      const endTY = Math.min(mapH, startTY + Math.ceil(GAME_H / TILE) + 1);

      for (let ty = startTY; ty < endTY; ty++) {
        for (let tx = startTX; tx < endTX; tx++) {
          const sx = tx * TILE - camX;
          const sy = ty * TILE - camY;

          if (map[ty][tx] === 1) {
            // Wall
            ctx.fillStyle = theme.wall;
            ctx.fillRect(sx, sy, TILE, TILE);
            ctx.fillStyle = theme.accent + "20";
            ctx.fillRect(sx, sy, TILE, 2);
          } else if (map[ty][tx] === 2) {
            // Path
            ctx.fillStyle = theme.path;
            ctx.fillRect(sx, sy, TILE, TILE);
            ctx.strokeStyle = theme.path + "80";
            ctx.lineWidth = 0.5;
            ctx.strokeRect(sx, sy, TILE, TILE);
          } else {
            // Floor/grass
            ctx.fillStyle = theme.floor;
            ctx.fillRect(sx, sy, TILE, TILE);
            ctx.strokeStyle = theme.wall + "30";
            ctx.lineWidth = 0.5;
            ctx.strokeRect(sx, sy, TILE, TILE);
          }
        }
      }

      // Draw planted trees with pixel art
      plantedTrees.forEach(tree => {
        const sx = tree.x * TILE - camX;
        const sy = tree.y * TILE - camY;

        const seed = SEED_TYPES.find(s => s.id === tree.seedType);
        if (seed) {
          const growthPercent = tree.growth / 100;
          const size = 2 + growthPercent * 10; // Grows from 2px to 12px

          // Draw tree with trunk and canopy
          const trunkH = Math.max(1, Math.ceil(growthPercent * 4));
          
          // Trunk (brown)
          ctx.fillStyle = seed.trunkColor;
          ctx.fillRect(
            sx + TILE / 2 - 1,
            sy + TILE / 2 + 2 - trunkH,
            2,
            trunkH
          );

          // Canopy (circular/square pixel style)
          ctx.fillStyle = seed.canopyColor;
          const canopySize = Math.max(2, size);
          ctx.fillRect(
            sx + TILE / 2 - canopySize / 2,
            sy + TILE / 2 - canopySize / 2 - 2,
            canopySize,
            canopySize
          );

          // If flower exists, draw it
          if (seed.flowerColor && growthPercent > 0.5) {
            ctx.fillStyle = seed.flowerColor;
            ctx.fillRect(
              sx + TILE / 2 - 1,
              sy + TILE / 2 - canopySize / 2 - 3,
              2,
              2
            );
          }

          // Growth indicator (small dot for intermediate growth)
          if (growthPercent < 0.7 && growthPercent > 0.2) {
            ctx.fillStyle = "#fff";
            ctx.fillRect(sx + TILE / 2 - 0.5, sy + TILE / 2 - canopySize / 2 - 4, 1, 1);
          }
        }
      });

      // Draw player
      const px = player.x - camX;
      const py = player.y - camY;

      // Player body (simple pixel character)
      ctx.fillStyle = "#FFDCB0"; // Skin
      ctx.fillRect(px - 3, py - 3, 6, 6);
      
      // Head
      ctx.fillRect(px - 2, py - 7, 4, 4);

      // Direction indicator
      ctx.fillStyle = "#fff";
      ctx.fillRect(
        px + Math.cos(player.facing) * 5 - 1,
        py + Math.sin(player.facing) * 5 - 1,
        2,
        2
      );

      // Draw HUD
      ctx.fillStyle = "#00000080";
      ctx.fillRect(0, 0, GAME_W, 20);

      ctx.fillStyle = "#4ade80";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Trees: ${plantedTrees.length}`, 6, 14);

      ctx.fillStyle = "#a3e635";
      ctx.fillText(`Growth: ${Math.floor(totalGrowth)}`, 6, 26);

      ctx.fillStyle = "#fff";
      ctx.textAlign = "right";
      ctx.fillText(theme.name, GAME_W - 6, 14);

      // Planting mode overlay
      if (plantingMode && selectedSeed) {
        ctx.fillStyle = "rgba(74, 222, 128, 0.2)";
        ctx.fillRect(0, 0, GAME_W, GAME_H);

        const seed = SEED_TYPES.find(s => s.id === selectedSeed);
        if (seed) {
          ctx.fillStyle = "#fff";
          ctx.font = "12px monospace";
          ctx.textAlign = "center";
          ctx.fillText(`Planting: ${seed.label}`, GAME_W / 2, 40);
          ctx.font = "10px monospace";
          ctx.fillText("Click grass to plant", GAME_W / 2, 55);
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [theme, plantingMode, selectedSeed, soundEnabled]);

  const handlePlantSeed = (seedId: string) => {
    if (seedInventory.has(seedId)) {
      setSelectedSeed(seedId);
      setPlantingMode(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-4 p-4">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onExit}
          className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Header info */}
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-muted-foreground font-display">{theme.name}</span>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span>Trees: {treesPlanted}</span>
          <span className="text-accent">Growth: {Math.floor(totalGrowth)}</span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={GAME_W}
        height={GAME_H}
        className="border-4 border-border rounded-lg shadow-lg"
        style={{
          width: `${GAME_W * 2.5}px`,
          height: `${GAME_H * 2.5}px`,
          imageRendering: "pixelated",
        }}
        onClick={handleCanvasClick}
      />

      {/* Controls */}
      <div className="text-xs text-muted-foreground space-y-1 text-center max-w-md">
        <p>⬆️⬇️⬅️➡️ Move · Select seed below to enter planting mode</p>
        <p>Press ESC to cancel planting mode</p>
        <p>Trees grow fully in ~5 seconds</p>
      </div>

      {/* Seed selector toolbar */}
      <div className="flex gap-2 flex-wrap justify-center">
        {Array.from(seedInventory.entries()).map(([seedId, count]) => {
          const seed = SEED_TYPES.find(s => s.id === seedId);
          if (!seed) return null;
          
          const isSelected = selectedSeed === seedId;
          return (
            <motion.button
              key={seedId}
              onClick={() => handlePlantSeed(seedId)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground ring-2 ring-primary/50"
                  : "bg-card border border-border hover:border-primary/50"
              }`}
            >
              <span className="text-lg">{seed.emoji}</span>
              <span>{count}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Empty inventory message */}
      {seedInventory.size === 0 && (
        <div className="text-sm text-muted-foreground text-center">
          <p>No seeds in inventory. Buy seeds from the shop to plant!</p>
        </div>
      )}
    </div>
  );
}

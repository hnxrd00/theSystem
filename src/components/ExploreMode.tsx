import { useEffect, useRef, useCallback, useState } from "react";
import { useGame } from "@/context/GameContext";
import { useParticles } from "@/context/ParticleContext";
import { playSound } from "@/lib/sounds";
import { startMusic, startAmbient, stopAllAudio } from "@/lib/ambient-audio";
import { AvatarConfig, DEFAULT_AVATAR } from "@/components/PixelAvatar";
import { X, Clock } from "lucide-react";

const TILE = 16;
const VIEW_W = 256;
const VIEW_H = 192;

// ─── Tile system ───
// 0=grass, 1=tree, 2=water, 3=path_h, 4=flower, 5=bridge, 6=sand,
// 7=house_wall, 8=house_roof, 9=door, 10=well, 11=fence,
// 12=path_v, 13=path_cross, 14=bush, 15=tall_grass, 16=stair_stone,
// 17=market_stall, 18=lamp_post, 19=garden_plot
type TileType = number;

interface NPC {
  x: number; y: number; name: string;
  dialogue: string[]; dialogueIndex: number;
  sprite: "villager" | "merchant" | "sage" | "guard" | "child";
  color: string; hatColor: string; facing: number; idleTimer: number;
}

interface Chest {
  x: number; y: number; opened: boolean;
  reward: { type: "gold" | "xp"; amount: number };
}

interface Sign {
  x: number; y: number; text: string;
}

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; maxLife: number;
  color: string; size: number;
}

interface Wildlife {
  x: number; y: number; vx: number; vy: number;
  type: "butterfly" | "rabbit" | "fish";
  frame: number; timer: number; state: "idle" | "moving";
  color: string; wingPhase: number;
}

const SKIN_COLORS: Record<string, string> = {
  light: "#FFDCB0", tan: "#D4A574", brown: "#8B6F47", dark: "#5C3D2E",
};
const HAIR_COLORS: Record<string, string> = {
  black: "#1A1A1A", brown: "#5C3317", blonde: "#E8D44D", red: "#C0392B", blue: "#2E86C1", white: "#ECF0F1",
};
const ARMOR_COLORS: Record<string, { primary: string; secondary: string }> = {
  none: { primary: "#5B8C5A", secondary: "#4A7A49" },
  leather: { primary: "#8B4513", secondary: "#A0522D" },
  chainmail: { primary: "#A0A0A0", secondary: "#C0C0C0" },
  plate: { primary: "#4A4A4A", secondary: "#6A6A6A" },
  mage_robe: { primary: "#4A148C", secondary: "#6A1B9A" },
  shadow: { primary: "#1A1A2E", secondary: "#16213E" },
  dragon: { primary: "#B71C1C", secondary: "#D32F2F" },
};

interface WorldTheme {
  id: string; name: string;
  grass1: string; grass2: string; grass3: string;
  tree_canopy: string; tree_canopy_light: string; tree_trunk: string;
  water_deep: string; water_mid: string; water_light: string;
  path: string; path_dark: string; path_light: string;
  flower: string[];
  sand: string; sand_dark: string;
  building_wall: string; building_wall_light: string;
  roof: string; roof_dark: string;
  door: string; wood: string; wood_dark: string;
  fence: string;
  well_stone: string;
}

const VERDANT: WorldTheme = {
  id: "verdant_plains", name: "Verdant Plains",
  grass1: "#3a7a3a", grass2: "#348a34", grass3: "#2e7a30",
  tree_canopy: "#1e6e1e", tree_canopy_light: "#2e8e2e", tree_trunk: "#6B4226",
  water_deep: "#1a5276", water_mid: "#2471a3", water_light: "#5dade2",
  path: "#c4a872", path_dark: "#a89060", path_light: "#d4b882",
  flower: ["#e74c3c", "#f39c12", "#9b59b6", "#e67e22", "#f1c40f", "#3498db"],
  sand: "#d4c090", sand_dark: "#baa878",
  building_wall: "#e8d8b8", building_wall_light: "#f0e8d0",
  roof: "#8B4513", roof_dark: "#6B3310",
  door: "#5D3A1A", wood: "#8B6914", wood_dark: "#6B4914",
  fence: "#C4A060", well_stone: "#808080",
};

const THEMES: WorldTheme[] = [
  VERDANT,
  { ...VERDANT, id: "crystal_caves", name: "Crystal Caves",
    grass1: "#1a2d55", grass2: "#1f3565", grass3: "#16284d",
    tree_canopy: "#2c3e7e", tree_canopy_light: "#4060a0", tree_trunk: "#4a3580",
    water_deep: "#0a1230", water_mid: "#152050", water_light: "#2040a0",
    path: "#5a6888", path_dark: "#4a5878", path_light: "#6a78a0",
    flower: ["#60a5fa", "#818cf8", "#a78bfa", "#93c5fd"],
    sand: "#3a4a7a", sand_dark: "#2a3a6a",
    building_wall: "#4a5590", building_wall_light: "#5a65a0",
    roof: "#2a3060", roof_dark: "#1a2050",
    door: "#3a2a50", wood: "#4a3a6a", wood_dark: "#3a2a5a",
    fence: "#5a5a80", well_stone: "#6a6a90",
  },
  { ...VERDANT, id: "ember_wastes", name: "Ember Wastes",
    grass1: "#5a3520", grass2: "#6a4030", grass3: "#4a2a18",
    tree_canopy: "#4a1a0a", tree_canopy_light: "#6a2a1a", tree_trunk: "#3a1008",
    water_deep: "#8B2000", water_mid: "#a03010", water_light: "#c05030",
    path: "#7a5a38", path_dark: "#6a4a28", path_light: "#8a6a48",
    flower: ["#f97316", "#ef4444", "#fbbf24", "#dc2626"],
    sand: "#8a6a40", sand_dark: "#7a5a30",
    building_wall: "#7a5a3a", building_wall_light: "#8a6a4a",
    roof: "#4a1a0a", roof_dark: "#3a0a00",
    door: "#3a1a0a", wood: "#5a3a1a", wood_dark: "#4a2a0a",
    fence: "#6a4a2a", well_stone: "#5a4a3a",
  },
  { ...VERDANT, id: "shadow_realm", name: "Shadow Realm",
    grass1: "#1a0a30", grass2: "#200f38", grass3: "#160a28",
    tree_canopy: "#2a1a44", tree_canopy_light: "#3a2a5a", tree_trunk: "#1a0a22",
    water_deep: "#080420", water_mid: "#120a30", water_light: "#1a1040",
    path: "#3a2a55", path_dark: "#2a1a45", path_light: "#4a3a65",
    flower: ["#a855f7", "#c084fc", "#7c3aed", "#6366f1"],
    sand: "#2a1a48", sand_dark: "#1a0a38",
    building_wall: "#3a2a58", building_wall_light: "#4a3a68",
    roof: "#1a0a38", roof_dark: "#100528",
    door: "#2a1a40", wood: "#3a2a50", wood_dark: "#2a1a40",
    fence: "#4a3a5a", well_stone: "#4a4a5a",
  },
  { ...VERDANT, id: "celestial_spire", name: "Celestial Spire",
    grass1: "#3a3a1a", grass2: "#454520", grass3: "#303018",
    tree_canopy: "#2d2d10", tree_canopy_light: "#4a4a20", tree_trunk: "#6a5a20",
    water_deep: "#3a3a08", water_mid: "#4a4a15", water_light: "#5a5a28",
    path: "#7a7a38", path_dark: "#6a6a28", path_light: "#8a8a48",
    flower: ["#fbbf24", "#f59e0b", "#fde68a", "#fcd34d"],
    sand: "#8a8a40", sand_dark: "#7a7a30",
    building_wall: "#8a8a50", building_wall_light: "#9a9a60",
    roof: "#5a5a20", roof_dark: "#4a4a10",
    door: "#4a4a1a", wood: "#6a6a2a", wood_dark: "#5a5a1a",
    fence: "#7a7a40", well_stone: "#6a6a50",
  },
];

// ─── Map generation with designed village ───

function generateVerdantMap(): TileType[][] {
  const W = 50, H = 45;
  const map: TileType[][] = [];

  // Fill with grass varieties
  for (let y = 0; y < H; y++) {
    map[y] = [];
    for (let x = 0; x < W; x++) {
      const noise = Math.sin(x * 0.8 + y * 1.2) * 0.5 + Math.cos(x * 1.5 - y * 0.7) * 0.5;
      if (noise > 0.6) map[y][x] = 15; // tall grass
      else if (noise > 0.3 && ((x + y) % 7 === 0)) map[y][x] = 4; // flowers
      else map[y][x] = 0; // grass
    }
  }

  // Border trees
  for (let x = 0; x < W; x++) { map[0][x] = 1; map[1][x] = 1; map[H-1][x] = 1; map[H-2][x] = 1; }
  for (let y = 0; y < H; y++) { map[y][0] = 1; map[y][1] = 1; map[y][W-1] = 1; map[y][W-2] = 1; }

  // ─── Village (center-ish) ───
  const vx = 12, vy = 10; // village top-left anchor

  // Clear village area
  for (let y = vy; y < vy + 18; y++) {
    for (let x = vx; x < vx + 22; x++) {
      if (y < H && x < W) map[y][x] = 0;
    }
  }

  // Village paths - main road
  for (let x = vx - 2; x < vx + 24 && x < W - 2; x++) {
    if (map[vy + 8]) map[vy + 8][x] = 3;
    if (map[vy + 9]) map[vy + 9][x] = 3;
  }
  // Cross path
  for (let y = vy; y < vy + 18 && y < H - 2; y++) {
    if (map[y]) { map[y][vx + 10] = 12; map[y][vx + 11] = 12; }
  }
  // Crossroads
  if (map[vy + 8]) { map[vy + 8][vx + 10] = 13; map[vy + 8][vx + 11] = 13; }
  if (map[vy + 9]) { map[vy + 9][vx + 10] = 13; map[vy + 9][vx + 11] = 13; }

  // ─── House 1 (Elder's house, top-left of village) ───
  const h1x = vx + 2, h1y = vy + 2;
  for (let y = h1y; y < h1y + 4; y++) {
    for (let x = h1x; x < h1x + 5; x++) {
      map[y][x] = y < h1y + 2 ? 8 : 7; // roof then wall
    }
  }
  map[h1y + 3][h1x + 2] = 9; // door

  // ─── House 2 (top-right of village) ───
  const h2x = vx + 15, h2y = vy + 2;
  for (let y = h2y; y < h2y + 4; y++) {
    for (let x = h2x; x < h2x + 5; x++) {
      map[y][x] = y < h2y + 2 ? 8 : 7;
    }
  }
  map[h2y + 3][h2x + 2] = 9;

  // ─── House 3 (bottom-left) ───
  const h3x = vx + 3, h3y = vy + 12;
  for (let y = h3y; y < h3y + 4; y++) {
    for (let x = h3x; x < h3x + 4; x++) {
      map[y][x] = y < h3y + 2 ? 8 : 7;
    }
  }
  map[h3y + 3][h3x + 1] = 9;

  // ─── Market stall ───
  map[vy + 11][vx + 16] = 17;
  map[vy + 11][vx + 17] = 17;
  map[vy + 11][vx + 18] = 17;

  // ─── Village well (center) ───
  map[vy + 7][vx + 10] = 10;
  map[vy + 7][vx + 11] = 10;

  // ─── Lamp posts along main road ───
  map[vy + 7][vx + 4] = 18;
  map[vy + 7][vx + 18] = 18;
  map[vy + 10][vx + 4] = 18;
  map[vy + 10][vx + 18] = 18;

  // ─── Fences around gardens ───
  for (let x = h3x - 1; x <= h3x + 4; x++) map[h3y - 1][x] = 11;
  // Garden plots
  map[vy + 13][vx + 16] = 19;
  map[vy + 13][vx + 17] = 19;
  map[vy + 14][vx + 16] = 19;
  map[vy + 14][vx + 17] = 19;

  // ─── Bushes decorating village ───
  map[vy + 1][vx + 6] = 14;
  map[vy + 1][vx + 14] = 14;
  map[vy + 6][vx + 1] = 14;
  map[vy + 6][vx + 21] = 14;

  // ─── River (east side) ───
  let rx = 38;
  for (let y = 2; y < H - 2; y++) {
    rx += Math.floor(Math.sin(y * 0.3) * 1.5);
    rx = Math.max(35, Math.min(W - 5, rx));
    for (let dx = -1; dx <= 1; dx++) {
      if (rx + dx > 0 && rx + dx < W - 1) map[y][rx + dx] = 2;
    }
  }

  // Bridges over river
  for (const by of [12, 28]) {
    for (let y = by - 1; y <= by + 1; y++) {
      for (let x = 33; x < W - 2; x++) {
        if (map[y]?.[x] === 2) map[y][x] = 5;
      }
    }
    // Path to bridge
    for (let x = vx + 22; x < 40 && x < W; x++) {
      if (map[by]) map[by][x] = 3;
    }
  }

  // Sandy shores
  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      if (map[y][x] !== 2 && map[y][x] !== 5 && [map[y-1]?.[x], map[y+1]?.[x], map[y]?.[x-1], map[y]?.[x+1]].includes(2)) {
        if (map[y][x] === 0 || map[y][x] === 15) map[y][x] = 6;
      }
    }
  }

  // ─── Forest clusters ───
  const forests = [
    [3, 25, 10, 8], [3, 3, 7, 5], [40, 3, 7, 6], [40, 35, 7, 7],
    [25, 30, 8, 8], [3, 35, 8, 6],
  ];
  for (const [fx, fy, fw, fh] of forests) {
    for (let y = fy; y < fy + fh && y < H - 2; y++) {
      for (let x = fx; x < fx + fw && x < W - 2; x++) {
        if (x > 1 && y > 1 && (map[y][x] === 0 || map[y][x] === 15)) {
          if ((Math.sin(x * 3.7 + y * 2.3) + 1) * 0.5 > 0.3) map[y][x] = 1;
        }
      }
    }
  }

  // ─── Paths from village outward ───
  // South path
  for (let y = vy + 18; y < H - 2; y++) {
    map[y][vx + 10] = 12;
    map[y][vx + 11] = 12;
  }
  // West path
  for (let x = 2; x < vx; x++) {
    map[vy + 8][x] = 3;
    map[vy + 9][x] = 3;
  }
  // North path
  for (let y = 2; y < vy; y++) {
    map[y][vx + 10] = 12;
    map[y][vx + 11] = 12;
  }

  // Clear spawn area
  for (let y = vy + 6; y <= vy + 11; y++) {
    for (let x = vx + 8; x <= vx + 13; x++) {
      if (map[y][x] === 0 || map[y][x] === 15 || map[y][x] === 4) {
        // keep paths/structures, just clear tall grass
        if (map[y][x] === 15) map[y][x] = 0;
      }
    }
  }

  // Stone steps at village entrance
  map[vy + 9][vx - 1] = 16;
  map[vy + 8][vx - 1] = 16;

  return map;
}

function generateGenericMap(seed: number): TileType[][] {
  const W = 45, H = 40;
  const map: TileType[][] = [];
  const rng = (n: number) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) % n);

  for (let y = 0; y < H; y++) {
    map[y] = [];
    for (let x = 0; x < W; x++) {
      map[y][x] = rng(10) === 0 ? 4 : rng(5) === 0 ? 15 : 0;
    }
  }
  for (let x = 0; x < W; x++) { map[0][x] = 1; map[1][x] = 1; map[H-1][x] = 1; map[H-2][x] = 1; }
  for (let y = 0; y < H; y++) { map[y][0] = 1; map[y][1] = 1; map[y][W-1] = 1; map[y][W-2] = 1; }

  // Village center
  const cx = Math.floor(W / 2), cy = Math.floor(H / 2);
  for (let y = cy - 6; y < cy + 6; y++) for (let x = cx - 6; x < cx + 6; x++) if (y > 1 && x > 1) map[y][x] = 0;
  for (let x = cx - 6; x < cx + 6; x++) { map[cy][x] = 3; map[cy + 1][x] = 3; }
  for (let y = cy - 6; y < cy + 6; y++) { map[y][cx] = 12; map[y][cx + 1] = 12; }
  // Houses
  for (let dy of [-4, 3]) for (let dx of [-4, 3]) {
    for (let y = cy + dy; y < cy + dy + 3; y++) for (let x = cx + dx; x < cx + dx + 4; x++) {
      if (y > 1 && x > 1 && y < H-2 && x < W-2) map[y][x] = y < cy + dy + 1 ? 8 : 7;
    }
    map[cy + dy + 2][cx + dx + 1] = 9;
  }
  map[cy - 1][cx] = 10; map[cy - 1][cx + 1] = 10;

  // River
  let rx = Math.floor(W * 0.7);
  for (let y = 2; y < H - 2; y++) {
    rx += rng(3) - 1;
    rx = Math.max(4, Math.min(W - 5, rx));
    for (let dx = -1; dx <= 1; dx++) if (rx + dx > 1 && rx + dx < W - 2) map[y][rx + dx] = 2;
  }
  // Bridges
  for (const by of [Math.floor(H * 0.3), Math.floor(H * 0.7)]) {
    for (let x = 2; x < W - 2; x++) if (map[by]?.[x] === 2) map[by][x] = 5;
  }
  // Sandy shores
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
    if (map[y][x] !== 2 && map[y][x] !== 5 && [map[y-1]?.[x], map[y+1]?.[x], map[y]?.[x-1], map[y]?.[x+1]].includes(2)) {
      if (map[y][x] === 0 || map[y][x] === 15) map[y][x] = 6;
    }
  }
  // Forests
  for (let i = 0; i < 4; i++) {
    const fx = rng(W - 16) + 4, fy = rng(H - 12) + 4;
    for (let y = fy; y < fy + 6; y++) for (let x = fx; x < fx + 7; x++) {
      if (y > 1 && x > 1 && y < H-2 && x < W-2 && (map[y][x] === 0 || map[y][x] === 15) && rng(3) > 0) map[y][x] = 1;
    }
  }
  // Clear spawn
  for (let y = cy - 1; y <= cy + 2; y++) for (let x = cx - 1; x <= cx + 2; x++) {
    if (map[y]?.[x] === 15) map[y][x] = 0;
  }
  return map;
}

// ─── NPC Generation ───

function generateNPCs(worldIndex: number): NPC[] {
  if (worldIndex === 0) {
    const vx = 12, vy = 10;
    return [
      { x: (vx + 4) * TILE, y: (vy + 7) * TILE, name: "Elder Finn", dialogue: [
          "Welcome to our village, adventurer!",
          "The plains are peaceful, but the forests hold secrets.",
          "Seek the treasure chests hidden among the trees.",
          "May your journey bring glory!",
        ], dialogueIndex: 0, sprite: "sage", color: "#4A148C", hatColor: "#7B1FA2", facing: 0, idleTimer: 0 },
      { x: (vx + 17) * TILE, y: (vy + 12) * TILE, name: "Mira the Merchant", dialogue: [
          "Welcome to my stall! Finest goods in the plains!",
          "I trade in rare herbs and crystals.",
          "Check the chests scattered about — finders keepers!",
        ], dialogueIndex: 0, sprite: "merchant", color: "#e67e22", hatColor: "#d35400", facing: 0, idleTimer: 0 },
      { x: (vx + 10) * TILE, y: (vy + 4) * TILE, name: "Lila", dialogue: [
          "Have you seen the flowers by the river? So pretty!",
          "I planted the garden near the south houses!",
          "The well water is the freshest in the kingdom!",
        ], dialogueIndex: 0, sprite: "villager", color: "#3498db", hatColor: "#2980b9", facing: 0, idleTimer: 0 },
      { x: (vx - 1) * TILE, y: (vy + 8) * TILE, name: "Captain Voss", dialogue: [
          "Halt! I guard the western approach.",
          "Stay on the paths and you'll be fine.",
          "The forests can be dangerous at night.",
          "Report anything suspicious to me!",
        ], dialogueIndex: 0, sprite: "guard", color: "#7f8c8d", hatColor: "#95a5a6", facing: 0, idleTimer: 0 },
      { x: (vx + 8) * TILE, y: (vy + 14) * TILE, name: "Pip", dialogue: [
          "Tag! You're it! ...oh wait, you're an adventurer.",
          "I found a cool rock by the river yesterday!",
          "When I grow up I want to be a knight!",
        ], dialogueIndex: 0, sprite: "child", color: "#27ae60", hatColor: "#2ecc71", facing: 0, idleTimer: 0 },
    ];
  }
  // Generic NPCs for other worlds
  const cx = 22, cy = 20;
  return [
    { x: (cx - 2) * TILE, y: (cy - 2) * TILE, name: "Guide", dialogue: ["Welcome, traveler.", "Explore carefully."], dialogueIndex: 0, sprite: "sage", color: "#8e44ad", hatColor: "#9b59b6", facing: 0, idleTimer: 0 },
    { x: (cx + 3) * TILE, y: (cy + 2) * TILE, name: "Trader", dialogue: ["I have wares if you have coin.", "Good luck out there."], dialogueIndex: 0, sprite: "merchant", color: "#e67e22", hatColor: "#d35400", facing: 0, idleTimer: 0 },
  ];
}

function generateChests(worldIndex: number): Chest[] {
  const positions = worldIndex === 0
    ? [[5, 28], [8, 8], [30, 6], [28, 35], [42, 15], [42, 38], [15, 38], [35, 25], [6, 15], [20, 25]]
    : [[8, 8], [35, 8], [8, 30], [30, 30], [20, 15], [15, 25]];
  return positions.map(([tx, ty]) => ({
    x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2, opened: false,
    reward: Math.random() > 0.4
      ? { type: "gold" as const, amount: Math.floor(Math.random() * 12) + 5 }
      : { type: "xp" as const, amount: Math.floor(Math.random() * 20) + 10 },
  }));
}

function generateSigns(worldIndex: number): Sign[] {
  if (worldIndex === 0) {
    const vx = 12, vy = 10;
    return [
      { x: (vx + 9) * TILE, y: (vy + 6) * TILE, text: "⬆ Village Square" },
      { x: (vx - 2) * TILE, y: (vy + 9) * TILE, text: "← Western Wilds" },
      { x: (vx + 22) * TILE, y: (vy + 9) * TILE, text: "River Crossing →" },
      { x: (vx + 10) * TILE, y: (vy + 18) * TILE, text: "↓ Southern Forest" },
      { x: 5 * TILE, y: 28 * TILE, text: "Hidden grove... treasures abound!" },
    ];
  }
  return [
    { x: 10 * TILE, y: 10 * TILE, text: "Explore at your own risk." },
    { x: 30 * TILE, y: 20 * TILE, text: "Treasure may be near..." },
  ];
}

// ─── Tile Renderer ───

function drawTile(ctx: CanvasRenderingContext2D, tile: TileType, sx: number, sy: number, tx: number, ty: number, frame: number, theme: WorldTheme) {
  switch (tile) {
    case 0: { // grass
      const v = ((tx * 7 + ty * 13) % 3);
      ctx.fillStyle = v === 0 ? theme.grass1 : v === 1 ? theme.grass2 : theme.grass3;
      ctx.fillRect(sx, sy, TILE, TILE);
      // subtle grass detail
      if ((tx * 11 + ty * 17) % 5 === 0) {
        ctx.fillStyle = theme.grass2 + "80";
        ctx.fillRect(sx + 3, sy + 10, 1, 3);
        ctx.fillRect(sx + 8, sy + 9, 1, 4);
        ctx.fillRect(sx + 12, sy + 11, 1, 2);
      }
      break;
    }
    case 1: { // tree
      ctx.fillStyle = theme.grass1;
      ctx.fillRect(sx, sy, TILE, TILE);
      // trunk
      ctx.fillStyle = theme.tree_trunk;
      ctx.fillRect(sx + 5, sy + 9, 5, 7);
      ctx.fillStyle = theme.tree_trunk + "80";
      ctx.fillRect(sx + 4, sy + 12, 1, 3);
      // canopy layers
      ctx.fillStyle = theme.tree_canopy;
      ctx.fillRect(sx + 1, sy + 2, 13, 8);
      ctx.fillRect(sx + 3, sy, 9, 3);
      // light dapple
      ctx.fillStyle = theme.tree_canopy_light;
      ctx.fillRect(sx + 2, sy + 3, 4, 3);
      ctx.fillRect(sx + 8, sy + 1, 3, 2);
      ctx.fillRect(sx + 5, sy + 6, 3, 2);
      break;
    }
    case 2: { // water
      const waveOff = Math.sin(frame * 0.04 + tx * 0.5 + ty * 0.3);
      ctx.fillStyle = waveOff > 0.3 ? theme.water_light : waveOff > -0.3 ? theme.water_mid : theme.water_deep;
      ctx.fillRect(sx, sy, TILE, TILE);
      // wave highlight
      ctx.fillStyle = theme.water_light + "40";
      const wx = ((frame * 0.5 + tx * 5) % 14);
      ctx.fillRect(sx + wx, sy + 5 + waveOff * 2, 4, 1);
      ctx.fillRect(sx + (wx + 7) % 14, sy + 11 + waveOff * 1.5, 3, 1);
      break;
    }
    case 3: // path horizontal
    case 12: // path vertical
    case 13: { // path cross
      ctx.fillStyle = theme.path;
      ctx.fillRect(sx, sy, TILE, TILE);
      // edges
      ctx.fillStyle = theme.path_dark;
      if (tile === 3 || tile === 13) { ctx.fillRect(sx, sy, TILE, 1); ctx.fillRect(sx, sy + 15, TILE, 1); }
      if (tile === 12 || tile === 13) { ctx.fillRect(sx, sy, 1, TILE); ctx.fillRect(sx + 15, sy, 1, TILE); }
      // pebbles
      ctx.fillStyle = theme.path_light;
      if ((tx + ty) % 3 === 0) { ctx.fillRect(sx + 4, sy + 7, 2, 2); ctx.fillRect(sx + 10, sy + 4, 1, 1); }
      break;
    }
    case 4: { // flower
      const v = ((tx * 7 + ty * 13) % 3);
      ctx.fillStyle = v === 0 ? theme.grass1 : v === 1 ? theme.grass2 : theme.grass3;
      ctx.fillRect(sx, sy, TILE, TILE);
      const fCol = theme.flower[(tx * 3 + ty * 7) % theme.flower.length];
      // stem
      ctx.fillStyle = "#2d6a2d";
      ctx.fillRect(sx + 7, sy + 8, 1, 5);
      // petals
      ctx.fillStyle = fCol;
      ctx.fillRect(sx + 5, sy + 6, 2, 2);
      ctx.fillRect(sx + 8, sy + 6, 2, 2);
      ctx.fillRect(sx + 6, sy + 4, 3, 2);
      ctx.fillRect(sx + 6, sy + 8, 3, 2);
      // center
      ctx.fillStyle = "#f1c40f";
      ctx.fillRect(sx + 7, sy + 7, 1, 1);
      break;
    }
    case 5: { // bridge
      ctx.fillStyle = theme.wood;
      ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = theme.wood_dark;
      ctx.fillRect(sx, sy, TILE, 2);
      ctx.fillRect(sx, sy + 14, TILE, 2);
      // planks
      ctx.fillRect(sx + 4, sy + 2, 1, 12);
      ctx.fillRect(sx + 11, sy + 2, 1, 12);
      // nails
      ctx.fillStyle = "#888";
      ctx.fillRect(sx + 4, sy + 4, 1, 1);
      ctx.fillRect(sx + 11, sy + 10, 1, 1);
      break;
    }
    case 6: { // sand
      ctx.fillStyle = theme.sand;
      ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = theme.sand_dark;
      if ((tx + ty) % 2 === 0) { ctx.fillRect(sx + 3, sy + 5, 2, 1); ctx.fillRect(sx + 9, sy + 11, 3, 1); }
      break;
    }
    case 7: { // house wall
      ctx.fillStyle = theme.building_wall;
      ctx.fillRect(sx, sy, TILE, TILE);
      // brick pattern
      ctx.fillStyle = theme.building_wall_light;
      const brickOff = ty % 2 === 0 ? 0 : 8;
      ctx.fillRect(sx + brickOff, sy + 1, 7, 6);
      ctx.fillRect(sx + brickOff, sy + 9, 7, 6);
      // mortar lines
      ctx.fillStyle = theme.building_wall + "C0";
      ctx.fillRect(sx, sy + 7, TILE, 1);
      // window
      if ((tx + ty) % 3 === 0) {
        ctx.fillStyle = "#5dade2";
        ctx.fillRect(sx + 5, sy + 3, 4, 4);
        ctx.fillStyle = "#333";
        ctx.fillRect(sx + 7, sy + 3, 1, 4);
        ctx.fillRect(sx + 5, sy + 5, 4, 1);
      }
      break;
    }
    case 8: { // roof
      ctx.fillStyle = theme.roof;
      ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = theme.roof_dark;
      // shingle pattern
      for (let r = 0; r < 3; r++) {
        const rOff = r % 2 === 0 ? 0 : 5;
        for (let c = rOff; c < TILE; c += 10) {
          ctx.fillRect(sx + c, sy + r * 5, 8, 4);
        }
      }
      // ridge
      ctx.fillStyle = theme.roof + "E0";
      ctx.fillRect(sx, sy + TILE - 2, TILE, 2);
      break;
    }
    case 9: { // door
      ctx.fillStyle = theme.building_wall;
      ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = theme.door;
      ctx.fillRect(sx + 4, sy + 2, 8, 14);
      // door frame
      ctx.fillStyle = theme.wood_dark;
      ctx.fillRect(sx + 3, sy + 1, 1, 15);
      ctx.fillRect(sx + 12, sy + 1, 1, 15);
      ctx.fillRect(sx + 3, sy + 1, 10, 1);
      // knob
      ctx.fillStyle = "#D4A017";
      ctx.fillRect(sx + 10, sy + 9, 2, 2);
      break;
    }
    case 10: { // well
      ctx.fillStyle = theme.grass1;
      ctx.fillRect(sx, sy, TILE, TILE);
      // stone base
      ctx.fillStyle = theme.well_stone;
      ctx.fillRect(sx + 2, sy + 4, 12, 10);
      ctx.fillStyle = "#707070";
      ctx.fillRect(sx + 3, sy + 5, 10, 8);
      // water inside
      ctx.fillStyle = theme.water_mid;
      ctx.fillRect(sx + 4, sy + 6, 8, 6);
      // roof beam
      ctx.fillStyle = theme.wood;
      ctx.fillRect(sx + 7, sy, 2, 5);
      ctx.fillRect(sx + 3, sy, 10, 2);
      // bucket
      ctx.fillStyle = theme.wood_dark;
      ctx.fillRect(sx + 6, sy + 2, 3, 2);
      break;
    }
    case 11: { // fence
      ctx.fillStyle = theme.grass1;
      ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = theme.fence;
      // posts
      ctx.fillRect(sx + 1, sy + 4, 2, 10);
      ctx.fillRect(sx + 13, sy + 4, 2, 10);
      // rails
      ctx.fillRect(sx, sy + 6, TILE, 2);
      ctx.fillRect(sx, sy + 11, TILE, 2);
      break;
    }
    case 14: { // bush
      ctx.fillStyle = theme.grass1;
      ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = theme.tree_canopy;
      ctx.fillRect(sx + 2, sy + 6, 12, 8);
      ctx.fillRect(sx + 4, sy + 4, 8, 4);
      ctx.fillStyle = theme.tree_canopy_light;
      ctx.fillRect(sx + 3, sy + 7, 4, 3);
      // berries
      if ((tx + ty) % 2 === 0) {
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(sx + 9, sy + 8, 2, 2);
        ctx.fillRect(sx + 6, sy + 10, 2, 2);
      }
      break;
    }
    case 15: { // tall grass
      const v = ((tx * 7 + ty * 13) % 3);
      ctx.fillStyle = v === 0 ? theme.grass1 : v === 1 ? theme.grass2 : theme.grass3;
      ctx.fillRect(sx, sy, TILE, TILE);
      const sway = Math.sin(frame * 0.03 + tx * 2 + ty) * 1;
      ctx.fillStyle = theme.tree_canopy_light + "90";
      ctx.fillRect(sx + 3 + sway, sy + 4, 1, 8);
      ctx.fillRect(sx + 7 + sway * 0.7, sy + 5, 1, 7);
      ctx.fillRect(sx + 11 + sway * 0.5, sy + 3, 1, 9);
      ctx.fillRect(sx + 5 + sway * 0.8, sy + 6, 1, 6);
      break;
    }
    case 16: { // stone steps
      ctx.fillStyle = theme.path;
      ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = theme.well_stone;
      ctx.fillRect(sx + 1, sy + 2, 14, 5);
      ctx.fillRect(sx + 1, sy + 9, 14, 5);
      ctx.fillStyle = "#999";
      ctx.fillRect(sx + 2, sy + 3, 12, 3);
      ctx.fillRect(sx + 2, sy + 10, 12, 3);
      break;
    }
    case 17: { // market stall
      ctx.fillStyle = theme.grass1;
      ctx.fillRect(sx, sy, TILE, TILE);
      // table
      ctx.fillStyle = theme.wood;
      ctx.fillRect(sx + 1, sy + 8, 14, 6);
      ctx.fillStyle = theme.wood_dark;
      ctx.fillRect(sx + 2, sy + 14, 2, 2);
      ctx.fillRect(sx + 12, sy + 14, 2, 2);
      // awning
      ctx.fillStyle = "#c0392b";
      ctx.fillRect(sx, sy + 2, TILE, 5);
      ctx.fillStyle = "#e8e8e8";
      ctx.fillRect(sx + 4, sy + 2, 3, 5);
      ctx.fillRect(sx + 11, sy + 2, 3, 5);
      // goods on table
      ctx.fillStyle = "#f39c12";
      ctx.fillRect(sx + 4, sy + 9, 3, 3);
      ctx.fillStyle = "#27ae60";
      ctx.fillRect(sx + 9, sy + 9, 3, 3);
      break;
    }
    case 18: { // lamp post
      ctx.fillStyle = theme.grass1;
      ctx.fillRect(sx, sy, TILE, TILE);
      // pole
      ctx.fillStyle = "#555";
      ctx.fillRect(sx + 7, sy + 4, 2, 12);
      // lamp
      ctx.fillStyle = "#D4A017";
      ctx.fillRect(sx + 5, sy + 1, 6, 4);
      // glow
      const glowAlpha = Math.sin(frame * 0.05) * 0.15 + 0.3;
      ctx.fillStyle = `rgba(255, 200, 50, ${glowAlpha})`;
      ctx.fillRect(sx + 3, sy - 1, 10, 6);
      break;
    }
    case 19: { // garden plot
      ctx.fillStyle = "#5a3a1a";
      ctx.fillRect(sx, sy, TILE, TILE);
      // rows
      ctx.fillStyle = "#4a2a0a";
      ctx.fillRect(sx, sy + 4, TILE, 1);
      ctx.fillRect(sx, sy + 8, TILE, 1);
      ctx.fillRect(sx, sy + 12, TILE, 1);
      // plants
      ctx.fillStyle = "#27ae60";
      const growPhase = ((tx * 5 + ty * 3) % 3);
      ctx.fillRect(sx + 3, sy + 1, 2, 2 + growPhase);
      ctx.fillRect(sx + 8, sy + 5, 2, 2 + growPhase);
      ctx.fillRect(sx + 12, sy + 9, 2, 2 + growPhase);
      ctx.fillRect(sx + 5, sy + 9, 2, 1 + growPhase);
      break;
    }
    default: {
      ctx.fillStyle = theme.grass1;
      ctx.fillRect(sx, sy, TILE, TILE);
    }
  }
}

function isSolid(tile: TileType): boolean {
  return tile === 1 || tile === 2 || tile === 7 || tile === 8 || tile === 10 || tile === 11 || tile === 14 || tile === 17;
}

// ─── Wildlife Generation ───

const BUTTERFLY_COLORS = ["#FF6B9D", "#C084FC", "#60A5FA", "#FBBF24", "#34D399"];
const RABBIT_COLORS = ["#D4B896", "#C0A882", "#E8D5B7", "#A0826D"];

function generateWildlife(map: TileType[][]): Wildlife[] {
  const animals: Wildlife[] = [];
  const mapH = map.length, mapW = map[0].length;

  // Butterflies on grass/flowers
  for (let i = 0; i < 12; i++) {
    let x: number, y: number, attempts = 0;
    do { x = Math.floor(Math.random() * mapW); y = Math.floor(Math.random() * mapH); attempts++; }
    while (attempts < 50 && (isSolid(map[y][x]) && map[y][x] !== 4));
    animals.push({
      x: x * TILE + Math.random() * TILE, y: y * TILE + Math.random() * TILE,
      vx: 0, vy: 0, type: "butterfly", frame: Math.random() * 1000 | 0,
      timer: 60 + Math.random() * 120 | 0, state: "idle",
      color: BUTTERFLY_COLORS[i % BUTTERFLY_COLORS.length], wingPhase: Math.random() * Math.PI * 2,
    });
  }

  // Rabbits on grass
  for (let i = 0; i < 6; i++) {
    let x: number, y: number, attempts = 0;
    do { x = Math.floor(Math.random() * mapW); y = Math.floor(Math.random() * mapH); attempts++; }
    while (attempts < 50 && isSolid(map[y][x]));
    animals.push({
      x: x * TILE, y: y * TILE, vx: 0, vy: 0, type: "rabbit",
      frame: 0, timer: 100 + Math.random() * 200 | 0, state: "idle",
      color: RABBIT_COLORS[i % RABBIT_COLORS.length], wingPhase: 0,
    });
  }

  // Fish in water
  for (let ty = 0; ty < mapH; ty++) {
    for (let tx = 0; tx < mapW; tx++) {
      if (map[ty][tx] === 2 && Math.random() < 0.03) {
        animals.push({
          x: tx * TILE + 8, y: ty * TILE + 8, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.3,
          type: "fish", frame: 0, timer: 200 + Math.random() * 200 | 0, state: "moving",
          color: Math.random() > 0.5 ? "#F97316" : "#60A5FA", wingPhase: 0,
        });
      }
    }
  }
  return animals;
}

// ─── State ───

interface ExploreState {
  player: { x: number; y: number; facing: number; walkFrame: number; speed: number };
  map: TileType[][];
  npcs: NPC[];
  chests: Chest[];
  signs: Sign[];
  wildlife: Wildlife[];
  camera: { x: number; y: number; targetX: number; targetY: number };
  keys: Set<string>;
  frame: number;
  avatar: AvatarConfig;
  interactMsg: string | null;
  interactTimer: number;
  goldCollected: number;
  xpCollected: number;
  chestsOpened: number;
  particles: Particle[];
}

interface ExploreModeProps {
  worldIndex: number;
  onExit: (goldCollected: number, xpCollected: number) => void;
  timeLeft: number;
}

export function ExploreMode({ worldIndex, onExit, timeLeft }: ExploreModeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<ExploreState | null>(null);
  const animRef = useRef<number>(0);
  const theme = THEMES[worldIndex] || THEMES[0];

  // Initialize
  useEffect(() => {
    const map = worldIndex === 0 ? generateVerdantMap() : generateGenericMap(worldIndex * 7919 + 42);
    const npcs = generateNPCs(worldIndex);
    const chests = generateChests(worldIndex);
    const signs = generateSigns(worldIndex);

    let avatar: AvatarConfig = { ...DEFAULT_AVATAR };
    try {
      const saved = localStorage.getItem("questforge_avatar");
      if (saved) avatar = { ...DEFAULT_AVATAR, ...JSON.parse(saved) };
    } catch {}

    // Spawn position: center of village
    const spawnX = worldIndex === 0 ? (12 + 10) * TILE : Math.floor(map[0].length / 2) * TILE;
    const spawnY = worldIndex === 0 ? (10 + 9) * TILE : Math.floor(map.length / 2) * TILE;

    // Generate wildlife
    const wildlife = generateWildlife(map);

    stateRef.current = {
      player: { x: spawnX, y: spawnY, facing: 0, walkFrame: 0, speed: 1.4 },
      map, npcs, chests, signs, wildlife,
      camera: { x: spawnX - VIEW_W / 2, y: spawnY - VIEW_H / 2, targetX: 0, targetY: 0 },
      keys: new Set(), frame: 0, avatar,
      interactMsg: null, interactTimer: 0,
      goldCollected: 0, xpCollected: 0, chestsOpened: 0,
      particles: [],
    };

    // Start audio
    startMusic(theme.id, "explore");
    startAmbient(theme.id);

    return () => { stopAllAudio(); };
  }, [worldIndex, theme.id]);

  // Key handlers
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      stateRef.current?.keys.add(e.key.toLowerCase());
      if (["w", "a", "s", "d", " ", "e", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => { stateRef.current?.keys.delete(e.key.toLowerCase()); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const gs = stateRef.current;
      if (!gs) { animRef.current = requestAnimationFrame(loop); return; }
      gs.frame++;

      const { player, map, keys, npcs, chests, signs } = gs;
      const mapW = map[0].length;
      const mapH = map.length;

      // ─── Movement (smooth sub-pixel) ───
      const speed = player.speed;
      let dx = 0, dy = 0;
      if (keys.has("w") || keys.has("arrowup")) dy -= speed;
      if (keys.has("s") || keys.has("arrowdown")) dy += speed;
      if (keys.has("a") || keys.has("arrowleft")) dx -= speed;
      if (keys.has("d") || keys.has("arrowright")) dx += speed;
      if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
      if (dx !== 0 || dy !== 0) {
        player.facing = Math.atan2(dy, dx);
        player.walkFrame++;
      }

      // Collision
      const checkSolid = (x: number, y: number, r: number) => {
        const corners = [
          [x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r],
        ];
        for (const [cx, cy] of corners) {
          const ttx = Math.floor(cx / TILE);
          const tty = Math.floor(cy / TILE);
          if (ttx < 0 || tty < 0 || ttx >= mapW || tty >= mapH) return true;
          if (isSolid(map[tty][ttx])) return true;
        }
        return false;
      };

      if (!checkSolid(player.x + dx, player.y, 4)) player.x += dx;
      if (!checkSolid(player.x, player.y + dy, 4)) player.y += dy;

      // ─── Interaction ───
      if (gs.interactTimer > 0) gs.interactTimer--;
      if (keys.has("e") || keys.has(" ")) {
        keys.delete("e"); keys.delete(" ");

        for (const npc of npcs) {
          if (Math.hypot(player.x - npc.x, player.y - npc.y) < 22) {
            gs.interactMsg = `${npc.name}: "${npc.dialogue[npc.dialogueIndex]}"`;
            gs.interactTimer = 150;
            npc.dialogueIndex = (npc.dialogueIndex + 1) % npc.dialogue.length;
            playSound("click");
            break;
          }
        }
        for (const chest of chests) {
          if (chest.opened) continue;
          if (Math.hypot(player.x - chest.x, player.y - chest.y) < 18) {
            chest.opened = true;
            gs.chestsOpened++;
            if (chest.reward.type === "gold") {
              gs.goldCollected += chest.reward.amount;
              gs.interactMsg = `✨ Found ${chest.reward.amount} gold!`;
            } else {
              gs.xpCollected += chest.reward.amount;
              gs.interactMsg = `✨ Found ${chest.reward.amount} XP!`;
            }
            gs.interactTimer = 100;
            playSound("purchase");
            // spawn sparkle particles
            for (let i = 0; i < 8; i++) {
              gs.particles.push({
                x: chest.x, y: chest.y,
                vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 2,
                life: 30 + Math.random() * 20, maxLife: 50,
                color: chest.reward.type === "gold" ? "#FFD700" : "#60a5fa",
                size: 2 + Math.random(),
              });
            }
            break;
          }
        }
        for (const sign of signs) {
          if (Math.hypot(player.x - sign.x, player.y - sign.y) < 18) {
            gs.interactMsg = sign.text;
            gs.interactTimer = 100;
            playSound("click");
            break;
          }
        }
      }
      if (gs.interactTimer <= 0) gs.interactMsg = null;

      // ─── Particles ───
      for (let i = gs.particles.length - 1; i >= 0; i--) {
        const p = gs.particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life--;
        if (p.life <= 0) gs.particles.splice(i, 1);
      }

      // ─── NPC idle animation ───
      for (const npc of npcs) {
        npc.idleTimer++;
        if (npc.idleTimer > 120) {
          npc.facing = Math.random() * Math.PI * 2;
          npc.idleTimer = 0;
        }
      }

      // ─── Wildlife update ───
      for (const w of gs.wildlife) {
        w.frame++;
        w.timer--;
        if (w.type === "butterfly") {
          w.wingPhase += 0.15;
          if (w.timer <= 0) {
            w.state = w.state === "idle" ? "moving" : "idle";
            w.timer = 60 + Math.random() * 120 | 0;
            if (w.state === "moving") {
              w.vx = (Math.random() - 0.5) * 0.8;
              w.vy = (Math.random() - 0.5) * 0.5;
            } else { w.vx = 0; w.vy = 0; }
          }
          w.x += w.vx; w.y += w.vy + Math.sin(w.frame * 0.05) * 0.15;
          // flee from player
          const dist = Math.hypot(player.x - w.x, player.y - w.y);
          if (dist < 24) { w.vx += (w.x - player.x) * 0.02; w.vy += (w.y - player.y) * 0.02; w.state = "moving"; }
        } else if (w.type === "rabbit") {
          if (w.timer <= 0) {
            w.state = w.state === "idle" ? "moving" : "idle";
            w.timer = w.state === "moving" ? 30 + Math.random() * 40 | 0 : 100 + Math.random() * 200 | 0;
            if (w.state === "moving") {
              const angle = Math.random() * Math.PI * 2;
              w.vx = Math.cos(angle) * 1.2; w.vy = Math.sin(angle) * 1.2;
            } else { w.vx = 0; w.vy = 0; }
          }
          // flee from player
          const dist = Math.hypot(player.x - w.x, player.y - w.y);
          if (dist < 32 && w.state === "idle") {
            w.state = "moving"; w.timer = 40;
            w.vx = (w.x - player.x) / dist * 2; w.vy = (w.y - player.y) / dist * 2;
          }
          if (w.state === "moving") { w.x += w.vx; w.y += w.vy; }
          // bounds
          w.x = Math.max(TILE, Math.min(w.x, mapW * TILE - TILE));
          w.y = Math.max(TILE, Math.min(w.y, mapH * TILE - TILE));
        } else if (w.type === "fish") {
          w.x += w.vx; w.y += w.vy;
          if (w.timer <= 0) {
            w.vx = (Math.random() - 0.5) * 0.5; w.vy = (Math.random() - 0.5) * 0.3;
            w.timer = 100 + Math.random() * 200 | 0;
          }
          // keep in water bounds roughly
          const tx = Math.floor(w.x / TILE), ty = Math.floor(w.y / TILE);
          if (tx < 0 || ty < 0 || tx >= mapW || ty >= mapH || map[ty][tx] !== 2) {
            w.vx *= -1; w.vy *= -1; w.x += w.vx * 2; w.y += w.vy * 2;
          }
        }
      }
      // ─── Smooth camera ───
      const camTargetX = player.x - VIEW_W / 2;
      const camTargetY = player.y - VIEW_H / 2;
      gs.camera.x += (camTargetX - gs.camera.x) * 0.12;
      gs.camera.y += (camTargetY - gs.camera.y) * 0.12;
      gs.camera.x = Math.max(0, Math.min(gs.camera.x, mapW * TILE - VIEW_W));
      gs.camera.y = Math.max(0, Math.min(gs.camera.y, mapH * TILE - VIEW_H));

      // ─── RENDER ───
      const cx = gs.camera.x;
      const cy = gs.camera.y;

      ctx.fillStyle = theme.grass1;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);

      const startTX = Math.max(0, Math.floor(cx / TILE));
      const startTY = Math.max(0, Math.floor(cy / TILE));
      const endTX = Math.min(startTX + Math.ceil(VIEW_W / TILE) + 2, mapW);
      const endTY = Math.min(startTY + Math.ceil(VIEW_H / TILE) + 2, mapH);

      // Draw ground layer
      for (let ty = startTY; ty < endTY; ty++) {
        for (let tx = startTX; tx < endTX; tx++) {
          const screenX = Math.round(tx * TILE - cx);
          const screenY = Math.round(ty * TILE - cy);
          drawTile(ctx, map[ty][tx], screenX, screenY, tx, ty, gs.frame, theme);
        }
      }

      // Draw signs
      for (const sign of signs) {
        const sx = sign.x - cx, sy = sign.y - cy;
        if (sx < -20 || sx > VIEW_W + 20 || sy < -20 || sy > VIEW_H + 20) continue;
        ctx.fillStyle = theme.wood;
        ctx.fillRect(sx - 1, sy, 2, 8);
        ctx.fillStyle = "#D2B48C";
        ctx.fillRect(sx - 7, sy - 6, 14, 7);
        ctx.fillStyle = theme.wood_dark;
        ctx.fillRect(sx - 7, sy - 6, 14, 1);
        ctx.fillRect(sx - 7, sy, 14, 1);
        ctx.fillStyle = "#333";
        ctx.fillRect(sx - 1, sy - 4, 2, 3);
        ctx.fillRect(sx - 1, sy - 1, 2, 1);
      }

      // Draw chests
      for (const chest of chests) {
        const sx = chest.x - cx, sy = chest.y - cy;
        if (sx < -20 || sx > VIEW_W + 20 || sy < -20 || sy > VIEW_H + 20) continue;
        if (chest.opened) {
          ctx.fillStyle = "#6B3310";
          ctx.fillRect(sx - 6, sy - 2, 12, 6);
          ctx.fillStyle = "#D4A017";
          ctx.fillRect(sx - 5, sy - 1, 10, 4);
          ctx.fillStyle = "#8B4513";
          ctx.fillRect(sx - 7, sy - 7, 14, 5);
          ctx.fillStyle = "#6B3310";
          ctx.fillRect(sx - 6, sy - 6, 12, 3);
        } else {
          ctx.fillStyle = "#8B4513";
          ctx.fillRect(sx - 6, sy - 5, 12, 10);
          // metal bands
          ctx.fillStyle = "#888";
          ctx.fillRect(sx - 6, sy - 3, 12, 1);
          ctx.fillRect(sx - 6, sy + 2, 12, 1);
          // lock
          ctx.fillStyle = "#D4A017";
          ctx.fillRect(sx - 2, sy - 2, 4, 3);
          ctx.fillStyle = "#B8860B";
          ctx.fillRect(sx - 1, sy - 1, 2, 1);
          // sparkle
          if (gs.frame % 40 < 20) {
            ctx.fillStyle = "#FFD700";
            const sparkOff = Math.sin(gs.frame * 0.1) * 2;
            ctx.fillRect(sx - 3 + sparkOff, sy - 8, 2, 2);
            ctx.fillRect(sx + 2 - sparkOff, sy - 7, 1, 1);
          }
        }
      }

      // Draw NPCs
      for (const npc of npcs) {
        const sx = npc.x - cx, sy = npc.y - cy;
        if (sx < -20 || sx > VIEW_W + 20 || sy < -20 || sy > VIEW_H + 20) continue;

        const bob = Math.sin(gs.frame * 0.04 + npc.x * 0.1) * 0.8;

        // Shadow
        ctx.fillStyle = "#00000025";
        ctx.fillRect(sx - 4, sy + 5, 8, 3);

        // Legs
        ctx.fillStyle = "#333";
        const legBob = Math.sin(gs.frame * 0.06 + npc.x) > 0 ? 1 : 0;
        ctx.fillRect(sx - 3, sy + 3, 2, 3 + legBob);
        ctx.fillRect(sx + 1, sy + 3, 2, 3 + (1 - legBob));

        // Body
        ctx.fillStyle = npc.color;
        ctx.fillRect(sx - 4, sy - 2 + bob, 8, 6);

        // Head
        ctx.fillStyle = "#FFDCB0";
        ctx.fillRect(sx - 3, sy - 7 + bob, 6, 5);

        // Eyes
        ctx.fillStyle = "#000";
        ctx.fillRect(sx - 2, sy - 5 + bob, 1, 1);
        ctx.fillRect(sx + 1, sy - 5 + bob, 1, 1);

        // Accessories by type
        if (npc.sprite === "sage") {
          ctx.fillStyle = npc.hatColor;
          ctx.fillRect(sx - 4, sy - 10 + bob, 8, 3);
          ctx.fillRect(sx - 2, sy - 12 + bob, 4, 2);
          ctx.fillRect(sx - 1, sy - 13 + bob, 2, 1);
        } else if (npc.sprite === "merchant") {
          ctx.fillStyle = npc.hatColor;
          ctx.fillRect(sx - 5, sy - 9 + bob, 10, 2);
          ctx.fillRect(sx - 3, sy - 10 + bob, 6, 1);
        } else if (npc.sprite === "guard") {
          ctx.fillStyle = "#7f8c8d";
          ctx.fillRect(sx - 3, sy - 9 + bob, 6, 2);
          ctx.fillRect(sx - 2, sy - 10 + bob, 4, 1);
          // shield
          ctx.fillStyle = "#b8860b";
          ctx.fillRect(sx + 4, sy - 1 + bob, 3, 4);
        } else if (npc.sprite === "child") {
          ctx.fillStyle = npc.hatColor;
          ctx.fillRect(sx - 2, sy - 9 + bob, 4, 2);
        } else {
          ctx.fillStyle = npc.hatColor;
          ctx.fillRect(sx - 3, sy - 8 + bob, 6, 1);
        }

        // Interaction indicator
        const dist = Math.hypot(player.x - npc.x, player.y - npc.y);
        if (dist < 26) {
          const bounceY = Math.sin(gs.frame * 0.1) * 2;
          ctx.fillStyle = "#FFD700";
          // "!" exclamation
          ctx.fillRect(sx - 1, sy - 16 + bounceY + bob, 2, 4);
          ctx.fillRect(sx - 1, sy - 11 + bounceY + bob, 2, 1);
        }
      }

      // ─── Draw wildlife ───
      for (const w of gs.wildlife) {
        const wx = w.x - cx, wy = w.y - cy;
        if (wx < -20 || wx > VIEW_W + 20 || wy < -20 || wy > VIEW_H + 20) continue;

        if (w.type === "butterfly") {
          const wing = Math.sin(w.wingPhase) * 3;
          // Body
          ctx.fillStyle = "#333";
          ctx.fillRect(wx, wy, 1, 3);
          // Wings
          ctx.fillStyle = w.color;
          ctx.fillRect(wx - 2 - Math.abs(wing * 0.5), wy, 2, 2);
          ctx.fillRect(wx + 1, wy, 2, 2);
          ctx.globalAlpha = 0.6;
          ctx.fillRect(wx - 1 - Math.abs(wing * 0.3), wy + 1, 1, 1);
          ctx.fillRect(wx + 2, wy + 1, 1, 1);
          ctx.globalAlpha = 1;
        } else if (w.type === "rabbit") {
          // Shadow
          ctx.fillStyle = "#00000020";
          ctx.fillRect(wx - 2, wy + 3, 5, 2);
          // Body
          ctx.fillStyle = w.color;
          ctx.fillRect(wx - 2, wy, 5, 4);
          // Head
          ctx.fillRect(wx - 1 + (w.vx > 0 ? 2 : -1), wy - 2, 3, 3);
          // Ears
          ctx.fillRect(wx + (w.vx > 0 ? 2 : -1), wy - 4, 1, 2);
          ctx.fillRect(wx + (w.vx > 0 ? 3 : 0), wy - 4, 1, 2);
          // Eye
          ctx.fillStyle = "#000";
          ctx.fillRect(wx + (w.vx > 0 ? 3 : 0), wy - 1, 1, 1);
          // Tail
          ctx.fillStyle = "#fff";
          ctx.fillRect(wx + (w.vx > 0 ? -2 : 4), wy + 1, 1, 1);
          // Hop animation
          if (w.state === "moving") {
            const hop = Math.abs(Math.sin(w.frame * 0.3)) * 2;
            ctx.fillStyle = w.color;
            ctx.fillRect(wx - 2, wy - hop, 5, 4);
          }
        } else if (w.type === "fish") {
          // Fish body
          ctx.fillStyle = w.color;
          const dir = w.vx >= 0 ? 1 : -1;
          ctx.fillRect(wx - 2, wy, 5, 2);
          ctx.fillRect(wx - 1, wy - 1, 3, 1);
          ctx.fillRect(wx - 1, wy + 2, 3, 1);
          // Tail
          ctx.fillRect(wx + (dir > 0 ? -3 : 5), wy - 1, 1, 3);
          // Eye
          ctx.fillStyle = "#000";
          ctx.fillRect(wx + (dir > 0 ? 2 : -1), wy, 1, 1);
          // Shimmer
          if (gs.frame % 30 < 15) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = "#fff";
            ctx.fillRect(wx, wy - 1, 1, 1);
            ctx.globalAlpha = 1;
          }
        }
      }

      // Draw player
      const px = player.x - cx;
      const py = player.y - cy;
      const av = gs.avatar;
      const skinC = SKIN_COLORS[av.skin] || SKIN_COLORS.light;
      const hairC = HAIR_COLORS[av.hairColor] || HAIR_COLORS.brown;
      const armorC = ARMOR_COLORS[av.armor] || ARMOR_COLORS.none;
      const moving = dx !== 0 || dy !== 0;
      const walkBob = moving ? Math.sin(player.walkFrame * 0.3) * 1.5 : 0;

      // Shadow
      ctx.fillStyle = "#00000030";
      ctx.fillRect(px - 5, py + 5, 10, 3);

      // Legs
      ctx.fillStyle = "#333";
      ctx.fillRect(px - 3, py + 3, 2, 3 + (walkBob > 0 ? 1 : 0));
      ctx.fillRect(px + 1, py + 3, 2, 3 + (walkBob <= 0 ? 1 : 0));

      // Body
      ctx.fillStyle = armorC.primary;
      ctx.fillRect(px - 4, py - 2 + walkBob * 0.3, 8, 6);
      ctx.fillStyle = armorC.secondary;
      ctx.fillRect(px - 5, py - 2 + walkBob * 0.3, 10, 2);

      // Head
      ctx.fillStyle = skinC;
      ctx.fillRect(px - 3, py - 7 + walkBob * 0.3, 6, 5);

      // Hair
      ctx.fillStyle = hairC;
      if (av.hair === "spiky") {
        ctx.fillRect(px - 3, py - 9, 6, 2);
        ctx.fillRect(px - 1, py - 10, 2, 1);
        ctx.fillRect(px + 2, py - 10, 1, 1);
      } else if (av.hair === "long") {
        ctx.fillRect(px - 3, py - 9, 6, 2);
        ctx.fillRect(px - 4, py - 7, 1, 5);
        ctx.fillRect(px + 3, py - 7, 1, 5);
      } else if (av.hair === "mohawk") {
        ctx.fillRect(px - 1, py - 11, 2, 4);
      } else if (av.hair === "ponytail") {
        ctx.fillRect(px - 3, py - 9, 6, 2);
        ctx.fillRect(px + 3, py - 7, 1, 3);
      }

      // Eyes (follow facing)
      ctx.fillStyle = "#000";
      const ex = Math.cos(player.facing) * 1;
      const ey = Math.sin(player.facing) * 0.3;
      ctx.fillRect(px - 2 + ex, py - 5 + ey + walkBob * 0.3, 1, 1);
      ctx.fillRect(px + 1 + ex, py - 5 + ey + walkBob * 0.3, 1, 1);

      // ─── Draw particles ───
      for (const p of gs.particles) {
        const psx = p.x - cx, psy = p.y - cy;
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.fillRect(psx - p.size / 2, psy - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      // ─── HUD ───
      // Top bar
      ctx.fillStyle = "#000000A0";
      ctx.fillRect(0, 0, VIEW_W, 14);
      ctx.fillStyle = "#fff";
      ctx.font = "8px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`🪙 ${gs.goldCollected}  ⭐ ${gs.xpCollected}  📦 ${gs.chestsOpened}`, 4, 10);
      ctx.textAlign = "right";
      ctx.fillText(theme.name, VIEW_W - 4, 10);

      // Dialogue box
      if (gs.interactMsg) {
        const boxH = 32;
        const boxY = VIEW_H - boxH - 4;
        // semi-transparent box with gradient
        ctx.fillStyle = "#000000DD";
        ctx.fillRect(6, boxY, VIEW_W - 12, boxH);
        // border
        ctx.strokeStyle = "#D4A01780";
        ctx.lineWidth = 1;
        ctx.strokeRect(6, boxY, VIEW_W - 12, boxH);
        // inner glow
        ctx.fillStyle = "#D4A01708";
        ctx.fillRect(7, boxY + 1, VIEW_W - 14, boxH - 2);

        ctx.fillStyle = "#fff";
        ctx.font = "7px monospace";
        ctx.textAlign = "left";
        const words = gs.interactMsg.split(" ");
        let line = "", ly = boxY + 11;
        for (const word of words) {
          const test = line ? line + " " + word : word;
          if (ctx.measureText(test).width > VIEW_W - 28) {
            ctx.fillText(line, 12, ly);
            line = word;
            ly += 10;
          } else line = test;
        }
        ctx.fillText(line, 12, ly);
      }

      // Interaction hints
      const nearChest = chests.find(c => !c.opened && Math.hypot(player.x - c.x, player.y - c.y) < 22);
      const nearNPC = npcs.find(n => Math.hypot(player.x - n.x, player.y - n.y) < 26);
      const nearSign = signs.find(s => Math.hypot(player.x - s.x, player.y - s.y) < 22);
      if ((nearChest || nearNPC || nearSign) && !gs.interactMsg) {
        ctx.fillStyle = "#ffffffA0";
        ctx.font = "7px monospace";
        ctx.textAlign = "center";
        ctx.fillText("[E] / [Space] to interact", VIEW_W / 2, VIEW_H - 8);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [theme]);

  const handleExit = () => {
    stopAllAudio();
    const gs = stateRef.current;
    onExit(gs?.goldCollected || 0, gs?.xpCollected || 0);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
      <div className="absolute top-4 right-4 z-10">
        <button onClick={handleExit} className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="mb-3 flex items-center gap-3 text-sm">
        <span className="text-muted-foreground font-display">{theme.name} — Explore</span>
        <span className="font-mono flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatTime(timeLeft)}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={VIEW_W}
        height={VIEW_H}
        className="border-2 border-border rounded-md"
        style={{ width: VIEW_W * 3, height: VIEW_H * 3, imageRendering: "pixelated" }}
      />
      <div className="mt-3 text-xs text-muted-foreground space-y-1 text-center">
        <p>WASD / Arrows to move · E / Space to interact</p>
      </div>
    </div>
  );
}

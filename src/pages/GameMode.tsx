import { useState, useEffect, useRef, useCallback } from "react";
import { useGame } from "@/context/GameContext";
import { useParticles } from "@/context/ParticleContext";
import { playSound } from "@/lib/sounds";
import { startMusic, startAmbient, stopAllAudio } from "@/lib/ambient-audio";
import { motion } from "framer-motion";
import { Gamepad2, X, Clock, Trophy, Compass, Swords } from "lucide-react";
import {
  AvatarConfig,
  DEFAULT_AVATAR,
} from "@/components/PixelAvatar";
import { ExploreMode } from "@/components/ExploreMode";

const SKIN_COLORS: Record<string, string> = {
  light: "#FFDCB0", tan: "#D4A574", brown: "#8B6F47", dark: "#5C3D2E",
};
const HAIR_COLORS: Record<string, string> = {
  black: "#1A1A1A", brown: "#5C3317", blonde: "#E8D44D", red: "#C0392B", blue: "#2E86C1", white: "#ECF0F1",
};
const ARMOR_COLORS: Record<string, { primary: string; secondary: string }> = {
  none: { primary: "#808080", secondary: "#666" },
  leather: { primary: "#8B4513", secondary: "#A0522D" },
  chainmail: { primary: "#A0A0A0", secondary: "#C0C0C0" },
  plate: { primary: "#4A4A4A", secondary: "#6A6A6A" },
  mage_robe: { primary: "#4A148C", secondary: "#6A1B9A" },
  shadow: { primary: "#1A1A2E", secondary: "#16213E" },
  dragon: { primary: "#B71C1C", secondary: "#D32F2F" },
};
const WEAPON_COLORS: Record<string, string> = {
  none: "", sword: "#C0C0C0", staff: "#8B4513", bow: "#8B4513",
  axe: "#A0A0A0", dagger: "#C0C0C0", hammer: "#A0A0A0",
};


// World theme configs
const WORLD_THEMES = [
  {
    id: "verdant_plains",
    name: "Verdant Plains",
    levelReq: 1,
    bg: "#1a3d1a",
    floor: "#2d5a2d",
    wall: "#0f260f",
    accent: "#4ade80",
    enemies: [
      { name: "Slime", color: "#4ade80", hp: 2, speed: 0.5, size: 10 },
      { name: "Goblin", color: "#a3e635", hp: 3, speed: 0.8, size: 8 },
    ],
    coins: "#ffd700",
  },
  {
    id: "crystal_caves",
    name: "Crystal Caves",
    levelReq: 5,
    bg: "#0f1a2e",
    floor: "#1a2d4d",
    wall: "#0a1220",
    accent: "#60a5fa",
    enemies: [
      { name: "Bat", color: "#818cf8", hp: 2, speed: 1.2, size: 7 },
      { name: "Golem", color: "#60a5fa", hp: 5, speed: 0.3, size: 14 },
    ],
    coins: "#93c5fd",
  },
  {
    id: "ember_wastes",
    name: "Ember Wastes",
    levelReq: 12,
    bg: "#2d1a0a",
    floor: "#4d2d1a",
    wall: "#1a0f05",
    accent: "#f97316",
    enemies: [
      { name: "Fire Imp", color: "#f97316", hp: 3, speed: 1.0, size: 8 },
      { name: "Scorpion", color: "#dc2626", hp: 4, speed: 0.7, size: 10 },
    ],
    coins: "#fbbf24",
  },
  {
    id: "shadow_realm",
    name: "Shadow Realm",
    levelReq: 20,
    bg: "#1a0a2d",
    floor: "#2d1a4d",
    wall: "#0f0520",
    accent: "#a855f7",
    enemies: [
      { name: "Wraith", color: "#a855f7", hp: 4, speed: 1.1, size: 9 },
      { name: "Dark Knight", color: "#6b21a8", hp: 6, speed: 0.6, size: 12 },
    ],
    coins: "#c084fc",
  },
  {
    id: "celestial_spire",
    name: "Celestial Spire",
    levelReq: 35,
    bg: "#1a1a0a",
    floor: "#3d3d1a",
    wall: "#0f0f05",
    accent: "#fbbf24",
    enemies: [
      { name: "Star Elemental", color: "#fbbf24", hp: 5, speed: 1.0, size: 10 },
      { name: "Astral Guardian", color: "#f59e0b", hp: 8, speed: 0.4, size: 16 },
    ],
    coins: "#fde68a",
  },
];

const TILE = 16;
const GAME_W = 240;
const GAME_H = 176;
const GAME_DURATION = 120; // 2 minutes
const COOLDOWN = 20 * 60 * 1000; // 20 minutes

interface Entity {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  color: string;
  size: number;
  speed: number;
  dir: number;
  moveTimer: number;
  flash: number;
}

interface Coin {
  x: number;
  y: number;
  collected: boolean;
}

interface Projectile {
  x: number;
  y: number;
  dx: number;
  dy: number;
  life: number;
}

// Simple dungeon generation
function generateMap(w: number, h: number): number[][] {
  const map: number[][] = [];
  for (let y = 0; y < h; y++) {
    map[y] = [];
    for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        map[y][x] = 1; // wall
      } else {
        map[y][x] = 0;
      }
    }
  }
  // Add some random walls for structure
  for (let i = 0; i < Math.floor(w * h * 0.15); i++) {
    const rx = Math.floor(Math.random() * (w - 4)) + 2;
    const ry = Math.floor(Math.random() * (h - 4)) + 2;
    // Don't block spawn area
    if (rx < 4 && ry < 4) continue;
    map[ry][rx] = 1;
    // Sometimes extend walls
    if (Math.random() > 0.5) {
      const dir = Math.random() > 0.5;
      for (let j = 1; j < Math.floor(Math.random() * 3) + 1; j++) {
        const nx = dir ? rx + j : rx;
        const ny = dir ? ry : ry + j;
        if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1 && !(nx < 4 && ny < 4)) {
          map[ny][nx] = 1;
        }
      }
    }
  }
  return map;
}

function spawnEnemies(map: number[][], theme: typeof WORLD_THEMES[0], count: number): Entity[] {
  const enemies: Entity[] = [];
  const mapH = map.length;
  const mapW = map[0].length;
  for (let i = 0; i < count; i++) {
    let x: number, y: number;
    do {
      x = Math.floor(Math.random() * (mapW - 4)) + 2;
      y = Math.floor(Math.random() * (mapH - 4)) + 2;
    } while (map[y][x] === 1 || (x < 4 && y < 4));

    const tmpl = theme.enemies[Math.floor(Math.random() * theme.enemies.length)];
    enemies.push({
      x: x * TILE + TILE / 2,
      y: y * TILE + TILE / 2,
      hp: tmpl.hp,
      maxHp: tmpl.hp,
      color: tmpl.color,
      size: tmpl.size,
      speed: tmpl.speed,
      dir: Math.random() * Math.PI * 2,
      moveTimer: Math.random() * 60,
      flash: 0,
    });
  }
  return enemies;
}

function spawnCoins(map: number[][], count: number): Coin[] {
  const coins: Coin[] = [];
  const mapH = map.length;
  const mapW = map[0].length;
  for (let i = 0; i < count; i++) {
    let x: number, y: number;
    do {
      x = Math.floor(Math.random() * (mapW - 2)) + 1;
      y = Math.floor(Math.random() * (mapH - 2)) + 1;
    } while (map[y][x] === 1);
    coins.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, collected: false });
  }
  return coins;
}

const COOLDOWN_KEY = "questforge_gamemode_cooldown";

export default function GameMode() {
  const { level, addXpAndGold } = useGame();
  const { emit } = useParticles();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [selectedWorld, setSelectedWorld] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState({ kills: 0, coins: 0, xp: 0, gold: 0 });
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [cooldownEnd, setCooldownEnd] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [gameType, setGameType] = useState<"dungeon" | "explore">("dungeon");
  const [exploring, setExploring] = useState(false);
  const [exploreTimeLeft, setExploreTimeLeft] = useState(GAME_DURATION);

  const gameStateRef = useRef<{
    player: { x: number; y: number; hp: number; maxHp: number; facing: number; attackCooldown: number; invuln: number };
    enemies: Entity[];
    coins: Coin[];
    projectiles: Projectile[];
    map: number[][];
    keys: Set<string>;
    kills: number;
    coinsCollected: number;
    camera: { x: number; y: number };
    frame: number;
    avatar: AvatarConfig;
  } | null>(null);

  const animRef = useRef<number>(0);
  const timeRef = useRef<ReturnType<typeof setInterval>>();

  // Cooldown timer
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      if (cooldownEnd > now) {
        setCooldownRemaining(Math.ceil((cooldownEnd - now) / 1000));
      } else {
        setCooldownRemaining(0);
      }
    };
    check();
    const iv = setInterval(check, 1000);
    return () => clearInterval(iv);
  }, [cooldownEnd]);

  

  const startGame = useCallback((worldIdx: number) => {
    const theme = WORLD_THEMES[worldIdx];
    const mapW = 30;
    const mapH = 22;
    const map = generateMap(mapW, mapH);
    const enemies = spawnEnemies(map, theme, 12);
    const coins = spawnCoins(map, 15);

    // Load avatar from localStorage
    let avatar: AvatarConfig = { ...DEFAULT_AVATAR };
    try {
      const saved = localStorage.getItem("questforge_avatar");
      if (saved) avatar = { ...DEFAULT_AVATAR, ...JSON.parse(saved) };
    } catch {}

    gameStateRef.current = {
      player: { x: TILE * 2, y: TILE * 2, hp: 10, maxHp: 10, facing: 0, attackCooldown: 0, invuln: 0 },
      enemies,
      coins,
      projectiles: [],
      map,
      keys: new Set(),
      kills: 0,
      coinsCollected: 0,
      camera: { x: 0, y: 0 },
      frame: 0,
      avatar,
    };

    setPlaying(true);
    setGameOver(false);
    setSelectedWorld(worldIdx);
    setTimeLeft(GAME_DURATION);
    setScore({ kills: 0, coins: 0, xp: 0, gold: 0 });

    // Start dungeon audio
    startMusic(theme.id, "dungeon");
    startAmbient(theme.id);
  }, []);

  // Key handlers
  useEffect(() => {
    if (!playing) return;
    const down = (e: KeyboardEvent) => {
      gameStateRef.current?.keys.add(e.key.toLowerCase());
      if (["w", "a", "s", "d", " ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      gameStateRef.current?.keys.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [playing]);

  // Timer
  useEffect(() => {
    if (!playing || gameOver) return;
    timeRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timeRef.current);
  }, [playing, gameOver]);

  const endGame = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    clearInterval(timeRef.current);
    stopAllAudio();
    setGameOver(true);
    setPlaying(false);

    const gs = gameStateRef.current;
    if (!gs) return;

    const xpEarned = gs.kills * 10 + gs.coinsCollected * 5;
    const goldEarned = gs.coinsCollected * 3 + gs.kills * 2;

    setScore({ kills: gs.kills, coins: gs.coinsCollected, xp: xpEarned, gold: goldEarned });

    // Set cooldown
    const end = Date.now() + COOLDOWN;
    setCooldownEnd(end);
    localStorage.setItem(COOLDOWN_KEY, end.toString());
  }, []);

  const claimRewards = () => {
    addXpAndGold(score.xp, score.gold);
    emit("dungeonClear", 0.5, 0.5);
    setGameOver(false);
    setSelectedWorld(null);
  };

  // Start explore mode
  const startExplore = useCallback((worldIdx: number) => {
    setSelectedWorld(worldIdx);
    setExploring(true);
    setExploreTimeLeft(GAME_DURATION);

    // Set cooldown
    const end = Date.now() + COOLDOWN;
    setCooldownEnd(end);
    localStorage.setItem(COOLDOWN_KEY, end.toString());
  }, []);

  // Explore timer
  useEffect(() => {
    if (!exploring) return;
    const iv = setInterval(() => {
      setExploreTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [exploring]);

  // Auto-end explore when time runs out
  useEffect(() => {
    if (exploring && exploreTimeLeft <= 0) {
      // Force exit handled by ExploreMode onExit
    }
  }, [exploring, exploreTimeLeft]);

  const handleExploreExit = (goldCollected: number, xpCollected: number) => {
    setExploring(false);
    if (goldCollected > 0 || xpCollected > 0) {
      addXpAndGold(xpCollected, goldCollected);
      emit("questComplete", 0.5, 0.5);
      playSound("questComplete");
    }
    setSelectedWorld(null);
  };

  // Game loop
  useEffect(() => {
    if (!playing || gameOver || selectedWorld === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const theme = WORLD_THEMES[selectedWorld];

    const loop = () => {
      const gs = gameStateRef.current;
      if (!gs) return;
      gs.frame++;

      const { player, enemies, coins, projectiles, map, keys } = gs;
      const mapW = map[0].length;
      const mapH = map.length;

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

      // Attack
      if (player.attackCooldown > 0) player.attackCooldown--;
      if ((keys.has(" ") || keys.has("enter")) && player.attackCooldown <= 0) {
        player.attackCooldown = 12;
        projectiles.push({
          x: player.x,
          y: player.y,
          dx: Math.cos(player.facing) * 3,
          dy: Math.sin(player.facing) * 3,
          life: 30,
        });
        playSound("click");
      }

      // Update projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        if (p.life <= 0 || checkCollision(p.x, p.y, 2)) {
          projectiles.splice(i, 1);
          continue;
        }
        // Hit enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j];
          const dist = Math.hypot(p.x - e.x, p.y - e.y);
          if (dist < e.size) {
            e.hp--;
            e.flash = 6;
            projectiles.splice(i, 1);
            if (e.hp <= 0) {
              enemies.splice(j, 1);
              gs.kills++;
            }
            break;
          }
        }
      }

      // Update enemies
      for (const e of enemies) {
        if (e.flash > 0) e.flash--;
        e.moveTimer--;
        if (e.moveTimer <= 0) {
          // Move toward player with some randomness
          const toPlayer = Math.atan2(player.y - e.y, player.x - e.x);
          e.dir = toPlayer + (Math.random() - 0.5) * 1.5;
          e.moveTimer = 30 + Math.random() * 40;
        }
        const ex = e.x + Math.cos(e.dir) * e.speed;
        const ey = e.y + Math.sin(e.dir) * e.speed;
        if (!checkCollision(ex, e.y, e.size * 0.4)) e.x = ex;
        if (!checkCollision(e.x, ey, e.size * 0.4)) e.y = ey;

        // Damage player
        if (player.invuln <= 0) {
          const dist = Math.hypot(player.x - e.x, player.y - e.y);
          if (dist < e.size + 5) {
            player.hp--;
            player.invuln = 30;
            playSound("error");
            if (player.hp <= 0) {
              endGame();
              return;
            }
          }
        }
      }

      if (player.invuln > 0) player.invuln--;

      // Collect coins
      for (const c of coins) {
        if (c.collected) continue;
        const dist = Math.hypot(player.x - c.x, player.y - c.y);
        if (dist < 10) {
          c.collected = true;
          gs.coinsCollected++;
          playSound("purchase");
        }
      }

      // Camera
      gs.camera.x = player.x - GAME_W / 2;
      gs.camera.y = player.y - GAME_H / 2;
      gs.camera.x = Math.max(0, Math.min(gs.camera.x, mapW * TILE - GAME_W));
      gs.camera.y = Math.max(0, Math.min(gs.camera.y, mapH * TILE - GAME_H));

      // Render
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, GAME_W, GAME_H);

      const cx = gs.camera.x;
      const cy = gs.camera.y;

      // Draw tiles
      const startTX = Math.floor(cx / TILE);
      const startTY = Math.floor(cy / TILE);
      const endTX = Math.min(startTX + Math.ceil(GAME_W / TILE) + 1, mapW);
      const endTY = Math.min(startTY + Math.ceil(GAME_H / TILE) + 1, mapH);

      for (let ty = startTY; ty < endTY; ty++) {
        for (let tx = startTX; tx < endTX; tx++) {
          const sx = tx * TILE - cx;
          const sy = ty * TILE - cy;
          if (map[ty][tx] === 1) {
            ctx.fillStyle = theme.wall;
            ctx.fillRect(sx, sy, TILE, TILE);
            // Wall highlight
            ctx.fillStyle = theme.accent + "20";
            ctx.fillRect(sx, sy, TILE, 2);
          } else {
            ctx.fillStyle = theme.floor;
            ctx.fillRect(sx, sy, TILE, TILE);
            // Subtle grid
            ctx.strokeStyle = theme.wall + "40";
            ctx.lineWidth = 0.5;
            ctx.strokeRect(sx, sy, TILE, TILE);
          }
        }
      }

      // Draw coins
      for (const c of coins) {
        if (c.collected) continue;
        const sx = c.x - cx;
        const sy = c.y - cy;
        if (sx < -10 || sx > GAME_W + 10 || sy < -10 || sy > GAME_H + 10) continue;
        ctx.fillStyle = theme.coins;
        ctx.beginPath();
        ctx.arc(sx, sy + Math.sin(gs.frame * 0.08) * 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = theme.coins + "60";
        ctx.beginPath();
        ctx.arc(sx, sy + Math.sin(gs.frame * 0.08) * 2, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw enemies
      for (const e of enemies) {
        const sx = e.x - cx;
        const sy = e.y - cy;
        if (sx < -20 || sx > GAME_W + 20 || sy < -20 || sy > GAME_H + 20) continue;
        ctx.fillStyle = e.flash > 0 ? "#ffffff" : e.color;
        // Pixel body
        const s = e.size;
        ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
        // Eyes
        ctx.fillStyle = "#000";
        ctx.fillRect(sx - s * 0.2, sy - s * 0.15, 2, 2);
        ctx.fillRect(sx + s * 0.1, sy - s * 0.15, 2, 2);
        // HP bar
        if (e.hp < e.maxHp) {
          ctx.fillStyle = "#333";
          ctx.fillRect(sx - s / 2, sy - s / 2 - 4, s, 2);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(sx - s / 2, sy - s / 2 - 4, s * (e.hp / e.maxHp), 2);
        }
      }

      // Draw projectiles
      ctx.fillStyle = theme.accent;
      for (const p of projectiles) {
        const sx = p.x - cx;
        const sy = p.y - cy;
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
      }

      // Draw player using avatar config
      const px = player.x - cx;
      const py = player.y - cy;
      if (player.invuln <= 0 || gs.frame % 4 < 2) {
        const av = gs.avatar;
        const skinC = SKIN_COLORS[av.skin] || SKIN_COLORS.light;
        const hairC = HAIR_COLORS[av.hairColor] || HAIR_COLORS.brown;
        const armorC = ARMOR_COLORS[av.armor] || ARMOR_COLORS.none;
        const weaponC = WEAPON_COLORS[av.weapon] || "";

        // Legs
        ctx.fillStyle = "#333";
        ctx.fillRect(px - 3, py + 3, 2, 3);
        ctx.fillRect(px + 1, py + 3, 2, 3);

        // Body (armor)
        ctx.fillStyle = armorC.primary;
        ctx.fillRect(px - 4, py - 2, 8, 6);
        // Shoulders
        ctx.fillStyle = armorC.secondary;
        ctx.fillRect(px - 5, py - 2, 10, 2);

        // Head (skin)
        ctx.fillStyle = skinC;
        ctx.fillRect(px - 3, py - 7, 6, 5);

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

        // Eyes
        ctx.fillStyle = "#000";
        const eyeDir = player.facing;
        const eyeX = Math.cos(eyeDir) * 1;
        const eyeY = Math.sin(eyeDir) * 0.3;
        ctx.fillRect(px - 2 + eyeX, py - 5 + eyeY, 1, 1);
        ctx.fillRect(px + 1 + eyeX, py - 5 + eyeY, 1, 1);

        // Weapon swing
        if (weaponC && player.attackCooldown > 6) {
          ctx.fillStyle = weaponC;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(player.facing);
          ctx.fillRect(6, -1, 8, 2);
          if (av.weapon === "axe" || av.weapon === "hammer") {
            ctx.fillRect(12, -3, 3, 6);
          }
          ctx.restore();
        } else if (weaponC) {
          // Weapon at rest
          ctx.fillStyle = weaponC;
          ctx.fillRect(px + 4, py - 4, 1, 6);
        }
      }

      // HUD
      ctx.fillStyle = "#00000080";
      ctx.fillRect(0, 0, GAME_W, 16);
      // HP
      ctx.fillStyle = "#ef4444";
      for (let i = 0; i < player.hp; i++) {
        ctx.fillRect(4 + i * 8, 4, 6, 8);
      }
      // Score
      ctx.fillStyle = "#fff";
      ctx.font = "8px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`☠ ${gs.kills}  🪙 ${gs.coinsCollected}`, GAME_W - 4, 11);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [playing, gameOver, selectedWorld, endGame]);

  const formatCooldown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Game over screen
  if (gameOver) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 animate-fade-in py-12">
        <Trophy className="w-12 h-12 mx-auto text-gold" />
        <h2 className="text-3xl font-bold font-display">Adventure Complete!</h2>
        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Enemies Slain</span><p className="text-2xl font-mono font-bold">{score.kills}</p></div>
            <div><span className="text-muted-foreground">Coins Found</span><p className="text-2xl font-mono font-bold">{score.coins}</p></div>
          </div>
          <div className="border-t border-border pt-3 flex justify-center gap-8 font-mono text-lg">
            <span className="text-xp">+{score.xp} XP</span>
            <span className="text-gold">+{score.gold} 🪙</span>
          </div>
        </div>
        <button onClick={claimRewards} className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-medium hover:opacity-90 transition-opacity">
          Claim Rewards
        </button>
      </div>
    );
  }

  // Exploring
  if (exploring && selectedWorld !== null) {
    return (
      <ExploreMode
        worldIndex={selectedWorld}
        onExit={handleExploreExit}
        timeLeft={exploreTimeLeft}
      />
    );
  }

  // Playing dungeon
  if (playing && selectedWorld !== null) {
    const theme = WORLD_THEMES[selectedWorld];
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
        <div className="absolute top-4 right-4 z-10">
          <button onClick={endGame} className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-3 flex items-center gap-3 text-sm">
          <span className="text-muted-foreground font-display">{theme.name}</span>
          <span className="font-mono flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatCooldown(timeLeft)}</span>
        </div>
        <canvas
          ref={canvasRef}
          width={GAME_W}
          height={GAME_H}
          className="border-2 border-border rounded-md"
          style={{ width: GAME_W * 3, height: GAME_H * 3, imageRendering: "pixelated" }}
        />
        <div className="mt-3 text-xs text-muted-foreground space-y-1 text-center">
          <p>WASD / Arrow keys to move · Space / Enter to attack</p>
        </div>
      </div>
    );
  }

  // World selection
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Gamepad2 className="w-5 h-5" />
        <h1 className="text-2xl font-bold tracking-tight font-display">Game Mode</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Choose a mode and world to earn bonus XP and gold!
      </p>

      {/* Mode selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setGameType("dungeon")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
            gameType === "dungeon" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
          }`}
        >
          <Swords className="w-4 h-4" /> Dungeon Crawl
        </button>
        <button
          onClick={() => setGameType("explore")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
            gameType === "explore" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
          }`}
        >
          <Compass className="w-4 h-4" /> Explore World
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        {gameType === "dungeon"
          ? "Fight enemies and collect coins in a procedural dungeon."
          : "Roam a Zelda-style overworld — talk to NPCs, find treasure chests, and discover secrets."}
      </p>

      {cooldownRemaining > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <Clock className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Next adventure available in</p>
          <p className="text-2xl font-mono font-bold mt-1">{formatCooldown(cooldownRemaining)}</p>
        </div>
      )}

      <div className="grid gap-3">
        {WORLD_THEMES.map((world, i) => {
          const unlocked = level >= world.levelReq;
          const canPlay = unlocked && cooldownRemaining <= 0;
          return (
            <motion.button
              key={world.id}
              onClick={() => canPlay && (gameType === "dungeon" ? startGame(i) : startExplore(i))}
              disabled={!canPlay}
              whileHover={canPlay ? { scale: 1.01 } : {}}
              whileTap={canPlay ? { scale: 0.99 } : {}}
              className={`border border-border rounded-lg p-4 text-left transition-colors ${
                canPlay ? "bg-card hover:bg-accent cursor-pointer" : "bg-muted/30 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: world.accent + "22" }}
                >
                  {unlocked ? (
                    <span style={{ color: world.accent }}>{gameType === "dungeon" ? "⚔" : "🗺"}</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">🔒</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold font-display text-sm">{world.name}</h3>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground font-mono">
                    <span>Lv. {world.levelReq}</span>
                    <span>{gameType === "dungeon" ? `${world.enemies.length} enemy types` : "Open world"}</span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

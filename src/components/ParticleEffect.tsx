import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: "circle" | "square" | "star" | "spark";
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  opacity: number;
}

export type ParticlePreset = "levelUp" | "questComplete" | "habitComplete" | "dungeonClear" | "xpGain";

const PRESETS: Record<ParticlePreset, {
  count: number;
  colors: string[];
  shapes: Particle["shape"][];
  speed: [number, number];
  size: [number, number];
  life: [number, number];
  gravity: number;
  spread: "burst" | "fountain" | "rain" | "radial";
}> = {
  levelUp: {
    count: 80,
    colors: ["#FFD700", "#FFA500", "#FF6347", "#FFE066", "#FFFFFF"],
    shapes: ["star", "spark", "square"],
    speed: [2, 8],
    size: [3, 8],
    life: [40, 80],
    gravity: -0.02,
    spread: "radial",
  },
  questComplete: {
    count: 30,
    colors: ["#4ADE80", "#22C55E", "#86EFAC", "#FFFFFF"],
    shapes: ["circle", "spark"],
    speed: [1, 4],
    size: [2, 5],
    life: [25, 50],
    gravity: 0.05,
    spread: "burst",
  },
  habitComplete: {
    count: 20,
    colors: ["#F97316", "#FB923C", "#FDBA74", "#FFD700"],
    shapes: ["spark", "circle"],
    speed: [1, 3],
    size: [2, 4],
    life: [20, 40],
    gravity: -0.03,
    spread: "fountain",
  },
  dungeonClear: {
    count: 100,
    colors: ["#FFD700", "#FFA500", "#FF4500", "#FF6347", "#FFFFFF", "#FFE066"],
    shapes: ["star", "spark", "square", "circle"],
    speed: [3, 10],
    size: [3, 10],
    life: [50, 100],
    gravity: 0.03,
    spread: "radial",
  },
  xpGain: {
    count: 12,
    colors: ["#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE"],
    shapes: ["spark", "circle"],
    speed: [0.5, 2],
    size: [2, 4],
    life: [20, 35],
    gravity: -0.08,
    spread: "fountain",
  },
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const method = i === 0 ? "moveTo" : "lineTo";
    ctx[method](x + r * Math.cos(angle), y + r * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fill();
}

function drawSpark(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rotation: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillRect(-r / 2, -r * 1.5, r, r * 3);
  ctx.fillRect(-r * 1.5, -r / 2, r * 3, r);
  ctx.restore();
}

interface ParticleEffectProps {
  preset: ParticlePreset;
  trigger: number; // increment to fire
  originX?: number; // 0-1 fraction of screen
  originY?: number;
}

export function ParticleEffect({ preset, trigger, originX = 0.5, originY = 0.5 }: ParticleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const prevTrigger = useRef(trigger);

  const spawnParticles = useCallback(() => {
    const cfg = PRESETS[preset];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cx = canvas.width * originX;
    const cy = canvas.height * originY;

    const newParticles: Particle[] = [];
    for (let i = 0; i < cfg.count; i++) {
      const angle = cfg.spread === "radial"
        ? rand(0, Math.PI * 2)
        : cfg.spread === "fountain"
        ? rand(-Math.PI * 0.8, -Math.PI * 0.2)
        : cfg.spread === "rain"
        ? rand(Math.PI * 0.3, Math.PI * 0.7)
        : rand(0, Math.PI * 2);

      const speed = rand(cfg.speed[0], cfg.speed[1]);

      newParticles.push({
        x: cx + rand(-10, 10),
        y: cy + rand(-10, 10),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(cfg.life[0], cfg.life[1]),
        maxLife: rand(cfg.life[0], cfg.life[1]),
        size: rand(cfg.size[0], cfg.size[1]),
        color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
        shape: cfg.shapes[Math.floor(Math.random() * cfg.shapes.length)],
        rotation: rand(0, Math.PI * 2),
        rotationSpeed: rand(-0.1, 0.1),
        gravity: cfg.gravity,
        opacity: 1,
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, [preset, originX, originY]);

  useEffect(() => {
    if (trigger > 0 && trigger !== prevTrigger.current) {
      prevTrigger.current = trigger;
      spawnParticles();
    }
  }, [trigger, spawnParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.99;
        p.life -= 1;
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, p.life / p.maxLife);

        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        switch (p.shape) {
          case "circle":
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "square":
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
            break;
          case "star":
            drawStar(ctx, p.x, p.y, p.size);
            break;
          case "spark":
            drawSpark(ctx, p.x, p.y, p.size * 0.4, p.rotation);
            break;
        }
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[100] pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}

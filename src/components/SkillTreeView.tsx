import { useState, useRef, useCallback, useEffect } from "react";
import { SkillCategory, Skill } from "@/lib/game-data";
import { Target, Shield, Zap, BookOpen, Sparkles, Lock, Check, ChevronLeft, ChevronRight } from "lucide-react";

const CATEGORY_META: Record<SkillCategory, { icon: typeof Target; label: string }> = {
  focus: { icon: Target, label: "Focus" },
  discipline: { icon: Shield, label: "Discipline" },
  energy: { icon: Zap, label: "Energy" },
  intelligence: { icon: BookOpen, label: "Intelligence" },
  creativity: { icon: Sparkles, label: "Creativity" },
};

const CATEGORIES: SkillCategory[] = ["focus", "discipline", "energy", "intelligence", "creativity"];

interface NodePos { x: number; y: number }

function getTreeLayout(catSkills: Skill[]): Map<string, NodePos> {
  const positions = new Map<string, NodePos>();
  const catPrefix = catSkills[0]?.id.charAt(0) || "x";
  const layout: Record<string, NodePos> = {
    [`${catPrefix}1`]: { x: 300, y: 50 },
    [`${catPrefix}2a`]: { x: 160, y: 160 },
    [`${catPrefix}3a`]: { x: 100, y: 280 },
    [`${catPrefix}4a`]: { x: 60, y: 400 },
    [`${catPrefix}5a`]: { x: 60, y: 520 },
    [`${catPrefix}2b`]: { x: 440, y: 160 },
    [`${catPrefix}3b`]: { x: 500, y: 280 },
    [`${catPrefix}4b`]: { x: 540, y: 400 },
    [`${catPrefix}5b`]: { x: 540, y: 520 },
    [`${catPrefix}3c`]: { x: 220, y: 280 },
    [`${catPrefix}4c`]: { x: 220, y: 400 },
    [`${catPrefix}6a`]: { x: 160, y: 640 },
    [`${catPrefix}6b`]: { x: 440, y: 640 },
  };
  catSkills.forEach(s => { if (layout[s.id]) positions.set(s.id, layout[s.id]); });
  return positions;
}

function getConnections(catSkills: Skill[]): [string, string][] {
  return catSkills.filter(s => s.requires).map(s => [s.requires!, s.id]);
}

interface DraggableTreeProps {
  skills: Skill[];
  skillPoints: number;
  onSelect: (skill: Skill) => void;
  canUnlock: (skill: Skill) => boolean;
}

function DraggableTree({ skills, skillPoints, onSelect, canUnlock }: DraggableTreeProps) {
  const [catIndex, setCatIndex] = useState(0);
  const cat = CATEGORIES[catIndex];
  const meta = CATEGORY_META[cat];
  const Icon = meta.icon;
  const catSkills = skills.filter(s => s.category === cat);
  const positions = getTreeLayout(catSkills);
  const connections = getConnections(catSkills);

  // Drag with refs for zero-lag panning
  const panRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [, forceRender] = useState(0);

  const applyTransform = () => {
    if (panRef.current) {
      panRef.current.style.transform = `translate(${offsetRef.current.x}px, ${offsetRef.current.y}px)`;
    }
  };

  const resetPan = () => {
    offsetRef.current = { x: 0, y: 0 };
    applyTransform();
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-skill]")) return;
    draggingRef.current = true;
    startRef.current = { x: e.clientX, y: e.clientY, ox: offsetRef.current.x, oy: offsetRef.current.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    offsetRef.current = {
      x: startRef.current.ox + (e.clientX - startRef.current.x),
      y: startRef.current.oy + (e.clientY - startRef.current.y),
    };
    applyTransform();
  }, []);

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const switchCat = (i: number) => {
    setCatIndex(i);
    offsetRef.current = { x: 0, y: 0 };
    forceRender(n => n + 1);
    requestAnimationFrame(applyTransform);
  };

  useEffect(() => {
    applyTransform();
  }, [catIndex]);

  const prev = () => switchCat((catIndex - 1 + CATEGORIES.length) % CATEGORIES.length);
  const next = () => switchCat((catIndex + 1) % CATEGORIES.length);

  const canvasW = 600;
  const canvasH = 720;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3">
        <Icon className="w-5 h-5" />
        <h2 className="text-lg font-bold font-display">{meta.label} Tree</h2>
        <span className="text-xs text-muted-foreground ml-2">
          {catSkills.filter(s => s.unlocked).length}/{catSkills.length} unlocked
        </span>
      </div>

      {/* Draggable canvas - NO framer-motion on the pan layer */}
      <div
        className="relative border border-border rounded-xl bg-card overflow-hidden select-none touch-none"
        style={{ height: 440, cursor: "grab" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />
        <div className="absolute top-3 right-3 text-[10px] text-muted-foreground z-20 pointer-events-none">
          Drag to pan
        </div>

        {/* Pan layer - plain div, no animation interference */}
        <div ref={panRef} className="absolute inset-0" style={{ willChange: "transform" }}>
          <div className="relative mx-auto" style={{ width: canvasW, height: canvasH }}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${canvasW} ${canvasH}`}>
              {connections.map(([fromId, toId]) => {
                const from = positions.get(fromId);
                const to = positions.get(toId);
                if (!from || !to) return null;
                const fromSkill = catSkills.find(s => s.id === fromId);
                const toSkill = catSkills.find(s => s.id === toId);
                const bothUnlocked = fromSkill?.unlocked && toSkill?.unlocked;
                const oneUnlocked = fromSkill?.unlocked;
                return (
                  <line key={`${fromId}-${toId}`}
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={bothUnlocked ? "hsl(var(--foreground))" : oneUnlocked ? "hsl(var(--foreground) / 0.4)" : "hsl(var(--border))"}
                    strokeWidth={bothUnlocked ? 2.5 : 2}
                    strokeDasharray={bothUnlocked ? "none" : "6 4"}
                  />
                );
              })}
            </svg>

            {catSkills.map(skill => {
              const pos = positions.get(skill.id);
              if (!pos) return null;
              return (
                <button
                  key={skill.id}
                  data-skill
                  onClick={() => onSelect(skill)}
                  style={{ position: "absolute", left: pos.x - 40, top: pos.y - 40 }}
                  className={`w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-all hover:scale-105 active:scale-95 z-10 ${
                    skill.unlocked
                      ? "border-foreground bg-foreground text-background"
                      : canUnlock(skill)
                      ? "border-foreground bg-background hover:bg-accent cursor-pointer"
                      : "border-muted bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {skill.unlocked ? <Check className="w-5 h-5" /> : !canUnlock(skill) ? <Lock className="w-4 h-4" /> : <span className="text-base font-bold">T{skill.tier}</span>}
                  <span className="truncate w-full text-center px-1 text-[9px] leading-tight">{skill.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={prev} className="p-2 rounded-md border border-border hover:bg-accent transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2">
          {CATEGORIES.map((c, i) => {
            const CatIcon = CATEGORY_META[c].icon;
            return (
              <button key={c} onClick={() => switchCat(i)} title={CATEGORY_META[c].label}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                  i === catIndex ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <CatIcon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
        <button onClick={next} className="p-2 rounded-md border border-border hover:bg-accent transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export { DraggableTree, CATEGORY_META };

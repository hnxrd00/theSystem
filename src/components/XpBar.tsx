import { useGame } from "@/context/GameContext";
import { useParticles } from "@/context/ParticleContext";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export function XpBar() {
  const { level, xp, xpToNext, title, gold, skillPoints } = useGame();
  const { emit } = useParticles();
  const pct = Math.min((xp / xpToNext) * 100, 100);
  const prevPct = useRef(pct);

  useEffect(() => {
    // Emit xpGain particles when bar increases significantly
    if (pct > prevPct.current + 3) {
      emit("xpGain", 0.25, 0.03);
    }
    prevPct.current = pct;
  }, [pct, emit]);

  return (
    <div className="xp-bar flex items-center gap-4 px-4 py-3 border-b border-border bg-card" style={{ backgroundColor: 'var(--card-bg, var(--card))', backdropFilter: 'var(--backdrop-blur)' }}>
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-mono text-sm font-bold text-primary-foreground">
          {level}
        </div>
        <div className="hidden sm:block">
          <p className="text-xs text-muted-foreground">{title}</p>
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-foreground rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">{xp}/{xpToNext} XP</p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-4 text-sm font-mono">
        <span title="Gold">🪙 {gold}</span>
        <span title="Skill Points" className="text-muted-foreground">⚡ {skillPoints}</span>
      </div>
    </div>
  );
}

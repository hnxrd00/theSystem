import { useGame } from "@/context/GameContext";
import { useSettings } from "@/context/SettingsContext";
import { SkillCategory, Skill } from "@/lib/game-data";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { DraggableTree, CATEGORY_META } from "@/components/SkillTreeView";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { playSound } from "@/lib/sounds";

export default function SkillsPage() {
  const { skills, skillPoints, unlockSkill } = useGame();
  const { skillTreeFormat, soundEnabled } = useSettings();
  const [selected, setSelected] = useState<Skill | null>(null);
  const categories: SkillCategory[] = ["focus", "discipline", "energy", "intelligence", "creativity"];

  const canUnlock = (skill: Skill) => {
    if (skill.unlocked || skillPoints < skill.cost) return false;
    if (skill.requires) {
      const req = skills.find(s => s.id === skill.requires);
      if (!req?.unlocked) return false;
    }
    return true;
  };

  const handleSelect = useCallback((skill: Skill) => {
    if (soundEnabled) playSound("skillSelect");
    setSelected(skill);
  }, [soundEnabled]);

  const handleHover = useCallback(() => {
    if (soundEnabled) playSound("skillHover");
  }, [soundEnabled]);

  const handleUnlock = useCallback((skill: Skill) => {
    if (canUnlock(skill)) {
      if (soundEnabled) playSound("skillUnlock");
      unlockSkill(skill.id);
      setSelected(null);
    } else {
      if (soundEnabled) playSound("skillLocked");
    }
  }, [soundEnabled, unlockSkill, skills, skillPoints]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-display">Skill Trees</h1>
        <span className="text-sm font-mono bg-secondary px-3 py-1 rounded-md">⚡ {skillPoints} SP</span>
      </div>

      {skillTreeFormat === "tree" ? (
        <DraggableTree skills={skills} skillPoints={skillPoints} onSelect={handleSelect} canUnlock={canUnlock} />
      ) : (
        <div className="grid gap-6">
          {categories.map(cat => {
            const catSkills = skills.filter(s => s.category === cat).sort((a, b) => a.tier - b.tier);
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            return (
              <div key={cat} className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="w-4 h-4" />
                  <h2 className="font-semibold text-sm">{meta.label}</h2>
                </div>
                <div className="flex items-center gap-3">
                  {catSkills.map((skill, i) => (
                    <div key={skill.id} className="flex items-center gap-3">
                      <Tooltip delayDuration={150}>
                        <TooltipTrigger asChild>
                          <div>
                            <motion.button
                              onClick={() => handleSelect(skill)}
                              onHoverStart={handleHover}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.95 }}
                              className={`relative w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                                skill.unlocked
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : canUnlock(skill)
                                  ? "border-primary bg-background hover:bg-accent cursor-pointer"
                                  : "border-muted bg-muted/50 text-muted-foreground cursor-not-allowed"
                              }`}
                            >
                              {skill.unlocked ? <Check className="w-4 h-4" /> : !canUnlock(skill) ? <Lock className="w-3 h-3" /> : <span className="text-lg">T{skill.tier}</span>}
                              <span className="truncate w-full text-center px-1">{skill.name.split(" ")[0]}</span>
                            </motion.button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="w-56 p-3 space-y-2">
                          <p className="font-semibold text-sm">{skill.name}</p>
                          <p className="text-xs text-muted-foreground">{skill.description}</p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>Tier {skill.tier} · {skill.cost} SP</span>
                              <span className={skill.unlocked ? "text-primary font-medium" : ""}>{skill.unlocked ? "✓ Unlocked" : "Locked"}</span>
                            </div>
                            <Progress value={skill.unlocked ? 100 : canUnlock(skill) ? 60 : (skill.tier > 1 ? 20 : 0)} className="h-1.5" />
                          </div>
                        </TooltipContent>
                      </Tooltip>
                      {i < catSkills.length - 1 && <div className="w-4 h-0.5 bg-border" />}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Skill Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div className="bg-background border border-border rounded-lg p-6 w-full max-w-sm"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold font-display">{selected.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>Tier {selected.tier}</span>
                <span>Cost: {selected.cost} SP</span>
                <span className="capitalize">{selected.category}</span>
              </div>
              <Progress value={selected.unlocked ? 100 : canUnlock(selected) ? 60 : 0} className="h-1.5 mt-3" />
              {selected.unlocked ? (
                <div className="mt-4 text-center text-sm font-medium text-muted-foreground">✓ Unlocked</div>
              ) : (
                <button
                  onClick={() => handleUnlock(selected)}
                  disabled={!canUnlock(selected)}
                  className="mt-4 w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  {canUnlock(selected) ? `Unlock (${selected.cost} SP)` : selected.requires && !skills.find(s => s.id === selected.requires)?.unlocked ? "Requires previous skill" : "Not enough SP"}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

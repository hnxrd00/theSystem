import { useGame } from "@/context/GameContext";
import { useParticles } from "@/context/ParticleContext";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LevelUpModal() {
  const { level, title, levelUpEvents } = useGame();
  const { emit } = useParticles();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (levelUpEvents > 0) {
      setShow(true);
      emit("levelUp", 0.5, 0.4);
      const t = setTimeout(() => setShow(false), 2500);
      return () => clearTimeout(t);
    }
  }, [levelUpEvents, emit]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShow(false)}
        >
          <motion.div
            className="bg-background border-2 border-foreground rounded-lg p-10 text-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <div className="text-5xl mb-4">⚔️</div>
            <h2 className="text-3xl font-bold tracking-tight">Level Up!</h2>
            <p className="text-lg text-muted-foreground mt-2">You reached <span className="font-bold text-foreground">Level {level}</span></p>
            <p className="text-sm text-muted-foreground mt-1">{title}</p>
            <p className="text-xs text-muted-foreground mt-4">+1 Skill Point earned</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useState, useEffect, useRef } from "react";
import { useGame } from "@/context/GameContext";
import { useParticles } from "@/context/ParticleContext";
import { DUNGEON_CONFIG, DungeonType } from "@/lib/game-data";
import { motion } from "framer-motion";
import { Flame, Clock, Trophy, X, Pause, Play } from "lucide-react";

export default function Dungeons() {
  const { addXpAndGold } = useGame();
  const { emit } = useParticles();
  const [activeDungeon, setActiveDungeon] = useState<DungeonType | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const startDungeon = (type: DungeonType) => {
    setActiveDungeon(type);
    setTimeLeft(DUNGEON_CONFIG[type].duration);
    setPaused(false);
    setCompleted(false);
  };

  useEffect(() => {
    if (!activeDungeon || paused || completed) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [activeDungeon, paused, completed]);

  const handleComplete = () => {
    if (activeDungeon) {
      const cfg = DUNGEON_CONFIG[activeDungeon];
      addXpAndGold(cfg.xp, cfg.gold);
      emit("dungeonClear", 0.5, 0.4);
    }
    setActiveDungeon(null);
    setCompleted(false);
  };

  const exitDungeon = () => {
    clearInterval(intervalRef.current);
    setActiveDungeon(null);
    setCompleted(false);
    setPaused(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (activeDungeon && !completed) {
    const cfg = DUNGEON_CONFIG[activeDungeon];
    const pct = ((cfg.duration - timeLeft) / cfg.duration) * 100;
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
        <div className="absolute top-4 right-4">
          <button onClick={exitDungeon} className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <Flame className="w-8 h-8 mx-auto mb-4 text-foreground" />
          <p className="text-sm text-muted-foreground mb-2">{cfg.label}</p>
          <p className="text-7xl font-mono font-bold tracking-tighter">{formatTime(timeLeft)}</p>
          <div className="w-64 h-1.5 bg-muted rounded-full mt-6 mx-auto overflow-hidden">
            <motion.div className="h-full bg-foreground rounded-full" animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
          </div>
          <div className="mt-8">
            <button onClick={() => setPaused(!paused)} className="p-3 rounded-full border border-border hover:bg-accent transition-colors">
              {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
          </div>
          {paused && <p className="text-xs text-muted-foreground mt-3">Paused — stay focused!</p>}
        </motion.div>
      </div>
    );
  }

  if (completed && activeDungeon) {
    const cfg = DUNGEON_CONFIG[activeDungeon];
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <Trophy className="w-10 h-10 mx-auto mb-4" />
          <h2 className="text-3xl font-bold">Dungeon Cleared!</h2>
          <p className="text-muted-foreground mt-2">{cfg.label} completed</p>
          <div className="flex items-center justify-center gap-6 mt-4 font-mono text-lg">
            <span>+{cfg.xp} XP</span>
            <span>+{cfg.gold} 🪙</span>
          </div>
          <button onClick={handleComplete} className="mt-6 bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-medium hover:opacity-90 transition-opacity">
            Claim Rewards
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Dungeons</h1>
      <p className="text-sm text-muted-foreground">Enter a dungeon to start a deep work session. Stay focused to earn rewards.</p>

      <div className="grid gap-3">
        {(["quick", "standard", "boss"] as DungeonType[]).map(type => {
          const cfg = DUNGEON_CONFIG[type];
          return (
            <motion.button
              key={type}
              onClick={() => startDungeon(type)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="border border-border rounded-lg p-5 bg-card text-left hover:bg-accent transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{cfg.label}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.floor(cfg.duration / 60)} min</span>
                    <span>+{cfg.xp} XP</span>
                    <span>+{cfg.gold} 🪙</span>
                  </div>
                </div>
                <Flame className={`w-5 h-5 ${type === "boss" ? "text-foreground" : "text-muted-foreground"}`} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

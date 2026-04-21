import { useState } from "react";
import { useGame } from "@/context/GameContext";
import { useParticles } from "@/context/ParticleContext";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Flame, Trash2, X, Check } from "lucide-react";

export default function Habits() {
  const { habits, addHabit, completeHabit, deleteHabit } = useGame();
  const { emit } = useParticles();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [freq, setFreq] = useState<"daily" | "weekly">("daily");

  const handleCreate = () => {
    if (!title.trim()) return;
    addHabit(title.trim(), freq);
    setTitle("");
    setFreq("daily");
    setShowCreate(false);
  };

  const handleComplete = (id: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    emit("habitComplete", rect.left / window.innerWidth, rect.top / window.innerHeight);
    completeHabit(id);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Habits</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> New Habit
        </button>
      </div>

      {habits.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12 border border-dashed border-border rounded-lg">
          No habits yet. Build your first habit to start a streak!
        </p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {habits.map(h => (
              <motion.div
                key={h.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="border border-border rounded-lg p-4 bg-card flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => !h.completedToday && handleComplete(h.id, e)}
                    disabled={h.completedToday}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                      h.completedToday
                        ? "border-foreground bg-foreground text-background"
                        : "border-muted-foreground hover:border-foreground"
                    }`}
                  >
                    {h.completedToday && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <div>
                    <p className={`font-medium text-sm ${h.completedToday ? "line-through text-muted-foreground" : ""}`}>{h.title}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{h.frequency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm font-mono">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{h.streak}</span>
                  </div>
                  <button onClick={() => deleteHabit(h.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div className="bg-background border border-border rounded-lg p-6 w-full max-w-sm"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">New Habit</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-accent rounded-md"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Habit name" className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                <div className="flex gap-2">
                  {(["daily", "weekly"] as const).map(f => (
                    <button key={f} onClick={() => setFreq(f)}
                      className={`flex-1 px-3 py-2 rounded-md text-sm capitalize transition-colors ${
                        freq === f ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent"
                      }`}
                    >{f}</button>
                  ))}
                </div>
                <button onClick={handleCreate} disabled={!title.trim()}
                  className="w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
                >Create Habit</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

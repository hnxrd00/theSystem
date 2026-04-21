import { useState } from "react";
import { useGame } from "@/context/GameContext";
import { useParticles } from "@/context/ParticleContext";
import { DIFFICULTY_CONFIG, CATEGORY_ICONS, Difficulty, QuestCategory } from "@/lib/game-data";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2, X } from "lucide-react";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "boss"];
const CATEGORIES: QuestCategory[] = ["health", "study", "work", "personal", "creative", "social"];

export default function Quests() {
  const { quests, addQuest, completeQuest, deleteQuest } = useGame();
  const { emit } = useParticles();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [diff, setDiff] = useState<Difficulty>("medium");
  const [cat, setCat] = useState<QuestCategory>("work");

  const filtered = quests.filter(q => filter === "all" || q.status === filter);

  const handleCreate = () => {
    if (!title.trim()) return;
    addQuest(title.trim(), desc.trim(), diff, cat);
    setTitle(""); setDesc(""); setDiff("medium"); setCat("work"); setShowCreate(false);
  };

  const handleComplete = (id: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    emit("questComplete", rect.left / window.innerWidth, rect.top / window.innerHeight);
    completeQuest(id);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Quests</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> New Quest
        </button>
      </div>

      <div className="flex gap-2">
        {(["all", "active", "completed"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >{f}</button>
        ))}
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
              {filter === "all" ? "No quests yet. Create your first quest!" : `No ${filter} quests.`}
            </p>
          )}
          {filtered.map(q => (
            <motion.div
              key={q.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`border border-border rounded-lg p-4 bg-card ${q.status === "completed" ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span>{CATEGORY_ICONS[q.category]}</span>
                    <h3 className={`font-medium text-sm ${q.status === "completed" ? "line-through" : ""}`}>{q.title}</h3>
                  </div>
                  {q.description && <p className="text-xs text-muted-foreground mt-1 ml-7">{q.description}</p>}
                  <div className="flex items-center gap-2 mt-2 ml-7">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider ${
                      q.difficulty === "boss" ? "border-foreground bg-foreground text-background" : "border-border"
                    }`}>{q.difficulty}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">+{DIFFICULTY_CONFIG[q.difficulty].xp} XP · +{DIFFICULTY_CONFIG[q.difficulty].gold} 🪙</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {q.status === "active" && (
                    <button onClick={(e) => handleComplete(q.id, e)} className="p-1.5 rounded-md hover:bg-accent transition-colors" title="Complete">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => deleteQuest(q.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div className="bg-background border border-border rounded-lg p-6 w-full max-w-md"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">New Quest</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-accent rounded-md"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Quest title" className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Difficulty</label>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map(d => (
                      <button key={d} onClick={() => setDiff(d)}
                        className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                          diff === d ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent"
                        }`}
                      >{d}<span className="block text-[10px] opacity-70">+{DIFFICULTY_CONFIG[d].xp} XP</span></button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => setCat(c)}
                        className={`px-2 py-1.5 rounded-md text-xs capitalize transition-colors ${
                          cat === c ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent"
                        }`}
                      >{CATEGORY_ICONS[c]} {c}</button>
                    ))}
                  </div>
                </div>
                <button onClick={handleCreate} disabled={!title.trim()}
                  className="w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >Create Quest</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

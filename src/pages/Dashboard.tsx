import { useGame } from "@/context/GameContext";
import { motion } from "framer-motion";
import { Swords, Target, Flame, Trophy, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const TIPS = [
  "Small consistent actions build legendary results.",
  "Focus is a superpower. Enter a dungeon today.",
  "Your streak is your shield against procrastination.",
  "Every quest completed makes you stronger.",
  "Skill points unlock your true potential.",
];

export default function Dashboard() {
  const { level, title, totalTasksCompleted, totalXpEarned, longestStreak, dungeonsCompleted, quests, habits, gold } = useGame();
  const activeQuests = quests.filter(q => q.status === "active");
  const todayHabits = habits.filter(h => !h.completedToday);
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];

  const stats = [
    { icon: Swords, label: "Quests Done", value: totalTasksCompleted },
    { icon: TrendingUp, label: "Total XP", value: totalXpEarned },
    { icon: Target, label: "Best Streak", value: longestStreak },
    { icon: Flame, label: "Dungeons", value: dungeonsCompleted },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {title}</h1>
        <p className="text-sm text-muted-foreground mt-1 italic">"{tip}"</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className="border border-border rounded-lg p-4 bg-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <s.icon className="w-4 h-4 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold font-mono">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Active Quests */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Active Quests</h2>
          <Link to="/quests" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all →</Link>
        </div>
        {activeQuests.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-6 text-center">
            No active quests. <Link to="/quests" className="underline">Create one</Link> to begin your journey.
          </p>
        ) : (
          <div className="space-y-2">
            {activeQuests.slice(0, 3).map(q => (
              <div key={q.id} className="border border-border rounded-lg p-3 flex items-center justify-between bg-card">
                <div>
                  <p className="font-medium text-sm">{q.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{q.difficulty} · {q.category}</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">+{
                  q.difficulty === "easy" ? 25 : q.difficulty === "medium" ? 50 : q.difficulty === "hard" ? 100 : 250
                } XP</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Habits Today */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Habits Today</h2>
          <Link to="/habits" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Manage →</Link>
        </div>
        {habits.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-6 text-center">
            No habits yet. <Link to="/habits" className="underline">Create one</Link> to build streaks.
          </p>
        ) : (
          <div className="space-y-2">
            {habits.slice(0, 4).map(h => (
              <div key={h.id} className="border border-border rounded-lg p-3 flex items-center justify-between bg-card">
                <div className="flex items-center gap-2">
                  {h.completedToday ? (
                    <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center text-background text-xs">✓</div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                  )}
                  <p className={`text-sm ${h.completedToday ? "line-through text-muted-foreground" : "font-medium"}`}>{h.title}</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">🔥 {h.streak}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Dungeon */}
      <Link to="/dungeons" className="block border border-border rounded-lg p-4 bg-card hover:bg-accent transition-colors group">
        <div className="flex items-center gap-3">
          <Flame className="w-5 h-5 group-hover:text-foreground text-muted-foreground transition-colors" />
          <div>
            <p className="font-semibold text-sm">Enter a Dungeon</p>
            <p className="text-xs text-muted-foreground">Start a deep work session for bonus XP and gold</p>
          </div>
        </div>
      </Link>
    </div>
  );
}

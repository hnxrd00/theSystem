import { useState, useMemo } from "react";
import { useGame, RANK_CONFIG, getRankForLevel } from "@/context/GameContext";
import { SHOP_ITEMS } from "@/lib/game-data";
import {
  PixelAvatar,
  AvatarConfig,
  DEFAULT_AVATAR,
  AvatarSkin,
  AvatarHair,
  AvatarHairColor,
  AvatarEyes,
  AvatarArmor,
  AvatarWeapon,
} from "@/components/PixelAvatar";
import { User, TrendingUp, Swords, Target, Flame, Trophy, BarChart3, ChevronLeft, ChevronRight, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const SKINS: AvatarSkin[] = ["light", "tan", "brown", "dark"];
const HAIRS: AvatarHair[] = ["spiky", "long", "mohawk", "ponytail", "bald"];
const BASE_HAIR_COLORS: AvatarHairColor[] = ["black", "brown", "blonde"];
const EYES: AvatarEyes[] = ["normal", "angry", "happy"];

function WeeklyHeatmap({ activityLog }: { activityLog: { date: string; xp: number }[] }) {
  // Build last 7 weeks (49 days) grid
  const today = new Date();
  const cells: { date: string; xp: number; day: number; week: number }[] = [];
  for (let i = 48; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const entry = activityLog.find(e => e.date === dateStr);
    const week = Math.floor((48 - i) / 7);
    const day = (48 - i) % 7;
    cells.push({ date: dateStr, xp: entry?.xp ?? 0, week, day });
  }

  const maxXp = Math.max(...cells.map(c => c.xp), 1);

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">Activity Heatmap</h3>
      <div className="flex gap-0.5">
        {Array.from({ length: 7 }, (_, week) => (
          <div key={week} className="flex flex-col gap-0.5">
            {cells
              .filter(c => c.week === week)
              .map(c => {
                const intensity = c.xp / maxXp;
                return (
                  <div
                    key={c.date}
                    className="w-5 h-5 rounded-sm border border-border"
                    title={`${c.date}: ${c.xp} XP`}
                    style={{
                      backgroundColor:
                        c.xp === 0
                          ? "hsl(var(--muted))"
                          : `hsl(var(--primary) / ${0.2 + intensity * 0.8})`,
                    }}
                  />
                );
              })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor:
                v === 0 ? "hsl(var(--muted))" : `hsl(var(--primary) / ${0.2 + v * 0.8})`,
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export default function Profile() {
  const {
    level, title, gold, skillPoints, totalTasksCompleted, totalXpEarned,
    longestStreak, dungeonsCompleted, quests, habits, skills, inventory, activityLog,
  } = useGame();

  const rank = getRankForLevel(level);
  const rankConfig = RANK_CONFIG[rank];

  const [avatar, setAvatar] = useState<AvatarConfig>(() => {
    try {
      const saved = localStorage.getItem("questforge_avatar");
      if (saved) return { ...DEFAULT_AVATAR, ...JSON.parse(saved) };
    } catch {}
    return { ...DEFAULT_AVATAR };
  });

  const updateAvatar = (patch: Partial<AvatarConfig>) => {
    const next = { ...avatar, ...patch };
    setAvatar(next);
    localStorage.setItem("questforge_avatar", JSON.stringify(next));
  };

  const unlockedHairColors = useMemo(() => {
    const extra: AvatarHairColor[] = [];
    if (inventory.includes("hair_blue")) extra.push("blue");
    if (inventory.includes("hair_white")) extra.push("white");
    if (inventory.includes("hair_red")) extra.push("red");
    return [...BASE_HAIR_COLORS, ...extra];
  }, [inventory]);

  const unlockedEyes = useMemo(() => {
    const e: AvatarEyes[] = [...EYES];
    if (inventory.includes("eyes_cool")) e.push("cool");
    return e;
  }, [inventory]);

  const unlockedArmors = useMemo<AvatarArmor[]>(() => {
    const a: AvatarArmor[] = ["none"];
    SHOP_ITEMS.filter(i => i.category === "armor" && inventory.includes(i.id) && i.equipValue)
      .forEach(i => a.push(i.equipValue as AvatarArmor));
    return a;
  }, [inventory]);

  const unlockedWeapons = useMemo<AvatarWeapon[]>(() => {
    const w: AvatarWeapon[] = ["none"];
    SHOP_ITEMS.filter(i => i.category === "weapon" && inventory.includes(i.id) && i.equipValue)
      .forEach(i => w.push(i.equipValue as AvatarWeapon));
    return w;
  }, [inventory]);

  const completedQuests = quests.filter(q => q.status === "completed").length;
  const activeQuests = quests.filter(q => q.status === "active").length;
  const unlockedSkills = skills.filter(s => s.unlocked).length;

  const stats = [
    { icon: TrendingUp, label: "Total XP", value: totalXpEarned.toLocaleString() },
    { icon: Swords, label: "Quests Done", value: completedQuests },
    { icon: Target, label: "Best Streak", value: longestStreak },
    { icon: Flame, label: "Dungeons", value: dungeonsCompleted },
    { icon: Trophy, label: "Skills", value: `${unlockedSkills}/${skills.length}` },
    { icon: BarChart3, label: "Active Quests", value: activeQuests },
  ];

  const cycleProp = <T,>(arr: T[], current: T, dir: 1 | -1): T => {
    const idx = arr.indexOf(current);
    return arr[(idx + dir + arr.length) % arr.length];
  };

  // Chart data: last 14 days
  const chartData = useMemo(() => {
    const days: { day: string; xp: number }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const entry = activityLog.find(e => e.date === dateStr);
      days.push({
        day: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
        xp: entry?.xp ?? 0,
      });
    }
    return days;
  }, [activityLog]);

  interface SelectorProps<T> {
    label: string;
    value: T;
    options: T[];
    onChange: (v: T) => void;
    display?: (v: T) => string;
  }

  function Selector<T extends string>({ label, value, options, onChange, display }: SelectorProps<T>) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => onChange(cycleProp(options, value, -1))} className="p-1 rounded hover:bg-accent"><ChevronLeft className="w-3 h-3" /></button>
          <span className="text-xs font-medium w-16 text-center capitalize">{display ? display(value) : String(value)}</span>
          <button onClick={() => onChange(cycleProp(options, value, 1))} className="p-1 rounded hover:bg-accent"><ChevronRight className="w-3 h-3" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <User className="w-5 h-5" />
        <h1 className="text-2xl font-bold tracking-tight font-display">Profile</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Avatar */}
        <div className="border border-border rounded-lg p-6 bg-card flex flex-col items-center">
          <div className="bg-secondary rounded-xl p-4 mb-4" style={{ imageRendering: "pixelated" }}>
            <PixelAvatar config={avatar} size={160} />
          </div>
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-lg font-display">{title}</h2>
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: rankConfig.color }}
              >
                <Crown className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium" style={{ color: rankConfig.color }}>
                {rankConfig.label}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Level {level} · 🪙 {gold} · ⚡ {skillPoints} SP</p>

          <div className="w-full mt-4 space-y-2 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Customize</p>
            <Selector label="Skin" value={avatar.skin} options={SKINS} onChange={v => updateAvatar({ skin: v })} />
            <Selector label="Hair" value={avatar.hair} options={HAIRS} onChange={v => updateAvatar({ hair: v })} />
            <Selector label="Color" value={avatar.hairColor} options={unlockedHairColors} onChange={v => updateAvatar({ hairColor: v })} display={v => v === "blonde" ? "Blonde" : v} />
            <Selector label="Eyes" value={avatar.eyes} options={unlockedEyes} onChange={v => updateAvatar({ eyes: v })} />
            <Selector label="Armor" value={avatar.armor} options={unlockedArmors} onChange={v => updateAvatar({ armor: v })} display={v => v === "mage_robe" ? "Mage" : v === "none" ? "None" : v} />
            <Selector label="Weapon" value={avatar.weapon} options={unlockedWeapons} onChange={v => updateAvatar({ weapon: v })} display={v => v === "none" ? "None" : v} />
          </div>
        </div>

        {/* Stats & Analytics */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s, i) => (
              <motion.div key={s.label} className="border border-border rounded-lg p-3 bg-card"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              >
                <s.icon className="w-4 h-4 text-muted-foreground mb-1" />
                <p className="text-xl font-bold font-mono">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* XP Chart */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <h3 className="font-semibold text-sm mb-3">XP Earned (Last 14 Days)</h3>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="xp" stroke="hsl(var(--primary))" fill="url(#xpGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Heatmap */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <WeeklyHeatmap activityLog={activityLog} />
          </div>

          {/* Inventory Summary */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <h3 className="font-semibold text-sm mb-3">Inventory ({inventory.length} items)</h3>
            {inventory.length === 0 ? (
              <p className="text-xs text-muted-foreground">No items yet. Visit the shop to gear up!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {inventory.map(id => {
                  const item = SHOP_ITEMS.find(i => i.id === id);
                  if (!item) return null;
                  return (
                    <div key={id} className="flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-md text-xs" title={item.description}>
                      <span style={{ imageRendering: "pixelated" }}>{item.pixelIcon}</span>
                      <span>{item.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Habits summary */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <h3 className="font-semibold text-sm mb-2">Habit Streaks</h3>
            {habits.length === 0 ? (
              <p className="text-xs text-muted-foreground">No habits tracked yet.</p>
            ) : (
              <div className="space-y-1.5">
                {habits.map(h => (
                  <div key={h.id} className="flex items-center justify-between text-xs">
                    <span className={h.completedToday ? "text-muted-foreground" : "font-medium"}>{h.title}</span>
                    <span className="font-mono">🔥 {h.streak}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

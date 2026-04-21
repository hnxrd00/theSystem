import { Outlet, NavLink } from "react-router-dom";
import { XpBar } from "./XpBar";
import { LevelUpModal } from "./LevelUpModal";
import { BackgroundProvider } from "./BackgroundProvider";
import { playSound } from "@/lib/sounds";
import { LayoutDashboard, Swords, GitBranch, Flame, Target, Settings, ShoppingBag, User, Globe, Gamepad2, TreePine } from "lucide-react";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/quests", icon: Swords, label: "Quests" },
  { to: "/skills", icon: GitBranch, label: "Skills" },
  { to: "/dungeons", icon: Flame, label: "Dungeons" },
  { to: "/habits", icon: Target, label: "Habits" },
  { to: "/forest", icon: TreePine, label: "Forest" },
  { to: "/game", icon: Gamepad2, label: "Game" },
  { to: "/shop", icon: ShoppingBag, label: "Shop" },
  { to: "/worlds", icon: Globe, label: "Worlds" },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function AppLayout() {
  return (
    <BackgroundProvider>
      <div className="min-h-screen flex flex-col">
        <XpBar />
        <LevelUpModal />
        <div className="flex flex-1">
        <nav className="sidebar hidden md:flex flex-col w-48 border-r border-border bg-card p-3 gap-1" style={{ backgroundColor: 'var(--sidebar-bg, var(--card))', backdropFilter: 'var(--backdrop-blur)' }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"}
              onClick={() => playSound("click")}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`
              }
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
          <Outlet />
        </main>
        </div>
        <nav className="topbar md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around py-1.5 z-40" style={{ backgroundColor: 'var(--topbar-bg, var(--background))', backdropFilter: 'var(--backdrop-blur)' }}>
          {NAV.filter(n => !["/settings"].includes(n.to)).map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"}
              onClick={() => playSound("click")}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-[9px] px-1 py-0.5 ${
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                }`
              }
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </BackgroundProvider>
  );
}

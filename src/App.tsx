import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GameProvider } from "@/context/GameContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { ParticleProvider } from "@/context/ParticleContext";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Quests from "@/pages/Quests";
import SkillsPage from "@/pages/Skills";
import Dungeons from "@/pages/Dungeons";
import Habits from "@/pages/Habits";
import Shop from "@/pages/Shop";
import Profile from "@/pages/Profile";
import Worlds from "@/pages/Worlds";
import GameMode from "@/pages/GameMode";
import ForestPage from "@/pages/Forest";
import SettingsPage from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const App = () => (
  <SettingsProvider>
    <GameProvider>
      <ParticleProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/quests" element={<Quests />} />
                <Route path="/skills" element={<SkillsPage />} />
                <Route path="/dungeons" element={<Dungeons />} />
                <Route path="/habits" element={<Habits />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/worlds" element={<Worlds />} />
                <Route path="/forest" element={<ForestPage />} />
                <Route path="/game" element={<GameMode />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ParticleProvider>
    </GameProvider>
  </SettingsProvider>
);

export default App;

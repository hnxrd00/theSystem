import React, { createContext, useContext, useState, useEffect } from "react";

export type SkillTreeFormat = "linear" | "tree";
export type ColorTheme = "default" | "emerald" | "crimson" | "ocean" | "amber" | "violet";

interface SettingsState {
  skillTreeFormat: SkillTreeFormat;
  soundEnabled: boolean;
  soundVolume: number;
  darkMode: boolean;
  colorTheme: string;
  customBackground: string | null;
  backgroundEnabled: boolean;
  backgroundHistory: string[];
}

interface SettingsContextType extends SettingsState {
  setSkillTreeFormat: (format: SkillTreeFormat) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setDarkMode: (dark: boolean) => void;
  setColorTheme: (theme: string) => void;
  setCustomBackground: (background: string | null) => void;
  setBackgroundEnabled: (enabled: boolean) => void;
  setBackgroundHistory: (history: string[]) => void;
  addBackgroundToHistory: (background: string) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const SETTINGS_KEY = "questforge_settings";

const defaults: SettingsState = {
  skillTreeFormat: "linear",
  soundEnabled: true,
  soundVolume: 0.7,
  darkMode: false,
  colorTheme: "default",
  customBackground: null,
  backgroundEnabled: false,
  backgroundHistory: [],
};

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {}
  return defaults;
}

export const COLOR_THEMES: Record<ColorTheme, { label: string; preview: string; accent: string }> = {
  default: { label: "Monochrome", preview: "bg-neutral-900", accent: "0 0% 0%" },
  emerald: { label: "Emerald", preview: "bg-emerald-600", accent: "152 60% 40%" },
  crimson: { label: "Crimson", preview: "bg-red-600", accent: "0 72% 45%" },
  ocean: { label: "Ocean", preview: "bg-blue-600", accent: "217 72% 50%" },
  amber: { label: "Amber", preview: "bg-amber-500", accent: "38 92% 50%" },
  violet: { label: "Violet", preview: "bg-violet-600", accent: "263 70% 50%" },
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SettingsState>(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        return { ...defaults, ...JSON.parse(stored) };
      } catch {
        return defaults;
      }
    }
    return defaults;
  });

  const updateState = (updates: Partial<SettingsState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  const value: SettingsContextType = {
    ...state,
    setSkillTreeFormat: (format) => updateState({ skillTreeFormat: format }),
    setSoundEnabled: (enabled) => updateState({ soundEnabled: enabled }),
    setSoundVolume: (volume) => updateState({ soundVolume: volume }),
    setDarkMode: (dark) => updateState({ darkMode: dark }),
    setColorTheme: (theme) => updateState({ colorTheme: theme }),
    setCustomBackground: (background) => updateState({ customBackground: background }),
    setBackgroundEnabled: (enabled) => updateState({ backgroundEnabled: enabled }),
    setBackgroundHistory: (history) => updateState({ backgroundHistory: history }),
    addBackgroundToHistory: (background) => {
      setState(prev => {
        const newHistory = [background, ...prev.backgroundHistory.filter(b => b !== background)].slice(0, 10);
        const newState = { ...prev, backgroundHistory: newHistory };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(newState));
        return newState;
      });
    },
  };

  // Sync dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.darkMode);
  }, [state.darkMode]);

  // Sync color theme as data attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.colorTheme);
  }, [state.colorTheme]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

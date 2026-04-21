import React, { createContext, useContext, useState, useCallback } from "react";
import { ParticleEffect, ParticlePreset } from "@/components/ParticleEffect";
import { playSound, SoundEffect } from "@/lib/sounds";
import { useSettings } from "@/context/SettingsContext";
interface ParticleContextType {
  emit: (preset: ParticlePreset, originX?: number, originY?: number) => void;
}

const ParticleContext = createContext<ParticleContextType>({ emit: () => {} });

interface ActiveEffect {
  id: number;
  preset: ParticlePreset;
  trigger: number;
  originX: number;
  originY: number;
}

const PRESET_SOUND_MAP: Record<ParticlePreset, SoundEffect> = {
  levelUp: "levelUp",
  questComplete: "questComplete",
  habitComplete: "habitComplete",
  dungeonClear: "dungeonClear",
  xpGain: "xpGain",
};

let nextId = 0;

export function ParticleProvider({ children }: { children: React.ReactNode }) {
  const [effects, setEffects] = useState<ActiveEffect[]>([]);
  const { soundEnabled } = useSettings();

  const emit = useCallback((preset: ParticlePreset, originX = 0.5, originY = 0.5) => {
    const id = nextId++;
    setEffects(prev => [...prev, { id, preset, trigger: 1, originX, originY }]);

    if (soundEnabled) {
      playSound(PRESET_SOUND_MAP[preset]);
    }

    setTimeout(() => {
      setEffects(prev => prev.filter(e => e.id !== id));
    }, 3000);
  }, [soundEnabled]);

  return (
    <ParticleContext.Provider value={{ emit }}>
      {children}
      {effects.map(e => (
        <ParticleEffect
          key={e.id}
          preset={e.preset}
          trigger={e.trigger}
          originX={e.originX}
          originY={e.originY}
        />
      ))}
    </ParticleContext.Provider>
  );
}

export function useParticles() {
  return useContext(ParticleContext);
}

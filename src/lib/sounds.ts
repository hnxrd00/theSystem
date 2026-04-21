// Web Audio API synthesized sound effects
const audioCtxRef = { current: null as AudioContext | null };

function getCtx(): AudioContext {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new AudioContext();
  }
  if (audioCtxRef.current.state === "suspended") {
    audioCtxRef.current.resume();
  }
  return audioCtxRef.current;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.15,
  delay = 0,
  freqEnd?: number
) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  if (freqEnd) {
    osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + delay + duration);
  }
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function playNoise(duration: number, volume = 0.05, delay = 0) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 3000;
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(ctx.currentTime + delay);
}

export type SoundEffect =
  | "levelUp" | "questComplete" | "habitComplete" | "dungeonClear"
  | "xpGain" | "purchase" | "error" | "click"
  | "skillHover" | "skillUnlock" | "skillLocked" | "skillSelect";

export function playSound(effect: SoundEffect) {
  try {
    switch (effect) {
      case "levelUp":
        playTone(523, 0.15, "square", 0.12, 0);
        playTone(659, 0.15, "square", 0.12, 0.12);
        playTone(784, 0.15, "square", 0.12, 0.24);
        playTone(1047, 0.4, "square", 0.15, 0.36);
        playTone(1319, 0.5, "sine", 0.08, 0.36);
        playNoise(0.3, 0.04, 0.36);
        break;

      case "questComplete":
        playTone(880, 0.12, "sine", 0.12, 0);
        playTone(1109, 0.12, "sine", 0.12, 0.1);
        playTone(1319, 0.25, "sine", 0.1, 0.2);
        playNoise(0.15, 0.03, 0.15);
        break;

      case "habitComplete":
        playTone(660, 0.08, "sine", 0.1, 0);
        playTone(880, 0.15, "sine", 0.1, 0.07);
        break;

      case "dungeonClear":
        playTone(392, 0.2, "square", 0.1, 0);
        playTone(494, 0.2, "square", 0.1, 0.15);
        playTone(587, 0.2, "square", 0.1, 0.3);
        playTone(784, 0.5, "square", 0.15, 0.45);
        playTone(988, 0.6, "sine", 0.08, 0.45);
        playTone(1175, 0.6, "sine", 0.05, 0.5);
        playNoise(0.5, 0.05, 0.45);
        break;

      case "xpGain":
        playTone(1200, 0.08, "sine", 0.06, 0);
        playTone(1600, 0.1, "sine", 0.04, 0.05);
        break;

      case "purchase":
        playTone(1500, 0.06, "square", 0.08, 0);
        playTone(2000, 0.1, "square", 0.06, 0.06);
        break;

      case "error":
        playTone(200, 0.15, "sawtooth", 0.08, 0);
        playTone(150, 0.2, "sawtooth", 0.06, 0.12);
        break;

      case "click":
        playTone(800, 0.04, "sine", 0.06, 0);
        break;

      // ---- Skill tree sounds ----
      case "skillHover":
        // Soft crystalline ping
        playTone(1400, 0.06, "sine", 0.04, 0);
        break;

      case "skillUnlock":
        // Magical ascending chime with shimmer
        playTone(523, 0.1, "sine", 0.1, 0);
        playTone(659, 0.1, "sine", 0.1, 0.08);
        playTone(784, 0.12, "sine", 0.12, 0.16);
        playTone(1047, 0.3, "sine", 0.1, 0.24);
        playNoise(0.2, 0.03, 0.24);
        break;

      case "skillLocked":
        // Dull thud / denial
        playTone(180, 0.12, "triangle", 0.08, 0);
        playTone(120, 0.15, "triangle", 0.06, 0.08);
        break;

      case "skillSelect":
        // Short UI select blip
        playTone(900, 0.05, "sine", 0.07, 0);
        playTone(1100, 0.06, "sine", 0.05, 0.04);
        break;
    }
  } catch {
    // Audio context may not be available
  }
}

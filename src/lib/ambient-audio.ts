// Ambient audio engine using Web Audio API for procedural background music & environment sounds

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// ─── Ambient Music Engine ───

interface MusicLayer {
  osc: OscillatorNode;
  gain: GainNode;
  filter?: BiquadFilterNode;
}

let musicLayers: MusicLayer[] = [];
let musicPlaying = false;
let musicInterval: ReturnType<typeof setInterval> | null = null;

interface MusicTheme {
  baseNote: number;
  scale: number[];
  tempo: number;     // ms per beat
  mood: "peaceful" | "mysterious" | "tense" | "epic" | "ethereal";
}

const MUSIC_THEMES: Record<string, MusicTheme> = {
  verdant_plains: { baseNote: 261.63, scale: [0, 2, 4, 5, 7, 9, 11, 12], tempo: 800, mood: "peaceful" },
  crystal_caves:  { baseNote: 220,    scale: [0, 2, 3, 5, 7, 8, 10, 12], tempo: 1000, mood: "mysterious" },
  ember_wastes:   { baseNote: 196,    scale: [0, 2, 3, 5, 7, 8, 11, 12], tempo: 700, mood: "tense" },
  shadow_realm:   { baseNote: 174.61, scale: [0, 1, 3, 5, 6, 8, 10, 12], tempo: 900, mood: "mysterious" },
  celestial_spire:{ baseNote: 329.63, scale: [0, 2, 4, 7, 9, 12, 14, 16], tempo: 1100, mood: "ethereal" },
};

function noteFreq(base: number, semitones: number): number {
  return base * Math.pow(2, semitones / 12);
}

export function startMusic(worldId: string, mode: "explore" | "dungeon") {
  stopMusic();
  const ctx = getCtx();
  const theme = MUSIC_THEMES[worldId] || MUSIC_THEMES.verdant_plains;
  musicPlaying = true;

  // Drone pad layer
  const droneGain = ctx.createGain();
  droneGain.gain.setValueAtTime(0, ctx.currentTime);
  droneGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2);
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.value = 400;
  const drone = ctx.createOscillator();
  drone.type = "sine";
  drone.frequency.value = theme.baseNote / 2;
  drone.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(ctx.destination);
  drone.start();
  musicLayers.push({ osc: drone, gain: droneGain, filter: droneFilter });

  // Second drone (fifth)
  const drone2Gain = ctx.createGain();
  drone2Gain.gain.setValueAtTime(0, ctx.currentTime);
  drone2Gain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 3);
  const drone2 = ctx.createOscillator();
  drone2.type = "triangle";
  drone2.frequency.value = noteFreq(theme.baseNote / 2, 7);
  const drone2Filter = ctx.createBiquadFilter();
  drone2Filter.type = "lowpass";
  drone2Filter.frequency.value = 300;
  drone2.connect(drone2Filter);
  drone2Filter.connect(drone2Gain);
  drone2Gain.connect(ctx.destination);
  drone2.start();
  musicLayers.push({ osc: drone2, gain: drone2Gain, filter: drone2Filter });

  // Melodic arpeggio layer
  let noteIndex = 0;
  const tempoMs = mode === "dungeon" ? theme.tempo * 0.7 : theme.tempo;

  musicInterval = setInterval(() => {
    if (!musicPlaying) return;
    try {
      const ctx2 = getCtx();
      const scale = theme.scale;
      const semitone = scale[noteIndex % scale.length];
      const octaveShift = Math.floor(noteIndex / scale.length) * 12;
      const freq = noteFreq(theme.baseNote, semitone + octaveShift);

      const osc = ctx2.createOscillator();
      const gain = ctx2.createGain();
      const filter = ctx2.createBiquadFilter();

      osc.type = mode === "dungeon" ? "square" : "sine";
      osc.frequency.value = freq;
      filter.type = "lowpass";
      filter.frequency.value = mode === "dungeon" ? 1200 : 800;

      const vol = mode === "dungeon" ? 0.03 : 0.04;
      gain.gain.setValueAtTime(vol, ctx2.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + tempoMs / 1000 * 1.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx2.destination);
      osc.start();
      osc.stop(ctx2.currentTime + tempoMs / 1000 * 2);

      noteIndex++;
      if (noteIndex >= scale.length * 2) noteIndex = 0;
    } catch {}
  }, tempoMs);
}

export function stopMusic() {
  musicPlaying = false;
  if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }
  for (const layer of musicLayers) {
    try {
      layer.gain.gain.linearRampToValueAtTime(0.001, getCtx().currentTime + 0.5);
      setTimeout(() => { try { layer.osc.stop(); } catch {} }, 600);
    } catch {}
  }
  musicLayers = [];
}

// ─── Ambient Environment Sounds ───

let ambientNodes: { source: AudioBufferSourceNode; gain: GainNode }[] = [];
let ambientInterval: ReturnType<typeof setInterval> | null = null;

export function startAmbient(worldId: string) {
  stopAmbient();
  const ctx = getCtx();

  // Wind/air base layer using filtered noise
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = worldId === "crystal_caves" ? 200 : worldId === "ember_wastes" ? 350 : 250;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 2);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  ambientNodes.push({ source, gain });

  // Periodic nature sounds (birds for plains, drips for caves, crackles for fire)
  ambientInterval = setInterval(() => {
    try {
      const ctx2 = getCtx();
      if (worldId === "verdant_plains" || worldId === "celestial_spire") {
        // Bird chirp
        if (Math.random() > 0.5) {
          const birdFreq = 1800 + Math.random() * 1200;
          const osc = ctx2.createOscillator();
          const g = ctx2.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(birdFreq, ctx2.currentTime);
          osc.frequency.linearRampToValueAtTime(birdFreq * 1.3, ctx2.currentTime + 0.05);
          osc.frequency.linearRampToValueAtTime(birdFreq * 0.9, ctx2.currentTime + 0.1);
          g.gain.setValueAtTime(0.02, ctx2.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.15);
          osc.connect(g);
          g.connect(ctx2.destination);
          osc.start();
          osc.stop(ctx2.currentTime + 0.2);
        }
      } else if (worldId === "crystal_caves" || worldId === "shadow_realm") {
        // Water drip
        if (Math.random() > 0.6) {
          const osc = ctx2.createOscillator();
          const g = ctx2.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(2000 + Math.random() * 1000, ctx2.currentTime);
          osc.frequency.exponentialRampToValueAtTime(400, ctx2.currentTime + 0.08);
          g.gain.setValueAtTime(0.03, ctx2.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.1);
          osc.connect(g);
          g.connect(ctx2.destination);
          osc.start();
          osc.stop(ctx2.currentTime + 0.12);
        }
      } else if (worldId === "ember_wastes") {
        // Fire crackle
        if (Math.random() > 0.4) {
          const buf = ctx2.createBuffer(1, ctx2.sampleRate * 0.05, ctx2.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
          const s = ctx2.createBufferSource();
          s.buffer = buf;
          const f = ctx2.createBiquadFilter();
          f.type = "bandpass";
          f.frequency.value = 3000 + Math.random() * 2000;
          const g = ctx2.createGain();
          g.gain.setValueAtTime(0.02, ctx2.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.06);
          s.connect(f);
          f.connect(g);
          g.connect(ctx2.destination);
          s.start();
        }
      }
    } catch {}
  }, 2000 + Math.random() * 2000);
}

export function stopAmbient() {
  if (ambientInterval) { clearInterval(ambientInterval); ambientInterval = null; }
  for (const n of ambientNodes) {
    try {
      n.gain.gain.linearRampToValueAtTime(0.001, getCtx().currentTime + 0.5);
      setTimeout(() => { try { n.source.stop(); } catch {} }, 600);
    } catch {}
  }
  ambientNodes = [];
}

export function stopAllAudio() {
  stopMusic();
  stopAmbient();
}

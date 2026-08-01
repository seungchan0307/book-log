// A small generative ambient piano, synthesized entirely with the Web Audio
// API — no audio file to fetch or license. Sparse, single-note plucks (with
// an occasional soft harmony note) picked from a pentatonic scale, each
// with a piano-like fast-attack/slow-decay envelope, run through a touch of
// algorithmic reverb for warmth.
const STORAGE_KEY = "book-log:bgm";

// C major pentatonic across three octaves, so any note picked at random
// stays consonant with whatever came before it.
const SCALE = {
  low: [130.81, 146.83, 164.81, 196.0, 220.0], // C3 D3 E3 G3 A3
  mid: [261.63, 293.66, 329.63, 392.0, 440.0], // C4 D4 E4 G4 A4
  high: [523.25, 587.33, 659.25, 783.99, 880.0], // C5 D5 E5 G5 A5
} as const;

const NOTE_MIN_GAP_MS = 1600;
const NOTE_MAX_GAP_MS = 3000;
const NOTE_ATTACK = 0.012;
const NOTE_DECAY_TIME_CONSTANT = 0.9;
const TARGET_VOLUME = 0.9;
// Toggling should feel instant, not fade out over seconds — a very short
// ramp still avoids an audible click without reading as a "fade".
const SNAP_FADE_SECONDS = 0.02;

function pickNoteFrequency(): number {
  const roll = Math.random();
  const register = roll < 0.15 ? SCALE.low : roll < 0.85 ? SCALE.mid : SCALE.high;
  return register[Math.floor(Math.random() * register.length)];
}

function createReverbImpulse(ctx: AudioContext): AudioBuffer {
  const seconds = 2.2;
  const length = Math.floor(ctx.sampleRate * seconds);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
  }
  return impulse;
}

class PianoEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noteBus: GainNode | null = null;
  private noteTimer: ReturnType<typeof setTimeout> | null = null;
  private playing = false;

  isPlaying() {
    return this.playing;
  }

  private ensureGraph() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    const ctx = this.ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    const dry = ctx.createGain();
    dry.gain.value = 0.8;
    dry.connect(this.master);

    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    const convolver = ctx.createConvolver();
    convolver.buffer = createReverbImpulse(ctx);
    convolver.connect(wet);
    wet.connect(this.master);

    this.noteBus = ctx.createGain();
    this.noteBus.gain.value = 1;
    this.noteBus.connect(dry);
    this.noteBus.connect(convolver);
  }

  private playNote(freq: number, velocity: number, startAt: number, delaySeconds = 0) {
    const ctx = this.ctx!;
    const now = startAt + delaySeconds;

    const fundamental = ctx.createOscillator();
    fundamental.type = "triangle";
    fundamental.frequency.value = freq;

    const overtone = ctx.createOscillator();
    overtone.type = "sine";
    overtone.frequency.value = freq * 2;
    const overtoneGain = ctx.createGain();
    overtoneGain.gain.value = 0.15;

    const voiceGain = ctx.createGain();
    voiceGain.gain.value = 0;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 3400;
    filter.Q.value = 0.3;

    fundamental.connect(voiceGain);
    overtone.connect(overtoneGain);
    overtoneGain.connect(voiceGain);
    voiceGain.connect(filter);
    filter.connect(this.noteBus!);

    const peak = 0.45 * velocity;
    voiceGain.gain.setValueAtTime(0, now);
    voiceGain.gain.linearRampToValueAtTime(peak, now + NOTE_ATTACK);
    voiceGain.gain.setTargetAtTime(0.0001, now + NOTE_ATTACK, NOTE_DECAY_TIME_CONSTANT);

    const stopAt = now + NOTE_ATTACK + NOTE_DECAY_TIME_CONSTANT * 6;
    fundamental.start(now);
    overtone.start(now);
    fundamental.stop(stopAt);
    overtone.stop(stopAt);
    fundamental.onended = () => {
      fundamental.disconnect();
      overtone.disconnect();
      overtoneGain.disconnect();
      voiceGain.disconnect();
      filter.disconnect();
    };
  }

  private scheduleNextNote() {
    const delay =
      NOTE_MIN_GAP_MS + Math.random() * (NOTE_MAX_GAP_MS - NOTE_MIN_GAP_MS);
    this.noteTimer = setTimeout(() => {
      if (!this.playing) {
        this.noteTimer = null;
        return;
      }
      const ctx = this.ctx!;
      const now = ctx.currentTime;
      const freq = pickNoteFrequency();
      const velocity = 0.7 + Math.random() * 0.3;
      this.playNote(freq, velocity, now);

      // Occasionally add a soft harmony note (a third or fifth above) just
      // after the first, for a little texture without turning into a chord.
      if (Math.random() < 0.2) {
        const harmony = freq * (Math.random() < 0.5 ? 1.25 : 1.5);
        this.playNote(harmony, velocity * 0.6, now, 0.15);
      }

      this.scheduleNextNote();
    }, delay);
  }

  async start() {
    this.ensureGraph();
    const ctx = this.ctx!;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    this.playing = true;
    const now = ctx.currentTime;
    this.master!.gain.cancelScheduledValues(now);
    this.master!.gain.setValueAtTime(this.master!.gain.value, now);
    this.master!.gain.linearRampToValueAtTime(
      TARGET_VOLUME,
      now + SNAP_FADE_SECONDS
    );
    if (!this.noteTimer) {
      this.scheduleNextNote();
    }
  }

  stop() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    this.playing = false;
    const now = ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + SNAP_FADE_SECONDS);
    if (this.noteTimer) {
      clearTimeout(this.noteTimer);
      this.noteTimer = null;
    }
  }
}

let engine: PianoEngine | null = null;
function getEngine() {
  if (!engine) engine = new PianoEngine();
  return engine;
}

export function isBgmEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "on";
}

export async function setBgmEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  document.documentElement.dataset.bgm = enabled ? "on" : "off";
  if (enabled) {
    await getEngine().start();
  } else {
    getEngine().stop();
  }
}

// Autoplay policy blocks starting audio without a user gesture, so a
// previously-enabled preference can't just resume on page load. This arms a
// one-time listener that resumes playback on the visitor's next click or
// keypress anywhere on the page, so they don't have to revisit the profile
// page every visit.
export function armBgmAutoResume() {
  if (typeof window === "undefined" || !isBgmEnabled()) return;
  const resume = () => {
    setBgmEnabled(true);
    document.removeEventListener("pointerdown", resume);
    document.removeEventListener("keydown", resume);
  };
  document.addEventListener("pointerdown", resume, { once: true });
  document.addEventListener("keydown", resume, { once: true });
}

// A tiny rotating "playlist" of calm piano background music, synthesized
// entirely with the Web Audio API — there's no audio file to fetch, host,
// or license. This deliberately doesn't attempt to reproduce any real
// piece: transcribing a specific famous work accurately from memory isn't
// something I can do reliably (especially a virtuosic one), and getting it
// wrong would just sound broken. Instead these are a few short original
// melodic phrases in a calm, classical-piano-inspired style, each looped a
// few times before the engine moves on to the next.
const STORAGE_KEY = "book-log:bgm";

type NoteEvent = { freq: number; duration: number };

// Each phrase is a short original melody (not a transcription of any real
// composition), voiced with simple piano-like notes so they read as
// recognizably "a song" rather than ambient texture.
const PLAYLIST: readonly NoteEvent[][] = [
  // Piece 1 — D major, gentle rise and fall.
  [
    { freq: 293.66, duration: 1.1 }, // D4
    { freq: 369.99, duration: 1.1 }, // F#4
    { freq: 440.0, duration: 1.1 }, // A4
    { freq: 587.33, duration: 1.3 }, // D5
    { freq: 554.37, duration: 1.1 }, // C#5
    { freq: 440.0, duration: 1.1 }, // A4
    { freq: 369.99, duration: 1.1 }, // F#4
    { freq: 293.66, duration: 1.9 }, // D4, held
  ],
  // Piece 2 — F major, a little more wistful.
  [
    { freq: 349.23, duration: 1.1 }, // F4
    { freq: 440.0, duration: 1.0 }, // A4
    { freq: 523.25, duration: 1.2 }, // C5
    { freq: 440.0, duration: 1.0 }, // A4
    { freq: 466.16, duration: 1.1 }, // Bb4
    { freq: 392.0, duration: 1.1 }, // G4
    { freq: 349.23, duration: 1.1 }, // F4
    { freq: 261.63, duration: 1.9 }, // C4, held
  ],
  // Piece 3 — E minor, more contemplative.
  [
    { freq: 329.63, duration: 1.1 }, // E4
    { freq: 392.0, duration: 1.1 }, // G4
    { freq: 493.88, duration: 1.2 }, // B4
    { freq: 440.0, duration: 1.0 }, // A4
    { freq: 392.0, duration: 1.1 }, // G4
    { freq: 329.63, duration: 1.1 }, // E4
    { freq: 293.66, duration: 1.1 }, // D4
    { freq: 329.63, duration: 1.9 }, // E4, held
  ],
];

const REPEATS_PER_PIECE = 3;
const REPEAT_GAP_SECONDS = 1.0;
const PIECE_GAP_SECONDS = 2.5;
const NOTE_ATTACK = 0.012;
const NOTE_DECAY_TIME_CONSTANT = 0.9;
const TARGET_VOLUME = 0.85;
// Toggling should feel instant, not fade out over seconds — a very short
// ramp still avoids an audible click without reading as a "fade".
const SNAP_FADE_SECONDS = 0.02;

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
  private pieceIndex = 0;
  private repeatCount = 0;

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

  private playNote(freq: number, velocity: number, startAt: number) {
    const ctx = this.ctx!;

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
    voiceGain.gain.setValueAtTime(0, startAt);
    voiceGain.gain.linearRampToValueAtTime(peak, startAt + NOTE_ATTACK);
    voiceGain.gain.setTargetAtTime(
      0.0001,
      startAt + NOTE_ATTACK,
      NOTE_DECAY_TIME_CONSTANT
    );

    const stopAt = startAt + NOTE_ATTACK + NOTE_DECAY_TIME_CONSTANT * 6;
    fundamental.start(startAt);
    overtone.start(startAt);
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

  private playPhrase() {
    const ctx = this.ctx!;
    const phrase = PLAYLIST[this.pieceIndex];
    let t = ctx.currentTime + 0.05;
    for (const note of phrase) {
      this.playNote(note.freq, 0.75 + Math.random() * 0.2, t);
      t += note.duration;
    }

    const totalDuration = phrase.reduce((sum, note) => sum + note.duration, 0);
    const isLastRepeat = this.repeatCount + 1 >= REPEATS_PER_PIECE;
    const gap = isLastRepeat ? PIECE_GAP_SECONDS : REPEAT_GAP_SECONDS;

    this.noteTimer = setTimeout(() => {
      this.repeatCount++;
      if (this.repeatCount >= REPEATS_PER_PIECE) {
        this.repeatCount = 0;
        this.pieceIndex = (this.pieceIndex + 1) % PLAYLIST.length;
      }
      this.playPhrase();
    }, (totalDuration + gap) * 1000);
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
      this.playPhrase();
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

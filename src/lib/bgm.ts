// A small generative ambient pad, synthesized entirely with the Web Audio
// API — no audio file to fetch or license, and it can loop forever without
// a seam. Three sustained voices glide between slow-changing pentatonic
// chords, run through a lowpass filter with a slowly drifting cutoff.
const STORAGE_KEY = "book-log:bgm";

// C major pentatonic across a couple of octaves, so any combination stays
// consonant regardless of chord order.
const CHORDS: readonly [number, number, number][] = [
  [130.81, 196.0, 329.63], // C3 G3 E4
  [220.0, 261.63, 329.63], // A3 C4 E4
  [146.83, 220.0, 293.66], // D3 A3 D4
  [196.0, 293.66, 392.0], // G3 D4 G4
];
const CHORD_DURATION_MS = 9000;
const GLIDE_TIME_CONSTANT = 2.5;
const TARGET_VOLUME = 0.12;
const FADE_TIME_CONSTANT = 0.8;
const PANS = [-0.3, 0, 0.3];

class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private voices: { osc: OscillatorNode }[] = [];
  private chordTimer: ReturnType<typeof setTimeout> | null = null;
  private chordIndex = 0;
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

    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 1200;
    this.filter.Q.value = 0.7;
    this.filter.connect(this.master);

    // Slowly drifting cutoff so the pad isn't perfectly static.
    const filterLfo = ctx.createOscillator();
    filterLfo.frequency.value = 0.05;
    const filterLfoGain = ctx.createGain();
    filterLfoGain.gain.value = 400;
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(this.filter.frequency);
    filterLfo.start();

    const chord = CHORDS[0];
    this.voices = chord.map((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;

      // Gentle vibrato per voice, each at a slightly different rate so they
      // don't all wobble in lockstep.
      const vibrato = ctx.createOscillator();
      vibrato.frequency.value = 0.08 + i * 0.02;
      const vibratoGain = ctx.createGain();
      vibratoGain.gain.value = 4;
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.detune);
      vibrato.start();

      const gain = ctx.createGain();
      gain.gain.value = 1 / chord.length;

      const pan = ctx.createStereoPanner();
      pan.pan.value = PANS[i] ?? 0;

      osc.connect(gain);
      gain.connect(pan);
      pan.connect(this.filter!);
      osc.start();

      return { osc };
    });

    this.scheduleNextChord();
  }

  private scheduleNextChord() {
    this.chordTimer = setTimeout(() => {
      this.chordIndex = (this.chordIndex + 1) % CHORDS.length;
      const chord = CHORDS[this.chordIndex];
      const ctx = this.ctx!;
      this.voices.forEach((voice, i) => {
        voice.osc.frequency.setTargetAtTime(
          chord[i],
          ctx.currentTime,
          GLIDE_TIME_CONSTANT
        );
      });
      this.scheduleNextChord();
    }, CHORD_DURATION_MS);
  }

  async start() {
    this.ensureGraph();
    const ctx = this.ctx!;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    this.master!.gain.cancelScheduledValues(ctx.currentTime);
    this.master!.gain.setTargetAtTime(
      TARGET_VOLUME,
      ctx.currentTime,
      FADE_TIME_CONSTANT
    );
    this.playing = true;
  }

  stop() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setTargetAtTime(0, ctx.currentTime, FADE_TIME_CONSTANT);
    this.playing = false;
  }
}

let engine: AmbientEngine | null = null;
function getEngine() {
  if (!engine) engine = new AmbientEngine();
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

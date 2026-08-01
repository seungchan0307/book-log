// Background music: cycles through real recordings placed in public/audio.
// Add more file paths to TRACKS as more are dropped in and they'll be
// folded into the rotation automatically. Playback is a plain
// HTMLAudioElement — play()/pause() are inherently instant (no fade
// needed, unlike the earlier synthesized version), and browsers apply the
// same autoplay-gesture rules to it as anything else, handled the same way
// via armBgmAutoResume.
const STORAGE_KEY = "book-log:bgm";
const VOLUME = 0.18;

// Public-domain recordings the user sourced themselves (e.g. from
// Wikimedia Commons / Musopen) and placed under public/audio.
const TRACKS = ["/audio/Satie_Gymnopedie_01.mp3"];

class Player {
  private audio: HTMLAudioElement | null = null;
  private trackIndex = 0;

  private ensureAudio(): HTMLAudioElement {
    if (this.audio) return this.audio;
    const audio = new Audio();
    audio.volume = VOLUME;
    audio.loop = TRACKS.length === 1;
    if (TRACKS.length > 1) {
      audio.addEventListener("ended", () => {
        this.trackIndex = (this.trackIndex + 1) % TRACKS.length;
        audio.src = TRACKS[this.trackIndex];
        void audio.play();
      });
    }
    audio.src = TRACKS[this.trackIndex];
    this.audio = audio;
    return audio;
  }

  async play() {
    await this.ensureAudio().play();
  }

  pause() {
    this.audio?.pause();
  }
}

let player: Player | null = null;
function getPlayer() {
  if (!player) player = new Player();
  return player;
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
    try {
      await getPlayer().play();
    } catch {
      // Blocked by autoplay policy (no user gesture yet) — armBgmAutoResume
      // retries on the visitor's next click or keypress.
    }
  } else {
    getPlayer().pause();
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

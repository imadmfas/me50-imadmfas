import { Howl } from 'howler';
import { useSettingsStore } from '../store/useSettingsStore';

export type SfxName =
  | 'key' | 'correct' | 'wrong' | 'wordComplete' | 'hint'
  | 'opponentScored' | 'tick' | 'matchFound' | 'victory' | 'defeat';

const SFX_FILES: Record<SfxName, string> = {
  key: '/audio/key.wav',
  correct: '/audio/correct.wav',
  wrong: '/audio/wrong.wav',
  wordComplete: '/audio/wordComplete.wav',
  hint: '/audio/hint.wav',
  opponentScored: '/audio/opponentScored.wav',
  tick: '/audio/tick.wav',
  matchFound: '/audio/matchFound.wav',
  victory: '/audio/victory.wav',
  defeat: '/audio/defeat.wav',
};

class AudioMixer {
  private howls = new Map<SfxName, Howl>();
  private unlocked = false;

  private get(name: SfxName): Howl {
    let h = this.howls.get(name);
    if (!h) {
      h = new Howl({ src: [SFX_FILES[name]], preload: true });
      this.howls.set(name, h);
    }
    return h;
  }

  /** Must be called from within a user-gesture handler (browser autoplay policy). */
  unlock() {
    this.unlocked = true;
  }

  play(name: SfxName, { pitchVariance = 0 }: { pitchVariance?: number } = {}) {
    if (!this.unlocked) return;
    const { muted, masterVolume, sfxVolume } = useSettingsStore.getState();
    if (muted) return;
    const howl = this.get(name);
    const id = howl.play();
    howl.volume(masterVolume * sfxVolume, id);
    if (pitchVariance > 0) {
      const rate = 1 + (Math.random() * 2 - 1) * pitchVariance;
      howl.rate(rate, id);
    }
  }
}

export const audioMixer = new AudioMixer();

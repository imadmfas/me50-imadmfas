// Generates short, self-synthesized WAV SFX (sine/triangle tones with a
// simple attack-decay envelope). No external audio assets, no licensing
// questions — see ASSETS.md. Run: node scripts/generate-sfx.mjs
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 44100;
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');

function envelope(t, duration, attack = 0.01, release = 0.08) {
  if (t < attack) return t / attack;
  const releaseStart = duration - release;
  if (t > releaseStart) return Math.max(0, 1 - (t - releaseStart) / release);
  return 1;
}

/** notes: [{freq, start, duration, wave}] rendered additively into one buffer of `totalDuration` seconds. */
function synth(totalDuration, notes) {
  const numSamples = Math.floor(SAMPLE_RATE * totalDuration);
  const samples = new Float32Array(numSamples);
  for (const note of notes) {
    const wave = note.wave ?? 'sine';
    const startSample = Math.floor(note.start * SAMPLE_RATE);
    const noteSamples = Math.floor(note.duration * SAMPLE_RATE);
    for (let i = 0; i < noteSamples; i++) {
      const idx = startSample + i;
      if (idx >= numSamples) break;
      const t = i / SAMPLE_RATE;
      const phase = 2 * Math.PI * note.freq * t;
      let v = wave === 'sine' ? Math.sin(phase) : wave === 'triangle' ? (2 / Math.PI) * Math.asin(Math.sin(phase)) : Math.sign(Math.sin(phase));
      v *= envelope(t, note.duration) * (note.gain ?? 0.5);
      samples[idx] += v;
    }
  }
  // Soft clip to avoid harsh digital clipping when notes overlap.
  for (let i = 0; i < samples.length; i++) samples[i] = Math.tanh(samples[i]);
  return samples;
}

function writeWav(filename, samples) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  writeFileSync(path.join(outDir, filename), buffer);
  console.log('wrote', filename);
}

// Key tap — soft short click, pitch varies slightly per call at playback time (see AudioMixer).
writeWav('key.wav', synth(0.06, [{ freq: 880, start: 0, duration: 0.05, wave: 'triangle', gain: 0.35 }]));

// Correct letter — bright short blip.
writeWav('correct.wav', synth(0.15, [
  { freq: 660, start: 0, duration: 0.08, gain: 0.4 },
  { freq: 990, start: 0.05, duration: 0.1, gain: 0.35 },
]));

// Wrong — muted low thud, no punitive noise.
writeWav('wrong.wav', synth(0.2, [{ freq: 160, start: 0, duration: 0.18, wave: 'triangle', gain: 0.4 }]));

// Word complete — rising three-note arpeggio.
writeWav('wordComplete.wav', synth(0.5, [
  { freq: 523.25, start: 0, duration: 0.16, gain: 0.4 },
  { freq: 659.25, start: 0.12, duration: 0.16, gain: 0.4 },
  { freq: 783.99, start: 0.24, duration: 0.24, gain: 0.45 },
]));

// Hint — soft chime.
writeWav('hint.wav', synth(0.3, [{ freq: 987.77, start: 0, duration: 0.28, gain: 0.3 }]));

// Opponent scored — distinct, quieter, slightly detuned pair.
writeWav('opponentScored.wav', synth(0.22, [
  { freq: 440, start: 0, duration: 0.2, gain: 0.22 },
  { freq: 554.37, start: 0.02, duration: 0.18, gain: 0.18 },
]));

// Countdown tick — final 10 seconds.
writeWav('tick.wav', synth(0.08, [{ freq: 1200, start: 0, duration: 0.05, wave: 'square', gain: 0.15 }]));

// Match found — impact swell.
writeWav('matchFound.wav', synth(0.9, [
  { freq: 220, start: 0, duration: 0.5, gain: 0.3 },
  { freq: 440, start: 0.05, duration: 0.5, gain: 0.3 },
  { freq: 880, start: 0.1, duration: 0.7, gain: 0.35 },
]));

// Victory — ascending major triad + octave.
writeWav('victory.wav', synth(1.2, [
  { freq: 523.25, start: 0, duration: 0.3, gain: 0.4 },
  { freq: 659.25, start: 0.15, duration: 0.3, gain: 0.4 },
  { freq: 783.99, start: 0.3, duration: 0.3, gain: 0.4 },
  { freq: 1046.5, start: 0.45, duration: 0.6, gain: 0.45 },
]));

// Defeat — descending minor, softer.
writeWav('defeat.wav', synth(1.0, [
  { freq: 440, start: 0, duration: 0.35, gain: 0.35 },
  { freq: 349.23, start: 0.25, duration: 0.35, gain: 0.3 },
  { freq: 293.66, start: 0.5, duration: 0.5, gain: 0.3 },
]));

console.log('SFX generation complete.');

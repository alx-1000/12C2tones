import * as Tone from 'tone';
import type { Chord } from '../music/chords.ts';

export type Instrument = 'synth' | 'piano';

export class AudioEngine {
  private instrument: Instrument = 'synth';
  private synth: Tone.PolySynth | null = null;
  private piano: Tone.PolySynth | null = null;
  private output: Tone.Volume;

  constructor() {
    this.output = new Tone.Volume(-10).toDestination();
  }

  async start(): Promise<void> {
    await Tone.start();
    this.ensureSynth();
    this.ensurePiano();
  }

  setInstrument(instrument: Instrument): void {
    this.instrument = instrument;
    if (instrument === 'synth') this.ensureSynth();
    else this.ensurePiano();
  }

  triggerChord(chord: Chord, duration: number): void {
    const voice = this.instrument === 'synth' ? this.ensureSynth() : this.ensurePiano();
    const now = Tone.now();
    voice.triggerAttackRelease([chord.lowFrequency, chord.highFrequency], Math.min(duration * 0.78, 1.6), now);
  }

  stop(): void {
    this.synth?.releaseAll();
    this.piano?.releaseAll();
  }

  dispose(): void {
    this.stop();
    this.synth?.dispose();
    this.piano?.dispose();
    this.output.dispose();
  }

  private ensureSynth(): Tone.PolySynth {
    if (!this.synth) {
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.015, decay: 0.18, sustain: 0.35, release: 0.45 },
        volume: -5,
      }).connect(this.output);
    }
    return this.synth;
  }

  private ensurePiano(): Tone.PolySynth {
    if (!this.piano) {
      this.piano = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.008, decay: 0.36, sustain: 0.08, release: 0.7 },
        volume: -7,
      }).connect(this.output);
    }
    return this.piano;
  }
}

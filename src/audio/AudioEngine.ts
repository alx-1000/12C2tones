import * as Tone from 'tone';
import type { Chord } from '../music/chords.ts';

export type Instrument = 'synth' | 'piano' | 'sine' | 'electric';

export class AudioEngine {
  private instrument: Instrument = 'synth';
  private synth: Tone.PolySynth | null = null;
  private piano: Tone.PolySynth | null = null;
  private sine: Tone.PolySynth | null = null;
  private electric: Tone.PolySynth | null = null;
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
    this.ensureVoice(instrument);
  }

  triggerChord(chord: Chord, duration: number): void {
    const voice = this.ensureVoice(this.instrument);
    const now = Tone.now();
    voice.triggerAttackRelease([chord.lowFrequency, chord.highFrequency], Math.min(duration * 0.78, 1.6), now);
  }

  stop(): void {
    this.synth?.releaseAll();
    this.piano?.releaseAll();
    this.sine?.releaseAll();
    this.electric?.releaseAll();
  }

  dispose(): void {
    this.stop();
    this.synth?.dispose();
    this.piano?.dispose();
    this.sine?.dispose();
    this.electric?.dispose();
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
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.004, decay: 0.48, sustain: 0.08, release: 0.9 },
        volume: -6,
      }).connect(this.output);
    }
    return this.piano;
  }

  private ensureSine(): Tone.PolySynth {
    if (!this.sine) {
      this.sine = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.18, sustain: 0.7, release: 0.5 },
        volume: -8,
      }).connect(this.output);
    }
    return this.sine;
  }

  private ensureElectric(): Tone.PolySynth {
    if (!this.electric) {
      this.electric = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3.01,
        modulationIndex: 10,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.5, sustain: 0.25, release: 0.8 },
        modulation: { type: 'sine' },
        modulationEnvelope: { attack: 0.01, decay: 0.25, sustain: 0.15, release: 0.5 },
        volume: -8,
      }).connect(this.output);
    }
    return this.electric;
  }

  private ensureVoice(instrument: Instrument): Tone.PolySynth {
    if (instrument === 'piano') return this.ensurePiano();
    if (instrument === 'sine') return this.ensureSine();
    if (instrument === 'electric') return this.ensureElectric();
    return this.ensureSynth();
  }
}

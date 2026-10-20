import type { AudioEngine } from '../audio/AudioEngine.ts';
import type { Chord } from '../music/chords.ts';
import type { SceneManager } from '../visualizer/SceneManager.ts';

export type PlaybackState = 'ready' | 'playing' | 'paused' | 'complete';

export class PlaybackController {
  private queue: Chord[];
  private position = 0;
  private timer: number | null = null;
  private state: PlaybackState = 'ready';
  private speed = 1;
  private seed = 120;
  private currentChord: Chord | null = null;
  private onStateChange: (state: PlaybackState, position: number, chord: Chord | null) => void = () => undefined;

  constructor(
    private readonly chords: Chord[],
    private readonly audio: AudioEngine,
    private readonly scene: SceneManager,
  ) {
    this.queue = this.shuffle(chords);
  }

  setStateListener(listener: (state: PlaybackState, position: number, chord: Chord | null) => void): void {
    this.onStateChange = listener;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  setSeed(seed: number): void {
    if (!Number.isFinite(seed)) return;
    this.seed = Math.abs(Math.trunc(seed)) || 1;
    if (this.state === 'ready' || this.state === 'complete') this.queue = this.shuffle(this.chords);
  }

  async start(): Promise<boolean> {
    if (this.state === 'playing' || this.state === 'complete') return false;
    await this.audio.start();
    this.state = 'playing';
    this.onStateChange(this.state, this.position, this.currentChord);
    this.scheduleNext();
    return true;
  }

  toggle(): void {
    if (this.state === 'playing') this.pause();
    else void this.start();
  }

  pause(): void {
    if (this.state !== 'playing') return;
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
    this.state = 'paused';
    this.onStateChange(this.state, this.position, this.currentChord);
  }

  reset(): void {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
    this.audio.stop();
    this.position = 0;
    this.state = 'ready';
    this.currentChord = null;
    this.queue = this.shuffle(this.chords);
    this.scene.reset();
    this.onStateChange(this.state, this.position, this.currentChord);
  }

  dispose(): void {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
  }

  private scheduleNext(): void {
    if (this.position >= this.queue.length) {
      this.state = 'complete';
      this.onStateChange(this.state, this.position, this.currentChord);
      return;
    }
    const chord = this.queue[this.position];
    this.currentChord = chord;
    const intervalSeconds = 1 / this.speed;
    this.audio.triggerChord(chord, intervalSeconds);
    const orderProgress = this.position / (this.queue.length - 1);
    const brightness = 0.08 + orderProgress * 0.88;
    this.scene.activate(chord, brightness);
    this.position += 1;
    this.onStateChange(this.state, this.position, this.currentChord);
    this.timer = window.setTimeout(() => this.scheduleNext(), intervalSeconds * 1000);
  }

  private shuffle(items: Chord[]): Chord[] {
    const result = [...items];
    let randomState = this.seed >>> 0;
    for (let index = result.length - 1; index > 0; index -= 1) {
      randomState = (1664525 * randomState + 1013904223) >>> 0;
      const swapIndex = Math.floor((randomState / 4294967296) * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }
}

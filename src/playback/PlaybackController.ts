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
  private onStateChange: (state: PlaybackState, position: number) => void = () => undefined;

  constructor(
    private readonly chords: Chord[],
    private readonly audio: AudioEngine,
    private readonly scene: SceneManager,
  ) {
    this.queue = this.shuffle(chords);
  }

  setStateListener(listener: (state: PlaybackState, position: number) => void): void {
    this.onStateChange = listener;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  async start(): Promise<boolean> {
    if (this.state === 'playing' || this.state === 'complete') return false;
    await this.audio.start();
    this.state = 'playing';
    this.onStateChange(this.state, this.position);
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
    this.onStateChange(this.state, this.position);
  }

  reset(): void {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
    this.audio.stop();
    this.position = 0;
    this.state = 'ready';
    this.queue = this.shuffle(this.chords);
    this.scene.reset();
    this.onStateChange(this.state, this.position);
  }

  dispose(): void {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
  }

  private scheduleNext(): void {
    if (this.position >= this.queue.length) {
      this.state = 'complete';
      this.onStateChange(this.state, this.position);
      return;
    }
    const chord = this.queue[this.position];
    const intervalSeconds = 1 / this.speed;
    this.audio.triggerChord(chord, intervalSeconds);
    const orderProgress = this.position / (this.queue.length - 1);
    const brightness = 0.08 + orderProgress * 0.88;
    this.scene.activate(chord, brightness);
    this.position += 1;
    this.onStateChange(this.state, this.position);
    this.timer = window.setTimeout(() => this.scheduleNext(), intervalSeconds * 1000);
  }

  private shuffle(items: Chord[]): Chord[] {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }
}

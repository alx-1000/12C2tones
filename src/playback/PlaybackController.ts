import type { AudioEngine } from '../audio/AudioEngine.ts';
import type { Chord } from '../music/chords.ts';
import type { SceneManager } from '../visualizer/SceneManager.ts';

export type PlaybackState = 'ready' | 'playing' | 'complete';

export class PlaybackController {
  private queue: Chord[];
  private position = 0;
  private timer: number | null = null;
  private state: PlaybackState = 'ready';
  private intervalSeconds = 1;
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

  setInterval(seconds: number): void {
    this.intervalSeconds = seconds;
  }

  async start(): Promise<boolean> {
    if (this.state !== 'ready') return false;
    await this.audio.start();
    this.state = 'playing';
    this.onStateChange(this.state, this.position);
    this.scheduleNext();
    return true;
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
    this.audio.triggerChord(chord, this.intervalSeconds);
    this.scene.activate(chord);
    this.position += 1;
    this.onStateChange(this.state, this.position);
    this.timer = window.setTimeout(() => this.scheduleNext(), this.intervalSeconds * 1000);
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

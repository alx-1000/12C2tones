import type { Instrument } from '../audio/AudioEngine.ts';
import { intervalName, noteName, type Chord } from '../music/chords.ts';
import type { PlaybackState } from '../playback/PlaybackController.ts';

export interface ControlHandlers {
  onStart: () => void;
  onReset: () => void;
  onInstrument: (instrument: Instrument) => void;
  onSpeed: (speed: number) => void;
  onSeed: (seed: number) => void;
  onResetView: () => void;
}

export class Controls {
  private readonly startButton: HTMLButtonElement;
  private readonly progress: HTMLElement;
  private readonly speedValue: HTMLElement;
  private readonly seedValue: HTMLElement;
  private readonly currentNotes: HTMLElement;
  private readonly currentInterval: HTMLElement;
  private readonly sequenceBody: HTMLTableSectionElement;

  constructor(root: HTMLElement, handlers: ControlHandlers) {
    root.innerHTML = `
      <div class="brand"><span class="brand-title">12C2 tones</span></div>
      <div class="status"><span class="status-dot"></span><span id="status-label">READY</span><span id="progress">0 / 66</span></div>
      <div class="current-sound" aria-live="polite"><span id="current-notes"></span><span id="current-interval"><span id="current-degree"></span><span id="current-semitones"></span></span></div>
      <aside class="sequence-panel" aria-label="Played sequence">
        <div class="sequence-title">SEQUENCE</div>
        <table><thead><tr><th>#</th><th>PAIR</th><th>INT.</th></tr></thead><tbody id="sequence-body"></tbody></table>
      </aside>
      <div class="controls-panel">
        <div class="control-group">
          <span class="control-label">VOICE</span>
          <div class="segmented" role="group" aria-label="Voice">
            <button class="segment active" data-instrument="synth">SYNTH</button>
            <button class="segment" data-instrument="piano">PIANO</button>
            <button class="segment" data-instrument="sine">SINE</button>
            <button class="segment" data-instrument="electric">E-PIANO</button>
          </div>
        </div>
        <div class="control-group seed-group">
          <label class="control-label" for="seed">SEED <output id="seed-value">120</output></label>
          <input id="seed" type="range" min="1" max="10000" step="1" value="120" />
        </div>
        <div class="control-group speed-group">
          <label class="control-label" for="speed">SPEED <output id="speed-value">1.00x</output></label>
          <input id="speed" type="range" min="0.5" max="10" step="0.05" value="1" />
        </div>
        <div class="actions">
          <button class="icon-button primary" id="start" aria-label="Play" title="Play"><span class="play-icon"></span></button>
          <button class="icon-button" id="reset" aria-label="Reset" title="Reset"><span class="reset-icon">↺</span></button>
          <button class="icon-button" id="reset-view" aria-label="Reset view" title="Reset view"><span class="view-reset-icon">⌖</span></button>
        </div>
      </div>
      <div class="footer-note">66 PAIRS / 12 PITCHES</div>
    `;

    this.startButton = root.querySelector('#start') as HTMLButtonElement;
    this.progress = root.querySelector('#progress') as HTMLElement;
    this.speedValue = root.querySelector('#speed-value') as HTMLElement;
    this.seedValue = root.querySelector('#seed-value') as HTMLElement;
    this.currentNotes = root.querySelector('#current-notes') as HTMLElement;
    this.currentInterval = root.querySelector('#current-interval') as HTMLElement;
    this.sequenceBody = root.querySelector('#sequence-body') as HTMLTableSectionElement;
    this.startButton.addEventListener('click', handlers.onStart);
    (root.querySelector('#reset') as HTMLButtonElement).addEventListener('click', handlers.onReset);
    (root.querySelector('#reset-view') as HTMLButtonElement).addEventListener('click', handlers.onResetView);
    (root.querySelector('#speed') as HTMLInputElement).addEventListener('input', (event) => {
      const speed = Number((event.target as HTMLInputElement).value);
      this.speedValue.textContent = `${speed.toFixed(2)}x`;
      handlers.onSpeed(speed);
    });
    (root.querySelector('#seed') as HTMLInputElement).addEventListener('input', (event) => {
      const seed = Number((event.target as HTMLInputElement).value);
      this.seedValue.textContent = `${seed}`;
      handlers.onSeed(seed);
    });
    root.querySelectorAll<HTMLButtonElement>('[data-instrument]').forEach((button) => {
      button.addEventListener('click', () => {
        root.querySelectorAll('.segment').forEach((candidate) => candidate.classList.remove('active'));
        button.classList.add('active');
        handlers.onInstrument(button.dataset.instrument as Instrument);
      });
    });
  }

  update(state: PlaybackState, position: number, chord: Chord | null): void {
    this.progress.textContent = `${position} / 66`;
    if (chord) {
      this.currentNotes.textContent = `${noteName(chord.lowIndex)}4 + ${noteName(chord.highIndex)}4`;
      const semitones = chord.highIndex - chord.lowIndex;
      this.currentInterval.querySelector('#current-degree')!.textContent = intervalName(semitones);
      this.currentInterval.querySelector('#current-semitones')!.textContent = `${semitones} SEMITONES`;
      if (position > this.sequenceBody.rows.length) {
        const row = this.sequenceBody.insertRow();
        row.insertCell().textContent = `${position}`.padStart(2, '0');
        row.insertCell().textContent = `${noteName(chord.lowIndex)}4 + ${noteName(chord.highIndex)}4`;
        row.insertCell().textContent = intervalName(semitones);
        const sequencePanel = this.sequenceBody.closest<HTMLElement>('.sequence-panel');
        sequencePanel?.scrollTo({ top: sequencePanel.scrollHeight, behavior: 'smooth' });
      }
    } else {
      this.currentNotes.textContent = '';
      this.currentInterval.querySelector('#current-degree')!.textContent = '';
      this.currentInterval.querySelector('#current-semitones')!.textContent = '';
      this.sequenceBody.replaceChildren();
    }
    const status = document.querySelector('#status-label');
    if (status) {
      status.textContent = state === 'playing' ? 'PLAYING'
        : state === 'paused' ? 'PAUSED'
          : state === 'complete' ? 'COMPLETE' : 'READY';
    }
    this.startButton.disabled = state === 'complete';
    this.startButton.classList.toggle('is-playing', state === 'playing');
    const isPlaying = state === 'playing';
    this.startButton.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    this.startButton.title = isPlaying ? 'Pause' : 'Play';
    this.startButton.innerHTML = isPlaying ? '<span class="pause-icon"></span>' : '<span class="play-icon"></span>';
  }
}

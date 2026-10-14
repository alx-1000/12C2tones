import './style.css';
import { AudioEngine, type Instrument } from './audio/AudioEngine.ts';
import { createChords } from './music/chords.ts';
import { PlaybackController } from './playback/PlaybackController.ts';
import { SceneManager } from './visualizer/SceneManager.ts';
import { Controls } from './ui/Controls.ts';

const chords = createChords();
const viewport = document.querySelector<HTMLElement>('#viewport');
const ui = document.querySelector<HTMLElement>('#ui');
if (!viewport || !ui) throw new Error('Required application elements are missing');

const scene = new SceneManager(viewport, chords);
const audio = new AudioEngine();
const playback = new PlaybackController(chords, audio, scene);
const controls = new Controls(ui, {
  onStart: () => playback.toggle(),
  onReset: () => playback.reset(),
  onInstrument: (instrument: Instrument) => audio.setInstrument(instrument),
  onSpeed: (speed: number) => playback.setSpeed(speed),
  onResetView: () => scene.resetView(),
});
playback.setStateListener((state, position) => controls.update(state, position));

window.addEventListener('beforeunload', () => {
  playback.dispose();
  audio.dispose();
  scene.dispose();
});

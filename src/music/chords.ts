export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export interface Chord {
  id: string;
  lowIndex: number;
  highIndex: number;
  lowFrequency: number;
  highFrequency: number;
  ratio: number;
  height: number;
  gridX: number;
  gridY: number;
}

const A4_INDEX = 9;
const A4_FREQUENCY = 440;
export const HEIGHT_SCALE = 5.5;

export function frequencyForIndex(index: number): number {
  return A4_FREQUENCY * 2 ** ((index - A4_INDEX) / 12);
}

export function getChordHeight(ratio: number): number {
  return HEIGHT_SCALE * ratio;
}

export function createChords(): Chord[] {
  const chords: Chord[] = [];
  for (let lowIndex = 0; lowIndex < 12; lowIndex += 1) {
    for (let highIndex = lowIndex + 1; highIndex < 12; highIndex += 1) {
      const lowFrequency = frequencyForIndex(lowIndex);
      const highFrequency = frequencyForIndex(highIndex);
      const ratio = highFrequency / lowFrequency;
      chords.push({
        id: `${lowIndex}-${highIndex}`,
        lowIndex,
        highIndex,
        lowFrequency,
        highFrequency,
        ratio,
        height: getChordHeight(ratio),
        gridX: highIndex,
        gridY: lowIndex,
      });
    }
  }
  if (chords.length !== 66) throw new Error(`Expected 66 chords, received ${chords.length}`);
  return chords;
}

export function noteName(index: number): string {
  return NOTE_NAMES[index] ?? '?';
}

export function intervalName(semitones: number): string {
  const names: Record<number, string> = {
    1: 'm2',
    2: 'M2',
    3: 'm3',
    4: 'M3',
    5: 'P4',
    6: 'TT',
    7: 'P5',
    8: 'm6',
    9: 'M6',
    10: 'm7',
    11: 'M7',
  };
  return names[semitones] ?? '?';
}

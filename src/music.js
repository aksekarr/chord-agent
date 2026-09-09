export const BPM = 90;
export const TEMPO_MIN = 60;
export const TEMPO_MAX = 140;
export function beatSecondsFor(bpm = BPM) {
  if (!Number.isInteger(bpm) || bpm < TEMPO_MIN || bpm > TEMPO_MAX) {
    throw new Error('Tempo must be a whole number from 60 to 140 BPM.');
  }
  return 60 / bpm;
}
export const BEAT_SECONDS = beatSecondsFor();
export const BEATS_PER_BAR = 4;
export const TIME_SIGNATURE = '4/4';
export const STRUCTURE = [0, 1, 0, 0, 1, 1, 0, 0, 2, 1, 0, 2];
export const DEGREES = ['I', 'IV', 'V'];
const ROOTS = {
  E: [40, 45, 47],
  A: [45, 50, 40],
  C: [48, 53, 55],
  B: [47, 40, 42],
  G: [43, 48, 50],
  D: [50, 43, 45],
};
export const AVAILABLE_KEYS = Object.keys(ROOTS);
export const DEFAULT_KEY = 'A';
export const LOOP_BEATS = STRUCTURE.length * BEATS_PER_BAR;
const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'B♭', 'B'];
// Clear this list to restore the original shuffle everywhere.
const VARIATION_BARS = [3, 4, 6, 8, 9, 10]; // One-based bar numbers.
// Each beat repeats its pair twice; fifth on beats 1/3, sixth on beats 2/4.
export function chordsFor(key, beatInBar = 0, barIndex = 0) {
  if (!AVAILABLE_KEYS.includes(key))
    throw new Error(`Choose one of: ${AVAILABLE_KEYS.join(', ')}.`);
  return ROOTS[key].map((root) => {
    const intervals = VARIATION_BARS.includes(barIndex + 1)
      ? [7, 9, 10, 9]
      : [7, 9, 7, 9];
    const notes = [root, root + intervals[beatInBar % BEATS_PER_BAR]];
    return {
      name: NAMES[root % 12],
      notes,
      tones: notes.map((note) => NAMES[note % 12]),
    };
  });
}
// Triplet shuffle, with a fixed 20 ms delay on every offbeat only.
export const OFFBEAT_DELAY_SECONDS = 0.02;
export function offbeatFor(bpm = BPM) {
  return 2 / 3 + OFFBEAT_DELAY_SECONDS / beatSecondsFor(bpm);
}
export const STRUM_PATTERN = [
  'down',
  'up',
  'down',
  'up',
  'down',
  'up',
  'down',
  'up',
];
export function eventsFor(key, bpm = BPM) {
  const beatSeconds = beatSecondsFor(bpm);
  const offbeat = offbeatFor(bpm);
  const hits = Array.from({ length: BEATS_PER_BAR }, (_, beat) => [
    beat,
    beat + offbeat,
  ]).flat();
  return STRUCTURE.flatMap((degree, bar) =>
    hits.map((hit, index) => ({
      beat: bar * BEATS_PER_BAR + hit,
      bar,
      chord: chordsFor(key, Math.floor(index / 2), bar)[degree],
      direction: STRUM_PATTERN[index],
      velocity: index % 2 === 0 ? 0.85 : 0.48,
      // Downstrokes ring to the upstroke; upstrokes release 30 ms before the next beat.
      duration:
        ((hits[index + 1] ?? BEATS_PER_BAR) - hit) * beatSeconds -
        (index % 2 === 1 ? 0.03 : 0),
    })),
  );
}

import { initThemes, updateThemeCharacters } from './theme.js?v=bedroom-1';
import {
  chordsFor,
  STRUCTURE,
  DEGREES,
  offbeatFor,
  TEMPO_MIN,
  TEMPO_MAX,
  AVAILABLE_KEYS,
  DEFAULT_KEY,
  BPM,
  TIME_SIGNATURE,
} from './music.js?v=bedroom-1';
import { BluesPlayer } from './audio.js?v=bedroom-1';
const $ = (id) => document.getElementById(id);
const player = new BluesPlayer();
initThemes();
let frame,
  request = 0;
let selectedTempo = BPM;
let playingTempo = BPM;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
// Rendering consumes the public timing snapshot, never AudioContext internals.
function animateGuitarist(timing) {
  if (!timing || reduceMotion.matches) return;
  $('guitarist').dataset.pose =
    timing.phase < 0.25
      ? 'down'
      : timing.phase < offbeatFor(playingTempo)
        ? 'rest'
        : 'up';
}
function renderBars() {
  const chords = chordsFor($('key').value);
  $('bars').innerHTML = STRUCTURE.map(
    (degree, index) =>
      `<div class="bar"><span class="number">${String(index + 1).padStart(2, '0')}</span><strong>${chords[degree].name}</strong><span class="degree">${DEGREES[degree]}</span></div>`,
  ).join('');
  display(null);
}
function display(position) {
  const chord = chordsFor(
    $('key').value,
    position?.beat ?? 0,
    position?.bar ?? 0,
  )[STRUCTURE[position?.bar ?? 0]];
  $('chord').textContent = chord.name;
  $('tones').textContent = chord.tones.join(' · ');
  $('position').textContent = position
    ? `Bar ${position.bar + 1} of ${STRUCTURE.length} · Loop ${position.loop}`
    : 'Ready to play';
  [...$('bars').children].forEach((bar, index) =>
    bar.classList.toggle('active', index === position?.bar),
  );
  [...$('beats').children].forEach((beat, index) =>
    beat.classList.toggle('active', index === position?.beat),
  );
}
function tick() {
  const timing = player.timing();
  display(timing);
  animateGuitarist(timing);
  updateThemeCharacters(timing);
  frame = requestAnimationFrame(tick);
}
async function play() {
  const current = ++request;
  cancelAnimationFrame(frame);
  $('play').disabled = true;
  $('stop').disabled = false;
  try {
    const tempo = selectedTempo;
    await player.start($('key').value, tempo);
    if (current !== request) return;
    playingTempo = tempo;
    $('status').textContent =
      'Playing · Blues shuffle · D U D U D U D U · continuous loop';
    tick();
  } catch (error) {
    if (current !== request) return;
    stop();
    $('status').textContent = 'Audio could not start. Press Play to retry.';
    console.error(error);
  }
}
function stop() {
  request++;
  player.stop();
  cancelAnimationFrame(frame);
  display(null);
  updateThemeCharacters(null);
  $('play').disabled = false;
  $('stop').disabled = true;
  $('status').textContent = 'Stopped · press Play to start at bar 1';
}
$('play').addEventListener('click', play);
$('stop').addEventListener('click', stop);
$('key').addEventListener('change', () => {
  const active = !$('stop').disabled;
  renderBars();
  if (active) play();
});
window.addEventListener('pagehide', stop);
$('key').replaceChildren(
  ...AVAILABLE_KEYS.map(
    (key) => new Option(key, key, false, key === DEFAULT_KEY),
  ),
);
$('tempo-slider').min = TEMPO_MIN;
$('tempo-slider').max = TEMPO_MAX;
$('tempo-slider').value = BPM;
$('tempo').textContent = BPM;
$('tempo-slider').addEventListener('input', () => {
  $('tempo').textContent = $('tempo-slider').value;
});
$('tempo-slider').addEventListener('change', () => {
  const tempo = Number($('tempo-slider').value);
  if (tempo === selectedTempo) return;
  selectedTempo = tempo;
  if (!$('stop').disabled) play();
});
$('time-signature').textContent = TIME_SIGNATURE;
renderBars();

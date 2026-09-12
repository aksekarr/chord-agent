import {
  BPM,
  beatSecondsFor,
  BEATS_PER_BAR,
  LOOP_BEATS,
  STRUCTURE,
  eventsFor,
} from './music.js?v=volume-1';
export const STRUM_SPREAD_SECONDS = 0.025; // Full roll, independent of chord size.
export const DEFAULT_OUTPUT_LEVEL = 0.35;
export class BluesPlayer {
  constructor(createContext = () => new AudioContext()) {
    this.createContext = createContext;
    this.playing = false;
    this.version = 0;
    this.volume = DEFAULT_OUTPUT_LEVEL;
  }
  async start(key, bpm = BPM, { mode = 'blues', metronome = false } = {}) {
    const beatSeconds = beatSecondsFor(bpm);
    const events = mode === 'blues' ? eventsFor(key, bpm) : [];
    this.stop();
    const version = this.version;
    this.context ||= this.createContext();
    await this.context.resume();
    if (version !== this.version) return;
    this.master = this.context.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.context.destination);
    this.events = events;
    this.mode = mode;
    this.metronome = mode === 'metronome' || metronome;
    this.bpm = bpm;
    this.beatSeconds = beatSeconds;
    this.index = 0;
    this.clickIndex = 0;
    this.cycle = 0;
    this.startedAt = this.context.currentTime + 0.08;
    this.playing = true;
    this.schedule();
    this.timer = setInterval(() => this.schedule(), 25);
  }
  schedule() {
    while (this.playing && this.events.length) {
      const event = this.events[this.index];
      const time =
        this.startedAt +
        (this.cycle * LOOP_BEATS + event.beat) * this.beatSeconds;
      if (time > this.context.currentTime + 0.15) break;
      if (time >= this.context.currentTime) this.chord(event, time);
      if (++this.index === this.events.length) {
        this.index = 0;
        this.cycle++;
      }
    }
    while (this.playing && this.metronome) {
      const time = this.startedAt + this.clickIndex * this.beatSeconds;
      if (time > this.context.currentTime + 0.15) break;
      if (time >= this.context.currentTime)
        this.click(this.clickIndex % BEATS_PER_BAR, time);
      this.clickIndex++;
    }
  }
  setMetronome(enabled) {
    this.metronome = this.mode === 'metronome' || enabled;
    if (this.playing) this.schedule();
  }
  setVolume(volume) {
    if (!Number.isFinite(volume) || volume < 0 || volume > 1)
      throw new Error('Volume must be between 0 and 1.');
    this.volume = volume;
    if (this.master) this.master.gain.value = volume;
  }
  click(beat, time) {
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = beat === 0 ? 1760 : 880;
    envelope.gain.setValueAtTime(0, time);
    const level = this.mode === 'metronome' ? 0.08 : 0.035;
    envelope.gain.linearRampToValueAtTime(level, time + 0.002);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(time);
    oscillator.stop(time + 0.04);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }
  chord(event, time) {
    const notes = [...event.chord.notes].sort((a, b) => a - b);
    if (event.direction === 'up') notes.reverse();
    const end = time + event.duration;
    for (const [index, midi] of notes.entries()) {
      const noteTime =
        time + (index * STRUM_SPREAD_SECONDS) / Math.max(1, notes.length - 1);
      const frequency = 440 * 2 ** ((midi - 69) / 12);
      // A soft fundamental with a quickly decaying bell partial.
      for (const [ratio, level, decay] of [
        [1, 0.15, 0.65],
        [2, 0.035, 0.22],
        [3, 0.012, 0.12],
      ]) {
        const oscillator = this.context.createOscillator();
        const envelope = this.context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency * ratio;
        envelope.gain.setValueAtTime(0, noteTime);
        envelope.gain.linearRampToValueAtTime(
          level * event.velocity,
          noteTime + 0.008,
        );
        // Decay naturally, then release within the specified note length.
        const remaining =
          level * event.velocity * Math.exp(-(end - noteTime) / decay);
        envelope.gain.exponentialRampToValueAtTime(
          Math.max(0.0001, remaining),
          end - 0.025,
        );
        envelope.gain.linearRampToValueAtTime(0, end);
        oscillator.connect(envelope);
        envelope.connect(this.master);
        oscillator.start(noteTime);
        oscillator.stop(time + event.duration);
        oscillator.onended = () => {
          oscillator.disconnect();
          envelope.disconnect();
        };
      }
    }
  }
  // Public audio-clock timing for visuals; null while stopped.
  timing() {
    if (!this.playing) return null;
    const elapsedBeats = Math.max(
      0,
      (this.context.currentTime - this.startedAt) / this.beatSeconds,
    );
    const wholeBeat = Math.floor(elapsedBeats);
    return {
      bar: Math.floor(wholeBeat / BEATS_PER_BAR) % STRUCTURE.length,
      beat: wholeBeat % BEATS_PER_BAR,
      loop: Math.floor(wholeBeat / LOOP_BEATS) + 1,
      phase: elapsedBeats % 1,
    };
  }
  position() {
    const timing = this.timing();
    if (!timing) return null;
    const { bar, beat, loop } = timing;
    return { bar, beat, loop };
  }

  stop() {
    this.version++;
    this.playing = false;
    clearInterval(this.timer);
    if (this.master) {
      this.master.disconnect();
      this.master = null;
    }
  }
}

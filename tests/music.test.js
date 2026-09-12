import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chordsFor,
  eventsFor,
  STRUCTURE,
  BEAT_SECONDS,
  AVAILABLE_KEYS,
} from '../src/music.js';
import {
  BluesPlayer,
  DEFAULT_OUTPUT_LEVEL,
  STRUM_SPREAD_SECONDS,
} from '../src/audio.js';
test('selected bars in every key use the flat-seventh variation; other pairs stay unchanged', () => {
  const roots = {
    A: [45, 50, 40],
    E: [40, 45, 47],
    C: [48, 53, 55],
    B: [47, 40, 42],
    G: [43, 48, 50],
    D: [50, 43, 45],
  };
  for (const [key, basses] of Object.entries(roots)) {
    const events = eventsFor(key);
    for (let bar = 0; bar < 12; bar++) {
      const root = basses[STRUCTURE[bar]];
      const intervals = [3, 4, 6, 8, 9, 10].includes(bar + 1)
        ? [7, 7, 9, 9, 10, 10, 9, 9]
        : [7, 7, 9, 9, 7, 7, 9, 9];
      const expected = intervals.map((interval) => [root, root + interval]);
      assert.deepEqual(
        events.slice(bar * 8, bar * 8 + 8).map((e) => e.chord.notes),
        expected,
      );
    }
  }
  assert.throws(() => chordsFor('F'));
});
test('eight deterministic shuffle strums per bar with delayed offbeats and exact downbeats', () => {
  assert.deepEqual(STRUCTURE, [0, 1, 0, 0, 1, 1, 0, 0, 2, 1, 0, 2]);
  assert.equal(48 * BEAT_SECONDS, 32);
  for (const key of AVAILABLE_KEYS) {
    const events = eventsFor(key);
    assert.equal(events.length, 96);
    assert.deepEqual(events, eventsFor(key));
    for (let bar = 0; bar < 12; bar++) {
      const strokes = events.slice(bar * 8, bar * 8 + 8);
      assert.deepEqual(
        strokes.map((e) => e.direction),
        ['down', 'up', 'down', 'up', 'down', 'up', 'down', 'up'],
      );
      assert.deepEqual(strokes[0].chord, chordsFor(key)[STRUCTURE[bar]]);
      for (let beat = 0; beat < 4; beat++) {
        const down = strokes[beat * 2],
          up = strokes[beat * 2 + 1];
        assert.equal(down.beat, bar * 4 + beat);
        assert.ok(
          Math.abs(
            (up.beat - down.beat) * BEAT_SECONDS -
              ((2 / 3) * BEAT_SECONDS + 0.02),
          ) < 1e-9,
        );
        assert.ok(up.velocity < down.velocity && up.duration < down.duration);
        assert.ok(
          Math.abs(
            up.beat * BEAT_SECONDS +
              up.duration -
              ((down.beat + 1) * BEAT_SECONDS - 0.03),
          ) < 1e-9,
        );
      }
    }
  }
});
function context() {
  const starts = [],
    stops = [],
    frequencies = [],
    gains = [];
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
  });
  return {
    currentTime: 0,
    destination: {},
    starts,
    stops,
    frequencies,
    gains,
    resume: async () => {},
    createGain() {
      const node = {
        gain: param(),
        connect() {},
        disconnect() {
          this.disconnected = true;
        },
      };
      gains.push(node);
      return node;
    },
    createOscillator() {
      return {
        frequency: param(),
        connect() {},
        disconnect() {},
        start(t) {
          starts.push(t);
          frequencies.push(this.frequency.value);
        },
        stop(t) {
          stops.push(t);
        },
      };
    },
  };
}
test('scheduler strums chord tones, loops, stops, and restarts in a new key', async () => {
  const ctx = context(),
    player = new BluesPlayer(() => ctx);
  try {
    await player.start('A');
    assert.equal(ctx.starts.length, 6);
    assert.equal(ctx.starts[0], 0.08);
    assert.equal(ctx.starts.at(-1), 0.08 + STRUM_SPREAD_SECONDS);
    for (let t = 0.1; t <= 32.1; t += 0.1) {
      ctx.currentTime = t;
      player.schedule();
    }
    ctx.currentTime = 32.1;
    assert.deepEqual(player.position(), { bar: 0, beat: 0, loop: 2 });
    assert.ok(ctx.starts.some((t) => Math.abs(t - 32.08) < 0.00001));
    const output = player.master;
    player.stop();
    assert.equal(output.disconnected, true);
    const count = ctx.starts.length;
    ctx.currentTime = 35;
    player.schedule();
    assert.equal(ctx.starts.length, count);
    await player.start('C');
    assert.equal(player.events[0].chord.name, 'C');
    assert.equal(player.position().bar, 0);
  } finally {
    player.stop();
  }
});
test('stop during audio initialization prevents delayed playback', async () => {
  const ctx = context();
  let resume;
  ctx.resume = () =>
    new Promise((resolve) => {
      resume = resolve;
    });
  const player = new BluesPlayer(() => ctx);
  const starting = player.start('E');
  player.stop();
  resume();
  await starting;
  assert.equal(player.playing, false);
  assert.equal(ctx.starts.length, 0);
});

test('metronome schedules one quiet sine click per beat with a higher downbeat', async () => {
  const ctx = context(),
    player = new BluesPlayer(() => ctx);
  try {
    await player.start('A', 120, { mode: 'metronome' });
    assert.equal(player.events.length, 0);
    assert.deepEqual(ctx.frequencies, [1760]);
    for (const time of [0.5, 1, 1.5]) {
      ctx.currentTime = time;
      player.schedule();
    }
    assert.deepEqual(ctx.frequencies, [1760, 880, 880, 880]);
  } finally {
    player.stop();
  }
});

test('master volume persists across starts and controls the shared output gain', async () => {
  const ctx = context(),
    player = new BluesPlayer(() => ctx);
  try {
    assert.equal(player.volume, DEFAULT_OUTPUT_LEVEL);
    player.setVolume(0.3);
    await player.start('A');
    assert.equal(player.master.gain.value, 0.3);
    player.setVolume(0.7);
    assert.equal(player.master.gain.value, 0.7);
  } finally {
    player.stop();
  }
});

test('strums follow pitch direction, stagger strings, and release at the next stroke', () => {
  for (const chord of chordsFor('A'))
    for (const direction of ['down', 'up']) {
      const ctx = context(),
        player = new BluesPlayer(() => ctx);
      player.context = ctx;
      player.master = ctx.createGain();
      const event = {
        ...eventsFor('A')[direction === 'down' ? 0 : 1],
        chord,
        direction,
      };
      player.chord(event, 1);
      const notes =
        direction === 'down'
          ? event.chord.notes
          : [...event.chord.notes].reverse();
      for (let i = 0; i < notes.length; i++) {
        assert.equal(
          ctx.starts[i * 3],
          1 + (i * STRUM_SPREAD_SECONDS) / (notes.length - 1),
        );
        assert.equal(ctx.frequencies[i * 3], 440 * 2 ** ((notes[i] - 69) / 12));
      }
      assert.ok(ctx.stops.every((end) => end === 1 + event.duration));
    }
});

test('public timing follows the audio clock and resets across stop and restart', async () => {
  const ctx = context(),
    player = new BluesPlayer(() => ctx);
  try {
    assert.equal(player.timing(), null);
    await player.start('A');
    const origin = ctx.currentTime + 0.08;
    ctx.currentTime = origin + 2.5 * BEAT_SECONDS;
    const timing = player.timing();
    assert.equal(timing.bar, 0);
    assert.equal(timing.beat, 2);
    assert.ok(Math.abs(timing.phase - 0.5) < 1e-9);
    player.stop();
    assert.equal(player.timing(), null);
    await player.start('C');
    assert.deepEqual(player.timing(), { bar: 0, beat: 0, loop: 1, phase: 0 });
  } finally {
    player.stop();
  }
});

test('all supported tempos preserve shuffle delay and playable note envelopes', () => {
  for (let bpm = 60; bpm <= 140; bpm++) {
    const seconds = 60 / bpm;
    for (const key of AVAILABLE_KEYS) {
      const events = eventsFor(key, bpm);
      assert.equal(events.length, 96);
      for (let i = 0; i < events.length; i += 2) {
        const down = events[i],
          up = events[i + 1];
        assert.ok(
          Math.abs(
            (up.beat - down.beat) * seconds - ((seconds * 2) / 3 + 0.02),
          ) < 1e-9,
        );
        assert.ok(up.duration > STRUM_SPREAD_SECONDS + 0.008 + 0.025);
        assert.ok(up.duration < down.duration);
      }
    }
  }
  for (const bpm of [59, 141, 90.5, NaN, Infinity])
    assert.throws(() => eventsFor('A', bpm));
});
test('tempo restart resets bar one and uses the new clock rate', async () => {
  const ctx = context(),
    player = new BluesPlayer(() => ctx);
  try {
    for (const bpm of [60, 90, 120, 140]) {
      await player.start('A', bpm);
      assert.deepEqual(player.position(), { bar: 0, beat: 0, loop: 1 });
      const origin = ctx.currentTime + 0.08;
      ctx.currentTime = origin + 48 * (60 / bpm) + 0.001;
      assert.deepEqual(player.position(), { bar: 0, beat: 0, loop: 2 });
    }
  } finally {
    player.stop();
  }
});

test('new keys display the correct I, IV and V roots', () => {
  const expected = {
    B: ['B', 'E', 'F♯'],
    G: ['G', 'C', 'D'],
    D: ['D', 'G', 'A'],
  };
  for (const [key, names] of Object.entries(expected))
    assert.deepEqual(
      chordsFor(key).map((chord) => chord.name),
      names,
    );
});

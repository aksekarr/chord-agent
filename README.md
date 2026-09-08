# Chord Agent

A browser-based 12-bar blues player with synthesized electric piano. No dependencies or external audio assets.

## Run locally

From this folder, run `npm start`, then open http://127.0.0.1:5173 in a modern browser. Python 3 is required for the local server. Keep the terminal running; Ctrl+C stops the server. Click Play blues to enable audio.

Choose E, A, or C. Changing key during playback restarts at bar 1. Stop silences playback; Play starts again at bar 1. Keep the tab active for reliable timing: browsers can throttle background tabs.

## Musical rules

90 BPM, 4/4. Two notes per hit: root + fifth on beats 1 and 3, root + sixth on beats 2 and 4. Each pair repeats on its beat's delayed shuffle offbeat. Applies to I, IV and V in all three keys.

Quick-change blues, one bar per entry: I IV I I / IV IV I I / V IV I V. Bar 2 uses IV in every key, then bars 3 and 4 return to I.

Every beat has a downstroke on its first triplet partial and an upstroke on its third partial plus a fixed 20 ms delay. This gives eight strokes per bar: `D U D U D U D U`. Downstrokes are stronger and ring until the upstroke; lighter upstrokes release 30 ms before the next beat. Each strum rolls across all voiced notes over 25 ms, low to high for downstrokes and high to low for upstrokes. No random timing is used. The synthesized electric-piano tone is retained. Each 12-bar loop lasts 32 seconds.

## Files

- `index.html`: accessible controls and page structure.
- `style.css`: responsive layout, colours, chord grid and beat indicators.
- `src/music.js`: pure musical rules, chord notes and 12-bar event timeline.
- `src/audio.js`: Web Audio instrument and lookahead scheduler. Uses the audio clock for note timing; Stop disconnects the output immediately.
- `src/app.js`: connects controls, playback state and visual indicators.
- `tests/music.test.js`: musical and scheduler checks using Node's built-in test runner and a simulated audio context.
- `package.json`: local server and test commands.

Run `npm test` for automated checks. These verify musical data and scheduling, but do not judge audible instrument quality.

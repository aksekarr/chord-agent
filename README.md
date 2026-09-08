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

## Development discipline

Use Node.js with npm and Python 3. Run `npm ci` to install the pinned development-only formatter; the browser app has no runtime packages. Run `npm run format` after edits, then `npm run format:check`, `npm test`, and `npm run build`.

Keep musical settings, supported keys, note selection and shuffle rules in `src/music.js`. Keep synthesis and scheduling in `src/audio.js`. The player's `timing()` method returns bar, beat, loop and fractional beat phase from the audio clock; interface code consumes that snapshot without accessing the audio context directly. Controls and the pixel guitarist's poses belong in `src/app.js`; presentation belongs in HTML and CSS. Add future key and tempo controls through these boundaries rather than duplicating settings.

The pixel guitarist uses inline SVG with explicit dimensions. Its poses follow playback and freeze on Stop. Reduced-motion preferences disable movement. The stylesheet, entry script, and module imports have versioned URLs to help refresh browser caches; update these when shipping asset changes.

## Building and publishing

`npm run build` clears generated `dist/` output and copies only the browser assets into it. Never put source files in `dist/`. Build scripts, tests, and hosting metadata are excluded from the served assets.

The public app is https://chord-agent-blues.avisekarr.chatgpt.site. Its project identity is saved in `.openai/hosting.json`; reuse it for future deployments. Local edits and builds do not publish automatically. Publishing requires a Git checkpoint, a successful push to the hosting repository, saving that exact commit as a site version, and deploying that version. Keep credentials out of files and Git. Verify the public URL after deployment.

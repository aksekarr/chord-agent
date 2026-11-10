# Chord Agent

A browser-based 12-bar blues player with synthesized electric piano. No runtime dependencies or external audio assets.

Try the live app: [https://aksekarr.github.io/chord-agent/](https://aksekarr.github.io/chord-agent/)

## Run locally

From this folder, run `npm start`, then open http://127.0.0.1:5173 in a modern browser. Python 3 is required for the local server. Keep the terminal running; Ctrl+C stops the server. Press the Play icon to enable audio.

## Playback controls

The top settings row contains the key, mode, tempo, time signature, sound, metronome, and icon-only Play (▶) and Stop (■) controls. Choose E, A, C, B, G, or D in Blues mode. Drag the tempo slider to preview its value; release to apply it. Keyboard arrow keys also adjust the tempo. A tempo change during playback restarts at bar 1; while stopped it sets the speed for the next Play. Changing key during Blues playback restarts at bar 1. Stop silences playback; Play starts again at bar 1. Keep the tab active for reliable timing: browsers can throttle background tabs.

The Mode control has two options:

- **Blues** plays the twelve-bar loop. Its Metronome toggle is off by default and can be turned on or off during playback without restarting the loop.
- **Metronome** plays a click only. The key selector and metronome toggle are disabled, the chord grid is greyed out, and the position readout reports the beat within the bar. The beat indicators and character animation remain active.

The metronome uses a short synthesized sine click scheduled from the same audio-clock origin as playback: one click per beat, with beat 1 one octave higher than beats 2–4. Its click is quieter in Blues mode and raised in Metronome-only mode.

The master Volume slider sits below the chord grid beside the playback status. It defaults to 35% and changes the shared output gain immediately, scaling both chords and clicks while keeping their relative balance. Its setting remains in effect while the page is open.

## Musical rules

60–140 BPM in 1 BPM steps, defaulting to 90 BPM; 4/4. Two notes per hit: root + fifth on beats 1 and 3, root + sixth on beats 2 and 4. Each pair repeats on its beat's delayed shuffle offbeat. Applies to I, IV and V in all six keys.

Quick-change blues, one bar per entry: I IV I I / IV IV I I / V IV I V. Bar 2 uses IV in every key, then bars 3 and 4 return to I.

Every beat has a downstroke on its first triplet partial and an upstroke on its third partial plus a fixed 20 ms delay. This gives eight strokes per bar: `D U D U D U D U`. Downstrokes are stronger and ring until the upstroke; lighter upstrokes release 30 ms before the next beat. Each strum rolls across all voiced notes over 25 ms, low to high for downstrokes and high to low for upstrokes. No random timing is used. The synthesized electric-piano tone is retained. Each 12-bar loop lasts 48 beats (32 seconds at 90 BPM).

## Files

- `index.html`: accessible controls and page structure.
- `style.css`: responsive layout, base colours, chord grid, strum lane and beat indicators.
- `src/music.js`: pure musical rules, chord notes and 12-bar event timeline.
- `src/audio.js`: Web Audio chord instrument, metronome click, master output gain, and lookahead scheduler. Uses the audio clock for note timing; Stop disconnects the output immediately.
- `src/app.js`: connects controls, modes, playback state, master volume, and visual indicators (bar grid, beat dots, strum lane, next chord).
- `src/theme.js`: stores theme selection, updates character states from playback timing, and mirrors the beat, bar, chord degree and a per-beat pulse onto the page as `data-` attributes for the stylesheet.
- `themes.css`: theme palettes, theme-scoped controls, scenes, animations, and music-reactive scene rules.
- `fonts/`: the bundled Silkscreen pixel typeface (SIL Open Font License, see `fonts/OFL.txt`).
- `tests/music.test.js`: musical and scheduler checks using Node's built-in test runner and a simulated audio context.
- `package.json`: local server and test commands.

Run `npm test` for automated checks. These verify musical data and scheduling, but do not judge audible instrument quality.

## Development discipline

Use Node.js with npm and Python 3. Run `npm ci` to install the pinned development-only formatter; the browser app has no runtime packages. Run `npm run format` after edits, then `npm run format:check`, `npm test`, and `npm run build`.

Keep musical settings, supported keys, tempo bounds and validation, note selection and shuffle rules in `src/music.js`. Keep synthesis, metronome scheduling, and the shared output gain in `src/audio.js`. The player's `timing()` method returns bar, beat, loop and fractional beat phase from the audio clock; interface code consumes that snapshot without accessing the audio context directly. Controls, modes, volume, and character states belong in `src/app.js`; presentation belongs in HTML and CSS. Add future key and tempo controls through these boundaries rather than duplicating settings.

The theme characters live inside their scene's inline SVG. The Campfire busker rests with a slow dip and foot tap, then follows playback poses; the others sleep when stopped and bob when playing. Reduced-motion preferences disable motion. The stylesheet, entry script, and module imports have versioned URLs to help refresh browser caches; update these when shipping asset changes.

## Building and publishing

`npm run build` clears generated `dist/` output and copies only the browser assets, including `fonts/`, into it. Never put source files in `dist/`. Build scripts and tests are excluded from the built assets. The live site is GitHub Pages, which serves this repository; pushing to `main` publishes it. Verify the live URL after pushing.

## Selected-bar shuffle variation

In all six keys, bars 3, 4, 6, 8, 9 and 10 use upper intervals fifth, sixth, flat seventh, sixth on beats 1–4. Each pair is still struck twice. The root follows the progression: A uses E/F♯/G/F♯, D uses A/B/C/B, and E uses B/C♯/D/C♯. All other bars keep the original shuffle. Clear `VARIATION_BARS` in `src/music.js` to restore the original pattern.

## Visual themes

Use the Campfire/Cosy/Orbit/Christmas buttons at the top to switch skins without changing playback settings. The selection is remembered locally when browser storage is available; Campfire is the fallback for first-time visitors and for a saved theme that no longer exists.

Every theme is a stage: one wide pixel-art scene with its character performing inside it. Characters sleep when stopped and wake, bob and play in time when music starts.

- **Campfire** is a night camp: tent, fire, pines, a crescent moon and the busker standing by the fire. The flames and firelight jump on each beat, higher on beat 1.
- **Cosy** is an autumn afternoon: a cottage, turning trees, pumpkins, falling leaves and the cat (who puts on a scarf to play). The cottage lights come on while music plays.
- **Orbit** (formerly Sci-fi; a saved Sci-fi choice carries over) is a bar on a space station called The Turnaround, with an alien keytar player, a robot bartender and a jukebox. One stage lamp lights per beat, and the neon and footlights change colour with the chord (I coral, IV teal, V amber).
- **Christmas** is the seasonal slot: a snowy cabin, a decorated tree and a snowman with a ukulele. The tree lights step round once per bar, one set per beat, and the cabin lights alternate.

Bar 12, the turnaround, gets a flourish in every scene: a shooting star (Campfire, Orbit), a flight of birds (Cosy) or a sleigh crossing the moon (Christmas).

Under the scene, the panel shows the current root, a strum lane (eight marks per bar, tall for downstrokes and short for upstrokes, lit as each stroke sounds), the next bar's chord, and the bar grid. The big chord letter is tinted on IV and V.

All text uses the bundled Silkscreen pixel typeface, with sizes kept on its 8px grid.

### How themes are built

Each theme is three things: a palette (a block of custom properties at the top of `themes.css`), a scene (an inline SVG in `index.html` inside `<div class="scene scene-NAME">`), and a button with `data-theme-choice="NAME"`. The shared rules in `themes.css` style every control from the palette, so a theme needs no control styling of its own. Scene characters marked `data-character` are driven automatically. `src/theme.js` mirrors playback onto the page as `data-beat` (1-4), `data-bar` (1-12), `data-degree` (I, IV, V) and `data-pulse` (on for the first part of each beat); scene rules in `themes.css` react to those. Theme code never changes musical settings.

### Changing the seasonal theme

The fourth button is a seasonal slot. To swap Christmas for another holiday, replace its palette block, its scene `div` and its button with the new theme's, using a new name. Visitors who had the old one saved fall back to Campfire.

// Visual themes do not own or change musical settings.
const STORAGE_KEY = 'chord-agent-theme';
// Old saved names map to their replacements. A saved theme that no longer
// exists (a retired seasonal one, say) falls back to Campfire.
const RENAMED = { scifi: 'orbit' };
export function initThemes() {
  const buttons = [...document.querySelectorAll('[data-theme-choice]')];
  const select = (theme) => {
    document.documentElement.dataset.theme = theme;
    buttons.forEach((button) => {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.themeChoice === theme),
      );
    });
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* Storage is optional. */
    }
  };
  let saved;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* Use Campfire. */
  }
  saved = RENAMED[saved] ?? saved;
  select(
    buttons.some((button) => button.dataset.themeChoice === saved)
      ? saved
      : 'campfire',
  );
  buttons.forEach((button) =>
    button.addEventListener('click', () => select(button.dataset.themeChoice)),
  );
}

// Mirrors playback onto the page so scenes can react in CSS. `degree` is the
// current chord's numeral (I, IV or V), or null when no chord is sounding.
function setFlag(name, value) {
  const data = document.documentElement.dataset;
  if (value == null) delete data[name];
  else if (data[name] !== String(value)) data[name] = String(value);
}
let characters;
export function updateThemeCharacters(timing, degree = null) {
  setFlag('beat', timing ? timing.beat + 1 : null);
  setFlag('bar', timing && degree ? timing.bar + 1 : null);
  setFlag('degree', timing ? degree : null);
  setFlag('pulse', timing ? (timing.phase < 0.3 ? 'on' : 'off') : null);
  // Every scene character marked data-character sleeps, wakes and bobs alike.
  characters ||= [...document.querySelectorAll('[data-character]')];
  for (const character of characters) {
    character.dataset.state = timing ? 'playing' : 'resting';
    if (timing) character.dataset.pose = timing.phase < 0.5 ? 'down' : 'up';
    else delete character.dataset.pose;
  }
}

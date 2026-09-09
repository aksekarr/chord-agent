// Visual themes do not own or change musical settings.
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
      localStorage.setItem('chord-agent-theme', theme);
    } catch {
      /* Storage is optional. */
    }
  };
  let saved;
  try {
    saved = localStorage.getItem('chord-agent-theme');
  } catch {
    /* Use Bedroom. */
  }
  select(
    buttons.some((button) => button.dataset.themeChoice === saved)
      ? saved
      : 'bedroom',
  );
  buttons.forEach((button) =>
    button.addEventListener('click', () => select(button.dataset.themeChoice)),
  );
}

export function updateThemeCharacters(timing) {
  const cat = document.getElementById('cosy-cat');
  cat.dataset.state = timing ? 'awake' : 'asleep';
  cat.dataset.pose = timing && timing.phase < 0.5 ? 'up' : 'down';
  const astronaut = document.getElementById('astronaut');
  astronaut.dataset.state = timing ? 'flying' : 'standing';
  astronaut.dataset.pose = timing && timing.phase < 0.5 ? 'up' : 'down';
}

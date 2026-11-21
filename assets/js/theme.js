// Light/dark theme toggle.
// The saved choice is applied early by a small inline script in each page's <head>.
(function () {
  function effectiveTheme() {
    const set = document.documentElement.dataset.theme;
    if (set === 'light' || set === 'dark') return set;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function init() {
    document.querySelectorAll('.theme-toggle').forEach(button => {
      button.addEventListener('click', () => {
        const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
      });
    });

    document.querySelectorAll('[data-current-year]').forEach(el => {
      el.textContent = new Date().getFullYear();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

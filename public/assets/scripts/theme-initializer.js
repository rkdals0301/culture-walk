(() => {
  try {
    const storedTheme = localStorage.getItem('theme');
    const theme =
      storedTheme === 'light' || storedTheme === 'dark'
        ? storedTheme
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.style.colorScheme = theme;
  } catch {
    // Theme initialization is best effort when storage is unavailable.
  }
})();

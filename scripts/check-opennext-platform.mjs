const isWindows = process.platform === 'win32';

if (isWindows) {
  console.warn(
    [
      '[platform] OpenNext on native Windows is a best-effort developer path.',
      '[platform] The production-equivalent build/deploy path is Ubuntu in GitHub Actions.',
      '[platform] Use WSL2 when you need Linux-equivalent local OpenNext behavior.',
    ].join('\n')
  );
}

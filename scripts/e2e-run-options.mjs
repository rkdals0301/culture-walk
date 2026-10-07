export const parseE2EArguments = inputArgs => {
  const runOnly = inputArgs.includes('--run-only');
  const forceBuild = inputArgs.includes('--force-build');
  if (runOnly && forceBuild) throw new Error('--run-only and --force-build cannot be used together.');
  const playwrightArgs = inputArgs.filter(arg => arg !== '--run-only' && arg !== '--force-build');
  return { runOnly, forceBuild, playwrightArgs,
    inspectOnly: playwrightArgs.includes('--list') || playwrightArgs.includes('--help') };
};

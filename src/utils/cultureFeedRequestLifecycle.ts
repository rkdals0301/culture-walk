export interface CultureFeedRequestSession {
  version: number;
  controller: AbortController;
}

export const startCultureFeedRequestSession = (
  currentVersion: number,
  previousController: AbortController | null
): CultureFeedRequestSession => {
  previousController?.abort();

  return {
    version: currentVersion + 1,
    controller: new AbortController(),
  };
};

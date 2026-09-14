type StructuredLogLevel = 'info' | 'warn' | 'error';

type StructuredLogFields = Record<string, unknown>;

const normalizeError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return error === undefined ? undefined : { errorMessage: String(error) };
  }

  return {
    errorName: error.name,
    errorMessage: error.message,
  };
};

export const logEvent = (
  level: StructuredLogLevel,
  event: string,
  fields: StructuredLogFields = {},
  error?: unknown
) => {
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    ...fields,
    ...normalizeError(error),
  };

  console[level](JSON.stringify(payload));
};

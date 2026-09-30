export const CLIENT_ERROR_SOURCES = ['boundary', 'window_error', 'unhandled_rejection'] as const;
export const CLIENT_ERROR_SCOPES = ['app', 'global', 'culture-detail', 'map-detail'] as const;
export const CLIENT_ERROR_TYPES = [
  'Error',
  'TypeError',
  'ReferenceError',
  'SyntaxError',
  'RangeError',
  'URIError',
  'EvalError',
  'Other',
] as const;

export type ClientErrorSource = (typeof CLIENT_ERROR_SOURCES)[number];
export type ClientErrorScope = (typeof CLIENT_ERROR_SCOPES)[number];
export type ClientErrorType = (typeof CLIENT_ERROR_TYPES)[number];

export interface ClientErrorTelemetry {
  source: ClientErrorSource;
  scope: ClientErrorScope;
  errorType: ClientErrorType;
  route: string;
}

const SOURCE_SET = new Set<string>(CLIENT_ERROR_SOURCES);
const SCOPE_SET = new Set<string>(CLIENT_ERROR_SCOPES);
const ERROR_TYPE_SET = new Set<string>(CLIENT_ERROR_TYPES);

export const getClientErrorType = (error: unknown): ClientErrorType => {
  const name = error instanceof Error ? error.name : null;
  return name && ERROR_TYPE_SET.has(name) ? (name as ClientErrorType) : 'Other';
};

export const normalizeClientErrorRoute = (pathname: string) => {
  if (pathname === '/') return '/';
  if (/^\/(?:about|contact|privacy|map|ops)\/?$/.test(pathname)) {
    return pathname.replace(/\/$/, '') || '/';
  }
  if (/^\/cultures\/\d+\/?$/.test(pathname)) return '/cultures/[id]';
  if (/^\/map\/\d+\/?$/.test(pathname)) return '/map/[id]';
  return 'other';
};

export const parseClientErrorTelemetry = (value: unknown): ClientErrorTelemetry | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const { source, scope, errorType, pathname } = candidate;

  if (
    typeof source !== 'string' ||
    !SOURCE_SET.has(source) ||
    typeof scope !== 'string' ||
    !SCOPE_SET.has(scope) ||
    typeof errorType !== 'string' ||
    !ERROR_TYPE_SET.has(errorType) ||
    typeof pathname !== 'string' ||
    pathname.length === 0 ||
    pathname.length > 256 ||
    !pathname.startsWith('/')
  ) {
    return null;
  }

  if (source !== 'boundary' && scope !== 'global') return null;

  return {
    source: source as ClientErrorSource,
    scope: scope as ClientErrorScope,
    errorType: errorType as ClientErrorType,
    route: normalizeClientErrorRoute(pathname),
  };
};

export type BoundedRequestBodyResult =
  | { status: 'ok'; text: string }
  | { status: 'too-large' }
  | { status: 'invalid' };

export const isDeclaredRequestBodyTooLarge = (request: Request, maxBytes: number) => {
  const contentLength = request.headers.get('content-length');
  return contentLength !== null && /^\d+$/.test(contentLength) && Number(contentLength) > maxBytes;
};

export const readBoundedRequestBody = async (
  request: Request,
  maxBytes: number
): Promise<BoundedRequestBodyResult> => {
  if (isDeclaredRequestBodyTooLarge(request, maxBytes)) return { status: 'too-large' };
  if (!request.body) return { status: 'ok', text: '' };

  const reader = request.body.getReader();
  const bytes = new Uint8Array(maxBytes);
  let byteLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      if (byteLength + value.byteLength > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { status: 'too-large' };
      }

      bytes.set(value, byteLength);
      byteLength += value.byteLength;
    }

    return {
      status: 'ok',
      text: new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, byteLength)),
    };
  } catch {
    return { status: 'invalid' };
  } finally {
    reader.releaseLock();
  }
};

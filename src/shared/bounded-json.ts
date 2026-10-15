import { AppError } from "../platform/errors";
const READ_DEADLINE_MS = 10_000;

/** Classify a declared body size. The native reader drains bounded rejected
 * uploads before responding so closing an incoming upload cannot truncate 422. */
export function requireBodyLength(
  contentLength: string | null,
  maxBytes: number,
  tooLarge: (maxBytes: number) => AppError,
) {
  if (contentLength === null) return;
  const bytes = Number(contentLength);
  if (!/^\d+$/.test(contentLength) || !Number.isSafeInteger(bytes) || bytes < 0)
    throw new AppError(
      422,
      "InvalidContentLength",
      "The request must declare a valid non-negative byte length.",
    );
  if (bytes > maxBytes) throw tooLarge(maxBytes);
}

/** Retain at most the accepted cap; after overflow discard until EOF within a
 * separate hard transport/time ceiling. Never parse or execute rejected bytes. */
export async function readBoundedJson(
  request: Pick<Request, "headers"> & {
    body: ReadableStream<Uint8Array> | null;
  },
  maxBytes: number,
  options: {
    rejectionDrainBytes: number;
    tooLarge: (maxBytes: number) => AppError;
  },
): Promise<unknown> {
  const { tooLarge } = options;
  const reader = request.body?.getReader();
  if (!reader)
    throw new AppError(422, "InvalidJson", "A JSON object is required.");
  let rejected: AppError | null = null;
  try {
    requireBodyLength(
      request.headers.get("content-length"),
      maxBytes,
      tooLarge,
    );
  } catch (error) {
    if (!(error instanceof AppError)) throw error;
    rejected = error;
  }
  const chunks: Uint8Array[] = [];
  let bytes = 0,
    ended = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () =>
        reject(
          new AppError(
            422,
            "PayloadReadTimeout",
            "The upload did not finish within 10 seconds. Retain your draft and try again.",
          ),
        ),
      READ_DEADLINE_MS,
    );
  });
  const consume = async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        ended = true;
        break;
      }
      bytes += value.length;
      if (bytes > maxBytes) {
        rejected ??= tooLarge(maxBytes);
        chunks.length = 0;
      }
      if (bytes > options.rejectionDrainBytes) throw tooLarge(maxBytes);
      if (!rejected) chunks.push(value);
    }
    if (rejected) throw rejected;
    try {
      return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      throw new AppError(422, "InvalidJson", "Enter valid JSON.");
    }
  };
  try {
    return await Promise.race([consume(), deadline]);
  } finally {
    clearTimeout(timeout);
    if (!ended) void reader.cancel().catch(() => {});
    reader.releaseLock();
    chunks.length = 0;
  }
}

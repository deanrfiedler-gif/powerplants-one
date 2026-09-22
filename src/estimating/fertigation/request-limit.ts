import { AppError } from "../../platform/errors";
import { PORTABLE_BYTES } from "./portable-limits";

export const REJECTION_DRAIN_BYTES = 2 * PORTABLE_BYTES;
const READ_DEADLINE_MS = 10_000;
function tooLarge(maxBytes: number) {
  return new AppError(
    422,
    "PayloadTooLarge",
    `The complete fertigation request exceeds ${maxBytes / 1024 / 1024} MiB. Reduce the file or scope before trying again.`,
  );
}

/** Classify a declared body size. The native reader drains bounded rejected
 * uploads before responding so closing an incoming upload cannot truncate 422. */
export function requireFertigationBodyLength(
  contentLength: string | null,
  maxBytes: number,
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
export async function readFertigationJson(
  request: Pick<Request, "headers"> & {
    body: ReadableStream<Uint8Array> | null;
  },
  maxBytes: number,
): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader)
    throw new AppError(422, "InvalidJson", "A JSON object is required.");
  let rejected: AppError | null = null;
  try {
    requireFertigationBodyLength(
      request.headers.get("content-length"),
      maxBytes,
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
      if (bytes > REJECTION_DRAIN_BYTES) throw tooLarge(maxBytes);
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

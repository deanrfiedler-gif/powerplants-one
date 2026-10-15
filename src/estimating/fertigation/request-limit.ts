import { AppError } from "../../platform/errors";
import { readBoundedJson, requireBodyLength } from "../../shared/bounded-json";
import { PORTABLE_BYTES } from "./portable-limits";

export const REJECTION_DRAIN_BYTES = 2 * PORTABLE_BYTES;
function tooLarge(maxBytes: number) {
  return new AppError(
    422,
    "PayloadTooLarge",
    `The complete fertigation request exceeds ${maxBytes / 1024 / 1024} MiB. Reduce the file or scope before trying again.`,
  );
}

/** Compatibility wrapper: retain the fertigation transport contract. */
export function requireFertigationBodyLength(
  contentLength: string | null,
  maxBytes: number,
) {
  return requireBodyLength(contentLength, maxBytes, tooLarge);
}
export function readFertigationJson(
  request: Pick<Request, "headers"> & {
    body: ReadableStream<Uint8Array> | null;
  },
  maxBytes: number,
): Promise<unknown> {
  return readBoundedJson(request, maxBytes, {
    rejectionDrainBytes: REJECTION_DRAIN_BYTES,
    tooLarge,
  });
}

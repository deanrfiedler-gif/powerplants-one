import { readBoundedJson } from "../shared/bounded-json";
import { AppError } from "../platform/errors";

// Explanations have a larger envelope than calculation facts. See the rebase ADR.
export const decisionBodyBytes = 512 * 1024;
export const rebaseInputBytes = 64 * 1024;
export const decisionJsonBody = (
  request: Pick<Request, "headers"> & {
    body: ReadableStream<Uint8Array> | null;
  },
  maxBytes: number,
) =>
  readBoundedJson(request, maxBytes, {
    rejectionDrainBytes: 2 * decisionBodyBytes,
    tooLarge: () =>
      new AppError(
        422,
        "PayloadTooLarge",
        "The complete decision request exceeds 512 KiB. Reduce its size and retry.",
      ),
  });

import { createHash } from "node:crypto";
import { canonical } from "../../platform/operations";
export const hash = (value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");

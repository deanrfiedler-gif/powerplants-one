import { writeFileSync } from "node:fs";
import { join } from "node:path";

// Only these literals and a bounded duration may cross the P12 private-output guard.
export const writePhases = [
  "startup", "browser-launch", "coordinator", "appointment", "acknowledgements",
  "technician", "workspace", "service-worker", "job-selection", "download",
  "offline-reload", "open-job", "start-intent", "observation", "photo",
  "proof-write", "screenshot", "cleanup", "complete",
] as const;
type Phase = typeof writePhases[number];
const categories = ["running", "assertion", "timeout", "error", "unknown"] as const;
type Category = typeof categories[number];
type Marker = { phase: Phase; elapsed_ms: number; category: Category };
const maxElapsed = 600_000;

export function writeDiagnosticPath(root: string) {
  return join(root, "p12-write-phase.json");
}

function category(error: unknown): Category {
  try {
    if (error instanceof Error) {
      if (error.name === "AssertionError") return "assertion";
      if (error.name === "TimeoutError") return "timeout";
      return "error";
    }
  } catch { /* A diagnostic must never replace the original failure. */ }
  return "unknown";
}

export function writeDiagnostics(
  path: string | undefined,
  write = (value: string) => writeFileSync(path!, value, { mode: 0o600 }),
  now = () => performance.now(),
) {
  const started = now();
  let phase: Phase = "startup", failed = false;
  const save = (category: Category) => {
    if (!path) return;
    const elapsed = now() - started;
    const marker: Marker = {
      phase,
      elapsed_ms: Number.isFinite(elapsed)
        ? Math.min(maxElapsed, Math.max(0, Math.round(elapsed))) : 0,
      category,
    };
    try { write(JSON.stringify(marker)); } catch { /* Best effort only. */ }
  };
  save("running");
  return {
    phase(value: Phase) {
      if (failed || !writePhases.includes(value)) return;
      phase = value;
      save("running");
    },
    failure(error: unknown) {
      if (failed) return;
      failed = true;
      save(category(error));
    },
  };
}

export function safeWriteDiagnostic(raw: string): string {
  const unavailable = " [write diagnostic unavailable]";
  if (raw.length > 512) return unavailable;
  try {
    const value = JSON.parse(raw);
    if (!value || Array.isArray(value) || typeof value !== "object" ||
        Object.keys(value).sort().join(",") !== "category,elapsed_ms,phase" ||
        !writePhases.includes(value.phase) || !categories.includes(value.category) ||
        !Number.isInteger(value.elapsed_ms) || value.elapsed_ms < 0 ||
        value.elapsed_ms > maxElapsed) return unavailable;
    return ` [write phase=${value.phase}; elapsed_ms=${value.elapsed_ms}; category=${value.category}]`;
  } catch { return unavailable; }
}

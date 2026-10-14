import type { CostLine } from "../estimating/math";
import { choice, invalid, label, object, uuid } from "../shared/validation";
import { bounded } from "./validation";
import { hash } from "./hash";

export type LineDecision = {
  line_id: string;
  action: "Keep" | "Replace" | "Remove";
  reason: string;
};
export type RetainedCpqLine = {
  line_id: string;
  origin_run_id: string;
  original_line: CostLine;
  // Null is an explicit receiving removal while this target is still generated.
  retained_line: CostLine | null;
};
export type AdoptionResolution = {
  schema_version: 1;
  previous_adoption_id: string | null;
  estimate_version_id: string | null;
  decisions: LineDecision[];
  retained_cpq_lines: RetainedCpqLine[];
  generated_lines_hash: string;
  received_lines_hash: string;
  conflicts: ReturnType<typeof reconcileLines>["conflicts"];
};
export function lineDecisions(value: unknown): LineDecision[] {
  const decisions = bounded(value, "decisions", 200).map((entry) => {
    const r = object(entry, ["line_id", "action", "reason"]);
    return {
      line_id: uuid(r.line_id, "line_id"),
      action: choice(r.action, "action", [
        "Keep",
        "Replace",
        "Remove",
      ] as const),
      reason: label(r.reason, "reason", 500),
    };
  });
  if (new Set(decisions.map((d) => d.line_id)).size !== decisions.length)
    invalid("decisions", "Decide each estimate line exactly once.");
  return decisions.sort((a, b) => a.line_id.localeCompare(b.line_id));
}

export function reconcileLines(
  previous: {
    run_id: string;
    lines: CostLine[];
    retained_cpq_lines: RetainedCpqLine[];
  } | null,
  current: CostLine[],
  candidate: CostLine[],
  decisions: LineDecision[],
) {
  const tracked = new Map<string, RetainedCpqLine>();
  for (const line of previous?.lines ?? [])
    tracked.set(line.id, {
      line_id: line.id,
      origin_run_id: previous!.run_id,
      original_line: line,
      retained_line: line,
    });
  for (const line of previous?.retained_cpq_lines ?? [])
    tracked.set(line.line_id, line);
  for (const decision of decisions)
    if (!tracked.has(decision.line_id))
      invalid(
        "decisions",
        "Only previously tracked CPQ lines can be resolved.",
      );
  const retained = current.filter((line) => !tracked.has(line.id));
  const generated = candidate.filter((line) => !tracked.has(line.id));
  const retained_cpq_lines: RetainedCpqLine[] = [];
  const conflicts: {
    line_id: string;
    before: CostLine | null;
    current: CostLine | null;
    proposed: CostLine | null;
    state:
      "Changed" | "Removed" | "Obsolete" | "RetainedDecision" | "Unchanged";
    required: boolean;
    decision: LineDecision | null;
  }[] = [];
  const unresolved: { line_id: string; code: string }[] = [];
  for (const generatedLine of generated)
    if (retained.some((line) => line.id === generatedLine.id))
      unresolved.push({
        line_id: generatedLine.id,
        code: "CpqLineIdentityConflict",
      });
  for (const [id, prior] of tracked) {
    const present = current.find((line) => line.id === id) ?? null;
    const proposed = candidate.find((line) => line.id === id) ?? null;
    const held = previous!.retained_cpq_lines.some(
      (line) => line.line_id === id,
    );
    // A previously accepted removal ceases to need a hold once the rules also
    // omit that target. No line is silently deleted here: it is already absent.
    if (
      held &&
      prior.retained_line === null &&
      present === null &&
      proposed === null
    )
      continue;
    const state = !proposed
      ? "Obsolete"
      : held
        ? "RetainedDecision"
        : !present
          ? "Removed"
          : hash(present) !== hash(prior.retained_line)
            ? "Changed"
            : "Unchanged";
    const required = state !== "Unchanged";
    const decision = decisions.find((d) => d.line_id === id) ?? null;
    conflicts.push({
      line_id: id,
      before: prior.retained_line,
      current: present,
      proposed,
      state,
      required,
      decision,
    });
    if (required && !decision) {
      unresolved.push({
        line_id: id,
        code:
          state === "Obsolete"
            ? "CpqRemovalReviewRequired"
            : "CpqOwnedLineChanged",
      });
      if (present) retained.push(present);
      continue;
    }
    if (!decision || decision.action === "Replace") {
      if (!proposed) {
        unresolved.push({ line_id: id, code: "CpqReplacementMissing" });
        continue;
      }
      generated.push(proposed);
    } else if (decision.action === "Keep") {
      if (!present) {
        unresolved.push({ line_id: id, code: "CpqCurrentLineMissing" });
        continue;
      }
      retained.push(present);
      retained_cpq_lines.push({ ...prior, retained_line: present });
    } else if (proposed) {
      retained_cpq_lines.push({ ...prior, retained_line: null });
    }
  }
  // Retain the original ordering contract for unchanged legacy adoptions.
  retained.sort(
    (a, b) =>
      current.findIndex((l) => l.id === a.id) -
      current.findIndex((l) => l.id === b.id),
  );
  generated.sort(
    (a, b) =>
      candidate.findIndex((l) => l.id === a.id) -
      candidate.findIndex((l) => l.id === b.id),
  );
  return {
    retained,
    generated,
    retained_cpq_lines,
    conflicts,
    unresolved,
    lines: [...retained, ...generated],
  };
}

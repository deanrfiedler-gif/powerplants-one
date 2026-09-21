import { AppError } from "../../platform/errors";
import { hash } from "./hash";
import type { Comparison, Decision, Position } from "./types";
export function compare<T>(
  baseline: { key: string; value: T }[],
  current: { key: string; value: T }[],
  candidate: { key: string; value: T }[],
  decisions: Decision[],
  compatible: (a: T, b: T) => boolean = () => true,
): Comparison<T>[] {
  for (const list of [baseline, current, candidate])
    if (new Set(list.map((l) => l.key)).size !== list.length)
      throw new AppError(
        422,
        "SpecialistDuplicateKey",
        "Each generated position may occur only once.",
      );
  const keys = [
    ...new Set([...baseline, ...current, ...candidate].map((l) => l.key)),
  ];
  if (decisions.some((d) => !keys.includes(d.key)))
    throw new AppError(
      422,
      "SpecialistDecisionUnknown",
      "A decision refers to no compared position.",
    );
  return keys.map((key) => {
    const b = baseline.find((l) => l.key === key)?.value ?? null,
      c = current.find((l) => l.key === key)?.value ?? null,
      n = candidate.find((l) => l.key === key)?.value ?? null,
      d = decisions.find((d) => d.key === key) ?? null;
    const kind: Comparison<T>["kind"] =
      b !== null && c === null && n !== null
        ? "Deleted"
        : c !== null && n !== null && !compatible(c, n)
          ? "Incompatible"
          : c !== null && n === null
            ? "Removed"
            : b === null && c === null
              ? "Added"
              : c !== null && hash(c) !== hash(b)
                ? "Manual edit"
                : hash(b) === hash(n)
                  ? "Unchanged"
                  : "Changed";
    const required = [
      "Deleted",
      "Removed",
      "Manual edit",
      "Incompatible",
    ].includes(kind);
    if (d) {
      const allowed =
        kind === "Deleted"
          ? ["restore", "omit"]
          : kind === "Removed"
            ? ["remove", "retain"]
            : kind === "Incompatible"
              ? ["retain", "generated"]
              : ["keep", "generated", "remove", "retain"];
      if (!allowed.includes(d.choice))
        throw new AppError(
          422,
          "SpecialistDecisionInvalid",
          `Review the ${kind.toLowerCase()} decision for ${key}.`,
        );
    }
    const value =
      d && ["keep", "retain"].includes(d.choice)
        ? c
        : d && ["remove", "omit"].includes(d.choice)
          ? null
          : n;
    return {
      key,
      baseline: b,
      current: c,
      candidate: n,
      kind,
      required,
      decision: d,
      resolved: required && !d ? null : value,
    };
  });
}
export const activePositions = (lines: Position[]) =>
  lines
    .filter(
      (l) =>
        !l.excluded &&
        (l.effective_quantity === null ||
          l.effective_quantity.numerator !== "0"),
    )
    .map((l) => ({ key: l.key, value: l }));
export function comparePositions(
  b: Position[],
  c: Position[],
  n: Position[],
  decisions: Decision[],
) {
  // Compare the same active projection of all three versions. A formerly dormant
  // row becoming active is Added; an active baseline absent from C is Deleted.
  return compare(
    activePositions(b),
    activePositions(c),
    activePositions(n),
    decisions,
    (a, b) =>
      a.part_id === b.part_id &&
      a.unit === b.unit &&
      a.part_state === b.part_state,
  );
}
export function requireResolved<T>(rows: Comparison<T>[]) {
  if (rows.some((r) => r.required && !r.decision))
    throw new AppError(
      409,
      "SpecialistReviewRequired",
      "Resolve every manual change, deletion, removal and incompatible identity before saving.",
    );
}

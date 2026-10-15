import { evaluate } from "./engine";
import { bounded } from "./validation";
import { amount } from "../estimating/validation";
import { choice, invalid, label, object } from "../shared/validation";
import type { CalculationInput, Definition, Override, Part } from "./types";

export type RebaseDecision = {
  source_target: string;
  kind: Override["kind"];
  action: "Keep" | "Replace" | "Remap" | "Revoke";
  target: string | null;
  value: string | null;
  reason: string;
};
export type RebaseTarget = {
  target: string;
  basis_hash: string;
  category: Part["category"];
  unit: string;
};
export function rebaseDecisions(value: unknown): RebaseDecision[] {
  const decisions = bounded(value, "decisions", 100).map((entry) => {
    const r = object(entry, [
      "source_target",
      "kind",
      "action",
      "target",
      "value",
      "reason",
    ]);
    const kind = choice(r.kind, "kind", [
      "Quantity",
      "SellPrice",
      "Suppress",
    ] as const);
    const action = choice(r.action, "action", [
      "Keep",
      "Replace",
      "Remap",
      "Revoke",
    ] as const);
    if (action !== "Remap" && r.target !== null)
      invalid(
        "target",
        "Only Remap selects another target; otherwise use null.",
      );
    if (action !== "Replace" && r.value !== null)
      invalid("value", "Only Replace supplies a value; otherwise use null.");
    if (action === "Replace" && kind === "Suppress")
      invalid("action", "Keep, remap or revoke a suppression.");
    return {
      source_target: label(r.source_target, "source_target", 200),
      kind,
      action,
      target: action === "Remap" ? label(r.target, "target", 200) : null,
      value:
        action === "Replace"
          ? amount(r.value, "value", kind === "Quantity")
          : null,
      reason: label(r.reason, "reason", 500),
    };
  });
  if (
    new Set(decisions.map((d) => `${d.source_target}:${d.kind}`)).size !==
    decisions.length
  )
    invalid("decisions", "Decide each source override exactly once.");
  return decisions.sort((a, b) =>
    `${a.source_target}:${a.kind}`.localeCompare(
      `${b.source_target}:${b.kind}`,
    ),
  );
}

// Runs in the existing bounded worker. Three evaluations preserve material ->
// labour ordering without changing the normal evaluator's results or hashes.
export function evaluateRebase(
  definition: Definition,
  proposal: CalculationInput,
  parentDefinition: Definition,
  prior: Override[],
  decisions: RebaseDecision[],
) {
  const unresolved: {
    source_target: string;
    kind: Override["kind"];
    code: string;
  }[] = [];
  const issue = (o: Pick<Override, "target" | "kind">, code: string) =>
    unresolved.push({ source_target: o.target, kind: o.kind, code });
  const baselineTargets: RebaseTarget[] = [];
  const clean = { ...proposal, overrides: [] };
  const baseline = evaluate(definition, clean, (target) =>
    baselineTargets.push(target),
  );
  const planned: {
    source: Override;
    decision: RebaseDecision;
    target: string;
    category: Part["category"];
  }[] = [];
  for (const decision of decisions)
    if (
      !prior.some(
        (o) => o.target === decision.source_target && o.kind === decision.kind,
      )
    )
      issue(
        { target: decision.source_target, kind: decision.kind },
        "UnknownOverrideDecision",
      );
  for (const source of prior) {
    const decision = decisions.find(
      (d) => d.source_target === source.target && d.kind === source.kind,
    );
    if (!decision) {
      issue(source, "OverrideDecisionRequired");
      continue;
    }
    if (decision.action === "Revoke") continue;
    const target =
      decision.action === "Remap" ? decision.target! : source.target;
    const original = parentDefinition.parts.find(
      (p) => p.key === source.target.split(":")[1],
    );
    const candidate = definition.parts.find(
      (p) => p.key === target.split(":")[1],
    );
    if (
      !original ||
      !candidate ||
      original.category !== candidate.category ||
      original.unit !== candidate.unit
    ) {
      issue(source, "OverrideRemapIncompatible");
      continue;
    }
    if (
      planned.some((p) => p.target === target && p.source.kind === source.kind)
    ) {
      issue(source, "OverrideTargetCollision");
      continue;
    }
    planned.push({ source, decision, target, category: candidate.category });
  }
  const overrides: Override[] = [];
  const apply = (labour: boolean, targets: RebaseTarget[]) => {
    for (const item of planned.filter(
      (p) => (p.category === "Labour") === labour,
    )) {
      const target = targets.find((t) => t.target === item.target);
      if (!target) {
        issue(item.source, "OverrideTargetMissing");
        continue;
      }
      overrides.push({
        target: target.target,
        basis_hash: target.basis_hash,
        kind: item.source.kind,
        value:
          item.decision.action === "Replace"
            ? item.decision.value
            : item.source.value,
        reason: item.decision.reason,
      });
    }
  };
  apply(false, baselineTargets);
  const effectiveTargets: RebaseTarget[] = [];
  evaluate(definition, { ...clean, overrides }, (target) =>
    effectiveTargets.push(target),
  );
  apply(true, effectiveTargets);
  overrides.sort((a, b) =>
    `${a.target}:${a.kind}`.localeCompare(`${b.target}:${b.kind}`),
  );
  const input = { ...clean, overrides };
  const result = evaluate(definition, input);
  return {
    input,
    result,
    baseline,
    targets: effectiveTargets,
    unresolved,
    decisions,
    ready: unresolved.length === 0,
  };
}

export type RebaseEvidence = {
  schema_version: 1;
  parent_id: string;
  parent_content_hash: string;
  preview_hash: string;
  decisions: RebaseDecision[];
};

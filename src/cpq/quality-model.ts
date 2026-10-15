import { evaluate, testDefinition } from "./engine";
import { hash } from "./hash";
import { semanticChanges } from "./semantic-diff";
import { tableCoverage } from "./design-runtime";
import type { CalculationInput, Definition, Fixture } from "./types";
import { calculationInput } from "./validation";
import { AppError } from "../platform/errors";

export const qualityLimits = {
  estimates: 25,
  input_bytes: 2 * 1024 * 1024,
  report_bytes: 2 * 1024 * 1024,
} as const;
export type QualityWork = {
  definition: Definition;
  baseline: Definition | null;
  estimates: { id: string; input: CalculationInput }[];
};

function simulate(d: Definition, input: CalculationInput) {
  try {
    const accepted = calculationInput(input, d.facts, d.schema_version === 3);
    return { input_status: "Accepted" as const, input_errors: [] as { field: string; message: string }[], result: evaluate(d, accepted) };
  } catch (e) {
    if (!(e instanceof AppError) || e.code !== "InvalidData") throw e;
    return { input_status: "NeedsInputReview" as const, input_errors: e.field_errors, result: null };
  }
}
function regression(d: Definition, fixture: Fixture) {
  const simulation = simulate(d, fixture.input), result = simulation.result;
  const actual = result ? { ready: result.ready, cost: result.totals.cost, sell: result.totals.sell,
    diagnostic_codes: [...new Set(result.diagnostics.map((d) => d.code))].sort() } : null;
  return { name: fixture.name, expected: fixture.expected, actual,
    passed: actual !== null && hash(actual) === hash({ ...fixture.expected,
      diagnostic_codes: [...new Set(fixture.expected.diagnostic_codes)].sort() }),
    result_hash: result?.result_hash ?? null, input_status: simulation.input_status, input_errors: simulation.input_errors };
}

// These are addresses within an immutable definition, not invented catalogue IDs.
export function qualityMembers(d: Definition) {
  const members: { kind: string; key: string; content_hash: string }[] = [];
  for (const kind of ["facts", "parts", "rules", "constraints"] as const)
    for (const member of d[kind])
      members.push({ kind, key: member.key, content_hash: hash(member) });
  for (const [index, fixture] of d.fixtures.entries())
    members.push({
      kind: "fixtures",
      key: String(index),
      content_hash: hash(fixture),
    });
  if (d.design)
    members.push({
      kind: "design",
      key: "design",
      content_hash: hash(d.design),
    });
  return members;
}

export function qualityResults(work: QualityWork) {
  const d = work.definition;
  const results = d.fixtures.map((f) => evaluate(d, f.input));
  // Reuse the exact expectation/diagnostic normalization of the existing test bench.
  const fixtures = testDefinition(d).map(
    ({ name, passed, expected, actual, result_hash }) => ({
      name,
      passed,
      expected,
      actual,
      result_hash,
    }),
  );
  const baseline_regression = work.baseline?.fixtures.map((fixture) => regression(d, fixture)) ?? [];
  const tables = d.schema_version === 3 ? tableCoverage(d) : [];
  return {
    fixtures,
    baseline_regression,
    coverage: {
      scope: "ObservedFixturesOnly" as const,
      rules: d.rules.map((rule) => ({
        key: rule.key,
        contributing_fixtures: results.flatMap((result, index) =>
          result.lines.some((line) =>
            line.contributions.some((c) => c.rule === rule.key),
          )
            ? [index]
            : [],
        ),
        observed_outcomes: [
          ...new Set(
            results.flatMap(
              (result) =>
                result.explanation?.rules
                  .filter((r) => r.rule === rule.key)
                  .map((r) => r.outcome) ?? [],
            ),
          ),
        ].sort(),
      })),
      tables,
    },
    conflicts: results.flatMap((result, fixture_index) =>
      result.diagnostics
        .filter((d) => d.code.includes("Conflict"))
        .map((diagnostic) => ({ fixture_index, ...diagnostic })),
    ),
    changes: semanticChanges(work.baseline, d),
    approval_eligible:
      fixtures.length > 0 &&
      fixtures.every((f) => f.passed) &&
      tables.every((t) => t.complete && t.issues.length === 0),
    simulations: work.estimates.map((e) => ({
      estimate_id: e.id,
      ...simulate(d, e.input),
    })),
  };
}

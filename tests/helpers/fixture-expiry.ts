import assert from "node:assert/strict";
import ts from "typescript";

export const RUNWAY_DAYS = 90;
const DAY = 86_400_000;
type Clock = "instant" | "Australia/Brisbane" | "Australia/Sydney";
type Literal = ts.StringLiteralLike;
type Selector = (node: Literal) => boolean;
export type FixtureRule = {
  path: string;
  purpose: string;
  clock: Clock;
  select: Selector;
  count: number;
  exclusions?: Record<string, string>;
};

const property =
  (...names: string[]): Selector =>
  (node) =>
    ts.isPropertyAssignment(node.parent) &&
    node.parent.initializer === node &&
    names.includes(node.parent.name.getText().replace(/['"]/g, ""));
const parameter =
  (...names: string[]): Selector =>
  (node) =>
    ts.isParameter(node.parent) && names.includes(node.parent.name.getText());
const argument =
  (name: string, positions: number[]): Selector =>
  (node) => {
    const parent = node.parent;
    return (
      ts.isCallExpression(parent) &&
      parent.expression.getText() === name &&
      positions.some((index) => parent.arguments[index] === node)
    );
  };
const any =
  (...selectors: Selector[]): Selector =>
  (node) =>
    selectors.some((s) => s(node));
const replyBy = any(
  property("reply_by"),
  (node) =>
    ts.isCallExpression(node.parent) &&
    /\.getByLabel\(\s*[`'"]Reply by[^]*\)\.fill$/.test(
      node.parent.expression.getText(),
    ),
);

// This is an audited list of live-clock inputs, not a ban on historical dates.
// Read the current source literals rather than keeping a second copy of their dates.
// A new validation path needs a traced rule here; see ADR-0030's audit/limits.
export const fixtureRules: FixtureRule[] = [
  ...[
    "tests/browser/conversations.spec.ts",
    "tests/database/conversations-context.test.ts",
  ].map((path) => ({
    path,
    purpose: "Conversations reply-by (including the browser form)",
    clock: "Australia/Brisbane" as const,
    select: replyBy,
    count: path.includes("browser") ? 3 : 1,
  })),
  {
    path: "tests/database/work-order-register.test.ts",
    purpose: "visits used by cancelAppointment",
    clock: "instant",
    select: any(parameter("start", "end"), argument("visit", [1, 2])),
    count: 4,
  },
  {
    path: "tests/database/field-closed-visit.test.ts",
    purpose: "replacement proposal cancelled before re-proposal",
    clock: "instant",
    select: property("start_at", "end_at"),
    count: 2,
  },
  ...[
    "tests/database/planner.test.ts",
    "tests/database/policy-dispositions.test.ts",
    "tests/helpers/maintenance-service.ts",
    "tests/helpers/offline-authority.ts",
    "tests/helpers/isolated-field-http.ts",
  ].map((path) => ({
    path,
    purpose: "positive readiness evidence expiry",
    clock: "instant" as const,
    select: any(property("valid_until"), parameter("valid_until")),
    count: 1,
  })),
  {
    path: "tests/helpers/policy-commands.ts",
    purpose: "live policy proposal/review effective time",
    clock: "instant",
    select: parameter("effective"),
    count: 2,
  },
  {
    path: "tests/database/policy-impact.test.ts",
    purpose: "live policy comparison effective time",
    clock: "instant",
    select: property("effective_from"),
    count: 3,
    exclusions: {
      "2026-01-01T00:00:00Z": "Past effective-time refusal",
      "2032-01-02T00:00:00Z": "Effective time at preserved expiry is refused",
    },
  },
  {
    path: "tests/database/supply.test.ts",
    purpose: "SUP-1 promise timing in the demand's timezone",
    clock: "Australia/Sydney",
    select: property("promised_on"),
    count: 5,
    exclusions: {
      "2026-09-30": "Broken-promise negative readiness case",
      "2026-10-10": "Historical Service delay-impact evidence",
    },
  },
];

export function fixtureLiterals(rule: FixtureRule, text: string) {
  const source = ts.createSourceFile(
    rule.path,
    text,
    ts.ScriptTarget.Latest,
    true,
  );
  const found: { value: string; line: number }[] = [];
  const excluded = new Map<string, number>();
  function visit(node: ts.Node) {
    if (ts.isStringLiteralLike(node) && rule.select(node)) {
      if (rule.exclusions && Object.hasOwn(rule.exclusions, node.text))
        excluded.set(node.text, (excluded.get(node.text) ?? 0) + 1);
      else
        found.push({
          value: node.text,
          line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        });
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(
    found.length,
    `${rule.path}: no ${rule.purpose} literals found; review the selector, do not silently lose coverage.`,
  );
  assert.equal(
    found.length,
    rule.count,
    `${rule.path}: ${rule.purpose} literal count changed; review added, removed or indirect inputs before updating coverage.`,
  );
  for (const value of Object.keys(rule.exclusions ?? {}))
    assert.equal(
      excluded.get(value),
      1,
      `${rule.path}: exclusion ${value} must match exactly once; review the classification.`,
    );
  return found;
}

export function runwayDays(value: string, clock: Clock, now: Date) {
  const dateOnly = clock !== "instant";
  assert.match(
    value,
    dateOnly
      ? /^\d{4}-\d{2}-\d{2}$/
      : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/,
    "Invalid fixture date: " + value,
  );
  const instant = Date.parse(dateOnly ? value + "T00:00:00Z" : value);
  assert.ok(
    Number.isFinite(instant) &&
      new Date(instant).toISOString().slice(0, 10) === value.slice(0, 10),
    "Invalid fixture date: " + value,
  );
  // Civil-day gates compare calendar dates in the server's zone, not UTC or the
  // runner's local zone. UTC arithmetic on those civil dates avoids DST day lengths.
  const observed = dateOnly
    ? Date.parse(
        new Intl.DateTimeFormat("en-CA", {
          timeZone: clock,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(now) + "T00:00:00Z",
      )
    : now.getTime();
  assert.ok(Number.isFinite(observed), "Invalid observation time");
  return (instant - observed) / DAY;
}

export function assertRunway(
  value: string,
  clock: Clock,
  now: Date,
  location: string,
) {
  const days = runwayDays(value, clock, now);
  assert.ok(
    days >= RUNWAY_DAYS,
    `${location}: ${value} has ${days.toFixed(2)} days of runway (${clock}); needs at least ${RUNWAY_DAYS}. ` +
      "Review and move this positive fixture and its dependent assertions/anchors together. " +
      "Preserve historical and refusal cases. See docs/decisions/ADR-0030-test-fixture-time-dependence.md.",
  );
}

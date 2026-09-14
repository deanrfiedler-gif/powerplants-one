import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  discoveryDefinition,
  discoveryDefinitionHash,
  compileDiscovery,
  compareDefinitions,
  compareDiscovery,
  inheritDiscovery,
  type DiscoveryInput,
  type Definition,
  type Answer,
} from "../../src/estimating/discovery";

const owner = "30000000-0000-4000-8000-000000000001";
const site = "70000000-0000-4000-8000-000000000001";
const follow = () => ({
  owner_id: owner,
  reason: "SYN estimator to confirm the original source",
});
const answer = (question_id: string, value: Answer["value"]): Answer => ({
  question_id,
  value,
  state: "Confirmed",
  source: "SYN scoped enquiry reviewed",
  follow_up: null,
});
const fixture = (): DiscoveryInput => ({
  definition_id: "SYN-E2-QUESTIONS",
  definition_revision: "r01",
  definition_hash: discoveryDefinitionHash,
  effort: {
    value: "Express",
    source: "SYN estimator declared the bounded effort",
    follow_up: null,
  },
  scope: {
    mode: "Site",
    site_id: site,
    site_reason: null,
    follow_up: null,
    facility_ids: [],
    equipment_ids: [],
    systems: ["ProductSupply", "DefinedLabour", "Freight"].map((tag) => ({
      tag: tag as "ProductSupply" | "DefinedLabour" | "Freight",
      facility_ids: [],
    })),
    unsupported_scope: null,
  },
  answers: [
    answer("Q01", "SYN two control modules and bench setup"),
    answer("Q02", { choice: "NoneDeclared" }),
    answer("Q03", "SYN existing connections assumed compatible"),
    { ...answer("Q04", "Unknown"), state: "Answered", follow_up: follow() },
    answer("Q05", "SYN demo controls"),
    answer("Q06", 2),
    answer("Q07", "No"),
    answer("Q09", "PPO"),
    answer("Q10", "SYN deliver to the selected site"),
  ],
});
function change(f: DiscoveryInput, id: string, patch: Partial<Answer>) {
  Object.assign(
    f.answers.find((a) => a.question_id === id)!,
    patch,
  );
}

test("E2 adopted definition has ten immutable questions; Complete scope stays separate from effort, review unknown and unconfigured delivery routing", () => {
  const value = fixture(),
    before = JSON.stringify(value),
    compiled = compileDiscovery(value);
  assert.deepEqual(
    discoveryDefinition.questions.map((q) => q.id),
    ["Q01", "Q02", "Q03", "Q04", "Q05", "Q06", "Q07", "Q08", "Q09", "Q10"],
  );
  assert.equal(compiled.scope_readiness, "Complete");
  assert.equal(compiled.open_items.length, 1);
  assert.equal(compiled.open_items[0].blocks_scope, false);
  assert.equal(compiled.delivery_routing.status, "NotConfigured");
  assert.equal(JSON.stringify(value), before);
  assert.throws(() => {
    discoveryDefinition.questions[0].label = "Changed";
  }, TypeError);
  assert.throws(() => {
    compiled.input.answers[0].value = "Changed";
  }, TypeError);
  value.effort = { value: "Unknown", source: null, follow_up: follow() };
  const unknown = compileDiscovery(value);
  assert.equal(unknown.scope_readiness, "Complete");
  assert.equal(
    unknown.open_items.find((i) => i.key === "Effort")?.blocks_scope,
    false,
  );
  assert.equal(unknown.input.effort.value, "Unknown");
  assert.notEqual(unknown.content_hash, compiled.content_hash);
});

test("E2 product counts retain integer Each boundaries without blank, fraction, string, boolean or zero coercion", () => {
  for (const value of [1, 100000]) {
    const f = fixture();
    change(f, "Q06", { value });
    assert.equal(compileDiscovery(f).scope_readiness, "Complete");
  }
  for (const value of [0, 100001, 1.5, "2", "", true, NaN, Infinity]) {
    const f = fixture();
    change(f, "Q06", { value: value as number });
    assert.throws(() => compileDiscovery(f));
  }
  const f = fixture();
  change(f, "Q06", {
    state: "Empty",
    value: null,
    source: null,
    follow_up: follow(),
  });
  assert.equal(compileDiscovery(f).scope_readiness, "Incomplete");
  change(f, "Q06", { follow_up: null });
  assert.throws(() => compileDiscovery(f));
});

test("E2 required known answers need confirmation and explicit source; Assumed and Deferred retain an owned unresolved item", () => {
  for (const state of ["Answered", "Assumed", "Deferred"] as const) {
    const f = fixture();
    change(f, "Q01", { state, follow_up: follow() });
    assert.equal(compileDiscovery(f).scope_readiness, "Incomplete");
    change(f, "Q01", { follow_up: null });
    assert.throws(() => compileDiscovery(f));
  }
  const f = fixture();
  change(f, "Q07", { value: "Unknown", follow_up: follow() });
  assert.throws(() => compileDiscovery(f));
  change(f, "Q07", { state: "Answered" });
  assert.equal(compileDiscovery(f).scope_readiness, "Incomplete");
  change(f, "Q01", { source: null });
  assert.throws(() => compileDiscovery(f));
});

test("E2 explicit NoneDeclared differs from missing or blank and forged state, owner, route and readiness input is refused", () => {
  const f = fixture();
  assert.equal(
    compileDiscovery(f).input.answers.find((a) => a.question_id === "Q02")!
      .value instanceof Object,
    true,
  );
  for (const value of ["", null, {}]) {
    const f = fixture();
    change(f, "Q02", { value: value as Answer["value"] });
    assert.throws(() => compileDiscovery(f));
  }
  for (const patch of [
    { readiness: "Complete" },
    { actor_id: owner },
    { routing: "ServiceOrder" },
    { schema_version: 999 },
  ])
    assert.throws(() => compileDiscovery({ ...fixture(), ...patch }));
  assert.throws(() =>
    compileDiscovery({ ...fixture(), definition_hash: "0".repeat(64) }),
  );
  const forged = fixture();
  Object.assign(forged.answers[0], {
    confirmed_by: owner,
    confirmed_at: new Date().toISOString(),
  });
  assert.throws(() => compileDiscovery(forged));
  const unknown = fixture();
  unknown.effort = { value: "Unknown", source: null, follow_up: null };
  assert.throws(() => compileDiscovery(unknown));
});

test("E2 scoped Facility/equipment membership is explicit, canonical and bounded; parent choices imply no children", () => {
  const f = fixture(),
    a = randomUUID(),
    b = randomUUID();
  f.scope.facility_ids = [b, a];
  f.scope.equipment_ids = [randomUUID()];
  f.scope.systems[0].facility_ids = [b];
  const compiled = compileDiscovery(f);
  f.scope.facility_ids.reverse();
  assert.equal(compileDiscovery(f).content_hash, compiled.content_hash);
  assert.deepEqual(
    compiled.input.scope.systems.find((s) => s.tag === "ProductSupply")!
      .facility_ids,
    [b],
  );
  f.scope.systems[0].facility_ids = [randomUUID()];
  assert.throws(() => compileDiscovery(f));
  for (const field of ["facility_ids", "equipment_ids"] as const) {
    const f = fixture(),
      id = randomUUID();
    f.scope[field] = [id, id.toUpperCase()];
    assert.throws(() => compileDiscovery(f));
  }
  for (const [field, max] of [
    ["facility_ids", 10],
    ["equipment_ids", 100],
  ] as const) {
    const f = fixture();
    f.scope[field] = Array.from({ length: max }, () => randomUUID());
    assert.equal(compileDiscovery(f).scope_readiness, "Complete");
    f.scope[field].push(randomUUID());
    assert.throws(() => compileDiscovery(f));
  }
  const duplicate = fixture();
  duplicate.scope.systems.push(duplicate.scope.systems[0]);
  assert.throws(() => compileDiscovery(duplicate));
});

test("E2 Site unknown is savable as incomplete; NoSiteRequired is explicit and cannot hide on-site labour or equipment", () => {
  const f = fixture();
  f.scope = {
    ...f.scope,
    mode: "Unknown",
    site_id: null,
    site_reason: "SYN site identity to confirm",
    follow_up: follow(),
  };
  assert.equal(compileDiscovery(f).scope_readiness, "Incomplete");
  f.scope.equipment_ids = [randomUUID()];
  assert.throws(() => compileDiscovery(f));
  f.scope.equipment_ids = [];
  f.scope = {
    ...f.scope,
    mode: "NoSiteRequired",
    site_reason: "SYN off-site bench supply only",
    follow_up: null,
  };
  assert.equal(compileDiscovery(f).scope_readiness, "Complete");
  change(f, "Q07", { value: "Yes" });
  f.answers.push(answer("Q08", "SYN on-site inspection"));
  assert.throws(() => compileDiscovery(f));
  f.scope = {
    ...f.scope,
    mode: "Unknown",
    site_reason: "SYN on-site identity unresolved",
    follow_up: follow(),
  };
  assert.equal(compileDiscovery(f).scope_readiness, "Incomplete");
});

test("E2 conditional removals retain exact accepted history; restored questions need an explicit answer and comparison", () => {
  const original = fixture();
  change(original, "Q07", { value: "Yes" });
  original.answers.push(answer("Q08", "SYN original on-site work"));
  const changed = structuredClone(original);
  change(changed, "Q07", { value: "No" });
  assert.throws(() => compileDiscovery(changed));
  changed.answers = changed.answers.filter((a) => a.question_id !== "Q08");
  const comparison = compareDiscovery(original, changed);
  assert.equal(
    comparison.questions.find((q) => q.question_id === "Q08")!.disposition,
    "Hidden",
  );
  assert.equal(
    comparison.retained_hidden_answers[0].value,
    "SYN original on-site work",
  );
  change(changed, "Q07", { value: "Yes" });
  assert.throws(() => compileDiscovery(changed));
  changed.answers.push({
    ...answer("Q08", null),
    state: "Empty",
    source: null,
    follow_up: follow(),
  });
  assert.equal(compileDiscovery(changed).scope_readiness, "Incomplete");
  const noFreight = fixture();
  change(noFreight, "Q09", { value: "Customer" });
  noFreight.answers = noFreight.answers.filter((a) => a.question_id !== "Q10");
  assert.equal(compileDiscovery(noFreight).scope_readiness, "Complete");
  assert.equal(
    compareDiscovery(fixture(), noFreight).questions.find(
      (q) => q.question_id === "Q10",
    )!.disposition,
    "Hidden",
  );
});

test("E2 definition comparison refuses implicit Each-to-metres reuse and identifies removed/new-required/label-only meanings", () => {
  const next = structuredClone(discoveryDefinition) as Definition;
  next.revision = "r02-comparison-fixture";
  next.questions = next.questions.filter((q) => q.id !== "Q08");
  Object.assign(
    next.questions.find((q) => q.id === "Q06")!,
    { type: "Decimal", unit: "metres" },
  );
  next.questions.find((q) => q.id === "Q01")!.label = "Included proposed work";
  next.questions = [
    ...next.questions,
    {
      id: "Q11",
      label: "Packaging",
      type: "Choice",
      required: true,
      choices: ["Box", "Crate"],
    },
  ];
  const changes = compareDefinitions(discoveryDefinition, next);
  assert.equal(
    changes.find((q) => q.question_id === "Q06")!.disposition,
    "Incompatible",
  );
  assert.equal(
    changes.find((q) => q.question_id === "Q08")!.disposition,
    "Removed",
  );
  assert.equal(
    changes.find((q) => q.question_id === "Q11")!.disposition,
    "NewRequired",
  );
  assert.equal(
    changes.find((q) => q.question_id === "Q01")!.disposition,
    "LabelChanged",
  );
  assert.equal(Object.isFrozen(next.questions[0]), false);
  next.questions[0].label = "SYN later proposal retained independently";
  assert.equal(
    changes.find((q) => q.question_id === "Q01")!.next!.label,
    "Included proposed work",
  );
  assert.equal(
    discoveryDefinition.questions.find((q) => q.id === "Q06")!.unit,
    "Each",
  );
  assert.throws(() =>
    compileDiscovery({ ...fixture(), definition_revision: next.revision }),
  );
});

test("E2 alternative inheritance never copies confirmation or prices and membership changes identify affected confirmations", () => {
  const f = fixture(),
    original = compileDiscovery(f),
    source = randomUUID();
  const branch = inheritDiscovery(f, source, follow());
  assert.equal(branch.scope_readiness, "Incomplete");
  assert.ok(branch.input.answers.every((a) => a.state !== "Confirmed"));
  assert.equal(branch.copied_from.snapshot_id, source);
  assert.equal(branch.copied_from.content_hash, original.content_hash);
  assert.equal(compileDiscovery(f).content_hash, original.content_hash);
  const changed = fixture();
  changed.scope.equipment_ids = [randomUUID()];
  const comparison = compareDiscovery(f, changed);
  assert.ok(
    comparison.questions
      .filter((q) => q.proposed)
      .every((q) => q.requires_confirmation),
  );
  assert.equal("prices" in branch, false);
  assert.equal(branch.delivery_routing.status, "NotConfigured");
});

test("E2 rejects repeated or oversized fields without truncating accepted originals", () => {
  const f = fixture();
  f.answers.push(f.answers[0]);
  assert.throws(() => compileDiscovery(f));
  const oversized = fixture();
  change(oversized, "Q01", { value: "x".repeat(2001) });
  assert.throws(() => compileDiscovery(oversized));
  const payload = fixture();
  Object.assign(payload, { padding: "x".repeat(65536) });
  assert.throws(() => compileDiscovery(payload));
  const unsupported = fixture();
  unsupported.scope.unsupported_scope = follow();
  assert.equal(compileDiscovery(unsupported).scope_readiness, "Incomplete");
});

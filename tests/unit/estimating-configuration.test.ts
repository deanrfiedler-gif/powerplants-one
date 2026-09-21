import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { compileDiscovery } from "../../src/estimating/discovery";
import {
  configurationConfirmations,
  copyConfiguration,
} from "../../src/estimating/configuration";
import {
  configurationCounts,
  coverageLabel,
  filterSystems,
} from "../../src/estimating/configuration-definition";
import { compareSavedDiscovery } from "../../src/estimating/discovery-comparison";
import {
  createWorkspaceInput,
  discoveryChangeProposal,
} from "../../src/estimating/discovery-workspace-validation";
import { discoveryInput } from "../helpers/estimating-discovery";
import { structuredDiscovery } from "../helpers/estimating-configuration";
import { CRM, crmBase } from "../helpers/crm";
import { canonical } from "../../src/platform/operations";
import { costingInput } from "../../src/estimating/cost-basis-validation";
import { estimateInput } from "../helpers/estimating";
test("ES02-T46/T47/T51: four unique systems, three locations, two growing areas and two independent configuration findings", () => {
  const p = compileDiscovery(structuredDiscovery()),
    c = p.input.configuration!;
  assert.equal(p.scope_readiness, "Incomplete");
  assert.equal(p.findings!.length, 2);
  const counts = configurationCounts(c, p.findings);
  assert.equal(counts.systems, 4);
  assert.equal(counts.areas, 3);
  assert.equal(counts.growing_areas, 2);
  assert.equal(counts.to_confirm, 2);
  assert.deepEqual(Object.values(counts.families), [1, 1, 1, 0, 1, 0]);
  assert.equal(c.facts.find((f) => f.field === "RequiredZones")!.value, 8);
  assert.equal(
    c.facts.find((f) => f.field === "VerifiedCapacity")!.value,
    null,
  );
});
test("ES02-T56/T60/T68: legacy hash and tags stay unchanged; extended configuration cannot claim Complete through Q01–Q10 alone", () => {
  const old = discoveryInput(),
    p = compileDiscovery(old);
  assert.deepEqual(p.input, compileDiscovery(p.input).input);
  assert.equal(p.scope_readiness, "Complete");
  assert.ok(!Object.hasOwn(p.input, "configuration"));
  const input = structuredDiscovery(true);
  assert.equal(input.scope.systems.length, 1);
  assert.equal(compileDiscovery(input).scope_readiness, "Complete");
  input.configuration.facts = input.configuration.facts.filter(
    (f) => f.field !== "VerifiedCapacity",
  );
  assert.equal(compileDiscovery(input).scope_readiness, "Incomplete");
  assert.throws(() =>
    compileDiscovery({
      ...old,
      configuration: { ...input.configuration, schema_version: 2 },
    }),
  );
  assert.throws(() => compileDiscovery({ ...old, configuration: null }));
});
test("ES02-T16/T17/T66: coverage membership, duplicate IDs and incompatible units are refused without inventing references", () => {
  const i = structuredDiscovery();
  const edit = (f: (v: typeof i) => void) => {
    const v = structuredClone(i);
    f(v);
    assert.throws(() => compileDiscovery(v));
  };
  edit((v) => v.configuration.systems[0].coverage.area_ids.push(randomUUID()));
  edit((v) => v.configuration.areas.push(v.configuration.areas[0]));
  edit((v) => {
    v.configuration.facts.find((f) => f.field === "RequiredZones")!.unit =
      "Text";
  });
  edit((v) => {
    v.configuration.areas[0].facility_id = randomUUID();
  });
  edit((v) => {
    v.configuration.facts[0].system_id = randomUUID();
  });
  const network = i.configuration.systems.find(
    (s) => s.family === "Infrastructure",
  )!;
  assert.equal(coverageLabel(network, i.configuration.areas), "All areas");
  const original = [...network.coverage.area_ids];
  i.configuration.areas.push({
    ...i.configuration.areas[0],
    id: randomUUID(),
    label: "New area",
  });
  assert.notEqual(coverageLabel(network, i.configuration.areas), "All areas");
  assert.deepEqual(network.coverage.area_ids, original);
});
test("ES02-T48: combined filters do not mutate selected entities or global counts", () => {
  const v = structuredDiscovery().configuration,
    original = structuredClone(v);
  const rows = filterSystems(v, {
    family: "ControlsClimate",
    area: v.areas[0].id,
    search: "climate",
  });
  assert.equal(rows.length, 1);
  assert.equal(configurationCounts(v).systems, 4);
  assert.deepEqual(v, original);
  assert.equal(
    filterSystems(v, { family: "NurseryMachinery", area: "", search: "" })
      .length,
    0,
  );
});
test("ES02-T61/T67: copying remaps the whole child graph deterministically and keeps exact source lineage", () => {
  const i = structuredDiscovery(),
    source = randomUUID(),
    allocation = randomUUID(),
    follow = { owner_id: CRM.owner, reason: "Review copied configuration" };
  const a = copyConfiguration(i.configuration, source, allocation, follow),
    b = copyConfiguration(i.configuration, source, allocation, follow);
  assert.deepEqual(a, b);
  assert.notDeepEqual(
    a,
    copyConfiguration(i.configuration, source, randomUUID(), follow),
  );
  const copied = compileDiscovery({ ...i, configuration: a }).input
    .configuration!;
  assert.equal(
    copied.facts.some((f) => f.state === "Confirmed"),
    false,
  );
  assert.ok(
    copied.systems.every((s) =>
      s.coverage.area_ids.every((id) => copied.areas.some((a) => a.id === id)),
    ),
  );
  assert.ok(
    copied.facts.every((f) => copied.systems.some((s) => s.id === f.system_id)),
  );
  assert.ok(
    copied.follow_ups.every((f) =>
      copied.facts.some((v) => v.id === f.fact_id),
    ),
  );
  assert.ok(copied.areas.every((a) => a.lineage?.revision_id === source));
  assert.throws(() =>
    discoveryChangeProposal({
      kind: "Branch",
      branch_mode: "CopyDiscovery",
      option_id: randomUUID(),
      expected_version: 1,
      expected_revision_id: source,
      discovery: i,
      copy_follow_up: follow,
    }),
  );
});
test("ES02-T24: self comparison is empty, renames are changes and unrelated same-label systems never pair", () => {
  const i = structuredDiscovery(),
    a = {
      id: randomUUID(),
      option_id: randomUUID(),
      kind: "Discovery" as const,
      input: i,
    },
    b = { ...a, id: randomUUID(), input: structuredClone(i) };
  assert.deepEqual(compareSavedDiscovery(a, a), []);
  b.input.configuration.systems[0].name = "Renamed climate";
  assert.ok(
    compareSavedDiscovery(a, b).some(
      (d) => d.field === "name" && d.change === "Changed",
    ),
  );
  b.option_id = randomUUID();
  assert.ok(
    compareSavedDiscovery(a, b).some(
      (d) => d.entity === "systems" && d.change === "Added",
    ),
  );
  assert.ok(
    compareSavedDiscovery(a, b).some(
      (d) => d.entity === "systems" && d.change === "Removed",
    ),
  );
});
test("ES02-T68: review tokens bind value/unit/source/evidence and current context separately from question IDs", () => {
  const i = structuredDiscovery(true).configuration,
    original = structuredClone(i),
    h = "a".repeat(64);
  assert.equal(configurationConfirmations(i, original, h).length, 0);
  i.facts[0].value = "Changed requirement";
  const first = configurationConfirmations(i, original, h);
  assert.equal(first.length, 1);
  assert.notDeepEqual(
    first,
    configurationConfirmations(i, original, "b".repeat(64)),
  );
  i.evidence[0].note = "Different source observation";
  assert.ok(configurationConfirmations(i, original, h).length > 1);
});
test("ES02-T69: canonical whole request budget counts multibyte notes and envelope overhead", () => {
  const i = structuredDiscovery(true);
  const body = {
    ...crmBase(),
    id: randomUUID(),
    option_id: randomUUID(),
    revision_id: randomUUID(),
    opportunity_id: randomUUID(),
    expected_opportunity_version: 1,
    context_hash: "a".repeat(64),
    confirmed_question_ids: i.answers.map((a) => a.question_id),
    discovery: i,
  };
  assert.doesNotThrow(() => createWorkspaceInput(body));
  for (let n = 0; n < 70; n++)
    i.configuration.evidence.push({
      ...i.configuration.evidence[0],
      id: randomUUID(),
      observation: "界".repeat(1000),
    });
  assert.throws(
    () => createWorkspaceInput(body),
    (error: unknown) => (error as { code: string }).code === "InvalidData",
  );
});

test("ES02-T69: exactly 65,536 canonical UTF-8 bytes pass and one extra envelope byte fails", () => {
  const discovery = structuredDiscovery(true);
  const body = {
    ...crmBase(),
    id: randomUUID(),
    option_id: randomUUID(),
    revision_id: randomUUID(),
    opportunity_id: randomUUID(),
    expected_opportunity_version: 1,
    context_hash: "a".repeat(64),
    confirmed_question_ids: discovery.answers.map((a) => a.question_id),
    discovery,
  };
  const length = () => Buffer.byteLength(canonical(body), "utf8");
  const padding = [];
  while (length() < 65536) {
    const evidence = {
      ...discovery.configuration.evidence[0],
      id: randomUUID(),
      observation: "界" + "a".repeat(999),
      note: null,
    };
    discovery.configuration.evidence.push(evidence);
    padding.push(evidence);
  }
  for (const evidence of padding.reverse()) {
    const remove = Math.min(length() - 65536, evidence.observation.length - 1);
    evidence.observation = evidence.observation.slice(
      0,
      evidence.observation.length - remove,
    );
  }
  assert.equal(length(), 65536);
  assert.doesNotThrow(() => createWorkspaceInput(body));
  body.reason += "x";
  assert.equal(length(), 65537);
  assert.throws(
    () => createWorkspaceInput(body),
    (e: unknown) => (e as { code: string }).code === "InvalidData",
  );
});

test("ES02-T24/T61: a copied graph matches by exact lineage without false membership changes", () => {
  const input = structuredDiscovery(true),
    source = {
      id: randomUUID(),
      option_id: randomUUID(),
      kind: "Discovery" as const,
      input,
    };
  const configuration = copyConfiguration(
    input.configuration,
    source.id,
    randomUUID(),
    { owner_id: CRM.owner, reason: "Reconfirm the copy" },
  );
  const target = {
    ...source,
    id: randomUUID(),
    option_id: randomUUID(),
    input: { ...input, configuration },
  };
  const changes = compareSavedDiscovery(source, target);
  assert.ok(changes.some((d) => d.field === "state"));
  assert.ok(
    !changes.some((d) =>
      [
        "coverage",
        "area_ids",
        "system_ids",
        "system_id",
        "evidence_ids",
        "fact_id",
      ].includes(d.field),
    ),
    JSON.stringify(changes),
  );
  assert.ok(!changes.some((d) => ["Added", "Removed"].includes(d.change)));
});

test("ES02-T69: the costing envelope shares the exact UTF-8 boundary, including reason and basis expectations", () => {
  const e = estimateInput(randomUUID());
  const body = {
    ...crmBase(),
    estimate_id: randomUUID(),
    option_id: randomUUID(),
    revision_id: randomUUID(),
    expected_workspace_version: 1,
    expected_estimate_version: 0,
    context_hash: "a".repeat(64),
    title: e.title,
    scope: e.scope,
    policy: e.policy,
    lines: [] as ((typeof e.lines)[number] & { allowance: boolean })[],
  };
  const length = () => Buffer.byteLength(canonical(body), "utf8");
  while (length() < 65536)
    body.lines.push({
      ...e.lines[0],
      id: randomUUID(),
      source: "界" + "a".repeat(499),
      allowance: false,
    });
  for (const line of [...body.lines].reverse()) {
    const remove = Math.min(length() - 65536, line.source.length - 1);
    line.source = line.source.slice(0, line.source.length - remove);
  }
  assert.ok(body.lines.length <= 100);
  assert.equal(length(), 65536);
  assert.doesNotThrow(() => costingInput(randomUUID(), body));
  body.reason += "x";
  assert.equal(length(), 65537);
  assert.throws(() => costingInput(randomUUID(), body));
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import {
  equipmentCatalogue,
  equipmentCategories,
  equipmentCatalogueDefinition,
} from "../../src/estimating/equipment-catalogue";
import { compileDiscovery } from "../../src/estimating/discovery";
import {
  configurationConfirmations,
  copyConfiguration,
  requireConfigurationSuccessor,
} from "../../src/estimating/configuration";
import { configurationCounts } from "../../src/estimating/configuration-definition";
import { compareSavedDiscovery } from "../../src/estimating/discovery-comparison";
import { structuredDiscovery } from "../helpers/estimating-configuration";
import {
  catalogueDiscovery,
  classifySyntheticConfiguration,
} from "../helpers/estimating-catalogue";
import { CRM } from "../helpers/crm";

test("ES02-CAT-01: all 108 issued categories match Dean's source, in six families, with independent stable IDs", () => {
  const source = readFileSync(
    new URL("../../docs/decisions/es02-design-board.md", import.meta.url),
    "utf8",
  );
  const rows = [
    ...source.matchAll(
      /^\| (CLIMATE|CONTROLS|WATER|AUTOMATION|STRUCTURES|SERVICES) \| (\d+) \| (.*?) \|$/gm,
    ),
  ];
  assert.equal(rows.length, 6);
  assert.equal(equipmentCategories.length, 108);
  assert.equal(new Set(equipmentCategories.map((c) => c.id)).size, 108);
  assert.deepEqual(
    equipmentCatalogue.map((f) => f.categories.length),
    [17, 15, 20, 38, 7, 11],
  );
  for (const [i, row] of rows.entries()) {
    assert.equal(equipmentCatalogue[i].id.toUpperCase(), row[1]);
    assert.deepEqual(
      equipmentCatalogue[i].categories.map((c) => c.label),
      row[3].split("; "),
    );
  }
});

test("ES02-CAT-02: every valid pair roundtrips; wrong families, missing categories and mixed versions fail", () => {
  for (const category of equipmentCategories) {
    const d = catalogueDiscovery(true);
    d.configuration.systems[0].family = category.family;
    d.configuration.systems[0].category_id = category.id;
    const parsed = compileDiscovery(d);
    const saved = parsed.input.configuration!.systems.find(
      (s) => s.id === d.configuration.systems[0].id,
    )!;
    assert.equal(saved.category_id, category.id);
    assert.equal(parsed.scope_readiness, "Complete");
    d.configuration.systems[0].family =
      category.family === "Water" ? "Climate" : "Water";
    assert.throws(() => compileDiscovery(d));
  }
  const d = catalogueDiscovery(true);
  for (const bad of [
    undefined,
    null,
    "unknown",
    "Priva Compass",
    "controls-priva-compass ",
  ]) {
    const x = structuredClone(d) as unknown as {
      configuration: { systems: Record<string, unknown>[] };
    };
    x.configuration.systems[0].category_id = bad;
    assert.throws(() => compileDiscovery(x));
  }
  for (const [schema_version, definition_id] of [
    [1, equipmentCatalogueDefinition],
    [2, "PPO-ES02-CONFIG-r01"],
    [3, equipmentCatalogueDefinition],
    ["2", equipmentCatalogueDefinition],
  ])
    assert.throws(() =>
      compileDiscovery({
        ...d,
        configuration: { ...d.configuration, schema_version, definition_id },
      }),
    );
  const old = structuredDiscovery(true);
  old.configuration.systems[0].category_id = "controls-priva-compass";
  assert.throws(() => compileDiscovery(old));
  const shared = d.configuration.systems.find(
    (s) => s.family === "Infrastructure",
  )!;
  delete shared.category_id;
  assert.throws(() => compileDiscovery(d));
});

test("ES02-CAT-03: reclassification preserves incomplete evidence, invalidates confirmations and records exact differences", () => {
  const old = compileDiscovery(structuredDiscovery()).input;
  const next = {
    ...old,
    configuration: classifySyntheticConfiguration(old.configuration!),
  };
  requireConfigurationSuccessor(old.configuration, next.configuration);
  const parsed = compileDiscovery(next);
  assert.equal(parsed.scope_readiness, "Incomplete");
  assert.equal(
    configurationCounts(parsed.input.configuration!, parsed.findings).families
      .Controls,
    2,
  );
  assert.equal(
    configurationCounts(old.configuration!).families.ControlsClimate,
    1,
  );
  const confirmations = configurationConfirmations(
    next.configuration,
    old.configuration,
    "context",
  );
  assert.ok(confirmations.length > 0);
  const changed = structuredClone(next.configuration);
  changed.systems[0].category_id = "controls-priva-connext";
  assert.notDeepEqual(
    configurationConfirmations(changed, old.configuration, "context"),
    confirmations,
  );
  const option_id = randomUUID();
  const diff = compareSavedDiscovery(
    { id: randomUUID(), option_id, kind: "Discovery", input: old },
    { id: randomUUID(), option_id, kind: "Discovery", input: next },
  );
  assert.ok(
    diff.some(
      (d) => d.entity === "configuration" && d.field === "definition_id",
    ),
  );
  assert.ok(
    diff.some((d) => d.entity === "systems" && d.field === "category_id"),
  );
  next.configuration.facts = next.configuration.facts.filter(
    (f) => f.field !== "VerifiedCapacity",
  );
  assert.throws(() =>
    requireConfigurationSuccessor(old.configuration, next.configuration),
  );
  assert.throws(() =>
    requireConfigurationSuccessor(changed, old.configuration),
  );
});

test("ES02-CAT-04: copies retain classification and lineage, require reconfirmation and keep deterministic original IDs", () => {
  for (const input of [structuredDiscovery(true), catalogueDiscovery(true)]) {
    const c = compileDiscovery(input).input.configuration!,
      source = randomUUID(),
      allocation = randomUUID();
    const copy = () =>
      copyConfiguration(c, source, allocation, {
        owner_id: CRM.owner,
        reason: "Review synthetic copied scope",
      });
    assert.deepEqual(copy(), copy());
    const parsed = compileDiscovery({ ...input, configuration: copy() });
    assert.equal(parsed.scope_readiness, "Incomplete");
    assert.equal(parsed.input.configuration!.definition_id, c.definition_id);
    for (const s of parsed.input.configuration!.systems) {
      const original = c.systems.find((o) => o.id === s.lineage!.entity_id)!;
      assert.notEqual(s.id, original.id);
      assert.equal(s.category_id, original.category_id);
      assert.equal(s.family, original.family);
    }
  }
});

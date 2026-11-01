import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import {
  moduleIntegrationFiles,
  moduleIntegrations,
  uiBaselinesPath,
} from "../helpers/ui-baselines";

// Size of module_integrations when integrations moved to one file each; corrections in place still pass.
const frozen = 66;
const fields = [
  "id",
  "route",
  "scope",
  "layout",
  "design",
  "sha256",
  "shared_design",
  "shared_sha256",
  "component_proof",
  "application_proof",
  "authority",
  "adaptations",
];

test("ui-baselines.json keeps its module integrations frozen; new ones are files", () => {
  const shared = JSON.parse(readFileSync(uiBaselinesPath, "utf8"))
    .module_integrations as unknown[];
  assert(
    shared.length <= frozen,
    `module_integrations holds ${shared.length} entries, more than the ${frozen} it is frozen at; add a file in docs/standards/ui-baselines/module-integrations/ instead`,
  );
});

test("each module integration file is named by its id and complete; ids are unique", () => {
  for (const path of moduleIntegrationFiles()) {
    const entry = JSON.parse(readFileSync(path, "utf8"));
    assert.equal(basename(path), entry.id + ".json", path);
    for (const field of fields)
      assert(
        typeof entry[field] === "string" && entry[field],
        `${path}: ${field} is required`,
      );
    assert.match(entry.sha256, /^[0-9a-f]{64}$/, path);
    assert.match(entry.shared_sha256, /^[0-9a-f]{64}$/, path);
  }
  const ids = moduleIntegrations().map((entry) => entry.id);
  assert.equal(
    new Set(ids).size,
    ids.length,
    "Duplicate module integration id",
  );
});

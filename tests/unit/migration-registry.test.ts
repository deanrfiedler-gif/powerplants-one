import assert from "node:assert/strict";
import { test } from "node:test";
import { readdir } from "node:fs/promises";
import {
  migrationFiles,
  seedFiles,
  latestMigrationVersion,
  validateMigrationRegistry,
} from "../../scripts/migration-registry";

test("every forward SQL migration is registered exactly once; recovery is not a forward migration", async () => {
  const files = (
    await readdir(new URL("../../db/migrations/", import.meta.url))
  )
    .filter((file) => file.endsWith(".sql") && file !== "0001-recover.sql")
    .sort();
  assert.deepEqual([...migrationFiles], files);
  validateMigrationRegistry(migrationFiles, seedFiles);
  assert.equal(
    Number(migrationFiles.at(-1)!.slice(0, 4)),
    latestMigrationVersion,
  );
});

test("duplicate migration or seed versions fail before SQL dispatch; reserved gaps remain valid", () => {
  assert.throws(
    () =>
      validateMigrationRegistry(
        ["0018-crm-leads.sql", "0018-projects-gantt.sql"],
        [],
      ),
    /unique and increasing/,
  );
  assert.throws(
    () =>
      validateMigrationRegistry(
        ["0018-crm-leads.sql"],
        [
          [18, "seed-crm-leads.sql"],
          [18, "seed-projects-gantt.sql"],
        ],
      ),
    /Seed versions/,
  );
  assert.throws(
    () =>
      validateMigrationRegistry(
        ["0018-crm-leads.sql"],
        [[19, "seed-projects-gantt.sql"]],
      ),
    /Seed versions/,
  );
  assert.throws(
    () =>
      validateMigrationRegistry(
        ["0019-projects-gantt.sql", "0018-crm-leads.sql"],
        [],
      ),
    /unique and increasing/,
  );
  assert.doesNotThrow(() =>
    validateMigrationRegistry(
      ["0015-email-calendar.sql", "0017-crm-ui-refinements.sql"],
      [],
    ),
  );
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  migrationFiles,
  seedFiles,
  latestMigrationVersion,
  validateMigrationRegistry,
  existingLocalChecksumMatches,
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

test("local checksum compatibility preserves exact encodings and refuses content changes or misplaced exceptions", async () => {
  const sql = (
    await readFile(
      new URL(
        "../../db/migrations/0036-acceptance-command-recovery.sql",
        import.meta.url,
      ),
      "utf8",
    )
  ).replace(/\r\n/g, "\n");
  const digest = (value: string) =>
    createHash("sha256").update(value).digest("hex");
  const recovered = sql.slice(0, -1) + "\r\n";
  assert.equal(
    digest(recovered),
    "46018e6ce64637a81ba16e66bf9b48bfed60f29d6b06f5192e18d3d6fa173693",
  );
  for (const bytes of [sql, sql.replace(/\n/g, "\r\n"), recovered]) {
    assert(existingLocalChecksumMatches(36, sql, digest(bytes)));
    assert(
      !existingLocalChecksumMatches(36, sql + "-- changed", digest(bytes)),
    );
  }
  assert(!existingLocalChecksumMatches(35, sql, digest(recovered)));
  assert(!existingLocalChecksumMatches(36, sql, "unrecognised"));
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

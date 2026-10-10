import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { LocalSyntheticDocumentStore, digest } from "../../src/documents/store";
import {
  families,
  controlledOutput,
  selectTemplate,
  jobRow,
  storedOutput,
  exactOutput,
  finalisationEffects,
  businessRow,
  assertNotIssued,
  assertOneIssue,
  evidence,
} from "../helpers/controlled-outputs";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database required");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

for (const family of families) {
  test(`PT-23 ${family}: failed storage, corrupt bundle, SQL rollback and original concurrent recovery`, async () => {
    const q = await controlledOutput(family);
    const intent = await jobRow(q);
    const before = await businessRow(q);
    const store = LocalSyntheticDocumentStore.prototype.store;
    let injected = 0;
    LocalSyntheticDocumentStore.prototype.store = async function (
      ctx,
      bytes,
      hash,
    ) {
      if (ctx.operation_id === q.job.id) {
        injected++;
        throw Error("SYN PT-23 injected storage outage before durable bytes");
      }
      return store.call(this, ctx, bytes, hash);
    };
    try {
      assert.equal("state" in (await q.process()), true);
    } finally {
      LocalSyntheticDocumentStore.prototype.store = store;
    }
    assert.equal(injected, 1);
    assert.equal((await jobRow(q)).state, "Failed");
    assert.equal(await storedOutput(q), null);
    await assertNotIssued(q);
    assert.deepEqual(await businessRow(q), before);
    await evidence("storage-failed", q);

    // Only this test's exact operation file is eligible for corruption. Restore
    // the original even when unchanged application code wrongly issues it.
    const root = resolve(
      process.env.PPO_DOCUMENT_DIRECTORY ??
        join(homedir(), ".ppo-synthetic-documents"),
    );
    assert.match(q.job.id, /^[a-f0-9-]{36}$/);
    const path = resolve(root, q.p.workspace_id, q.job.id),
      rel = relative(root, path);
    assert.ok(rel && !rel.startsWith("..") && !isAbsolute(rel));
    const captured: { bundle: Awaited<ReturnType<typeof storedOutput>> } = {
      bundle: null,
    };
    try {
      await q.process({
        beforeFinalise: async () => {
          captured.bundle = await storedOutput(q);
          assert.ok(captured.bundle);
          await writeFile(
            path,
            "SYN PT-23 wrong durable version before finalisation",
          );
        },
      });
      await evidence("corrupt-before-release", q);
    } finally {
      if (captured.bundle) await writeFile(path, captured.bundle.bytes);
    }
    assert.ok(captured.bundle);
    await assertNotIssued(q);
    assert.equal((await jobRow(q)).state, "Failed");
    assert.deepEqual(await businessRow(q), before);

    // Fail inside recordOperation, after the issue, recipients/presentation and
    // business-state writes. The transaction must undo all of those effects.
    await database()
      .query(`CREATE FUNCTION ppo.pt23_reject_finalisation() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.operation_id='${intent.finalisation_operation_id}'::uuid THEN
        RAISE EXCEPTION 'SYN PT-23 injected finalisation rollback'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER pt23_reject_finalisation BEFORE INSERT ON ppo.audit_events FOR EACH ROW EXECUTE FUNCTION ppo.pt23_reject_finalisation()`);
    try {
      await q.process();
    } finally {
      await database().query(
        "DROP TRIGGER pt23_reject_finalisation ON ppo.audit_events; DROP FUNCTION ppo.pt23_reject_finalisation()",
      );
    }
    assert.equal((await jobRow(q)).state, "Failed");
    const durable = await storedOutput(q);
    assert.ok(durable);
    assert.deepEqual(durable, captured.bundle);
    await assertNotIssued(q);
    assert.deepEqual(await businessRow(q), before);
    await evidence("finalisation-rolled-back", q);

    let regenerated = 0;
    await Promise.all([
      q.process({
        afterRender: async () => {
          regenerated++;
          throw Error("Original bundle must be recovered");
        },
      }),
      q.process(),
    ]);
    assert.equal(regenerated, 0);
    assert.deepEqual(
      await storedOutput(q),
      durable,
      "Retry uses exact original storage result",
    );
    assert.equal((await jobRow(q)).attempts, 4);
    const effects = await assertOneIssue(q),
      output = await exactOutput(q);
    assert.equal(output.issue.manifest.store_key.sha256, durable.key.sha256);
    await q.process();
    await q.process();
    assert.deepEqual(
      await finalisationEffects(q),
      effects,
      "Late duplicate worker creates no new effects",
    );
    assert.equal((await jobRow(q)).input_hash, intent.input_hash);
    assert.deepEqual((await jobRow(q)).render_snapshot, intent.render_snapshot);
    await evidence("recovered", q, {
      original_bundle_sha256: digest(durable.bytes),
      regenerated,
    });
  });

  for (const change of ["source", "template", "renderer"] as const) {
    test(`PT-23 ${family}: ${change} change during generation retains original output without release`, async () => {
      if (change === "template") await selectTemplate(family, 1);
      const q = await controlledOutput(family),
        original = await jobRow(q);
      const path = "src/documents/p11-render.ts",
        code = await readFile(path);
      try {
        await q.process({
          afterRender: async () => {
            if (change === "source") await q.changeSource();
            if (change === "template") await selectTemplate(family, 2);
            if (change === "renderer")
              await writeFile(
                path,
                Buffer.concat([
                  code,
                  Buffer.from(
                    "\n// SYN PT-23 changed renderer during generation\n",
                  ),
                ]),
              );
          },
        });
      } finally {
        if (change === "renderer") await writeFile(path, code);
      }
      const job = await jobRow(q),
        stored = await storedOutput(q);
      assert.ok(
        stored,
        "Stale original is retained for the named recovery owner",
      );
      await evidence(`${change}-changed`, q);
      await assertNotIssued(q);
      assert.ok(["StaleSource", "Failed"].includes(job.state));
      assert.equal(
        job.error_code,
        change === "renderer"
          ? "TemplateUnavailable"
          : change === "source" && family === "finance"
            ? "SourceChanged"
            : "StaleSource",
      );
      assert.deepEqual(job.render_snapshot, original.render_snapshot);
      assert.equal(job.input_hash, original.input_hash);
      assert.ok(job.output_manifest);
      // Restoring source code cannot turn a stale template observation into a
      // reviewed release. Policy/source changes remain in force on retry.
      await q.process();
      await evidence(`${change}-retry`, q);
      await assertNotIssued(q);
      assert.deepEqual(await storedOutput(q), stored);
    });
  }
}

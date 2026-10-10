import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { LocalSyntheticDocumentStore, digest } from "../../src/documents/store";
import { rows } from "../helpers/packs";
import {
  families,
  controlledOutput,
  selectTemplate,
  jobRow,
  storedOutput,
  exactOutput,
  finalisationEffects,
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
  test(`PT-23 ${family}: store failure, real finalisation rollback and original concurrent recovery`, async () => {
    const q = await controlledOutput(family);
    const intent = await jobRow(q);
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
    await evidence("storage-failed", q);

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
    await assertNotIssued(q);
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
    assert.equal((await jobRow(q)).attempts, 3);
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
      await assertNotIssued(q);
      assert.ok(["StaleSource", "Failed"].includes(job.state));
      assert.deepEqual(job.render_snapshot, original.render_snapshot);
      assert.equal(job.input_hash, original.input_hash);
      assert.ok(job.output_manifest);
      // Restoring source code cannot turn a stale template observation into a
      // reviewed release. Policy/source changes remain in force on retry.
      await q.process();
      await assertNotIssued(q);
      assert.deepEqual(await storedOutput(q), stored);
      await evidence(`${change}-changed`, q);
    });
  }

  test(`PT-23 ${family}: retained v1 issue survives v2 selection and original request recovery`, async () => {
    await selectTemplate(family, 1);
    const q = await controlledOutput(family);
    await q.process();
    const original = await exactOutput(q),
      effects = await assertOneIssue(q);
    assert.equal(original.issue.manifest.template.version, 1);
    const templates = await rows(
      `SELECT * FROM ppo.${family}_templates ORDER BY version`,
    );
    await selectTemplate(family, 2);
    await q.process();
    assert.deepEqual(await exactOutput(q), original);
    assert.deepEqual(await finalisationEffects(q), effects);
    assert.deepEqual(
      await rows(`SELECT * FROM ppo.${family}_templates ORDER BY version`),
      templates,
    );
    assert.deepEqual((await q.replay()).receipt, q.receipt);
    await evidence("v1-preserved", q);
  });

  test(`PT-23 ${family}: damaged durable bytes just before finalisation cannot be issued`, async () => {
    const q = await controlledOutput(family);
    let original: Awaited<ReturnType<typeof storedOutput>>;
    const root = process.env.PPO_DOCUMENT_DIRECTORY;
    // Use the adapter rather than touching an arbitrary filesystem path.
    const read = LocalSyntheticDocumentStore.prototype.read;
    let damaged = false,
      refused = 0;
    LocalSyntheticDocumentStore.prototype.read = async function (ctx, key) {
      if (damaged && key.item_id === q.job.id) {
        refused++;
        throw Error("SYN exact durable version unavailable");
      }
      return read.call(this, ctx, key);
    };
    try {
      await q.process({
        beforeFinalise: async () => {
          original = await storedOutput(q);
          damaged = true;
        },
      });
    } finally {
      LocalSyntheticDocumentStore.prototype.read = read;
    }
    assert.ok(
      refused > 0,
      "Final release must re-read the exact durable bundle",
    );
    await assertNotIssued(q);
    await evidence("unavailable-before-release", q, { refused });
    await q.process();
    await assertOneIssue(q);
    assert.deepEqual(await storedOutput(q), original!);
    // Keep task-owned store files outside Git; no raw path enters evidence.
    if (root)
      assert.ok(
        !join(root, q.p.workspace_id, q.job.id).startsWith(process.cwd()),
      );
  });
}
